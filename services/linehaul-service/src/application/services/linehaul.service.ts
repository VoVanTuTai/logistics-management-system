import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  AddTripManifestInput,
  ArriveTripInput,
  AssignVehicleInput,
  CreateDriverInput,
  CreateHandoverInput,
  CreateTripInput,
  CreateVehicleInput,
  DepartTripInput,
  Driver,
  LinehaulHandover,
  LinehaulIncident,
  LinehaulSeal,
  LinehaulTrip,
  LinehaulTripManifest,
  ListTripFilters,
  ReceiveManifestInput,
  RecordSealInput,
  SealTripInput,
  ReportIncidentInput,
  SealDirection,
  TripStatus,
  Vehicle,
} from '../../domain/entities/linehaul.entity';
import {
  DRIVER_STATUSES,
  TRIP_STATUSES,
  VEHICLE_STATUSES,
} from '../../domain/entities/linehaul.entity';
import { LinehaulRepository } from '../../domain/repositories/linehaul.repository';
import { LinehaulEventsPublisher } from '../../messaging/linehaul-events.publisher';

@Injectable()
export class LinehaulService {
  constructor(
    @Inject(LinehaulRepository)
    private readonly linehaulRepository: LinehaulRepository,
    private readonly linehaulEventsPublisher: LinehaulEventsPublisher,
  ) {}

  listVehicles(): Promise<Vehicle[]> {
    return this.linehaulRepository.listVehicles();
  }

  createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
    return this.linehaulRepository.createVehicle({
      vehicleCode: this.requireCode(input.vehicleCode, 'vehicleCode'),
      licensePlate: this.requireCode(input.licensePlate, 'licensePlate'),
      vehicleType: this.normalizeOptionalText(input.vehicleType),
      capacityKg: input.capacityKg ?? null,
      status: this.normalizeVehicleStatus(input.status),
      note: this.normalizeOptionalText(input.note),
    });
  }

  listDrivers(): Promise<Driver[]> {
    return this.linehaulRepository.listDrivers();
  }

  createDriver(input: CreateDriverInput): Promise<Driver> {
    return this.linehaulRepository.createDriver({
      driverCode: this.requireCode(input.driverCode, 'driverCode'),
      userId: this.normalizeOptionalText(input.userId),
      fullName: this.requireText(input.fullName, 'fullName'),
      phone: this.normalizeOptionalText(input.phone),
      licenseNo: this.normalizeOptionalText(input.licenseNo),
      status: this.normalizeDriverStatus(input.status),
      note: this.normalizeOptionalText(input.note),
    });
  }

  listTrips(query: {
    status?: string;
    originHubCode?: string;
    destinationHubCode?: string;
    vehicleId?: string;
    driverId?: string;
    manifestCode?: string;
  }): Promise<LinehaulTrip[]> {
    const filters: ListTripFilters = {
      status: this.normalizeTripStatus(query.status),
      originHubCode: this.normalizeOptionalCode(query.originHubCode) ?? undefined,
      destinationHubCode: this.normalizeOptionalCode(query.destinationHubCode) ?? undefined,
      vehicleId: this.normalizeOptionalText(query.vehicleId) ?? undefined,
      driverId: this.normalizeOptionalText(query.driverId) ?? undefined,
      manifestCode: this.normalizeOptionalCode(query.manifestCode) ?? undefined,
    };

    return this.linehaulRepository.listTrips(filters);
  }

  async getTripById(id: string): Promise<LinehaulTrip> {
    const trip = await this.linehaulRepository.findTripById(id);

    if (!trip) {
      throw new NotFoundException(`Linehaul trip "${id}" was not found.`);
    }

    return trip;
  }

  async createTrip(input: CreateTripInput): Promise<LinehaulTrip> {
    const originHubCode = this.requireCode(input.originHubCode, 'originHubCode');
    const destinationHubCode = this.requireCode(
      input.destinationHubCode,
      'destinationHubCode',
    );

    if (originHubCode === destinationHubCode) {
      throw new BadRequestException('originHubCode and destinationHubCode must be different.');
    }

    await this.ensureVehicleExists(input.vehicleId);
    await this.ensureDriverExists(input.driverId);

    const trip = await this.linehaulRepository.createTrip({
      tripCode: this.normalizeOptionalCode(input.tripCode) ?? this.generateTripCode(originHubCode, destinationHubCode),
      originHubCode,
      destinationHubCode,
      vehicleId: this.normalizeOptionalText(input.vehicleId),
      driverId: this.normalizeOptionalText(input.driverId),
      plannedDepartAt: input.plannedDepartAt ?? null,
      plannedArriveAt: input.plannedArriveAt ?? null,
      note: this.normalizeOptionalText(input.note),
      createdBy: this.normalizeOptionalText(input.createdBy),
    });

    await this.linehaulEventsPublisher.publish({
      eventType: 'linehaul.trip_created',
      trip,
      aggregateKey: `${trip.id}:created`,
      actor: trip.createdBy,
    });

    return trip;
  }

  async assignVehicle(id: string, input: AssignVehicleInput): Promise<LinehaulTrip> {
    const trip = await this.getTripById(id);
    this.ensureTripNotTerminal(trip);
    await this.ensureVehicleExists(input.vehicleId);
    await this.ensureDriverExists(input.driverId);

    const updatedTrip = await this.linehaulRepository.assignVehicle(id, {
      vehicleId: this.normalizeOptionalText(input.vehicleId),
      driverId: this.normalizeOptionalText(input.driverId),
      note: this.normalizeOptionalText(input.note),
    });

    await this.linehaulEventsPublisher.publish({
      eventType: 'linehaul.vehicle_assigned',
      trip: updatedTrip,
      aggregateKey: `${updatedTrip.id}:vehicle-assigned`,
      extraData: {
        assignment: {
          vehicleId: updatedTrip.vehicleId,
          driverId: updatedTrip.driverId,
          note: this.normalizeOptionalText(input.note),
        },
      },
    });

    return updatedTrip;
  }

  async addManifest(
    id: string,
    input: AddTripManifestInput,
  ): Promise<LinehaulTripManifest> {
    const trip = await this.getTripById(id);
    this.ensureTripCanLoad(trip);

    const manifest = await this.linehaulRepository.addManifest(id, {
      manifestId: this.normalizeOptionalText(input.manifestId),
      manifestCode: this.requireCode(input.manifestCode, 'manifestCode'),
      loadedBy: this.normalizeOptionalText(input.loadedBy),
      note: this.normalizeOptionalText(input.note),
    });

    if (trip.status === 'PLANNED') {
      await this.linehaulRepository.updateTripStatus(id, 'LOADING');
    }

    const updatedTrip = await this.getTripById(id);
    await this.linehaulEventsPublisher.publish({
      eventType: 'linehaul.manifest_loaded',
      trip: updatedTrip,
      aggregateKey: `${updatedTrip.id}:manifest-loaded:${manifest.id}`,
      actor: manifest.loadedBy,
      manifest,
      locationCode: updatedTrip.originHubCode,
    });

    return manifest;
  }

  async recordSeal(id: string, input: RecordSealInput): Promise<LinehaulSeal> {
    const trip = await this.getTripById(id);

    const seal = await this.linehaulRepository.recordSeal(id, {
      sealCode: this.requireCode(input.sealCode, 'sealCode'),
      direction: this.requireSealDirection(input.direction),
      scannedAt: input.scannedAt ?? null,
      scannedBy: this.normalizeOptionalText(input.scannedBy),
      photoUrl: this.normalizeOptionalText(input.photoUrl),
      note: this.normalizeOptionalText(input.note),
    });

    await this.linehaulEventsPublisher.publish({
      eventType: 'linehaul.vehicle_sealed',
      trip,
      aggregateKey: `${trip.id}:seal:${seal.id}`,
      actor: seal.scannedBy,
      seal,
      locationCode:
        seal.direction === 'INBOUND'
          ? trip.destinationHubCode
          : trip.originHubCode,
    });

    return seal;
  }

  async depart(id: string, input: DepartTripInput): Promise<LinehaulTrip> {
    const trip = await this.getTripById(id);
    this.ensureTripCanDepart(trip);

    if (!trip.vehicleId || !trip.driverId) {
      throw new BadRequestException('Trip must have vehicle and driver before departure.');
    }

    if (!trip.manifests || trip.manifests.length === 0) {
      throw new BadRequestException('Trip must have at least one manifest before departure.');
    }

    for (const sealCode of this.normalizeCodeList(input.sealCodes)) {
      await this.recordSeal(id, {
        sealCode,
        direction: 'OUTBOUND',
        scannedBy: input.departedBy ?? null,
        note: input.note ?? null,
      });
    }

    const updatedTrip = await this.linehaulRepository.updateTripStatus(id, 'DEPARTED', {
      actualDepartAt: this.parseDate(input.actualDepartAt) ?? new Date(),
      note: this.normalizeOptionalText(input.note) ?? trip.note,
    });

    await this.linehaulEventsPublisher.publish({
      eventType: 'linehaul.departed',
      trip: updatedTrip,
      aggregateKey: `${updatedTrip.id}:departed`,
      actor: this.normalizeOptionalText(input.departedBy),
      locationCode: updatedTrip.originHubCode,
      extraData: {
        departure: {
          sealCodes: this.normalizeCodeList(input.sealCodes),
          note: this.normalizeOptionalText(input.note),
        },
      },
    });

    return updatedTrip;
  }

  async seal(id: string, input: SealTripInput): Promise<LinehaulTrip> {
    const trip = await this.getTripById(id);
    this.ensureTripCanDepart(trip);

    if (!trip.vehicleId || !trip.driverId) {
      throw new BadRequestException('Trip must have vehicle and driver before vehicle seal.');
    }

    if (!trip.manifests || trip.manifests.length === 0) {
      throw new BadRequestException('Trip must have at least one manifest before vehicle seal.');
    }

    const sealCodes = this.normalizeCodeList(input.sealCodes);
    if (sealCodes.length === 0) {
      throw new BadRequestException('sealCodes must include at least one code.');
    }

    for (const sealCode of sealCodes) {
      await this.recordSeal(id, {
        sealCode,
        direction: 'OUTBOUND',
        scannedBy: input.sealedBy ?? null,
        note: input.note ?? null,
      });
    }

    return this.linehaulRepository.updateTripStatus(id, 'SEALED', {
      note: this.normalizeOptionalText(input.note) ?? trip.note,
    });
  }

  async arrive(id: string, input: ArriveTripInput): Promise<LinehaulTrip> {
    const trip = await this.getTripById(id);
    this.ensureTripCanArrive(trip);

    for (const sealCode of this.normalizeCodeList(input.sealCodes)) {
      await this.recordSeal(id, {
        sealCode,
        direction: 'INBOUND',
        scannedBy: input.arrivedBy ?? null,
        note: input.note ?? null,
      });
    }

    const updatedTrip = await this.linehaulRepository.updateTripStatus(id, 'ARRIVED', {
      actualArriveAt: this.parseDate(input.actualArriveAt) ?? new Date(),
      note: this.normalizeOptionalText(input.note) ?? trip.note,
    });

    await this.linehaulEventsPublisher.publish({
      eventType: 'linehaul.arrived',
      trip: updatedTrip,
      aggregateKey: `${updatedTrip.id}:arrived`,
      actor: this.normalizeOptionalText(input.arrivedBy),
      locationCode: updatedTrip.destinationHubCode,
      extraData: {
        arrival: {
          sealCodes: this.normalizeCodeList(input.sealCodes),
          note: this.normalizeOptionalText(input.note),
        },
      },
    });

    return updatedTrip;
  }

  async receiveManifest(
    id: string,
    input: ReceiveManifestInput,
  ): Promise<LinehaulTripManifest> {
    const trip = await this.getTripById(id);
    if (!['ARRIVED', 'RECEIVING'].includes(trip.status)) {
      throw new BadRequestException('Trip must be ARRIVED or RECEIVING before receiving manifests.');
    }

    const manifest = await this.linehaulRepository.unloadManifest(
      id,
      this.requireCode(input.manifestCode, 'manifestCode'),
      {
        unloadedBy: this.normalizeOptionalText(input.unloadedBy),
        note: this.normalizeOptionalText(input.note),
      },
    );

    if (trip.status === 'ARRIVED') {
      await this.linehaulRepository.updateTripStatus(id, 'RECEIVING');
    }

    const updatedTrip = await this.getTripById(id);
    await this.linehaulEventsPublisher.publish({
      eventType: 'linehaul.manifest_received',
      trip: updatedTrip,
      aggregateKey: `${updatedTrip.id}:manifest-received:${manifest.id}`,
      actor: manifest.unloadedBy,
      manifest,
      locationCode: updatedTrip.destinationHubCode,
    });

    return manifest;
  }

  async complete(id: string): Promise<LinehaulTrip> {
    const trip = await this.getTripById(id);
    if (!['ARRIVED', 'RECEIVING'].includes(trip.status)) {
      throw new BadRequestException('Trip must be ARRIVED or RECEIVING before completion.');
    }

    const openManifestCount = (trip.manifests ?? []).filter(
      (manifest) => manifest.status !== 'UNLOADED',
    ).length;
    if (openManifestCount > 0) {
      throw new BadRequestException('All manifests must be received before trip completion.');
    }

    const updatedTrip = await this.linehaulRepository.updateTripStatus(id, 'COMPLETED', {
      completedAt: new Date(),
    });

    await this.linehaulEventsPublisher.publish({
      eventType: 'linehaul.completed',
      trip: updatedTrip,
      aggregateKey: `${updatedTrip.id}:completed`,
      locationCode: updatedTrip.destinationHubCode,
    });

    return updatedTrip;
  }

  async cancel(id: string, input: { note?: string | null }): Promise<LinehaulTrip> {
    const trip = await this.getTripById(id);
    this.ensureTripNotTerminal(trip);

    const updatedTrip = await this.linehaulRepository.updateTripStatus(id, 'CANCELLED', {
      cancelledAt: new Date(),
      note: this.normalizeOptionalText(input.note) ?? trip.note,
    });

    await this.linehaulEventsPublisher.publish({
      eventType: 'linehaul.cancelled',
      trip: updatedTrip,
      aggregateKey: `${updatedTrip.id}:cancelled`,
      extraData: {
        cancellation: {
          note: this.normalizeOptionalText(input.note),
        },
      },
    });

    return updatedTrip;
  }

  async reportIncident(
    id: string,
    input: ReportIncidentInput,
  ): Promise<LinehaulIncident> {
    const trip = await this.getTripById(id);
    this.ensureTripNotTerminal(trip);

    const incident = await this.linehaulRepository.reportIncident(id, {
      incidentType: this.requireCode(input.incidentType, 'incidentType'),
      severity: this.normalizeOptionalText(input.severity),
      description: this.requireText(input.description, 'description'),
      photoUrls: Array.isArray(input.photoUrls) ? input.photoUrls : null,
      reportedBy: this.normalizeOptionalText(input.reportedBy),
    });

    const updatedTrip = await this.linehaulRepository.updateTripStatus(id, 'INCIDENT_REPORTED');
    await this.linehaulEventsPublisher.publish({
      eventType: 'linehaul.incident_reported',
      trip: updatedTrip,
      aggregateKey: `${updatedTrip.id}:incident:${incident.id}`,
      actor: incident.reportedBy,
      incident,
      locationCode:
        trip.status === 'ARRIVED' || trip.status === 'RECEIVING'
          ? trip.destinationHubCode
          : trip.originHubCode,
    });

    return incident;
  }

  async createHandover(
    id: string,
    input: CreateHandoverInput,
  ): Promise<LinehaulHandover> {
    const trip = await this.getTripById(id);

    const handover = await this.linehaulRepository.createHandover(id, {
      hubCode: this.requireCode(input.hubCode, 'hubCode'),
      fromUser: this.normalizeOptionalText(input.fromUser),
      toUser: this.normalizeOptionalText(input.toUser),
      note: this.normalizeOptionalText(input.note),
      signedAt: input.signedAt ?? null,
      signatureUrl: this.normalizeOptionalText(input.signatureUrl),
    });

    await this.linehaulEventsPublisher.publish({
      eventType: 'linehaul.handover_signed',
      trip,
      aggregateKey: `${trip.id}:handover:${handover.id}`,
      actor: handover.toUser ?? handover.fromUser,
      handover,
      locationCode: handover.hubCode,
    });

    return handover;
  }

  private ensureTripCanLoad(trip: LinehaulTrip): void {
    if (!['PLANNED', 'LOADING'].includes(trip.status)) {
      throw new BadRequestException(`Trip "${trip.tripCode}" cannot load manifest in ${trip.status}.`);
    }
  }

  private ensureTripCanDepart(trip: LinehaulTrip): void {
    if (!['PLANNED', 'LOADING', 'SEALED'].includes(trip.status)) {
      throw new BadRequestException(`Trip "${trip.tripCode}" cannot depart in ${trip.status}.`);
    }
  }

  private ensureTripCanArrive(trip: LinehaulTrip): void {
    if (trip.status !== 'DEPARTED') {
      throw new BadRequestException(`Trip "${trip.tripCode}" must be DEPARTED before arrival.`);
    }
  }

  private ensureTripNotTerminal(trip: LinehaulTrip): void {
    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      throw new BadRequestException(`Trip "${trip.tripCode}" is terminal with ${trip.status}.`);
    }
  }

  private async ensureVehicleExists(id: string | null | undefined): Promise<void> {
    const normalizedId = this.normalizeOptionalText(id);
    if (!normalizedId) {
      return;
    }

    const vehicle = await this.linehaulRepository.findVehicleById(normalizedId);
    if (!vehicle) {
      throw new BadRequestException(`Vehicle "${normalizedId}" was not found.`);
    }
  }

  private async ensureDriverExists(id: string | null | undefined): Promise<void> {
    const normalizedId = this.normalizeOptionalText(id);
    if (!normalizedId) {
      return;
    }

    const driver = await this.linehaulRepository.findDriverById(normalizedId);
    if (!driver) {
      throw new BadRequestException(`Driver "${normalizedId}" was not found.`);
    }
  }

  private normalizeTripStatus(value: string | null | undefined): TripStatus | undefined {
    const normalized = this.normalizeOptionalCode(value);
    if (!normalized) {
      return undefined;
    }

    if (!TRIP_STATUSES.includes(normalized as TripStatus)) {
      throw new BadRequestException(`Unsupported trip status "${value}".`);
    }

    return normalized as TripStatus;
  }

  private normalizeVehicleStatus(value: string | null | undefined): Vehicle['status'] {
    const normalized = this.normalizeOptionalCode(value) ?? 'ACTIVE';
    if (!VEHICLE_STATUSES.includes(normalized as Vehicle['status'])) {
      throw new BadRequestException(`Unsupported vehicle status "${value}".`);
    }
    return normalized as Vehicle['status'];
  }

  private normalizeDriverStatus(value: string | null | undefined): Driver['status'] {
    const normalized = this.normalizeOptionalCode(value) ?? 'ACTIVE';
    if (!DRIVER_STATUSES.includes(normalized as Driver['status'])) {
      throw new BadRequestException(`Unsupported driver status "${value}".`);
    }
    return normalized as Driver['status'];
  }

  private requireSealDirection(value: string): SealDirection {
    const normalized = this.requireCode(value, 'direction');
    if (normalized !== 'OUTBOUND' && normalized !== 'INBOUND') {
      throw new BadRequestException('direction must be OUTBOUND or INBOUND.');
    }
    return normalized;
  }

  private requireCode(value: string | null | undefined, fieldName: string): string {
    const normalized = this.normalizeOptionalCode(value);
    if (!normalized) {
      throw new BadRequestException(`${fieldName} is required.`);
    }
    return normalized;
  }

  private requireText(value: string | null | undefined, fieldName: string): string {
    const normalized = this.normalizeOptionalText(value);
    if (!normalized) {
      throw new BadRequestException(`${fieldName} is required.`);
    }
    return normalized;
  }

  private normalizeOptionalCode(value: string | null | undefined): string | null {
    const normalized = value?.trim().toUpperCase() ?? '';
    return normalized.length > 0 ? normalized : null;
  }

  private normalizeOptionalText(value: string | null | undefined): string | null {
    const normalized = value?.trim() ?? '';
    return normalized.length > 0 ? normalized : null;
  }

  private parseDate(value: string | Date | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private normalizeCodeList(values: string[] | null | undefined): string[] {
    return Array.from(
      new Set(
        (values ?? [])
          .map((value) => this.normalizeOptionalCode(value))
          .filter((value): value is string => Boolean(value)),
      ),
    );
  }

  private generateTripCode(originHubCode: string, destinationHubCode: string): string {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    return `LH-${originHubCode}-${destinationHubCode}-${ymd}-${Date.now().toString().slice(-6)}`;
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  Driver as PrismaDriver,
  LinehaulHandover as PrismaHandover,
  LinehaulIncident as PrismaIncident,
  LinehaulSeal as PrismaSeal,
  LinehaulTrip as PrismaTrip,
  LinehaulTripManifest as PrismaTripManifest,
  Vehicle as PrismaVehicle,
} from '@prisma/client';

import type {
  AddTripManifestInput,
  AssignVehicleInput,
  CreateDriverInput,
  CreateHandoverInput,
  CreateTripInput,
  CreateVehicleInput,
  Driver,
  LinehaulHandover,
  LinehaulIncident,
  LinehaulSeal,
  LinehaulTrip,
  LinehaulTripManifest,
  ListTripFilters,
  RecordSealInput,
  ReportIncidentInput,
  TripStatus,
  Vehicle,
} from '../../domain/entities/linehaul.entity';
import { LinehaulRepository } from '../../domain/repositories/linehaul.repository';
import { PrismaService } from './prisma.service';

type TripRecord = PrismaTrip & {
  vehicle: PrismaVehicle | null;
  driver: PrismaDriver | null;
  manifests: PrismaTripManifest[];
  seals: PrismaSeal[];
  incidents: PrismaIncident[];
  handovers: PrismaHandover[];
};

@Injectable()
export class LinehaulPrismaRepository extends LinehaulRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  listVehicles(): Promise<Vehicle[]> {
    return this.prisma.vehicle
      .findMany({ orderBy: { createdAt: 'desc' } })
      .then((records) => records.map((record) => this.toVehicle(record)));
  }

  createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
    return this.prisma.vehicle
      .create({
        data: {
          vehicleCode: input.vehicleCode,
          licensePlate: input.licensePlate,
          vehicleType: input.vehicleType ?? null,
          capacityKg: toNullableNumber(input.capacityKg),
          status: (input.status ?? 'ACTIVE') as Vehicle['status'],
          note: input.note ?? null,
        },
      })
      .then((record) => this.toVehicle(record));
  }

  findVehicleById(id: string): Promise<Vehicle | null> {
    return this.prisma.vehicle
      .findUnique({ where: { id } })
      .then((record) => (record ? this.toVehicle(record) : null));
  }

  listDrivers(): Promise<Driver[]> {
    return this.prisma.driver
      .findMany({ orderBy: { createdAt: 'desc' } })
      .then((records) => records.map((record) => this.toDriver(record)));
  }

  createDriver(input: CreateDriverInput): Promise<Driver> {
    return this.prisma.driver
      .create({
        data: {
          driverCode: input.driverCode,
          userId: input.userId ?? null,
          fullName: input.fullName,
          phone: input.phone ?? null,
          licenseNo: input.licenseNo ?? null,
          status: (input.status ?? 'ACTIVE') as Driver['status'],
          note: input.note ?? null,
        },
      })
      .then((record) => this.toDriver(record));
  }

  findDriverById(id: string): Promise<Driver | null> {
    return this.prisma.driver
      .findUnique({ where: { id } })
      .then((record) => (record ? this.toDriver(record) : null));
  }

  async listTrips(filters: ListTripFilters = {}): Promise<LinehaulTrip[]> {
    const where: Prisma.LinehaulTripWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.originHubCode) {
      where.originHubCode = filters.originHubCode;
    }

    if (filters.destinationHubCode) {
      where.destinationHubCode = filters.destinationHubCode;
    }

    if (filters.vehicleId) {
      where.vehicleId = filters.vehicleId;
    }

    if (filters.driverId) {
      where.driverId = filters.driverId;
    }

    if (filters.manifestCode) {
      where.manifests = {
        some: {
          manifestCode: filters.manifestCode,
        },
      };
    }

    const records = await this.prisma.linehaulTrip.findMany({
      where,
      include: tripInclude,
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => this.toTrip(record));
  }

  findTripById(id: string): Promise<LinehaulTrip | null> {
    return this.prisma.linehaulTrip
      .findUnique({
        where: { id },
        include: tripInclude,
      })
      .then((record) => (record ? this.toTrip(record) : null));
  }

  createTrip(input: CreateTripInput): Promise<LinehaulTrip> {
    return this.prisma.linehaulTrip
      .create({
        data: {
          tripCode: input.tripCode ?? '',
          originHubCode: input.originHubCode,
          destinationHubCode: input.destinationHubCode,
          vehicleId: input.vehicleId ?? null,
          driverId: input.driverId ?? null,
          plannedDepartAt: toNullableDate(input.plannedDepartAt),
          plannedArriveAt: toNullableDate(input.plannedArriveAt),
          note: input.note ?? null,
          createdBy: input.createdBy ?? null,
        },
        include: tripInclude,
      })
      .then((record) => this.toTrip(record));
  }

  assignVehicle(id: string, input: AssignVehicleInput): Promise<LinehaulTrip> {
    return this.prisma.linehaulTrip
      .update({
        where: { id },
        data: {
          vehicleId: input.vehicleId ?? undefined,
          driverId: input.driverId ?? undefined,
          note: input.note ?? undefined,
        },
        include: tripInclude,
      })
      .then((record) => this.toTrip(record));
  }

  updateTripStatus(
    id: string,
    status: TripStatus,
    timestamps: {
      actualDepartAt?: Date | null;
      actualArriveAt?: Date | null;
      completedAt?: Date | null;
      cancelledAt?: Date | null;
      note?: string | null;
    } = {},
  ): Promise<LinehaulTrip> {
    return this.prisma.linehaulTrip
      .update({
        where: { id },
        data: {
          status,
          actualDepartAt: timestamps.actualDepartAt ?? undefined,
          actualArriveAt: timestamps.actualArriveAt ?? undefined,
          completedAt: timestamps.completedAt ?? undefined,
          cancelledAt: timestamps.cancelledAt ?? undefined,
          note: timestamps.note ?? undefined,
        },
        include: tripInclude,
      })
      .then((record) => this.toTrip(record));
  }

  addManifest(
    tripId: string,
    input: AddTripManifestInput,
  ): Promise<LinehaulTripManifest> {
    return this.prisma.linehaulTripManifest
      .upsert({
        where: {
          tripId_manifestCode: {
            tripId,
            manifestCode: input.manifestCode,
          },
        },
        create: {
          tripId,
          manifestId: input.manifestId ?? null,
          manifestCode: input.manifestCode,
          loadedBy: input.loadedBy ?? null,
          note: input.note ?? null,
        },
        update: {
          status: 'LOADED',
          manifestId: input.manifestId ?? undefined,
          loadedBy: input.loadedBy ?? undefined,
          note: input.note ?? undefined,
          unloadedAt: null,
          unloadedBy: null,
        },
      })
      .then((record) => this.toTripManifest(record));
  }

  unloadManifest(
    tripId: string,
    manifestCode: string,
    input: { unloadedBy?: string | null; note?: string | null },
  ): Promise<LinehaulTripManifest> {
    return this.prisma.linehaulTripManifest
      .update({
        where: {
          tripId_manifestCode: {
            tripId,
            manifestCode,
          },
        },
        data: {
          status: 'UNLOADED',
          unloadedAt: new Date(),
          unloadedBy: input.unloadedBy ?? null,
          note: input.note ?? undefined,
        },
      })
      .then((record) => this.toTripManifest(record));
  }

  recordSeal(tripId: string, input: RecordSealInput): Promise<LinehaulSeal> {
    return this.prisma.linehaulSeal
      .upsert({
        where: {
          tripId_sealCode_direction: {
            tripId,
            sealCode: input.sealCode,
            direction: input.direction as LinehaulSeal['direction'],
          },
        },
        create: {
          tripId,
          sealCode: input.sealCode,
          direction: input.direction as LinehaulSeal['direction'],
          scannedAt: toNullableDate(input.scannedAt) ?? new Date(),
          scannedBy: input.scannedBy ?? null,
          photoUrl: input.photoUrl ?? null,
          note: input.note ?? null,
        },
        update: {
          scannedAt: toNullableDate(input.scannedAt) ?? new Date(),
          scannedBy: input.scannedBy ?? undefined,
          photoUrl: input.photoUrl ?? undefined,
          note: input.note ?? undefined,
        },
      })
      .then((record) => this.toSeal(record));
  }

  reportIncident(
    tripId: string,
    input: ReportIncidentInput,
  ): Promise<LinehaulIncident> {
    return this.prisma.linehaulIncident
      .create({
        data: {
          tripId,
          incidentType: input.incidentType,
          severity: input.severity ?? null,
          description: input.description,
          photoUrls: input.photoUrls ?? Prisma.JsonNull,
          reportedBy: input.reportedBy ?? null,
        },
      })
      .then((record) => this.toIncident(record));
  }

  createHandover(
    tripId: string,
    input: CreateHandoverInput,
  ): Promise<LinehaulHandover> {
    return this.prisma.linehaulHandover
      .create({
        data: {
          tripId,
          hubCode: input.hubCode,
          fromUser: input.fromUser ?? null,
          toUser: input.toUser ?? null,
          note: input.note ?? null,
          signedAt: toNullableDate(input.signedAt) ?? new Date(),
          signatureUrl: input.signatureUrl ?? null,
        },
      })
      .then((record) => this.toHandover(record));
  }

  private toVehicle(record: PrismaVehicle): Vehicle {
    return { ...record, status: record.status as Vehicle['status'] };
  }

  private toDriver(record: PrismaDriver): Driver {
    return { ...record, status: record.status as Driver['status'] };
  }

  private toTrip(record: TripRecord): LinehaulTrip {
    return {
      ...record,
      status: record.status as LinehaulTrip['status'],
      vehicle: record.vehicle ? this.toVehicle(record.vehicle) : null,
      driver: record.driver ? this.toDriver(record.driver) : null,
      manifests: record.manifests.map((item) => this.toTripManifest(item)),
      seals: record.seals.map((item) => this.toSeal(item)),
      incidents: record.incidents.map((item) => this.toIncident(item)),
      handovers: record.handovers.map((item) => this.toHandover(item)),
    };
  }

  private toTripManifest(record: PrismaTripManifest): LinehaulTripManifest {
    return { ...record, status: record.status as LinehaulTripManifest['status'] };
  }

  private toSeal(record: PrismaSeal): LinehaulSeal {
    return {
      ...record,
      direction: record.direction as LinehaulSeal['direction'],
    };
  }

  private toIncident(record: PrismaIncident): LinehaulIncident {
    return {
      ...record,
      photoUrls: Array.isArray(record.photoUrls)
        ? record.photoUrls.filter((item): item is string => typeof item === 'string')
        : null,
    };
  }

  private toHandover(record: PrismaHandover): LinehaulHandover {
    return record;
  }
}

const tripInclude = {
  vehicle: true,
  driver: true,
  manifests: {
    orderBy: { loadedAt: 'asc' },
  },
  seals: {
    orderBy: { scannedAt: 'asc' },
  },
  incidents: {
    orderBy: { reportedAt: 'desc' },
  },
  handovers: {
    orderBy: { signedAt: 'desc' },
  },
} satisfies Prisma.LinehaulTripInclude;

function toNullableNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

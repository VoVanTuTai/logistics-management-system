import type {
  AddTripManifestInput,
  AssignVehicleInput,
  CreateDriverInput,
  CreateHandoverInput,
  CreateTripInput,
  CreateVehicleInput,
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
  Driver,
} from '../entities/linehaul.entity';

export abstract class LinehaulRepository {
  abstract listVehicles(): Promise<Vehicle[]>;
  abstract createVehicle(input: CreateVehicleInput): Promise<Vehicle>;
  abstract findVehicleById(id: string): Promise<Vehicle | null>;
  abstract listDrivers(): Promise<Driver[]>;
  abstract createDriver(input: CreateDriverInput): Promise<Driver>;
  abstract findDriverById(id: string): Promise<Driver | null>;
  abstract listTrips(filters?: ListTripFilters): Promise<LinehaulTrip[]>;
  abstract findTripById(id: string): Promise<LinehaulTrip | null>;
  abstract createTrip(input: CreateTripInput): Promise<LinehaulTrip>;
  abstract assignVehicle(id: string, input: AssignVehicleInput): Promise<LinehaulTrip>;
  abstract updateTripStatus(
    id: string,
    status: TripStatus,
    timestamps?: {
      actualDepartAt?: Date | null;
      actualArriveAt?: Date | null;
      completedAt?: Date | null;
      cancelledAt?: Date | null;
      note?: string | null;
    },
  ): Promise<LinehaulTrip>;
  abstract addManifest(
    tripId: string,
    input: AddTripManifestInput,
  ): Promise<LinehaulTripManifest>;
  abstract unloadManifest(
    tripId: string,
    manifestCode: string,
    input: { unloadedBy?: string | null; note?: string | null },
  ): Promise<LinehaulTripManifest>;
  abstract recordSeal(tripId: string, input: RecordSealInput): Promise<LinehaulSeal>;
  abstract reportIncident(
    tripId: string,
    input: ReportIncidentInput,
  ): Promise<LinehaulIncident>;
  abstract createHandover(
    tripId: string,
    input: CreateHandoverInput,
  ): Promise<LinehaulHandover>;
}

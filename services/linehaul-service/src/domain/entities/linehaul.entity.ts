export type VehicleStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type DriverStatus = 'ACTIVE' | 'INACTIVE';
export type TripStatus =
  | 'PLANNED'
  | 'LOADING'
  | 'SEALED'
  | 'DEPARTED'
  | 'ARRIVED'
  | 'RECEIVING'
  | 'COMPLETED'
  | 'INCIDENT_REPORTED'
  | 'CANCELLED';
export type TripManifestStatus = 'LOADED' | 'UNLOADED' | 'EXCEPTION';
export type SealDirection = 'OUTBOUND' | 'INBOUND';

export const TRIP_STATUSES: TripStatus[] = [
  'PLANNED',
  'LOADING',
  'SEALED',
  'DEPARTED',
  'ARRIVED',
  'RECEIVING',
  'COMPLETED',
  'INCIDENT_REPORTED',
  'CANCELLED',
];

export const VEHICLE_STATUSES: VehicleStatus[] = [
  'ACTIVE',
  'INACTIVE',
  'MAINTENANCE',
];

export const DRIVER_STATUSES: DriverStatus[] = ['ACTIVE', 'INACTIVE'];

export interface Vehicle {
  id: string;
  vehicleCode: string;
  licensePlate: string;
  vehicleType: string | null;
  capacityKg: number | null;
  status: VehicleStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Driver {
  id: string;
  driverCode: string;
  userId: string | null;
  fullName: string;
  phone: string | null;
  licenseNo: string | null;
  status: DriverStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinehaulTripManifest {
  id: string;
  tripId: string;
  manifestId: string | null;
  manifestCode: string;
  status: TripManifestStatus;
  loadedAt: Date;
  unloadedAt: Date | null;
  loadedBy: string | null;
  unloadedBy: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinehaulSeal {
  id: string;
  tripId: string;
  sealCode: string;
  direction: SealDirection;
  scannedAt: Date;
  scannedBy: string | null;
  photoUrl: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinehaulIncident {
  id: string;
  tripId: string;
  incidentType: string;
  severity: string | null;
  description: string;
  photoUrls: string[] | null;
  reportedBy: string | null;
  reportedAt: Date;
  resolvedAt: Date | null;
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinehaulHandover {
  id: string;
  tripId: string;
  hubCode: string;
  fromUser: string | null;
  toUser: string | null;
  note: string | null;
  signedAt: Date;
  signatureUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinehaulTrip {
  id: string;
  tripCode: string;
  status: TripStatus;
  originHubCode: string;
  destinationHubCode: string;
  vehicleId: string | null;
  driverId: string | null;
  plannedDepartAt: Date | null;
  actualDepartAt: Date | null;
  plannedArriveAt: Date | null;
  actualArriveAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  note: string | null;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  vehicle?: Vehicle | null;
  driver?: Driver | null;
  manifests?: LinehaulTripManifest[];
  seals?: LinehaulSeal[];
  incidents?: LinehaulIncident[];
  handovers?: LinehaulHandover[];
}

export interface ListTripFilters {
  status?: TripStatus;
  originHubCode?: string;
  destinationHubCode?: string;
  vehicleId?: string;
  driverId?: string;
  manifestCode?: string;
}

export interface CreateVehicleInput {
  vehicleCode: string;
  licensePlate: string;
  vehicleType?: string | null;
  capacityKg?: number | string | null;
  status?: VehicleStatus | string | null;
  note?: string | null;
}

export interface CreateDriverInput {
  driverCode: string;
  userId?: string | null;
  fullName: string;
  phone?: string | null;
  licenseNo?: string | null;
  status?: DriverStatus | string | null;
  note?: string | null;
}

export interface CreateTripInput {
  tripCode?: string | null;
  originHubCode: string;
  destinationHubCode: string;
  vehicleId?: string | null;
  driverId?: string | null;
  plannedDepartAt?: string | Date | null;
  plannedArriveAt?: string | Date | null;
  note?: string | null;
  createdBy?: string | null;
}

export interface AssignVehicleInput {
  vehicleId?: string | null;
  driverId?: string | null;
  note?: string | null;
}

export interface AddTripManifestInput {
  manifestId?: string | null;
  manifestCode: string;
  loadedBy?: string | null;
  note?: string | null;
}

export interface RecordSealInput {
  sealCode: string;
  direction: SealDirection | string;
  scannedAt?: string | Date | null;
  scannedBy?: string | null;
  photoUrl?: string | null;
  note?: string | null;
}

export interface DepartTripInput {
  actualDepartAt?: string | Date | null;
  sealCodes?: string[];
  departedBy?: string | null;
  note?: string | null;
}

export interface SealTripInput {
  sealCodes?: string[];
  sealedBy?: string | null;
  note?: string | null;
}

export interface ArriveTripInput {
  actualArriveAt?: string | Date | null;
  sealCodes?: string[];
  arrivedBy?: string | null;
  note?: string | null;
}

export interface ReceiveManifestInput {
  manifestCode: string;
  unloadedBy?: string | null;
  note?: string | null;
}

export interface ReportIncidentInput {
  incidentType: string;
  severity?: string | null;
  description: string;
  photoUrls?: string[] | null;
  reportedBy?: string | null;
}

export interface CreateHandoverInput {
  hubCode: string;
  fromUser?: string | null;
  toUser?: string | null;
  note?: string | null;
  signedAt?: string | Date | null;
  signatureUrl?: string | null;
}

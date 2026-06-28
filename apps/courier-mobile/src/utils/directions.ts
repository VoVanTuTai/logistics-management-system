import { Alert, Linking } from 'react-native';

import type { ShipmentMetadata } from '../features/shipment/shipment.types';
import type { TaskType } from '../features/tasks/tasks.types';

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface NavigationDestination {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

function readMetadataPath(
  metadata: ShipmentMetadata | null,
  path: string,
): unknown {
  if (!metadata) {
    return null;
  }

  const keys = path.split('.');
  let current: unknown = metadata;

  for (const key of keys) {
    if (!current || typeof current !== 'object' || !(key in current)) {
      return null;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

function readMetadataString(
  metadata: ShipmentMetadata | null,
  paths: string[],
): string | null {
  for (const path of paths) {
    const value = readMetadataPath(metadata, path);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function readMetadataNumber(
  metadata: ShipmentMetadata | null,
  paths: string[],
): number | null {
  for (const path of paths) {
    const value = readMetadataPath(metadata, path);
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value.trim());
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readCoordinateValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function normalizeCoordinate(input: {
  latitude: unknown;
  longitude: unknown;
}): GeoCoordinate | null {
  const latitude = readCoordinateValue(input.latitude);
  const longitude = readCoordinateValue(input.longitude);

  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
  };
}

function readMetadataCoordinateObject(
  metadata: ShipmentMetadata | null,
  paths: string[],
): GeoCoordinate | null {
  for (const path of paths) {
    const value = readMetadataPath(metadata, path);

    if (typeof value === 'string') {
      const [latitude, longitude] = value.split(',').map((part) => part.trim());
      const coordinate = normalizeCoordinate({ latitude, longitude });
      if (coordinate) {
        return coordinate;
      }
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const coordinate = normalizeCoordinate({
        latitude: record.latitude ?? record.lat,
        longitude: record.longitude ?? record.lng ?? record.lon,
      });
      if (coordinate) {
        return coordinate;
      }
    }
  }

  return null;
}

function resolveAddressPaths(taskType: TaskType): string[] {
  if (taskType === 'PICKUP') {
    return [
      'pickupAddress',
      'pickup.address',
      'pickup.location.address',
      'senderAddress',
      'sender.address',
      'merchant.address',
      'origin.address',
    ];
  }

  if (taskType === 'RETURN') {
    return [
      'returnAddress',
      'return.address',
      'return.location.address',
      'senderAddress',
      'sender.address',
      'pickupAddress',
      'pickup.address',
    ];
  }

  return [
    'deliveryAddress',
    'delivery.address',
    'delivery.location.address',
    'receiverAddress',
    'recipientAddress',
    'receiver.address',
    'recipient.address',
    'address',
  ];
}

function resolveCoordinateObjectPaths(taskType: TaskType): string[] {
  if (taskType === 'PICKUP') {
    return [
      'pickupCoordinate',
      'pickupCoordinates',
      'pickup.coordinate',
      'pickup.coordinates',
      'pickup.location',
      'pickup.location.coordinate',
      'pickup.location.coordinates',
      'sender.location',
      'sender.coordinate',
      'sender.coordinates',
      'origin.location',
      'origin.coordinate',
      'origin.coordinates',
    ];
  }

  if (taskType === 'RETURN') {
    return [
      'returnCoordinate',
      'returnCoordinates',
      'return.coordinate',
      'return.coordinates',
      'return.location',
      'return.location.coordinate',
      'return.location.coordinates',
      'sender.location',
      'sender.coordinate',
      'sender.coordinates',
      'pickup.location',
      'pickup.coordinate',
      'pickup.coordinates',
    ];
  }

  return [
    'deliveryCoordinate',
    'deliveryCoordinates',
    'delivery.coordinate',
    'delivery.coordinates',
    'delivery.location',
    'delivery.location.coordinate',
    'delivery.location.coordinates',
    'receiver.location',
    'receiver.coordinate',
    'receiver.coordinates',
    'recipient.location',
    'recipient.coordinate',
    'recipient.coordinates',
    'coordinate',
    'coordinates',
    'location',
  ];
}

function resolveLatitudePaths(taskType: TaskType): string[] {
  if (taskType === 'PICKUP') {
    return [
      'pickupLatitude',
      'pickupLat',
      'pickup.latitude',
      'pickup.lat',
      'pickup.location.latitude',
      'pickup.location.lat',
      'senderLatitude',
      'senderLat',
      'sender.latitude',
      'sender.lat',
      'sender.location.latitude',
      'sender.location.lat',
      'origin.latitude',
      'origin.lat',
    ];
  }

  if (taskType === 'RETURN') {
    return [
      'returnLatitude',
      'returnLat',
      'return.latitude',
      'return.lat',
      'return.location.latitude',
      'return.location.lat',
      'senderLatitude',
      'senderLat',
      'sender.latitude',
      'sender.lat',
      'pickupLatitude',
      'pickupLat',
    ];
  }

  return [
    'deliveryLatitude',
    'deliveryLat',
    'delivery.latitude',
    'delivery.lat',
    'delivery.location.latitude',
    'delivery.location.lat',
    'receiverLatitude',
    'receiverLat',
    'recipientLatitude',
    'recipientLat',
    'receiver.latitude',
    'receiver.lat',
    'recipient.latitude',
    'recipient.lat',
    'receiver.location.latitude',
    'receiver.location.lat',
    'recipient.location.latitude',
    'recipient.location.lat',
    'latitude',
    'lat',
  ];
}

function resolveLongitudePaths(taskType: TaskType): string[] {
  if (taskType === 'PICKUP') {
    return [
      'pickupLongitude',
      'pickupLng',
      'pickup.longitude',
      'pickup.lng',
      'pickup.location.longitude',
      'pickup.location.lng',
      'senderLongitude',
      'senderLng',
      'sender.longitude',
      'sender.lng',
      'sender.location.longitude',
      'sender.location.lng',
      'origin.longitude',
      'origin.lng',
    ];
  }

  if (taskType === 'RETURN') {
    return [
      'returnLongitude',
      'returnLng',
      'return.longitude',
      'return.lng',
      'return.location.longitude',
      'return.location.lng',
      'senderLongitude',
      'senderLng',
      'sender.longitude',
      'sender.lng',
      'pickupLongitude',
      'pickupLng',
    ];
  }

  return [
    'deliveryLongitude',
    'deliveryLng',
    'delivery.longitude',
    'delivery.lng',
    'delivery.location.longitude',
    'delivery.location.lng',
    'receiverLongitude',
    'receiverLng',
    'recipientLongitude',
    'recipientLng',
    'receiver.longitude',
    'receiver.lng',
    'recipient.longitude',
    'recipient.lng',
    'receiver.location.longitude',
    'receiver.location.lng',
    'recipient.location.longitude',
    'recipient.location.lng',
    'longitude',
    'lng',
  ];
}

export function resolveShipmentNavigationDestination(input: {
  taskType: TaskType;
  metadata: ShipmentMetadata | null;
}): NavigationDestination | null {
  const address = readMetadataString(
    input.metadata,
    resolveAddressPaths(input.taskType),
  );
  const objectCoordinate = readMetadataCoordinateObject(
    input.metadata,
    resolveCoordinateObjectPaths(input.taskType),
  );
  const coordinate =
    objectCoordinate ??
    normalizeCoordinate({
      latitude: readMetadataNumber(
        input.metadata,
        resolveLatitudePaths(input.taskType),
      ),
      longitude: readMetadataNumber(
        input.metadata,
        resolveLongitudePaths(input.taskType),
      ),
    });

  if (coordinate) {
    return {
      address,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    };
  }

  if (address) {
    return { address, latitude: null, longitude: null };
  }

  return null;
}

export async function openGoogleMapsDirections(
  destination: NavigationDestination | null,
): Promise<void> {
  if (!destination) {
    Alert.alert(
      'Chưa có điểm đến',
      'Đơn hàng chưa có địa chỉ hoặc tọa độ để mở chỉ đường.',
    );
    return;
  }

  const destinationQuery =
    destination.latitude !== null && destination.longitude !== null
      ? `${destination.latitude},${destination.longitude}`
      : destination.address;

  if (!destinationQuery) {
    Alert.alert(
      'Chưa có điểm đến',
      'Đơn hàng chưa có địa chỉ hoặc tọa độ để mở chỉ đường.',
    );
    return;
  }

  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destinationQuery,
  )}&travelmode=driving`;

  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert(
      'Không thể mở chỉ đường',
      error instanceof Error
        ? error.message
        : 'Không thể mở Google Maps cho điểm đến này.',
    );
  }
}

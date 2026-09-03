/**
 * Client-side Route Optimization & TSP Sequencing (Offline fallback & instantaneous ordering)
 */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ClientRouteNode<T = unknown> {
  id: string;
  coordinate: GeoPoint;
  data?: T;
}

export interface ClientRouteLeg {
  fromId: string;
  toId: string;
  distanceKm: number;
  durationMinutes: number;
}

export interface ClientRouteResult<T = unknown> {
  orderedItems: ClientRouteNode<T>[];
  orderedIds: string[];
  legs: ClientRouteLeg[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
}

const EARTH_RADIUS_KM = 6371;
const ROAD_FACTOR = 1.3;
const MOTORBIKE_AVG_SPEED_KMH = 24; // km/h
const STOP_TIME_MINUTES = 3;

/**
 * Tính khoảng cách đường chim bay giữa 2 điểm GPS (km)
 */
export function calculateHaversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Giải thuật tối ưu thứ tự lộ trình giao (TSP: Nearest Neighbor + 2-Opt)
 */
export function optimizeClientRoute<T = unknown>(
  startLocation: GeoPoint,
  items: ClientRouteNode<T>[],
): ClientRouteResult<T> {
  if (!items || items.length === 0) {
    return {
      orderedItems: [],
      orderedIds: [],
      legs: [],
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
    };
  }

  if (items.length === 1) {
    const item = items[0];
    const directKm = calculateHaversineKm(startLocation, item.coordinate);
    const roadKm = Number((directKm * ROAD_FACTOR).toFixed(1));
    const duration = Math.round((roadKm / MOTORBIKE_AVG_SPEED_KMH) * 60) + STOP_TIME_MINUTES;

    return {
      orderedItems: [item],
      orderedIds: [item.id],
      legs: [
        {
          fromId: 'START',
          toId: item.id,
          distanceKm: roadKm,
          durationMinutes: duration,
        },
      ],
      totalDistanceKm: roadKm,
      totalDurationMinutes: duration,
    };
  }

  // 1. Greedy Nearest Neighbor
  const unvisited = [...items];
  const tour: ClientRouteNode<T>[] = [];
  let currentLoc = startLocation;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minKm = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = calculateHaversineKm(currentLoc, unvisited[i].coordinate);
      if (d < minKm) {
        minKm = d;
        nearestIdx = i;
      }
    }

    const [selected] = unvisited.splice(nearestIdx, 1);
    tour.push(selected);
    currentLoc = selected.coordinate;
  }

  // 2. 2-Opt Local Search
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < tour.length - 1; i++) {
      for (let k = i + 1; k < tour.length; k++) {
        const prevCoord = i === 0 ? startLocation : tour[i - 1].coordinate;
        const currentCoord = tour[i].coordinate;
        const kCoord = tour[k].coordinate;
        const nextCoord = k === tour.length - 1 ? null : tour[k + 1].coordinate;

        const currentCost =
          calculateHaversineKm(prevCoord, currentCoord) +
          (nextCoord ? calculateHaversineKm(kCoord, nextCoord) : 0);

        const newCost =
          calculateHaversineKm(prevCoord, kCoord) +
          (nextCoord ? calculateHaversineKm(currentCoord, nextCoord) : 0);

        if (newCost < currentCost - 1e-4) {
          let left = i;
          let right = k;
          while (left < right) {
            const temp = tour[left];
            tour[left] = tour[right];
            tour[right] = temp;
            left++;
            right--;
          }
          improved = true;
        }
      }
    }
  }

  // 3. Legs and Totals
  const legs: ClientRouteLeg[] = [];
  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;
  let prevPoint = startLocation;
  let prevId = 'START';

  for (const node of tour) {
    const directKm = calculateHaversineKm(prevPoint, node.coordinate);
    const roadKm = Number((directKm * ROAD_FACTOR).toFixed(1));
    const legMin = Math.round((roadKm / MOTORBIKE_AVG_SPEED_KMH) * 60) + STOP_TIME_MINUTES;

    legs.push({
      fromId: prevId,
      toId: node.id,
      distanceKm: roadKm,
      durationMinutes: legMin,
    });

    totalDistanceKm += roadKm;
    totalDurationMinutes += legMin;
    prevPoint = node.coordinate;
    prevId = node.id;
  }

  return {
    orderedItems: tour,
    orderedIds: tour.map((t) => t.id),
    legs,
    totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
    totalDurationMinutes,
  };
}

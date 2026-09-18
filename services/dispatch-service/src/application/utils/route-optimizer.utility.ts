/**
 * Thuật toán tối ưu hóa lộ trình giao nhận cho Courier (Travelling Salesperson Problem - TSP)
 * Áp dụng giải thuật Greedy Nearest Neighbor kết hợp 2-Opt Local Search
 */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface RouteTargetNode {
  id: string; // taskId hoặc shipmentCode
  coordinate: GeoPoint;
  label?: string;
  taskType?: string;
}

export interface RouteLeg {
  fromId: string; // 'START' hoặc taskId
  toId: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface RouteOptimizationResult {
  orderedIds: string[];
  legs: RouteLeg[];
  totalDistanceMeters: number;
  estimatedDurationSeconds: number;
}

const EARTH_RADIUS_METERS = 6371000;
// Hệ số vòng vèo đường bộ thực tế so với đường chim bay trong đô thị Việt Nam (~1.3x)
const ROAD_CIRCUITY_FACTOR = 1.3;
// Tốc độ di chuyển trung bình của xe máy giao hàng nội thành (~23 km/h = 6.4 m/s)
const AVERAGE_SPEED_METERS_PER_SEC = 6.4;
// Thời gian dừng đỗ lấy/giao trung bình mỗi đơn (3 phút = 180s)
const STOP_DURATION_SECONDS = 180;

/**
 * Tính khoảng cách đường chim bay giữa 2 tọa độ (Haversine Formula)
 */
export function haversineDistanceMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Ước tính khoảng cách đường bộ thực tế dựa trên khoảng cách chim bay
 */
export function estimateRoadDistanceMeters(a: GeoPoint, b: GeoPoint): number {
  const directDistance = haversineDistanceMeters(a, b);
  return Math.round(directDistance * ROAD_CIRCUITY_FACTOR);
}

/**
 * Ước tính thời gian di chuyển bằng xe máy giữa 2 điểm (giây)
 */
export function estimateTravelTimeSeconds(roadDistanceMeters: number): number {
  return Math.round(roadDistanceMeters / AVERAGE_SPEED_METERS_PER_SEC);
}

/**
 * Tối ưu hóa lộ trình xuất phát từ vị trí Shipper qua N điểm giao/lấy
 */
export function optimizeRouteTSP(
  startLocation: GeoPoint,
  nodes: RouteTargetNode[],
): RouteOptimizationResult {
  if (!nodes || nodes.length === 0) {
    return {
      orderedIds: [],
      legs: [],
      totalDistanceMeters: 0,
      estimatedDurationSeconds: 0,
    };
  }

  if (nodes.length === 1) {
    const target = nodes[0];
    const dist = estimateRoadDistanceMeters(startLocation, target.coordinate);
    const dur = estimateTravelTimeSeconds(dist) + STOP_DURATION_SECONDS;
    return {
      orderedIds: [target.id],
      legs: [
        {
          fromId: 'START',
          toId: target.id,
          distanceMeters: dist,
          durationSeconds: dur,
        },
      ],
      totalDistanceMeters: dist,
      estimatedDurationSeconds: dur,
    };
  }

  // 1. Bước Greedy: Nearest Neighbor xuất phát từ startLocation
  const unvisited = [...nodes];
  const tour: RouteTargetNode[] = [];
  let currentLocation = startLocation;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversineDistanceMeters(currentLocation, unvisited[i].coordinate);
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    const [chosenNode] = unvisited.splice(nearestIndex, 1);
    tour.push(chosenNode);
    currentLocation = chosenNode.coordinate;
  }

  // 2. Bước Tinh Chỉnh: 2-Opt Local Search để gỡ các giao cắt chéo nhau
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (let i = 0; i < tour.length - 1; i++) {
      for (let k = i + 1; k < tour.length; k++) {
        // Tọa độ trước nút i (nếu i == 0 thì là startLocation)
        const prevCoord = i === 0 ? startLocation : tour[i - 1].coordinate;
        const currentCoord = tour[i].coordinate;
        const kCoord = tour[k].coordinate;
        // Tọa độ sau nút k (nếu k == tour.length - 1 thì kết thúc, coi như chi phí 0)
        const nextCoord = k === tour.length - 1 ? null : tour[k + 1].coordinate;

        // Chi phí cạnh hiện tại: (prev -> i) + (k -> next)
        const currentCost =
          haversineDistanceMeters(prevCoord, currentCoord) +
          (nextCoord ? haversineDistanceMeters(kCoord, nextCoord) : 0);

        // Chi phí nếu đảo ngược đoạn tour[i..k]: (prev -> k) + (i -> next)
        const newCost =
          haversineDistanceMeters(prevCoord, kCoord) +
          (nextCoord ? haversineDistanceMeters(currentCoord, nextCoord) : 0);

        if (newCost < currentCost - 1e-4) {
          // Đảo ngược đoạn mảng từ i đến k
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

  // 3. Tính toán chặng đường (legs) và tổng cự ly, thời gian
  const legs: RouteLeg[] = [];
  let totalDistanceMeters = 0;
  let estimatedDurationSeconds = 0;
  let prevPoint = startLocation;
  let prevId = 'START';

  for (const node of tour) {
    const legDistance = estimateRoadDistanceMeters(prevPoint, node.coordinate);
    const legDuration = estimateTravelTimeSeconds(legDistance) + STOP_DURATION_SECONDS;

    legs.push({
      fromId: prevId,
      toId: node.id,
      distanceMeters: legDistance,
      durationSeconds: legDuration,
    });

    totalDistanceMeters += legDistance;
    estimatedDurationSeconds += legDuration;
    prevPoint = node.coordinate;
    prevId = node.id;
  }

  return {
    orderedIds: tour.map((t) => t.id),
    legs,
    totalDistanceMeters,
    estimatedDurationSeconds,
  };
}

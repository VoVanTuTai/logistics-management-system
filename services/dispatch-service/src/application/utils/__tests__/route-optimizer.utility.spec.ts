import * as assert from 'assert';

import {
  haversineDistanceMeters,
  optimizeRouteTSP,
  type GeoPoint,
  type RouteTargetNode,
} from '../route-optimizer.utility';

export function runRouteOptimizerTests(): void {
  // Test haversine
  const benThanh: GeoPoint = { latitude: 10.7725, longitude: 106.698 };
  const airport: GeoPoint = { latitude: 10.8185, longitude: 106.6588 };

  const dist = haversineDistanceMeters(benThanh, airport);
  assert.ok(dist > 6400 && dist < 7000, 'Khoảng cách Bến Thành -> Tân Sơn Nhất phải khoảng 6.7km');

  const samePointDist = haversineDistanceMeters(benThanh, benThanh);
  assert.strictEqual(samePointDist, 0, 'Khoảng cách cùng 1 điểm phải bằng 0');

  // Test empty nodes
  const emptyResult = optimizeRouteTSP({ latitude: 10.8, longitude: 106.6 }, []);
  assert.strictEqual(emptyResult.orderedIds.length, 0);
  assert.strictEqual(emptyResult.totalDistanceMeters, 0);

  // Test single node
  const start: GeoPoint = { latitude: 10.8, longitude: 106.6 };
  const singleNodes: RouteTargetNode[] = [
    { id: 'task-1', coordinate: { latitude: 10.81, longitude: 106.61 } },
  ];
  const singleResult = optimizeRouteTSP(start, singleNodes);
  assert.deepStrictEqual(singleResult.orderedIds, ['task-1']);
  assert.strictEqual(singleResult.legs.length, 1);
  assert.strictEqual(singleResult.legs[0].fromId, 'START');
  assert.strictEqual(singleResult.legs[0].toId, 'task-1');

  // Test multiple nodes: Should order from closest to farthest
  const hubStart: GeoPoint = { latitude: 10.8, longitude: 106.66 };
  const multiNodes: RouteTargetNode[] = [
    { id: 'task-Far', coordinate: { latitude: 10.7725, longitude: 106.698 } }, // ~6km
    { id: 'task-Medium', coordinate: { latitude: 10.795, longitude: 106.645 } }, // ~2km
    { id: 'task-Near', coordinate: { latitude: 10.805, longitude: 106.663 } }, // ~0.6km
  ];

  const multiResult = optimizeRouteTSP(hubStart, multiNodes);
  assert.deepStrictEqual(
    multiResult.orderedIds,
    ['task-Near', 'task-Medium', 'task-Far'],
    'Thuật toán phải xếp đơn gần nhất trước (Near -> Medium -> Far)',
  );
  assert.strictEqual(multiResult.legs.length, 3);
  assert.ok(multiResult.totalDistanceMeters > 0);
}

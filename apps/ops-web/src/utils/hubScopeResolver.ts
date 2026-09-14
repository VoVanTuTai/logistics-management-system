import type { HubDto } from '../features/masterdata/masterdata.types';
import type { OpsActor } from '../features/permissions/opsPermissions';
import type { ShipmentListItemDto } from '../features/shipments/shipments.types';

export interface HubScopeResult {
  actor: OpsActor;
  hubLevel: 0 | 1 | 2 | 3;
  scopedHubCodes: string[];
  primaryHub: HubDto | null;
  childHubs: HubDto[];
  scopeLabel: string;
  isAllSystem: boolean;
}

export interface HubBreakdownItem {
  hubCode: string;
  hubName: string;
  level: number;
  totalShipments: number;
  deliveredCount: number;
  inTransitCount: number;
  incidentCount: number;
  successRate: string;
}

function normalize(code: string | null | undefined): string {
  return (code ?? '').trim().toUpperCase();
}

/**
 * Resolves the operational hub scope for a user given the master hubs list,
 * the user's assigned hub codes, and their resolved OpsActor.
 */
export function resolveHubScope(
  allHubs: HubDto[],
  assignedHubCodes: string[],
  actor: OpsActor,
  roles: string[] = [],
): HubScopeResult {
  const normAssignedCodes = assignedHubCodes
    .map(normalize)
    .filter((c) => c.length > 0);

  const hubMap = new Map<string, HubDto>();
  const childrenMap = new Map<string, HubDto[]>();

  for (const hub of allHubs) {
    const code = normalize(hub.code);
    hubMap.set(code, hub);

    const parent = normalize(hub.parentCode);
    if (parent) {
      const list = childrenMap.get(parent) ?? [];
      list.push(hub);
      childrenMap.set(parent, list);
    }
  }

  // Helper to recursively collect all descendant hub codes
  function collectDescendants(parentCode: string): HubDto[] {
    const directChildren = childrenMap.get(parentCode) ?? [];
    const allDescendants: HubDto[] = [...directChildren];
    for (const child of directChildren) {
      allDescendants.push(...collectDescendants(normalize(child.code)));
    }
    return allDescendants;
  }

  // 1. HQ Level (Level 0)
  if (actor === 'HQ_OPS' || roles.includes('SYSTEM_ADMIN') || roles.includes('HQ_OPS')) {
    const hqHub = allHubs.find((h) => h.level === 0) ?? null;
    const regionalHubs = allHubs.filter((h) => h.level === 1);

    return {
      actor: 'HQ_OPS',
      hubLevel: 0,
      scopedHubCodes: [], // Empty means unrestricted / all hubs
      primaryHub: hqHub,
      childHubs: regionalHubs,
      scopeLabel: 'Toàn quốc (HQ)',
      isAllSystem: true,
    };
  }

  // Find user's matched hubs in allHubs
  const matchedHubs = normAssignedCodes
    .map((code) => hubMap.get(code))
    .filter((h): h is HubDto => h !== undefined);

  // 2. Regional Level (Level 1)
  const regionalHub = matchedHubs.find((h) => h.level === 1);
  if (actor === 'REGIONAL_OPS' || regionalHub) {
    const primary = regionalHub ?? matchedHubs[0] ?? null;
    const primaryCode = primary ? normalize(primary.code) : normAssignedCodes[0] ?? '';

    // Direct children are provincial hubs (level 2)
    let childHubs = primaryCode ? (childrenMap.get(primaryCode) ?? []) : [];
    if (childHubs.length === 0 && primary?.zoneCode) {
      // Fallback: match by zoneCode
      childHubs = allHubs.filter((h) => h.level === 2 && h.zoneCode === primary.zoneCode);
    }

    const descendants = primaryCode ? collectDescendants(primaryCode) : [];
    const descendantCodes = descendants.map((h) => normalize(h.code));
    const scopedSet = new Set<string>([primaryCode, ...descendantCodes]);
    // Also include any assigned codes
    normAssignedCodes.forEach((c) => scopedSet.add(c));

    return {
      actor: 'REGIONAL_OPS',
      hubLevel: 1,
      scopedHubCodes: Array.from(scopedSet),
      primaryHub: primary,
      childHubs,
      scopeLabel: primary?.name ?? 'Khu vực Miền',
      isAllSystem: false,
    };
  }

  // 3. Provincial Level (Level 2)
  const provincialHub = matchedHubs.find((h) => h.level === 2 || h.code.includes('B'));
  if (actor === 'PROVINCIAL_OPS' || provincialHub) {
    const primary = provincialHub ?? matchedHubs[0] ?? null;
    const primaryCode = primary ? normalize(primary.code) : normAssignedCodes[0] ?? '';

    // Direct children are ward hubs (level 3)
    const childHubs = primaryCode ? (childrenMap.get(primaryCode) ?? []) : [];
    const descendantCodes = childHubs.map((h) => normalize(h.code));
    const scopedSet = new Set<string>([primaryCode, ...descendantCodes]);
    normAssignedCodes.forEach((c) => scopedSet.add(c));

    return {
      actor: 'PROVINCIAL_OPS',
      hubLevel: 2,
      scopedHubCodes: Array.from(scopedSet),
      primaryHub: primary,
      childHubs,
      scopeLabel: primary?.name ?? 'Bưu cục Tỉnh/Thành',
      isAllSystem: false,
    };
  }

  // 4. Ward Level (Level 3 - Hub Phường / Cơ sở)
  const primary = matchedHubs[0] ?? null;
  const primaryCode = primary ? normalize(primary.code) : normAssignedCodes[0] ?? '';
  const scopedCodes = normAssignedCodes.length > 0 ? normAssignedCodes : (primaryCode ? [primaryCode] : []);

  return {
    actor: 'HUB_OPS',
    hubLevel: 3,
    scopedHubCodes: scopedCodes,
    primaryHub: primary,
    childHubs: [],
    scopeLabel: primary?.name ?? (scopedCodes[0] ? `Hub ${scopedCodes[0]}` : 'Bưu cục Phường'),
    isAllSystem: false,
  };
}

/**
 * Checks if a shipment is within the allowed scope of hub codes.
 * Returns true if user has unrestricted access (empty scopedHubCodes)
 * or if shipment touches any hub in the scoped list.
 */
export function isShipmentInHubScope(
  shipment: ShipmentListItemDto,
  scopedHubCodes: string[],
): boolean {
  if (!scopedHubCodes || scopedHubCodes.length === 0) {
    return true;
  }

  const allowedSet = new Set(scopedHubCodes.map(normalize));

  const codesToCheck = [
    shipment.senderHubCode,
    shipment.originHubCode,
    shipment.receiverHubCode,
    shipment.destinationHubCode,
  ].map(normalize).filter((c) => c.length > 0);

  return codesToCheck.some((c) => allowedSet.has(c));
}

/**
 * Aggregates shipments by child hubs for breakdown statistics (e.g. Ward breakdown for Province,
 * or Province breakdown for Region).
 */
export function groupShipmentsByChildHubs(
  shipments: ShipmentListItemDto[],
  childHubs: HubDto[],
  allHubs: HubDto[],
): HubBreakdownItem[] {
  if (childHubs.length === 0) {
    return [];
  }

  // Map each child hub to all descendant codes it covers
  const childHubCoverage = new Map<string, Set<string>>();

  const childrenMap = new Map<string, HubDto[]>();
  for (const h of allHubs) {
    const parent = normalize(h.parentCode);
    if (parent) {
      const list = childrenMap.get(parent) ?? [];
      list.push(h);
      childrenMap.set(parent, list);
    }
  }

  function getDescendantCodes(code: string): string[] {
    const direct = childrenMap.get(code) ?? [];
    const results: string[] = [];
    for (const d of direct) {
      const normD = normalize(d.code);
      results.push(normD);
      results.push(...getDescendantCodes(normD));
    }
    return results;
  }

  for (const child of childHubs) {
    const code = normalize(child.code);
    const covered = new Set<string>([code, ...getDescendantCodes(code)]);
    childHubCoverage.set(code, covered);
  }

  return childHubs.map((child) => {
    const code = normalize(child.code);
    const coveredSet = childHubCoverage.get(code) ?? new Set([code]);

    const matchingShipments = shipments.filter((s) => {
      const relatedCodes = [
        s.senderHubCode,
        s.originHubCode,
        s.receiverHubCode,
        s.destinationHubCode,
      ].map(normalize).filter((c) => c.length > 0);

      return relatedCodes.some((rc) => coveredSet.has(rc));
    });

    const total = matchingShipments.length;
    const delivered = matchingShipments.filter((s) => s.currentStatus === 'DELIVERED').length;
    const inTransit = matchingShipments.filter(
      (s) =>
        s.currentStatus === 'IN_TRANSIT' ||
        s.currentStatus === 'SCAN_INBOUND' ||
        s.currentStatus === 'TASK_ASSIGNED',
    ).length;
    const incidents = matchingShipments.filter(
      (s) =>
        s.currentStatus === 'NDR_CREATED' ||
        s.currentStatus === 'EXCEPTION' ||
        s.currentStatus === 'DELIVERY_FAILED',
    ).length;
    const successRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '100';

    return {
      hubCode: child.code,
      hubName: child.name,
      level: child.level ?? 3,
      totalShipments: total,
      deliveredCount: delivered,
      inTransitCount: inTransit,
      incidentCount: incidents,
      successRate,
    };
  });
}

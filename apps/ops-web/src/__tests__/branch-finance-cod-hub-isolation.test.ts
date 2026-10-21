import { describe, expect, it } from 'vitest';

interface ShipperUser {
  username: string;
  hubCodes: string[];
}

interface CodRecord {
  courierId: string;
  hubCode: string;
  codAmount: number;
  paymentMethod: 'COD' | 'BANK_TRANSFER';
}

function resolveIsolatedHubCouriers(
  selectedHubCodes: string[],
  shippers: ShipperUser[],
  cashRecords: CodRecord[],
  activeCourierFilter: string,
) {
  // 1. Filter registered shippers strictly by active hub codes
  const hubShippers = shippers.filter((user) => {
    if (selectedHubCodes.length === 0) return true;
    const userHubs = (user.hubCodes ?? []).map((h) => h.trim().toUpperCase());
    return userHubs.some((h) => selectedHubCodes.includes(h));
  });

  // 2. Build allowed courier set for this hub
  const hubCourierSet = new Set<string>();
  for (const user of hubShippers) {
    if (user.username) hubCourierSet.add(user.username);
  }
  for (const record of cashRecords) {
    if (selectedHubCodes.length === 0 || selectedHubCodes.includes(record.hubCode.trim().toUpperCase())) {
      hubCourierSet.add(record.courierId);
    }
  }

  // 3. Dropdown options
  const courierOptions = Array.from(hubCourierSet).sort();

  // 4. Summaries filtered strictly by hub and active filter
  const courierSummaries = Array.from(hubCourierSet)
    .filter((courierId) => {
      if (activeCourierFilter !== 'all' && courierId !== activeCourierFilter) {
        return false;
      }
      return true;
    })
    .map((courierId) => ({
      courierId,
      hubCode: selectedHubCodes[0] ?? 'ALL',
    }));

  return { courierOptions, courierSummaries, hubCourierSet };
}

describe('Branch Finance COD Settlement - Strict Hub Courier Isolation', () => {
  const MOCK_SHIPPERS: ShipperUser[] = [
    { username: 'courier_hcm_01', hubCodes: ['HCM-001'] },
    { username: 'courier_hcm_02', hubCodes: ['HCM-001'] },
    { username: 'courier_hcm_03', hubCodes: ['HCM-002'] },
    { username: 'courier_hanoi_01', hubCodes: ['HAN-001'] },
    { username: 'courier_danang_01', hubCodes: ['DAD-001'] },
  ];

  const MOCK_RECORDS: CodRecord[] = [
    { courierId: 'courier_hcm_01', hubCode: 'HCM-001', codAmount: 500000, paymentMethod: 'COD' },
    { courierId: 'courier_hanoi_01', hubCode: 'HAN-001', codAmount: 750000, paymentMethod: 'COD' },
  ];

  it('only shows couriers belonging to HCM-001 when HCM-001 is selected', () => {
    const result = resolveIsolatedHubCouriers(['HCM-001'], MOCK_SHIPPERS, MOCK_RECORDS, 'all');

    // Dropdown options must only contain HCM-001 couriers
    expect(result.courierOptions).toEqual(['courier_hcm_01', 'courier_hcm_02']);
    expect(result.courierOptions).not.toContain('courier_hanoi_01');
    expect(result.courierOptions).not.toContain('courier_danang_01');
    expect(result.courierOptions).not.toContain('courier_hcm_03');

    // Summaries table must only contain HCM-001 couriers
    const summaryCourierIds = result.courierSummaries.map((s) => s.courierId);
    expect(summaryCourierIds).toEqual(['courier_hcm_01', 'courier_hcm_02']);
    expect(summaryCourierIds).not.toContain('courier_hanoi_01');
    expect(summaryCourierIds).not.toContain('courier_danang_01');
  });

  it('only shows couriers belonging to HAN-001 when HAN-001 is selected', () => {
    const result = resolveIsolatedHubCouriers(['HAN-001'], MOCK_SHIPPERS, MOCK_RECORDS, 'all');

    expect(result.courierOptions).toEqual(['courier_hanoi_01']);
    expect(result.courierOptions).not.toContain('courier_hcm_01');

    const summaryCourierIds = result.courierSummaries.map((s) => s.courierId);
    expect(summaryCourierIds).toEqual(['courier_hanoi_01']);
  });

  it('respects courierId filter when a specific courier is selected in that hub', () => {
    const result = resolveIsolatedHubCouriers(
      ['HCM-001'],
      MOCK_SHIPPERS,
      MOCK_RECORDS,
      'courier_hcm_01',
    );

    expect(result.courierOptions).toContain('courier_hcm_01');
    expect(result.courierOptions).toContain('courier_hcm_02');

    const summaryCourierIds = result.courierSummaries.map((s) => s.courierId);
    expect(summaryCourierIds).toEqual(['courier_hcm_01']);
  });
});

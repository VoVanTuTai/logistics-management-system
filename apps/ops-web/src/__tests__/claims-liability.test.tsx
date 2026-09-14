import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  adjudicateClaim,
  approveCompensationPayment,
  calculateHubStatistics,
  calculateMonthlyTrend,
  calculateRootCauseBreakdown,
  readClaims,
  settleClaimDeduction,
  writeClaims,
} from '../features/claims/claims.data';
import type { CompensationClaim } from '../features/claims/claims.types';
import ClaimsLiabilityManagementPage from '../pages/function-groups/service-quality/claims/ClaimsLiabilityManagementPage';
import HubCompensationStatisticsPage from '../pages/function-groups/service-quality/claims/HubCompensationStatisticsPage';

describe('Claims & Liability Business Flow & Analytics Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('calculates initial hub statistics and root causes correctly from seed data', () => {
    const claims = readClaims();
    expect(claims.length).toBeGreaterThanOrEqual(6);

    const hubStats = calculateHubStatistics(claims);
    expect(hubStats.length).toBeGreaterThan(0);
    const hcmHub = hubStats.find((h) => h.hubCode === 'HCM01');
    expect(hcmHub).toBeDefined();
    expect(hcmHub?.totalShipmentsHandled).toBe(24800);

    const rootCauses = calculateRootCauseBreakdown(claims);
    expect(rootCauses.length).toBe(6);
    const totalPercentage = rootCauses.reduce((sum, r) => sum + r.percentage, 0);
    expect(totalPercentage).toBeGreaterThan(95);

    const trends = calculateMonthlyTrend();
    expect(trends.length).toBe(6);
  });

  it('supports adjudication, compensation approval, and deduction settlement', () => {
    const claims = readClaims();
    const target = claims[5]; // clm-006 is PENDING_INSPECTION

    // 1. Adjudicate
    const adjudicatedList = adjudicateClaim(target.id, {
      responsibleParty: 'ORIGIN_HUB',
      responsibleEntityCode: 'HCM01',
      responsibleEntityName: 'Hub HCM 01 (Bàn kiểm hàng)',
      liabilityRatioPercent: 100,
      rootCause: 'ROUGH_HANDLING_STACKING',
      approvedCompensationAmount: 12000000,
      penaltyAmount: 12000000,
      adjudicationNotes: 'Kiểm tra camera bàn dỡ phát hiện nhân viên ném kiện màn hình.',
      adjudicatedBy: 'Test QA Inspector',
    });

    const updated = adjudicatedList.find((c) => c.id === target.id);
    expect(updated?.status).toBe('LIABILITY_DETERMINED');
    expect(updated?.responsibleEntityCode).toBe('HCM01');
    expect(updated?.approvedCompensationAmount).toBe(12000000);

    // 2. Approve Compensation Payment to merchant
    const approvedList = approveCompensationPayment(target.id);
    const approved = approvedList.find((c) => c.id === target.id);
    expect(approved?.status).toBe('APPROVED_COMPENSATION');
    expect(approved?.merchantPaidAt).toBeDefined();

    // 3. Settle Hub Deduction
    const settledList = settleClaimDeduction(target.id);
    const settled = settledList.find((c) => c.id === target.id);
    expect(settled?.status).toBe('SETTLED');
    expect(settled?.hubDeductedAt).toBeDefined();
  });

  it('renders ClaimsLiabilityManagementPage with table, KPI cards, and filter interaction', () => {
    render(<ClaimsLiabilityManagementPage />);

    // Header & KPIs
    expect(
      screen.getByRole('heading', { name: /Hồ sơ Bồi thường & Phân định Trách nhiệm/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tổng hồ sơ khiếu nại/i)).toBeInTheDocument();
    expect(screen.getByText(/Chờ giám định & Quy lỗi/i)).toBeInTheDocument();
    expect(screen.getByText(/Tiền đền bù đã duyệt/i)).toBeInTheDocument();

    // Table rows
    expect(screen.getByText('CLM-202609-001')).toBeInTheDocument();
    expect(screen.getByText('NXS000108')).toBeInTheDocument();

    // Filter by type
    const incidentSelect = screen.getByLabelText('Loại sự cố');
    fireEvent.change(incidentSelect, { target: { value: 'DAMAGED' } });
    expect(screen.getByText('CLM-202609-001')).toBeInTheDocument();
  });

  it('renders HubCompensationStatisticsPage with network KPIs and hub table', () => {
    render(<HubCompensationStatisticsPage />);

    // Header & Title
    expect(
      screen.getByRole('heading', { name: /Thống Kê Bồi Thường Theo Hub & Báo Cáo Rủi Ro/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tỷ Lệ Hỏng & Mất \(Toàn Mạng\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Tỷ Lệ Thu Hồi Chế Tài/i)).toBeInTheDocument();

    // Search and Table
    expect(screen.getByPlaceholderText(/Tìm Hub theo mã, tên, vùng/i)).toBeInTheDocument();
    expect(screen.getByText('Hub Hà Nội 01 (Hoàn Kiếm)')).toBeInTheDocument();
    expect(screen.getAllByText('Hub Hồ Chí Minh 01 (Quận 1)').length).toBeGreaterThanOrEqual(1);
  });
});

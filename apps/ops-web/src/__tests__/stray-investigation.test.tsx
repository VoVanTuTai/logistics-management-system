import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readClaims } from '../features/claims/claims.data';
import {
  escalateToCompensationClaim,
  extendHearingDeadline,
  readInvestigations,
  resolveAsFound,
  submitDisputeEvidence,
} from '../features/investigation/investigation.data';
import StrayShipmentInvestigationPage from '../pages/function-groups/service-quality/investigation/StrayShipmentInvestigationPage';

describe('Stray & Lost Shipment Investigation Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('reads initial seed investigations and identifies break points accurately', () => {
    const cases = readInvestigations();
    expect(cases.length).toBeGreaterThanOrEqual(5);

    const staleCase = cases.find((c) => c.breakPointType === 'WAREHOUSE_STALE_LOSS');
    expect(staleCase).toBeDefined();
    expect(staleCase?.preliminaryReport.confidenceScorePercent).toBeGreaterThanOrEqual(80);

    const linehaulCase = cases.find((c) => c.breakPointType === 'LINEHAUL_IN_TRANSIT_LOSS');
    expect(linehaulCase).toBeDefined();
    expect(linehaulCase?.auditTrail.some((s) => s.isBreakPoint)).toBe(true);
  });

  it('allows submitting CCTV dispute evidence and extending hearing deadline', () => {
    const cases = readInvestigations();
    const target = cases[0];

    // 1. Extend hearing deadline
    const extended = extendHearingDeadline(target.id, 12);
    const updatedTarget = extended.find((c) => c.id === target.id);
    expect(updatedTarget?.hearingDeadlineAt).toBeDefined();

    // 2. Submit CCTV dispute evidence
    const withEvidence = submitDisputeEvidence(target.id, {
      submittedBy: 'Nguyễn Tấn Dũng (Thủ kho)',
      partyCode: 'DN01',
      partyName: 'Hub Đà Nẵng',
      cctvVideoUrl: 'https://cctv.local/video-123.mp4',
      cctvTimestampRange: '02:15 - 03:00 07/09',
      notes: 'Camera góc quay cửa số 2 cho thấy bao tải đã được chuyển tiếp.',
    });

    const refreshed = withEvidence.find((c) => c.id === target.id);
    expect(refreshed?.disputeEvidences.length).toBeGreaterThanOrEqual(1);
    expect(refreshed?.disputeEvidences[0].cctvVideoUrl).toBe('https://cctv.local/video-123.mp4');
  });

  it('supports resolving stray shipment as found in warehouse (saving compensation cost)', () => {
    const cases = readInvestigations();
    const target = cases[0];

    const resolvedList = resolveAsFound(target.id, {
      foundLocation: 'Sau kệ Pallet Khu E4',
      resolutionNote: 'Đã tìm thấy nguyên vẹn túi khí.',
      operator: 'Phạm Văn Nam',
    });

    const resolved = resolvedList.find((c) => c.id === target.id);
    expect(resolved?.status).toBe('RESOLVED_FOUND');
    expect(resolved?.foundLocation).toBe('Sau kệ Pallet Khu E4');
    expect(resolved?.closedAt).toBeDefined();
    expect(resolved?.auditTrail.some((s) => s.action.includes('Đã tìm thấy hàng'))).toBe(true);
  });

  it('escalates investigation into CompensationClaim with liability assigned', () => {
    const cases = readInvestigations();
    const target = cases[1]; // INV-202609-002

    const initialClaimsCount = readClaims().length;

    const { updatedInvestigations, createdClaim } = escalateToCompensationClaim(target.id, {
      adjudicator: 'Trần Minh Tuấn (QA Lead)',
      finalNotes: 'Đã hết 24h giải trình, lái xe không chứng minh được tính nguyên vẹn của kẹp chì.',
    });

    const escalatedCase = updatedInvestigations.find((c) => c.id === target.id);
    expect(escalatedCase?.status).toBe('ESCALATED_TO_CLAIM');
    expect(escalatedCase?.linkedClaimCode).toBe(createdClaim.claimCode);

    // Verify claim exists in Claims storage
    const allClaims = readClaims();
    expect(allClaims.length).toBe(initialClaimsCount + 1);
    const linkedClaim = allClaims.find((c) => c.claimCode === createdClaim.claimCode);
    expect(linkedClaim).toBeDefined();
    expect(linkedClaim?.status).toBe('LIABILITY_DETERMINED');
    expect(linkedClaim?.responsibleParty).toBe('LINEHAUL_FLEET');
  });

  it('renders StrayShipmentInvestigationPage with KPIs, Master List, and Audit Domino Timeline', () => {
    render(<StrayShipmentInvestigationPage />);

    // Header and KPIs
    expect(
      screen.getByRole('heading', { name: /Trung Tâm Giám Định Đơn Lạc & Phân Tích Vết Quét/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tổng Vụ Việc Đang Xử Lý/i)).toBeInTheDocument();
    expect(screen.getByText(/Đang Mở Giải Trình 24h/i)).toBeInTheDocument();
    expect(screen.getByText(/Tỷ Lệ Tìm Thấy Hàng/i)).toBeInTheDocument();

    // Master List and Case details
    expect(screen.getByText('INV-202609-001')).toBeInTheDocument();
    expect(screen.getAllByText('NXS000789').length).toBeGreaterThanOrEqual(1);

    // Preliminary Report and Timeline
    expect(screen.getByText(/Báo Cáo Giám Định Sơ Bộ/i)).toBeInTheDocument();
    expect(screen.getByText(/Chuỗi Vết Quét Thao Tác/i)).toBeInTheDocument();
    expect(screen.getByText(/Bằng Chứng Phản Biện & Video Camera CCTV/i)).toBeInTheDocument();

    // Filter interaction
    const searchInput = screen.getByPlaceholderText(/Tìm mã hồ sơ, mã đơn, khách hàng/i);
    fireEvent.change(searchInput, { target: { value: 'NXS000789' } });
    expect(screen.getByText('INV-202609-001')).toBeInTheDocument();
  });
});

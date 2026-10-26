import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Gavel,
  RotateCcw,
  Scale,
  SlidersHorizontal,
  X,
} from 'lucide-react';

import {
  CLAIM_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
  RESPONSIBLE_PARTY_LABELS,
  ROOT_CAUSE_LABELS,
} from '../../../../features/claims/claims.data';
import type {
  ClaimStatus,
  CompensationClaim,
  IncidentType,
  ResponsiblePartyType,
} from '../../../../features/claims/claims.types';
import { useResizableColumns } from '../../../../hooks/useResizableColumns';
import { useTableColumnVisibility } from '../../../../hooks/useTableColumnVisibility';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import { TableColumnPicker } from '../../../shared/TableColumnPicker';

export type ClaimsColumnKey =
  | 'stt'
  | 'claimCode'
  | 'shipmentCode'
  | 'customer'
  | 'route'
  | 'incidentType'
  | 'insurance'
  | 'claimAmount'
  | 'approvedAmount'
  | 'responsible'
  | 'penaltyAmount'
  | 'rootCause'
  | 'status'
  | 'actions';

export const DEFAULT_CLAIMS_COL_WIDTHS: Record<ClaimsColumnKey, number> = {
  stt: 48,
  claimCode: 155,
  shipmentCode: 145,
  customer: 160,
  route: 130,
  incidentType: 155,
  insurance: 140,
  claimAmount: 135,
  approvedAmount: 135,
  responsible: 195,
  penaltyAmount: 125,
  rootCause: 165,
  status: 140,
  actions: 135,
};

export const MIN_CLAIMS_COL_WIDTHS: Record<ClaimsColumnKey, number> = {
  stt: 42,
  claimCode: 130,
  shipmentCode: 125,
  customer: 125,
  route: 105,
  incidentType: 125,
  insurance: 110,
  claimAmount: 110,
  approvedAmount: 110,
  responsible: 145,
  penaltyAmount: 105,
  rootCause: 130,
  status: 115,
  actions: 115,
};

export const CLAIMS_COLUMN_LABELS: Record<ClaimsColumnKey, string> = {
  stt: 'STT',
  claimCode: 'Mã hồ sơ & Ngày lập',
  shipmentCode: 'Mã vận đơn',
  customer: 'Khách hàng / Người gửi',
  route: 'Tuyến vận chuyển',
  incidentType: 'Loại sự cố tổn thất',
  insurance: 'Bảo hiểm & Khai giá',
  claimAmount: 'Số tiền yêu cầu',
  approvedAmount: 'Số tiền duyệt đền',
  responsible: 'Đơn vị chịu trách nhiệm & Tỷ lệ',
  penaltyAmount: 'Phạt khấu trừ',
  rootCause: 'Nguyên nhân tổn thất',
  status: 'Trạng thái xử lý',
  actions: 'Hành động',
};

export const DEFAULT_VISIBLE_CLAIMS_COLUMNS: Record<ClaimsColumnKey, boolean> = {
  stt: true,
  claimCode: true,
  shipmentCode: true,
  customer: true,
  route: false,
  incidentType: true,
  insurance: false,
  claimAmount: true,
  approvedAmount: true,
  responsible: true,
  penaltyAmount: false,
  rootCause: false,
  status: true,
  actions: true,
};

const STORAGE_CLAIMS_VISIBILITY_KEY = 'nexus_claims_table_col_visibility_v1';
const STORAGE_CLAIMS_WIDTHS_KEY = 'nexus_claims_table_col_widths_v1';

function formatCurrency(amount: number | null | undefined): string {
  return `${new Intl.NumberFormat('vi-VN').format(Math.max(0, amount ?? 0))} đ`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? dateStr : d.toLocaleString('vi-VN');
}

/**
 * Xuất dữ liệu bảng bồi thường sang định dạng Excel/CSV hỗ trợ UTF-8 BOM chuẩn
 */
export function exportClaimsToExcel(claimsToExport: CompensationClaim[], filename = 'ho-so-boi-thuong-clm.csv'): void {
  const headers = [
    'Mã hồ sơ',
    'Mã vận đơn',
    'Ngày lập',
    'Người gửi / Khách hàng',
    'Số điện thoại',
    'Hub gửi',
    'Hub phát',
    'Loại sự cố',
    'Mô tả hàng hóa',
    'Mô tả hư hỏng',
    'Gói bảo hiểm',
    'Biên bản miễn trừ đóng gói',
    'Giá trị khai báo (đ)',
    'Cước vận chuyển (đ)',
    'Số tiền yêu cầu bồi thường (đ)',
    'Số tiền bồi thường được duyệt (đ)',
    'Bên chịu trách nhiệm',
    'Mã đơn vị chịu lỗi',
    'Tên đơn vị chịu lỗi',
    'Tỷ lệ chịu phạt (%)',
    'Số tiền phạt khấu trừ (đ)',
    'Nguyên nhân tổn thất',
    'Trạng thái hồ sơ',
    'Ngày chi tiền bồi thường',
    'Ngày khấu trừ chế tài',
    'Người giám định',
    'Ghi chú phán quyết',
  ];

  const rows = claimsToExport.map((c) => {
    return [
      `"${c.claimCode}"`,
      `"${c.shipmentCode}"`,
      `"${formatDate(c.reportedAt)}"`,
      `"${(c.customerName || 'Khách hàng').replace(/"/g, '""')}"`,
      `"${c.customerPhone || ''}"`,
      `"${c.originHubCode || ''}"`,
      `"${c.destinationHubCode || ''}"`,
      `"${INCIDENT_TYPE_LABELS[c.incidentType] || c.incidentType}"`,
      `"${(c.packageDescription || '').replace(/"/g, '""')}"`,
      `"${(c.damageDescription || '').replace(/"/g, '""')}"`,
      `"${c.insuranceTier === 'COMPREHENSIVE_100' ? 'Bảo hiểm Toàn diện 100%' : 'Tiêu chuẩn không BH'}"`,
      `"${c.packagingWaiver ? 'CÓ (Miễn trừ trách nhiệm)' : 'KHÔNG'}"`,
      c.declaredValue || 0,
      c.shippingFee || 0,
      c.claimRequestedAmount || 0,
      c.approvedCompensationAmount || 0,
      `"${RESPONSIBLE_PARTY_LABELS[c.responsibleParty] || c.responsibleParty}"`,
      `"${c.responsibleEntityCode || ''}"`,
      `"${(c.responsibleEntityName || '').replace(/"/g, '""')}"`,
      c.liabilityRatioPercent || 0,
      c.penaltyAmount || 0,
      `"${ROOT_CAUSE_LABELS[c.rootCause || 'PACKAGING_SOP_VIOLATION'] || ''}"`,
      `"${CLAIM_STATUS_LABELS[c.status] || c.status}"`,
      `"${c.merchantPaidAt ? formatDate(c.merchantPaidAt) : ''}"`,
      `"${c.hubDeductedAt ? formatDate(c.hubDeductedAt) : ''}"`,
      `"${c.adjudicatedBy || ''}"`,
      `"${(c.adjudicationNotes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const bom = '\uFEFF';
  const csvContent = bom + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface ClaimsLiabilityTableProps {
  claims: CompensationClaim[];
  selectedClaim: CompensationClaim | null;
  onOpenInspection: (claim: CompensationClaim, editMode: boolean) => void;
  onApprovePayment: (claimId: string) => void;
  onSettle: (claimId: string) => void;
  onBatchApprove?: (claimIds: string[]) => void;
  onBatchSettle?: (claimIds: string[]) => void;
  isLoading?: boolean;
}

export function ClaimsLiabilityTable({
  claims,
  selectedClaim,
  onOpenInspection,
  onApprovePayment,
  onSettle,
  onBatchApprove,
  onBatchSettle,
  isLoading,
}: ClaimsLiabilityTableProps): React.JSX.Element {
  // Column Visibility
  const {
    visibleColumns,
    isColPickerOpen,
    setIsColPickerOpen,
    toggleColumn,
    setAllColumns,
    resetColumns,
    visibleCount,
    totalColCount,
  } = useTableColumnVisibility<ClaimsColumnKey>({
    storageKey: STORAGE_CLAIMS_VISIBILITY_KEY,
    defaultVisibility: DEFAULT_VISIBLE_CLAIMS_COLUMNS,
  });

  // Resizable columns
  const { widths, handleMouseDown, resetColumnWidth } = useResizableColumns(
    STORAGE_CLAIMS_WIDTHS_KEY,
    DEFAULT_CLAIMS_COL_WIDTHS,
    MIN_CLAIMS_COL_WIDTHS
  );

  // Row selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.max(1, Math.ceil(claims.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const currentRows = useMemo(() => {
    return claims.slice(startIndex, startIndex + pageSize);
  }, [claims, startIndex, pageSize]);

  const allCurrentSelected =
    currentRows.length > 0 && currentRows.every((row) => selectedIds.includes(row.id));
  const someCurrentSelected =
    currentRows.some((row) => selectedIds.includes(row.id)) && !allCurrentSelected;

  const handleToggleAllCurrent = (checked: boolean) => {
    if (checked) {
      const currentIds = currentRows.map((r) => r.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    } else {
      const currentIdSet = new Set(currentRows.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !currentIdSet.has(id)));
    }
  };

  const handleToggleRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(claims.map((c) => c.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleExportSelected = () => {
    const selectedClaims = claims.filter((c) => selectedIds.includes(c.id));
    exportClaimsToExcel(
      selectedClaims.length > 0 ? selectedClaims : claims,
      `ho-so-boi-thuong-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  // Eligible claims for batch actions
  const selectedClaimsList = useMemo(() => {
    return claims.filter((c) => selectedIds.includes(c.id));
  }, [claims, selectedIds]);

  const eligibleForBatchApprove = useMemo(() => {
    return selectedClaimsList.filter((c) => c.status === 'LIABILITY_DETERMINED').map((c) => c.id);
  }, [selectedClaimsList]);

  const eligibleForBatchSettle = useMemo(() => {
    return selectedClaimsList.filter((c) => c.status === 'APPROVED_COMPENSATION').map((c) => c.id);
  }, [selectedClaimsList]);

  return (
    <div className="claims-table-wrapper-card">
      {/* Table Toolbar Header */}
      <div className="claims-table-toolbar">
        <div className="claims-toolbar-left">
          <span className="claims-count-text">
            Hiển thị <strong>{claims.length}</strong> hồ sơ bồi thường
          </span>
          {claims.length > 0 && (
            <button
              type="button"
              className="claims-btn-excel"
              onClick={() => exportClaimsToExcel(claims)}
              title="Xuất toàn bộ kết quả lọc ra file Excel (.csv)"
            >
              <Download size={13} />
              <span>Xuất Excel ({claims.length})</span>
            </button>
          )}
        </div>

        <TableColumnPicker
          columnLabels={CLAIMS_COLUMN_LABELS}
          visibleColumns={visibleColumns}
          isOpen={isColPickerOpen}
          onToggleOpen={() => setIsColPickerOpen(!isColPickerOpen)}
          onClose={() => setIsColPickerOpen(false)}
          onToggleColumn={toggleColumn}
          onSetAll={setAllColumns}
          onReset={resetColumns}
          visibleCount={visibleCount}
          totalCount={totalColCount}
          classNamePrefix="claims"
        />
      </div>

      {/* Batch Selection Strip */}
      {selectedIds.length > 0 && (
        <div className="claims-selection-strip">
          <div className="claims-selection-info">
            <span className="claims-selection-badge">
              ✓ Đã chọn: <strong>{selectedIds.length}</strong> hồ sơ
            </span>
            {selectedIds.length < claims.length && (
              <button
                type="button"
                className="claims-link-underline"
                onClick={handleSelectAllFiltered}
              >
                Chọn tất cả {claims.length} hồ sơ trong danh sách lọc
              </button>
            )}
          </div>

          <div className="claims-selection-actions">
            {eligibleForBatchApprove.length > 0 && onBatchApprove && (
              <button
                type="button"
                className="claims-btn-batch-approve"
                onClick={() => onBatchApprove(eligibleForBatchApprove)}
              >
                <CheckCircle2 size={13} />
                <span>Duyệt chi {eligibleForBatchApprove.length} hồ sơ</span>
              </button>
            )}

            {eligibleForBatchSettle.length > 0 && onBatchSettle && (
              <button
                type="button"
                className="claims-btn-batch-settle"
                onClick={() => onBatchSettle(eligibleForBatchSettle)}
              >
                <DollarSign size={13} />
                <span>Khấu trừ {eligibleForBatchSettle.length} hồ sơ</span>
              </button>
            )}

            <button
              type="button"
              className="claims-btn-batch-export"
              onClick={handleExportSelected}
            >
              <Download size={13} />
              <span>Xuất Excel {selectedIds.length} hồ sơ đã chọn</span>
            </button>

            <button
              type="button"
              className="claims-btn-batch-clear"
              onClick={handleClearSelection}
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Table Shell with Sticky Header & Resizable Columns */}
      <div className="claims-table-shell">
        <table className="claims-universal-table">
          <thead>
            <tr>
              {/* Select Checkbox */}
              <th className="claims-th-select" style={{ width: 44, minWidth: 44, maxWidth: 44 }}>
                <input
                  type="checkbox"
                  aria-label="Chọn tất cả hồ sơ trên trang hiện tại"
                  checked={allCurrentSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someCurrentSelected;
                  }}
                  onChange={(e) => handleToggleAllCurrent(e.target.checked)}
                />
              </th>

              {/* STT */}
              {visibleColumns.stt && (
                <th
                  style={{
                    width: widths.stt,
                    minWidth: widths.stt,
                    maxWidth: widths.stt,
                    textAlign: 'center',
                  }}
                >
                  <span>{CLAIMS_COLUMN_LABELS.stt}</span>
                  <span
                    className="table-col-resizer"
                    title="Kéo chuột để chỉnh độ rộng (Nhấp đúp để đặt lại)"
                    onMouseDown={(e) => handleMouseDown('stt', e)}
                    onDoubleClick={() => resetColumnWidth('stt')}
                  />
                </th>
              )}

              {/* Claim Code & Date */}
              {visibleColumns.claimCode && (
                <th
                  style={{
                    width: widths.claimCode,
                    minWidth: widths.claimCode,
                    maxWidth: widths.claimCode,
                  }}
                >
                  <span>{CLAIMS_COLUMN_LABELS.claimCode}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('claimCode', e)}
                    onDoubleClick={() => resetColumnWidth('claimCode')}
                  />
                </th>
              )}

              {/* Shipment Code */}
              {visibleColumns.shipmentCode && (
                <th
                  style={{
                    width: widths.shipmentCode,
                    minWidth: widths.shipmentCode,
                    maxWidth: widths.shipmentCode,
                  }}
                >
                  <span>{CLAIMS_COLUMN_LABELS.shipmentCode}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('shipmentCode', e)}
                    onDoubleClick={() => resetColumnWidth('shipmentCode')}
                  />
                </th>
              )}

              {/* Customer */}
              {visibleColumns.customer && (
                <th
                  style={{
                    width: widths.customer,
                    minWidth: widths.customer,
                    maxWidth: widths.customer,
                  }}
                >
                  <span>{CLAIMS_COLUMN_LABELS.customer}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('customer', e)}
                    onDoubleClick={() => resetColumnWidth('customer')}
                  />
                </th>
              )}

              {/* Route */}
              {visibleColumns.route && (
                <th
                  style={{
                    width: widths.route,
                    minWidth: widths.route,
                    maxWidth: widths.route,
                  }}
                >
                  <span>{CLAIMS_COLUMN_LABELS.route}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('route', e)}
                    onDoubleClick={() => resetColumnWidth('route')}
                  />
                </th>
              )}

              {/* Incident Type */}
              {visibleColumns.incidentType && (
                <th
                  style={{
                    width: widths.incidentType,
                    minWidth: widths.incidentType,
                    maxWidth: widths.incidentType,
                  }}
                >
                  <span>{CLAIMS_COLUMN_LABELS.incidentType}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('incidentType', e)}
                    onDoubleClick={() => resetColumnWidth('incidentType')}
                  />
                </th>
              )}

              {/* Insurance */}
              {visibleColumns.insurance && (
                <th
                  style={{
                    width: widths.insurance,
                    minWidth: widths.insurance,
                    maxWidth: widths.insurance,
                  }}
                >
                  <span>{CLAIMS_COLUMN_LABELS.insurance}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('insurance', e)}
                    onDoubleClick={() => resetColumnWidth('insurance')}
                  />
                </th>
              )}

              {/* Claim Amount */}
              {visibleColumns.claimAmount && (
                <th
                  style={{
                    width: widths.claimAmount,
                    minWidth: widths.claimAmount,
                    maxWidth: widths.claimAmount,
                  }}
                >
                  <span>{CLAIMS_COLUMN_LABELS.claimAmount}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('claimAmount', e)}
                    onDoubleClick={() => resetColumnWidth('claimAmount')}
                  />
                </th>
              )}

              {/* Approved Amount */}
              {visibleColumns.approvedAmount && (
                <th
                  style={{
                    width: widths.approvedAmount,
                    minWidth: widths.approvedAmount,
                    maxWidth: widths.approvedAmount,
                  }}
                >
                  <span>{CLAIMS_COLUMN_LABELS.approvedAmount}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('approvedAmount', e)}
                    onDoubleClick={() => resetColumnWidth('approvedAmount')}
                  />
                </th>
              )}

              {/* Responsible Entity */}
              {visibleColumns.responsible && (
                <th
                  style={{
                    width: widths.responsible,
                    minWidth: widths.responsible,
                    maxWidth: widths.responsible,
                  }}
                >
                  <span>{CLAIMS_COLUMN_LABELS.responsible}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('responsible', e)}
                    onDoubleClick={() => resetColumnWidth('responsible')}
                  />
                </th>
              )}

              {/* Penalty Amount */}
              {visibleColumns.penaltyAmount && (
                <th
                  style={{
                    width: widths.penaltyAmount,
                    minWidth: widths.penaltyAmount,
                    maxWidth: widths.penaltyAmount,
                  }}
                >
                  <span>{CLAIMS_COLUMN_LABELS.penaltyAmount}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('penaltyAmount', e)}
                    onDoubleClick={() => resetColumnWidth('penaltyAmount')}
                  />
                </th>
              )}

              {/* Root Cause */}
              {visibleColumns.rootCause && (
                <th
                  style={{
                    width: widths.rootCause,
                    minWidth: widths.rootCause,
                    maxWidth: widths.rootCause,
                  }}
                >
                  <span>{CLAIMS_COLUMN_LABELS.rootCause}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('rootCause', e)}
                    onDoubleClick={() => resetColumnWidth('rootCause')}
                  />
                </th>
              )}

              {/* Status */}
              {visibleColumns.status && (
                <th
                  style={{
                    width: widths.status,
                    minWidth: widths.status,
                    maxWidth: widths.status,
                  }}
                >
                  <span>{CLAIMS_COLUMN_LABELS.status}</span>
                  <span
                    className="table-col-resizer"
                    onMouseDown={(e) => handleMouseDown('status', e)}
                    onDoubleClick={() => resetColumnWidth('status')}
                  />
                </th>
              )}

              {/* Actions */}
              {visibleColumns.actions && (
                <th
                  style={{
                    width: widths.actions,
                    minWidth: widths.actions,
                    maxWidth: widths.actions,
                    textAlign: 'right',
                  }}
                >
                  <span>{CLAIMS_COLUMN_LABELS.actions}</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading && claims.length === 0 ? (
              <tr>
                <td colSpan={visibleCount + 1} style={{ textAlign: 'center', padding: '60px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div className="claims-spinner" />
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                      Đang tải danh sách hồ sơ bồi thường...
                    </span>
                  </div>
                </td>
              </tr>
            ) : currentRows.length === 0 ? (
              <tr>
                <td colSpan={visibleCount + 1} style={{ textAlign: 'center', padding: '60px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <FileCheck size={36} color="#94a3b8" />
                    <span style={{ fontSize: 13.5, color: '#475569', fontWeight: 600 }}>
                      Không có hồ sơ đền bù nào phù hợp với bộ lọc hiện tại.
                    </span>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn tab quy trình khác.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              currentRows.map((claim, idx) => {
                const isSelected = selectedIds.includes(claim.id);
                const isCurrentActive = selectedClaim?.id === claim.id;
                const isPending =
                  claim.status === 'PENDING_INSPECTION' || claim.status === 'DRAFT';
                const isAdjudicated = claim.status === 'LIABILITY_DETERMINED';
                const isApproved = claim.status === 'APPROVED_COMPENSATION';
                const isSettled = claim.status === 'SETTLED';
                const rowStt = startIndex + idx + 1;

                return (
                  <tr
                    key={claim.id}
                    className={`claims-table-row ${isCurrentActive ? 'claims-row-active' : ''} ${
                      isSelected ? 'claims-row-selected' : ''
                    }`}
                    onClick={() => onOpenInspection(claim, false)}
                  >
                    {/* Checkbox */}
                    <td className="claims-td-select" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleToggleRow(claim.id, e.target.checked)}
                      />
                    </td>

                    {/* STT */}
                    {visibleColumns.stt && (
                      <td style={{ textAlign: 'center', color: '#64748b', fontSize: 12, fontWeight: 600 }}>
                        {rowStt}
                      </td>
                    )}

                    {/* Claim Code & Time */}
                    {visibleColumns.claimCode && (
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                          <span className="claims-code-mono" title="Bấm để xem chi tiết hồ sơ">
                            {claim.claimCode}
                          </span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>
                            ({formatDate(claim.reportedAt)})
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Shipment Code */}
                    {visibleColumns.shipmentCode && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <CopyableShipmentCode code={claim.shipmentCode} />
                      </td>
                    )}

                    {/* Customer */}
                    {visibleColumns.customer && (
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 12.5 }}>
                            {claim.customerName || 'Khách hàng'}
                          </span>
                          {claim.customerPhone && (
                            <>
                              <span style={{ color: '#94a3b8' }}>•</span>
                              <span style={{ fontSize: 11, color: '#64748b' }}>
                                {claim.customerPhone}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Route */}
                    {visibleColumns.route && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#334155' }}>
                          <span>{claim.originHubCode}</span>
                          <span style={{ color: '#94a3b8' }}>→</span>
                          <span>{claim.destinationHubCode}</span>
                        </div>
                      </td>
                    )}

                    {/* Incident Type */}
                    {visibleColumns.incidentType && (
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                          <span
                            className={`claims-incident-tag ${
                              claim.incidentType === 'DAMAGED'
                                ? 'incident-damaged'
                                : 'incident-lost'
                            }`}
                            title={claim.packageDescription || undefined}
                          >
                            {INCIDENT_TYPE_LABELS[claim.incidentType] || claim.incidentType}
                          </span>
                          {claim.packageDescription && (
                            <span className="claims-pkg-subtext" title={claim.packageDescription}>
                              {claim.packageDescription}
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Insurance */}
                    {visibleColumns.insurance && (
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: claim.insuranceTier === 'COMPREHENSIVE_100' ? '#166534' : '#475569' }}>
                            {claim.insuranceTier === 'COMPREHENSIVE_100' ? 'BH 100%' : 'Chuẩn'}
                          </span>
                          {claim.declaredValue > 0 && (
                            <span style={{ fontSize: 10.5, color: '#64748b' }}>
                              ({formatCurrency(claim.declaredValue)})
                            </span>
                          )}
                          {claim.packagingWaiver && (
                            <span style={{ fontSize: 10, color: '#b91c1c', fontWeight: 600 }} title="Miễn trừ đóng gói">
                              [Miễn trừ]
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Claim Amount */}
                    {visibleColumns.claimAmount && (
                      <td>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 12.5 }}>
                          {formatCurrency(claim.claimRequestedAmount)}
                        </span>
                      </td>
                    )}

                    {/* Approved Amount */}
                    {visibleColumns.approvedAmount && (
                      <td>
                        {claim.approvedCompensationAmount > 0 ? (
                          <span style={{ fontWeight: 700, color: '#047857', fontSize: 12.5 }}>
                            {formatCurrency(claim.approvedCompensationAmount)}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 11.5 }}>Chưa duyệt</span>
                        )}
                      </td>
                    )}

                    {/* Responsible Entity */}
                    {visibleColumns.responsible && (
                      <td>
                        {claim.responsibleParty === 'UNASSIGNED' ? (
                          <span className="claims-unassigned-badge">Chưa phân định</span>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 12 }}>
                              {claim.responsibleEntityName || claim.responsibleEntityCode}
                            </span>
                            <span style={{ fontSize: 11, color: '#64748b' }}>
                              ({claim.liabilityRatioPercent}%)
                            </span>
                            {claim.penaltyAmount > 0 && (
                              <span style={{ color: '#b91c1c', fontWeight: 600, fontSize: 11 }}>
                                -{formatCurrency(claim.penaltyAmount)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    )}

                    {/* Penalty Amount */}
                    {visibleColumns.penaltyAmount && (
                      <td>
                        {claim.penaltyAmount > 0 ? (
                          <span style={{ fontWeight: 600, color: '#b91c1c', fontSize: 12 }}>
                            {formatCurrency(claim.penaltyAmount)}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 11.5 }}>---</span>
                        )}
                      </td>
                    )}

                    {/* Root Cause */}
                    {visibleColumns.rootCause && (
                      <td>
                        <span style={{ fontSize: 11.5, color: '#334155' }}>
                          {claim.rootCause ? ROOT_CAUSE_LABELS[claim.rootCause] : 'Chưa kết luận'}
                        </span>
                      </td>
                    )}

                    {/* Status */}
                    {visibleColumns.status && (
                      <td>
                        <span
                          className={`claims-status-tag ${
                            isPending
                              ? 'status-pending'
                              : isAdjudicated
                              ? 'status-adjudicated'
                              : isApproved
                              ? 'status-approved'
                              : isSettled
                              ? 'status-settled'
                              : 'status-rejected'
                          }`}
                        >
                          {CLAIM_STATUS_LABELS[claim.status] || claim.status}
                        </span>
                      </td>
                    )}

                    {/* Actions */}
                    {visibleColumns.actions && (
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {isPending ? (
                            <button
                              type="button"
                              className="claims-action-btn btn-primary"
                              onClick={() => onOpenInspection(claim, true)}
                              title="Giám định & Quy lỗi bên chịu trách nhiệm"
                            >
                              Quy lỗi
                            </button>
                          ) : isAdjudicated ? (
                            <button
                              type="button"
                              className="claims-action-btn btn-success"
                              onClick={() => onApprovePayment(claim.id)}
                              title="Duyệt chi tiền đền bù cho Khách hàng"
                            >
                              Duyệt chi
                            </button>
                          ) : isApproved ? (
                            <button
                              type="button"
                              className="claims-action-btn btn-settle"
                              onClick={() => onSettle(claim.id)}
                              title="Khấu trừ chế tài đơn vị gây lỗi & Đóng hồ sơ"
                            >
                              Khấu trừ
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="claims-action-btn btn-subtle"
                              onClick={() => onOpenInspection(claim, false)}
                              title="Xem chi tiết hồ sơ"
                            >
                              Chi tiết
                            </button>
                          )}

                          {/* Quick details peek button */}
                          {(isPending || isAdjudicated || isApproved) && (
                            <button
                              type="button"
                              className="claims-btn-icon"
                              onClick={() => onOpenInspection(claim, false)}
                              title="Xem chi tiết hồ sơ & ảnh hiện trường"
                            >
                              <Eye size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Internal Table Pagination Footer */}
      <div className="claims-table-pagination">
        <div className="claims-pagination-info">
          <span>
            Hiển thị <strong>{claims.length > 0 ? startIndex + 1 : 0}</strong> -{' '}
            <strong>{Math.min(startIndex + pageSize, claims.length)}</strong> trong số{' '}
            <strong>{claims.length}</strong> hồ sơ
          </span>
          <div className="claims-page-size-select">
            <span>Dòng / trang:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="claims-pagination-nav">
          <button
            type="button"
            className="claims-nav-btn"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            title="Trang trước"
          >
            <ChevronLeft size={15} />
          </button>

          <span className="claims-nav-pages">
            Trang <strong>{currentPage}</strong> / {totalPages}
          </span>

          <button
            type="button"
            className="claims-nav-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            title="Trang sau"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClaimsLiabilityTable;

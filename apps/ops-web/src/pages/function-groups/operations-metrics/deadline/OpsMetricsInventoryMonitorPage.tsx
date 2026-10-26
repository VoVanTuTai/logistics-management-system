import React from 'react';
import { Link } from 'react-router-dom';

import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import {
  NexusAuditDeficitIcon,
  NexusAuditVerifiedIcon,
  NexusCourierMotorbikeIcon,
  NexusDispatchPhoneIcon,
  NexusWarehouseScanIcon,
} from './NexusAuditIcons';
import {
  exportMissingAuditManifestCsv,
  formatAge,
  formatAgeHours,
  normalizeCode,
  UNKNOWN_COURIER_ID,
  type AgingTier,
  type InventoryFilter,
  type ResponsiblePartyFilter,
} from './inventoryMonitorHelpers';
import { useInventoryMonitorData } from './useInventoryMonitorData';
import './OpsMetricsInventoryMonitorPage.css';

export function OpsMetricsInventoryMonitorPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const {
    inventoryDate,
    setInventoryDate,
    hubFilter,
    setHubFilter,
    auditStatusFilter,
    setAuditStatusFilter,
    responsiblePartyFilter,
    setResponsiblePartyFilter,
    agingTierFilter,
    setAgingTierFilter,
    courierFilter,
    setCourierFilter,
    actorFilter,
    setActorFilter,
    keyword,
    setKeyword,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    currentPage,
    paginatedRows,
    inventoryRows,
    responsibleRows,
    courierHubGroups,
    hubOptions,
    distinctActors,
    problemByShipment,
    scopeHubCodes,
    isLoading,
    loadError,
    refetchAll,
    stats: {
      totalInventoryCount,
      scannedTodayCount,
      missingScanCount,
      missingDueToCourierCount,
      missingDueToWarehouseCount,
      missingDueToInboundCount,
      over72hCount,
      backlogOver24hCount,
      auditCompliancePercent,
      couriersWithDeliveryTodayCount,
      inventoryCheckedAfterReturnCount,
    },
  } = useInventoryMonitorData({ session });

  const canViewAllHubAreas = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;
  const scopeText = canViewAllHubAreas
    ? hubFilter === 'ALL'
      ? 'Toàn hệ thống'
      : hubFilter
    : scopeHubCodes.length > 0
    ? scopeHubCodes.join(', ')
    : 'Chưa được gán hub';

  const handleExportCsv = () => {
    const missingRows = responsibleRows.filter((row) => row.auditStatus === 'MISSING_SCAN');
    const rowsToExport = missingRows.length > 0 ? missingRows : responsibleRows;
    exportMissingAuditManifestCsv(rowsToExport, inventoryDate, hubFilter === 'ALL' ? 'TOAN_HE_THONG' : hubFilter);
  };

  return (
    <section className="ops-metrics-inventory">
      <header className="ops-metrics-inventory__header">
        <div>
          <small>OPS_METRICS_DEADLINE_INVENTORY</small>
          <h2>Tồn kho & SLA lưu kho bưu cục</h2>
          <p>
            Giám sát toàn diện hàng tồn lũy kế từ trước đến nay, đối soát chốt ca 22:00 phát hiện đơn kiểm thiếu,
            và truy vết chính xác vết thao tác cuối cùng của Bưu tá hay Nhân viên Kho Ops.
          </p>
        </div>
        <div className="ops-metrics-inventory__header-actions">
          <div className="ops-metrics-inventory__scope">
            <span>Phạm vi chịu trách nhiệm</span>
            <strong>{scopeText}</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              void refetchAll();
            }}
          >
            Làm mới
          </button>
        </div>
      </header>

      {/* KPI Summary Cards */}
      <section className="ops-metrics-inventory__summary">
        <article>
          <span>Tổng tồn lũy kế</span>
          <strong>{totalInventoryCount}</strong>
          <small>{backlogOver24hCount} đơn tồn từ trước ({over72hCount} quá hạn SLA)</small>
        </article>
        <article data-tone="danger">
          <span>Chốt ca 22h: Kiểm thiếu</span>
          <strong>{missingScanCount}</strong>
          <small>{scannedTodayCount} đã quét (Đạt {auditCompliancePercent}%)</small>
        </article>
        <article data-tone="warning">
          <span>Bưu tá chưa trả kho</span>
          <strong>{missingDueToCourierCount}</strong>
          <small>Cần đối soát xe/túi hàng</small>
        </article>
        <article data-tone="info">
          <span>Kho nghi quét sót</span>
          <strong>{missingDueToWarehouseCount}</strong>
          <small>Hôm qua có kiểm, tìm trên kệ</small>
        </article>
        <article data-tone="success">
          <span>Đã kiểm tồn hôm nay</span>
          <strong>{scannedTodayCount}</strong>
          <small>{inventoryCheckedAfterReturnCount} kiện sau hoàn hàng</small>
        </article>
        <article data-tone="alarm">
          <span>Báo động quá hạn &gt;72h</span>
          <strong>{over72hCount}</strong>
          <small>Vượt trần SLA lưu kho</small>
        </article>
      </section>

      {/* Dedicated Shift Closing 22:00 SOP Banner */}
      <section className="ops-metrics-inventory__closing-banner">
        <div className="ops-metrics-inventory__closing-banner-content">
          <div className="ops-metrics-inventory__closing-banner-title">
            <span className="ops-metrics-inventory__closing-badge">SOP CHỐT CA 22:00</span>
            <h4>Biên bản đối soát &amp; Kiểm thiếu tồn kho ca tối</h4>
          </div>
          <p>
            Quy chuẩn chốt ca 22:00: Đối chiếu toàn bộ <strong>{totalInventoryCount}</strong> đơn tồn lý thuyết với{' '}
            <strong>{scannedTodayCount}</strong> đơn thực quét tại sàn kho. Phát hiện{' '}
            <strong>{missingScanCount} đơn kiểm thiếu</strong>:{' '}
            <strong className="text-warning">{missingDueToCourierCount} đơn</strong> do Bưu tá chưa hoàn kho (giao bất thành/đang cầm hàng) và{' '}
            <strong className="text-danger">{missingDueToWarehouseCount} đơn</strong> do Kho quét sót (đã kiểm ca trước, cần tìm trên kệ).
            {missingDueToInboundCount > 0 ? ` Ngoài ra có ${missingDueToInboundCount} kiện hàng mới nhập trạm chưa phân loại.` : ''}
          </p>
        </div>
        <div className="ops-metrics-inventory__closing-banner-actions">
          <button
            type="button"
            className="ops-metrics-inventory__btn-quick-filter"
            onClick={() => {
              setAuditStatusFilter('MISSING_SCAN');
              setResponsiblePartyFilter('ALL');
              setAgingTierFilter('ALL');
              setCourierFilter('ALL');
              setActorFilter('ALL');
            }}
          >
            Lọc {missingScanCount} đơn kiểm thiếu
          </button>
          <button
            type="button"
            className="ops-metrics-inventory__btn-export"
            onClick={handleExportCsv}
          >
            Xuất bảng kê kiểm thiếu (CSV)
          </button>
        </div>
      </section>

      {/* Multi-dimensional Filters */}
      <section className="ops-metrics-inventory__filters">
        <label>
          <span>Ngày kiểm tồn</span>
          <input
            type="date"
            value={inventoryDate}
            onChange={(event) => setInventoryDate(event.target.value)}
          />
        </label>
        <label>
          <span>Hub chịu trách nhiệm</span>
          <select value={hubFilter} onChange={(event) => setHubFilter(event.target.value)}>
            <option value="ALL">Tất cả hub</option>
            {hubOptions.map((hubCode) => (
              <option key={hubCode} value={hubCode}>
                {hubCode}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Nhóm đối soát ca chốt</span>
          <select
            value={auditStatusFilter}
            onChange={(event) => setAuditStatusFilter(event.target.value as InventoryFilter)}
          >
            <option value="ALL">Tất cả hàng tồn lũy kế</option>
            <option value="MISSING_SCAN">[KIỂM THIẾU] Đơn chốt ca 22:00</option>
            <option value="SCANNED_TODAY">[ĐÃ KIỂM TỒN] Đã quét hôm nay</option>
            <option value="COURIER_PROBLEM">[BẤT THƯỜNG] Kiện phát NDR</option>
          </select>
        </label>
        <label>
          <span>Bên chịu trách nhiệm</span>
          <select
            value={responsiblePartyFilter}
            onChange={(event) => setResponsiblePartyFilter(event.target.value as ResponsiblePartyFilter)}
          >
            <option value="ALL">Tất cả bên chịu trách nhiệm</option>
            <option value="COURIER">Bưu tá (Chưa trả kho / Đi phát bất thành)</option>
            <option value="OPS_WAREHOUSE">Kho Ops (Quét sót trên kệ / Đã kiểm hôm qua)</option>
            <option value="OPS_INBOUND">Hàng mới nhập trạm (Chưa lên kệ)</option>
          </select>
        </label>
        <label>
          <span>Tuổi tồn kho lũy kế</span>
          <select
            value={agingTierFilter}
            onChange={(event) => setAgingTierFilter(event.target.value as AgingTier)}
          >
            <option value="ALL">Tất cả tuổi tồn</option>
            <option value="UNDER_24H">Trong ngày (&lt; 24 giờ)</option>
            <option value="24H_TO_48H">Tồn 1 - 2 ngày (24h - 48h)</option>
            <option value="48H_TO_72H">Tồn 2 - 3 ngày (48h - 72h)</option>
            <option value="OVER_72H">Tồn &gt; 3 ngày (Quá hạn SLA)</option>
          </select>
        </label>
        <label>
          <span>Người phụ trách cụ thể</span>
          <select
            value={actorFilter}
            onChange={(event) => {
              setActorFilter(event.target.value);
              setCourierFilter(event.target.value);
            }}
          >
            <option value="ALL">Tất cả nhân sự</option>
            {distinctActors.couriers.length > 0 && (
              <optgroup label="Bưu tá giao nhận">
                {distinctActors.couriers.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    [Bưu tá] {actor.name} ({actor.id})
                  </option>
                ))}
              </optgroup>
            )}
            {distinctActors.opsStaff.length > 0 && (
              <optgroup label="Nhân viên Kho / Ops">
                {distinctActors.opsStaff.map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    [Kho/Ops] {actor.name} ({actor.id})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        <label className="ops-metrics-inventory__filter-full">
          <span>Tìm kiếm đa tiêu chí</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Mã vận đơn, họ tên Bưu tá / Ops, SĐT bưu tá, người nhận, lý do NDR..."
          />
        </label>
      </section>

      {/* Courier & Responsibility Breakdown Panel */}
      <section className="ops-metrics-inventory__courier-panel">
        <header className="ops-metrics-inventory__panel-head">
          <div>
            <h3>Trách nhiệm Bưu tá theo Hub (Đối soát chốt ca 22:00)</h3>
            <small>
              {isLoading
                ? 'Đang tải...'
                : `${courierHubGroups.length} bưu tá thuộc phạm vi · ${couriersWithDeliveryTodayCount} có lượt phát hôm nay · ${missingDueToCourierCount} đơn kiểm thiếu chưa hoàn kho`}
            </small>
          </div>
          <button
            type="button"
            className="ops-metrics-inventory__ghost-button"
            onClick={() => {
              setCourierFilter('ALL');
              setActorFilter('ALL');
              setAuditStatusFilter('COURIER_PROBLEM');
            }}
          >
            Xem toàn bộ
          </button>
        </header>
        {isLoading ? (
          <p className="ops-metrics-inventory__empty">Đang tải danh sách bưu tá và dữ liệu NDR...</p>
        ) : null}
        {!isLoading && courierHubGroups.length === 0 ? (
          <p className="ops-metrics-inventory__empty">Chưa tìm thấy courier ACTIVE thuộc phạm vi hub hiện tại.</p>
        ) : null}
        {courierHubGroups.length > 0 ? (
          <div className="ops-metrics-inventory__courier-list">
            <table className="ops-metrics-inventory__courier-table">
              <thead>
                <tr>
                  <th>Bưu tá phụ trách</th>
                  <th>Số điện thoại</th>
                  <th>Đơn thiếu ca 22h</th>
                  <th>Lượt phát</th>
                  <th>Phát thành công</th>
                  <th>Phát bất thành</th>
                  <th>Đã kiểm kho lại</th>
                  <th>Tồn lâu nhất</th>
                </tr>
              </thead>
              <tbody>
                {courierHubGroups.map((group) => (
                  <tr
                    key={group.courierId}
                    className={[
                      courierFilter === group.courierId ? 'ops-metrics-inventory__courier-row--active' : '',
                      group.deliveryToday === 0 && group.inventoryChecked === 0 && group.missingScans === 0
                        ? 'ops-metrics-inventory__courier-row--clear'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    role="button"
                    tabIndex={0}
                    aria-label={`Lọc bưu tá ${group.courierName}`}
                    onClick={() => {
                      setCourierFilter(group.courierId);
                      setActorFilter(group.courierId);
                      setResponsiblePartyFilter('COURIER');
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setCourierFilter(group.courierId);
                        setActorFilter(group.courierId);
                        setResponsiblePartyFilter('COURIER');
                      }
                    }}
                  >
                    <td>
                      <strong>{group.courierName}</strong>
                      <small>
                        {group.courierId === UNKNOWN_COURIER_ID
                          ? 'Chưa gán bưu tá'
                          : `${group.courierId} · ${group.hubCodes.join(', ') || 'Hub chưa rõ'}`}
                      </small>
                    </td>
                    <td>
                      {group.phone ? (
                        <a
                          href={`tel:${group.phone}`}
                          className="ops-metrics-inventory__phone-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <NexusDispatchPhoneIcon size={12} style={{ marginRight: 4, color: '#0284c7' }} />
                          {group.phone}
                        </a>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          group.missingScans > 0
                            ? 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--danger'
                            : 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--clear'
                        }
                      >
                        {group.missingScans}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          group.deliveryToday > 0
                            ? 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--warning'
                            : 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--clear'
                        }
                      >
                        {group.deliveryToday}
                      </span>
                    </td>
                    <td>
                      <span className="ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--clear">
                        {group.deliveredSuccess}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          group.deliveryFailed > 0
                            ? 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--danger'
                            : 'ops-metrics-inventory__courier-count ops-metrics-inventory__courier-count--clear'
                        }
                      >
                        {group.deliveryFailed}
                      </span>
                    </td>
                    <td>{group.inventoryChecked}</td>
                    <td>{group.problemTotal === 0 ? '-' : formatAgeHours(group.oldestHours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {loadError ? (
        <p className="ops-metrics-inventory__error" role="alert">
          {getErrorMessage(loadError)}
        </p>
      ) : null}

      {/* Main Inventory Audit Manifest Table */}
      <section className="ops-metrics-inventory__panel">
        <header className="ops-metrics-inventory__panel-head">
          <div>
            <h3>Bảng kê đối soát tồn kho &amp; Truy vết đơn kiểm thiếu</h3>
            <small>
              Hiển thị chi tiết người thao tác cuối cùng, thời gian kiểm trước đó và hướng dẫn xử lý không kẽ hở.
            </small>
          </div>
          <span>{isLoading ? 'Đang tải...' : `${inventoryRows.length} vận đơn`}</span>
        </header>

        {isLoading ? (
          <p className="ops-metrics-inventory__empty">Đang tải dữ liệu tồn kho và vết thao tác kiểm kê...</p>
        ) : null}

        {!isLoading && inventoryRows.length === 0 ? (
          <p className="ops-metrics-inventory__empty">Không có vận đơn phù hợp bộ lọc đối soát hiện tại.</p>
        ) : null}

        <div className="ops-metrics-inventory__table-wrap">
          <table className="ops-metrics-inventory__table">
            <thead>
              <tr>
                <th>Mã vận đơn &amp; Loại hàng</th>
                <th>Tuổi tồn lũy kế</th>
                <th>Đối soát ca 22h</th>
                <th>Bên &amp; Người chịu trách nhiệm</th>
                <th>Vết thao tác cuối cùng</th>
                <th>Hướng dẫn xử lý chốt ca 22h</th>
                <th>Người nhận &amp; Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const problem = problemByShipment.get(normalizeCode(row.shipment.shipmentCode)) ?? null;

                const agingBadgeClass =
                  row.agingTier === 'OVER_72H'
                    ? 'ops-metrics-inventory__aging-badge--over72'
                    : row.agingTier === '48H_TO_72H'
                    ? 'ops-metrics-inventory__aging-badge--48to72'
                    : row.agingTier === '24H_TO_48H'
                    ? 'ops-metrics-inventory__aging-badge--24to48'
                    : 'ops-metrics-inventory__aging-badge--under24';

                const roleBadgeClass =
                  row.lastActor.partyType === 'COURIER'
                    ? 'ops-metrics-inventory__role-badge--courier'
                    : row.lastActor.partyType === 'OPS_INBOUND'
                    ? 'ops-metrics-inventory__role-badge--inbound'
                    : 'ops-metrics-inventory__role-badge--ops';

                return (
                  <tr key={row.shipment.id}>
                    {/* Column 1: Shipment Code */}
                    <td title={`Hub: ${row.hubCode}${row.shipment.parcelType ? ` · ${row.shipment.parcelType}` : ''}${row.shipment.codAmount ? ` · COD: ${row.shipment.codAmount.toLocaleString('vi-VN')} đ` : ''}`}>
                      <CopyableShipmentCode
                        code={row.shipment.shipmentCode}
                        className="ops-metrics-inventory__code"
                      />
                    </td>

                    {/* Column 2: Cumulative Aging */}
                    <td title={`Khởi tạo: ${formatDateTime(row.shipment.createdAt)} · Cập nhật: ${formatAge(row.shipment.updatedAt)} trước`}>
                      <span className={`ops-metrics-inventory__aging-badge ${agingBadgeClass}`}>
                        {formatAgeHours(row.cumulativeAgeHours)}
                      </span>
                    </td>

                    {/* Column 3: 22:00 Audit Status */}
                    <td title={row.inventoryScannedAt ? `Quét lúc: ${formatDateTime(row.inventoryScannedAt)}` : 'Chưa có quét ca 22h'}>
                      <span
                        className={
                          row.auditStatus === 'MISSING_SCAN'
                            ? 'ops-metrics-inventory__badge ops-metrics-inventory__badge--danger'
                            : 'ops-metrics-inventory__badge ops-metrics-inventory__badge--success'
                        }
                      >
                        {row.auditStatus === 'MISSING_SCAN' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <NexusAuditDeficitIcon size={13} />
                            <span>KIỂM THIẾU</span>
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <NexusAuditVerifiedIcon size={13} />
                            <span>ĐÃ KIỂM TỒN</span>
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Column 4: Responsible Party & Actor */}
                    <td title={`ID: ${row.lastActor.actorId}${row.lastActor.phone ? ` · SĐT: ${row.lastActor.phone}` : ''}`}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        <span className={`ops-metrics-inventory__role-badge ${roleBadgeClass}`} style={{ marginBottom: 0 }}>
                          {row.lastActor.partyTypeLabel}
                        </span>
                        <strong className="ops-metrics-inventory__actor-name" style={{ display: 'inline' }}>
                          {row.lastActor.actorName}
                        </strong>
                        {row.lastActor.phone ? (
                          <a
                            href={`tel:${row.lastActor.phone}`}
                            className="ops-metrics-inventory__phone-link"
                            style={{ display: 'inline-flex', alignItems: 'center' }}
                          >
                            <NexusDispatchPhoneIcon size={12} style={{ marginRight: 2, color: '#0284c7' }} />
                            {row.lastActor.phone}
                          </a>
                        ) : null}
                      </div>
                    </td>

                    {/* Column 5: Last Action & Audit Trail */}
                    <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${row.lastActor.lastActionTitle} (${formatDateTime(row.lastActor.lastActionAt)}) · ${row.lastActor.lastActionDetail}`}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong className="ops-metrics-inventory__action-title" style={{ whiteSpace: 'nowrap' }}>
                          {row.lastActor.lastActionTitle}
                        </strong>
                        <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
                          ({formatDateTime(row.lastActor.lastActionAt)})
                        </span>
                        {problem?.ndr ? (
                          <Link
                            className="ops-metrics-inventory__ndr-link"
                            to={routePaths.ndrDetail(problem.ndr.id)}
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            NDR #{problem.ndr.id.slice(0, 8)}
                          </Link>
                        ) : null}
                      </div>
                    </td>

                    {/* Column 6: Actionable Checklist SOP for 22:00 */}
                    <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.lastActor.closingChecklist}>
                      <div
                        className={
                          row.lastActor.partyType === 'COURIER'
                            ? 'ops-metrics-inventory__sop-callout ops-metrics-inventory__sop-callout--courier'
                            : 'ops-metrics-inventory__sop-callout ops-metrics-inventory__sop-callout--warehouse'
                        }
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0, padding: '2px 8px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        <span className="ops-metrics-inventory__sop-icon" style={{ flexShrink: 0 }}>
                          {row.lastActor.partyType === 'COURIER' ? (
                            <NexusCourierMotorbikeIcon size={14} style={{ color: '#0284c7' }} />
                          ) : (
                            <NexusWarehouseScanIcon size={14} style={{ color: '#d97706' }} />
                          )}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                          {row.lastActor.closingChecklist}
                        </span>
                      </div>
                    </td>

                    {/* Column 7: Receiver & Current Status */}
                    <td title={`${row.customerName}${row.receiverPhone ? ` · SĐT: ${row.receiverPhone}` : ''} · ${row.statusLabel}`}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        <span className="ops-metrics-inventory__status-tag" style={{ marginTop: 0 }}>
                          {row.statusLabel}
                        </span>
                        <strong style={{ fontSize: 12.5 }}>{row.customerName}</strong>
                        {row.receiverPhone ? (
                          <span style={{ fontSize: 11, color: '#64748b' }}>({row.receiverPhone})</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <footer className="ops-metrics-inventory__pagination">
          <span>
            Hiển thị {inventoryRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(inventoryRows.length, currentPage * pageSize)} / {inventoryRows.length} vận đơn
          </span>
          <label>
            <span>Số dòng</span>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <div>
            <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
              Trước
            </button>
            <strong>
              {currentPage}/{totalPages}
            </strong>
            <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}>
              Sau
            </button>
          </div>
        </footer>
      </section>
    </section>
  );
}

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useManifestsQuery } from '../../../../features/manifests/manifests.api';
import type { ManifestListItemDto } from '../../../../features/manifests/manifests.types';
import { useNdrCasesQuery } from '../../../../features/ndr/ndr.api';
import type { NdrCaseListItemDto } from '../../../../features/ndr/ndr.types';
import { useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type { ShipmentListItemDto } from '../../../../features/shipments/shipments.types';
import { useTasksQuery } from '../../../../features/tasks/tasks.api';
import type { TaskListItemDto } from '../../../../features/tasks/tasks.types';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import {
  formatManifestStatusLabel,
  formatNdrStatusLabel,
  formatShipmentStatusLabel,
  formatTaskStatusLabel,
} from '../../../../utils/logisticsLabels';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import './OpsMetricsDerivedDashboardPage.css';

export type OpsMetricsDashboardKind =
  | 'abnormal-overview'
  | 'abnormal-handling'
  | 'pickup-ratio'
  | 'delivery-sla'
  | 'sign-t1'
  | 'send-ratio'
  | 'delivery-leadtime'
  | 'inbound-leadtime'
  | 'overdue-alerts'
  | 'network-kpi'
  | 'action-board';

interface OpsMetricsDerivedDashboardPageProps {
  kind: OpsMetricsDashboardKind;
  title: string;
  summary: string;
  groupCode: string;
}

interface MetricRow {
  id: string;
  type: 'shipment' | 'task' | 'manifest' | 'ndr';
  code: string;
  status: string;
  statusLabel: string;
  hubCode: string;
  owner: string;
  basisAt: string | null | undefined;
  ageHours: number | null;
  issue: string;
  detailTo: string;
}

const DELIVERY_ACTIVE_STATUSES = new Set([
  'TASK_ASSIGNED',
  'OUT_FOR_DELIVERY',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
]);

const FAILED_OR_EXCEPTION_STATUSES = new Set([
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
  'RETURN_COMPLETED',
  'INVENTORY_CHECK',
]);

const PICKUP_DONE_STATUSES = new Set(['COMPLETED', 'PICKUP_COMPLETED']);
const TASK_CLOSED_STATUSES = new Set(['COMPLETED', 'CANCELLED']);
const OUTBOUND_STATUSES = new Set(['SCAN_OUTBOUND', 'SEND_GOODS', 'IN_TRANSIT', 'MANIFEST_SEALED']);
const INBOUND_STATUSES = new Set(['PICKUP_COMPLETED', 'SCAN_INBOUND', 'MANIFEST_RECEIVED', 'INVENTORY_CHECK']);

function normalizeCode(value: string | null | undefined): string {
  return (value ?? '').trim().toUpperCase();
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateKey(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : toDateInputValue(date);
}

function ageHours(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : Math.max(0, Math.floor((Date.now() - timestamp) / 3600000));
}

function durationHours(from: string | null | undefined, to: string | null | undefined): number | null {
  if (!from || !to) {
    return null;
  }
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }
  return Math.max(0, Math.round((end - start) / 3600000));
}

function formatHours(value: number | null): string {
  if (value === null) {
    return 'Không rõ';
  }
  const days = Math.floor(value / 24);
  return days > 0 ? `${days} ngày ${value % 24} giờ` : `${value} giờ`;
}

function shipmentLookupPath(shipmentCode: string): string {
  return `${routePaths.serviceQualityIntegratedLookup}?shipmentCode=${encodeURIComponent(shipmentCode)}`;
}

function resolveShipmentHub(shipment: ShipmentListItemDto): string {
  return (
    normalizeCode(shipment.currentLocation) ||
    normalizeCode(shipment.receiverHubCode) ||
    normalizeCode(shipment.destinationHubCode) ||
    normalizeCode(shipment.originHubCode) ||
    normalizeCode(shipment.senderHubCode) ||
    'CHUA_XAC_DINH'
  );
}

function shipmentOwner(shipment: ShipmentListItemDto): string {
  return shipment.receiverName ?? shipment.senderName ?? shipment.platform ?? 'Không có';
}

function manifestHub(manifest: ManifestListItemDto): string {
  return normalizeCode(manifest.destinationHubCode) || normalizeCode(manifest.originHubCode) || 'CHUA_XAC_DINH';
}

function isManifestOverdue(manifest: ManifestListItemDto): boolean {
  const status = normalizeCode(manifest.status);
  if (status === 'RECEIVED' || status === 'CLOSED') {
    return false;
  }
  const hours = ageHours(manifest.sealedAt ?? manifest.createdAt ?? manifest.updatedAt);
  return hours !== null && hours >= (status === 'SEALED' ? 48 : 24);
}

function buildDeliveryRows(shipments: ShipmentListItemDto[], mode: 'sla' | 'leadtime'): MetricRow[] {
  return shipments
    .filter((shipment) => {
      const status = normalizeCode(shipment.currentStatus);
      return mode === 'leadtime' ? status === 'DELIVERED' : status === 'DELIVERED' || DELIVERY_ACTIVE_STATUSES.has(status);
    })
    .map<MetricRow>((shipment) => {
      const status = normalizeCode(shipment.currentStatus);
      const leadHours =
        status === 'DELIVERED'
          ? durationHours(shipment.createdAt, shipment.updatedAt)
          : ageHours(shipment.createdAt);
      const issue =
        status === 'DELIVERED'
          ? (leadHours ?? 0) <= 48
            ? 'Đã phát trong SLA 48h'
            : 'Đã phát quá SLA 48h'
          : (leadHours ?? 0) >= 48
          ? 'Đang mở quá SLA phát 48h'
          : 'Đang theo dõi SLA phát';

      return {
        id: shipment.id,
        type: 'shipment',
        code: shipment.shipmentCode,
        status,
        statusLabel: formatShipmentStatusLabel(shipment.currentStatus),
        hubCode: resolveShipmentHub(shipment),
        owner: shipmentOwner(shipment),
        basisAt: status === 'DELIVERED' ? shipment.updatedAt : shipment.createdAt,
        ageHours: leadHours,
        issue,
        detailTo: shipmentLookupPath(shipment.shipmentCode),
      };
    })
    .sort((left, right) => (right.ageHours ?? 0) - (left.ageHours ?? 0));
}

function buildAbnormalRows(
  shipments: ShipmentListItemDto[],
  ndrCases: NdrCaseListItemDto[],
  mode: 'overview' | 'handling',
): MetricRow[] {
  const shipmentRows = shipments
    .filter((shipment) => FAILED_OR_EXCEPTION_STATUSES.has(normalizeCode(shipment.currentStatus)))
    .map<MetricRow>((shipment) => ({
      id: shipment.id,
      type: 'shipment',
      code: shipment.shipmentCode,
      status: normalizeCode(shipment.currentStatus),
      statusLabel: formatShipmentStatusLabel(shipment.currentStatus),
      hubCode: resolveShipmentHub(shipment),
      owner: shipmentOwner(shipment),
      basisAt: shipment.updatedAt,
      ageHours: ageHours(shipment.updatedAt),
      issue:
        mode === 'handling'
          ? 'Vận đơn bất thường cần theo dõi thao tác xử lý'
          : 'Vận đơn có trạng thái thất bại/NDR/chuyển hoàn',
      detailTo: shipmentLookupPath(shipment.shipmentCode),
    }));

  const ndrRows = ndrCases.map<MetricRow>((ndr) => ({
    id: ndr.id,
    type: 'ndr',
    code: ndr.shipmentCode,
    status: normalizeCode(ndr.status),
    statusLabel: formatNdrStatusLabel(ndr.status),
    hubCode: ndr.reasonCode ?? 'NDR',
    owner: ndr.reasonCode ?? 'Chưa phân loại',
    basisAt: ndr.updatedAt,
    ageHours: ageHours(ndr.updatedAt),
    issue:
      mode === 'handling'
        ? normalizeCode(ndr.status) === 'CLOSED'
          ? 'NDR đã đóng, dùng để kiểm tra thời gian xử lý'
          : 'NDR đang mở cần xử lý theo SLA'
        : 'NDR phát sinh từ giao thất bại',
    detailTo: routePaths.ndrDetail(ndr.id),
  }));

  return [...shipmentRows, ...ndrRows].sort((left, right) => (right.ageHours ?? 0) - (left.ageHours ?? 0));
}

function buildPickupRows(tasks: TaskListItemDto[], shipments: ShipmentListItemDto[]): MetricRow[] {
  const shipmentByCode = new Map(shipments.map((shipment) => [normalizeCode(shipment.shipmentCode), shipment]));
  return tasks
    .filter((task) => normalizeCode(task.taskType) === 'PICKUP')
    .map<MetricRow>((task) => {
      const shipment = shipmentByCode.get(normalizeCode(task.shipmentCode));
      const hours = ageHours(task.updatedAt ?? task.createdAt);
      const status = normalizeCode(task.status);
      return {
        id: task.id,
        type: 'task',
        code: task.taskCode,
        status,
        statusLabel: formatTaskStatusLabel(task.status),
        hubCode: task.deliveryArea ?? (shipment ? resolveShipmentHub(shipment) : 'PICKUP'),
        owner: task.assignedCourierId ?? task.senderName ?? 'Chưa phân công',
        basisAt: task.updatedAt ?? task.createdAt,
        ageHours: hours,
        issue: PICKUP_DONE_STATUSES.has(status)
          ? 'Pickup đã hoàn tất, dùng tính tỷ lệ nhận hàng kịp'
          : (hours ?? 0) >= 4
          ? 'Pickup quá 4h chưa hoàn tất'
          : 'Pickup đang trong ngưỡng theo dõi',
        detailTo: routePaths.taskDetail(task.id),
      };
    })
    .sort((left, right) => (right.ageHours ?? 0) - (left.ageHours ?? 0));
}

function buildSignT1Rows(shipments: ShipmentListItemDto[]): MetricRow[] {
  return shipments
    .filter((shipment) => normalizeCode(shipment.currentStatus) === 'DELIVERED')
    .map<MetricRow>((shipment) => {
      const hours = durationHours(shipment.createdAt, shipment.updatedAt);
      return {
        id: shipment.id,
        type: 'shipment',
        code: shipment.shipmentCode,
        status: normalizeCode(shipment.currentStatus),
        statusLabel: formatShipmentStatusLabel(shipment.currentStatus),
        hubCode: resolveShipmentHub(shipment),
        owner: shipmentOwner(shipment),
        basisAt: shipment.updatedAt,
        ageHours: hours,
        issue: (hours ?? 0) <= 24 ? 'Ký nhận trong T-1' : 'Ký nhận vượt mục tiêu T-1',
        detailTo: shipmentLookupPath(shipment.shipmentCode),
      };
    })
    .sort((left, right) => (right.ageHours ?? 0) - (left.ageHours ?? 0));
}

function buildSendRows(shipments: ShipmentListItemDto[], manifests: ManifestListItemDto[]): MetricRow[] {
  const shipmentRows = shipments
    .filter((shipment) => OUTBOUND_STATUSES.has(normalizeCode(shipment.currentStatus)))
    .map<MetricRow>((shipment) => ({
      id: shipment.id,
      type: 'shipment',
      code: shipment.shipmentCode,
      status: normalizeCode(shipment.currentStatus),
      statusLabel: formatShipmentStatusLabel(shipment.currentStatus),
      hubCode: normalizeCode(shipment.originHubCode) || resolveShipmentHub(shipment),
      owner: shipmentOwner(shipment),
      basisAt: shipment.updatedAt,
      ageHours: ageHours(shipment.updatedAt),
      issue: 'Vận đơn đã có tín hiệu gửi/ra khỏi hub',
      detailTo: shipmentLookupPath(shipment.shipmentCode),
    }));

  const manifestRows = manifests.map<MetricRow>((manifest) => {
    const hours = ageHours(manifest.sealedAt ?? manifest.updatedAt ?? manifest.createdAt);
    return {
      id: manifest.id,
      type: 'manifest',
      code: manifest.manifestCode,
      status: normalizeCode(manifest.status),
      statusLabel: formatManifestStatusLabel(manifest.status),
      hubCode: normalizeCode(manifest.originHubCode) || 'CHUA_XAC_DINH',
      owner: `${manifest.originHubCode ?? 'Chưa có'} → ${manifest.destinationHubCode ?? 'Chưa có'}`,
      basisAt: manifest.sealedAt ?? manifest.updatedAt ?? manifest.createdAt,
      ageHours: hours,
      issue:
        normalizeCode(manifest.status) === 'SEALED'
          ? 'Manifest đã seal, sẵn sàng tính gửi đúng giờ'
          : 'Manifest dùng làm nguồn kiểm soát gửi kiện',
      detailTo: routePaths.linehaulTripDataMonitor,
    };
  });

  return [...manifestRows, ...shipmentRows].sort((left, right) => (right.ageHours ?? 0) - (left.ageHours ?? 0));
}

function buildInboundRows(shipments: ShipmentListItemDto[], tasks: TaskListItemDto[]): MetricRow[] {
  const pickupTaskByShipmentCode = new Map(
    tasks
      .filter((task) => normalizeCode(task.taskType) === 'PICKUP' && task.shipmentCode)
      .map((task) => [normalizeCode(task.shipmentCode), task]),
  );

  return shipments
    .filter((shipment) => INBOUND_STATUSES.has(normalizeCode(shipment.currentStatus)))
    .map<MetricRow>((shipment) => {
      const task = pickupTaskByShipmentCode.get(normalizeCode(shipment.shipmentCode));
      const hours = task?.createdAt
        ? durationHours(task.createdAt, shipment.updatedAt)
        : durationHours(shipment.createdAt, shipment.updatedAt);
      return {
        id: shipment.id,
        type: 'shipment',
        code: shipment.shipmentCode,
        status: normalizeCode(shipment.currentStatus),
        statusLabel: formatShipmentStatusLabel(shipment.currentStatus),
        hubCode: resolveShipmentHub(shipment),
        owner: shipmentOwner(shipment),
        basisAt: shipment.updatedAt,
        ageHours: hours,
        issue: (hours ?? 0) <= 8 ? 'Leadtime nhận trong ngưỡng 8h' : 'Leadtime nhận vượt ngưỡng 8h',
        detailTo: shipmentLookupPath(shipment.shipmentCode),
      };
    })
    .sort((left, right) => (right.ageHours ?? 0) - (left.ageHours ?? 0));
}

function buildNetworkRows(shipments: ShipmentListItemDto[], manifests: ManifestListItemDto[]): MetricRow[] {
  const manifestRows = manifests.map<MetricRow>((manifest) => ({
    id: manifest.id,
    type: 'manifest',
    code: manifest.manifestCode,
    status: normalizeCode(manifest.status),
    statusLabel: formatManifestStatusLabel(manifest.status),
    hubCode: manifestHub(manifest),
    owner: `${manifest.originHubCode ?? 'Chưa có'} → ${manifest.destinationHubCode ?? 'Chưa có'}`,
    basisAt: manifest.updatedAt ?? manifest.createdAt ?? manifest.sealedAt,
    ageHours: ageHours(manifest.updatedAt ?? manifest.createdAt ?? manifest.sealedAt),
    issue: `Manifest tuyến ${manifest.shipmentCount ?? 0} kiện, dùng tính tải mạng lưới`,
    detailTo: routePaths.linehaulTripDataMonitor,
  }));

  const shipmentRows = shipments
    .filter((shipment) => normalizeCode(shipment.currentStatus) !== 'DELIVERED')
    .map<MetricRow>((shipment) => ({
      id: shipment.id,
      type: 'shipment',
      code: shipment.shipmentCode,
      status: normalizeCode(shipment.currentStatus),
      statusLabel: formatShipmentStatusLabel(shipment.currentStatus),
      hubCode: resolveShipmentHub(shipment),
      owner: shipmentOwner(shipment),
      basisAt: shipment.updatedAt,
      ageHours: ageHours(shipment.updatedAt),
      issue: 'Vận đơn mở tạo tải vận hành tại hub/tuyến',
      detailTo: shipmentLookupPath(shipment.shipmentCode),
    }));

  return [...manifestRows, ...shipmentRows].sort((left, right) => (right.ageHours ?? 0) - (left.ageHours ?? 0));
}

function buildActionRows(tasks: TaskListItemDto[]): MetricRow[] {
  return tasks
    .map<MetricRow>((task) => {
      const status = normalizeCode(task.status);
      const hours = ageHours(task.updatedAt ?? task.createdAt);
      return {
        id: task.id,
        type: 'task',
        code: task.taskCode,
        status,
        statusLabel: formatTaskStatusLabel(task.status),
        hubCode: (task.deliveryArea ?? normalizeCode(task.taskType)) || 'TASK',
        owner: task.assignedCourierId ?? 'Chưa phân công',
        basisAt: task.updatedAt ?? task.createdAt,
        ageHours: hours,
        issue: TASK_CLOSED_STATUSES.has(status)
          ? 'Task đã đóng, dùng đối chiếu tỷ lệ hoàn tất'
          : (hours ?? 0) >= 8
          ? 'Task mở quá 8h cần ưu tiên xử lý'
          : 'Task đang mở trong ngày',
        detailTo: routePaths.taskDetail(task.id),
      };
    })
    .sort((left, right) => (right.ageHours ?? 0) - (left.ageHours ?? 0));
}

function buildOverdueRows(
  shipments: ShipmentListItemDto[],
  tasks: TaskListItemDto[],
  manifests: ManifestListItemDto[],
  ndrCases: NdrCaseListItemDto[],
): MetricRow[] {
  const shipmentRows = shipments
    .filter((shipment) => normalizeCode(shipment.currentStatus) !== 'DELIVERED')
    .filter((shipment) => (ageHours(shipment.updatedAt) ?? 0) >= 24)
    .map<MetricRow>((shipment) => ({
      id: shipment.id,
      type: 'shipment',
      code: shipment.shipmentCode,
      status: normalizeCode(shipment.currentStatus),
      statusLabel: formatShipmentStatusLabel(shipment.currentStatus),
      hubCode: resolveShipmentHub(shipment),
      owner: shipmentOwner(shipment),
      basisAt: shipment.updatedAt,
      ageHours: ageHours(shipment.updatedAt),
      issue: 'Vận đơn chưa đóng quá 24h từ lần cập nhật cuối',
      detailTo: shipmentLookupPath(shipment.shipmentCode),
    }));
  const taskRows = tasks
    .filter((task) => !['COMPLETED', 'CANCELLED'].includes(normalizeCode(task.status)))
    .filter((task) => (ageHours(task.updatedAt) ?? 0) >= 24)
    .map<MetricRow>((task) => ({
      id: task.id,
      type: 'task',
      code: task.taskCode,
      status: normalizeCode(task.status),
      statusLabel: formatTaskStatusLabel(task.status),
      hubCode: task.deliveryArea ?? 'TASK',
      owner: task.assignedCourierId ?? 'Chưa phân công',
      basisAt: task.updatedAt,
      ageHours: ageHours(task.updatedAt),
      issue: 'Task vận hành quá 24h chưa hoàn tất',
      detailTo: routePaths.taskDetail(task.id),
    }));
  const manifestRows = manifests.filter(isManifestOverdue).map<MetricRow>((manifest) => ({
    id: manifest.id,
    type: 'manifest',
    code: manifest.manifestCode,
    status: normalizeCode(manifest.status),
    statusLabel: formatManifestStatusLabel(manifest.status),
    hubCode: manifestHub(manifest),
    owner: `${manifest.originHubCode ?? 'Chưa có'} → ${manifest.destinationHubCode ?? 'Chưa có'}`,
    basisAt: manifest.sealedAt ?? manifest.createdAt ?? manifest.updatedAt,
    ageHours: ageHours(manifest.sealedAt ?? manifest.createdAt ?? manifest.updatedAt),
    issue: 'Manifest/linehaul quá hạn chưa receive',
    detailTo: routePaths.linehaulTripDataMonitor,
  }));
  const ndrRows = ndrCases
    .filter((ndr) => normalizeCode(ndr.status) !== 'CLOSED')
    .filter((ndr) => (ageHours(ndr.updatedAt) ?? 0) >= 24)
    .map<MetricRow>((ndr) => ({
      id: ndr.id,
      type: 'ndr',
      code: ndr.shipmentCode,
      status: normalizeCode(ndr.status),
      statusLabel: formatNdrStatusLabel(ndr.status),
      hubCode: ndr.reasonCode ?? 'NDR',
      owner: ndr.reasonCode ?? 'Chưa phân loại',
      basisAt: ndr.updatedAt,
      ageHours: ageHours(ndr.updatedAt),
      issue: 'NDR quá 24h chưa đóng',
      detailTo: routePaths.ndrDetail(ndr.id),
    }));

  return [...shipmentRows, ...taskRows, ...manifestRows, ...ndrRows].sort(
    (left, right) => (right.ageHours ?? 0) - (left.ageHours ?? 0),
  );
}

export function OpsMetricsDerivedDashboardPage({
  kind,
  title,
  summary,
  groupCode,
}: OpsMetricsDerivedDashboardPageProps): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(today);
  const [hubFilter, setHubFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const shipmentsQuery = useShipmentsQuery(accessToken, {}, { refetchInterval: 15000 });
  const tasksQuery = useTasksQuery(accessToken, {}, { refetchInterval: 15000 });
  const manifestsQuery = useManifestsQuery(accessToken);
  const ndrQuery = useNdrCasesQuery(accessToken);

  const sourceRows = useMemo(() => {
    if (kind === 'abnormal-overview') {
      return buildAbnormalRows(shipmentsQuery.data ?? [], ndrQuery.data ?? [], 'overview');
    }
    if (kind === 'abnormal-handling') {
      return buildAbnormalRows(shipmentsQuery.data ?? [], ndrQuery.data ?? [], 'handling');
    }
    if (kind === 'pickup-ratio') {
      return buildPickupRows(tasksQuery.data ?? [], shipmentsQuery.data ?? []);
    }
    if (kind === 'delivery-sla') {
      return buildDeliveryRows(shipmentsQuery.data ?? [], 'sla');
    }
    if (kind === 'sign-t1') {
      return buildSignT1Rows(shipmentsQuery.data ?? []);
    }
    if (kind === 'send-ratio') {
      return buildSendRows(shipmentsQuery.data ?? [], manifestsQuery.data ?? []);
    }
    if (kind === 'delivery-leadtime') {
      return buildDeliveryRows(shipmentsQuery.data ?? [], 'leadtime');
    }
    if (kind === 'inbound-leadtime') {
      return buildInboundRows(shipmentsQuery.data ?? [], tasksQuery.data ?? []);
    }
    if (kind === 'overdue-alerts') {
      return buildOverdueRows(
        shipmentsQuery.data ?? [],
        tasksQuery.data ?? [],
        manifestsQuery.data ?? [],
        ndrQuery.data ?? [],
      );
    }
    if (kind === 'network-kpi') {
      return buildNetworkRows(shipmentsQuery.data ?? [], manifestsQuery.data ?? []);
    }
    return buildActionRows(tasksQuery.data ?? []);
  }, [kind, manifestsQuery.data, ndrQuery.data, shipmentsQuery.data, tasksQuery.data]);

  const sourceCount = useMemo(() => {
    if (kind === 'overdue-alerts') {
      return 4;
    }
    if (kind === 'network-kpi' || kind === 'send-ratio' || kind === 'abnormal-overview' || kind === 'abnormal-handling') {
      return 2;
    }
    return 1;
  }, [kind]);

  const kpiCopy = useMemo(() => {
    if (kind === 'pickup-ratio') {
      return { total: 'Tổng pickup task', good: 'Pickup hoàn tất', severe: 'Quá 4h' };
    }
    if (kind === 'sign-t1') {
      return { total: 'Tổng ký nhận', good: 'Trong T-1', severe: 'Vượt T-1' };
    }
    if (kind === 'send-ratio') {
      return { total: 'Dòng gửi kiện', good: 'Đã seal/gửi', severe: 'Quá 24h' };
    }
    if (kind === 'inbound-leadtime') {
      return { total: 'Dòng nhận hàng', good: 'Trong 8h', severe: 'Quá 8h' };
    }
    if (kind === 'abnormal-overview' || kind === 'abnormal-handling') {
      return { total: 'Tổng bất thường', good: 'Đã đóng/hoàn tất', severe: 'Quá 24h' };
    }
    if (kind === 'network-kpi') {
      return { total: 'Tải mạng lưới', good: 'Manifest nhận/seal', severe: 'Quá 48h' };
    }
    if (kind === 'action-board') {
      return { total: 'Tổng task', good: 'Task đã đóng', severe: 'Mở quá 8h' };
    }
    return {
      total: kind === 'overdue-alerts' ? 'Tổng cảnh báo' : 'Tổng dòng theo dõi',
      good: kind === 'delivery-leadtime' ? 'Leadtime TB' : 'Đúng SLA phát',
      severe: 'Quá 48h',
    };
  }, [kind]);

  const goodRows = useMemo(() => {
    if (kind === 'pickup-ratio') {
      return sourceRows.filter((row) => PICKUP_DONE_STATUSES.has(row.status)).length;
    }
    if (kind === 'sign-t1') {
      return sourceRows.filter((row) => (row.ageHours ?? 0) <= 24).length;
    }
    if (kind === 'send-ratio') {
      return sourceRows.filter((row) => ['SEALED', 'RECEIVED', 'SCAN_OUTBOUND', 'SEND_GOODS', 'IN_TRANSIT'].includes(row.status)).length;
    }
    if (kind === 'inbound-leadtime') {
      return sourceRows.filter((row) => (row.ageHours ?? 0) <= 8).length;
    }
    if (kind === 'abnormal-overview' || kind === 'abnormal-handling') {
      return sourceRows.filter((row) => ['CLOSED', 'RETURN_COMPLETED'].includes(row.status)).length;
    }
    if (kind === 'network-kpi') {
      return sourceRows.filter((row) => ['SEALED', 'RECEIVED', 'DELIVERED'].includes(row.status)).length;
    }
    if (kind === 'action-board') {
      return sourceRows.filter((row) => TASK_CLOSED_STATUSES.has(row.status)).length;
    }
    return sourceRows.filter((row) => row.status === 'DELIVERED' && (row.ageHours ?? 0) <= 48).length;
  }, [kind, sourceRows]);

  const deliveredRows = sourceRows.filter((row) => row.status === 'DELIVERED');
  const avgLeadtime =
    deliveredRows.length > 0
      ? Math.round(deliveredRows.reduce((sum, row) => sum + (row.ageHours ?? 0), 0) / deliveredRows.length)
      : 0;

  const rows = useMemo(() => {
    return sourceRows.filter((row) => {
      const dateKey = toDateKey(row.basisAt);
      return (
        (hubFilter === 'ALL' || row.hubCode === hubFilter) &&
        (statusFilter === 'ALL' || row.status === statusFilter) &&
        (!dateFrom || !dateKey || dateKey >= dateFrom) &&
        (!dateTo || !dateKey || dateKey <= dateTo)
      );
    });
  }, [dateFrom, dateTo, hubFilter, sourceRows, statusFilter]);

  const severeThreshold =
    kind === 'pickup-ratio'
      ? 4
      : kind === 'sign-t1' ||
        kind === 'send-ratio' ||
        kind === 'abnormal-overview' ||
        kind === 'abnormal-handling'
      ? 24
      : kind === 'inbound-leadtime' || kind === 'action-board'
      ? 8
      : 48;

  const severeRows = rows.filter((row) => (row.ageHours ?? 0) >= severeThreshold).length;

  const hubOptions = useMemo(
    () => Array.from(new Set(sourceRows.map((row) => row.hubCode))).filter(Boolean).sort(),
    [sourceRows],
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(sourceRows.map((row) => row.status))).filter(Boolean).sort(),
    [sourceRows],
  );
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isLoading =
    shipmentsQuery.isLoading || tasksQuery.isLoading || manifestsQuery.isLoading || ndrQuery.isLoading;
  const loadError = shipmentsQuery.error ?? tasksQuery.error ?? manifestsQuery.error ?? ndrQuery.error ?? null;

  return (
    <section className="ops-metrics-derived">
      <header className="ops-metrics-derived__header">
        <div>
          <small>{groupCode}</small>
          <h2>{title}</h2>
          <p>{summary}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void shipmentsQuery.refetch();
            void tasksQuery.refetch();
            void manifestsQuery.refetch();
            void ndrQuery.refetch();
          }}
        >
          Làm mới
        </button>
      </header>

      <section className="ops-metrics-derived__kpis">
        <article>
          <span>{kpiCopy.total}</span>
          <strong>{rows.length}</strong>
        </article>
        <article data-tone="success">
          <span>{kpiCopy.good}</span>
          <strong>{kind === 'delivery-leadtime' ? formatHours(avgLeadtime) : `${goodRows}/${sourceRows.length}`}</strong>
        </article>
        <article data-tone="danger">
          <span>{kpiCopy.severe}</span>
          <strong>{severeRows}</strong>
        </article>
        <article>
          <span>Nguồn dữ liệu</span>
          <strong>{sourceCount}</strong>
        </article>
      </section>

      <section className="ops-metrics-derived__filters">
        <label>
          <span>Từ ngày</span>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label>
          <span>Đến ngày</span>
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
        <label>
          <span>Hub / nguồn</span>
          <select value={hubFilter} onChange={(event) => setHubFilter(event.target.value)}>
            <option value="ALL">Tất cả</option>
            {hubOptions.map((hubCode) => (
              <option key={hubCode} value={hubCode}>
                {hubCode}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Trạng thái</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">Tất cả</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </section>

      {loadError ? (
        <p className="ops-metrics-derived__error" role="alert">
          {getErrorMessage(loadError)}
        </p>
      ) : null}

      <section className="ops-metrics-derived__panel">
        <header className="ops-metrics-derived__panel-head">
          <h3>Danh sách nguồn tạo chỉ số</h3>
          <span>{isLoading ? 'Đang tải...' : `${rows.length} dòng`}</span>
        </header>
        {isLoading ? <p className="ops-metrics-derived__empty">Đang tải dữ liệu vận hành...</p> : null}
        {!isLoading && rows.length === 0 ? (
          <p className="ops-metrics-derived__empty">Không có dữ liệu phù hợp bộ lọc hiện tại.</p>
        ) : null}
        <div className="ops-metrics-derived__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã nguồn</th>
                <th>Loại</th>
                <th>Trạng thái</th>
                <th>Hub / nguồn</th>
                <th>Phụ trách/khách</th>
                <th>Mốc tính</th>
                <th>Tuổi/leadtime</th>
                <th>Giải thích chỉ số</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={`${row.type}-${row.id}`}>
                  <td>
                    {row.type === 'shipment' ? (
                      <CopyableShipmentCode code={row.code} className="ops-metrics-derived__code" />
                    ) : (
                      <Link className="ops-metrics-derived__code" to={row.detailTo}>
                        {row.code}
                      </Link>
                    )}
                  </td>
                  <td>{row.type}</td>
                  <td>{row.statusLabel}</td>
                  <td>{row.hubCode}</td>
                  <td>{row.owner}</td>
                  <td>{formatDateTime(row.basisAt)}</td>
                  <td>{formatHours(row.ageHours)}</td>
                  <td>{row.issue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="ops-metrics-derived__pagination">
          <span>
            Hiển thị {rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(rows.length, currentPage * pageSize)} / {rows.length}
          </span>
          <label>
            <span>Số dòng</span>
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {[10, 25, 50].map((size) => (
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

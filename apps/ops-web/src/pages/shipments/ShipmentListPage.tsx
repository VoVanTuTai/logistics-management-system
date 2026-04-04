import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useHubsQuery } from '../../features/masterdata/masterdata.api';
import { useInboundScanMutation, useOutboundScanMutation, usePickupScanMutation } from '../../features/scans/scans.api';
import type { HubScanInput, HubScanType } from '../../features/scans/scans.types';
import { useCreateShipmentMutation, useShipmentsQuery } from '../../features/shipments/shipments.api';
import type { ShipmentListFilters, ShipmentListItemDto } from '../../features/shipments/shipments.types';
import { openShippingLabelPrint } from '../../printing/shippingLabelPrint';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { createIdempotencyKey } from '../../utils/idempotency';
import {
  PROVINCE_CITY_OPTIONS,
  deriveHubScopeTokens,
  isShipmentInScope,
} from '../../utils/locationScope';
import { queryKeys } from '../../utils/queryKeys';
import { ShipmentsTable } from './ShipmentsTable';

type ServiceType = 'STANDARD' | 'EXPRESS' | 'SAME_DAY';

interface WalkInShipmentFormState {
  manualCode: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverRegion: string;
  itemType: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  declaredValue: string;
  serviceType: ServiceType;
  codAmount: string;
  deliveryNote: string;
  platform: string;
  pickupLocationCode: string;
}

const DEFAULT_WALK_IN_FORM: WalkInShipmentFormState = {
  manualCode: '',
  senderName: '',
  senderPhone: '',
  senderAddress: '',
  receiverName: '',
  receiverPhone: '',
  receiverAddress: '',
  receiverRegion: '',
  itemType: '',
  weightKg: '',
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  declaredValue: '',
  serviceType: 'STANDARD',
  codAmount: '',
  deliveryNote: '',
  platform: 'OPS_WALK_IN',
  pickupLocationCode: '',
};

const SHIPMENT_STATUS_OPTIONS = [
  'CREATED',
  'UPDATED',
  'PICKUP_COMPLETED',
  'TASK_ASSIGNED',
  'MANIFEST_SEALED',
  'MANIFEST_RECEIVED',
  'SCAN_INBOUND',
  'SCAN_OUTBOUND',
  'DELIVERED',
  'DELIVERY_FAILED',
  'NDR_CREATED',
  'RETURN_STARTED',
  'RETURN_COMPLETED',
  'CANCELLED',
];

function toPositiveNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function estimateFee(form: WalkInShipmentFormState): number {
  const serviceBase = {
    STANDARD: 18000,
    EXPRESS: 28000,
    SAME_DAY: 42000,
  }[form.serviceType];

  const weightKg = toPositiveNumber(form.weightKg);
  const length = toPositiveNumber(form.lengthCm);
  const width = toPositiveNumber(form.widthCm);
  const height = toPositiveNumber(form.heightCm);
  const declaredValue = toPositiveNumber(form.declaredValue);
  const codAmount = toPositiveNumber(form.codAmount);

  const weightFee = weightKg * 4500;
  const volumetricWeight = (length * width * height) / 6000;
  const volumeFee = volumetricWeight * 3200;
  const insuredFee = declaredValue * 0.002;
  const codFee = Math.min(codAmount * 0.005, 35000);

  return Math.round(serviceBase + weightFee + volumeFee + insuredFee + codFee);
}

function buildWalkInMetadata(
  form: WalkInShipmentFormState,
  feeEstimate: number,
): Record<string, unknown> {
  return {
    sender: {
      name: form.senderName.trim() || null,
      phone: form.senderPhone.trim() || null,
      address: form.senderAddress.trim() || null,
    },
    receiver: {
      name: form.receiverName.trim() || null,
      phone: form.receiverPhone.trim() || null,
      address: form.receiverAddress.trim() || null,
      region: form.receiverRegion.trim() || null,
      province: form.receiverRegion.trim() || null,
    },
    package: {
      itemType: form.itemType.trim() || null,
      weightKg: toPositiveNumber(form.weightKg),
      dimensionsCm: {
        length: toPositiveNumber(form.lengthCm),
        width: toPositiveNumber(form.widthCm),
        height: toPositiveNumber(form.heightCm),
      },
      declaredValue: toPositiveNumber(form.declaredValue),
    },
    service: {
      type: form.serviceType,
    },
    codAmount: toPositiveNumber(form.codAmount),
    deliveryNote: form.deliveryNote.trim() || null,
    estimatedFee: feeEstimate,
    platform: form.platform.trim() || 'OPS_WALK_IN',
    source: 'ops-web',
  };
}

function formatCurrency(value: number | null): string {
  if (value === null) {
    return 'Không có';
  }
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function compactCode(value: string, fallback: string): string {
  const normalized = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return normalized.length > 0 ? normalized.slice(0, 10) : fallback;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return toDateInputValue(date);
}

function printWaybill(shipment: ShipmentListItemDto): void {
  const senderName = shipment.senderName?.trim() || 'Người gửi';
  const senderPhone = shipment.senderPhone?.trim() || '-';
  const senderAddress = shipment.senderAddress?.trim() || '-';
  const receiverName = shipment.receiverName?.trim() || 'Người nhận';
  const receiverPhone = shipment.receiverPhone?.trim() || '-';
  const receiverAddress = shipment.receiverAddress?.trim() || '-';

  const hubCode = shipment.currentLocation?.trim() || shipment.receiverRegion?.trim() || 'HUB-NA';
  const zoneCode = shipment.receiverRegion?.trim() || 'ZONE-NA';
  const routeTag = compactCode(hubCode || shipment.shipmentCode, 'ROUTE');
  const sortCode = [`Hub đích: ${hubCode || 'N/A'}`, `Khu vực: ${zoneCode || 'N/A'}`].join('\n');
  const itemDescription = shipment.parcelType?.trim() || shipment.serviceType?.trim() || '-';
  const parcelNote = [
    `Dịch vụ: ${shipment.serviceType?.trim() || '-'}`,
    `Loại hàng: ${shipment.parcelType?.trim() || '-'}`,
    `Phí: ${formatCurrency(shipment.shippingFee)}`,
    `COD: ${formatCurrency(shipment.codAmount)}`,
  ].join(' | ');
  const deliveryInstruction =
    shipment.deliveryNote?.trim() || 'Gọi trước khi giao. Không cho thử hàng.';

  const opened = openShippingLabelPrint({
    brandName: 'JMS LOGISTICS',
    serviceName: shipment.serviceType?.trim() || 'STANDARD',
    shipmentCode: shipment.shipmentCode,
    senderName,
    senderPhone,
    senderAddress,
    receiverName,
    receiverPhone,
    receiverAddress,
    hubCode,
    zoneCode,
    itemDescription,
    parcelNote,
    qrValue: shipment.shipmentCode,
    routeTag,
    sortCode,
    codAmountText: formatCurrency(shipment.codAmount),
    createdAtText: formatDateTime(shipment.createdAt),
    deliveryInstruction,
    hotlineText: 'Hotline vận hành: 1900-1234',
  });

  if (!opened) {
    window.alert('Trình duyệt đang chặn popup in. Hãy cho phép popup rồi thử lại.');
  }
}

export function ShipmentListPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const currentUserRoles = session?.user.roles ?? [];
  const assignedHubCodes = session?.user.hubCodes ?? [];
  const canViewAllHubAreas = currentUserRoles.includes('SYSTEM_ADMIN');

  const today = useMemo(() => toDateInputValue(new Date()), []);
  const filters: ShipmentListFilters = {
    q: searchParams.get('q') ?? undefined,
    status: searchParams.get('status') ?? undefined,
  };
  const initialDate = searchParams.get('date') || today;
  const [qInput, setQInput] = useState(filters.q ?? '');
  const [statusInput, setStatusInput] = useState(filters.status ?? '');
  const [dateInput, setDateInput] = useState(initialDate);

  const [counterShipmentCode, setCounterShipmentCode] = useState('');
  const [counterLocationCode, setCounterLocationCode] = useState('');
  const [counterScanType, setCounterScanType] = useState<HubScanType>('PICKUP');
  const [counterNote, setCounterNote] = useState('');
  const [counterMessage, setCounterMessage] = useState<string | null>(null);
  const [counterError, setCounterError] = useState<string | null>(null);

  const [walkInForm, setWalkInForm] = useState<WalkInShipmentFormState>(DEFAULT_WALK_IN_FORM);
  const [walkInMessage, setWalkInMessage] = useState<string | null>(null);
  const [walkInError, setWalkInError] = useState<string | null>(null);
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

  const shipmentQuery = useShipmentsQuery(accessToken, {});
  const hubsQuery = useHubsQuery(accessToken, {});
  const createShipmentMutation = useCreateShipmentMutation(accessToken);
  const pickupScanMutation = usePickupScanMutation(accessToken);
  const inboundScanMutation = useInboundScanMutation(accessToken);
  const outboundScanMutation = useOutboundScanMutation(accessToken);

  const estimatedFee = useMemo(() => estimateFee(walkInForm), [walkInForm]);
  const hubScopeTokens = useMemo(
    () => deriveHubScopeTokens(hubsQuery.data ?? [], assignedHubCodes),
    [assignedHubCodes, hubsQuery.data],
  );
  const scopedShipments = useMemo(() => {
    if (canViewAllHubAreas) {
      return shipmentQuery.data ?? [];
    }

    if (assignedHubCodes.length === 0) {
      return [];
    }

    return (shipmentQuery.data ?? []).filter((item) => isShipmentInScope(item, hubScopeTokens));
  }, [
    assignedHubCodes.length,
    canViewAllHubAreas,
    hubScopeTokens,
    shipmentQuery.data,
  ]);
  const selectedDate = searchParams.get('date') || today;

  const visibleShipments = useMemo(() => {
    const keyword = (filters.q ?? '').trim().toLowerCase();
    const status = (filters.status ?? '').trim().toLowerCase();

    return scopedShipments.filter((item) => {
      const keywordMatched =
        keyword.length === 0 ||
        item.shipmentCode.toLowerCase().includes(keyword) ||
        (item.senderName ?? '').toLowerCase().includes(keyword) ||
        (item.senderPhone ?? '').toLowerCase().includes(keyword) ||
        (item.receiverName ?? '').toLowerCase().includes(keyword) ||
        (item.receiverPhone ?? '').toLowerCase().includes(keyword) ||
        (item.platform ?? '').toLowerCase().includes(keyword);

      const statusMatched = status.length === 0 || item.currentStatus.toLowerCase() === status;
      const dateMatched = toDateKey(item.createdAt) === selectedDate;

      return keywordMatched && statusMatched && dateMatched;
    });
  }, [filters.q, filters.status, scopedShipments, selectedDate]);

  const isScanSubmitting =
    pickupScanMutation.isPending || inboundScanMutation.isPending || outboundScanMutation.isPending;
  const isWalkInSubmitting = createShipmentMutation.isPending || isScanSubmitting;

  useEffect(() => {
    setQInput(filters.q ?? '');
    setStatusInput(filters.status ?? '');
    setDateInput(searchParams.get('date') || today);
  }, [filters.q, filters.status, searchParams, today]);

  const onFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = String(formData.get('q') ?? '').trim();
    const status = String(formData.get('status') ?? '').trim();
    const date = String(formData.get('date') ?? '').trim() || today;
    const next = new URLSearchParams();

    next.set('date', date);
    if (q) {
      next.set('q', q);
    }
    if (status) {
      next.set('status', status);
    }

    setSearchParams(next, { replace: true });
  };

  const onResetFilters = () => {
    const next = new URLSearchParams();
    next.set('date', today);
    setSearchParams(next, { replace: true });
    setQInput('');
    setStatusInput('');
    setDateInput(today);
  };

  const submitCounterScan = async () => {
    if (!accessToken) {
      return;
    }

    const shipmentCode = counterShipmentCode.trim().toUpperCase();
    const locationCode = counterLocationCode.trim().toUpperCase();

    if (!shipmentCode) {
      setCounterError('Cần mã vận đơn để quét.');
      return;
    }
    if (!locationCode) {
      setCounterError('Cần mã vị trí để quét.');
      return;
    }

    const payload: HubScanInput = {
      shipmentCode,
      locationCode,
      scanType: counterScanType,
      note: counterNote.trim() || null,
      idempotencyKey: createIdempotencyKey('ops-counter-scan'),
    };

    setCounterMessage(null);
    setCounterError(null);

    try {
      if (counterScanType === 'PICKUP') {
        await pickupScanMutation.mutateAsync(payload);
      } else if (counterScanType === 'INBOUND') {
        await inboundScanMutation.mutateAsync(payload);
      } else {
        await outboundScanMutation.mutateAsync(payload);
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.shipments });
      setCounterMessage(`Quét ${counterScanType} đã ghi nhận cho ${shipmentCode}.`);
      setCounterShipmentCode('');
      setCounterNote('');
    } catch (error) {
      setCounterError(getErrorMessage(error));
    }
  };

  const submitWalkInShipment = async (createAndScanPickup: boolean) => {
    if (!accessToken) {
      return;
    }

    const pickupLocationCode = walkInForm.pickupLocationCode.trim().toUpperCase();
    if (createAndScanPickup && !pickupLocationCode) {
      setWalkInError('Cần mã vị trí lấy hàng cho thao tác "Tạo + quét pickup".');
      return;
    }
    if (!walkInForm.receiverRegion.trim()) {
      setWalkInError('Cần tỉnh/thành người nhận.');
      return;
    }
    if (!walkInForm.receiverAddress.trim()) {
      setWalkInError('Cần địa chỉ chi tiết người nhận.');
      return;
    }

    setWalkInMessage(null);
    setWalkInError(null);

    try {
      const createdShipment = await createShipmentMutation.mutateAsync({
        code: walkInForm.manualCode.trim().toUpperCase() || null,
        metadata: buildWalkInMetadata(walkInForm, estimatedFee),
      });

      let successMessage = `Đã tạo vận đơn ${createdShipment.shipmentCode}.`;

      if (createAndScanPickup) {
        await pickupScanMutation.mutateAsync({
          shipmentCode: createdShipment.shipmentCode,
          locationCode: pickupLocationCode,
          scanType: 'PICKUP',
          note: 'vận đơn walk-in tiếp nhận tại quầy',
          idempotencyKey: createIdempotencyKey('ops-walk-in-pickup'),
        });
        successMessage += ' Đã ghi nhận quét pickup.';
        setCounterShipmentCode(createdShipment.shipmentCode);
      }

      setWalkInMessage(successMessage);
      setWalkInForm((previous) => ({
        ...DEFAULT_WALK_IN_FORM,
        senderName: previous.senderName,
        senderPhone: previous.senderPhone,
        senderAddress: previous.senderAddress,
        platform: previous.platform,
        pickupLocationCode: previous.pickupLocationCode,
      }));
    } catch (error) {
      setWalkInError(getErrorMessage(error));
    }
  };

  return (
    <div>
      <h2>Danh sách vận đơn</h2>
      <p style={styles.helperText}>
        Màn hình này hỗ trợ tiếp nhận vận đơn walk-in tại quầy, thao tác quét tại chi nhánh và in phiếu vận đơn.
      </p>

      <form onSubmit={onFilterSubmit} style={styles.filterForm}>
        <div style={styles.filterControls}>
          <input
            name="q"
            placeholder="Tìm mã vận đơn"
            value={qInput}
            onChange={(event) => setQInput(event.target.value)}
            style={styles.input}
          />
          <select
            name="status"
            value={statusInput}
            onChange={(event) => setStatusInput(event.target.value)}
            style={styles.select}
          >
            <option value="">Tất cả trạng thái</option>
            {SHIPMENT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="date"
            value={dateInput}
            onChange={(event) => setDateInput(event.target.value)}
            style={styles.dateInput}
          />
          <button type="submit">Áp dụng</button>
          <button type="button" onClick={onResetFilters}>
            Đặt lại
          </button>
        </div>

        <div style={styles.filterActions}>
          <button type="button" style={styles.actionButton} onClick={() => setIsCounterModalOpen(true)}>
            Tiếp nhận đơn hàng
          </button>
          <button type="button" style={styles.actionButton} onClick={() => setIsWalkInModalOpen(true)}>
            Tạo đơn hàng
          </button>
        </div>
      </form>

      {!canViewAllHubAreas ? (
        <div style={styles.scopeNotice}>
          <strong>Phạm vi hub:</strong>{' '}
          {assignedHubCodes.length > 0
            ? assignedHubCodes.join(', ')
            : 'Chưa được gán hub. Vui lòng liên hệ admin để cấp hub cho tài khoản.'}
        </div>
      ) : null}

      {isCounterModalOpen ? (
        <div style={styles.modalOverlay} onClick={() => setIsCounterModalOpen(false)}>
          <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.cardTitle}>Tiếp nhận đơn hàng tại chi nhánh</h3>
              <button type="button" style={styles.modalCloseButton} onClick={() => setIsCounterModalOpen(false)}>
                Đóng
              </button>
            </div>
            <p style={styles.mutedText}>Quét hoặc nhập mã vận đơn khi khách mang hàng đến bưu cục.</p>
            <div style={styles.formGrid}>
              <select
                value={counterScanType}
                onChange={(event) => setCounterScanType(event.target.value as HubScanType)}
              >
                <option value="PICKUP">PICKUP</option>
                <option value="INBOUND">INBOUND</option>
                <option value="OUTBOUND">OUTBOUND</option>
              </select>
              <input
                placeholder="Mã vận đơn"
                value={counterShipmentCode}
                onChange={(event) => setCounterShipmentCode(event.target.value)}
              />
              <input
                placeholder="Mã vị trí chi nhánh"
                value={counterLocationCode}
                onChange={(event) => setCounterLocationCode(event.target.value)}
              />
              <textarea
                rows={3}
                placeholder="Ghi chú (không bắt buộc)"
                value={counterNote}
                onChange={(event) => setCounterNote(event.target.value)}
              />
              <button type="button" disabled={isScanSubmitting} onClick={() => void submitCounterScan()}>
                {isScanSubmitting ? 'Đang gửi quét...' : 'Gửi quét'}
              </button>
            </div>
            {counterMessage ? (
              <div role="status" style={{ ...styles.notice, ...styles.successNotice }}>
                {counterMessage}
              </div>
            ) : null}
            {counterError ? (
              <div role="alert" style={{ ...styles.notice, ...styles.errorNotice }}>
                {counterError}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {isWalkInModalOpen ? (
        <div style={styles.modalOverlay} onClick={() => setIsWalkInModalOpen(false)}>
          <div style={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.cardTitle}>Tạo đơn hàng Walk-in</h3>
              <button type="button" style={styles.modalCloseButton} onClick={() => setIsWalkInModalOpen(false)}>
                Đóng
              </button>
            </div>
            <p style={styles.mutedText}>
              Nhân viên Ops có thể tạo vận đơn cho khách walk-in với cấu trúc metadata đồng bộ với merchant-web.
            </p>
            <div style={styles.formGridMulti}>
              <input
                placeholder="Mã vận đơn tự nhập (không bắt buộc)"
                value={walkInForm.manualCode}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, manualCode: event.target.value }))}
              />
              <input
                placeholder="Tên người gửi"
                value={walkInForm.senderName}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, senderName: event.target.value }))}
              />
              <input
                placeholder="SĐT người gửi"
                value={walkInForm.senderPhone}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, senderPhone: event.target.value }))}
              />
              <input
                placeholder="Địa chỉ người gửi"
                value={walkInForm.senderAddress}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, senderAddress: event.target.value }))}
              />
              <input
                placeholder="Tên người nhận"
                value={walkInForm.receiverName}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, receiverName: event.target.value }))}
              />
              <input
                placeholder="SĐT người nhận"
                value={walkInForm.receiverPhone}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, receiverPhone: event.target.value }))}
              />
              <select
                value={walkInForm.receiverRegion}
                onChange={(event) =>
                  setWalkInForm((prev) => ({ ...prev, receiverRegion: event.target.value }))
                }
              >
                <option value="">Tỉnh/Thành người nhận</option>
                {PROVINCE_CITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                placeholder="Đường + địa chỉ chi tiết người nhận"
                value={walkInForm.receiverAddress}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, receiverAddress: event.target.value }))}
              />
              <input
                placeholder="Loại hàng"
                value={walkInForm.itemType}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, itemType: event.target.value }))}
              />
              <input
                placeholder="Khối lượng (kg)"
                value={walkInForm.weightKg}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, weightKg: event.target.value }))}
              />
              <input
                placeholder="Dài (cm)"
                value={walkInForm.lengthCm}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, lengthCm: event.target.value }))}
              />
              <input
                placeholder="Rộng (cm)"
                value={walkInForm.widthCm}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, widthCm: event.target.value }))}
              />
              <input
                placeholder="Cao (cm)"
                value={walkInForm.heightCm}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, heightCm: event.target.value }))}
              />
              <input
                placeholder="Giá trị khai báo"
                value={walkInForm.declaredValue}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, declaredValue: event.target.value }))}
              />
              <select
                value={walkInForm.serviceType}
                onChange={(event) =>
                  setWalkInForm((prev) => ({ ...prev, serviceType: event.target.value as ServiceType }))
                }
              >
                <option value="STANDARD">STANDARD</option>
                <option value="EXPRESS">EXPRESS</option>
                <option value="SAME_DAY">SAME_DAY</option>
              </select>
              <input
                placeholder="Số tiền COD"
                value={walkInForm.codAmount}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, codAmount: event.target.value }))}
              />
              <input
                placeholder="Nền tảng (Shopee, TikTokShop, WalkIn...)"
                value={walkInForm.platform}
                onChange={(event) => setWalkInForm((prev) => ({ ...prev, platform: event.target.value }))}
              />
              <input
                placeholder="Mã vị trí pickup (cho tạo + quét pickup)"
                value={walkInForm.pickupLocationCode}
                onChange={(event) =>
                  setWalkInForm((prev) => ({ ...prev, pickupLocationCode: event.target.value }))
                }
              />
            </div>
            <textarea
              rows={3}
              placeholder="Ghi chú giao hàng"
              value={walkInForm.deliveryNote}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, deliveryNote: event.target.value }))}
            />
            <p style={styles.mutedText}>Cước phí dự kiến: {formatCurrency(estimatedFee)}</p>
            <div style={styles.buttonRow}>
              <button
                type="button"
                disabled={isWalkInSubmitting}
                onClick={() => void submitWalkInShipment(false)}
              >
                {isWalkInSubmitting ? 'Đang gửi...' : 'Tạo vận đơn'}
              </button>
              <button
                type="button"
                disabled={isWalkInSubmitting}
                onClick={() => void submitWalkInShipment(true)}
              >
                {isWalkInSubmitting ? 'Đang gửi...' : 'Tạo + quét pickup'}
              </button>
            </div>
            {walkInMessage ? (
              <div role="status" style={{ ...styles.notice, ...styles.successNotice }}>
                {walkInMessage}
              </div>
            ) : null}
            {walkInError ? (
              <div role="alert" style={{ ...styles.notice, ...styles.errorNotice }}>
                {walkInError}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {shipmentQuery.isLoading ? <p>Đang tải vận đơn...</p> : null}
      {shipmentQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(shipmentQuery.error)}</p>
      ) : null}
      {hubsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(hubsQuery.error)}</p>
      ) : null}
      {shipmentQuery.isSuccess && visibleShipments.length === 0 ? (
        <p>
          {assignedHubCodes.length === 0 && !canViewAllHubAreas
            ? 'Không hiển thị được vận đơn vì tài khoản OPS chưa được gán hub.'
            : 'Không tìm thấy vận đơn phù hợp ngày hoặc bộ lọc hiện tại.'}
        </p>
      ) : null}
      {shipmentQuery.isSuccess && visibleShipments.length > 0 ? (
        <ShipmentsTable
          items={visibleShipments}
          onPrepareReceive={(shipmentCode) => {
            setCounterShipmentCode(shipmentCode);
            setIsCounterModalOpen(true);
          }}
          onPrint={printWaybill}
        />
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  helperText: {
    color: '#2d3f99',
  },
  scopeNotice: {
    marginBottom: 12,
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 12px',
    backgroundColor: '#f8faff',
    color: '#1f2b6f',
  },
  filterForm: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 8,
  },
  filterControls: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  input: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 320,
  },
  select: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 220,
  },
  dateInput: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 170,
  },
  filterActions: {
    marginLeft: 'auto',
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    border: '1px solid #0f4c81',
    borderRadius: 10,
    padding: '8px 12px',
    backgroundColor: '#0f4c81',
    color: '#ffffff',
    fontWeight: 700,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '48px 16px',
    zIndex: 1200,
  },
  modalCard: {
    width: 'min(980px, 100%)',
    maxHeight: 'calc(100vh - 96px)',
    overflowY: 'auto',
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8faff',
    display: 'grid',
    gap: 8,
    alignContent: 'start',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalCloseButton: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    color: '#0f4c81',
    fontWeight: 700,
  },
  cardTitle: {
    margin: 0,
  },
  mutedText: {
    margin: 0,
    color: '#2d3f99',
  },
  formGrid: {
    display: 'grid',
    gap: 8,
  },
  formGridMulti: {
    display: 'grid',
    gap: 8,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  },
  buttonRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  notice: {
    marginTop: 8,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid',
    fontWeight: 600,
    animation: 'ops-notice-in 0.22s ease-out',
  },
  successNotice: {
    borderColor: '#86efac',
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  errorNotice: {
    borderColor: '#fecaca',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  errorText: {
    color: '#b91c1c',
    marginTop: 12,
  },
};


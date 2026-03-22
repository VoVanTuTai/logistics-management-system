import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useHubsQuery } from '../../features/masterdata/masterdata.api';
import { useInboundScanMutation, useOutboundScanMutation, usePickupScanMutation } from '../../features/scans/scans.api';
import type { HubScanInput, HubScanType } from '../../features/scans/scans.types';
import { useCreateShipmentMutation, useShipmentsQuery } from '../../features/shipments/shipments.api';
import type { ShipmentListFilters, ShipmentListItemDto } from '../../features/shipments/shipments.types';
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
    return 'Khong co';
  }

  return `${new Intl.NumberFormat('en-US').format(value)} VND`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function printWaybill(shipment: ShipmentListItemDto): void {
  const popup = window.open('', '_blank', 'width=960,height=720');
  if (!popup) {
    return;
  }

  const senderText = [shipment.senderName, shipment.senderPhone, shipment.senderAddress]
    .filter((value) => Boolean(value))
    .join(' | ');
  const receiverText = [shipment.receiverName, shipment.receiverPhone, shipment.receiverAddress]
    .filter((value) => Boolean(value))
    .join(' | ');
  const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Phieu Van Don ${escapeHtml(shipment.shipmentCode)}</title>
  </head>
  <body style="font-family: Arial, sans-serif; padding: 16px;">
    <h2>Phieu Van Don ${escapeHtml(shipment.shipmentCode)}</h2>
    <p><strong>Trang thai:</strong> ${escapeHtml(shipment.currentStatus)}</p>
    <p><strong>Nen tang:</strong> ${escapeHtml(shipment.platform ?? 'Khong co')}</p>
    <p><strong>Dich vu:</strong> ${escapeHtml(shipment.serviceType ?? 'Khong co')}</p>
    <p><strong>COD:</strong> ${escapeHtml(formatCurrency(shipment.codAmount))}</p>
    <hr />
    <p><strong>Nguoi gui:</strong> ${escapeHtml(senderText || 'Khong co')}</p>
    <p><strong>Nguoi nhan:</strong> ${escapeHtml(receiverText || 'Khong co')}</p>
    <p><strong>Khu vuc:</strong> ${escapeHtml(shipment.receiverRegion ?? 'Khong co')}</p>
    <p><strong>Ghi chu giao hang:</strong> ${escapeHtml(shipment.deliveryNote ?? 'Khong co')}</p>
    <script>window.onload = function () { window.print(); };</script>
  </body>
</html>
`;

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
}

export function ShipmentListPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const currentUserRoles = session?.user.roles ?? [];
  const assignedHubCodes = session?.user.hubCodes ?? [];
  const canViewAllHubAreas = currentUserRoles.includes('SYSTEM_ADMIN');
  const filters: ShipmentListFilters = {
    q: searchParams.get('q') ?? undefined,
    status: searchParams.get('status') ?? undefined,
  };
  const [qInput, setQInput] = useState(filters.q ?? '');
  const [statusInput, setStatusInput] = useState(filters.status ?? '');

  const [counterShipmentCode, setCounterShipmentCode] = useState('');
  const [counterLocationCode, setCounterLocationCode] = useState('');
  const [counterScanType, setCounterScanType] = useState<HubScanType>('PICKUP');
  const [counterNote, setCounterNote] = useState('');
  const [counterMessage, setCounterMessage] = useState<string | null>(null);
  const [counterError, setCounterError] = useState<string | null>(null);

  const [walkInForm, setWalkInForm] = useState<WalkInShipmentFormState>(DEFAULT_WALK_IN_FORM);
  const [walkInMessage, setWalkInMessage] = useState<string | null>(null);
  const [walkInError, setWalkInError] = useState<string | null>(null);

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

    return (shipmentQuery.data ?? []).filter((item) =>
      isShipmentInScope(item, hubScopeTokens),
    );
  }, [
    assignedHubCodes.length,
    canViewAllHubAreas,
    hubScopeTokens,
    shipmentQuery.data,
  ]);
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

      const statusMatched =
        status.length === 0 || item.currentStatus.toLowerCase() === status;

      return keywordMatched && statusMatched;
    });
  }, [filters.q, filters.status, scopedShipments]);
  const isScanSubmitting =
    pickupScanMutation.isPending || inboundScanMutation.isPending || outboundScanMutation.isPending;
  const isWalkInSubmitting = createShipmentMutation.isPending || isScanSubmitting;

  useEffect(() => {
    setQInput(filters.q ?? '');
    setStatusInput(filters.status ?? '');
  }, [filters.q, filters.status]);

  const onFilterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = String(formData.get('q') ?? '').trim();
    const status = String(formData.get('status') ?? '').trim();
    const next = new URLSearchParams();

    if (q) {
      next.set('q', q);
    }

    if (status) {
      next.set('status', status);
    }

    setSearchParams(next, { replace: true });
  };

  const onResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setQInput('');
    setStatusInput('');
  };

  const submitCounterScan = async () => {
    if (!accessToken) {
      return;
    }

    const shipmentCode = counterShipmentCode.trim().toUpperCase();
    const locationCode = counterLocationCode.trim().toUpperCase();

    if (!shipmentCode) {
      setCounterError('Can ma van don de quet.');
      return;
    }

    if (!locationCode) {
      setCounterError('Can ma vi tri de quet.');
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
      setCounterMessage(`Quet ${counterScanType} da ghi nhan cho ${shipmentCode}.`);
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
      setWalkInError('Can ma vi tri lay hang cho thao tac "Tao + quet pickup".');
      return;
    }

    if (!walkInForm.receiverRegion.trim()) {
      setWalkInError('Can tinh/thanh nguoi nhan.');
      return;
    }

    if (!walkInForm.receiverAddress.trim()) {
      setWalkInError('Can dia chi chi tiet nguoi nhan.');
      return;
    }

    setWalkInMessage(null);
    setWalkInError(null);

    try {
      const createdShipment = await createShipmentMutation.mutateAsync({
        code: walkInForm.manualCode.trim().toUpperCase() || null,
        metadata: buildWalkInMetadata(walkInForm, estimatedFee),
      });

      let successMessage = `Da tao van don ${createdShipment.shipmentCode}.`;

      if (createAndScanPickup) {
        await pickupScanMutation.mutateAsync({
          shipmentCode: createdShipment.shipmentCode,
          locationCode: pickupLocationCode,
          scanType: 'PICKUP',
          note: 'van don walk-in tiep nhan tai quay',
          idempotencyKey: createIdempotencyKey('ops-walk-in-pickup'),
        });
        successMessage += ' Da ghi nhan quet pickup.';
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
      <h2>Danh sach van don</h2>
      <p style={styles.helperText}>
        Man hinh nay ho tro tiep nhan van don walk-in tai quầy, thao tac quet tai chi nhanh
        va in phieu van don.
      </p>

      <form onSubmit={onFilterSubmit} style={styles.filterForm}>
        <input
          name="q"
          placeholder="Tim ma van don"
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
          <option value="">Tat ca trang thai</option>
          {SHIPMENT_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button type="submit">Ap dung</button>
        <button type="button" onClick={onResetFilters}>
          Dat lai
        </button>
      </form>

      {!canViewAllHubAreas ? (
        <div style={styles.scopeNotice}>
          <strong>Pham vi hub:</strong>{' '}
          {assignedHubCodes.length > 0
            ? assignedHubCodes.join(', ')
            : 'Chua duoc gan hub. Vui long lien he admin de cap hub cho tai khoan.'}
        </div>
      ) : null}

      <section style={styles.operationGrid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Tiep Nhan Van Don Tai Chi Nhanh</h3>
          <p style={styles.mutedText}>
            Quet hoac nhap ma van don khi khach mang hang den buu cuc.
          </p>
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
              placeholder="Ma van don"
              value={counterShipmentCode}
              onChange={(event) => setCounterShipmentCode(event.target.value)}
            />
            <input
              placeholder="Ma vi tri chi nhanh"
              value={counterLocationCode}
              onChange={(event) => setCounterLocationCode(event.target.value)}
            />
            <textarea
              rows={3}
              placeholder="Ghi chu (khong bat buoc)"
              value={counterNote}
              onChange={(event) => setCounterNote(event.target.value)}
            />
            <button type="button" disabled={isScanSubmitting} onClick={() => void submitCounterScan()}>
              {isScanSubmitting ? 'Dang gui quet...' : 'Gui quet'}
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

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Tao Van Don Walk-in</h3>
          <p style={styles.mutedText}>
            Nhan vien Ops co the tao van don cho khach walk-in voi cau truc metadata
            dong bo voi merchant-web.
          </p>
          <div style={styles.formGridMulti}>
            <input
              placeholder="Ma van don tu nhap (khong bat buoc)"
              value={walkInForm.manualCode}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, manualCode: event.target.value }))}
            />
            <input
              placeholder="Ten nguoi gui"
              value={walkInForm.senderName}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, senderName: event.target.value }))}
            />
            <input
              placeholder="SDT nguoi gui"
              value={walkInForm.senderPhone}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, senderPhone: event.target.value }))}
            />
            <input
              placeholder="Dia chi nguoi gui"
              value={walkInForm.senderAddress}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, senderAddress: event.target.value }))}
            />
            <input
              placeholder="Ten nguoi nhan"
              value={walkInForm.receiverName}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, receiverName: event.target.value }))}
            />
            <input
              placeholder="SDT nguoi nhan"
              value={walkInForm.receiverPhone}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, receiverPhone: event.target.value }))}
            />
            <select
              value={walkInForm.receiverRegion}
              onChange={(event) =>
                setWalkInForm((prev) => ({ ...prev, receiverRegion: event.target.value }))
              }
            >
              <option value="">Tinh/Thanh nguoi nhan</option>
              {PROVINCE_CITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              placeholder="Duong + dia chi chi tiet nguoi nhan"
              value={walkInForm.receiverAddress}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, receiverAddress: event.target.value }))}
            />
            <input
              placeholder="Loai hang"
              value={walkInForm.itemType}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, itemType: event.target.value }))}
            />
            <input
              placeholder="Khoi luong (kg)"
              value={walkInForm.weightKg}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, weightKg: event.target.value }))}
            />
            <input
              placeholder="Dai (cm)"
              value={walkInForm.lengthCm}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, lengthCm: event.target.value }))}
            />
            <input
              placeholder="Rong (cm)"
              value={walkInForm.widthCm}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, widthCm: event.target.value }))}
            />
            <input
              placeholder="Cao (cm)"
              value={walkInForm.heightCm}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, heightCm: event.target.value }))}
            />
            <input
              placeholder="Gia tri khai bao"
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
              placeholder="So tien COD"
              value={walkInForm.codAmount}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, codAmount: event.target.value }))}
            />
            <input
              placeholder="Nen tang (Shopee, TikTokShop, WalkIn...)"
              value={walkInForm.platform}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, platform: event.target.value }))}
            />
            <input
              placeholder="Ma vi tri pickup (cho tao + quet pickup)"
              value={walkInForm.pickupLocationCode}
              onChange={(event) =>
                setWalkInForm((prev) => ({ ...prev, pickupLocationCode: event.target.value }))
              }
            />
          </div>
          <textarea
            rows={3}
            placeholder="Ghi chu giao hang"
            value={walkInForm.deliveryNote}
            onChange={(event) => setWalkInForm((prev) => ({ ...prev, deliveryNote: event.target.value }))}
          />
          <p style={styles.mutedText}>Cuoc phi du kien: {formatCurrency(estimatedFee)}</p>
          <div style={styles.buttonRow}>
            <button
              type="button"
              disabled={isWalkInSubmitting}
              onClick={() => void submitWalkInShipment(false)}
            >
              {isWalkInSubmitting ? 'Dang gui...' : 'Tao van don'}
            </button>
            <button
              type="button"
              disabled={isWalkInSubmitting}
              onClick={() => void submitWalkInShipment(true)}
            >
              {isWalkInSubmitting ? 'Dang gui...' : 'Tao + quet pickup'}
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
      </section>

      {shipmentQuery.isLoading ? <p>Dang tai van don...</p> : null}
      {shipmentQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(shipmentQuery.error)}</p>
      ) : null}
      {hubsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(hubsQuery.error)}</p>
      ) : null}
      {shipmentQuery.isSuccess && visibleShipments.length === 0 ? (
        <p>
          {assignedHubCodes.length === 0 && !canViewAllHubAreas
            ? 'Khong hien thi duoc van don vi tai khoan OPS chua duoc gan hub.'
            : 'Khong tim thay van don phu hop bo loc hien tai.'}
        </p>
      ) : null}
      {shipmentQuery.isSuccess && visibleShipments.length > 0 ? (
        <ShipmentsTable
          items={visibleShipments}
          onPrepareReceive={(shipmentCode) => setCounterShipmentCode(shipmentCode)}
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
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 240,
  },
  select: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
  },
  operationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  card: {
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8faff',
    display: 'grid',
    gap: 8,
    alignContent: 'start',
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

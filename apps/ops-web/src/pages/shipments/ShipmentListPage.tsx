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
    return 'N/A';
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
    <title>Waybill ${escapeHtml(shipment.shipmentCode)}</title>
  </head>
  <body style="font-family: Arial, sans-serif; padding: 16px;">
    <h2>Waybill ${escapeHtml(shipment.shipmentCode)}</h2>
    <p><strong>Status:</strong> ${escapeHtml(shipment.currentStatus)}</p>
    <p><strong>Platform:</strong> ${escapeHtml(shipment.platform ?? 'N/A')}</p>
    <p><strong>Service:</strong> ${escapeHtml(shipment.serviceType ?? 'N/A')}</p>
    <p><strong>COD:</strong> ${escapeHtml(formatCurrency(shipment.codAmount))}</p>
    <hr />
    <p><strong>Sender:</strong> ${escapeHtml(senderText || 'N/A')}</p>
    <p><strong>Receiver:</strong> ${escapeHtml(receiverText || 'N/A')}</p>
    <p><strong>Area:</strong> ${escapeHtml(shipment.receiverRegion ?? 'N/A')}</p>
    <p><strong>Delivery note:</strong> ${escapeHtml(shipment.deliveryNote ?? 'N/A')}</p>
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
      setCounterError('Shipment code is required for scan.');
      return;
    }

    if (!locationCode) {
      setCounterError('Location code is required for scan.');
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
      setCounterMessage(`${counterScanType} scan accepted for ${shipmentCode}.`);
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
      setWalkInError('Pickup location code is required for "Create + pickup scan".');
      return;
    }

    if (!walkInForm.receiverRegion.trim()) {
      setWalkInError('Receiver province / city is required.');
      return;
    }

    if (!walkInForm.receiverAddress.trim()) {
      setWalkInError('Receiver detail address is required.');
      return;
    }

    setWalkInMessage(null);
    setWalkInError(null);

    try {
      const createdShipment = await createShipmentMutation.mutateAsync({
        code: walkInForm.manualCode.trim().toUpperCase() || null,
        metadata: buildWalkInMetadata(walkInForm, estimatedFee),
      });

      let successMessage = `Shipment ${createdShipment.shipmentCode} created.`;

      if (createAndScanPickup) {
        await pickupScanMutation.mutateAsync({
          shipmentCode: createdShipment.shipmentCode,
          locationCode: pickupLocationCode,
          scanType: 'PICKUP',
          note: 'walk-in shipment received at post office',
          idempotencyKey: createIdempotencyKey('ops-walk-in-pickup'),
        });
        successMessage += ' Pickup scan recorded.';
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
      <h2>Shipments</h2>
      <p style={styles.helperText}>
        This screen supports walk-in shipment intake at post office counters, branch scan operations,
        and waybill printing.
      </p>

      <form onSubmit={onFilterSubmit} style={styles.filterForm}>
        <input
          name="q"
          placeholder="Search shipment code"
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
          <option value="">All statuses</option>
          {SHIPMENT_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button type="submit">Apply</button>
        <button type="button" onClick={onResetFilters}>
          Reset
        </button>
      </form>

      {!canViewAllHubAreas ? (
        <div style={styles.scopeNotice}>
          <strong>Hub scope:</strong>{' '}
          {assignedHubCodes.length > 0
            ? assignedHubCodes.join(', ')
            : 'No hub assigned. Contact admin to assign a hub account.'}
        </div>
      ) : null}

      <section style={styles.operationGrid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Receive Shipment At Branch</h3>
          <p style={styles.mutedText}>
            Scan or enter shipment code when customers bring packages to post office.
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
              placeholder="Shipment code"
              value={counterShipmentCode}
              onChange={(event) => setCounterShipmentCode(event.target.value)}
            />
            <input
              placeholder="Branch location code"
              value={counterLocationCode}
              onChange={(event) => setCounterLocationCode(event.target.value)}
            />
            <textarea
              rows={3}
              placeholder="Optional note"
              value={counterNote}
              onChange={(event) => setCounterNote(event.target.value)}
            />
            <button type="button" disabled={isScanSubmitting} onClick={() => void submitCounterScan()}>
              {isScanSubmitting ? 'Submitting scan...' : 'Submit scan'}
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
          <h3 style={styles.cardTitle}>Create Walk-in Shipment</h3>
          <p style={styles.mutedText}>
            Ops staff can create shipments for walk-in customers with the same metadata structure
            used by merchant-web.
          </p>
          <div style={styles.formGridMulti}>
            <input
              placeholder="Manual shipment code (optional)"
              value={walkInForm.manualCode}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, manualCode: event.target.value }))}
            />
            <input
              placeholder="Sender name"
              value={walkInForm.senderName}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, senderName: event.target.value }))}
            />
            <input
              placeholder="Sender phone"
              value={walkInForm.senderPhone}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, senderPhone: event.target.value }))}
            />
            <input
              placeholder="Sender address"
              value={walkInForm.senderAddress}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, senderAddress: event.target.value }))}
            />
            <input
              placeholder="Receiver name"
              value={walkInForm.receiverName}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, receiverName: event.target.value }))}
            />
            <input
              placeholder="Receiver phone"
              value={walkInForm.receiverPhone}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, receiverPhone: event.target.value }))}
            />
            <select
              value={walkInForm.receiverRegion}
              onChange={(event) =>
                setWalkInForm((prev) => ({ ...prev, receiverRegion: event.target.value }))
              }
            >
              <option value="">Receiver province / city</option>
              {PROVINCE_CITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              placeholder="Receiver street + detail address"
              value={walkInForm.receiverAddress}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, receiverAddress: event.target.value }))}
            />
            <input
              placeholder="Item type"
              value={walkInForm.itemType}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, itemType: event.target.value }))}
            />
            <input
              placeholder="Weight (kg)"
              value={walkInForm.weightKg}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, weightKg: event.target.value }))}
            />
            <input
              placeholder="Length (cm)"
              value={walkInForm.lengthCm}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, lengthCm: event.target.value }))}
            />
            <input
              placeholder="Width (cm)"
              value={walkInForm.widthCm}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, widthCm: event.target.value }))}
            />
            <input
              placeholder="Height (cm)"
              value={walkInForm.heightCm}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, heightCm: event.target.value }))}
            />
            <input
              placeholder="Declared value"
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
              placeholder="COD amount"
              value={walkInForm.codAmount}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, codAmount: event.target.value }))}
            />
            <input
              placeholder="Platform (Shopee, TikTokShop, WalkIn...)"
              value={walkInForm.platform}
              onChange={(event) => setWalkInForm((prev) => ({ ...prev, platform: event.target.value }))}
            />
            <input
              placeholder="Pickup location code (for create + pickup scan)"
              value={walkInForm.pickupLocationCode}
              onChange={(event) =>
                setWalkInForm((prev) => ({ ...prev, pickupLocationCode: event.target.value }))
              }
            />
          </div>
          <textarea
            rows={3}
            placeholder="Delivery note"
            value={walkInForm.deliveryNote}
            onChange={(event) => setWalkInForm((prev) => ({ ...prev, deliveryNote: event.target.value }))}
          />
          <p style={styles.mutedText}>Estimated fee: {formatCurrency(estimatedFee)}</p>
          <div style={styles.buttonRow}>
            <button
              type="button"
              disabled={isWalkInSubmitting}
              onClick={() => void submitWalkInShipment(false)}
            >
              {isWalkInSubmitting ? 'Submitting...' : 'Create shipment'}
            </button>
            <button
              type="button"
              disabled={isWalkInSubmitting}
              onClick={() => void submitWalkInShipment(true)}
            >
              {isWalkInSubmitting ? 'Submitting...' : 'Create + pickup scan'}
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

      {shipmentQuery.isLoading ? <p>Loading shipments...</p> : null}
      {shipmentQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(shipmentQuery.error)}</p>
      ) : null}
      {hubsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(hubsQuery.error)}</p>
      ) : null}
      {shipmentQuery.isSuccess && visibleShipments.length === 0 ? (
        <p>
          {assignedHubCodes.length === 0 && !canViewAllHubAreas
            ? 'No shipment is visible because this OPS account is not assigned to any hub.'
            : 'No shipments found for current filters.'}
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

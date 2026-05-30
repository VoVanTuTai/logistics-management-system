import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { useNdrCasesQuery } from '../../../../features/ndr/ndr.api';
import type { NdrCaseListItemDto } from '../../../../features/ndr/ndr.types';
import { useShipmentDetailQuery, useShipmentsQuery } from '../../../../features/shipments/shipments.api';
import type {
  ShipmentDetailDto,
  ShipmentListItemDto,
} from '../../../../features/shipments/shipments.types';
import { useTrackingDetailQuery } from '../../../../features/tracking/tracking.api';
import type { TrackingTimelineEventDto } from '../../../../features/tracking/tracking.types';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import {
  formatServiceTypeLabel,
  formatShipmentStatusLabel,
  formatTrackingEventSourceLabel,
  formatTrackingEventTypeLabel,
} from '../../../../utils/logisticsLabels';
import { CopyableShipmentCode } from '../../../shared/CopyableShipmentCode';
import { LinkifiedText } from '../../../shared/LinkifiedText';
import './ServiceQualityIntegratedLookupPage.css';

interface DetailField {
  label: string;
  value: React.ReactNode;
}

function normalizeShipmentCode(value: string): string {
  return value.trim().toUpperCase();
}

function formatText(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return 'Không có';
  }

  return String(value);
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Không có';
  }

  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
}

function maskPhone(value: string | null | undefined): string {
  const phone = value?.trim();

  if (!phone) {
    return 'Không có';
  }

  const visibleSuffixLength = Math.min(3, phone.length);
  const maskedLength = Math.max(phone.length - visibleSuffixLength, 0);

  return `${'*'.repeat(maskedLength)}${phone.slice(-visibleSuffixLength)}`;
}

function FieldGrid({ fields }: { fields: DetailField[] }): React.JSX.Element {
  return (
    <dl className="ops-integrated-lookup__fields">
      {fields.map((field) => (
        <div key={field.label}>
          <dt>{field.label}</dt>
          <dd>{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SensitivePhoneValue({ value, label }: { value: string | null | undefined; label: string }): React.JSX.Element {
  const phone = value?.trim() ?? '';
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    setIsRevealed(false);
  }, [phone]);

  if (!phone) {
    return <>{formatText(value)}</>;
  }

  const buttonLabel = isRevealed ? `Ẩn ${label}` : `Hiện ${label}`;

  return (
    <span className="ops-integrated-lookup__sensitive-value">
      <span>{isRevealed ? phone : maskPhone(phone)}</span>
      <button
        type="button"
        className="ops-integrated-lookup__sensitive-toggle"
        onClick={() => setIsRevealed((current) => !current)}
        aria-label={buttonLabel}
        title={buttonLabel}
      >
        {isRevealed ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
      </button>
    </span>
  );
}

function buildTimelineRows(events: TrackingTimelineEventDto[]) {
  return [...events].sort(
    (left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
}

function listItemToDetail(item: ShipmentListItemDto): ShipmentDetailDto {
  return {
    ...item,
    note: item.deliveryNote,
  };
}

function formatIssueText(item: NdrCaseListItemDto): string {
  return item.issueType ?? item.reasonCode ?? 'Không có';
}

function formatIssueCategory(value: string | null | undefined): string {
  if (!value) {
    return 'Không có';
  }

  if (value === 'PHYSICAL') {
    return 'Hàng hóa / vật lý';
  }

  if (value === 'INFORMATION') {
    return 'Thông tin / vận hành';
  }

  return value;
}

function countAttachments(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

export function ServiceQualityIntegratedLookupPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const [searchParams] = useSearchParams();
  const initialShipmentCode = normalizeShipmentCode(searchParams.get('shipmentCode') ?? '');
  const [inputValue, setInputValue] = useState(initialShipmentCode);
  const [lookupCode, setLookupCode] = useState(initialShipmentCode);
  const [inputError, setInputError] = useState<string | null>(null);

  const shipmentsQuery = useShipmentsQuery(
    accessToken,
    { shipmentCode: lookupCode, limit: 1 },
    { enabled: Boolean(lookupCode) },
  );
  const shipmentListItem = shipmentsQuery.data?.find(
    (shipment) => normalizeShipmentCode(shipment.shipmentCode) === lookupCode,
  ) ?? shipmentsQuery.data?.[0] ?? null;
  const shipmentDetailQuery = useShipmentDetailQuery(accessToken, shipmentListItem?.shipmentCode ?? '');
  const trackingQuery = useTrackingDetailQuery(accessToken, lookupCode);
  const ndrQuery = useNdrCasesQuery(
    accessToken,
    { shipmentCode: lookupCode },
    { enabled: Boolean(lookupCode) },
  );

  const shipment: ShipmentDetailDto | null =
    shipmentDetailQuery.data ?? (shipmentListItem ? listItemToDetail(shipmentListItem) : null);
  const timelineRows = useMemo(
    () => buildTimelineRows(trackingQuery.data?.timeline ?? []),
    [trackingQuery.data?.timeline],
  );
  const isLoading = Boolean(lookupCode) && (
    shipmentsQuery.isLoading ||
    shipmentDetailQuery.isLoading ||
    trackingQuery.isLoading ||
    ndrQuery.isLoading
  );
  const notFound = Boolean(lookupCode) && !isLoading && shipmentsQuery.isSuccess && !shipmentListItem;
  const error = shipmentsQuery.error ?? shipmentDetailQuery.error ?? trackingQuery.error ?? ndrQuery.error ?? null;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextCode = normalizeShipmentCode(inputValue);

    if (!nextCode) {
      setInputError('Vui lòng nhập mã vận đơn cần tra cứu.');
      return;
    }

    setInputError(null);
    setLookupCode(nextCode);
  };

  const statusLabel = shipment
    ? formatShipmentStatusLabel(shipment.currentStatus)
    : trackingQuery.data?.current?.currentStatus ?? 'Không có';

  return (
    <section className="ops-integrated-lookup">
      <header className="ops-integrated-lookup__header">
        <div>
          <small>TRA_CUU_TICH_HOP</small>
          <h2>Tra cứu sự cố / chất lượng</h2>
          <p>
            Nhập mã vận đơn để xem toàn bộ thông tin đơn hàng, hub gửi/nhận/đích,
            người gửi, người nhận, trạng thái hiện tại và lịch sử xử lý.
          </p>
        </div>
      </header>

      <form className="ops-integrated-lookup__search" onSubmit={onSubmit}>
        <label>
          <span>Mã vận đơn</span>
          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Ví dụ: NX0123456789"
            autoComplete="off"
          />
        </label>
        <button type="submit">Tra cứu</button>
      </form>

      {inputError ? <p className="ops-integrated-lookup__error">{inputError}</p> : null}
      {error && !trackingQuery.isError && !ndrQuery.isError ? (
        <p className="ops-integrated-lookup__error">{getErrorMessage(error)}</p>
      ) : null}

      {!lookupCode ? (
        <article className="ops-integrated-lookup__empty">
          Nhập mã vận đơn để bắt đầu tra cứu thông tin tích hợp.
        </article>
      ) : null}

      {isLoading ? <article className="ops-integrated-lookup__empty">Đang tải thông tin vận đơn...</article> : null}

      {notFound ? (
        <article className="ops-integrated-lookup__empty">
          Không tìm thấy vận đơn <strong>{lookupCode}</strong> trong dữ liệu hiện tại.
        </article>
      ) : null}

      {shipment ? (
        <>
          <section className="ops-integrated-lookup__summary">
            <article>
              <span>Mã vận đơn</span>
              <CopyableShipmentCode code={shipment.shipmentCode} />
            </article>
            <article>
              <span>Trạng thái hiện tại</span>
              <strong>{statusLabel}</strong>
            </article>
            <article>
              <span>Vị trí hiện tại</span>
              <strong>{formatText(trackingQuery.data?.current?.currentLocationText ?? shipment.currentLocation)}</strong>
            </article>
            <article>
              <span>Cập nhật cuối</span>
              <strong>{formatDateTime(trackingQuery.data?.current?.updatedAt ?? shipment.updatedAt)}</strong>
            </article>
          </section>

          <section className="ops-integrated-lookup__grid">
            <article className="ops-integrated-lookup__panel">
              <header>
                <h3>Thông tin hub và tuyến</h3>
                <CopyableShipmentCode code={shipment.shipmentCode} />
              </header>
              <FieldGrid
                fields={[
                  { label: 'Hub gửi', value: formatText(shipment.senderHubCode) },
                  { label: 'Hub nhận', value: formatText(shipment.receiverHubCode) },
                  { label: 'Hub xuất phát', value: formatText(shipment.originHubCode) },
                  { label: 'Hub đích', value: formatText(shipment.destinationHubCode) },
                  { label: 'Vị trí hiện tại', value: formatText(shipment.currentLocation) },
                  { label: 'Khu vực nhận', value: formatText(shipment.receiverRegion) },
                ]}
              />
            </article>

            <article className="ops-integrated-lookup__panel">
              <header>
                <h3>Người gửi</h3>
              </header>
              <FieldGrid
                fields={[
                  { label: 'Tên', value: formatText(shipment.senderName) },
                  { label: 'Số điện thoại', value: <SensitivePhoneValue value={shipment.senderPhone} label="số điện thoại người gửi" /> },
                  { label: 'Địa chỉ', value: formatText(shipment.senderAddress) },
                  { label: 'Phường/xã', value: formatText(shipment.senderWard) },
                  { label: 'Quận/huyện', value: formatText(shipment.senderDistrict) },
                  { label: 'Tỉnh/thành', value: formatText(shipment.senderProvince) },
                ]}
              />
            </article>

            <article className="ops-integrated-lookup__panel">
              <header>
                <h3>Người nhận</h3>
              </header>
              <FieldGrid
                fields={[
                  { label: 'Tên', value: formatText(shipment.receiverName) },
                  { label: 'Số điện thoại', value: <SensitivePhoneValue value={shipment.receiverPhone} label="số điện thoại người nhận" /> },
                  { label: 'Địa chỉ', value: formatText(shipment.receiverAddress) },
                  { label: 'Khu vực', value: formatText(shipment.receiverRegion) },
                ]}
              />
            </article>

            <article className="ops-integrated-lookup__panel">
              <header>
                <h3>Thông tin đơn hàng</h3>
              </header>
              <FieldGrid
                fields={[
                  { label: 'Nền tảng', value: formatText(shipment.platform) },
                  { label: 'Dịch vụ', value: shipment.serviceType ? formatServiceTypeLabel(shipment.serviceType) : 'Không có' },
                  { label: 'Loại hàng', value: formatText(shipment.parcelType) },
                  { label: 'COD', value: formatMoney(shipment.codAmount) },
                  { label: 'Phí vận chuyển', value: formatMoney(shipment.shippingFee) },
                  { label: 'Ghi chú', value: formatText(shipment.note) },
                  { label: 'Ngày tạo', value: formatDateTime(shipment.createdAt) },
                  { label: 'Ngày cập nhật', value: formatDateTime(shipment.updatedAt) },
                ]}
              />
            </article>
          </section>

          <section className="ops-integrated-lookup__panel ops-integrated-lookup__panel--wide">
            <header>
              <h3>Sự cố / chất lượng</h3>
              <span>{ndrQuery.data?.length ?? 0} hồ sơ</span>
            </header>
            {ndrQuery.isError ? (
              <p className="ops-integrated-lookup__empty">
                Chưa lấy được dữ liệu sự cố / chất lượng từ NDR API.
              </p>
            ) : null}
            {!ndrQuery.isError && (ndrQuery.data?.length ?? 0) === 0 ? (
              <p className="ops-integrated-lookup__empty">Chưa có hồ sơ sự cố / chất lượng cho vận đơn này.</p>
            ) : null}
            {!ndrQuery.isError && (ndrQuery.data?.length ?? 0) > 0 ? (
              <div className="ops-integrated-lookup__table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Cập nhật</th>
                      <th>Trạng thái</th>
                      <th>Loại sự cố</th>
                      <th>Nhóm</th>
                      <th>Hub ghi nhận</th>
                      <th>Ảnh</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ndrQuery.data?.map((item) => (
                      <tr key={item.id}>
                        <td>{formatDateTime(item.updatedAt)}</td>
                        <td>{formatText(item.status)}</td>
                        <td>{formatIssueText(item)}</td>
                        <td>{formatIssueCategory(item.issueCategory)}</td>
                        <td>{formatText(item.reportedHubCode)}</td>
                        <td>{countAttachments(item.attachments)}</td>
                        <td>
                          <LinkifiedText text={item.note ?? null} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          <section className="ops-integrated-lookup__panel ops-integrated-lookup__panel--wide">
            <header>
              <h3>Lịch sử trạng thái</h3>
              <span>{timelineRows.length} sự kiện</span>
            </header>
            {trackingQuery.isError ? (
              <p className="ops-integrated-lookup__empty">
                Chưa lấy được lịch sử trạng thái từ tracking API.
              </p>
            ) : null}
            {!trackingQuery.isError && timelineRows.length === 0 ? (
              <p className="ops-integrated-lookup__empty">Chưa có lịch sử trạng thái.</p>
            ) : null}
            {timelineRows.length > 0 ? (
              <div className="ops-integrated-lookup__table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                      <th>Vị trí</th>
                      <th>Nguồn</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timelineRows.map((event) => (
                      <tr key={event.id}>
                        <td>{formatDateTime(event.occurredAt)}</td>
                        <td>{event.statusAfterEvent ? formatShipmentStatusLabel(event.statusAfterEventCode ?? event.statusAfterEvent) : 'Không có'}</td>
                        <td>{formatTrackingEventTypeLabel(event.eventTypeCode ?? event.eventType)}</td>
                        <td>{formatText(event.locationText ?? event.locationCode)}</td>
                        <td>{formatTrackingEventSourceLabel(event.eventSource)}</td>
                        <td>
                          <LinkifiedText text={event.note} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </section>
  );
}

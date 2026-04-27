import React, { useState } from 'react';

import { useTrackingDetailQuery } from '../../features/tracking/tracking.api';
import type { TrackingTimelineEventDto } from '../../features/tracking/tracking.types';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { TrackingStatusHistoryTable } from './TrackingStatusHistoryTable';
import './TrackingLookupPage.css';

interface TrackingStatusHistoryRow {
  id: string;
  stt: number;
  scanTime: string;
  uploadedTime: string;
  scanCategory: string;
  description: string;
  actualWeight: string;
  chargedWeight: string;
}

export function TrackingLookupPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const [shipmentCodeInput, setShipmentCodeInput] = useState('');
  const [searchedShipmentCodes, setSearchedShipmentCodes] = useState<string[]>([]);
  const [selectedShipmentCode, setSelectedShipmentCode] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const detailQuery = useTrackingDetailQuery(accessToken, selectedShipmentCode);
  const statusHistoryRows = selectedShipmentCode
    ? buildTrackingStatusHistoryRows(detailQuery.data?.timeline ?? [], selectedShipmentCode)
    : [];
  const isUsingMockHistory =
    Boolean(selectedShipmentCode) && (detailQuery.data?.timeline.length ?? 0) === 0;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedCodes = parseShipmentCodes(shipmentCodeInput);

    if (parsedCodes.length === 0) {
      setInputError('Vui lòng nhập ít nhất một mã vận đơn.');
      return;
    }

    setInputError(null);
    setSearchedShipmentCodes((currentCodes) => mergeShipmentCodes(currentCodes, parsedCodes));
    setSelectedShipmentCode(parsedCodes[0]);
    setShipmentCodeInput('');
  };

  return (
    <section className="ops-tracking-lookup">
      <header className="ops-tracking-lookup__heading">
        <h2>Tra hành trình</h2>
        <p>Nhập nhiều mã vận đơn (mỗi dòng một mã) để tra cứu nhiều đơn cùng lúc.</p>
      </header>

      <div className="ops-tracking-lookup__grid">
        <article className="ops-tracking-lookup__left-column">
          <section className="ops-tracking-lookup__panel">
            <h3>Cột mã vận đơn</h3>
            <form onSubmit={onSubmit} className="ops-tracking-lookup__form">
              <textarea
                value={shipmentCodeInput}
                onChange={(event) => setShipmentCodeInput(event.target.value)}
                placeholder="Ví dụ: JT0123456789&#10;JT0987654321"
                rows={5}
              />
              <div className="ops-tracking-lookup__form-actions">
                <button type="submit">Tìm kiếm</button>
                <button
                  type="button"
                  className="ops-tracking-lookup__ghost-btn"
                  onClick={() => {
                    setShipmentCodeInput('');
                    setInputError(null);
                  }}
                >
                  Làm mới
                </button>
              </div>
            </form>
            {inputError ? <p className="ops-tracking-lookup__error">{inputError}</p> : null}
          </section>

          <section className="ops-tracking-lookup__panel">
            <div className="ops-tracking-lookup__list-header">
              <h3>Mã đã tra cứu</h3>
              <span>{searchedShipmentCodes.length}</span>
            </div>
            {searchedShipmentCodes.length === 0 ? (
              <p className="ops-tracking-lookup__empty">Chưa có mã vận đơn.</p>
            ) : (
              <ul className="ops-tracking-lookup__code-list">
                {searchedShipmentCodes.map((shipmentCode) => (
                  <li key={shipmentCode}>
                    <button
                      type="button"
                      className={
                        shipmentCode === selectedShipmentCode
                          ? 'ops-tracking-lookup__code-btn ops-tracking-lookup__code-btn--active'
                          : 'ops-tracking-lookup__code-btn'
                      }
                      onClick={() => setSelectedShipmentCode(shipmentCode)}
                    >
                      {shipmentCode}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>

        <article className="ops-tracking-lookup__right-column">
          <header className="ops-tracking-lookup__log-header">
            <h3>Lịch sử trạng thái</h3>
            {selectedShipmentCode ? <strong>{selectedShipmentCode}</strong> : null}
          </header>

          {!selectedShipmentCode ? (
            <p className="ops-tracking-lookup__empty">
              Chọn mã vận đơn ở cột trái để xem lịch sử trạng thái.
            </p>
          ) : null}

          {selectedShipmentCode && detailQuery.isLoading ? (
            <p>Đang tải log trạng thái vận đơn...</p>
          ) : null}

          {selectedShipmentCode && detailQuery.isError ? (
            <p className="ops-tracking-lookup__error">
              Chưa lấy được timeline từ API. Đang hiển thị khung dữ liệu mẫu.
            </p>
          ) : null}

          {selectedShipmentCode ? <TrackingStatusHistoryTable rows={statusHistoryRows} /> : null}

          {isUsingMockHistory ? (
            <p className="ops-tracking-lookup__empty">Đang hiển thị dữ liệu mẫu cho giao diện.</p>
          ) : null}
        </article>
      </div>
    </section>
  );
}

function parseShipmentCodes(rawValue: string): string[] {
  const codes = rawValue
    .split(/[\n,;\t ]+/)
    .map((code) => code.trim().toUpperCase())
    .filter((code) => code.length > 0);

  return Array.from(new Set(codes));
}

function mergeShipmentCodes(currentCodes: string[], incomingCodes: string[]): string[] {
  const nextCodes = [...incomingCodes];

  currentCodes.forEach((code) => {
    if (!nextCodes.includes(code)) {
      nextCodes.push(code);
    }
  });

  return nextCodes.slice(0, 120);
}

function buildTrackingStatusHistoryRows(
  timeline: TrackingTimelineEventDto[],
  shipmentCode: string,
): TrackingStatusHistoryRow[] {
  if (timeline.length === 0) {
    return buildMockTrackingStatusHistoryRows(shipmentCode);
  }

  return timeline.map((event, index) => ({
    id: event.id,
    stt: index + 1,
    scanTime: formatDateTime(event.occurredAt),
    uploadedTime: formatDateTime(event.occurredAt),
    scanCategory: event.eventType,
    description: buildTimelineDescription(event),
    actualWeight: '--',
    chargedWeight: '--',
  }));
}

function buildTimelineDescription(event: TrackingTimelineEventDto): string {
  const location = event.locationText ?? event.locationCode ?? 'Không xác định vị trí';
  const status = event.statusAfterEvent ?? event.eventType;

  return `[${location}] ${status} (${event.eventSource})`;
}

function buildMockTrackingStatusHistoryRows(shipmentCode: string): TrackingStatusHistoryRow[] {
  const baseRows = [
    {
      scanTime: '2023-07-20 10:36:56',
      uploadedTime: '2023-07-20 10:53:43',
      scanCategory: 'Lấy hàng',
      description:
        '[(NAA) Nghi Lộc 2] Tiến hành quét [Lấy hàng]. Nhân viên quét mã [Võ Văn Thức].',
      actualWeight: '--',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-20 10:51:27',
      uploadedTime: '2023-07-20 10:51:54',
      scanCategory: 'Lấy hàng',
      description: `[(NAA) Nghi Lộc 2] Tiến hành quét [Lấy hàng]. Mã vận đơn [${shipmentCode}].`,
      actualWeight: '--',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-20 10:51:56',
      uploadedTime: '2023-07-20 10:52:26',
      scanCategory: 'Quét mã nhập kho',
      description: '[(NAA) Nghi Lộc 2] Đã nhập kho. Nhân viên quét mã [Võ Văn Thức].',
      actualWeight: '--',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-20 20:58:58',
      uploadedTime: '2023-07-20 20:58:58',
      scanCategory: 'TT hàng đến',
      description:
        'Chuyển phát nhanh đến [(TTKT NGHỆ AN)], trạm trước là []. Nhân viên quét mã [Nguyễn Thị Thùy].',
      actualWeight: '0.05',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-20 20:59:44',
      uploadedTime: '2023-07-20 20:59:45',
      scanCategory: 'Đóng bao',
      description: 'Hàng chuyển nhanh tại [(TTKT NGHỆ AN)] đã tiến hành đóng bao [B001826128].',
      actualWeight: '--',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-20 21:04:33',
      uploadedTime: '2023-07-20 21:14:29',
      scanCategory: 'Nhận hàng',
      description: '[(NAA) Nghi Lộc 2] của [HQ1] đã lấy hàng. Nhân viên quét mã [HQ].',
      actualWeight: '--',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-20 21:11:33',
      uploadedTime: '2023-07-20 21:14:30',
      scanCategory: 'Gửi hàng',
      description: 'Hàng chuyển nhanh tại [(TTKT NGHỆ AN)] quét xe đi, gửi đến [(TTKT ĐÀ NẴNG)].',
      actualWeight: '--',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-21 01:24:11',
      uploadedTime: '2023-07-21 01:24:17',
      scanCategory: 'Xe đi',
      description: 'Mã tuyến đường [238GW0236GW00130]. Biển số xe [37H05713]. Tem xe [DKGX23072100178].',
      actualWeight: '--',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-21 11:21:26',
      uploadedTime: '2023-07-21 11:21:30',
      scanCategory: 'Xe đến',
      description: 'Mã tuyến đường [238GW0236GW00130]. Biển số xe [37H05713] đến [(TTKT ĐÀ NẴNG)].',
      actualWeight: '--',
      chargedWeight: '--',
    },
  ] as const;

  return baseRows.map((row, index) => ({
    id: `mock-${index + 1}`,
    stt: index + 1,
    ...row,
  }));
}

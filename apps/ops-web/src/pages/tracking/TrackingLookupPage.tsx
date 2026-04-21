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
      setInputError('Vui long nhap it nhat mot ma van don.');
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
        <h2>Tra hanh trinh</h2>
        <p>Nhap nhieu ma van don (moi dong mot ma) de tra cuu nhieu don cung luc.</p>
      </header>

      <div className="ops-tracking-lookup__grid">
        <article className="ops-tracking-lookup__left-column">
          <section className="ops-tracking-lookup__panel">
            <h3>Cot ma van don</h3>
            <form onSubmit={onSubmit} className="ops-tracking-lookup__form">
              <textarea
                value={shipmentCodeInput}
                onChange={(event) => setShipmentCodeInput(event.target.value)}
                placeholder="Vi du: JT0123456789&#10;JT0987654321"
                rows={5}
              />
              <div className="ops-tracking-lookup__form-actions">
                <button type="submit">Tim kiem</button>
                <button
                  type="button"
                  className="ops-tracking-lookup__ghost-btn"
                  onClick={() => {
                    setShipmentCodeInput('');
                    setInputError(null);
                  }}
                >
                  Lam moi
                </button>
              </div>
            </form>
            {inputError ? <p className="ops-tracking-lookup__error">{inputError}</p> : null}
          </section>

          <section className="ops-tracking-lookup__panel">
            <div className="ops-tracking-lookup__list-header">
              <h3>Ma da tra cuu</h3>
              <span>{searchedShipmentCodes.length}</span>
            </div>
            {searchedShipmentCodes.length === 0 ? (
              <p className="ops-tracking-lookup__empty">Chua co ma van don.</p>
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
            <h3>Lich su trang thai</h3>
            {selectedShipmentCode ? <strong>{selectedShipmentCode}</strong> : null}
          </header>

          {!selectedShipmentCode ? (
            <p className="ops-tracking-lookup__empty">
              Chon ma van don o cot trai de xem lich su trang thai.
            </p>
          ) : null}

          {selectedShipmentCode && detailQuery.isLoading ? (
            <p>Dang tai log trang thai van don...</p>
          ) : null}

          {selectedShipmentCode && detailQuery.isError ? (
            <p className="ops-tracking-lookup__error">
              Chua lay duoc timeline tu API. Dang hien thi khung du lieu mau.
            </p>
          ) : null}

          {selectedShipmentCode ? <TrackingStatusHistoryTable rows={statusHistoryRows} /> : null}

          {isUsingMockHistory ? (
            <p className="ops-tracking-lookup__empty">Dang hien thi du lieu mau cho giao dien.</p>
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
  const location = event.locationText ?? event.locationCode ?? 'Khong xac dinh vi tri';
  const status = event.statusAfterEvent ?? event.eventType;

  return `[${location}] ${status} (${event.eventSource})`;
}

function buildMockTrackingStatusHistoryRows(shipmentCode: string): TrackingStatusHistoryRow[] {
  const baseRows = [
    {
      scanTime: '2023-07-20 10:36:56',
      uploadedTime: '2023-07-20 10:53:43',
      scanCategory: 'Lay hang',
      description:
        '[(NAA) Nghi Loc 2] Tien hanh quet [Lay hang] scan. Nhan vien quet ma [Vo Van Thuc].',
      actualWeight: '--',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-20 10:51:27',
      uploadedTime: '2023-07-20 10:51:54',
      scanCategory: 'Lay hang',
      description: `[(NAA) Nghi Loc 2] Tien hanh quet [Lay hang] scan. Ma van don [${shipmentCode}].`,
      actualWeight: '--',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-20 10:51:56',
      uploadedTime: '2023-07-20 10:52:26',
      scanCategory: 'Quet ma nhap kho',
      description: '[(NAA) Nghi Loc 2] Da nhap kho. Nhan vien quet ma [Vo Van Thuc].',
      actualWeight: '--',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-20 20:58:58',
      uploadedTime: '2023-07-20 20:58:58',
      scanCategory: 'TT hang den',
      description:
        'Chuyen phat nhanh den [(TTKT NGHE AN)] tram truoc la []. Nhan vien quet ma [Nguyen Thi Thuy].',
      actualWeight: '0.05',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-20 20:59:44',
      uploadedTime: '2023-07-20 20:59:45',
      scanCategory: 'Dong bao',
      description: 'Hang chuyen nhanh tai [(TTKT NGHE AN)] da tien hanh dong bao [B001826128].',
      actualWeight: '--',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-20 21:04:33',
      uploadedTime: '2023-07-20 21:14:29',
      scanCategory: 'Nhan hang',
      description: '[(NAA) Nghi Loc 2] cua [HQ1] da lay hang. Nhan vien quet ma [HQ].',
      actualWeight: '--',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-20 21:11:33',
      uploadedTime: '2023-07-20 21:14:30',
      scanCategory: 'Gui hang',
      description: 'Hang chuyen nhanh tai [(TTKT NGHE AN)] quet xe di, gui den [(TTKT DA NANG)].',
      actualWeight: '--',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-21 01:24:11',
      uploadedTime: '2023-07-21 01:24:17',
      scanCategory: 'Xe di',
      description: 'Ma tuyen duong [238GW0236GW00130]. Bien so xe [37H05713]. Tem xe [DKGX23072100178].',
      actualWeight: '--',
      chargedWeight: '--',
    },
    {
      scanTime: '2023-07-21 11:21:26',
      uploadedTime: '2023-07-21 11:21:30',
      scanCategory: 'Xe den',
      description: 'Ma tuyen duong [238GW0236GW00130]. Bien so xe [37H05713] den [(TTKT DA NANG)].',
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

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { useTrackingDetailQuery } from '../../features/tracking/tracking.api';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { TrackingTimelineTable } from './TrackingTimelineTable';
import './TrackingLookupPage.css';

export function TrackingLookupPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const [shipmentCodeInput, setShipmentCodeInput] = useState('');
  const [searchedShipmentCodes, setSearchedShipmentCodes] = useState<string[]>([]);
  const [selectedShipmentCode, setSelectedShipmentCode] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const detailQuery = useTrackingDetailQuery(accessToken, selectedShipmentCode);

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
              <p className="ops-tracking-lookup__empty">
                Chưa có mã vận đơn.
              </p>
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
              Chọn mã vân đơn ở cột trái để xem lịch sử trạng thái.
            </p>
          ) : null}

          {selectedShipmentCode && detailQuery.isLoading ? (
            <p>Dang tai log trang thai van don...</p>
          ) : null}

          {selectedShipmentCode && detailQuery.isError ? (
            <p className="ops-tracking-lookup__error">{getErrorMessage(detailQuery.error)}</p>
          ) : null}

          {detailQuery.data?.current ? (
            <div className="ops-tracking-lookup__summary-grid">
              <div>
                <small>Trang thai hien tai</small>
                <strong>{detailQuery.data.current.currentStatus ?? 'Khong co'}</strong>
              </div>
              <div>
                <small>Vi tri hien tai</small>
                <strong>
                  {detailQuery.data.current.currentLocationText ??
                    detailQuery.data.current.currentLocation ??
                    'Khong co'}
                </strong>
              </div>
              <div>
                <small>Su kien cuoi</small>
                <strong>{detailQuery.data.current.lastEventType ?? 'Khong co'}</strong>
              </div>
              <div>
                <small>Cap nhat luc</small>
                <strong>{formatDateTime(detailQuery.data.current.updatedAt)}</strong>
              </div>
            </div>
          ) : null}

          {selectedShipmentCode &&
          detailQuery.data &&
          detailQuery.data.timeline.length === 0 ? (
            <p>Khong co log timeline cho van don da chon.</p>
          ) : null}

          {detailQuery.data && detailQuery.data.timeline.length > 0 ? (
            <TrackingTimelineTable items={detailQuery.data.timeline} />
          ) : null}

          {selectedShipmentCode ? (
            <p className="ops-tracking-lookup__detail-link">
              <Link to={routePaths.trackingDetail(selectedShipmentCode)}>
                Mo trang chi tiet hanh trinh
              </Link>
            </p>
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

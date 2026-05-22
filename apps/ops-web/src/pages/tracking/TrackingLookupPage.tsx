import React, { useState } from 'react';

import {
  useOperationTimelineQuery,
  useTrackingDetailQuery,
} from '../../features/tracking/tracking.api';
import type {
  OperationEntityTypeDto,
  OperationTimelineEventDto,
  TrackingTimelineEventDto,
} from '../../features/tracking/tracking.types';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { TrackingStatusHistoryTable } from './TrackingStatusHistoryTable';
import './TrackingLookupPage.css';

interface TrackingStatusHistoryRow {
  id: string;
  stt: number;
  scanTime: string;
  uploadedTime: string;
  action: string;
  status: string;
  location: string;
  source: string;
  description: string;
  actualWeight: string;
  chargedWeight: string;
}

type ControlTowerMode = 'shipment' | 'operation';

interface OperationTarget {
  entityType: OperationEntityTypeDto;
  entityCode: string;
}

const OPERATION_ENTITY_LABELS: Record<OperationEntityTypeDto, string> = {
  SHIPMENT: 'Vận đơn',
  MANIFEST: 'Bao',
  TRIP: 'Chuyến xe',
};

export function TrackingLookupPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const [mode, setMode] = useState<ControlTowerMode>('shipment');
  const [shipmentCodeInput, setShipmentCodeInput] = useState('');
  const [searchedShipmentCodes, setSearchedShipmentCodes] = useState<string[]>([]);
  const [selectedShipmentCode, setSelectedShipmentCode] = useState('');
  const [operationCodeInput, setOperationCodeInput] = useState('');
  const [operationEntityType, setOperationEntityType] =
    useState<OperationEntityTypeDto>('SHIPMENT');
  const [searchedOperationTargets, setSearchedOperationTargets] = useState<OperationTarget[]>([]);
  const [selectedOperationTarget, setSelectedOperationTarget] = useState<OperationTarget | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const detailQuery = useTrackingDetailQuery(accessToken, selectedShipmentCode);
  const operationTimelineQuery = useOperationTimelineQuery(
    accessToken,
    selectedOperationTarget
      ? {
          entityType: selectedOperationTarget.entityType,
          entityCode: selectedOperationTarget.entityCode,
          limit: 200,
        }
      : {},
    Boolean(selectedOperationTarget),
  );
  const statusHistoryRows = selectedShipmentCode
    ? buildTrackingStatusHistoryRows(detailQuery.data?.timeline ?? [])
    : [];
  const operationStatusHistoryRows = selectedOperationTarget
    ? buildOperationStatusHistoryRows(operationTimelineQuery.data ?? [])
    : [];

  const onShipmentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

  const onOperationSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entityCode = operationCodeInput.trim().toUpperCase();

    if (!entityCode) {
      setInputError('Vui lòng nhập mã cần theo dõi.');
      return;
    }

    const target = {
      entityType: operationEntityType,
      entityCode,
    };

    setInputError(null);
    setSearchedOperationTargets((currentTargets) =>
      mergeOperationTargets(currentTargets, [target]),
    );
    setSelectedOperationTarget(target);
    setOperationCodeInput('');
  };

  return (
    <section className="ops-tracking-lookup">
      <header className="ops-tracking-lookup__heading">
        <h2>Control Tower vận hành</h2>
        <p>Theo dõi timeline theo vận đơn, bao và chuyến xe từ projection vận hành.</p>
      </header>

      <div className="ops-tracking-lookup__mode-switch" role="tablist" aria-label="Control Tower">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'shipment'}
          className={mode === 'shipment' ? 'ops-tracking-lookup__mode-btn ops-tracking-lookup__mode-btn--active' : 'ops-tracking-lookup__mode-btn'}
          onClick={() => {
            setMode('shipment');
            setInputError(null);
          }}
        >
          Vận đơn
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'operation'}
          className={mode === 'operation' ? 'ops-tracking-lookup__mode-btn ops-tracking-lookup__mode-btn--active' : 'ops-tracking-lookup__mode-btn'}
          onClick={() => {
            setMode('operation');
            setInputError(null);
          }}
        >
          Projection
        </button>
      </div>

      <div className="ops-tracking-lookup__grid">
        <article className="ops-tracking-lookup__left-column">
          {mode === 'shipment' ? (
            <>
              <section className="ops-tracking-lookup__panel">
                <h3>Cột mã vận đơn</h3>
                <form onSubmit={onShipmentSubmit} className="ops-tracking-lookup__form">
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
            </>
          ) : (
            <>
              <section className="ops-tracking-lookup__panel">
                <h3>Control Tower</h3>
                <form onSubmit={onOperationSubmit} className="ops-tracking-lookup__form">
                  <label className="ops-tracking-lookup__field">
                    <span>Đối tượng</span>
                    <select
                      value={operationEntityType}
                      onChange={(event) =>
                        setOperationEntityType(event.target.value as OperationEntityTypeDto)
                      }
                    >
                      <option value="SHIPMENT">Vận đơn</option>
                      <option value="MANIFEST">Bao</option>
                      <option value="TRIP">Chuyến xe</option>
                    </select>
                  </label>
                  <label className="ops-tracking-lookup__field">
                    <span>Mã</span>
                    <input
                      value={operationCodeInput}
                      onChange={(event) => setOperationCodeInput(event.target.value)}
                      placeholder="LH-HCM-HN-260522-01"
                    />
                  </label>
                  <div className="ops-tracking-lookup__form-actions">
                    <button type="submit">Tìm kiếm</button>
                    <button
                      type="button"
                      className="ops-tracking-lookup__ghost-btn"
                      onClick={() => {
                        setOperationCodeInput('');
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
                  <h3>Đối tượng đã tra</h3>
                  <span>{searchedOperationTargets.length}</span>
                </div>
                {searchedOperationTargets.length === 0 ? (
                  <p className="ops-tracking-lookup__empty">Chưa có đối tượng.</p>
                ) : (
                  <ul className="ops-tracking-lookup__code-list">
                    {searchedOperationTargets.map((target) => {
                      const key = toOperationTargetKey(target);
                      const isActive =
                        selectedOperationTarget &&
                        toOperationTargetKey(selectedOperationTarget) === key;

                      return (
                        <li key={key}>
                          <button
                            type="button"
                            className={
                              isActive
                                ? 'ops-tracking-lookup__code-btn ops-tracking-lookup__code-btn--active'
                                : 'ops-tracking-lookup__code-btn'
                            }
                            onClick={() => setSelectedOperationTarget(target)}
                          >
                            <span className="ops-tracking-lookup__code-type">
                              {OPERATION_ENTITY_LABELS[target.entityType]}
                            </span>
                            {target.entityCode}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          )}
        </article>

        <article className="ops-tracking-lookup__right-column">
          {mode === 'shipment' ? (
            <>
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
                  Chưa lấy được timeline từ API.
                </p>
              ) : null}

              {selectedShipmentCode ? <TrackingStatusHistoryTable rows={statusHistoryRows} /> : null}
            </>
          ) : (
            <>
              <header className="ops-tracking-lookup__log-header">
                <h3>Timeline vận hành</h3>
                {selectedOperationTarget ? (
                  <strong>
                    {OPERATION_ENTITY_LABELS[selectedOperationTarget.entityType]}{' '}
                    {selectedOperationTarget.entityCode}
                  </strong>
                ) : null}
              </header>

              {!selectedOperationTarget ? (
                <p className="ops-tracking-lookup__empty">
                  Chọn đối tượng ở cột trái để xem timeline vận hành.
                </p>
              ) : null}

              {selectedOperationTarget && operationTimelineQuery.isLoading ? (
                <p>Đang tải projection timeline...</p>
              ) : null}

              {selectedOperationTarget && operationTimelineQuery.isError ? (
                <p className="ops-tracking-lookup__error">
                  Chưa lấy được projection timeline từ API.
                </p>
              ) : null}

              {selectedOperationTarget &&
              !operationTimelineQuery.isLoading &&
              !operationTimelineQuery.isError &&
              operationStatusHistoryRows.length === 0 ? (
                <p className="ops-tracking-lookup__empty">Projection chưa có event cho mã này.</p>
              ) : null}

              {selectedOperationTarget && operationStatusHistoryRows.length > 0 ? (
                <TrackingStatusHistoryTable rows={operationStatusHistoryRows} />
              ) : null}
            </>
          )}
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

function toOperationTargetKey(target: OperationTarget): string {
  return `${target.entityType}:${target.entityCode}`;
}

function mergeOperationTargets(
  currentTargets: OperationTarget[],
  incomingTargets: OperationTarget[],
): OperationTarget[] {
  const nextTargets = [...incomingTargets];
  const nextKeys = new Set(nextTargets.map(toOperationTargetKey));

  currentTargets.forEach((target) => {
    const key = toOperationTargetKey(target);
    if (!nextKeys.has(key)) {
      nextKeys.add(key);
      nextTargets.push(target);
    }
  });

  return nextTargets.slice(0, 120);
}

function buildTrackingStatusHistoryRows(
  timeline: TrackingTimelineEventDto[],
): TrackingStatusHistoryRow[] {
  if (timeline.length === 0) {
    return [];
  }

  return timeline.map((event, index) => {
    return {
      id: event.id,
      stt: index + 1,
      scanTime: formatDateTime(event.occurredAt),
      uploadedTime: formatDateTime(event.occurredAt),
      action: event.eventType,
      status: event.statusAfterEvent ?? '--',
      location: event.locationText ?? event.locationCode ?? 'Không xác định',
      source: event.eventSource,
      description: event.note || '--',
      actualWeight: '--',
      chargedWeight: '--',
    };
  });
}

function buildOperationStatusHistoryRows(
  timeline: OperationTimelineEventDto[],
): TrackingStatusHistoryRow[] {
  if (timeline.length === 0) {
    return [];
  }

  return timeline.map((event, index) => {
    return {
      id: event.id,
      stt: index + 1,
      scanTime: formatDateTime(event.occurredAt),
      uploadedTime: formatDateTime(event.occurredAt),
      action: event.eventType,
      status: event.statusAfterEvent ?? '--',
      location: event.locationText ?? event.locationCode ?? 'Không xác định',
      source: event.eventSource,
      description: buildOperationDescription(event),
      actualWeight: '--',
      chargedWeight: '--',
    };
  });
}

function buildOperationDescription(event: OperationTimelineEventDto): string {
  const relatedCodes = [
    event.relatedShipmentCode ? `VD: ${event.relatedShipmentCode}` : null,
    event.relatedManifestCode ? `Bao: ${event.relatedManifestCode}` : null,
    event.relatedTripCode ? `Chuyến: ${event.relatedTripCode}` : null,
  ].filter(Boolean);

  return [event.note, ...relatedCodes].filter(Boolean).join(' | ') || '--';
}

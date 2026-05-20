import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import qrcode from 'qrcode-generator';
import { ArrowLeft, Printer, RefreshCw } from 'lucide-react';

import {
  useManifestDetailQuery,
  useManifestsQuery,
} from '../../../../features/manifests/manifests.api';
import type {
  ManifestDetailDto,
  ManifestListItemDto,
} from '../../../../features/manifests/manifests.types';
import { routePaths } from '../../../../navigation/routes';
import { getErrorMessage } from '../../../../services/api/errors';
import { useAuthStore } from '../../../../store/authStore';
import { formatDateTime } from '../../../../utils/format';
import { formatManifestStatusLabel } from '../../../../utils/logisticsLabels';
import './LinehaulStyles.css';

interface SealHistoryRow {
  manifest: ManifestListItemDto;
  action: 'SEALED' | 'RECEIVED' | 'CREATED';
  timestamp: string | null | undefined;
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateBarcodeSvg(code: string): string {
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pattern = (hash % 100).toString(2).padStart(8, '0').repeat(5);
  const bars = pattern
    .split('')
    .map((bit, index) =>
      bit === '1'
        ? `<rect x="${index * (100 / pattern.length)}" y="0" width="1.4" height="46" fill="#000" />`
        : '',
    )
    .join('');

  return `<svg width="100%" height="46" viewBox="0 0 100 46" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="46" fill="#fff" />${bars}<rect x="0" y="0" width="2" height="46" fill="#000" /><rect x="97" y="0" width="3" height="46" fill="#000" /></svg>`;
}

function getQrDataUrl(data: Record<string, unknown>): string {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(JSON.stringify(data));
    qr.make();
    return qr.createDataURL(5);
  } catch {
    return '';
  }
}

function resolveSealDataQuality(manifest: ManifestListItemDto | null): string | null {
  if (!manifest) {
    return 'Chọn manifest/chuyến xe để in tem.';
  }

  if (!manifest.originHubCode || !manifest.destinationHubCode) {
    return 'Manifest thiếu hub đi hoặc hub đến.';
  }

  if ((manifest.shipmentCount ?? 0) <= 0) {
    return 'Manifest chưa có bao/kiện, chưa đủ dữ liệu in tem xe.';
  }

  return null;
}

function buildSealPrintHtml(
  manifest: ManifestListItemDto,
  detail: ManifestDetailDto | null,
): string {
  const shipmentCount = detail?.shipmentCodes?.length ?? manifest.shipmentCount ?? 0;
  const qrDataUrl = getQrDataUrl({
    manifestCode: manifest.manifestCode,
    from: manifest.originHubCode,
    to: manifest.destinationHubCode,
    shipmentCount,
    status: manifest.status,
  });

  return `
    <section class="seal-ticket">
      <header>
        <div>
          <h1>NEXUS EXPRESS</h1>
          <p>LINEHAUL VEHICLE SEAL</p>
        </div>
        <strong>${escapeHtml(formatManifestStatusLabel(manifest.status))}</strong>
      </header>
      <div class="seal-code">
        <span>Mã seal / manifest</span>
        <strong>${escapeHtml(manifest.manifestCode)}</strong>
      </div>
      <div class="barcode">${generateBarcodeSvg(manifest.manifestCode)}</div>
      <div class="route">
        <article>
          <span>Hub đi</span>
          <strong>${escapeHtml(manifest.originHubCode ?? 'Chưa có')}</strong>
        </article>
        <article>
          <span>Hub đến</span>
          <strong>${escapeHtml(manifest.destinationHubCode ?? 'Chưa có')}</strong>
        </article>
      </div>
      <div class="body">
        <article>
          <span>Số bao/kiện</span>
          <strong>${shipmentCount}</strong>
        </article>
        <article>
          <span>Thời gian seal</span>
          <strong>${escapeHtml(manifest.sealedAt ? formatDateTime(manifest.sealedAt) : 'Chưa seal')}</strong>
        </article>
      </div>
      <div class="qr">
        <img src="${qrDataUrl}" alt="QR seal" />
      </div>
      <footer>Tem xe in từ manifest-service. Chưa có domain linehaul riêng.</footer>
    </section>
  `;
}

function printSealTickets(
  manifests: ManifestListItemDto[],
  detailByManifestId: Map<string, ManifestDetailDto | null>,
): void {
  const printWindow = window.open('', 'linehaul-vehicle-seal-print', 'width=980,height=760');
  if (!printWindow) {
    return;
  }

  const tickets = manifests
    .map((manifest) => buildSealPrintHtml(manifest, detailByManifestId.get(manifest.id) ?? null))
    .join('');

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>In tem xe linehaul</title>
        <style>
          @page { size: A5; margin: 8mm; }
          body { margin: 0; font-family: Arial, sans-serif; color: #111827; }
          .seal-ticket { width: 100%; min-height: 185mm; box-sizing: border-box; border: 2px solid #111827; padding: 9mm; page-break-after: always; }
          .seal-ticket:last-child { page-break-after: auto; }
          header { display: flex; justify-content: space-between; gap: 12px; border-bottom: 3px solid #111827; padding-bottom: 8px; }
          h1 { margin: 0; font-size: 24px; letter-spacing: 0.04em; }
          p { margin: 4px 0 0; font-size: 12px; font-weight: 700; }
          header strong { align-self: start; border: 1px solid #111827; padding: 5px 8px; font-size: 12px; }
          .seal-code { display: grid; gap: 4px; margin: 14px 0 8px; text-align: center; }
          .seal-code span, .route span, .body span { color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; }
          .seal-code strong { font-size: 30px; letter-spacing: 0.08em; }
          .barcode { border: 1px solid #d1d5db; padding: 8px; }
          .route, .body { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 12px; }
          .route article, .body article { border: 2px solid #111827; padding: 10px; text-align: center; }
          .route strong { display: block; margin-top: 6px; font-size: 24px; }
          .body strong { display: block; margin-top: 6px; font-size: 18px; }
          .qr { display: flex; justify-content: center; margin-top: 14px; }
          .qr img { width: 116px; height: 116px; border: 1px solid #111827; }
          footer { margin-top: 14px; border-top: 1px solid #d1d5db; padding-top: 8px; color: #475569; font-size: 11px; text-align: center; }
        </style>
      </head>
      <body>${tickets}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function LinehaulVehicleSealPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const [keyword, setKeyword] = useState('');
  const [selectedManifestId, setSelectedManifestId] = useState('');
  const [batchSelection, setBatchSelection] = useState<string[]>([]);
  const [printError, setPrintError] = useState<string | null>(null);

  const manifestsQuery = useManifestsQuery(accessToken);
  const manifests = manifestsQuery.data ?? [];
  const selectedManifest =
    manifests.find((manifest) => manifest.id === selectedManifestId) ?? manifests[0] ?? null;
  const selectedManifestDetailQuery = useManifestDetailQuery(
    accessToken,
    selectedManifest?.id ?? '',
  );
  const selectedManifestDetail = selectedManifestDetailQuery.data ?? null;

  useEffect(() => {
    if (!selectedManifestId && manifests.length > 0) {
      setSelectedManifestId(manifests[0].id);
    }
  }, [manifests, selectedManifestId]);

  const filteredManifests = useMemo(() => {
    const normalizedKeyword = normalizeText(keyword);
    return manifests.filter(
      (manifest) =>
        !normalizedKeyword ||
        normalizeText(manifest.manifestCode).includes(normalizedKeyword) ||
        normalizeText(manifest.originHubCode).includes(normalizedKeyword) ||
        normalizeText(manifest.destinationHubCode).includes(normalizedKeyword),
    );
  }, [keyword, manifests]);

  const printableBatch = useMemo(
    () =>
      manifests.filter(
        (manifest) => batchSelection.includes(manifest.id) && !resolveSealDataQuality(manifest),
      ),
    [batchSelection, manifests],
  );

  const sealHistoryRows = useMemo<SealHistoryRow[]>(
    () =>
      manifests
        .map((manifest) => {
          if (manifest.sealedAt) {
            return { manifest, action: 'SEALED' as const, timestamp: manifest.sealedAt };
          }
          if (['RECEIVED', 'CLOSED'].includes((manifest.status ?? '').toUpperCase())) {
            return { manifest, action: 'RECEIVED' as const, timestamp: manifest.updatedAt };
          }
          return { manifest, action: 'CREATED' as const, timestamp: manifest.createdAt };
        })
        .sort((left, right) => (right.timestamp ?? '').localeCompare(left.timestamp ?? ''))
        .slice(0, 12),
    [manifests],
  );

  const selectedDisableReason = resolveSealDataQuality(selectedManifest);
  const shipmentCount =
    selectedManifestDetail?.shipmentCodes?.length ?? selectedManifest?.shipmentCount ?? 0;

  const toggleBatchSelection = (manifestId: string) => {
    setBatchSelection((current) =>
      current.includes(manifestId)
        ? current.filter((id) => id !== manifestId)
        : [...current, manifestId],
    );
  };

  const handlePrintSelected = () => {
    if (!selectedManifest || selectedDisableReason) {
      setPrintError(selectedDisableReason ?? 'Chưa chọn manifest để in tem xe.');
      return;
    }

    setPrintError(null);
    printSealTickets(
      [selectedManifest],
      new Map([[selectedManifest.id, selectedManifestDetail]]),
    );
  };

  const handlePrintBatch = () => {
    if (printableBatch.length === 0) {
      setPrintError('Không có manifest đủ dữ liệu trong batch để in tem xe.');
      return;
    }

    setPrintError(null);
    printSealTickets(printableBatch, new Map());
  };

  return (
    <section className="ops-linehaul-seal">
      <header className="ops-linehaul-seal__header">
        <div>
          <Link to={routePaths.linehaulTripManagement}>
            <ArrowLeft size={16} />
            Quản lý chuyến xe
          </Link>
          <small>LINEHAUL_VEHICLE_SEAL</small>
          <h2>Tem xe</h2>
          <p>
            Chọn manifest/chuyến xe từ manifest API để preview và in tem xe. Không
            dùng dữ liệu mẫu nếu API rỗng.
          </p>
        </div>
        <button type="button" onClick={() => void manifestsQuery.refetch()}>
          <RefreshCw size={16} />
          Làm mới
        </button>
      </header>

      {manifestsQuery.error ? (
        <p className="ops-linehaul-seal__error" role="alert">
          {getErrorMessage(manifestsQuery.error)}
        </p>
      ) : null}

      <section className="ops-linehaul-seal__grid">
        <section className="ops-linehaul-seal__panel">
          <header className="ops-linehaul-seal__panel-head">
            <h3>Chọn manifest/chuyến xe</h3>
            <span>{manifestsQuery.isLoading ? 'Đang tải...' : `${filteredManifests.length} dòng`}</span>
          </header>
          <div className="ops-linehaul-seal__search">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm manifest, hub đi, hub đến"
            />
          </div>
          {manifestsQuery.isLoading ? (
            <p className="ops-linehaul-seal__empty">Đang tải manifest...</p>
          ) : null}
          {!manifestsQuery.isLoading && filteredManifests.length === 0 ? (
            <p className="ops-linehaul-seal__empty">
              Không có manifest để in tem xe. Không fallback sang seed data.
            </p>
          ) : null}
          <div className="ops-linehaul-seal__list" role="listbox">
            {filteredManifests.map((manifest) => {
              const disableReason = resolveSealDataQuality(manifest);
              const isSelected = selectedManifest?.id === manifest.id;
              return (
                <article
                  key={manifest.id}
                  className={`ops-linehaul-seal__manifest-option${
                    isSelected ? ' ops-linehaul-seal__manifest-option--active' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={batchSelection.includes(manifest.id)}
                    onChange={() => toggleBatchSelection(manifest.id)}
                    aria-label={`Chọn batch ${manifest.manifestCode}`}
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedManifestId(manifest.id)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <strong>{manifest.manifestCode}</strong>
                    <span>
                      {manifest.originHubCode ?? 'Chưa có'} →{' '}
                      {manifest.destinationHubCode ?? 'Chưa có'} · {manifest.shipmentCount ?? 0} bao/kiện
                    </span>
                    {disableReason ? <em>{disableReason}</em> : null}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="ops-linehaul-seal__panel">
          <header className="ops-linehaul-seal__panel-head">
            <h3>Preview tem xe</h3>
            <span>{selectedManifest ? selectedManifest.manifestCode : 'Chưa chọn'}</span>
          </header>
          {selectedManifest ? (
            <div className="ops-linehaul-seal__ticket">
              <div className="ops-linehaul-seal__ticket-head">
                <strong>NEXUS EXPRESS</strong>
                <span>{formatManifestStatusLabel(selectedManifest.status)}</span>
              </div>
              <div className="ops-linehaul-seal__ticket-code">
                <span>Mã seal / manifest</span>
                <strong>{selectedManifest.manifestCode}</strong>
              </div>
              <div
                className="ops-linehaul-seal__barcode"
                dangerouslySetInnerHTML={{
                  __html: generateBarcodeSvg(selectedManifest.manifestCode),
                }}
              />
              <div className="ops-linehaul-seal__ticket-route">
                <article>
                  <span>Hub đi</span>
                  <strong>{selectedManifest.originHubCode ?? 'Chưa có'}</strong>
                </article>
                <article>
                  <span>Hub đến</span>
                  <strong>{selectedManifest.destinationHubCode ?? 'Chưa có'}</strong>
                </article>
              </div>
              <div className="ops-linehaul-seal__ticket-meta">
                <article>
                  <span>Số bao/kiện</span>
                  <strong>{shipmentCount}</strong>
                </article>
                <article>
                  <span>Thời gian seal</span>
                  <strong>
                    {selectedManifest.sealedAt
                      ? formatDateTime(selectedManifest.sealedAt)
                      : 'Chưa seal'}
                  </strong>
                </article>
              </div>
              {selectedDisableReason ? (
                <p className="ops-linehaul-seal__warning">{selectedDisableReason}</p>
              ) : null}
            </div>
          ) : (
            <p className="ops-linehaul-seal__empty">Chọn một manifest để preview tem xe.</p>
          )}
          {selectedManifestDetailQuery.isFetching ? (
            <p className="ops-linehaul-seal__empty">Đang tải chi tiết bao/kiện...</p>
          ) : null}
          {printError ? (
            <p className="ops-linehaul-seal__error" role="alert">
              {printError}
            </p>
          ) : null}
          <footer className="ops-linehaul-seal__actions">
            <button
              type="button"
              onClick={handlePrintSelected}
              disabled={Boolean(selectedDisableReason)}
              title={selectedDisableReason ?? 'In tem xe đang preview'}
            >
              <Printer size={16} />
              In tem đang chọn
            </button>
            <button
              type="button"
              onClick={handlePrintBatch}
              disabled={printableBatch.length === 0}
              title={
                printableBatch.length === 0
                  ? 'Batch chưa có manifest đủ dữ liệu'
                  : `In ${printableBatch.length} tem`
              }
            >
              <Printer size={16} />
              In batch ({printableBatch.length})
            </button>
          </footer>
        </section>
      </section>

      <section className="ops-linehaul-seal__panel">
        <header className="ops-linehaul-seal__panel-head">
          <h3>Lịch sử seal / manifest</h3>
          <span>{sealHistoryRows.length} dòng gần nhất</span>
        </header>
        <div className="ops-linehaul-seal__table-wrap">
          <table>
            <thead>
              <tr>
                <th>Manifest</th>
                <th>Hành động</th>
                <th>Hub đi</th>
                <th>Hub đến</th>
                <th>Bao/kiện</th>
                <th>Thời gian</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {sealHistoryRows.map((row) => (
                <tr key={`${row.manifest.id}-${row.action}`}>
                  <td>{row.manifest.manifestCode}</td>
                  <td>{row.action}</td>
                  <td>{row.manifest.originHubCode ?? 'Chưa có'}</td>
                  <td>{row.manifest.destinationHubCode ?? 'Chưa có'}</td>
                  <td>{row.manifest.shipmentCount ?? 0}</td>
                  <td>{formatDateTime(row.timestamp)}</td>
                  <td>
                    <Link to={routePaths.manifestDetail(row.manifest.id)}>Manifest detail</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!manifestsQuery.isLoading && sealHistoryRows.length === 0 ? (
          <p className="ops-linehaul-seal__empty">
            Chưa có lịch sử seal/manifest từ API.
          </p>
        ) : null}
      </section>
    </section>
  );
}

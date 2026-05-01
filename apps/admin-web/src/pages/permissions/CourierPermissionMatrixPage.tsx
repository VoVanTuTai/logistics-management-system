import React, { useMemo, useState } from 'react';

import {
  COURIER_PERMISSION_ACTORS,
  COURIER_PERMISSION_CATEGORIES,
  COURIER_PERMISSION_FEATURES,
  COURIER_PERMISSION_STORAGE_KEY,
  DEFAULT_COURIER_PERMISSION_MATRIX,
  countActorEnabledPermissions,
  normalizeCourierPermissionMatrix,
  type CourierPermissionActor,
  type CourierPermissionCategory,
  type CourierPermissionFeature,
  type CourierPermissionMatrix,
} from '../../features/permissions/courierPermissionMatrix';

type CategoryFilter = CourierPermissionCategory | '';

function loadInitialMatrix(): CourierPermissionMatrix {
  const rawValue = window.localStorage.getItem(COURIER_PERMISSION_STORAGE_KEY);

  if (!rawValue) {
    return normalizeCourierPermissionMatrix(DEFAULT_COURIER_PERMISSION_MATRIX);
  }

  try {
    return normalizeCourierPermissionMatrix(JSON.parse(rawValue));
  } catch {
    return normalizeCourierPermissionMatrix(DEFAULT_COURIER_PERMISSION_MATRIX);
  }
}

function matrixToJson(matrix: CourierPermissionMatrix): string {
  return JSON.stringify(matrix, null, 2);
}

export function CourierPermissionMatrixPage(): React.JSX.Element {
  const [matrix, setMatrix] = useState<CourierPermissionMatrix>(() => loadInitialMatrix());
  const [savedSnapshot, setSavedSnapshot] = useState(() => matrixToJson(matrix));
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('');
  const [notice, setNotice] = useState<string | null>(null);

  const visibleFeatures = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return COURIER_PERMISSION_FEATURES.filter((feature) => {
      if (category && feature.category !== category) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [feature.label, feature.id, feature.description]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [category, query]);

  const matrixJson = useMemo(() => matrixToJson(matrix), [matrix]);
  const isDirty = matrixJson !== savedSnapshot;
  const totalFeatures = COURIER_PERMISSION_FEATURES.length;

  const togglePermission = (
    actor: CourierPermissionActor,
    feature: CourierPermissionFeature,
  ) => {
    setNotice(null);
    setMatrix((current) => ({
      ...current,
      [actor]: {
        ...current[actor],
        [feature]: !current[actor][feature],
      },
    }));
  };

  const setActorPermissions = (actor: CourierPermissionActor, allowed: boolean) => {
    setNotice(null);
    setMatrix((current) => ({
      ...current,
      [actor]: COURIER_PERMISSION_FEATURES.reduce((acc, feature) => {
        acc[feature.id] = allowed;
        return acc;
      }, {} as Record<CourierPermissionFeature, boolean>),
    }));
  };

  const setFeatureForAllActors = (
    feature: CourierPermissionFeature,
    allowed: boolean,
  ) => {
    setNotice(null);
    setMatrix((current) =>
      COURIER_PERMISSION_ACTORS.reduce((acc, actor) => {
        acc[actor.id] = {
          ...current[actor.id],
          [feature]: allowed,
        };
        return acc;
      }, {} as CourierPermissionMatrix),
    );
  };

  const applyTestingFullAccess = () => {
    const nextMatrix = normalizeCourierPermissionMatrix(DEFAULT_COURIER_PERMISSION_MATRIX);
    setMatrix(nextMatrix);
    setNotice('Đã bật full quyền cho tất cả actor để test case.');
  };

  const saveMatrix = () => {
    window.localStorage.setItem(COURIER_PERMISSION_STORAGE_KEY, matrixJson);
    setSavedSnapshot(matrixJson);
    setNotice('Đã lưu ma trận phân quyền courier mobile.');
  };

  const resetSaved = () => {
    const nextMatrix = loadInitialMatrix();
    setMatrix(nextMatrix);
    setNotice('Đã tải lại cấu hình đã lưu.');
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(matrixJson);
    setNotice('Đã sao chép JSON ma trận phân quyền.');
  };

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div>
          <p style={styles.kicker}>Courier mobile access control</p>
          <h2 style={styles.title}>Ma trận phân quyền thao tác mobile</h2>
          <p style={styles.subtitle}>
            Quản lý quyền theo actor Ops/Courier cho các chức năng quét, đóng bao, gỡ bao,
            giao nhận và kiểm soát vận hành.
          </p>
        </div>
        <div style={styles.heroActions}>
          <button type="button" onClick={applyTestingFullAccess}>
            Bật full quyền test
          </button>
          <button
            type="button"
            onClick={saveMatrix}
            disabled={!isDirty}
            style={isDirty ? undefined : styles.secondaryButton}
          >
            Lưu thay đổi
          </button>
        </div>
      </section>

      <section style={styles.summaryGrid}>
        {COURIER_PERMISSION_ACTORS.map((actor) => {
          const enabledCount = countActorEnabledPermissions(matrix, actor.id);

          return (
            <article key={actor.id} style={styles.summaryCard}>
              <div>
                <small style={styles.summaryLabel}>{actor.label}</small>
                <strong style={styles.summaryValue}>
                  {enabledCount}/{totalFeatures}
                </strong>
              </div>
              <p style={styles.summaryDescription}>{actor.description}</p>
              <div style={styles.bulkRow}>
                <button
                  type="button"
                  onClick={() => setActorPermissions(actor.id, true)}
                  style={styles.secondaryButton}
                >
                  Bật tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setActorPermissions(actor.id, false)}
                  style={styles.dangerGhostButton}
                >
                  Tắt tất cả
                </button>
              </div>
            </article>
          );
        })}

        <article style={styles.summaryCard}>
          <small style={styles.summaryLabel}>Chế độ hiện tại</small>
          <strong style={styles.summaryValue}>Full quyền test</strong>
          <p style={styles.summaryDescription}>
            Default matrix đang mở toàn bộ quyền cho mọi actor để test case vận hành.
          </p>
          <div style={styles.statusPillRow}>
            <span style={isDirty ? styles.warningPill : styles.successPill}>
              {isDirty ? 'Có thay đổi chưa lưu' : 'Đã đồng bộ bản lưu'}
            </span>
          </div>
        </article>
      </section>

      <section style={styles.toolbar}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm chức năng, mã quyền hoặc mô tả"
          style={styles.searchInput}
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as CategoryFilter)}
          style={styles.categorySelect}
        >
          <option value="">Tất cả nhóm chức năng</option>
          {Object.entries(COURIER_PERMISSION_CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" onClick={resetSaved} style={styles.secondaryButton}>
          Hoàn tác
        </button>
        <button type="button" onClick={() => void copyJson()} style={styles.secondaryButton}>
          Sao chép JSON
        </button>
      </section>

      {notice ? (
        <p style={styles.noticeText} role="status">
          {notice}
        </p>
      ) : null}

      <section style={styles.matrixWrap}>
        <table>
          <thead>
            <tr>
              <th style={styles.featureColumn}>Chức năng</th>
              <th>Nhóm</th>
              <th>Mức rủi ro</th>
              {COURIER_PERMISSION_ACTORS.map((actor) => (
                <th key={actor.id} style={styles.actorColumn}>
                  {actor.label}
                </th>
              ))}
              <th style={styles.actionColumn}>Thao tác nhanh</th>
            </tr>
          </thead>
          <tbody>
            {visibleFeatures.map((feature) => {
              const allActorsEnabled = COURIER_PERMISSION_ACTORS.every(
                (actor) => matrix[actor.id][feature.id],
              );

              return (
                <tr key={feature.id}>
                  <td style={styles.featureCell}>
                    <strong>{feature.label}</strong>
                    <small>{feature.id}</small>
                    <span>{feature.description}</span>
                  </td>
                  <td>{COURIER_PERMISSION_CATEGORIES[feature.category]}</td>
                  <td>
                    <span style={riskStyleByLevel[feature.riskLevel]}>
                      {feature.riskLevel}
                    </span>
                  </td>
                  {COURIER_PERMISSION_ACTORS.map((actor) => (
                    <td key={`${feature.id}-${actor.id}`} style={styles.actorCell}>
                      <label style={styles.switchLabel}>
                        <input
                          type="checkbox"
                          checked={matrix[actor.id][feature.id]}
                          onChange={() => togglePermission(actor.id, feature.id)}
                        />
                        <span>
                          {matrix[actor.id][feature.id] ? 'Cho phép' : 'Chặn'}
                        </span>
                      </label>
                    </td>
                  ))}
                  <td style={styles.quickActionCell}>
                    <button
                      type="button"
                      onClick={() => setFeatureForAllActors(feature.id, !allActorsEnabled)}
                      style={allActorsEnabled ? styles.dangerGhostButton : styles.secondaryButton}
                    >
                      {allActorsEnabled ? 'Chặn tất cả' : 'Cho tất cả'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {visibleFeatures.length === 0 ? (
          <div style={styles.emptyState}>Không có quyền nào khớp bộ lọc.</div>
        ) : null}
      </section>

      <section style={styles.jsonPanel}>
        <div>
          <strong>Payload cấu hình</strong>
          <p>
            Dùng JSON này để đối chiếu khi nối API lưu ma trận phân quyền cho mobile.
          </p>
        </div>
        <pre style={styles.jsonPreview}>{matrixJson}</pre>
      </section>
    </div>
  );
}

const basePillStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 8px',
  fontSize: 12,
  fontWeight: 800,
  display: 'inline-block',
};

const riskStyleByLevel: Record<string, React.CSSProperties> = {
  Thấp: {
    ...basePillStyle,
    color: '#166534',
    background: '#DCFCE7',
    border: '1px solid #BBF7D0',
  },
  'Trung bình': {
    ...basePillStyle,
    color: '#92400E',
    background: '#FEF3C7',
    border: '1px solid #FDE68A',
  },
  Cao: {
    ...basePillStyle,
    color: '#991B1B',
    background: '#FEE2E2',
    border: '1px solid #FECACA',
  },
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'grid',
    gap: 14,
  },
  hero: {
    border: '1px solid #c4d8ec',
    borderRadius: 16,
    background: '#f7fbff',
    padding: 14,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  kicker: {
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontSize: 11,
    color: '#46698e',
    fontWeight: 800,
  },
  title: {
    margin: '6px 0 4px',
    fontSize: 28,
    lineHeight: 1.08,
  },
  subtitle: {
    margin: 0,
    color: 'var(--admin-muted)',
    maxWidth: 780,
  },
  heroActions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 10,
  },
  summaryCard: {
    border: '1px solid var(--admin-border)',
    borderRadius: 14,
    background: '#ffffff',
    padding: 12,
    display: 'grid',
    gap: 8,
  },
  summaryLabel: {
    color: 'var(--admin-muted)',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  summaryValue: {
    display: 'block',
    fontSize: 24,
    marginTop: 2,
  },
  summaryDescription: {
    margin: 0,
    color: 'var(--admin-muted)',
    fontSize: 13,
  },
  bulkRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusPillRow: {
    display: 'flex',
  },
  successPill: {
    ...basePillStyle,
    color: '#166534',
    background: '#DCFCE7',
    border: '1px solid #BBF7D0',
  },
  warningPill: {
    ...basePillStyle,
    color: '#92400E',
    background: '#FEF3C7',
    border: '1px solid #FDE68A',
  },
  toolbar: {
    display: 'grid',
    gridTemplateColumns: 'minmax(240px, 1fr) minmax(190px, 240px) auto auto',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    width: '100%',
  },
  categorySelect: {
    width: '100%',
  },
  secondaryButton: {
    background: '#ffffff',
    color: 'var(--admin-primary)',
    borderColor: '#c4d8ec',
  },
  dangerGhostButton: {
    background: '#ffffff',
    color: 'var(--admin-danger)',
    borderColor: '#f3b6c0',
  },
  noticeText: {
    margin: 0,
    border: '1px solid #bfdbfe',
    background: '#eff6ff',
    color: '#1d4ed8',
    borderRadius: 12,
    padding: '8px 10px',
    fontWeight: 700,
  },
  matrixWrap: {
    border: '1px solid var(--admin-border)',
    borderRadius: 14,
    overflow: 'auto',
  },
  featureColumn: {
    minWidth: 300,
  },
  actorColumn: {
    width: 140,
    textAlign: 'center',
  },
  actionColumn: {
    width: 140,
  },
  featureCell: {
    display: 'grid',
    gap: 3,
  },
  actorCell: {
    textAlign: 'center',
  },
  switchLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    fontWeight: 800,
    fontSize: 12,
    color: '#334155',
    whiteSpace: 'nowrap',
  },
  quickActionCell: {
    whiteSpace: 'nowrap',
  },
  emptyState: {
    padding: 18,
    textAlign: 'center',
    color: 'var(--admin-muted)',
    background: '#ffffff',
  },
  jsonPanel: {
    border: '1px solid var(--admin-border)',
    borderRadius: 14,
    background: '#f8fbff',
    padding: 12,
    display: 'grid',
    gap: 8,
  },
  jsonPreview: {
    margin: 0,
    maxHeight: 260,
    overflow: 'auto',
    border: '1px solid #dbe8f5',
    borderRadius: 12,
    background: '#0f172a',
    color: '#e2e8f0',
    padding: 12,
    fontSize: 12,
  },
};

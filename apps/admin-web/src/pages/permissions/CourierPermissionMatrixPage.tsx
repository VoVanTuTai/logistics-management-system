import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useAdminUsersQuery } from '../../features/auth/auth.api';
import type { AdminUserDto } from '../../features/auth/auth.types';
import {
  COURIER_PERMISSION_ACTORS,
  COURIER_PERMISSION_CATEGORIES,
  COURIER_PERMISSION_FEATURES,
  COURIER_PERMISSION_STORAGE_KEY,
  DEFAULT_COURIER_PERMISSION_MATRIX,
  countActorEnabledPermissions,
  countUserEnabledPermissions,
  createDefaultUserPermissionMap,
  loadUserPermissionOverrides,
  normalizeCourierPermissionMatrix,
  normalizeUserPermissionMap,
  saveUserPermissionOverrides,
  type CourierPermissionActor,
  type CourierPermissionCategory,
  type CourierPermissionFeature,
  type CourierPermissionMatrix,
  type UserPermissionMap,
  type UserPermissionOverrides,
} from '../../features/permissions/courierPermissionMatrix';
import { useAuthStore } from '../../store/authStore';

type ViewMode = 'global' | 'per-user';
type CategoryFilter = CourierPermissionCategory | '';

/* ────────────────────────── helpers ────────────────────────── */

function loadGlobalMatrix(): CourierPermissionMatrix {
  const raw = window.localStorage.getItem(COURIER_PERMISSION_STORAGE_KEY);
  if (!raw) return normalizeCourierPermissionMatrix(DEFAULT_COURIER_PERMISSION_MATRIX);
  try { return normalizeCourierPermissionMatrix(JSON.parse(raw)); }
  catch { return normalizeCourierPermissionMatrix(DEFAULT_COURIER_PERMISSION_MATRIX); }
}

const RELEVANT_ROLES = new Set(['OPS_ADMIN', 'OPS_VIEWER', 'COURIER']);
function isRelevantUser(u: AdminUserDto) { return u.roles.some((r) => RELEVANT_ROLES.has(r)); }

/* ═══════════════════════ COMPONENT ═══════════════════════ */

export function CourierPermissionMatrixPage(): React.JSX.Element {
  const accessToken = useAuthStore((s) => s.session?.tokens.accessToken ?? null);

  /* ── view mode ────────────────────────────────────────── */
  const [viewMode, setViewMode] = useState<ViewMode>('global');

  /* ── global matrix state (existing) ───────────────────── */
  const [matrix, setMatrix] = useState<CourierPermissionMatrix>(loadGlobalMatrix);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(matrix));
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('');
  const [notice, setNotice] = useState<string | null>(null);

  /* ── per-user state ───────────────────────────────────── */
  const opsQuery = useAdminUsersQuery(accessToken, { roleGroup: 'OPS', status: '', hubCode: '', q: '' });
  const shipperQuery = useAdminUsersQuery(accessToken, { roleGroup: 'SHIPPER', status: '', hubCode: '', q: '' });

  const allUsers = useMemo(() => {
    const combined = [...(opsQuery.data ?? []), ...(shipperQuery.data ?? [])];
    return combined.filter(isRelevantUser);
  }, [opsQuery.data, shipperQuery.data]);

  const [overrides, setOverrides] = useState<UserPermissionOverrides>(loadUserPermissionOverrides);
  const [overridesSnapshot, setOverridesSnapshot] = useState(() => JSON.stringify(overrides));
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) =>
      u.username.toLowerCase().includes(q) ||
      (u.displayName ?? '').toLowerCase().includes(q) ||
      u.roles.join(',').toLowerCase().includes(q),
    );
  }, [allUsers, userSearch]);

  const selectedUser = useMemo(() => allUsers.find((u) => u.id === selectedUserId) ?? null, [allUsers, selectedUserId]);

  const selectedUserMap: UserPermissionMap = useMemo(() => {
    if (!selectedUserId) return createDefaultUserPermissionMap();
    return overrides[selectedUserId] ? normalizeUserPermissionMap(overrides[selectedUserId]) : createDefaultUserPermissionMap();
  }, [selectedUserId, overrides]);

  // auto-select first user
  useEffect(() => {
    if (viewMode === 'per-user' && !selectedUserId && allUsers.length > 0) {
      setSelectedUserId(allUsers[0].id);
    }
  }, [viewMode, selectedUserId, allUsers]);

  /* ── visible features (shared filter) ─────────────────── */
  const visibleFeatures = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COURIER_PERMISSION_FEATURES.filter((f) => {
      if (category && f.category !== category) return false;
      if (!q) return true;
      return [f.label, f.id, f.description].join(' ').toLowerCase().includes(q);
    });
  }, [category, query]);

  const totalFeatures = COURIER_PERMISSION_FEATURES.length;

  /* ── global actions ───────────────────────────────────── */
  const matrixJson = useMemo(() => JSON.stringify(matrix, null, 2), [matrix]);
  const isDirtyGlobal = matrixJson !== savedSnapshot;

  const toggleGlobal = (actor: CourierPermissionActor, feature: CourierPermissionFeature) => {
    setNotice(null);
    setMatrix((c) => ({ ...c, [actor]: { ...c[actor], [feature]: !c[actor][feature] } }));
  };
  const setActorAll = (actor: CourierPermissionActor, val: boolean) => {
    setNotice(null);
    setMatrix((c) => ({ ...c, [actor]: COURIER_PERMISSION_FEATURES.reduce((a, f) => { a[f.id] = val; return a; }, {} as Record<CourierPermissionFeature, boolean>) }));
  };
  const setFeatureAll = (feature: CourierPermissionFeature, val: boolean) => {
    setNotice(null);
    setMatrix((c) => COURIER_PERMISSION_ACTORS.reduce((a, act) => { a[act.id] = { ...c[act.id], [feature]: val }; return a; }, {} as CourierPermissionMatrix));
  };
  const saveGlobal = () => {
    window.localStorage.setItem(COURIER_PERMISSION_STORAGE_KEY, matrixJson);
    setSavedSnapshot(matrixJson);
    setNotice('Đã lưu ma trận phân quyền chung.');
  };
  const resetGlobal = () => { setMatrix(loadGlobalMatrix()); setNotice('Đã hoàn tác.'); };

  /* ── per-user actions ─────────────────────────────────── */
  const isDirtyUser = JSON.stringify(overrides) !== overridesSnapshot;

  const selectUser = useCallback((u: AdminUserDto) => {
    setSelectedUserId(u.id);
    setNotice(null);
  }, []);

  const toggleUserPerm = (feature: CourierPermissionFeature) => {
    if (!selectedUserId) return;
    setNotice(null);
    setOverrides((prev) => {
      const current = prev[selectedUserId] ? normalizeUserPermissionMap(prev[selectedUserId]) : createDefaultUserPermissionMap();
      return { ...prev, [selectedUserId]: { ...current, [feature]: !current[feature] } };
    });
  };

  const setUserAll = (val: boolean) => {
    if (!selectedUserId) return;
    setNotice(null);
    setOverrides((prev) => {
      const map = COURIER_PERMISSION_FEATURES.reduce((a, f) => { a[f.id] = val; return a; }, {} as UserPermissionMap);
      return { ...prev, [selectedUserId]: map };
    });
  };

  const resetUserToDefault = () => {
    if (!selectedUserId) return;
    setNotice(null);
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[selectedUserId];
      return next;
    });
    setNotice('Đã đặt về mặc định (full quyền) cho user này.');
  };

  const saveUserOverrides = () => {
    saveUserPermissionOverrides(overrides);
    setOverridesSnapshot(JSON.stringify(overrides));
    setNotice('Đã lưu phân quyền theo user.');
  };

  const resetUserOverrides = () => {
    const loaded = loadUserPermissionOverrides();
    setOverrides(loaded);
    setOverridesSnapshot(JSON.stringify(loaded));
    setNotice('Đã hoàn tác.');
  };

  const userEnabledCount = countUserEnabledPermissions(selectedUserMap);

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <div style={S.page}>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={S.hero}>
        <div>
          <p style={S.kicker}>Courier mobile access control</p>
          <h2 style={S.title}>Ma trận phân quyền thao tác mobile</h2>
          <p style={S.subtitle}>Quản lý quyền theo actor hoặc theo từng user cụ thể.</p>
        </div>
        <div style={S.tabRow}>
          <button type="button" onClick={() => setViewMode('global')} style={viewMode === 'global' ? S.tabActive : S.tabInactive}>Ma trận chung</button>
          <button type="button" onClick={() => setViewMode('per-user')} style={viewMode === 'per-user' ? S.tabActive : S.tabInactive}>Theo từng user</button>
        </div>
      </section>

      {/* ── Toolbar (shared) ─────────────────────────────── */}
      <section style={S.toolbar}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm chức năng..." style={S.searchInput} />
        <select value={category} onChange={(e) => setCategory(e.target.value as CategoryFilter)} style={S.catSelect}>
          <option value="">Tất cả nhóm</option>
          {Object.entries(COURIER_PERMISSION_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </section>

      {notice ? <p style={S.notice} role="status">{notice}</p> : null}

      {/* ═══════════ GLOBAL VIEW ═══════════ */}
      {viewMode === 'global' ? (
        <>
          <section style={S.summaryGrid}>
            {COURIER_PERMISSION_ACTORS.map((actor) => {
              const cnt = countActorEnabledPermissions(matrix, actor.id);
              return (
                <article key={actor.id} style={S.card}>
                  <div><small style={S.cardLabel}>{actor.label}</small><strong style={S.cardValue}>{cnt}/{totalFeatures}</strong></div>
                  <p style={S.cardDesc}>{actor.description}</p>
                  <div style={S.row}><button type="button" onClick={() => setActorAll(actor.id, true)} style={S.secBtn}>Bật tất cả</button><button type="button" onClick={() => setActorAll(actor.id, false)} style={S.danBtn}>Tắt tất cả</button></div>
                </article>
              );
            })}
          </section>
          <section style={S.tableWrap}>
            <table>
              <thead><tr>
                <th style={S.featCol}>Chức năng</th><th>Nhóm</th><th>Rủi ro</th>
                {COURIER_PERMISSION_ACTORS.map((a) => <th key={a.id} style={S.actCol}>{a.label}</th>)}
                <th style={S.actCol}>Nhanh</th>
              </tr></thead>
              <tbody>
                {visibleFeatures.map((f) => {
                  const allOn = COURIER_PERMISSION_ACTORS.every((a) => matrix[a.id][f.id]);
                  return (
                    <tr key={f.id}>
                      <td style={S.featCell}><strong>{f.label}</strong><small style={{color:'var(--admin-muted)',fontSize:11}}>{f.id}</small></td>
                      <td>{COURIER_PERMISSION_CATEGORIES[f.category]}</td>
                      <td><span style={riskS[f.riskLevel]}>{f.riskLevel}</span></td>
                      {COURIER_PERMISSION_ACTORS.map((a) => (
                        <td key={`${f.id}-${a.id}`} style={S.center}>
                          <label style={S.sw}><input type="checkbox" checked={matrix[a.id][f.id]} onChange={() => toggleGlobal(a.id, f.id)} /><span>{matrix[a.id][f.id] ? 'Cho phép' : 'Chặn'}</span></label>
                        </td>
                      ))}
                      <td style={S.center}><button type="button" onClick={() => setFeatureAll(f.id, !allOn)} style={allOn ? S.danBtn : S.secBtn}>{allOn ? 'Chặn tất cả' : 'Cho tất cả'}</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleFeatures.length === 0 ? <div style={S.empty}>Không có quyền nào khớp.</div> : null}
          </section>
          <div style={S.saveBar}>
            <span style={isDirtyGlobal ? S.dirtyPill : S.syncPill}>{isDirtyGlobal ? '● Chưa lưu' : '✓ Đã đồng bộ'}</span>
            <div style={S.row}><button type="button" onClick={resetGlobal} style={S.secBtn}>Hoàn tác</button><button type="button" onClick={saveGlobal} disabled={!isDirtyGlobal}>Lưu thay đổi</button></div>
          </div>
        </>
      ) : null}

      {/* ═══════════ PER-USER VIEW ═══════════ */}
      {viewMode === 'per-user' ? (
        <section style={S.perUserGrid}>
          {/* Left: user list */}
          <div style={S.userPanel}>
            <h3 style={S.panelTitle}>Chọn user</h3>
            <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Tìm user..." style={{width:'100%'}} />
            <div style={S.userScroll}>
              {(opsQuery.isLoading || shipperQuery.isLoading) ? <p style={S.muted}>Đang tải...</p> : null}
              {filteredUsers.map((u) => {
                const isSel = u.id === selectedUserId;
                const uMap = overrides[u.id] ? normalizeUserPermissionMap(overrides[u.id]) : createDefaultUserPermissionMap();
                const cnt = countUserEnabledPermissions(uMap);
                const hasOverride = Boolean(overrides[u.id]);
                return (
                  <button key={u.id} type="button" onClick={() => selectUser(u)} style={{...S.userCard, ...(isSel ? S.userSel : {})}}>
                    <div style={S.userTop}>
                      <strong style={{fontSize:13}}>{u.displayName || u.username}</strong>
                      {hasOverride ? <span style={S.customBadge}>Tuỳ chỉnh</span> : null}
                    </div>
                    <small style={S.muted}>{u.username} · {u.roles.join(', ')}</small>
                    <div style={S.bar}><div style={{...S.barFill, width:`${(cnt/totalFeatures)*100}%`}} /></div>
                    <small style={S.muted}>{cnt}/{totalFeatures} quyền</small>
                  </button>
                );
              })}
              {filteredUsers.length === 0 && !(opsQuery.isLoading || shipperQuery.isLoading) ? <p style={S.muted}>Không tìm thấy user.</p> : null}
            </div>
          </div>

          {/* Right: permission table for selected user */}
          <div style={S.rightPanel}>
            {selectedUser ? (
              <>
                <div style={S.userInfoBar}>
                  <div>
                    <h3 style={S.panelTitle}>{selectedUser.displayName || selectedUser.username}</h3>
                    <small style={S.muted}>{selectedUser.username} · {selectedUser.roles.join(', ')} · Hub: {selectedUser.hubCodes.join(', ') || '—'}</small>
                  </div>
                  <div style={S.counterBox}><strong style={S.counterVal}>{userEnabledCount}/{totalFeatures}</strong><small>quyền</small></div>
                </div>
                <div style={S.row}>
                  <button type="button" onClick={() => setUserAll(true)} style={S.secBtn}>Bật tất cả</button>
                  <button type="button" onClick={() => setUserAll(false)} style={S.danBtn}>Tắt tất cả</button>
                  <button type="button" onClick={resetUserToDefault} style={S.secBtn}>Đặt mặc định</button>
                </div>
                <div style={S.tableWrap}>
                  <table>
                    <thead><tr><th style={S.featCol}>Chức năng</th><th>Nhóm</th><th>Rủi ro</th><th style={{width:120,textAlign:'center'}}>Trạng thái</th></tr></thead>
                    <tbody>
                      {visibleFeatures.map((f) => (
                        <tr key={f.id}>
                          <td style={S.featCell}><strong>{f.label}</strong><small style={{color:'var(--admin-muted)',fontSize:11}}>{f.id}</small></td>
                          <td>{COURIER_PERMISSION_CATEGORIES[f.category]}</td>
                          <td><span style={riskS[f.riskLevel]}>{f.riskLevel}</span></td>
                          <td style={S.center}>
                            <label style={S.sw}><input type="checkbox" checked={selectedUserMap[f.id]} onChange={() => toggleUserPerm(f.id)} /><span style={selectedUserMap[f.id] ? {color:'#166534'} : {color:'#991B1B'}}>{selectedUserMap[f.id] ? 'Cho phép' : 'Chặn'}</span></label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {visibleFeatures.length === 0 ? <div style={S.empty}>Không có quyền nào khớp.</div> : null}
                </div>
                <div style={S.saveBar}>
                  <span style={isDirtyUser ? S.dirtyPill : S.syncPill}>{isDirtyUser ? '● Chưa lưu' : '✓ Đã đồng bộ'}</span>
                  <div style={S.row}><button type="button" onClick={resetUserOverrides} style={S.secBtn}>Hoàn tác</button><button type="button" onClick={saveUserOverrides} disabled={!isDirtyUser}>Lưu thay đổi</button></div>
                </div>
              </>
            ) : (
              <div style={S.empty}>Chọn một user từ danh sách bên trái để phân quyền.</div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/* ────────────────────────── STYLES ────────────────────────── */

const pill: React.CSSProperties = { borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 800, display: 'inline-block' };
const riskS: Record<string, React.CSSProperties> = {
  'Thấp': { ...pill, color: '#166534', background: '#DCFCE7', border: '1px solid #BBF7D0' },
  'Trung bình': { ...pill, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A' },
  'Cao': { ...pill, color: '#991B1B', background: '#FEE2E2', border: '1px solid #FECACA' },
};

const S: Record<string, React.CSSProperties> = {
  page: { display: 'grid', gap: 14 },
  hero: { border: '1px solid #c7d2fe', borderRadius: 16, background: 'var(--admin-surface-soft)', padding: 14, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  kicker: { margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, color: 'var(--admin-primary)', fontWeight: 800 },
  title: { margin: '6px 0 4px', fontSize: 28, lineHeight: 1.08 },
  subtitle: { margin: 0, color: 'var(--admin-muted)', maxWidth: 780 },
  tabRow: { display: 'flex', gap: 6 },
  tabActive: { background: 'var(--admin-primary)', color: '#fff', borderColor: 'var(--admin-primary)' },
  tabInactive: { background: '#fff', color: 'var(--admin-primary)', borderColor: '#c7d2fe' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 },
  card: { border: '1px solid var(--admin-border)', borderRadius: 14, background: '#fff', padding: 12, display: 'grid', gap: 8 },
  cardLabel: { color: 'var(--admin-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' },
  cardValue: { display: 'block', fontSize: 24, marginTop: 2 },
  cardDesc: { margin: 0, color: 'var(--admin-muted)', fontSize: 13 },
  toolbar: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: 200 },
  catSelect: { minWidth: 180 },
  notice: { margin: 0, border: '1px solid #c7d2fe', background: 'var(--admin-surface-soft)', color: 'var(--admin-primary)', borderRadius: 12, padding: '8px 10px', fontWeight: 700 },
  tableWrap: { border: '1px solid var(--admin-border)', borderRadius: 14, overflow: 'auto' },
  featCol: { minWidth: 260 },
  actCol: { width: 120, textAlign: 'center' },
  featCell: { display: 'grid', gap: 3 },
  center: { textAlign: 'center' },
  sw: { display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' },
  row: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  secBtn: { background: '#fff', color: 'var(--admin-primary)', borderColor: '#c7d2fe' },
  danBtn: { background: '#fff', color: 'var(--admin-danger)', borderColor: '#f3b6c0' },
  empty: { padding: 18, textAlign: 'center', color: 'var(--admin-muted)', background: '#fff' },
  saveBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: '1px solid var(--admin-border)', paddingTop: 10 },
  dirtyPill: { ...pill, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A' },
  syncPill: { ...pill, color: '#166534', background: '#DCFCE7', border: '1px solid #BBF7D0' },
  // per-user layout
  perUserGrid: { display: 'grid', gridTemplateColumns: '300px minmax(0,1fr)', gap: 14, alignItems: 'start' },
  userPanel: { border: '1px solid var(--admin-border)', borderRadius: 14, background: '#fff', padding: 12, display: 'grid', gap: 10, position: 'sticky', top: 16, maxHeight: 'calc(100vh - 140px)', overflow: 'hidden' },
  panelTitle: { margin: 0, fontSize: 16 },
  userScroll: { display: 'grid', gap: 6, overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' },
  userCard: { border: '1px solid var(--admin-border)', borderRadius: 12, background: '#fafbfd', padding: '10px 12px', cursor: 'pointer', textAlign: 'left', display: 'grid', gap: 4, transition: 'all .15s', color: 'var(--admin-text)' },
  userSel: { borderColor: 'var(--admin-primary)', background: 'var(--admin-surface-soft)', boxShadow: '0 0 0 2px rgba(79,70,229,.18)' },
  userTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  customBadge: { ...pill, fontSize: 10, padding: '2px 6px', color: '#92400E', background: '#FEF3C7' },
  muted: { color: 'var(--admin-muted)', fontSize: 12, margin: 0 },
  bar: { height: 4, borderRadius: 2, background: '#e2e8f0', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2, background: 'var(--admin-primary)', transition: 'width .3s' },
  rightPanel: { border: '1px solid var(--admin-border)', borderRadius: 14, background: '#fff', padding: 12, display: 'grid', gap: 12 },
  userInfoBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--admin-border)', paddingBottom: 10, gap: 12 },
  counterBox: { border: '1px solid #c7d2fe', borderRadius: 14, background: 'var(--admin-surface-soft)', padding: '8px 14px', textAlign: 'center', display: 'grid', gap: 2 },
  counterVal: { fontSize: 22, lineHeight: 1, color: 'var(--admin-primary)' },
};

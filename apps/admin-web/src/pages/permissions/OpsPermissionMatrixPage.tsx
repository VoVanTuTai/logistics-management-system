import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useAdminUsersQuery } from '../../features/auth/auth.api';
import type { AdminUserDto } from '../../features/auth/auth.types';
import {
  OPS_PERMISSION_ACTORS,
  OPS_PERMISSION_CATEGORIES,
  OPS_PERMISSION_FEATURES,
  OPS_PERMISSION_STORAGE_KEY,
  OPS_USER_OVERRIDE_STORAGE_KEY,
  DEFAULT_OPS_PERMISSION_MATRIX,
  countOpsActorEnabledPermissions,
  countOpsUserEnabledPermissions,
  createDefaultOpsUserPermissionMap,
  loadGlobalOpsMatrix,
  loadOpsUserPermissionOverrides,
  normalizeOpsPermissionMatrix,
  normalizeOpsUserPermissionMap,
  saveGlobalOpsMatrix,
  saveOpsUserPermissionOverride,
  type OpsPermissionActor,
  type OpsPermissionCategory,
  type OpsPermissionFeature,
  type OpsPermissionMatrix,
  type OpsUserPermissionMap,
  type OpsUserPermissionOverrides,
} from '../../features/permissions/opsPermissionMatrix';
import { useAuthStore } from '../../store/authStore';

type ViewMode = 'global' | 'per-user';
type CategoryFilter = OpsPermissionCategory | '';

function resolveUserOpsActor(u: AdminUserDto): OpsPermissionActor {
  const norm = (u.username || '').trim();
  const roles = u.roles || [];
  const hubCodes = u.hubCodes || [];

  if (
    norm === '20000000' ||
    norm === '10000001' ||
    roles.includes('HQ_OPS') ||
    roles.includes('HQ_MANAGER') ||
    roles.includes('SYSTEM_ADMIN')
  ) {
    return 'HQ_OPS';
  }

  if (
    (norm >= '20000001' && norm <= '20000006') ||
    (roles.includes('OPS_ADMIN') && !norm.startsWith('20001') && norm < '20000007')
  ) {
    return 'REGIONAL_OPS';
  }

  if (
    roles.includes('PROVINCIAL_OPS') ||
    (norm >= '20000007' && norm <= '20000069') ||
    hubCodes.some((h) => h.includes('B'))
  ) {
    return 'PROVINCIAL_OPS';
  }

  return 'HUB_OPS';
}

export function OpsPermissionMatrixPage(): React.JSX.Element {
  const accessToken = useAuthStore((s) => s.session?.tokens.accessToken ?? null);

  /* ── View mode ────────────────────────────────────────── */
  const [viewMode, setViewMode] = useState<ViewMode>('global');

  /* ── Global matrix state ──────────────────────────────── */
  const [matrix, setMatrix] = useState<OpsPermissionMatrix>(loadGlobalOpsMatrix);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(matrix, null, 2));
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('');
  const [notice, setNotice] = useState<string | null>(null);

  /* ── Per-user state ───────────────────────────────────── */
  const opsQuery = useAdminUsersQuery(accessToken, { roleGroup: 'OPS', status: '', hubCode: '', q: '' });
  const allUsers = useMemo(() => opsQuery.data ?? [], [opsQuery.data]);

  const [overrides, setOverrides] = useState<OpsUserPermissionOverrides>(loadOpsUserPermissionOverrides);
  const [overrideSnapshots, setOverrideSnapshots] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(overrides).map(([userId, permissions]) => [
        userId,
        JSON.stringify(normalizeOpsUserPermissionMap(permissions)),
      ]),
    ),
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.displayName ?? '').toLowerCase().includes(q) ||
        u.roles.join(',').toLowerCase().includes(q) ||
        (u.hubCodes ?? []).join(',').toLowerCase().includes(q),
    );
  }, [allUsers, userSearch]);

  const selectedUser = useMemo(
    () => allUsers.find((u) => u.id === selectedUserId) ?? null,
    [allUsers, selectedUserId],
  );

  const selectedUserActor: OpsPermissionActor = useMemo(() => {
    if (!selectedUser) return 'HUB_OPS';
    return resolveUserOpsActor(selectedUser);
  }, [selectedUser]);

  const selectedUserActorMeta = useMemo(() => {
    return OPS_PERMISSION_ACTORS.find((a) => a.id === selectedUserActor) ?? OPS_PERMISSION_ACTORS[3];
  }, [selectedUserActor]);

  const userHasOverride = Boolean(selectedUserId && overrides[selectedUserId]);

  const selectedUserMap: OpsUserPermissionMap = useMemo(() => {
    if (!selectedUserId) return createDefaultOpsUserPermissionMap();
    if (overrides[selectedUserId]) {
      return normalizeOpsUserPermissionMap(overrides[selectedUserId]);
    }
    // Fall back to actor permissions from global matrix
    const actorMatrix = matrix[selectedUserActor] ?? DEFAULT_OPS_PERMISSION_MATRIX[selectedUserActor];
    return normalizeOpsUserPermissionMap(actorMatrix);
  }, [selectedUserId, overrides, matrix, selectedUserActor]);

  // Auto-select first user when switching to per-user view
  useEffect(() => {
    if (viewMode === 'per-user' && !selectedUserId && allUsers.length > 0) {
      setSelectedUserId(allUsers[0].id);
    }
  }, [viewMode, selectedUserId, allUsers]);

  /* ── Filtered features ─────────────────────────────────── */
  const visibleFeatures = useMemo(() => {
    const q = query.trim().toLowerCase();
    return OPS_PERMISSION_FEATURES.filter((f) => {
      if (category && f.category !== category) return false;
      if (!q) return true;
      return [f.label, f.id, f.description].join(' ').toLowerCase().includes(q);
    });
  }, [category, query]);

  const totalFeatures = OPS_PERMISSION_FEATURES.length;

  /* ── Global actions ───────────────────────────────────── */
  const matrixJson = useMemo(() => JSON.stringify(matrix, null, 2), [matrix]);
  const isDirtyGlobal = matrixJson !== savedSnapshot;

  const toggleGlobal = (actor: OpsPermissionActor, feature: OpsPermissionFeature) => {
    setNotice(null);
    setMatrix((prev) => ({
      ...prev,
      [actor]: {
        ...prev[actor],
        [feature]: !prev[actor][feature],
      },
    }));
  };

  const setActorAll = (actor: OpsPermissionActor, val: boolean) => {
    setNotice(null);
    setMatrix((prev) => ({
      ...prev,
      [actor]: OPS_PERMISSION_FEATURES.reduce((acc, f) => {
        acc[f.id] = val;
        return acc;
      }, {} as Record<OpsPermissionFeature, boolean>),
    }));
  };

  const setFeatureAll = (feature: OpsPermissionFeature, val: boolean) => {
    setNotice(null);
    setMatrix((prev) =>
      OPS_PERMISSION_ACTORS.reduce((acc, act) => {
        acc[act.id] = { ...prev[act.id], [feature]: val };
        return acc;
      }, {} as OpsPermissionMatrix),
    );
  };

  const saveGlobal = () => {
    saveGlobalOpsMatrix(matrix);
    setSavedSnapshot(JSON.stringify(matrix, null, 2));
    setNotice('✓ Đã lưu cấu hình ma trận phân quyền OPS toàn hệ thống.');
  };

  const resetGlobal = () => {
    const loaded = loadGlobalOpsMatrix();
    setMatrix(loaded);
    setSavedSnapshot(JSON.stringify(loaded, null, 2));
    setNotice('Đã hoàn tác ma trận về trạng thái đã lưu gần nhất.');
  };

  const resetToDefaultStandards = () => {
    setMatrix(DEFAULT_OPS_PERMISSION_MATRIX);
    setNotice('Đã thiết lập lại ma trận theo chuẩn kế thừa mặc định (HQ > Miền > Tỉnh > Bưu cục). Bấm Lưu để xác nhận.');
  };

  /* ── Per-user actions ─────────────────────────────────── */
  const selectedUserMapJson = JSON.stringify(selectedUserMap);
  const selectedUserSnapshot = selectedUserId
    ? overrideSnapshots[selectedUserId] ??
      JSON.stringify(normalizeOpsUserPermissionMap(matrix[selectedUserActor]))
    : '';
  const isDirtyUser = Boolean(selectedUserId && selectedUserMapJson !== selectedUserSnapshot);

  const selectUser = useCallback((u: AdminUserDto) => {
    setSelectedUserId(u.id);
    setNotice(null);
  }, []);

  const toggleUserPerm = (feature: OpsPermissionFeature) => {
    if (!selectedUserId) return;
    setNotice(null);
    const updated = {
      ...selectedUserMap,
      [feature]: !selectedUserMap[feature],
    };
    setOverrides((prev) => ({
      ...prev,
      [selectedUserId]: updated,
    }));
  };

  const setUserAll = (val: boolean) => {
    if (!selectedUserId) return;
    setNotice(null);
    const updated = OPS_PERMISSION_FEATURES.reduce((acc, f) => {
      acc[f.id] = val;
      return acc;
    }, {} as OpsUserPermissionMap);
    setOverrides((prev) => ({
      ...prev,
      [selectedUserId]: updated,
    }));
  };

  const resetUserToDefaultRole = () => {
    if (!selectedUserId) return;
    setNotice(null);
    // Remove custom override completely
    saveOpsUserPermissionOverride(selectedUserId, null);
    if (selectedUser?.username) {
      saveOpsUserPermissionOverride(selectedUser.username, null);
    }
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[selectedUserId];
      return next;
    });
    setOverrideSnapshots((prev) => {
      const next = { ...prev };
      delete next[selectedUserId];
      return next;
    });
    setNotice(`Đã chuyển tài khoản về quyền chuẩn theo vai trò "${selectedUserActorMeta.label}".`);
  };

  const saveUserOverrides = () => {
    if (!selectedUserId) return;
    saveOpsUserPermissionOverride(selectedUserId, selectedUserMap);
    if (selectedUser?.username) {
      saveOpsUserPermissionOverride(selectedUser.username, selectedUserMap);
    }
    setOverrideSnapshots((prev) => ({
      ...prev,
      [selectedUserId]: JSON.stringify(selectedUserMap),
    }));
    setNotice(`✓ Đã lưu phân quyền tuỳ chỉnh riêng cho tài khoản ${selectedUser?.username}.`);
  };

  const resetUserOverrides = () => {
    if (!selectedUserId) return;
    const snap = overrideSnapshots[selectedUserId];
    if (snap) {
      setOverrides((prev) => ({
        ...prev,
        [selectedUserId]: JSON.parse(snap),
      }));
    } else {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[selectedUserId];
        return next;
      });
    }
    setNotice('Đã hoàn tác thay đổi của tài khoản.');
  };

  const userEnabledCount = countOpsUserEnabledPermissions(selectedUserMap);

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <div style={S.page}>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={S.hero}>
        <div>
          <p style={S.kicker}>Phân cấp & Quản trị Quyền Điều hành</p>
          <h2 style={S.title}>Ma trận phân quyền Điều hành (OPS Web)</h2>
          <p style={S.subtitle}>
            Áp dụng kiến trúc <strong>Kế thừa quyền theo cấp bậc tự nhiên</strong> (HQ &gt; Miền &gt; Tỉnh &gt; Bưu cục) 
            kèm tính năng <strong>Tuỳ chỉnh quyền riêng cho từng tài khoản</strong> để vận hành linh hoạt không rườm rà.
          </p>
        </div>
        <div style={S.tabRow}>
          <button
            type="button"
            onClick={() => setViewMode('global')}
            style={viewMode === 'global' ? S.tabActive : S.tabInactive}
          >
            Ma trận chung (Theo cấp bậc)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('per-user')}
            style={viewMode === 'per-user' ? S.tabActive : S.tabInactive}
          >
            Theo từng tài khoản (Tuỳ chỉnh)
          </button>
        </div>
      </section>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <section style={S.toolbar}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm chức năng, mã quyền hoặc mô tả..."
          style={S.searchInput}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryFilter)}
          style={S.catSelect}
        >
          <option value="">Tất cả phân hệ tác nghiệp</option>
          {Object.entries(OPS_PERMISSION_CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        {viewMode === 'global' ? (
          <button type="button" onClick={resetToDefaultStandards} style={S.secBtn} title="Khôi phục ma trận phân quyền chuẩn">
            Chuẩn hoá phân cấp
          </button>
        ) : null}
      </section>

      {notice ? (
        <p style={S.notice} role="status">
          {notice}
        </p>
      ) : null}

      {/* ═══════════ GLOBAL VIEW ═══════════ */}
      {viewMode === 'global' ? (
        <>
          <section style={S.summaryGrid}>
            {OPS_PERMISSION_ACTORS.map((actor) => {
              const cnt = countOpsActorEnabledPermissions(matrix, actor.id);
              return (
                <article key={actor.id} style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span
                        style={{
                          ...pill,
                          backgroundColor: `${actor.badgeColor}15`,
                          color: actor.badgeColor,
                          border: `1px solid ${actor.badgeColor}35`,
                          marginBottom: 4,
                        }}
                      >
                        {actor.badgeLabel}
                      </span>
                      <strong style={{ display: 'block', fontSize: 14, marginTop: 4 }}>{actor.label}</strong>
                    </div>
                    <strong style={{ fontSize: 22, color: actor.badgeColor }}>
                      {cnt}/{totalFeatures}
                    </strong>
                  </div>
                  <p style={S.cardDesc}>{actor.description}</p>
                  <div style={S.row}>
                    <button
                      type="button"
                      onClick={() => setActorAll(actor.id, true)}
                      style={S.secBtn}
                    >
                      Bật tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setActorAll(actor.id, false)}
                      style={S.danBtn}
                    >
                      Tắt tất cả
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          <section style={S.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th style={S.featCol}>Chức năng nghiệp vụ OPS</th>
                  <th>Phân hệ</th>
                  <th>Mức rủi ro</th>
                  {OPS_PERMISSION_ACTORS.map((a) => (
                    <th key={a.id} style={S.actCol}>
                      <span style={{ color: a.badgeColor }}>{a.badgeLabel}</span>
                    </th>
                  ))}
                  <th style={S.actCol}>Thao tác nhanh</th>
                </tr>
              </thead>
              <tbody>
                {visibleFeatures.map((f) => {
                  const allOn = OPS_PERMISSION_ACTORS.every((a) => matrix[a.id][f.id]);
                  return (
                    <tr key={f.id}>
                      <td style={S.featCell}>
                        <strong>{f.label}</strong>
                        <span style={S.mutedCode}>{f.id}</span>
                        <small style={{ color: 'var(--admin-muted)', fontSize: 11 }}>{f.description}</small>
                      </td>
                      <td>{OPS_PERMISSION_CATEGORIES[f.category]}</td>
                      <td>
                        <span style={riskS[f.riskLevel]}>{f.riskLevel}</span>
                      </td>
                      {OPS_PERMISSION_ACTORS.map((a) => (
                        <td key={`${f.id}-${a.id}`} style={S.center}>
                          <label style={S.sw}>
                            <input
                              type="checkbox"
                              checked={matrix[a.id][f.id]}
                              onChange={() => toggleGlobal(a.id, f.id)}
                            />
                            <span style={matrix[a.id][f.id] ? { color: '#166534' } : { color: '#94a3b8' }}>
                              {matrix[a.id][f.id] ? 'Cho phép' : 'Chặn'}
                            </span>
                          </label>
                        </td>
                      ))}
                      <td style={S.center}>
                        <button
                          type="button"
                          onClick={() => setFeatureAll(f.id, !allOn)}
                          style={allOn ? S.danBtn : S.secBtn}
                        >
                          {allOn ? 'Chặn tất cả' : 'Bật tất cả'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleFeatures.length === 0 ? (
              <div style={S.empty}>Không có chức năng nào khớp bộ lọc.</div>
            ) : null}
          </section>

          <div style={S.saveBar}>
            <span style={isDirtyGlobal ? S.dirtyPill : S.syncPill}>
              {isDirtyGlobal ? '● Có thay đổi chưa lưu' : '✓ Ma trận đã đồng bộ'}
            </span>
            <div style={S.row}>
              <button type="button" onClick={resetGlobal} style={S.secBtn}>
                Hoàn tác
              </button>
              <button
                type="button"
                onClick={saveGlobal}
                disabled={!isDirtyGlobal}
                style={{
                  background: isDirtyGlobal ? 'var(--admin-primary)' : '#cbd5e1',
                  color: '#fff',
                  cursor: isDirtyGlobal ? 'pointer' : 'not-allowed',
                }}
              >
                Lưu ma trận toàn hệ thống
              </button>
            </div>
          </div>
        </>
      ) : null}

      {/* ═══════════ PER-USER VIEW ═══════════ */}
      {viewMode === 'per-user' ? (
        <section style={S.perUserGrid}>
          {/* Left panel: OPS user list */}
          <div style={S.userPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={S.panelTitle}>Tài khoản điều hành OPS</h3>
              <small style={S.muted}>{allUsers.length} tài khoản</small>
            </div>
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Tìm theo tên, mã NV, hub..."
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <div style={S.userScroll}>
              {opsQuery.isLoading ? <p style={S.muted}>Đang tải danh sách tài khoản...</p> : null}
              {filteredUsers.map((u) => {
                const isSel = u.id === selectedUserId;
                const actor = resolveUserOpsActor(u);
                const hasOverride = Boolean(overrides[u.id] || overrides[u.username]);
                const userMap = hasOverride
                  ? normalizeOpsUserPermissionMap(overrides[u.id] || overrides[u.username])
                  : normalizeOpsUserPermissionMap(matrix[actor] ?? DEFAULT_OPS_PERMISSION_MATRIX[actor]);
                const cnt = countOpsUserEnabledPermissions(userMap);
                const actorMeta = OPS_PERMISSION_ACTORS.find((a) => a.id === actor) ?? OPS_PERMISSION_ACTORS[3];

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectUser(u)}
                    style={{ ...S.userCard, ...(isSel ? S.userSel : {}) }}
                  >
                    <div style={S.userTop}>
                      <strong style={{ fontSize: 13 }}>{u.displayName || u.username}</strong>
                      {hasOverride ? (
                        <span style={S.customBadge}>[Tuỳ chỉnh]</span>
                      ) : (
                        <span
                          style={{
                            ...pill,
                            fontSize: 9,
                            padding: '2px 5px',
                            backgroundColor: `${actorMeta.badgeColor}15`,
                            color: actorMeta.badgeColor,
                          }}
                        >
                          {actorMeta.badgeLabel}
                        </span>
                      )}
                    </div>
                    <small style={S.muted}>
                      {u.username} · {u.roles.join(', ')} {u.hubCodes?.length ? `· Hub: ${u.hubCodes.join(', ')}` : ''}
                    </small>
                    <div style={S.bar}>
                      <div
                        style={{
                          ...S.barFill,
                          width: `${(cnt / totalFeatures) * 100}%`,
                          backgroundColor: actorMeta.badgeColor,
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--admin-muted)' }}>
                      <span>{actorMeta.label.split('(')[0]}</span>
                      <strong>
                        {cnt}/{totalFeatures} quyền
                      </strong>
                    </div>
                  </button>
                );
              })}
              {filteredUsers.length === 0 && !opsQuery.isLoading ? (
                <p style={S.muted}>Không tìm thấy tài khoản nào khớp.</p>
              ) : null}
            </div>
          </div>

          {/* Right panel: user permission settings */}
          <div style={S.rightPanel}>
            {selectedUser ? (
              <>
                <div style={S.userInfoBar}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={S.panelTitle}>{selectedUser.displayName || selectedUser.username}</h3>
                      <span
                        style={{
                          ...pill,
                          backgroundColor: `${selectedUserActorMeta.badgeColor}15`,
                          color: selectedUserActorMeta.badgeColor,
                          border: `1px solid ${selectedUserActorMeta.badgeColor}35`,
                        }}
                      >
                        {selectedUserActorMeta.badgeLabel}
                      </span>
                      {userHasOverride ? (
                        <span style={S.customBadge}>Đang kích hoạt tuỳ chỉnh riêng</span>
                      ) : (
                        <span style={{ ...pill, color: '#15803d', background: '#dcfce7' }}>
                          Kế thừa tự động từ vai trò
                        </span>
                      )}
                    </div>
                    <small style={S.muted}>
                      Tài khoản: <strong>{selectedUser.username}</strong> · Vai trò: {selectedUser.roles.join(', ')} · 
                      Hub trực thuộc: {selectedUser.hubCodes?.join(', ') || 'Toàn quốc / Điều hành chung'}
                    </small>
                  </div>
                  <div style={S.counterBox}>
                    <strong style={S.counterVal}>
                      {userEnabledCount}/{totalFeatures}
                    </strong>
                    <small style={{ fontSize: 11, color: 'var(--admin-muted)' }}>quyền kích hoạt</small>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={S.row}>
                    <button type="button" onClick={() => setUserAll(true)} style={S.secBtn}>
                      Bật tất cả
                    </button>
                    <button type="button" onClick={() => setUserAll(false)} style={S.danBtn}>
                      Tắt tất cả
                    </button>
                    {userHasOverride ? (
                      <button
                        type="button"
                        onClick={resetUserToDefaultRole}
                        style={{ ...S.secBtn, color: '#b45309', borderColor: '#fde68a', background: '#fffbeb' }}
                        title="Xoá tuỳ chỉnh riêng để tài khoản tuân theo phân cấp vai trò mặc định"
                      >
                        Đặt về mặc định vai trò
                      </button>
                    ) : null}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
                    Bật/tắt bất kỳ quyền nào dưới đây sẽ tạo cấu hình tuỳ chỉnh riêng cho nhân sự này.
                  </span>
                </div>

                <div style={S.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        <th style={S.featCol}>Chức năng nghiệp vụ</th>
                        <th>Phân hệ</th>
                        <th>Mức rủi ro</th>
                        <th style={{ width: 140, textAlign: 'center' }}>Trạng thái cấp quyền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleFeatures.map((f) => {
                        const isGranted = selectedUserMap[f.id] === true;
                        return (
                          <tr key={f.id}>
                            <td style={S.featCell}>
                              <strong>{f.label}</strong>
                              <span style={S.mutedCode}>{f.id}</span>
                              <small style={{ color: 'var(--admin-muted)', fontSize: 11 }}>{f.description}</small>
                            </td>
                            <td>{OPS_PERMISSION_CATEGORIES[f.category]}</td>
                            <td>
                              <span style={riskS[f.riskLevel]}>{f.riskLevel}</span>
                            </td>
                            <td style={S.center}>
                              <label style={S.sw}>
                                <input
                                  type="checkbox"
                                  checked={isGranted}
                                  onChange={() => toggleUserPerm(f.id)}
                                />
                                <span style={isGranted ? { color: '#166534' } : { color: '#94a3b8' }}>
                                  {isGranted ? 'Cho phép' : 'Chặn'}
                                </span>
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {visibleFeatures.length === 0 ? (
                    <div style={S.empty}>Không có chức năng nào khớp bộ lọc.</div>
                  ) : null}
                </div>

                <div style={S.saveBar}>
                  <span style={isDirtyUser ? S.dirtyPill : S.syncPill}>
                    {isDirtyUser ? '● Có thay đổi chưa lưu cho nhân sự này' : '✓ Cấu hình đã đồng bộ'}
                  </span>
                  <div style={S.row}>
                    <button type="button" onClick={resetUserOverrides} disabled={!isDirtyUser} style={S.secBtn}>
                      Hoàn tác
                    </button>
                    <button
                      type="button"
                      onClick={saveUserOverrides}
                      disabled={!isDirtyUser}
                      style={{
                        background: isDirtyUser ? 'var(--admin-primary)' : '#cbd5e1',
                        color: '#fff',
                        cursor: isDirtyUser ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Lưu phân quyền tài khoản
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={S.empty}>Vui lòng chọn một tài khoản điều hành từ danh sách bên trái để phân quyền.</div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/* ────────────────────────── STYLES ────────────────────────── */

const pill: React.CSSProperties = {
  borderRadius: 999,
  padding: '4px 8px',
  fontSize: 11,
  fontWeight: 800,
  display: 'inline-block',
};

const riskS: Record<string, React.CSSProperties> = {
  Thấp: { ...pill, color: '#166534', background: '#DCFCE7', border: '1px solid #BBF7D0' },
  'Trung bình': { ...pill, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A' },
  Cao: { ...pill, color: '#991B1B', background: '#FEE2E2', border: '1px solid #FECACA' },
};

const S: Record<string, React.CSSProperties> = {
  page: { display: 'grid', gap: 14 },
  hero: {
    border: '1px solid var(--admin-border)',
    borderRadius: 16,
    background: 'var(--admin-surface-soft)',
    padding: 16,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  kicker: {
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontSize: 11,
    color: 'var(--admin-primary)',
    fontWeight: 800,
  },
  title: { margin: '6px 0 4px', fontSize: 26, lineHeight: 1.1 },
  subtitle: { margin: 0, color: 'var(--admin-muted)', maxWidth: 840, fontSize: 13, lineHeight: 1.5 },
  tabRow: { display: 'flex', gap: 6 },
  tabActive: {
    background: 'var(--admin-primary)',
    color: '#fff',
    borderColor: 'var(--admin-primary)',
    padding: '8px 14px',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 13,
  },
  tabInactive: {
    background: '#fff',
    color: 'var(--admin-primary)',
    borderColor: 'var(--admin-border)',
    padding: '8px 14px',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 13,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 12,
  },
  card: {
    border: '1px solid var(--admin-border)',
    borderRadius: 14,
    background: '#fff',
    padding: 14,
    display: 'grid',
    gap: 10,
  },
  cardDesc: { margin: 0, color: 'var(--admin-muted)', fontSize: 12, lineHeight: 1.4 },
  toolbar: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: 240, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--admin-border)' },
  catSelect: { minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--admin-border)' },
  notice: {
    margin: 0,
    border: '1px solid var(--admin-border)',
    background: 'var(--admin-surface-soft)',
    color: 'var(--admin-primary)',
    borderRadius: 12,
    padding: '10px 14px',
    fontWeight: 700,
    fontSize: 13,
  },
  tableWrap: { border: '1px solid var(--admin-border)', borderRadius: 14, overflow: 'auto', background: '#fff', maxWidth: '100%', boxSizing: 'border-box' },
  featCol: { minWidth: 280 },
  actCol: { width: 130, textAlign: 'center' },
  featCell: { display: 'grid', gap: 2 },
  mutedCode: { color: 'var(--admin-muted)', fontSize: 11, fontFamily: 'monospace' },
  center: { textAlign: 'center' },
  sw: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  row: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  secBtn: { background: '#fff', color: 'var(--admin-primary)', borderColor: 'var(--admin-border)', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 },
  danBtn: { background: '#fff', color: 'var(--admin-danger)', borderColor: '#f3b6c0', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 },
  empty: { padding: 24, textAlign: 'center', color: 'var(--admin-muted)', background: '#fff' },
  saveBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderTop: '1px solid var(--admin-border)',
    paddingTop: 12,
  },
  dirtyPill: { ...pill, color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A' },
  syncPill: { ...pill, color: '#166534', background: '#DCFCE7', border: '1px solid #BBF7D0' },
  perUserGrid: {
    display: 'grid',
    gridTemplateColumns: '320px minmax(0, 1fr)',
    gap: 14,
    alignItems: 'start',
  },
  userPanel: {
    border: '1px solid var(--admin-border)',
    borderRadius: 14,
    background: '#fff',
    padding: 12,
    display: 'grid',
    gap: 10,
    position: 'sticky',
    top: 16,
    maxHeight: 'calc(100vh - 140px)',
    overflow: 'hidden',
  },
  panelTitle: { margin: 0, fontSize: 16 },
  userScroll: { display: 'grid', gap: 6, overflowY: 'auto', maxHeight: 'calc(100vh - 270px)' },
  userCard: {
    border: '1px solid var(--admin-border)',
    borderRadius: 12,
    background: '#fafbfd',
    padding: '10px 12px',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'grid',
    gap: 4,
    transition: 'all .15s',
    color: 'var(--admin-text)',
  },
  userSel: {
    borderColor: 'var(--admin-primary)',
    background: 'var(--admin-surface-soft)',
    boxShadow: '0 0 0 2px rgba(79,70,229,.18)',
  },
  userTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  customBadge: { ...pill, fontSize: 10, padding: '2px 6px', color: '#92400E', background: '#FEF3C7', border: '1px solid #FDE68A' },
  muted: { color: 'var(--admin-muted)', fontSize: 12, margin: 0 },
  bar: { height: 4, borderRadius: 2, background: '#e2e8f0', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2, transition: 'width .3s' },
  rightPanel: {
    border: '1px solid var(--admin-border)',
    borderRadius: 14,
    background: '#fff',
    padding: 14,
    display: 'grid',
    gap: 12,
  },
  userInfoBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--admin-border)',
    paddingBottom: 12,
    gap: 12,
  },
  counterBox: {
    border: '1px solid #c7d2fe',
    borderRadius: 14,
    background: 'var(--admin-surface-soft)',
    padding: '8px 16px',
    textAlign: 'center',
    display: 'grid',
    gap: 2,
    flexShrink: 0,
  },
  counterVal: { fontSize: 24, lineHeight: 1, color: 'var(--admin-primary)' },
};

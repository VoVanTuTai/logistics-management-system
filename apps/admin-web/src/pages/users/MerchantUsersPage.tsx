import React, { useEffect, useMemo, useState } from 'react';

import {
  useAdminUsersQuery,
  useCreateAdminUserMutation,
  useDeleteAdminUserMutation,
  useUpdateAdminUserMutation,
} from '../../features/auth/auth.api';
import type { AdminUserDto, UserStatus } from '../../features/auth/auth.types';
import {
  useConfigsQuery,
  useCreateConfigMutation,
  useHubsQuery,
  useUpdateConfigMutation,
} from '../../features/masterdata/masterdata.api';
import type {
  ConfigDto,
  ConfigValue,
  HubDto,
} from '../../features/masterdata/masterdata.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';

const MERCHANT_ROLE = 'MERCHANT';
const MERCHANT_PROFILE_SCOPE = 'MERCHANT_PROFILE';
const MERCHANT_PROFILE_KEY_PREFIX = 'merchant.profile.';
const MERCHANT_USERNAME_PATTERN = /^411\d{5}$/;
const CITIZEN_ID_PATTERN = /^\d{12}$/;

interface MerchantRegionOption {
  code: 'HA_NOI' | 'DA_NANG' | 'HO_CHI_MINH';
  label: string;
}

const MERCHANT_REGION_OPTIONS: MerchantRegionOption[] = [
  { code: 'HA_NOI', label: 'Ha Noi' },
  { code: 'DA_NANG', label: 'Da Nang' },
  { code: 'HO_CHI_MINH', label: 'Ho Chi Minh' },
];

interface MerchantFormState {
  fullName: string;
  phone: string;
  citizenId: string;
  regionCode: MerchantRegionOption['code'];
  defaultHubCode: string;
  password: string;
  confirmPassword: string;
  status: UserStatus;
}

interface MerchantHubOption {
  hubCode: string;
  hubName: string;
  regionCode: MerchantRegionOption['code'];
  fullAddress: string;
  sortLabel: string;
}

interface MerchantProfilePayload {
  username: string;
  citizenId: string;
  regionCode: MerchantRegionOption['code'];
  regionLabel: string;
  defaultHubCode: string | null;
  defaultHubName: string | null;
  defaultSenderAddress: string | null;
}

interface MerchantProfileRecord {
  configId: string;
  payload: MerchantProfilePayload;
}

const DEFAULT_FORM: MerchantFormState = {
  fullName: '',
  phone: '',
  citizenId: '',
  regionCode: MERCHANT_REGION_OPTIONS[0].code,
  defaultHubCode: '',
  password: '',
  confirmPassword: '',
  status: 'ACTIVE',
};

function normalizeLocationKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

function resolveRegionCode(rawProvince: string): MerchantRegionOption['code'] | null {
  const normalized = normalizeLocationKey(rawProvince);

  if (!normalized) {
    return null;
  }

  if (['HANOI', 'HN', 'TPHANOI', 'THANHPHOHANOI'].includes(normalized)) {
    return 'HA_NOI';
  }

  if (['DANANG', 'DN', 'TPDANANG', 'THANHPHODANANG'].includes(normalized)) {
    return 'DA_NANG';
  }

  if (['HOCHIMINH', 'HCM', 'TPHOCHIMINH', 'THANHPHOHOCHIMINH'].includes(normalized)) {
    return 'HO_CHI_MINH';
  }

  return null;
}

function resolveRegionLabel(
  regionCode: MerchantRegionOption['code'],
): string {
  return (
    MERCHANT_REGION_OPTIONS.find((option) => option.code === regionCode)?.label ??
    regionCode
  );
}

function parseHubAddressParts(address: string | null): {
  province: string;
  district: string;
  ward: string;
  addressLine: string;
} {
  if (!address) {
    return {
      province: '',
      district: '',
      ward: '',
      addressLine: '',
    };
  }

  try {
    const parsed = JSON.parse(address) as Record<string, unknown>;
    return {
      province: typeof parsed.province === 'string' ? parsed.province.trim() : '',
      district: typeof parsed.district === 'string' ? parsed.district.trim() : '',
      ward: typeof parsed.ward === 'string' ? parsed.ward.trim() : '',
      addressLine: typeof parsed.addressLine === 'string' ? parsed.addressLine.trim() : '',
    };
  } catch {
    const segments = address.split(',').map((segment) => segment.trim());
    return {
      province: segments.length > 0 ? segments[segments.length - 1] : '',
      district: segments.length > 1 ? segments[segments.length - 2] : '',
      ward: segments.length > 2 ? segments[segments.length - 3] : '',
      addressLine: segments.slice(0, Math.max(segments.length - 3, 1)).join(', '),
    };
  }
}

function toMerchantHubOption(hub: HubDto): MerchantHubOption | null {
  const addressParts = parseHubAddressParts(hub.address);
  const regionCode = resolveRegionCode(addressParts.province);

  if (!regionCode) {
    return null;
  }

  const fullAddress = [
    addressParts.addressLine,
    addressParts.ward,
    addressParts.district,
    addressParts.province,
  ]
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .join(', ');

  return {
    hubCode: hub.code,
    hubName: hub.name,
    regionCode,
    fullAddress,
    sortLabel: `${hub.name} (${hub.code})`,
  };
}

function buildMerchantProfileKey(username: string): string {
  return `${MERCHANT_PROFILE_KEY_PREFIX}${username}`;
}

function parseMerchantProfilePayload(
  value: unknown,
): MerchantProfilePayload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (
    typeof record.username !== 'string' ||
    typeof record.citizenId !== 'string' ||
    typeof record.regionCode !== 'string' ||
    typeof record.regionLabel !== 'string'
  ) {
    return null;
  }

  const normalizedRegionCode = record.regionCode as MerchantRegionOption['code'];
  const regionExists = MERCHANT_REGION_OPTIONS.some(
    (option) => option.code === normalizedRegionCode,
  );

  if (!regionExists) {
    return null;
  }

  return {
    username: record.username.trim(),
    citizenId: record.citizenId.trim(),
    regionCode: normalizedRegionCode,
    regionLabel: record.regionLabel.trim() || resolveRegionLabel(normalizedRegionCode),
    defaultHubCode:
      typeof record.defaultHubCode === 'string' && record.defaultHubCode.trim()
        ? record.defaultHubCode.trim().toUpperCase()
        : null,
    defaultHubName:
      typeof record.defaultHubName === 'string' && record.defaultHubName.trim()
        ? record.defaultHubName.trim()
        : null,
    defaultSenderAddress:
      typeof record.defaultSenderAddress === 'string' && record.defaultSenderAddress.trim()
        ? record.defaultSenderAddress.trim()
        : null,
  };
}

function mapMerchantProfiles(configs: ConfigDto[]): Map<string, MerchantProfileRecord> {
  const mappedProfiles = new Map<string, MerchantProfileRecord>();

  for (const config of configs) {
    const payload = parseMerchantProfilePayload(config.value);
    if (!payload) {
      continue;
    }

    const usernameFromKey = config.key.startsWith(MERCHANT_PROFILE_KEY_PREFIX)
      ? config.key.slice(MERCHANT_PROFILE_KEY_PREFIX.length).trim()
      : '';
    const username = (usernameFromKey || payload.username).trim().toUpperCase();

    if (!username) {
      continue;
    }

    mappedProfiles.set(username, {
      configId: config.id,
      payload: {
        ...payload,
        username,
      },
    });
  }

  return mappedProfiles;
}

function normalizeMerchantCode(value: string): string | null {
  const normalizedValue = value.trim();
  if (!MERCHANT_USERNAME_PATTERN.test(normalizedValue)) {
    return null;
  }
  return normalizedValue;
}

function generateNextMerchantUsername(users: AdminUserDto[]): string {
  const usedUsernames = new Set<string>();
  let maxCodeNumber = 41100000;

  for (const user of users) {
    const normalizedUsername = normalizeMerchantCode(user.username);
    if (!normalizedUsername) {
      continue;
    }

    usedUsernames.add(normalizedUsername);
    const numericCode = Number(normalizedUsername);
    if (Number.isFinite(numericCode)) {
      maxCodeNumber = Math.max(maxCodeNumber, numericCode);
    }
  }

  for (let codeNumber = maxCodeNumber + 1; codeNumber <= 41199999; codeNumber += 1) {
    const candidateCode = `${codeNumber}`;
    if (!usedUsernames.has(candidateCode)) {
      return candidateCode;
    }
  }

  throw new Error('Da het ma merchant 411xxxxx de tao moi.');
}

export function MerchantUsersPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<UserStatus | ''>('');

  const [editingUser, setEditingUser] = useState<AdminUserDto | null>(null);
  const [form, setForm] = useState<MerchantFormState>(DEFAULT_FORM);

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const merchantsQuery = useAdminUsersQuery(accessToken, {
    roleGroup: 'MERCHANT',
    status,
    hubCode: '',
    q,
  });
  const allMerchantsQuery = useAdminUsersQuery(accessToken, {
    roleGroup: 'MERCHANT',
    status: '',
    hubCode: '',
    q: '',
  });
  const hubsQuery = useHubsQuery(accessToken, {
    isActive: 'true',
  });
  const profilesQuery = useConfigsQuery(accessToken, {
    scope: MERCHANT_PROFILE_SCOPE,
  });

  const createUserMutation = useCreateAdminUserMutation(accessToken);
  const updateUserMutation = useUpdateAdminUserMutation(accessToken);
  const deleteUserMutation = useDeleteAdminUserMutation(accessToken);
  const createConfigMutation = useCreateConfigMutation(accessToken);
  const updateConfigMutation = useUpdateConfigMutation(accessToken);

  const merchantUsers = merchantsQuery.data ?? [];
  const allMerchantUsers = allMerchantsQuery.data ?? merchantUsers;
  const merchantHubOptions = useMemo(
    () =>
      (hubsQuery.data ?? [])
        .filter((hub) => hub.isActive)
        .map((hub) => toMerchantHubOption(hub))
        .filter((option): option is MerchantHubOption => Boolean(option)),
    [hubsQuery.data],
  );
  const profileByUsername = useMemo(
    () => mapMerchantProfiles(profilesQuery.data ?? []),
    [profilesQuery.data],
  );

  const nextMerchantUsername = useMemo(() => {
    try {
      return generateNextMerchantUsername(allMerchantUsers);
    } catch {
      return '41100001';
    }
  }, [allMerchantUsers]);

  const regionHubOptions = useMemo(
    () =>
      merchantHubOptions
        .filter((option) => option.regionCode === form.regionCode)
        .sort((left, right) => left.sortLabel.localeCompare(right.sortLabel, 'vi')),
    [form.regionCode, merchantHubOptions],
  );
  const selectedHub = useMemo(
    () =>
      regionHubOptions.find((option) => option.hubCode === form.defaultHubCode) ??
      regionHubOptions[0] ??
      null,
    [regionHubOptions, form.defaultHubCode],
  );

  useEffect(() => {
    setForm((previous) => {
      const currentHubInRegion = regionHubOptions.some(
        (option) => option.hubCode === previous.defaultHubCode,
      );
      const nextDefaultHubCode = currentHubInRegion
        ? previous.defaultHubCode
        : (regionHubOptions[0]?.hubCode ?? '');

      if (nextDefaultHubCode === previous.defaultHubCode) {
        return previous;
      }

      return {
        ...previous,
        defaultHubCode: nextDefaultHubCode,
      };
    });
  }, [regionHubOptions]);

  const isSaving =
    createUserMutation.isPending ||
    updateUserMutation.isPending ||
    deleteUserMutation.isPending ||
    createConfigMutation.isPending ||
    updateConfigMutation.isPending;

  const resetForm = () => {
    setEditingUser(null);
    setForm(DEFAULT_FORM);
  };

  const onEditUser = (user: AdminUserDto) => {
    const profile = profileByUsername.get(user.username)?.payload;
    const regionCode = profile?.regionCode ?? MERCHANT_REGION_OPTIONS[0].code;
    const hubsByRegion = merchantHubOptions
      .filter((option) => option.regionCode === regionCode)
      .sort((left, right) => left.sortLabel.localeCompare(right.sortLabel, 'vi'));
    const preferredHubCode = (
      profile?.defaultHubCode ??
      user.hubCodes[0] ??
      ''
    ).trim().toUpperCase();
    const selectedHubCode =
      hubsByRegion.find((option) => option.hubCode === preferredHubCode)?.hubCode ??
      hubsByRegion[0]?.hubCode ??
      '';

    setEditingUser(user);
    setForm({
      fullName: user.displayName ?? '',
      phone: user.phone ?? '',
      citizenId: profile?.citizenId ?? '',
      regionCode,
      defaultHubCode: selectedHubCode,
      password: '',
      confirmPassword: '',
      status: user.status,
    });
    setActionMessage(null);
    setActionError(null);
  };

  const upsertMerchantProfile = async (
    username: string,
    profile: MerchantProfilePayload,
  ) => {
    const profileValue = { ...profile } as ConfigValue;
    const existingProfile = profileByUsername.get(username);

    if (existingProfile) {
      await updateConfigMutation.mutateAsync({
        configId: existingProfile.configId,
        payload: {
          key: buildMerchantProfileKey(username),
          value: profileValue,
          scope: MERCHANT_PROFILE_SCOPE,
          description: `Merchant profile for ${username}`,
        },
      });
      return;
    }

    await createConfigMutation.mutateAsync({
      key: buildMerchantProfileKey(username),
      value: profileValue,
      scope: MERCHANT_PROFILE_SCOPE,
      description: `Merchant profile for ${username}`,
    });
  };

  const onSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionMessage(null);
    setActionError(null);

    const fullName = form.fullName.trim();
    const phone = form.phone.trim();
    const citizenId = form.citizenId.trim();

    if (!fullName) {
      setActionError('Ho ten la bat buoc.');
      return;
    }

    if (!phone) {
      setActionError('So dien thoai la bat buoc.');
      return;
    }

    if (!CITIZEN_ID_PATTERN.test(citizenId)) {
      setActionError('CCCD phai gom dung 12 chu so.');
      return;
    }

    if (!editingUser && !form.password.trim()) {
      setActionError('Mat khau la bat buoc khi tao merchant moi.');
      return;
    }

    if (form.password.trim() !== form.confirmPassword.trim()) {
      setActionError('Xac nhan mat khau khong khop.');
      return;
    }

    if (!selectedHub) {
      setActionError(
        'Vui long chon hub mac dinh thuoc khu vuc da chon.',
      );
      return;
    }

    const username = editingUser?.username ?? nextMerchantUsername;
    const regionLabel = resolveRegionLabel(form.regionCode);

    const profilePayload: MerchantProfilePayload = {
      username,
      citizenId,
      regionCode: form.regionCode,
      regionLabel,
      defaultHubCode: selectedHub.hubCode,
      defaultHubName: selectedHub.hubName,
      defaultSenderAddress: selectedHub.fullAddress || null,
    };

    try {
      if (editingUser) {
        const payload = {
          roles: [MERCHANT_ROLE],
          status: form.status,
          displayName: fullName,
          phone,
          hubCodes: [selectedHub.hubCode],
          ...(form.password.trim() ? { password: form.password.trim() } : {}),
        };

        await updateUserMutation.mutateAsync({
          userId: editingUser.id,
          payload,
        });

        await upsertMerchantProfile(username, profilePayload);
        setActionMessage(`Da cap nhat merchant ${username}.`);
      } else {
        await createUserMutation.mutateAsync({
          username,
          password: form.password.trim(),
          roles: [MERCHANT_ROLE],
          status: form.status,
          displayName: fullName,
          phone,
          hubCodes: [selectedHub.hubCode],
        });

        await upsertMerchantProfile(username, profilePayload);
        setActionMessage(`Da tao merchant ${username}.`);
      }

      resetForm();
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const onDeleteUser = async (user: AdminUserDto) => {
    if (!window.confirm(`Xoa tai khoan merchant ${user.username}?`)) {
      return;
    }

    setActionMessage(null);
    setActionError(null);

    try {
      await deleteUserMutation.mutateAsync(user.id);
      setActionMessage(`Da xoa merchant ${user.username}.`);

      if (editingUser?.id === user.id) {
        resetForm();
      }
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  return (
    <div>
      <h2>Quan tri - Quan ly tai khoan Merchant</h2>
      <p style={styles.helperText}>
        Tao tai khoan merchant voi Ho ten, So dien thoai, CCCD, Khu vuc.
        Sau khi chon khu vuc, chon hub mac dinh tu danh sach hub thuoc khu vuc do.
      </p>

      <form style={styles.filterForm} onSubmit={(event) => event.preventDefault()}>
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Tim merchant theo ma / ten / so dien thoai"
          style={styles.input}
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as UserStatus | '')}
          style={styles.input}
        >
          <option value="">Tat ca trang thai</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DISABLED">DISABLED</option>
        </select>
      </form>

      {actionMessage ? (
        <p style={styles.successText} role="status">
          {actionMessage}
        </p>
      ) : null}
      {actionError ? (
        <p style={styles.errorText} role="alert">
          {actionError}
        </p>
      ) : null}

      <section style={styles.editorCard}>
        <h3 style={styles.editorTitle}>
          {editingUser ? `Sua merchant ${editingUser.username}` : 'Tao merchant moi'}
        </h3>
        {!editingUser ? (
          <p style={styles.helperText}>
            Ma merchant duoc tu dong sinh theo dinh dang 411xxxxx.
          </p>
        ) : null}
        <div style={styles.previewRow}>
          <span style={styles.previewBadge}>
            Ma merchant: {editingUser?.username ?? nextMerchantUsername}
          </span>
          <span style={styles.previewBadge}>
            Hub mac dinh: {selectedHub ? `${selectedHub.hubCode} - ${selectedHub.hubName}` : 'Khong co'}
          </span>
        </div>
        <form onSubmit={onSubmitForm} style={styles.formGrid}>
          <label style={styles.fieldLabel}>
            Ho ten
            <input
              required
              value={form.fullName}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, fullName: event.target.value }))
              }
              style={styles.input}
              placeholder="Nguyen Van A"
            />
          </label>
          <label style={styles.fieldLabel}>
            So dien thoai
            <input
              required
              value={form.phone}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, phone: event.target.value }))
              }
              style={styles.input}
              placeholder="09xxxxxxxx"
            />
          </label>
          <label style={styles.fieldLabel}>
            So CCCD
            <input
              required
              value={form.citizenId}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, citizenId: event.target.value }))
              }
              style={styles.input}
              placeholder="12 chu so"
            />
          </label>
          <label style={styles.fieldLabel}>
            Khu vuc
            <select
              value={form.regionCode}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  regionCode: event.target.value as MerchantRegionOption['code'],
                }))
              }
              style={styles.input}
            >
              {MERCHANT_REGION_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            Hub mac dinh
            <select
              value={selectedHub?.hubCode ?? ''}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  defaultHubCode: event.target.value,
                }))
              }
              style={styles.input}
              disabled={regionHubOptions.length === 0}
            >
              <option value="">Chon hub theo khu vuc</option>
              {regionHubOptions.map((option) => (
                <option key={option.hubCode} value={option.hubCode}>
                  {option.hubCode} - {option.hubName}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            Mat khau {editingUser ? '(bo trong neu khong doi)' : ''}
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, password: event.target.value }))
              }
              style={styles.input}
              placeholder={editingUser ? 'Khong doi mat khau' : 'Nhap mat khau'}
            />
          </label>
          <label style={styles.fieldLabel}>
            Xac nhan mat khau
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, confirmPassword: event.target.value }))
              }
              style={styles.input}
              placeholder="Nhap lai mat khau"
            />
          </label>
          <label style={styles.fieldLabel}>
            Trang thai
            <select
              value={form.status}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  status: event.target.value as UserStatus,
                }))
              }
              style={styles.input}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="DISABLED">DISABLED</option>
            </select>
          </label>

          <div style={styles.actionsCell}>
            <button type="submit" disabled={isSaving || !selectedHub}>
              {editingUser ? 'Luu merchant' : 'Tao merchant'}
            </button>
            {editingUser ? (
              <button type="button" onClick={resetForm}>
                Huy sua
              </button>
            ) : null}
          </div>
        </form>
        {selectedHub ? (
          <p style={styles.helperText}>
            Dia chi mac dinh: {selectedHub.fullAddress || `${selectedHub.hubName} (${selectedHub.hubCode})`}
          </p>
        ) : (
          <p style={styles.errorText}>
            Khu vuc nay chua co hub hop le. Vui long tao/cap nhat hub voi province dung Ha Noi, Da Nang hoac Ho Chi Minh.
          </p>
        )}
      </section>

      {merchantsQuery.isLoading ? <p>Dang tai tai khoan merchant...</p> : null}
      {merchantsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(merchantsQuery.error)}</p>
      ) : null}
      {merchantsQuery.isSuccess && merchantUsers.length === 0 ? (
        <p>Khong tim thay merchant.</p>
      ) : null}

      {merchantsQuery.isSuccess && merchantUsers.length > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.headerCell}>Ma merchant</th>
              <th style={styles.headerCell}>Ho ten</th>
              <th style={styles.headerCell}>So dien thoai</th>
              <th style={styles.headerCell}>CCCD</th>
              <th style={styles.headerCell}>Khu vuc</th>
              <th style={styles.headerCell}>Hub mac dinh</th>
              <th style={styles.headerCell}>Trang thai</th>
              <th style={styles.headerCell}>Cap nhat</th>
              <th style={styles.headerCell}>Hanh dong</th>
            </tr>
          </thead>
          <tbody>
            {merchantUsers.map((user) => {
              const merchantProfile = profileByUsername.get(user.username)?.payload;
              const regionLabel =
                merchantProfile?.regionLabel ??
                (merchantProfile?.regionCode
                  ? resolveRegionLabel(merchantProfile.regionCode)
                  : 'Khong co');
              const defaultHubCode =
                merchantProfile?.defaultHubCode ?? user.hubCodes[0] ?? 'Khong co';

              return (
                <tr key={user.id}>
                  <td style={styles.cell}>{user.username}</td>
                  <td style={styles.cell}>{user.displayName ?? 'Khong co'}</td>
                  <td style={styles.cell}>{user.phone ?? 'Khong co'}</td>
                  <td style={styles.cell}>{merchantProfile?.citizenId ?? 'Khong co'}</td>
                  <td style={styles.cell}>{regionLabel}</td>
                  <td style={styles.cell}>{defaultHubCode}</td>
                  <td style={styles.cell}>{user.status}</td>
                  <td style={styles.cell}>{formatDateTime(user.updatedAt)}</td>
                  <td style={styles.cell}>
                    <div style={styles.actionsCell}>
                      <button type="button" onClick={() => onEditUser(user)}>
                        Sua
                      </button>
                      <button type="button" onClick={() => void onDeleteUser(user)}>
                        Xoa
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  helperText: {
    color: '#2d3f99',
  },
  filterForm: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  input: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 180,
  },
  editorCard: {
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8faff',
    marginBottom: 14,
  },
  editorTitle: {
    marginTop: 0,
  },
  previewRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  previewBadge: {
    border: '1px solid #c8d4ff',
    backgroundColor: '#eef3ff',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    color: '#1f2e78',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 10,
  },
  fieldLabel: {
    display: 'grid',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 12,
  },
  headerCell: {
    textAlign: 'left',
    padding: '8px 10px',
    borderBottom: '1px solid #d9def3',
  },
  cell: {
    padding: '8px 10px',
    borderBottom: '1px solid #e7ebf8',
    verticalAlign: 'top',
  },
  actionsCell: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  successText: {
    color: '#166534',
    marginTop: 8,
    marginBottom: 8,
    fontWeight: 600,
  },
  errorText: {
    color: '#b91c1c',
    marginTop: 8,
    marginBottom: 8,
    fontWeight: 600,
  },
};

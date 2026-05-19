import React, { useEffect, useMemo, useState } from 'react';

import {
  useAdminUsersQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
} from '../../features/auth/auth.api';
import type { AdminUserDto, UserStatus } from '../../features/auth/auth.types';
import {
  useCreateConfigMutation,
  useConfigsQuery,
  useHubsQuery,
  useMerchantProfilesQuery,
  useUpdateConfigMutation,
  useUpsertMerchantProfileMutation,
} from '../../features/masterdata/masterdata.api';
import type {
  ConfigValue,
  ConfigDto,
  HubDto,
  MerchantProfileDto,
  MerchantProfileWriteInput,
} from '../../features/masterdata/masterdata.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';

const MERCHANT_ROLE = 'MERCHANT';
const MERCHANT_PROFILE_SCOPE = 'MERCHANT_PROFILE';
const MERCHANT_PROFILE_KEY_PREFIX = 'merchant.profile.';
const MERCHANT_USERNAME_PATTERN = /^411\d{5}$/;
const CITIZEN_ID_PATTERN = /^\d{12}$/;

function buildMerchantProfileKey(username: string): string {
  return `${MERCHANT_PROFILE_KEY_PREFIX}${username.trim().toUpperCase()}`;
}

interface MerchantRegionOption {
  code: 'HA_NOI' | 'DA_NANG' | 'HO_CHI_MINH';
  label: string;
}

const MERCHANT_REGION_OPTIONS: MerchantRegionOption[] = [
  { code: 'HA_NOI', label: 'Hà Nội' },
  { code: 'DA_NANG', label: 'Đà Nẵng' },
  { code: 'HO_CHI_MINH', label: 'Hồ Chí Minh' },
];

interface MerchantFormState {
  fullName: string;
  phone: string;
  citizenId: string;
  regionCode: MerchantRegionOption['code'];
  defaultHubCode: string;
  businessAddressDetail: string;
  password: string;
  confirmPassword: string;
  status: UserStatus;
}

interface MerchantHubOption {
  hubCode: string;
  hubName: string;
  regionCode: MerchantRegionOption['code'];
  province: string;
  district: string;
  ward: string;
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
  businessAddressDetail: string | null;
}

const DEFAULT_FORM: MerchantFormState = {
  fullName: '',
  phone: '',
  citizenId: '',
  regionCode: MERCHANT_REGION_OPTIONS[0].code,
  defaultHubCode: '',
  businessAddressDetail: '',
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
    province: addressParts.province,
    district: addressParts.district,
    ward: addressParts.ward,
    fullAddress,
    sortLabel: `${hub.name} (${hub.code})`,
  };
}

function composeMerchantDefaultAddress(
  addressDetail: string,
  hub: MerchantHubOption | null,
): string | null {
  const trimmedAddressDetail = addressDetail.trim();
  const parts = [
    trimmedAddressDetail,
    hub?.ward ?? '',
    hub?.district ?? '',
    hub?.province ?? '',
  ]
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return hub?.fullAddress || null;
}

function toMerchantProfilePayload(
  profile: MerchantProfileDto,
): MerchantProfilePayload | null {
  const normalizedRegionCode = profile.regionCode as MerchantRegionOption['code'];
  const regionExists = MERCHANT_REGION_OPTIONS.some(
    (option) => option.code === normalizedRegionCode,
  );

  if (!regionExists) {
    return null;
  }

  return {
    username: profile.username.trim().toUpperCase(),
    citizenId: profile.citizenId.trim(),
    regionCode: normalizedRegionCode,
    regionLabel: profile.regionLabel.trim() || resolveRegionLabel(normalizedRegionCode),
    defaultHubCode: profile.defaultHubCode?.trim().toUpperCase() || null,
    defaultHubName: profile.defaultHubName?.trim() || null,
    defaultSenderAddress: profile.defaultSenderAddress?.trim() || null,
    businessAddressDetail: profile.businessAddressDetail?.trim() || null,
  };
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
    businessAddressDetail:
      typeof record.businessAddressDetail === 'string' && record.businessAddressDetail.trim()
        ? record.businessAddressDetail.trim()
        : null,
  };
}

function mapLegacyMerchantProfiles(configs: ConfigDto[]): Map<string, MerchantProfilePayload> {
  const mappedProfiles = new Map<string, MerchantProfilePayload>();

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
      ...payload,
      username,
    });
  }

  return mappedProfiles;
}

function mapMerchantProfiles(
  profiles: MerchantProfileDto[],
  legacyProfiles: Map<string, MerchantProfilePayload>,
): Map<string, MerchantProfilePayload> {
  const mappedProfiles = new Map<string, MerchantProfilePayload>(legacyProfiles);

  for (const profile of profiles) {
    const payload = toMerchantProfilePayload(profile);

    if (!payload) {
      continue;
    }

    const legacyPayload = mappedProfiles.get(payload.username);

    mappedProfiles.set(payload.username, {
      ...payload,
      businessAddressDetail:
        payload.businessAddressDetail ?? legacyPayload?.businessAddressDetail ?? null,
      defaultSenderAddress:
        payload.defaultSenderAddress ?? legacyPayload?.defaultSenderAddress ?? null,
      defaultHubCode:
        payload.defaultHubCode ?? legacyPayload?.defaultHubCode ?? null,
      defaultHubName:
        payload.defaultHubName ?? legacyPayload?.defaultHubName ?? null,
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

  throw new Error('Đã hết mã merchant 411xxxxx để tạo mới.');
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
  const merchantProfilesQuery = useMerchantProfilesQuery(accessToken, {});

  const createUserMutation = useCreateAdminUserMutation(accessToken);
  const updateUserMutation = useUpdateAdminUserMutation(accessToken);
  const createConfigMutation = useCreateConfigMutation(accessToken);
  const updateConfigMutation = useUpdateConfigMutation(accessToken);
  const upsertMerchantProfileMutation = useUpsertMerchantProfileMutation(accessToken);

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
  const legacyProfileByUsername = useMemo(
    () => mapLegacyMerchantProfiles(profilesQuery.data ?? []),
    [profilesQuery.data],
  );
  const profileByUsername = useMemo(
    () =>
      mapMerchantProfiles(
        merchantProfilesQuery.data ?? [],
        legacyProfileByUsername,
      ),
    [legacyProfileByUsername, merchantProfilesQuery.data],
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
    createConfigMutation.isPending ||
    updateConfigMutation.isPending ||
    upsertMerchantProfileMutation.isPending;

  const resetForm = () => {
    setEditingUser(null);
    setForm(DEFAULT_FORM);
  };

  const onEditUser = (user: AdminUserDto) => {
    const profile = profileByUsername.get(user.username);
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
      businessAddressDetail: profile?.businessAddressDetail ?? '',
      password: '',
      confirmPassword: '',
      status: user.status,
    });
    setActionMessage(null);
    setActionError(null);
  };

  const upsertMerchantProfile = async (
    username: string,
    profile: MerchantProfileWriteInput,
  ) =>
    upsertMerchantProfileMutation.mutateAsync({
      username,
      payload: profile,
    });

  const syncLegacyMerchantProfileConfig = async (
    username: string,
    profile: MerchantProfilePayload,
  ): Promise<void> => {
    const configKey = buildMerchantProfileKey(username);
    const configValue = profile as unknown as ConfigValue;
    const existingConfig = (profilesQuery.data ?? []).find(
      (config) => config.key.trim() === configKey,
    );

    if (existingConfig) {
      await updateConfigMutation.mutateAsync({
        configId: existingConfig.id,
        payload: {
          value: configValue,
        },
      });
      return;
    }

    await createConfigMutation.mutateAsync({
      key: configKey,
      scope: MERCHANT_PROFILE_SCOPE,
      value: configValue,
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
      setActionError('Họ tên là bắt buộc.');
      return;
    }

    if (!phone) {
      setActionError('Số điện thoại là bắt buộc.');
      return;
    }

    if (!CITIZEN_ID_PATTERN.test(citizenId)) {
      setActionError('CCCD phải gồm đúng 12 chữ số.');
      return;
    }

    if (!editingUser && !form.password.trim()) {
      setActionError('Mật khẩu là bắt buộc khi tạo merchant mới.');
      return;
    }

    if (form.password.trim() !== form.confirmPassword.trim()) {
      setActionError('Xác nhận mật khẩu không khớp.');
      return;
    }

    if (!selectedHub) {
      setActionError(
        'Vui lòng chọn hub mặc định thuộc khu vực đã chọn.',
      );
      return;
    }

    const username = editingUser?.username ?? nextMerchantUsername;
    const regionLabel = resolveRegionLabel(form.regionCode);
    const businessAddressDetail = form.businessAddressDetail.trim();

    const profilePayload: MerchantProfilePayload = {
      username,
      citizenId,
      regionCode: form.regionCode,
      regionLabel,
      defaultHubCode: selectedHub.hubCode,
      defaultHubName: selectedHub.hubName,
      defaultSenderAddress: composeMerchantDefaultAddress(
        businessAddressDetail,
        selectedHub,
      ),
      businessAddressDetail: businessAddressDetail || null,
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
        await syncLegacyMerchantProfileConfig(username, profilePayload);
        setActionMessage(`Đã cập nhật merchant ${username}.`);
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
        await syncLegacyMerchantProfileConfig(username, profilePayload);
        setActionMessage(`Đã tạo merchant ${username}.`);
      }

      resetForm();
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const onToggleUserStatus = async (user: AdminUserDto) => {
    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const actionLabel = nextStatus === 'DISABLED' ? 'vô hiệu hóa' : 'kích hoạt lại';
    const confirmMessage =
      nextStatus === 'DISABLED'
        ? `Vô hiệu hóa tài khoản merchant ${user.username}? Dữ liệu merchant, hồ sơ gửi hàng và lịch sử vận hành không bị xóa; tài khoản chỉ bị ngừng sử dụng trong nghiệp vụ logistics.`
        : `Kích hoạt lại tài khoản merchant ${user.username}? Dữ liệu cũ được giữ nguyên và merchant sẽ được phép sử dụng lại trong vận hành logistics.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setActionMessage(null);
    setActionError(null);

    try {
      await updateUserMutation.mutateAsync({
        userId: user.id,
        payload: {
          status: nextStatus,
        },
      });
      setActionMessage(`Đã ${actionLabel} merchant ${user.username}. Dữ liệu không bị xóa.`);

      if (editingUser?.id === user.id) {
        resetForm();
      }
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  return (
    <div>
      <h2>Quản trị - Quản lý tài khoản Merchant</h2>
      <p style={styles.helperText}>
        Tạo tài khoản merchant với Họ tên, Số điện thoại, CCCD, Khu vực.
        Sau khi chọn khu vực, chọn hub mặc định từ danh sách hub thuộc khu vực đó.
      </p>

      <form style={styles.filterForm} onSubmit={(event) => event.preventDefault()}>
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Tìm merchant theo mã / tên / số điện thoại"
          style={styles.input}
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as UserStatus | '')}
          style={styles.input}
        >
          <option value="">Tất cả trạng thái</option>
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
          {editingUser ? `Sửa merchant ${editingUser.username}` : 'Tạo merchant mới'}
        </h3>
        {!editingUser ? (
          <p style={styles.helperText}>
            Mã merchant được tự động sinh theo định dạng 411xxxxx.
          </p>
        ) : null}
        <div style={styles.previewRow}>
          <span style={styles.previewBadge}>
            Mã merchant: {editingUser?.username ?? nextMerchantUsername}
          </span>
          <span style={styles.previewBadge}>
            Hub mặc định: {selectedHub ? `${selectedHub.hubCode} - ${selectedHub.hubName}` : 'Không có'}
          </span>
        </div>
        <form onSubmit={onSubmitForm} style={styles.formGrid}>
          <label style={styles.fieldLabel}>
            Họ tên
            <input
              required
              value={form.fullName}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, fullName: event.target.value }))
              }
              style={styles.input}
              placeholder="Nguyễn Văn A"
            />
          </label>
          <label style={styles.fieldLabel}>
            Số điện thoại
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
            Số CCCD
            <input
              required
              value={form.citizenId}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, citizenId: event.target.value }))
              }
              style={styles.input}
              placeholder="12 chữ số"
            />
          </label>
          <label style={styles.fieldLabel}>
            Khu vực
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
            Hub mặc định
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
              <option value="">Chọn hub theo khu vực</option>
              {regionHubOptions.map((option) => (
                <option key={option.hubCode} value={option.hubCode}>
                  {option.hubCode} - {option.hubName}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            Dia chi chi tiet
            <textarea
              value={form.businessAddressDetail}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  businessAddressDetail: event.target.value,
                }))
              }
              style={styles.textarea}
              placeholder="So nha, ten duong, toa nha..."
              rows={3}
            />
          </label>
          <label style={styles.fieldLabel}>
            Mật khẩu {editingUser ? '(bỏ trống nếu không đổi)' : ''}
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, password: event.target.value }))
              }
              style={styles.input}
              placeholder={editingUser ? 'Không đổi mật khẩu' : 'Nhập mật khẩu'}
            />
          </label>
          <label style={styles.fieldLabel}>
            Xác nhận mật khẩu
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, confirmPassword: event.target.value }))
              }
              style={styles.input}
              placeholder="Nhập lại mật khẩu"
            />
          </label>
          <label style={styles.fieldLabel}>
            Trạng thái
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
              {editingUser ? 'Lưu merchant' : 'Tạo merchant'}
            </button>
            {editingUser ? (
              <button type="button" onClick={resetForm}>
                Hủy sửa
              </button>
            ) : null}
          </div>
        </form>
        {selectedHub ? (
          <p style={styles.helperText}>
            Địa chỉ mặc định: {selectedHub.fullAddress || `${selectedHub.hubName} (${selectedHub.hubCode})`}
          </p>
        ) : (
          <p style={styles.errorText}>
            Khu vực này chưa có hub hợp lệ. Vui lòng tạo/cập nhật hub với tỉnh/thành đúng Hà Nội, Đà Nẵng hoặc Hồ Chí Minh.
          </p>
        )}
      </section>

      {merchantsQuery.isLoading ? <p>Đang tải tài khoản merchant...</p> : null}
      {merchantsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(merchantsQuery.error)}</p>
      ) : null}
      {merchantsQuery.isSuccess && merchantUsers.length === 0 ? (
        <p>Không tìm thấy merchant.</p>
      ) : null}

      {merchantsQuery.isSuccess && merchantUsers.length > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.headerCell}>Mã merchant</th>
              <th style={styles.headerCell}>Họ tên</th>
              <th style={styles.headerCell}>Số điện thoại</th>
              <th style={styles.headerCell}>CCCD</th>
              <th style={styles.headerCell}>Khu vực</th>
              <th style={styles.headerCell}>Hub mặc định</th>
              <th style={styles.headerCell}>Trạng thái</th>
              <th style={styles.headerCell}>Cập nhật</th>
              <th style={styles.headerCell}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {merchantUsers.map((user) => {
              const merchantProfile = profileByUsername.get(user.username);
              const regionLabel =
                merchantProfile?.regionLabel ??
                (merchantProfile?.regionCode
                  ? resolveRegionLabel(merchantProfile.regionCode)
                  : 'Không có');
              const defaultHubCode =
                merchantProfile?.defaultHubCode ?? user.hubCodes[0] ?? 'Không có';

              return (
                <tr key={user.id}>
                  <td style={styles.cell}>{user.username}</td>
                  <td style={styles.cell}>{user.displayName ?? 'Không có'}</td>
                  <td style={styles.cell}>{user.phone ?? 'Không có'}</td>
                  <td style={styles.cell}>{merchantProfile?.citizenId ?? 'Không có'}</td>
                  <td style={styles.cell}>{regionLabel}</td>
                  <td style={styles.cell}>{defaultHubCode}</td>
                  <td style={styles.cell}>{user.status}</td>
                  <td style={styles.cell}>{formatDateTime(user.updatedAt)}</td>
                  <td style={styles.cell}>
                    <div style={styles.actionsCell}>
                      <button type="button" onClick={() => onEditUser(user)}>
                        Sửa
                      </button>
                      <button type="button" onClick={() => void onToggleUserStatus(user)}>
                        {user.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
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
    color: 'var(--admin-primary)',
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
    border: '1px solid var(--admin-border)',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 180,
  },
  textarea: {
    border: '1px solid var(--admin-border)',
    borderRadius: 10,
    padding: '8px 10px',
    minWidth: 180,
    minHeight: 88,
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  editorCard: {
    border: '1px solid var(--admin-border)',
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'var(--admin-surface-soft)',
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
    border: '1px solid #c7d2fe',
    backgroundColor: 'var(--admin-surface-soft)',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--admin-primary-dark)',
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
    borderBottom: '1px solid var(--admin-border)',
  },
  cell: {
    padding: '8px 10px',
    borderBottom: '1px solid var(--admin-border)',
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

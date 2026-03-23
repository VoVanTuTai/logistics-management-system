import React, { useMemo, useState } from 'react';

import {
  useAdminUsersQuery,
  useUpdateAdminUserMutation,
} from '../../features/auth/auth.api';
import type { AdminUserDto } from '../../features/auth/auth.types';
import {
  useCreateHubMutation,
  useDeleteHubMutation,
  useHubsQuery,
  useUpdateHubMutation,
  useZonesQuery,
} from '../../features/masterdata/masterdata.api';
import type {
  HubDto,
  HubFilters,
  HubWriteInput,
} from '../../features/masterdata/masterdata.types';
import {
  PROVINCE_OPTIONS,
  getDistrictOptions,
} from '../../constants/vnLocations';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { MasterdataEditorModal } from './components/MasterdataEditorModal';
import { MasterdataStatusPill } from './components/MasterdataStatusPill';

interface HubAddressPayload {
  addressLine: string;
  ward: string;
  district: string;
  province: string;
  phone: string;
  contactName: string;
  description: string;
}

interface HubFormState extends HubAddressPayload {
  code: string;
  name: string;
  zoneCode: string;
  isActive: boolean;
  opsUserIds: string[];
  courierUserIds: string[];
}

const EMPTY_HUB_FORM: HubFormState = {
  code: '',
  name: '',
  zoneCode: '',
  isActive: true,
  addressLine: '',
  ward: '',
  district: '',
  province: '',
  phone: '',
  contactName: '',
  description: '',
  opsUserIds: [],
  courierUserIds: [],
};

function normalizeText(value: string): string | undefined {
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function parseHubAddress(address: string | null): HubAddressPayload {
  if (!address) {
    return {
      addressLine: '',
      ward: '',
      district: '',
      province: '',
      phone: '',
      contactName: '',
      description: '',
    };
  }

  try {
    const parsed = JSON.parse(address) as Record<string, unknown>;
    return {
      addressLine:
        typeof parsed.addressLine === 'string' ? parsed.addressLine : '',
      ward: typeof parsed.ward === 'string' ? parsed.ward : '',
      district: typeof parsed.district === 'string' ? parsed.district : '',
      province: typeof parsed.province === 'string' ? parsed.province : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      contactName:
        typeof parsed.contactName === 'string' ? parsed.contactName : '',
      description:
        typeof parsed.description === 'string' ? parsed.description : '',
    };
  } catch {
    return {
      addressLine: address,
      ward: '',
      district: '',
      province: '',
      phone: '',
      contactName: '',
      description: '',
    };
  }
}

function serializeHubAddress(form: HubFormState): string | null {
  const payload = {
    addressLine: form.addressLine.trim(),
    ward: form.ward.trim(),
    district: form.district.trim(),
    province: form.province.trim(),
    phone: form.phone.trim(),
    contactName: form.contactName.trim(),
    description: form.description.trim(),
  };

  const hasAnyValue = Boolean(
    payload.addressLine ||
      payload.ward ||
      payload.district ||
      payload.province ||
      payload.phone ||
      payload.contactName ||
      payload.description,
  );

  if (!hasAnyValue) {
    return null;
  }

  return JSON.stringify(payload);
}

function formatAddressSummary(payload: HubAddressPayload): string {
  const parts = [
    payload.addressLine,
    payload.ward,
    payload.district,
    payload.province,
  ]
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return parts.length > 0 ? parts.join(', ') : 'Không có';
}

function formatContactSummary(payload: HubAddressPayload): string {
  const parts = [payload.contactName, payload.phone]
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return parts.length > 0 ? parts.join(' - ') : 'Không có';
}

function formatUserLabel(user: AdminUserDto): string {
  const displayName = user.displayName?.trim();
  return displayName ? `${user.username} - ${displayName}` : user.username;
}

function findAssignedUserIdsByHub(users: AdminUserDto[], hubCode: string): string[] {
  return users
    .filter((user) => user.hubCodes.includes(hubCode))
    .map((user) => user.id);
}

function collectAssignedUsersByHub(users: AdminUserDto[]): Map<string, string[]> {
  const result = new Map<string, string[]>();

  for (const user of users) {
    for (const hubCode of user.hubCodes) {
      const current = result.get(hubCode) ?? [];
      current.push(formatUserLabel(user));
      result.set(hubCode, current);
    }
  }

  return result;
}

function toggleId(list: string[], id: string): string[] {
  if (list.includes(id)) {
    return list.filter((item) => item !== id);
  }
  return [...list, id];
}

function normalizeHubCodes(codes: string[]): string[] {
  return Array.from(new Set(codes.map((code) => code.trim().toUpperCase()).filter(Boolean)));
}

export function HubManagementPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);

  const [appliedFilters, setAppliedFilters] = useState<HubFilters>({});
  const [draftFilters, setDraftFilters] = useState<HubFilters>({});

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingHub, setEditingHub] = useState<HubDto | null>(null);
  const [form, setForm] = useState<HubFormState>(EMPTY_HUB_FORM);
  const [selectedHubId, setSelectedHubId] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const hubsQuery = useHubsQuery(accessToken, appliedFilters);
  const zonesQuery = useZonesQuery(accessToken, { isActive: 'true' });
  const opsUsersQuery = useAdminUsersQuery(accessToken, {
    roleGroup: 'OPS',
    status: 'ACTIVE',
    hubCode: '',
    q: '',
  });
  const courierUsersQuery = useAdminUsersQuery(accessToken, {
    roleGroup: 'SHIPPER',
    status: 'ACTIVE',
    hubCode: '',
    q: '',
  });

  const createMutation = useCreateHubMutation(accessToken);
  const updateMutation = useUpdateHubMutation(accessToken);
  const deleteMutation = useDeleteHubMutation(accessToken);
  const updateUserMutation = useUpdateAdminUserMutation(accessToken);

  const selectedHub = useMemo(
    () => (hubsQuery.data ?? []).find((hub) => hub.id === selectedHubId) ?? null,
    [hubsQuery.data, selectedHubId],
  );
  const opsUsers = opsUsersQuery.data ?? [];
  const courierUsers = courierUsersQuery.data ?? [];

  const availableZones = useMemo(() => {
    const zones = zonesQuery.data ?? [];
    if (form.zoneCode && !zones.some((zone) => zone.code === form.zoneCode)) {
      return [
        { id: `legacy-${form.zoneCode}`, code: form.zoneCode, name: form.zoneCode },
        ...zones,
      ];
    }
    return zones;
  }, [form.zoneCode, zonesQuery.data]);

  const availableOpsUsers = useMemo(
    () =>
      opsUsers
        .filter((user) => {
          if (editingHub && user.hubCodes.includes(editingHub.code)) {
            return true;
          }
          return user.hubCodes.length === 0;
        })
        .sort((left, right) =>
          formatUserLabel(left).localeCompare(formatUserLabel(right), 'vi'),
        ),
    [editingHub, opsUsers],
  );

  const availableCourierUsers = useMemo(
    () =>
      courierUsers
        .filter((user) => {
          if (editingHub && user.hubCodes.includes(editingHub.code)) {
            return true;
          }
          return user.hubCodes.length === 0;
        })
        .sort((left, right) =>
          formatUserLabel(left).localeCompare(formatUserLabel(right), 'vi'),
        ),
    [courierUsers, editingHub],
  );

  const opsByHub = useMemo(() => collectAssignedUsersByHub(opsUsers), [opsUsers]);
  const couriersByHub = useMemo(
    () => collectAssignedUsersByHub(courierUsers),
    [courierUsers],
  );

  const onApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAppliedFilters({
      code: normalizeText(draftFilters.code ?? ''),
      name: normalizeText(draftFilters.name ?? ''),
      zoneCode: normalizeText(draftFilters.zoneCode ?? ''),
      isActive: normalizeText(draftFilters.isActive ?? ''),
      q: normalizeText(draftFilters.q ?? ''),
    });
  };

  const onResetFilters = () => {
    setDraftFilters({});
    setAppliedFilters({});
  };

  const openCreateModal = () => {
    setEditingHub(null);
    setForm(EMPTY_HUB_FORM);
    setActionError(null);
    setActionMessage(null);
    setEditorOpen(true);
  };

  const openEditModal = (hub: HubDto) => {
    const addressPayload = parseHubAddress(hub.address);
    setEditingHub(hub);
    setForm({
      code: hub.code,
      name: hub.name,
      zoneCode: hub.zoneCode ?? '',
      isActive: hub.isActive,
      opsUserIds: findAssignedUserIdsByHub(opsUsers, hub.code),
      courierUserIds: findAssignedUserIdsByHub(courierUsers, hub.code),
      ...addressPayload,
    });
    setActionError(null);
    setActionMessage(null);
    setEditorOpen(true);
  };

  const closeModal = () => {
    setEditorOpen(false);
  };

  const syncHubAssignments = async (
    users: AdminUserDto[],
    selectedUserIds: string[],
    hubCode: string,
  ): Promise<void> => {
    const selectedSet = new Set(selectedUserIds);
    const relatedUsers = users.filter(
      (user) => user.hubCodes.includes(hubCode) || selectedSet.has(user.id),
    );

    for (const user of relatedUsers) {
      const nextHubCodes = normalizeHubCodes(
        user.hubCodes.filter((code) => code !== hubCode),
      );
      if (selectedSet.has(user.id)) {
        nextHubCodes.push(hubCode);
      }

      const normalizedNextHubCodes = normalizeHubCodes(nextHubCodes);
      const normalizedCurrentHubCodes = normalizeHubCodes(user.hubCodes);

      if (
        normalizedNextHubCodes.join('|') === normalizedCurrentHubCodes.join('|')
      ) {
        continue;
      }

      await updateUserMutation.mutateAsync({
        userId: user.id,
        payload: {
          hubCodes: normalizedNextHubCodes,
        },
      });
    }
  };

  const onSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionMessage(null);
    setActionError(null);

    const payload: HubWriteInput = {
      name: form.name,
      zoneCode: normalizeText(form.zoneCode) ?? null,
      address: serializeHubAddress(form),
      isActive: form.isActive,
    };

    if (editingHub && form.code.trim()) {
      payload.code = form.code.trim();
    }

    try {
      const savedHub = editingHub
        ? await updateMutation.mutateAsync({
            hubId: editingHub.id,
            payload,
          })
        : await createMutation.mutateAsync(payload);

      await syncHubAssignments(opsUsers, form.opsUserIds, savedHub.code);
      await syncHubAssignments(courierUsers, form.courierUserIds, savedHub.code);

      setActionMessage(
        editingHub
          ? `Đã cập nhật bưu cục "${savedHub.code}".`
          : `Đã tạo bưu cục "${savedHub.code}".`,
      );
      setEditorOpen(false);
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const onToggleStatus = async (hub: HubDto) => {
    setActionMessage(null);
    setActionError(null);

    try {
      await updateMutation.mutateAsync({
        hubId: hub.id,
        payload: {
          isActive: !hub.isActive,
        },
      });

      setActionMessage(
        `Bưu cục "${hub.code}" đã chuyển sang ${hub.isActive ? 'INACTIVE' : 'ACTIVE'}.`,
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const onDeleteHub = async (hub: HubDto) => {
    if (!window.confirm(`Xóa bưu cục ${hub.code}?`)) {
      return;
    }

    setActionMessage(null);
    setActionError(null);

    try {
      await deleteMutation.mutateAsync(hub.id);
      setActionMessage(`Đã xóa bưu cục "${hub.code}".`);

      if (selectedHubId === hub.id) {
        setSelectedHubId('');
      }
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    updateUserMutation.isPending;
  const provinceOptions = useMemo(() => {
    if (
      form.province &&
      !PROVINCE_OPTIONS.some((province) => province.label === form.province)
    ) {
      return [
        { code: `LEGACY_${form.province}`, label: form.province, districts: [] },
        ...PROVINCE_OPTIONS,
      ];
    }
    return PROVINCE_OPTIONS;
  }, [form.province]);
  const districtOptions = useMemo(() => {
    const options = getDistrictOptions(form.province);
    if (form.district && !options.includes(form.district)) {
      return [form.district, ...options];
    }
    return options;
  }, [form.district, form.province]);

  return (
    <div>
      <h2>Dữ Liệu Danh Mục - Quản Lý Bưu Cục</h2>
      <p style={styles.helperText}>
        Quản lý bưu cục theo vùng hoạt động và gán nhân sự vận hành.
      </p>

      <form onSubmit={onApplyFilters} style={styles.filterForm}>
        <input
          placeholder="Mã bưu cục"
          value={draftFilters.code ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              code: event.target.value,
            }))
          }
          style={styles.input}
        />
        <input
          placeholder="Tên bưu cục"
          value={draftFilters.name ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              name: event.target.value,
            }))
          }
          style={styles.input}
        />
        <input
          placeholder="Mã zone"
          value={draftFilters.zoneCode ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              zoneCode: event.target.value,
            }))
          }
          style={styles.input}
        />
        <select
          value={draftFilters.isActive ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              isActive: event.target.value,
            }))
          }
          style={styles.input}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">ACTIVE</option>
          <option value="false">INACTIVE</option>
        </select>
        <input
          placeholder="Tìm nhanh"
          value={draftFilters.q ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              q: event.target.value,
            }))
          }
          style={styles.input}
        />
        <button type="submit">Áp dụng</button>
        <button type="button" onClick={onResetFilters}>
          Đặt lại
        </button>
        <button type="button" onClick={openCreateModal}>
          Tạo bưu cục
        </button>
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

      {hubsQuery.isLoading ? <p>Đang tải bưu cục...</p> : null}
      {hubsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(hubsQuery.error)}</p>
      ) : null}
      {hubsQuery.isSuccess && (hubsQuery.data?.length ?? 0) === 0 ? (
        <p>Không tìm thấy bưu cục.</p>
      ) : null}

      {hubsQuery.isSuccess && (hubsQuery.data?.length ?? 0) > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.headerCell}>Mã hub</th>
              <th style={styles.headerCell}>Tên hub</th>
              <th style={styles.headerCell}>Mã zone</th>
              <th style={styles.headerCell}>Địa chỉ</th>
              <th style={styles.headerCell}>Liên hệ</th>
              <th style={styles.headerCell}>Nhân viên Ops</th>
              <th style={styles.headerCell}>Courier</th>
              <th style={styles.headerCell}>Trạng thái</th>
              <th style={styles.headerCell}>Cập nhật</th>
              <th style={styles.headerCell}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {(hubsQuery.data ?? []).map((hub) => {
              const addressPayload = parseHubAddress(hub.address);
              const assignedOps = opsByHub.get(hub.code) ?? [];
              const assignedCouriers = couriersByHub.get(hub.code) ?? [];

              return (
                <tr key={hub.id}>
                  <td style={styles.cell}>{hub.code}</td>
                  <td style={styles.cell}>{hub.name}</td>
                  <td style={styles.cell}>{hub.zoneCode ?? 'Không có'}</td>
                  <td style={styles.cell}>{formatAddressSummary(addressPayload)}</td>
                  <td style={styles.cell}>{formatContactSummary(addressPayload)}</td>
                  <td style={styles.cell}>
                    {assignedOps.length > 0 ? assignedOps.join(', ') : 'Chưa gán'}
                  </td>
                  <td style={styles.cell}>
                    {assignedCouriers.length > 0 ? assignedCouriers.join(', ') : 'Chưa gán'}
                  </td>
                  <td style={styles.cell}>
                    <MasterdataStatusPill isActive={hub.isActive} />
                  </td>
                  <td style={styles.cell}>{formatDateTime(hub.updatedAt)}</td>
                  <td style={styles.cell}>
                    <div style={styles.actionsCell}>
                      <button type="button" onClick={() => setSelectedHubId(hub.id)}>
                        Chi tiết
                      </button>
                      <button type="button" onClick={() => openEditModal(hub)}>
                        Sửa
                      </button>
                      <button type="button" onClick={() => void onToggleStatus(hub)}>
                        {hub.isActive ? 'Tắt' : 'Bật'}
                      </button>
                      <button type="button" onClick={() => void onDeleteHub(hub)}>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}

      {selectedHub ? (
        <section style={styles.detailCard}>
          <h3 style={styles.detailTitle}>Chi tiết hub: {selectedHub.code}</h3>
          {(() => {
            const payload = parseHubAddress(selectedHub.address);
            const assignedOps = opsByHub.get(selectedHub.code) ?? [];
            const assignedCouriers = couriersByHub.get(selectedHub.code) ?? [];

            return (
              <>
                <p>
                  <strong>Tên:</strong> {selectedHub.name}
                </p>
                <p>
                  <strong>Zone:</strong> {selectedHub.zoneCode ?? 'Không có'}
                </p>
                <p>
                  <strong>Địa chỉ:</strong> {formatAddressSummary(payload)}
                </p>
                <p>
                  <strong>Nhân viên Ops:</strong>{' '}
                  {assignedOps.length > 0 ? assignedOps.join(', ') : 'Chưa gán'}
                </p>
                <p>
                  <strong>Courier:</strong>{' '}
                  {assignedCouriers.length > 0 ? assignedCouriers.join(', ') : 'Chưa gán'}
                </p>
                <p>
                  <strong>Trạng thái:</strong>{' '}
                  {selectedHub.isActive ? 'ACTIVE' : 'INACTIVE'}
                </p>
                <p>
                  <strong>Tạo lúc:</strong> {formatDateTime(selectedHub.createdAt)}
                </p>
                <p>
                  <strong>Cập nhật lúc:</strong> {formatDateTime(selectedHub.updatedAt)}
                </p>
              </>
            );
          })()}
        </section>
      ) : null}

      <MasterdataEditorModal
        open={editorOpen}
        title={editingHub ? 'Sửa hub' : 'Tạo hub'}
        submitLabel={editingHub ? 'Lưu thay đổi' : 'Tạo hub'}
        isSubmitting={isSaving}
        onClose={closeModal}
        onSubmit={onSubmitForm}
      >
        <div style={styles.formGrid}>
          <label style={styles.fieldLabel}>
            Tên hub
            <input
              value={form.name}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              required
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Mã zone
            <select
              value={form.zoneCode}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  zoneCode: event.target.value,
                }))
              }
              required
              style={styles.input}
            >
              <option value="">Chọn mã zone</option>
              {availableZones.map((zone) => (
                <option key={zone.id} value={zone.code}>
                  {zone.code} - {zone.name}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            Tỉnh/Thành
            <select
              value={form.province}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  province: event.target.value,
                  district: getDistrictOptions(event.target.value).includes(
                    previous.district,
                  )
                    ? previous.district
                    : '',
                }))
              }
              required
              style={styles.input}
            >
              <option value="">Chọn tỉnh / thành</option>
              {provinceOptions.map((province) => (
                <option key={province.code} value={province.label}>
                  {province.label}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            Quận/Huyện
            <select
              value={form.district}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  district: event.target.value,
                }))
              }
              disabled={!form.province}
              required
              style={styles.input}
            >
              <option value="">
                {form.province ? 'Chọn quận/huyện' : 'Chọn tỉnh/thành trước'}
              </option>
              {districtOptions.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            Đường / địa chỉ chi tiết
            <input
              value={form.addressLine}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  addressLine: event.target.value,
                }))
              }
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Phường/Xã
            <input
              value={form.ward}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  ward: event.target.value,
                }))
              }
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Số điện thoại
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  phone: event.target.value,
                }))
              }
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Tên liên hệ
            <input
              value={form.contactName}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  contactName: event.target.value,
                }))
              }
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Mô tả
            <input
              value={form.description}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              style={styles.input}
            />
          </label>
          <div style={styles.selectionCard}>
            <strong>Nhân viên Ops (tích để gán / bỏ tích để bỏ gán)</strong>
            <div style={styles.selectionList}>
              {availableOpsUsers.length === 0 ? (
                <span style={styles.selectionEmpty}>Không có nhân viên Ops khả dụng.</span>
              ) : (
                availableOpsUsers.map((user) => (
                  <label key={user.id} style={styles.choiceItem}>
                    <input
                      type="checkbox"
                      checked={form.opsUserIds.includes(user.id)}
                      onChange={() =>
                        setForm((previous) => ({
                          ...previous,
                          opsUserIds: toggleId(previous.opsUserIds, user.id),
                        }))
                      }
                    />
                    {formatUserLabel(user)}
                  </label>
                ))
              )}
            </div>
          </div>
          <div style={styles.selectionCard}>
            <strong>Nhân viên Courier (tích để gán / bỏ tích để bỏ gán)</strong>
            <div style={styles.selectionList}>
              {availableCourierUsers.length === 0 ? (
                <span style={styles.selectionEmpty}>Không có courier khả dụng.</span>
              ) : (
                availableCourierUsers.map((user) => (
                  <label key={user.id} style={styles.choiceItem}>
                    <input
                      type="checkbox"
                      checked={form.courierUserIds.includes(user.id)}
                      onChange={() =>
                        setForm((previous) => ({
                          ...previous,
                          courierUserIds: toggleId(previous.courierUserIds, user.id),
                        }))
                      }
                    />
                    {formatUserLabel(user)}
                  </label>
                ))
              )}
            </div>
          </div>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  isActive: event.target.checked,
                }))
              }
            />
            ACTIVE
          </label>
        </div>
      </MasterdataEditorModal>
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
    minWidth: 150,
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
  },
  detailCard: {
    marginTop: 14,
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8faff',
  },
  detailTitle: {
    marginTop: 0,
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
  selectionCard: {
    display: 'grid',
    gap: 8,
    padding: 10,
    border: '1px solid #d9def3',
    borderRadius: 10,
    backgroundColor: '#f8faff',
  },
  selectionList: {
    display: 'grid',
    gap: 6,
    maxHeight: 180,
    overflowY: 'auto',
  },
  choiceItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
  },
  selectionEmpty: {
    color: '#556096',
    fontSize: 13,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 600,
    marginTop: 24,
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

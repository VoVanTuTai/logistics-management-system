import React, { useMemo, useState } from 'react';

import {
  useCreateHubMutation,
  useDeleteHubMutation,
  useHubsQuery,
  useUpdateHubMutation,
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

type HubType = 'BRANCH' | 'SORTING_CENTER' | 'TRANSIT_HUB' | '';

interface HubAddressPayload {
  addressLine: string;
  ward: string;
  district: string;
  province: string;
  phone: string;
  contactName: string;
  type: HubType;
  description: string;
  latitude: string;
  longitude: string;
  workingRadiusKm: string;
  serviceAreas: string;
}

interface HubFormState extends HubAddressPayload {
  code: string;
  name: string;
  zoneCode: string;
  isActive: boolean;
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
  type: '',
  description: '',
  latitude: '',
  longitude: '',
  workingRadiusKm: '',
  serviceAreas: '',
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
      type: '',
      description: '',
      latitude: '',
      longitude: '',
      workingRadiusKm: '',
      serviceAreas: '',
    };
  }

  try {
    const parsed = JSON.parse(address) as Record<string, unknown>;
    const serviceAreas = Array.isArray(parsed.serviceAreas)
      ? parsed.serviceAreas
          .filter((value): value is string => typeof value === 'string')
          .join(', ')
      : typeof parsed.serviceAreas === 'string'
      ? parsed.serviceAreas
      : '';

    return {
      addressLine:
        typeof parsed.addressLine === 'string' ? parsed.addressLine : '',
      ward: typeof parsed.ward === 'string' ? parsed.ward : '',
      district: typeof parsed.district === 'string' ? parsed.district : '',
      province: typeof parsed.province === 'string' ? parsed.province : '',
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
      contactName: typeof parsed.contactName === 'string' ? parsed.contactName : '',
      type:
        typeof parsed.type === 'string' &&
        ['BRANCH', 'SORTING_CENTER', 'TRANSIT_HUB'].includes(parsed.type)
          ? (parsed.type as HubType)
          : '',
      description:
        typeof parsed.description === 'string' ? parsed.description : '',
      latitude:
        typeof parsed.latitude === 'string' ? parsed.latitude : '',
      longitude:
        typeof parsed.longitude === 'string' ? parsed.longitude : '',
      workingRadiusKm:
        typeof parsed.workingRadiusKm === 'string' ? parsed.workingRadiusKm : '',
      serviceAreas,
    };
  } catch {
    return {
      addressLine: address,
      ward: '',
      district: '',
      province: '',
      phone: '',
      contactName: '',
      type: '',
      description: '',
      latitude: '',
      longitude: '',
      workingRadiusKm: '',
      serviceAreas: '',
    };
  }
}

function serializeHubAddress(form: HubFormState): string | null {
  const serviceAreas = form.serviceAreas
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const payload = {
    addressLine: form.addressLine.trim(),
    ward: form.ward.trim(),
    district: form.district.trim(),
    province: form.province.trim(),
    phone: form.phone.trim(),
    contactName: form.contactName.trim(),
    type: form.type,
    description: form.description.trim(),
    latitude: form.latitude.trim(),
    longitude: form.longitude.trim(),
    workingRadiusKm: form.workingRadiusKm.trim(),
    serviceAreas,
  };

  const hasExtendedFields = Boolean(
    payload.ward ||
      payload.district ||
      payload.province ||
      payload.phone ||
      payload.contactName ||
      payload.type ||
      payload.description ||
      payload.latitude ||
      payload.longitude ||
      payload.workingRadiusKm ||
      payload.serviceAreas.length,
  );

  if (!payload.addressLine && !hasExtendedFields) {
    return null;
  }

  if (!hasExtendedFields) {
    return payload.addressLine || null;
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

function formatScopeSummary(payload: HubAddressPayload): string {
  const scopeParts: string[] = [];

  if (payload.workingRadiusKm.trim()) {
    scopeParts.push(`Ban kinh ${payload.workingRadiusKm.trim()}km`);
  }

  if (payload.serviceAreas.trim()) {
    scopeParts.push(payload.serviceAreas.trim());
  }

  return scopeParts.length > 0 ? scopeParts.join(' | ') : 'Không có';
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
  const createMutation = useCreateHubMutation(accessToken);
  const updateMutation = useUpdateHubMutation(accessToken);
  const deleteMutation = useDeleteHubMutation(accessToken);

  const selectedHub = useMemo(
    () => (hubsQuery.data ?? []).find((hub) => hub.id === selectedHubId) ?? null,
    [hubsQuery.data, selectedHubId],
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
      ...addressPayload,
    });
    setActionError(null);
    setActionMessage(null);
    setEditorOpen(true);
  };

  const closeModal = () => {
    setEditorOpen(false);
  };

  const onSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionMessage(null);
    setActionError(null);

    const payload: HubWriteInput = {
      code: form.code,
      name: form.name,
      zoneCode: normalizeText(form.zoneCode) ?? null,
      address: serializeHubAddress(form),
      isActive: form.isActive,
    };

    try {
      if (editingHub) {
        await updateMutation.mutateAsync({
          hubId: editingHub.id,
          payload,
        });
        setActionMessage(`Da cap nhat hub "${payload.code}".`);
      } else {
        await createMutation.mutateAsync(payload);
        setActionMessage(`Da tao hub "${payload.code}".`);
      }

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
        `Hub "${hub.code}" da chuyen sang ${hub.isActive ? 'INACTIVE' : 'ACTIVE'}.`,
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const onDeleteHub = async (hub: HubDto) => {
    if (!window.confirm(`Xoa hub ${hub.code}?`)) {
      return;
    }

    setActionMessage(null);
    setActionError(null);

    try {
      await deleteMutation.mutateAsync(hub.id);
      setActionMessage(`Da xoa hub "${hub.code}".`);

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
    deleteMutation.isPending;
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
      <h2>Du Lieu Danh Muc - Quan Ly Hub</h2>
      <p style={styles.helperText}>
        Quan ly vi tri hub, pham vi phuc vu va metadata van hanh.
      </p>

      <form onSubmit={onApplyFilters} style={styles.filterForm}>
        <input
          placeholder="Ma hub"
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
          placeholder="Ten hub"
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
          placeholder="Ma zone"
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
          <option value="">Tất cả trang thai</option>
          <option value="true">ACTIVE</option>
          <option value="false">INACTIVE</option>
        </select>
        <input
          placeholder="Tim nhanh"
          value={draftFilters.q ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              q: event.target.value,
            }))
          }
          style={styles.input}
        />
        <button type="submit">Ap dung</button>
        <button type="button" onClick={onResetFilters}>
          Dat lai
        </button>
        <button type="button" onClick={openCreateModal}>
          Tao hub
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

      {hubsQuery.isLoading ? <p>Đang tải hub...</p> : null}
      {hubsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(hubsQuery.error)}</p>
      ) : null}
      {hubsQuery.isSuccess && (hubsQuery.data?.length ?? 0) === 0 ? (
        <p>Không tìm thấy hub.</p>
      ) : null}

      {hubsQuery.isSuccess && (hubsQuery.data?.length ?? 0) > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.headerCell}>Ma</th>
              <th style={styles.headerCell}>Ten</th>
              <th style={styles.headerCell}>Loai</th>
              <th style={styles.headerCell}>Zone</th>
              <th style={styles.headerCell}>Dia chi</th>
              <th style={styles.headerCell}>Pham vi phuc vu</th>
              <th style={styles.headerCell}>Lien he</th>
              <th style={styles.headerCell}>Trang thai</th>
              <th style={styles.headerCell}>Cap nhat</th>
              <th style={styles.headerCell}>Hanh dong</th>
            </tr>
          </thead>
          <tbody>
            {(hubsQuery.data ?? []).map((hub) => {
              const addressPayload = parseHubAddress(hub.address);
              const contactSummary = [addressPayload.contactName, addressPayload.phone]
                .map((value) => value.trim())
                .filter((value) => value.length > 0)
                .join(' - ');

              return (
                <tr key={hub.id}>
                  <td style={styles.cell}>{hub.code}</td>
                  <td style={styles.cell}>{hub.name}</td>
                  <td style={styles.cell}>{addressPayload.type || 'Không có'}</td>
                  <td style={styles.cell}>{hub.zoneCode ?? 'Không có'}</td>
                  <td style={styles.cell}>{formatAddressSummary(addressPayload)}</td>
                  <td style={styles.cell}>{formatScopeSummary(addressPayload)}</td>
                  <td style={styles.cell}>{contactSummary || 'Không có'}</td>
                  <td style={styles.cell}>
                    <MasterdataStatusPill isActive={hub.isActive} />
                  </td>
                  <td style={styles.cell}>{formatDateTime(hub.updatedAt)}</td>
                  <td style={styles.cell}>
                    <div style={styles.actionsCell}>
                      <button type="button" onClick={() => setSelectedHubId(hub.id)}>
                        Chi tiet
                      </button>
                      <button type="button" onClick={() => openEditModal(hub)}>
                        Sua
                      </button>
                      <button type="button" onClick={() => void onToggleStatus(hub)}>
                        {hub.isActive ? 'Tat' : 'Bat'}
                      </button>
                      <button type="button" onClick={() => void onDeleteHub(hub)}>
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

      {selectedHub ? (
        <section style={styles.detailCard}>
          <h3 style={styles.detailTitle}>Chi tiet hub: {selectedHub.code}</h3>
          {(() => {
            const payload = parseHubAddress(selectedHub.address);
            return (
              <>
                <p>
                  <strong>Ten:</strong> {selectedHub.name}
                </p>
                <p>
                  <strong>Zone:</strong> {selectedHub.zoneCode ?? 'Không có'}
                </p>
                <p>
                  <strong>Dia chi:</strong> {formatAddressSummary(payload)}
                </p>
                <p>
                  <strong>Toa do:</strong> {payload.latitude || 'Không có'} / {payload.longitude || 'Không có'}
                </p>
                <p>
                  <strong>Pham vi phuc vu:</strong> {formatScopeSummary(payload)}
                </p>
                <p>
                  <strong>Trang thai:</strong> {selectedHub.isActive ? 'ACTIVE' : 'INACTIVE'}
                </p>
                <p>
                  <strong>Tao luc:</strong> {formatDateTime(selectedHub.createdAt)}
                </p>
                <p>
                  <strong>Cap nhat luc:</strong> {formatDateTime(selectedHub.updatedAt)}
                </p>
              </>
            );
          })()}
        </section>
      ) : null}

      <MasterdataEditorModal
        open={editorOpen}
        title={editingHub ? `Sua hub ${editingHub.code}` : 'Tao hub'}
        submitLabel={editingHub ? 'Luu thay doi' : 'Tao hub'}
        isSubmitting={isSaving}
        onClose={closeModal}
        onSubmit={onSubmitForm}
      >
        <div style={styles.formGrid}>
          <label style={styles.fieldLabel}>
            Ma hub
            <input
              value={form.code}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  code: event.target.value,
                }))
              }
              placeholder="HUB_HCM_01"
              disabled={Boolean(editingHub)}
              required
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Ten hub
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
            Loai hub
            <select
              value={form.type}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  type: event.target.value as HubType,
                }))
              }
              style={styles.input}
            >
              <option value="">Chon loai</option>
              <option value="BRANCH">BRANCH</option>
              <option value="SORTING_CENTER">SORTING_CENTER</option>
              <option value="TRANSIT_HUB">TRANSIT_HUB</option>
            </select>
          </label>
          <label style={styles.fieldLabel}>
            Ma zone
            <input
              value={form.zoneCode}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  zoneCode: event.target.value,
                }))
              }
              placeholder="ZONE_HCM"
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Duong / dia chi chi tiet
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
            Phuong/Xa
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
            Quan/Huyen
            <select
              value={form.district}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  district: event.target.value,
                }))
              }
              disabled={!form.province}
              style={styles.input}
            >
              <option value="">
                {form.province ? 'Chon quan/huyen' : 'Chon tinh/thanh truoc'}
              </option>
              {districtOptions.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            Tinh/Thanh
            <select
              value={form.province}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  province: event.target.value,
                  district: getDistrictOptions(event.target.value).includes(previous.district)
                    ? previous.district
                    : '',
                }))
              }
              required
              style={styles.input}
            >
              <option value="">Chon tinh / thanh</option>
              {provinceOptions.map((province) => (
                <option key={province.code} value={province.label}>
                  {province.label}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            Latitude
            <input
              value={form.latitude}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  latitude: event.target.value,
                }))
              }
              placeholder="10.7769"
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Longitude
            <input
              value={form.longitude}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  longitude: event.target.value,
                }))
              }
              placeholder="106.7009"
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Ban kinh phuc vu (km)
            <input
              value={form.workingRadiusKm}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  workingRadiusKm: event.target.value,
                }))
              }
              placeholder="25"
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Khu vuc phuc vu (tach boi dau phay)
            <input
              value={form.serviceAreas}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  serviceAreas: event.target.value,
                }))
              }
              placeholder="District 1, District 3, Thu Duc"
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            So dien thoai
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
            Ten lien he
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
            Mo ta
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


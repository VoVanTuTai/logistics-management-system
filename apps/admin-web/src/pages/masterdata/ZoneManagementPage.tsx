import React, { useMemo, useState } from 'react';

import {
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useZonesQuery,
} from '../../features/masterdata/masterdata.api';
import type {
  ZoneDto,
  ZoneFilters,
  ZoneWriteInput,
} from '../../features/masterdata/masterdata.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { MasterdataEditorModal } from './components/MasterdataEditorModal';
import { MasterdataStatusPill } from './components/MasterdataStatusPill';

interface ZoneFormState {
  code: string;
  name: string;
  parentCode: string;
  isActive: boolean;
}

const EMPTY_ZONE_FORM: ZoneFormState = {
  code: '',
  name: '',
  parentCode: '',
  isActive: true,
};

function normalizeText(value: string): string | undefined {
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

export function ZoneManagementPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);

  const [appliedFilters, setAppliedFilters] = useState<ZoneFilters>({});
  const [draftFilters, setDraftFilters] = useState<ZoneFilters>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneDto | null>(null);
  const [form, setForm] = useState<ZoneFormState>(EMPTY_ZONE_FORM);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const zonesQuery = useZonesQuery(accessToken, appliedFilters);
  const createMutation = useCreateZoneMutation(accessToken);
  const updateMutation = useUpdateZoneMutation(accessToken);

  const selectedZone = useMemo(
    () => (zonesQuery.data ?? []).find((zone) => zone.id === selectedZoneId) ?? null,
    [zonesQuery.data, selectedZoneId],
  );

  const onApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setAppliedFilters({
      code: normalizeText(draftFilters.code ?? ''),
      name: normalizeText(draftFilters.name ?? ''),
      parentCode: normalizeText(draftFilters.parentCode ?? ''),
      isActive: normalizeText(draftFilters.isActive ?? ''),
      q: normalizeText(draftFilters.q ?? ''),
    });
  };

  const onResetFilters = () => {
    setDraftFilters({});
    setAppliedFilters({});
  };

  const openCreateModal = () => {
    setEditingZone(null);
    setForm(EMPTY_ZONE_FORM);
    setActionError(null);
    setActionMessage(null);
    setEditorOpen(true);
  };

  const openEditModal = (zone: ZoneDto) => {
    setEditingZone(zone);
    setForm({
      code: zone.code,
      name: zone.name,
      parentCode: zone.parentCode ?? '',
      isActive: zone.isActive,
    });
    setActionError(null);
    setActionMessage(null);
    setEditorOpen(true);
  };

  const onSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setActionMessage(null);

    const code = normalizeCode(form.code);
    const name = form.name.trim();
    const parentCode = normalizeCode(form.parentCode);
    const loadedZones = zonesQuery.data ?? [];
    const parentExists = parentCode
      ? loadedZones.some((zone) => zone.code.toUpperCase() === parentCode)
      : true;

    if (!code) {
      setActionError('Mã zone là bắt buộc.');
      return;
    }

    if (!name) {
      setActionError('Tên zone là bắt buộc.');
      return;
    }

    if (parentCode && parentCode === code) {
      setActionError('Zone cha không được trỏ về chính zone đang sửa.');
      return;
    }

    if (!parentExists) {
      setActionError(`Zone cha "${parentCode}" không có trong danh sách đang tải.`);
      return;
    }

    const payload: ZoneWriteInput = {
      code,
      name,
      parentCode: parentCode || null,
      isActive: form.isActive,
    };

    try {
      if (editingZone) {
        await updateMutation.mutateAsync({
          zoneId: editingZone.id,
          payload,
        });
        setActionMessage(`Đã cập nhật zone "${payload.code}".`);
      } else {
        await createMutation.mutateAsync(payload);
        setActionMessage(`Đã tạo zone "${payload.code}".`);
      }

      setEditorOpen(false);
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const onToggleStatus = async (zone: ZoneDto) => {
    setActionError(null);
    setActionMessage(null);

    try {
      await updateMutation.mutateAsync({
        zoneId: zone.id,
        payload: {
          isActive: !zone.isActive,
        },
      });

      setActionMessage(
        `Zone "${zone.code}" đã chuyển sang ${zone.isActive ? 'INACTIVE' : 'ACTIVE'}.`,
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <h2>Dữ liệu danh mục - Quản lý zone</h2>
      <p style={styles.helperText}>
        Quản lý zone vận hành cho luồng lấy hàng và điều hướng giao hàng.
      </p>

      <form onSubmit={onApplyFilters} style={styles.filterForm}>
        <input
          placeholder="Mã zone"
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
          placeholder="Tên zone"
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
          placeholder="Mã zone cha"
          value={draftFilters.parentCode ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              parentCode: event.target.value,
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
          Dat lai
        </button>
        <button type="button" onClick={openCreateModal}>
          Tạo zone
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

      {zonesQuery.isLoading ? <p>Đang tải zone...</p> : null}
      {zonesQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(zonesQuery.error)}</p>
      ) : null}
      {zonesQuery.isSuccess && (zonesQuery.data?.length ?? 0) === 0 ? (
        <p>Không tìm thấy zone.</p>
      ) : null}

      {zonesQuery.isSuccess && (zonesQuery.data?.length ?? 0) > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.headerCell}>Mã</th>
              <th style={styles.headerCell}>Tên</th>
              <th style={styles.headerCell}>Zone cha</th>
              <th style={styles.headerCell}>Trạng thái</th>
              <th style={styles.headerCell}>Cập nhật</th>
              <th style={styles.headerCell}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {(zonesQuery.data ?? []).map((zone) => (
              <tr key={zone.id}>
                <td style={styles.cell}>{zone.code}</td>
                <td style={styles.cell}>{zone.name}</td>
                <td style={styles.cell}>{zone.parentCode ?? 'Không có'}</td>
                <td style={styles.cell}>
                  <MasterdataStatusPill isActive={zone.isActive} />
                </td>
                <td style={styles.cell}>{formatDateTime(zone.updatedAt)}</td>
                <td style={styles.cell}>
                  <div style={styles.actionsCell}>
                    <button type="button" onClick={() => setSelectedZoneId(zone.id)}>
                      Chi tiết
                    </button>
                    <button type="button" onClick={() => openEditModal(zone)}>
                      Sửa
                    </button>
                    <button type="button" onClick={() => void onToggleStatus(zone)}>
                      {zone.isActive ? 'Tắt' : 'Bật'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {selectedZone ? (
        <section style={styles.detailCard}>
          <h3 style={styles.detailTitle}>Chi tiết zone: {selectedZone.code}</h3>
          <p>
            <strong>Tên:</strong> {selectedZone.name}
          </p>
          <p>
            <strong>Zone cha:</strong> {selectedZone.parentCode ?? 'Không có'}
          </p>
          <p>
            <strong>Trạng thái:</strong> {selectedZone.isActive ? 'ACTIVE' : 'INACTIVE'}
          </p>
          <p>
            <strong>Tạo lúc:</strong> {formatDateTime(selectedZone.createdAt)}
          </p>
          <p>
            <strong>Cập nhật lúc:</strong> {formatDateTime(selectedZone.updatedAt)}
          </p>
        </section>
      ) : null}

      <MasterdataEditorModal
        open={editorOpen}
        title={editingZone ? `Sửa zone ${editingZone.code}` : 'Tạo zone'}
        submitLabel={editingZone ? 'Lưu thay đổi' : 'Tạo zone'}
        isSubmitting={isSaving}
        onClose={() => setEditorOpen(false)}
        onSubmit={onSubmitForm}
      >
        <div style={styles.formGrid}>
          <label style={styles.fieldLabel}>
            Mã zone
            <input
              value={form.code}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  code: normalizeCode(event.target.value),
                }))
              }
              placeholder="ZONE_HCM"
              disabled={Boolean(editingZone)}
              required
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Tên zone
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
            Mã zone cha
            <input
              value={form.parentCode}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  parentCode: normalizeCode(event.target.value),
                }))
              }
              placeholder="ZONE_PARENT"
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
    borderBottom: '1px solid var(--admin-border)',
  },
  cell: {
    padding: '8px 10px',
    borderBottom: '1px solid var(--admin-border)',
  },
  actionsCell: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  detailCard: {
    marginTop: 14,
    border: '1px solid var(--admin-border)',
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'var(--admin-surface-soft)',
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

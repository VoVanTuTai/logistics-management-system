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

    const payload: ZoneWriteInput = {
      code: form.code,
      name: form.name,
      parentCode: normalizeText(form.parentCode) ?? null,
      isActive: form.isActive,
    };

    try {
      if (editingZone) {
        await updateMutation.mutateAsync({
          zoneId: editingZone.id,
          payload,
        });
        setActionMessage(`Da cap nhat zone "${payload.code}".`);
      } else {
        await createMutation.mutateAsync(payload);
        setActionMessage(`Da tao zone "${payload.code}".`);
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
        `Zone "${zone.code}" da chuyen sang ${zone.isActive ? 'INACTIVE' : 'ACTIVE'}.`,
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <h2>Du Lieu Danh Muc - Quan Ly Zone</h2>
      <p style={styles.helperText}>
        Quan ly zone van hanh cho luong lay hang va dieu huong giao hang.
      </p>

      <form onSubmit={onApplyFilters} style={styles.filterForm}>
        <input
          placeholder="Ma zone"
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
          placeholder="Ten zone"
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
          placeholder="Ma zone cha"
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
          <option value="">Tat ca trang thai</option>
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
          Tao zone
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

      {zonesQuery.isLoading ? <p>Dang tai zone...</p> : null}
      {zonesQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(zonesQuery.error)}</p>
      ) : null}
      {zonesQuery.isSuccess && (zonesQuery.data?.length ?? 0) === 0 ? (
        <p>Khong tim thay zone.</p>
      ) : null}

      {zonesQuery.isSuccess && (zonesQuery.data?.length ?? 0) > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.headerCell}>Ma</th>
              <th style={styles.headerCell}>Ten</th>
              <th style={styles.headerCell}>Zone cha</th>
              <th style={styles.headerCell}>Trang thai</th>
              <th style={styles.headerCell}>Cap nhat</th>
              <th style={styles.headerCell}>Hanh dong</th>
            </tr>
          </thead>
          <tbody>
            {(zonesQuery.data ?? []).map((zone) => (
              <tr key={zone.id}>
                <td style={styles.cell}>{zone.code}</td>
                <td style={styles.cell}>{zone.name}</td>
                <td style={styles.cell}>{zone.parentCode ?? 'Khong co'}</td>
                <td style={styles.cell}>
                  <MasterdataStatusPill isActive={zone.isActive} />
                </td>
                <td style={styles.cell}>{formatDateTime(zone.updatedAt)}</td>
                <td style={styles.cell}>
                  <div style={styles.actionsCell}>
                    <button type="button" onClick={() => setSelectedZoneId(zone.id)}>
                      Chi tiet
                    </button>
                    <button type="button" onClick={() => openEditModal(zone)}>
                      Sua
                    </button>
                    <button type="button" onClick={() => void onToggleStatus(zone)}>
                      {zone.isActive ? 'Tat' : 'Bat'}
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
          <h3 style={styles.detailTitle}>Chi tiet zone: {selectedZone.code}</h3>
          <p>
            <strong>Ten:</strong> {selectedZone.name}
          </p>
          <p>
            <strong>Zone cha:</strong> {selectedZone.parentCode ?? 'Khong co'}
          </p>
          <p>
            <strong>Trang thai:</strong> {selectedZone.isActive ? 'ACTIVE' : 'INACTIVE'}
          </p>
          <p>
            <strong>Tao luc:</strong> {formatDateTime(selectedZone.createdAt)}
          </p>
          <p>
            <strong>Cap nhat luc:</strong> {formatDateTime(selectedZone.updatedAt)}
          </p>
        </section>
      ) : null}

      <MasterdataEditorModal
        open={editorOpen}
        title={editingZone ? `Sua zone ${editingZone.code}` : 'Tao zone'}
        submitLabel={editingZone ? 'Luu thay doi' : 'Tao zone'}
        isSubmitting={isSaving}
        onClose={() => setEditorOpen(false)}
        onSubmit={onSubmitForm}
      >
        <div style={styles.formGrid}>
          <label style={styles.fieldLabel}>
            Ma zone
            <input
              value={form.code}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  code: event.target.value,
                }))
              }
              placeholder="ZONE_HCM"
              disabled={Boolean(editingZone)}
              required
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Ten zone
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
            Ma zone cha
            <input
              value={form.parentCode}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  parentCode: event.target.value,
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

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
        setActionMessage(`Zone "${payload.code}" updated.`);
      } else {
        await createMutation.mutateAsync(payload);
        setActionMessage(`Zone "${payload.code}" created.`);
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
        `Zone "${zone.code}" switched to ${zone.isActive ? 'INACTIVE' : 'ACTIVE'}.`,
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <h2>Master Data - Zone Management</h2>
      <p style={styles.helperText}>
        Manage operation zones for pickup and delivery routing.
      </p>

      <form onSubmit={onApplyFilters} style={styles.filterForm}>
        <input
          placeholder="Code"
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
          placeholder="Name"
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
          placeholder="Parent code"
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
          <option value="">All statuses</option>
          <option value="true">ACTIVE</option>
          <option value="false">INACTIVE</option>
        </select>
        <input
          placeholder="Quick search"
          value={draftFilters.q ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              q: event.target.value,
            }))
          }
          style={styles.input}
        />
        <button type="submit">Apply</button>
        <button type="button" onClick={onResetFilters}>
          Reset
        </button>
        <button type="button" onClick={openCreateModal}>
          Create Zone
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

      {zonesQuery.isLoading ? <p>Loading zones...</p> : null}
      {zonesQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(zonesQuery.error)}</p>
      ) : null}
      {zonesQuery.isSuccess && (zonesQuery.data?.length ?? 0) === 0 ? (
        <p>No zones found.</p>
      ) : null}

      {zonesQuery.isSuccess && (zonesQuery.data?.length ?? 0) > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.headerCell}>Code</th>
              <th style={styles.headerCell}>Name</th>
              <th style={styles.headerCell}>Parent zone</th>
              <th style={styles.headerCell}>Status</th>
              <th style={styles.headerCell}>Updated</th>
              <th style={styles.headerCell}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(zonesQuery.data ?? []).map((zone) => (
              <tr key={zone.id}>
                <td style={styles.cell}>{zone.code}</td>
                <td style={styles.cell}>{zone.name}</td>
                <td style={styles.cell}>{zone.parentCode ?? 'N/A'}</td>
                <td style={styles.cell}>
                  <MasterdataStatusPill isActive={zone.isActive} />
                </td>
                <td style={styles.cell}>{formatDateTime(zone.updatedAt)}</td>
                <td style={styles.cell}>
                  <div style={styles.actionsCell}>
                    <button type="button" onClick={() => setSelectedZoneId(zone.id)}>
                      Detail
                    </button>
                    <button type="button" onClick={() => openEditModal(zone)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => void onToggleStatus(zone)}>
                      {zone.isActive ? 'Deactivate' : 'Activate'}
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
          <h3 style={styles.detailTitle}>Zone Detail: {selectedZone.code}</h3>
          <p>
            <strong>Name:</strong> {selectedZone.name}
          </p>
          <p>
            <strong>Parent zone:</strong> {selectedZone.parentCode ?? 'N/A'}
          </p>
          <p>
            <strong>Status:</strong> {selectedZone.isActive ? 'ACTIVE' : 'INACTIVE'}
          </p>
          <p>
            <strong>Created:</strong> {formatDateTime(selectedZone.createdAt)}
          </p>
          <p>
            <strong>Updated:</strong> {formatDateTime(selectedZone.updatedAt)}
          </p>
        </section>
      ) : null}

      <MasterdataEditorModal
        open={editorOpen}
        title={editingZone ? `Edit Zone ${editingZone.code}` : 'Create Zone'}
        submitLabel={editingZone ? 'Save changes' : 'Create zone'}
        isSubmitting={isSaving}
        onClose={() => setEditorOpen(false)}
        onSubmit={onSubmitForm}
      >
        <div style={styles.formGrid}>
          <label style={styles.fieldLabel}>
            Zone code
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
            Zone name
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
            Parent zone code
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

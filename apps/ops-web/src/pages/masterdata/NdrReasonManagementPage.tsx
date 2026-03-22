import React, { useMemo, useState } from 'react';

import {
  useCreateNdrReasonMutation,
  useNdrReasonsQuery,
  useUpdateNdrReasonMutation,
} from '../../features/masterdata/masterdata.api';
import type {
  NdrReasonDto,
  NdrReasonFilters,
  NdrReasonWriteInput,
} from '../../features/masterdata/masterdata.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { MasterdataEditorModal } from './components/MasterdataEditorModal';
import { MasterdataStatusPill } from './components/MasterdataStatusPill';

type NdrCategory = 'CUSTOMER' | 'ADDRESS' | 'COURIER' | 'SYSTEM' | 'OTHER';

interface NdrReasonPayload {
  name: string;
  category: NdrCategory;
  description: string;
  allowReschedule: boolean;
  allowReturn: boolean;
  sortOrder: number;
}

interface NdrReasonFormState extends NdrReasonPayload {
  code: string;
  isActive: boolean;
}

const EMPTY_NDR_FORM: NdrReasonFormState = {
  code: '',
  name: '',
  category: 'OTHER',
  description: '',
  allowReschedule: false,
  allowReturn: false,
  sortOrder: 0,
  isActive: true,
};

function normalizeText(value: string): string | undefined {
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function parseNdrReasonPayload(rawDescription: string): NdrReasonPayload {
  try {
    const parsed = JSON.parse(rawDescription) as Record<string, unknown>;
    const categoryRaw =
      typeof parsed.category === 'string' ? parsed.category.toUpperCase() : 'OTHER';
    const allowedCategories: NdrCategory[] = [
      'CUSTOMER',
      'ADDRESS',
      'COURIER',
      'SYSTEM',
      'OTHER',
    ];
    const normalizedCategory = allowedCategories.includes(categoryRaw as NdrCategory)
      ? (categoryRaw as NdrCategory)
      : 'OTHER';

    return {
      name: typeof parsed.name === 'string' ? parsed.name : rawDescription,
      category: normalizedCategory,
      description:
        typeof parsed.description === 'string' ? parsed.description : rawDescription,
      allowReschedule: Boolean(parsed.allowReschedule),
      allowReturn: Boolean(parsed.allowReturn),
      sortOrder:
        typeof parsed.sortOrder === 'number' && Number.isFinite(parsed.sortOrder)
          ? parsed.sortOrder
          : 0,
    };
  } catch {
    return {
      name: rawDescription,
      category: 'OTHER',
      description: rawDescription,
      allowReschedule: false,
      allowReturn: false,
      sortOrder: 0,
    };
  }
}

function buildNdrReasonDescription(payload: NdrReasonPayload): string {
  return JSON.stringify({
    name: payload.name.trim(),
    category: payload.category,
    description: payload.description.trim(),
    allowReschedule: payload.allowReschedule,
    allowReturn: payload.allowReturn,
    sortOrder: payload.sortOrder,
  });
}

export function NdrReasonManagementPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);

  const [appliedFilters, setAppliedFilters] = useState<NdrReasonFilters>({});
  const [draftFilters, setDraftFilters] = useState<NdrReasonFilters>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<NdrReasonDto | null>(null);
  const [form, setForm] = useState<NdrReasonFormState>(EMPTY_NDR_FORM);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reasonsQuery = useNdrReasonsQuery(accessToken, appliedFilters);
  const createMutation = useCreateNdrReasonMutation(accessToken);
  const updateMutation = useUpdateNdrReasonMutation(accessToken);

  const selectedReason = useMemo(
    () =>
      (reasonsQuery.data ?? []).find((reason) => reason.id === selectedReasonId) ?? null,
    [reasonsQuery.data, selectedReasonId],
  );

  const onApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setAppliedFilters({
      code: normalizeText(draftFilters.code ?? ''),
      isActive: normalizeText(draftFilters.isActive ?? ''),
      q: normalizeText(draftFilters.q ?? ''),
    });
  };

  const onResetFilters = () => {
    setDraftFilters({});
    setAppliedFilters({});
  };

  const openCreateModal = () => {
    setEditingReason(null);
    setForm(EMPTY_NDR_FORM);
    setActionError(null);
    setActionMessage(null);
    setEditorOpen(true);
  };

  const openEditModal = (reason: NdrReasonDto) => {
    const payload = parseNdrReasonPayload(reason.description);

    setEditingReason(reason);
    setForm({
      code: reason.code,
      name: payload.name,
      category: payload.category,
      description: payload.description,
      allowReschedule: payload.allowReschedule,
      allowReturn: payload.allowReturn,
      sortOrder: payload.sortOrder,
      isActive: reason.isActive,
    });
    setActionError(null);
    setActionMessage(null);
    setEditorOpen(true);
  };

  const onSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setActionMessage(null);

    const payload: NdrReasonWriteInput = {
      code: form.code,
      description: buildNdrReasonDescription({
        name: form.name,
        category: form.category,
        description: form.description,
        allowReschedule: form.allowReschedule,
        allowReturn: form.allowReturn,
        sortOrder: form.sortOrder,
      }),
      isActive: form.isActive,
    };

    try {
      if (editingReason) {
        await updateMutation.mutateAsync({
          ndrReasonId: editingReason.id,
          payload,
        });
        setActionMessage(`Da cap nhat ly do NDR "${payload.code}".`);
      } else {
        await createMutation.mutateAsync(payload);
        setActionMessage(`Da tao ly do NDR "${payload.code}".`);
      }

      setEditorOpen(false);
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const onToggleStatus = async (reason: NdrReasonDto) => {
    setActionError(null);
    setActionMessage(null);

    try {
      await updateMutation.mutateAsync({
        ndrReasonId: reason.id,
        payload: {
          isActive: !reason.isActive,
        },
      });

      setActionMessage(
        `Ly do NDR "${reason.code}" da chuyen sang ${reason.isActive ? 'INACTIVE' : 'ACTIVE'}.`,
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <h2>Du Lieu Danh Muc - Quan Ly Ly Do NDR</h2>
      <p style={styles.helperText}>
        Quan ly bo ly do that bai chuan hoa dung cho giao hang va van hanh.
      </p>

      <form onSubmit={onApplyFilters} style={styles.filterForm}>
        <input
          placeholder="Ma ly do"
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
          placeholder="Tim theo ma/ten/mo ta"
          value={draftFilters.q ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              q: event.target.value,
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
        <button type="submit">Ap dung</button>
        <button type="button" onClick={onResetFilters}>
          Dat lai
        </button>
        <button type="button" onClick={openCreateModal}>
          Tao ly do
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

      {reasonsQuery.isLoading ? <p>Dang tai ly do NDR...</p> : null}
      {reasonsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(reasonsQuery.error)}</p>
      ) : null}
      {reasonsQuery.isSuccess && (reasonsQuery.data?.length ?? 0) === 0 ? (
        <p>Khong tim thay ly do NDR.</p>
      ) : null}

      {reasonsQuery.isSuccess && (reasonsQuery.data?.length ?? 0) > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.headerCell}>Code</th>
              <th style={styles.headerCell}>Ten</th>
              <th style={styles.headerCell}>Nhom</th>
              <th style={styles.headerCell}>Hen lai</th>
              <th style={styles.headerCell}>Hoan</th>
              <th style={styles.headerCell}>Trang thai</th>
              <th style={styles.headerCell}>Cap nhat</th>
              <th style={styles.headerCell}>Hanh dong</th>
            </tr>
          </thead>
          <tbody>
            {(reasonsQuery.data ?? []).map((reason) => {
              const parsedReason = parseNdrReasonPayload(reason.description);

              return (
                <tr key={reason.id}>
                  <td style={styles.cell}>{reason.code}</td>
                  <td style={styles.cell}>{parsedReason.name}</td>
                  <td style={styles.cell}>{parsedReason.category}</td>
                  <td style={styles.cell}>
                    {parsedReason.allowReschedule ? 'CO' : 'KHONG'}
                  </td>
                  <td style={styles.cell}>{parsedReason.allowReturn ? 'CO' : 'KHONG'}</td>
                  <td style={styles.cell}>
                    <MasterdataStatusPill isActive={reason.isActive} />
                  </td>
                  <td style={styles.cell}>{formatDateTime(reason.updatedAt)}</td>
                  <td style={styles.cell}>
                    <div style={styles.actionsCell}>
                      <button type="button" onClick={() => setSelectedReasonId(reason.id)}>
                        Chi tiet
                      </button>
                      <button type="button" onClick={() => openEditModal(reason)}>
                        Sua
                      </button>
                      <button type="button" onClick={() => void onToggleStatus(reason)}>
                        {reason.isActive ? 'Tat' : 'Bat'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}

      {selectedReason ? (
        <section style={styles.detailCard}>
          {(() => {
            const payload = parseNdrReasonPayload(selectedReason.description);

            return (
              <>
                <h3 style={styles.detailTitle}>Chi tiet NDR: {selectedReason.code}</h3>
                <p>
                  <strong>Ten:</strong> {payload.name}
                </p>
                <p>
                  <strong>Nhom:</strong> {payload.category}
                </p>
                <p>
                  <strong>Mo ta:</strong> {payload.description}
                </p>
                <p>
                  <strong>Cho phep hen lai:</strong>{' '}
                  {payload.allowReschedule ? 'CO' : 'KHONG'}
                </p>
                <p>
                  <strong>Cho phep hoan:</strong> {payload.allowReturn ? 'CO' : 'KHONG'}
                </p>
                <p>
                  <strong>Thu tu:</strong> {payload.sortOrder}
                </p>
                <p>
                  <strong>Trang thai:</strong>{' '}
                  {selectedReason.isActive ? 'ACTIVE' : 'INACTIVE'}
                </p>
                <p>
                  <strong>Cap nhat:</strong> {formatDateTime(selectedReason.updatedAt)}
                </p>
              </>
            );
          })()}
        </section>
      ) : null}

      <MasterdataEditorModal
        open={editorOpen}
        title={
          editingReason
            ? `Sua ly do NDR ${editingReason.code}`
            : 'Tao ly do NDR'
        }
        submitLabel={editingReason ? 'Luu thay doi' : 'Tao ly do'}
        isSubmitting={isSaving}
        onClose={() => setEditorOpen(false)}
        onSubmit={onSubmitForm}
      >
        <div style={styles.formGrid}>
          <label style={styles.fieldLabel}>
            Ma ly do
            <input
              value={form.code}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  code: event.target.value,
                }))
              }
              placeholder="CANNOT_CONTACT"
              disabled={Boolean(editingReason)}
              required
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Ten ly do
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
            Nhom
            <select
              value={form.category}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  category: event.target.value as NdrCategory,
                }))
              }
              style={styles.input}
            >
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="ADDRESS">ADDRESS</option>
              <option value="COURIER">COURIER</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="OTHER">OTHER</option>
            </select>
          </label>
          <label style={styles.fieldLabel}>
            Thu tu
            <input
              type="number"
              value={form.sortOrder}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  sortOrder: Number(event.target.value) || 0,
                }))
              }
              style={styles.input}
            />
          </label>
          <label style={{ ...styles.fieldLabel, gridColumn: '1 / -1' }}>
            Mo ta
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              rows={3}
              style={styles.textarea}
            />
          </label>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.allowReschedule}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  allowReschedule: event.target.checked,
                }))
              }
            />
            Cho phep hen lai
          </label>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.allowReturn}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  allowReturn: event.target.checked,
                }))
              }
            />
            Cho phep hoan
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
  textarea: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    width: '100%',
    resize: 'vertical',
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

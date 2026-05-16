import React, { useMemo, useState } from 'react';

import {
  useConfigsQuery,
  useCreateConfigMutation,
  useUpdateConfigMutation,
} from '../../features/masterdata/masterdata.api';
import type {
  ConfigDto,
  ConfigFilters,
  ConfigValue,
  ConfigWriteInput,
} from '../../features/masterdata/masterdata.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { MasterdataEditorModal } from './components/MasterdataEditorModal';
import { MasterdataStatusPill } from './components/MasterdataStatusPill';

type ConfigValueType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';

interface ConfigEnvelope {
  name: string;
  valueType: ConfigValueType;
  value: ConfigValue;
  defaultValue: ConfigValue | null;
  isActive: boolean;
  isEditable: boolean;
}

interface ConfigFormState {
  key: string;
  name: string;
  group: string;
  valueType: ConfigValueType;
  valueInput: string;
  defaultValueInput: string;
  description: string;
  isActive: boolean;
  isEditable: boolean;
}

const EMPTY_CONFIG_FORM: ConfigFormState = {
  key: '',
  name: '',
  group: '',
  valueType: 'STRING',
  valueInput: '',
  defaultValueInput: '',
  description: '',
  isActive: true,
  isEditable: true,
};

function normalizeText(value: string): string | undefined {
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function inferValueType(value: ConfigValue): ConfigValueType {
  if (typeof value === 'number') {
    return 'NUMBER';
  }

  if (typeof value === 'boolean') {
    return 'BOOLEAN';
  }

  if (typeof value === 'string' || value === null) {
    return 'STRING';
  }

  return 'JSON';
}

function stringifyValue(value: ConfigValue | null): string {
  if (value === null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value, null, 2);
}

function parseConfigEnvelope(config: ConfigDto): ConfigEnvelope {
  if (isRecord(config.value) && 'valueType' in config.value && 'value' in config.value) {
    const payload = config.value as Record<string, unknown>;
    const valueTypeRaw =
      typeof payload.valueType === 'string' ? payload.valueType.toUpperCase() : 'JSON';
    const valueType: ConfigValueType = ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'].includes(
      valueTypeRaw,
    )
      ? (valueTypeRaw as ConfigValueType)
      : 'JSON';

    return {
      name: typeof payload.name === 'string' ? payload.name : config.key,
      valueType,
      value: (payload.value ?? null) as ConfigValue,
      defaultValue: (payload.defaultValue ?? null) as ConfigValue | null,
      isActive:
        typeof payload.isActive === 'boolean' ? payload.isActive : true,
      isEditable:
        typeof payload.isEditable === 'boolean' ? payload.isEditable : true,
    };
  }

  return {
    name: config.key,
    valueType: inferValueType(config.value),
    value: config.value,
    defaultValue: null,
    isActive: true,
    isEditable: true,
  };
}

function parseInputByType(valueType: ConfigValueType, input: string): ConfigValue {
  const normalizedInput = input.trim();

  if (valueType === 'STRING') {
    return normalizedInput;
  }

  if (valueType === 'NUMBER') {
    const value = Number(normalizedInput);

    if (!Number.isFinite(value)) {
      throw new Error('Giá trị số không hợp lệ.');
    }

    return value;
  }

  if (valueType === 'BOOLEAN') {
    const loweredInput = normalizedInput.toLowerCase();

    if (['true', '1', 'yes'].includes(loweredInput)) {
      return true;
    }

    if (['false', '0', 'no'].includes(loweredInput)) {
      return false;
    }

    throw new Error('Giá trị boolean phải là true/false.');
  }

  if (!normalizedInput) {
    return null;
  }

  return JSON.parse(normalizedInput) as ConfigValue;
}

function buildConfigPayloadFromForm(form: ConfigFormState): ConfigWriteInput {
  const value = parseInputByType(form.valueType, form.valueInput);
  const hasDefaultValue = form.defaultValueInput.trim().length > 0;
  const defaultValue = hasDefaultValue
    ? parseInputByType(form.valueType, form.defaultValueInput)
    : null;

  return {
    key: form.key,
    scope: normalizeText(form.group) ?? null,
    description: normalizeText(form.description) ?? null,
    value: {
      name: form.name.trim() || form.key.trim(),
      valueType: form.valueType,
      value,
      defaultValue,
      isActive: form.isActive,
      isEditable: form.isEditable,
    },
  };
}

function mapConfigToForm(config: ConfigDto): ConfigFormState {
  const envelope = parseConfigEnvelope(config);

  return {
    key: config.key,
    name: envelope.name,
    group: config.scope ?? '',
    valueType: envelope.valueType,
    valueInput: stringifyValue(envelope.value),
    defaultValueInput: stringifyValue(envelope.defaultValue),
    description: config.description ?? '',
    isActive: envelope.isActive,
    isEditable: envelope.isEditable,
  };
}

export function ConfigManagementPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);

  const [appliedFilters, setAppliedFilters] = useState<ConfigFilters>({});
  const [draftFilters, setDraftFilters] = useState<ConfigFilters>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigDto | null>(null);
  const [form, setForm] = useState<ConfigFormState>(EMPTY_CONFIG_FORM);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const configsQuery = useConfigsQuery(accessToken, appliedFilters);
  const createMutation = useCreateConfigMutation(accessToken);
  const updateMutation = useUpdateConfigMutation(accessToken);

  const visibleConfigs = useMemo(() => {
    const qFilter = appliedFilters.q?.trim().toLowerCase();

    return (configsQuery.data ?? []).filter((config) => {
      const envelope = parseConfigEnvelope(config);
      const isActiveMatched =
        activeFilter === 'all' ||
        (activeFilter === 'active' ? envelope.isActive : !envelope.isActive);

      if (!isActiveMatched) {
        return false;
      }

      if (!qFilter) {
        return true;
      }

      const nameText = envelope.name.toLowerCase();
      return nameText.includes(qFilter) || config.key.toLowerCase().includes(qFilter);
    });
  }, [activeFilter, appliedFilters.q, configsQuery.data]);

  const selectedConfig = useMemo(
    () => visibleConfigs.find((config) => config.id === selectedConfigId) ?? null,
    [selectedConfigId, visibleConfigs],
  );

  const onApplyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setAppliedFilters({
      key: normalizeText(draftFilters.key ?? ''),
      scope: normalizeText(draftFilters.scope ?? ''),
      q: normalizeText(draftFilters.q ?? ''),
    });
  };

  const onResetFilters = () => {
    setDraftFilters({});
    setAppliedFilters({});
    setActiveFilter('all');
  };

  const openCreateModal = () => {
    setEditingConfig(null);
    setForm(EMPTY_CONFIG_FORM);
    setActionError(null);
    setActionMessage(null);
    setEditorOpen(true);
  };

  const openEditModal = (config: ConfigDto) => {
    setEditingConfig(config);
    setForm(mapConfigToForm(config));
    setActionError(null);
    setActionMessage(null);
    setEditorOpen(true);
  };

  const onSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionError(null);
    setActionMessage(null);

    try {
      const payload = buildConfigPayloadFromForm(form);

      if (editingConfig) {
        await updateMutation.mutateAsync({
          configId: editingConfig.id,
          payload,
        });
        setActionMessage(`Đã cập nhật config "${payload.key}".`);
      } else {
        await createMutation.mutateAsync(payload);
        setActionMessage(`Đã tạo config "${payload.key}".`);
      }

      setEditorOpen(false);
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const onToggleActive = async (config: ConfigDto) => {
    setActionError(null);
    setActionMessage(null);

    try {
      const currentEnvelope = parseConfigEnvelope(config);
      const payload: Partial<ConfigWriteInput> = {
        value: {
          ...currentEnvelope,
          isActive: !currentEnvelope.isActive,
        },
      };

      await updateMutation.mutateAsync({
        configId: config.id,
        payload,
      });

      setActionMessage(
        `Config "${config.key}" đã chuyển sang ${currentEnvelope.isActive ? 'INACTIVE' : 'ACTIVE'}.`,
      );
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <h2>Dữ liệu danh mục - Quản lý Config</h2>
      <p style={styles.helperText}>
        Quản lý cấu hình hệ thống dạng key-value dùng chung cho vận hành.
      </p>

      <form onSubmit={onApplyFilters} style={styles.filterForm}>
        <input
          placeholder="Khóa config"
          value={draftFilters.key ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              key: event.target.value,
            }))
          }
          style={styles.input}
        />
        <input
          placeholder="Nhóm (scope)"
          value={draftFilters.scope ?? ''}
          onChange={(event) =>
            setDraftFilters((previous) => ({
              ...previous,
              scope: event.target.value,
            }))
          }
          style={styles.input}
        />
        <input
          placeholder="Tìm theo key/tên"
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
          value={activeFilter}
          onChange={(event) =>
            setActiveFilter(event.target.value as 'all' | 'active' | 'inactive')
          }
          style={styles.input}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">ACTIVE</option>
          <option value="inactive">INACTIVE</option>
        </select>
        <button type="submit">Áp dụng</button>
        <button type="button" onClick={onResetFilters}>
          Đặt lại
        </button>
        <button type="button" onClick={openCreateModal}>
          Tạo config
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

      {configsQuery.isLoading ? <p>Đang tải config...</p> : null}
      {configsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(configsQuery.error)}</p>
      ) : null}
      {configsQuery.isSuccess && visibleConfigs.length === 0 ? (
        <p>Không tìm thấy config.</p>
      ) : null}

      {configsQuery.isSuccess && visibleConfigs.length > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.headerCell}>Key</th>
              <th style={styles.headerCell}>Tên</th>
              <th style={styles.headerCell}>Nhom</th>
              <th style={styles.headerCell}>Giá trị</th>
              <th style={styles.headerCell}>Kiểu</th>
              <th style={styles.headerCell}>Trạng thái</th>
              <th style={styles.headerCell}>Cập nhật</th>
              <th style={styles.headerCell}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {visibleConfigs.map((config) => {
              const envelope = parseConfigEnvelope(config);

              return (
                <tr key={config.id}>
                  <td style={styles.cell}>{config.key}</td>
                  <td style={styles.cell}>{envelope.name}</td>
                  <td style={styles.cell}>{config.scope ?? 'Không có'}</td>
                  <td style={styles.cell}>{stringifyValue(envelope.value) || 'Không có'}</td>
                  <td style={styles.cell}>{envelope.valueType}</td>
                  <td style={styles.cell}>
                    <MasterdataStatusPill isActive={envelope.isActive} />
                  </td>
                  <td style={styles.cell}>{formatDateTime(config.updatedAt)}</td>
                  <td style={styles.cell}>
                    <div style={styles.actionsCell}>
                      <button type="button" onClick={() => setSelectedConfigId(config.id)}>
                        Chi tiết
                      </button>
                      <button type="button" onClick={() => openEditModal(config)}>
                        Sửa
                      </button>
                      <button type="button" onClick={() => void onToggleActive(config)}>
                        {envelope.isActive ? 'Tắt' : 'Bật'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}

      {selectedConfig ? (
        <section style={styles.detailCard}>
          {(() => {
            const envelope = parseConfigEnvelope(selectedConfig);

            return (
              <>
                <h3 style={styles.detailTitle}>Chi tiết config: {selectedConfig.key}</h3>
                <p>
                  <strong>Tên:</strong> {envelope.name}
                </p>
                <p>
                  <strong>Nhóm:</strong> {selectedConfig.scope ?? 'Không có'}
                </p>
                <p>
                  <strong>Kiểu:</strong> {envelope.valueType}
                </p>
                <p>
                  <strong>Giá trị:</strong> {stringifyValue(envelope.value)}
                </p>
                <p>
                  <strong>Giá trị mặc định:</strong>{' '}
                  {stringifyValue(envelope.defaultValue) || 'Không có'}
                </p>
                <p>
                  <strong>Cho phép sửa:</strong> {envelope.isEditable ? 'CÓ' : 'KHÔNG'}
                </p>
                <p>
                  <strong>Trạng thái:</strong> {envelope.isActive ? 'ACTIVE' : 'INACTIVE'}
                </p>
                <p>
                  <strong>Cập nhật:</strong> {formatDateTime(selectedConfig.updatedAt)}
                </p>
              </>
            );
          })()}
        </section>
      ) : null}

      <MasterdataEditorModal
        open={editorOpen}
        title={editingConfig ? `Sửa config ${editingConfig.key}` : 'Tạo config'}
        submitLabel={editingConfig ? 'Lưu thay đổi' : 'Tạo config'}
        isSubmitting={isSaving}
        onClose={() => setEditorOpen(false)}
        onSubmit={onSubmitForm}
      >
        <div style={styles.formGrid}>
          <label style={styles.fieldLabel}>
            Key
            <input
              value={form.key}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  key: event.target.value,
                }))
              }
              placeholder="system.default_pickup_sla_hours"
              disabled={Boolean(editingConfig)}
              required
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Tên
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
            <input
              value={form.group}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  group: event.target.value,
                }))
              }
              placeholder="SYSTEM | PICKUP | DELIVERY"
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Kiểu giá trị
            <select
              value={form.valueType}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  valueType: event.target.value as ConfigValueType,
                }))
              }
              style={styles.input}
            >
              <option value="STRING">STRING</option>
              <option value="NUMBER">NUMBER</option>
              <option value="BOOLEAN">BOOLEAN</option>
              <option value="JSON">JSON</option>
            </select>
          </label>
          <label style={{ ...styles.fieldLabel, gridColumn: '1 / -1' }}>
            Giá trị
            <textarea
              value={form.valueInput}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  valueInput: event.target.value,
                }))
              }
              rows={4}
              style={styles.textarea}
            />
          </label>
          <label style={{ ...styles.fieldLabel, gridColumn: '1 / -1' }}>
            Giá trị mặc định
            <textarea
              value={form.defaultValueInput}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  defaultValueInput: event.target.value,
                }))
              }
              rows={3}
              style={styles.textarea}
            />
          </label>
          <label style={{ ...styles.fieldLabel, gridColumn: '1 / -1' }}>
            Mô tả
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
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.isEditable}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  isEditable: event.target.checked,
                }))
              }
            />
            EDITABLE
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
    minWidth: 160,
  },
  textarea: {
    border: '1px solid #d9def3',
    borderRadius: 10,
    padding: '8px 10px',
    width: '100%',
    resize: 'vertical',
    fontFamily: 'monospace',
    fontSize: 13,
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

import React, { useMemo, useState } from 'react';

import {
  useAdminUsersQuery,
  useCreateAdminUserMutation,
  useDeleteAdminUserMutation,
  useUpdateAdminUserMutation,
} from '../../features/auth/auth.api';
import type {
  AdminUserDto,
  AdminUserUpdateInput,
  UserRoleGroup,
  UserStatus,
} from '../../features/auth/auth.types';
import { useHubsQuery } from '../../features/masterdata/masterdata.api';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';

interface UserManagementPageProps {
  roleGroup: UserRoleGroup;
}

interface UserFormState {
  username: string;
  password: string;
  displayName: string;
  phone: string;
  status: UserStatus;
  role: string;
  hubCode: string;
}

const DEFAULT_FORM: UserFormState = {
  username: '',
  password: '',
  displayName: '',
  phone: '',
  status: 'ACTIVE',
  role: '',
  hubCode: '',
};

function roleOptionsByGroup(roleGroup: UserRoleGroup): string[] {
  if (roleGroup === 'SHIPPER') {
    return ['COURIER'];
  }

  return ['OPS_ADMIN', 'OPS_VIEWER'];
}

function pageTitleByGroup(roleGroup: UserRoleGroup): string {
  return roleGroup === 'SHIPPER'
    ? 'Quan tri - Quan ly tai khoan Shipper'
    : 'Quan tri - Quan ly tai khoan Ops';
}

export function UserManagementPage({ roleGroup }: UserManagementPageProps): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [hubCode, setHubCode] = useState('');

  const [editingUser, setEditingUser] = useState<AdminUserDto | null>(null);
  const [form, setForm] = useState<UserFormState>({
    ...DEFAULT_FORM,
    role: roleOptionsByGroup(roleGroup)[0],
  });

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const usersQuery = useAdminUsersQuery(accessToken, {
    roleGroup,
    status,
    hubCode,
    q,
  });
  const hubsQuery = useHubsQuery(accessToken, {});

  const createMutation = useCreateAdminUserMutation(accessToken);
  const updateMutation = useUpdateAdminUserMutation(accessToken);
  const deleteMutation = useDeleteAdminUserMutation(accessToken);

  const roleOptions = useMemo(() => roleOptionsByGroup(roleGroup), [roleGroup]);

  const resetForm = () => {
    setEditingUser(null);
    setForm({
      ...DEFAULT_FORM,
      role: roleOptions[0] ?? '',
    });
  };

  const onEditUser = (user: AdminUserDto) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      password: '',
      displayName: user.displayName ?? '',
      phone: user.phone ?? '',
      status: user.status,
      role: user.roles[0] ?? roleOptions[0] ?? '',
      hubCode: user.hubCodes[0] ?? '',
    });
    setActionMessage(null);
    setActionError(null);
  };

  const onSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActionMessage(null);
    setActionError(null);

    const payloadBase = {
      username: form.username.trim(),
      roles: [form.role],
      status: form.status,
      displayName: form.displayName.trim() || null,
      phone: form.phone.trim() || null,
      hubCodes: form.hubCode.trim() ? [form.hubCode.trim().toUpperCase()] : [],
    };

    try {
      if (editingUser) {
        const payload: AdminUserUpdateInput = {
          ...payloadBase,
        };

        if (form.password.trim()) {
          payload.password = form.password.trim();
        }

        await updateMutation.mutateAsync({
          userId: editingUser.id,
          payload,
        });

        setActionMessage(`Da cap nhat tai khoan ${payloadBase.username}.`);
      } else {
        const password = form.password.trim();

        if (!password) {
          throw new Error('Can mat khau khi tao nguoi dung.');
        }

        await createMutation.mutateAsync({
          ...payloadBase,
          password,
        });

        setActionMessage(`Da tao tai khoan ${payloadBase.username}.`);
      }

      resetForm();
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const onDeleteUser = async (user: AdminUserDto) => {
    if (!window.confirm(`Xoa tai khoan ${user.username}?`)) {
      return;
    }

    setActionMessage(null);
    setActionError(null);

    try {
      await deleteMutation.mutateAsync(user.id);
      setActionMessage(`Da xoa tai khoan ${user.username}.`);

      if (editingUser?.id === user.id) {
        resetForm();
      }
    } catch (error) {
      setActionError(getErrorMessage(error));
    }
  };

  const onCancelEdit = () => {
    resetForm();
  };

  const isSaving =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div>
      <h2>{pageTitleByGroup(roleGroup)}</h2>
      <p style={styles.helperText}>
        Tao, cap nhat, xoa tai khoan va gan hub lam viec cho tung tai khoan.
      </p>

      <form style={styles.filterForm} onSubmit={(event) => event.preventDefault()}>
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Tim ten dang nhap / ten / so dien thoai"
          style={styles.input}
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as UserStatus | '')}
          style={styles.input}
        >
          <option value="">Tất cả trang thai</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DISABLED">DISABLED</option>
        </select>
        <select
          value={hubCode}
          onChange={(event) => setHubCode(event.target.value)}
          style={styles.input}
        >
          <option value="">Tất cả hub</option>
          {(hubsQuery.data ?? []).map((hub) => (
            <option key={hub.id} value={hub.code}>
              {hub.code} - {hub.name}
            </option>
          ))}
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
          {editingUser ? `Sua ${editingUser.username}` : 'Tao tai khoan moi'}
        </h3>
        <form onSubmit={onSubmitForm} style={styles.formGrid}>
          <label style={styles.fieldLabel}>
            Ten dang nhap
            <input
              required
              value={form.username}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, username: event.target.value }))
              }
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Mật khẩu {editingUser ? '(khong bat buoc)' : ''}
            <input
              type="password"
              required={!editingUser}
              value={form.password}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, password: event.target.value }))
              }
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Ten hien thi
            <input
              value={form.displayName}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, displayName: event.target.value }))
              }
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            So dien thoai
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, phone: event.target.value }))
              }
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Vai tro
            <select
              value={form.role}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, role: event.target.value }))
              }
              style={styles.input}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <label style={styles.fieldLabel}>
            Hub duoc gan
            <select
              value={form.hubCode}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, hubCode: event.target.value }))
              }
              style={styles.input}
            >
              <option value="">Chua gan</option>
              {(hubsQuery.data ?? []).map((hub) => (
                <option key={hub.id} value={hub.code}>
                  {hub.code} - {hub.name}
                </option>
              ))}
            </select>
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
            <button type="submit" disabled={isSaving}>
              {editingUser ? 'Luu tai khoan' : 'Tao tai khoan'}
            </button>
            {editingUser ? (
              <button type="button" onClick={onCancelEdit}>
                Huy sua
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {usersQuery.isLoading ? <p>Đang tải nguoi dung...</p> : null}
      {usersQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(usersQuery.error)}</p>
      ) : null}
      {usersQuery.isSuccess && (usersQuery.data?.length ?? 0) === 0 ? (
        <p>Không tìm thấy nguoi dung.</p>
      ) : null}

      {usersQuery.isSuccess && (usersQuery.data?.length ?? 0) > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.headerCell}>Ten dang nhap</th>
              <th style={styles.headerCell}>Ten hien thi</th>
              <th style={styles.headerCell}>So dien thoai</th>
              <th style={styles.headerCell}>Vai tro</th>
              <th style={styles.headerCell}>Gan hub</th>
              <th style={styles.headerCell}>Trang thai</th>
              <th style={styles.headerCell}>Cap nhat</th>
              <th style={styles.headerCell}>Hanh dong</th>
            </tr>
          </thead>
          <tbody>
            {(usersQuery.data ?? []).map((user) => (
              <tr key={user.id}>
                <td style={styles.cell}>{user.username}</td>
                <td style={styles.cell}>{user.displayName ?? 'Không có'}</td>
                <td style={styles.cell}>{user.phone ?? 'Không có'}</td>
                <td style={styles.cell}>{user.roles.join(', ')}</td>
                <td style={styles.cell}>{user.hubCodes.join(', ') || 'Chua gan'}</td>
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
            ))}
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


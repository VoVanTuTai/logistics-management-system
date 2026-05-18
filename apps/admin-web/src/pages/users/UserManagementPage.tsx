import React, { useMemo, useState } from 'react';

import {
  useAdminUsersQuery,
  useCreateAdminUserMutation,
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
  if (roleGroup === 'MERCHANT') {
    return ['MERCHANT'];
  }

  if (roleGroup === 'SHIPPER') {
    return ['COURIER'];
  }

  return ['OPS_ADMIN', 'OPS_VIEWER'];
}

function pageTitleByGroup(roleGroup: UserRoleGroup): string {
  if (roleGroup === 'MERCHANT') {
    return 'Quản trị - Quản lý tài khoản Merchant';
  }

  return roleGroup === 'SHIPPER'
    ? 'Quản trị - Quản lý tài khoản Shipper'
    : 'Quản lý tài khoản Ops';
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

        setActionMessage(`Đã cập nhật tài khoản ${payloadBase.username}.`);
      } else {
        const password = form.password.trim();

        const payload = password
          ? {
            ...payloadBase,
            password,
          }
          : payloadBase;

        await createMutation.mutateAsync(payload);

        setActionMessage(`Đã tạo tài khoản ${payloadBase.username}.`);
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
        ? `Vô hiệu hóa tài khoản ${user.username}? Dữ liệu tài khoản, phân quyền và lịch sử vận hành không bị xóa; tài khoản chỉ bị ngừng sử dụng trong nghiệp vụ logistics.`
        : `Kích hoạt lại tài khoản ${user.username}? Dữ liệu cũ được giữ nguyên và tài khoản sẽ được phép sử dụng lại trong vận hành logistics.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setActionMessage(null);
    setActionError(null);

    try {
      await updateMutation.mutateAsync({
        userId: user.id,
        payload: {
          status: nextStatus,
        },
      });
      setActionMessage(`Đã ${actionLabel} tài khoản ${user.username}. Dữ liệu không bị xóa.`);

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

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <h2>{pageTitleByGroup(roleGroup)}</h2>
      <p style={styles.helperText}>
        Tạo, cập nhật và gán HUB làm việc cho từng tài khoản.
      </p>

      <form style={styles.filterForm} onSubmit={(event) => event.preventDefault()}>
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Tìm tên đăng nhập / tên / số điện thoại"
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
          {editingUser ? `Sửa ${editingUser.username}` : 'Tạo tài khoản mới'}
        </h3>
        {!editingUser && roleGroup !== 'MERCHANT' ? (
          <p style={styles.helperText}>
            Nếu để trống trường mật khẩu, hệ thống sẽ tạo mặc định là "password" cho tài khoản nhân viên.
          </p>
        ) : null}
        <form onSubmit={onSubmitForm} style={styles.formGrid}>
          <label style={styles.fieldLabel}>
            Tên đăng nhập
            <input
              required
              pattern="\d{8}"
              title="Mã đăng nhập gồm 8 chữ số."
              disabled={Boolean(editingUser)}
              value={form.username}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, username: event.target.value }))
              }
              style={styles.input}
              placeholder="20000001"
            />
          </label>
          <label style={styles.fieldLabel}>
            Mật khẩu {editingUser ? '(không bắt buộc)' : ''}
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, password: event.target.value }))
              }
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Tên hiển thị
            <input
              value={form.displayName}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, displayName: event.target.value }))
              }
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Số điện thoại
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, phone: event.target.value }))
              }
              style={styles.input}
            />
          </label>
          <label style={styles.fieldLabel}>
            Vai trò
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
            Hub được gán
            <select
              value={form.hubCode}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, hubCode: event.target.value }))
              }
              style={styles.input}
            >
              <option value="">Chưa gán</option>
              {(hubsQuery.data ?? []).map((hub) => (
                <option key={hub.id} value={hub.code}>
                  {hub.code} - {hub.name}
                </option>
              ))}
            </select>
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
            <button type="submit" disabled={isSaving}>
              {editingUser ? 'Lưu tài khoản' : 'Tạo tài khoản'}
            </button>
            {editingUser ? (
              <button type="button" onClick={onCancelEdit}>
                Hủy sửa
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {usersQuery.isLoading ? <p>Đang tải người dùng...</p> : null}
      {usersQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(usersQuery.error)}</p>
      ) : null}
      {usersQuery.isSuccess && (usersQuery.data?.length ?? 0) === 0 ? (
        <p>Không tìm thấy người dùng.</p>
      ) : null}

      {usersQuery.isSuccess && (usersQuery.data?.length ?? 0) > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.headerCell}>
                {roleGroup === 'SHIPPER' ? 'ID Courier' : 'ID User'}
              </th>
              <th style={styles.headerCell}>Tên đăng nhập</th>
              <th style={styles.headerCell}>Tên hiển thị</th>
              <th style={styles.headerCell}>Số điện thoại</th>
              <th style={styles.headerCell}>Vai trò</th>
              <th style={styles.headerCell}>Gán hub</th>
              <th style={styles.headerCell}>Trạng thái</th>
              <th style={styles.headerCell}>Cập nhật</th>
              <th style={styles.headerCell}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {(usersQuery.data ?? []).map((user) => (
              <tr key={user.id}>
                <td style={styles.cell}>{user.id}</td>
                <td style={styles.cell}>{user.username}</td>
                <td style={styles.cell}>{user.displayName ?? 'Không có'}</td>
                <td style={styles.cell}>{user.phone ?? 'Không có'}</td>
                <td style={styles.cell}>{user.roles.join(', ')}</td>
                <td style={styles.cell}>{user.hubCodes.join(', ') || 'Chưa gán'}</td>
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
            ))}
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

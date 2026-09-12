import React, { useMemo, useState } from 'react';

import {
  useArchivePolicyMutation,
  useCreatePolicyMutation,
  useDeletePolicyMutation,
  usePoliciesQuery,
  usePublishPolicyMutation,
  useRestorePolicyMutation,
  useUpdatePolicyMutation,
} from '../../features/policies/policies.hooks';
import type {
  PolicyDto,
  PolicyFilters,
  PolicyWriteInput,
} from '../../features/policies/policies.types';
import { getErrorMessage } from '../../services/api/errors';
import { PolicyConfirmDialog, type PolicyActionType } from './PolicyConfirmDialog';
import { PolicyDetailModal } from './PolicyDetailModal';
import { PolicyFilter } from './PolicyFilter';
import { PolicyFormModal } from './PolicyFormModal';
import { PolicyTable } from './PolicyTable';

export function PolicyManagementPage(): React.JSX.Element {
  const [filters, setFilters] = useState<PolicyFilters>({
    category: '',
    status: '',
    q: '',
    page: 1,
    limit: 50,
  });

  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<PolicyActionType | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data, isLoading, error, refetch } = usePoliciesQuery(filters);

  const createMutation = useCreatePolicyMutation();
  const updateMutation = useUpdatePolicyMutation();
  const publishMutation = usePublishPolicyMutation();
  const archiveMutation = useArchivePolicyMutation();
  const restoreMutation = useRestorePolicyMutation();
  const deleteMutation = useDeletePolicyMutation();

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    publishMutation.isPending ||
    archiveMutation.isPending ||
    restoreMutation.isPending ||
    deleteMutation.isPending;

  const policies = useMemo(() => data?.items || [], [data?.items]);

  // Statistics Summary
  const stats = useMemo(() => {
    const total = data?.total || policies.length;
    let published = 0;
    let draft = 0;
    let archived = 0;

    for (const p of policies) {
      if (p.status === 'PUBLISHED') published++;
      else if (p.status === 'DRAFT') draft++;
      else if (p.status === 'ARCHIVED') archived++;
    }

    return { total, published, draft, archived };
  }, [data?.total, policies]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage((current) => (current?.text === text ? null : current));
    }, 4000);
  };

  const handleOpenCreate = () => {
    setSelectedPolicy(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (policy: PolicyDto) => {
    setSelectedPolicy(policy);
    setIsFormOpen(true);
  };

  const handleOpenView = (policy: PolicyDto) => {
    setSelectedPolicy(policy);
    setIsDetailOpen(true);
  };

  const handleOpenConfirm = (policy: PolicyDto, action: PolicyActionType) => {
    setSelectedPolicy(policy);
    setConfirmAction(action);
    setIsConfirmOpen(true);
  };

  const handleFormSubmit = async (payload: PolicyWriteInput) => {
    try {
      if (selectedPolicy) {
        await updateMutation.mutateAsync({ id: selectedPolicy.id, payload });
        showToast('success', `Đã cập nhật điều khoản "${payload.title}" thành công!`);
      } else {
        await createMutation.mutateAsync(payload);
        showToast('success', `Đã tạo mới điều khoản "${payload.title}" thành công!`);
      }
      setIsFormOpen(false);
      refetch();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedPolicy || !confirmAction) return;

    try {
      switch (confirmAction) {
        case 'publish':
          await publishMutation.mutateAsync(selectedPolicy.id);
          showToast('success', `Đã công bố điều khoản "${selectedPolicy.title}" thành công!`);
          break;
        case 'archive':
          await archiveMutation.mutateAsync(selectedPolicy.id);
          showToast('success', `Đã chuyển điều khoản "${selectedPolicy.title}" sang lưu trữ!`);
          break;
        case 'restore':
          await restoreMutation.mutateAsync(selectedPolicy.id);
          showToast('success', `Đã khôi phục điều khoản "${selectedPolicy.title}" về bản nháp!`);
          break;
        case 'delete':
          await deleteMutation.mutateAsync(selectedPolicy.id);
          showToast('success', `Đã xóa điều khoản "${selectedPolicy.title}" thành công!`);
          break;
      }
      setIsConfirmOpen(false);
      refetch();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  return (
    <div className="admin-page-container" style={{ padding: '24px 32px', maxWidth: 1440, margin: '0 auto' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13, marginBottom: 4 }}>
            <span>Admin Portal</span>
            <span>/</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>Điều khoản & Chính sách</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Quản lý Điều khoản dịch vụ & Chính sách
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#64748b' }}>
            Quản lý tập trung toàn bộ quy chế bưu chính, biểu phí bồi thường, hàng cấm và quy trình xử lý đơn hàng của Nexus Express System.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              add_circle
            </span>
            <span>Tạo điều khoản mới</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`message ${toastMessage.type}`}
          style={{
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            borderRadius: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined">
              {toastMessage.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="card" style={{ padding: 18, borderLeft: '4px solid #0284c7' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            TỔNG SỐ ĐIỀU KHOẢN
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
            {stats.total}
          </div>
          <span style={{ fontSize: 12, color: '#64748b' }}>Văn bản chính sách trong hệ thống</span>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            ĐÃ CÔNG BỐ (PUBLISHED)
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981', marginTop: 4 }}>
            {stats.published}
          </div>
          <span style={{ fontSize: 12, color: '#64748b' }}>Đang hiển thị cho khách hàng</span>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            BẢN NHÁP (DRAFT)
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
            {stats.draft}
          </div>
          <span style={{ fontSize: 12, color: '#64748b' }}>Đang soạn thảo / Chờ duyệt</span>
        </div>

        <div className="card" style={{ padding: 18, borderLeft: '4px solid #6b7280' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            ĐÃ LƯU TRỮ (ARCHIVED)
          </span>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#6b7280', marginTop: 4 }}>
            {stats.archived}
          </div>
          <span style={{ fontSize: 12, color: '#64748b' }}>Đã hết hiệu lực thi hành</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: 24 }}>
        {/* Filter Bar */}
        <PolicyFilter
          filters={filters}
          onChange={setFilters}
          onReset={() =>
            setFilters({
              category: '',
              status: '',
              q: '',
              page: 1,
              limit: 50,
            })
          }
        />

        {error && (
          <div className="message error" style={{ marginBottom: 16 }}>
            {getErrorMessage(error)}
          </div>
        )}

        {/* Data Table */}
        <PolicyTable
          policies={policies}
          isLoading={isLoading}
          onView={handleOpenView}
          onEdit={handleOpenEdit}
          onActionClick={handleOpenConfirm}
        />
      </div>

      {/* Modals */}
      <PolicyFormModal
        policy={selectedPolicy}
        isOpen={isFormOpen}
        isSubmitting={isMutating}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <PolicyDetailModal
        policy={selectedPolicy}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(p) => {
          setSelectedPolicy(p);
          setIsFormOpen(true);
        }}
      />

      <PolicyConfirmDialog
        policy={selectedPolicy}
        actionType={confirmAction}
        isOpen={isConfirmOpen}
        isSubmitting={isMutating}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

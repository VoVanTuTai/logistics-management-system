import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  useCourierAreaAssignmentsQuery,
  useCreateCourierAreaAssignmentMutation,
  useUpdateCourierAreaAssignmentMutation,
  useDeleteCourierAreaAssignmentMutation,
  useVietnamAdministrativeUnitsQuery,
} from '../../features/masterdata/masterdata.hooks';
import { useCourierOptionsQuery } from '../../features/tasks/tasks.api';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../services/api/errors';
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, MapPin, User, CheckCircle, AlertTriangle } from 'lucide-react';

export function CourierAreaAssignmentPage(): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const userHubCodes = session?.user.hubCodes ?? [];
  const isSystemAdmin = session?.user.roles.includes('SYSTEM_ADMIN') ?? false;

  // Filters state
  const defaultHubFilter = searchParams.get('hubCode') ?? (userHubCodes[0] ?? '');
  const defaultCourierFilter = searchParams.get('courierId') ?? '';
  
  const [hubFilter, setHubFilter] = useState(defaultHubFilter);
  const [courierFilter, setCourierFilter] = useState(defaultCourierFilter);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formCourierId, setFormCourierId] = useState('');
  const [formHubCode, setFormHubCode] = useState(userHubCodes[0] ?? '');
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
  const [formProvinceName, setFormProvinceName] = useState('');
  const [formDistrictName, setFormDistrictName] = useState('');
  const [formWardName, setFormWardName] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  // Status messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // API Queries
  const assignmentsQuery = useCourierAreaAssignmentsQuery(accessToken, {
    hubCode: hubFilter || undefined,
    courierId: courierFilter || undefined,
  });

  const couriersQuery = useCourierOptionsQuery(accessToken);
  const adminUnitsQuery = useVietnamAdministrativeUnitsQuery(accessToken);

  // Mutations
  const createMutation = useCreateCourierAreaAssignmentMutation(accessToken);
  const updateMutation = useUpdateCourierAreaAssignmentMutation(accessToken);
  const deleteMutation = useDeleteCourierAreaAssignmentMutation(accessToken);

  // Clear messages automatically
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Set default values when data loads
  useEffect(() => {
    if (couriersQuery.data && couriersQuery.data.length > 0 && !formCourierId) {
      setFormCourierId(couriersQuery.data[0].courierId);
    }
  }, [couriersQuery.data, formCourierId]);

  // Sync URL search params
  const onApplyFilters = () => {
    const next = new URLSearchParams();
    if (hubFilter) {
      next.set('hubCode', hubFilter);
    }
    if (courierFilter) {
      next.set('courierId', courierFilter);
    }
    setSearchParams(next, { replace: true });
  };

  const onResetFilters = () => {
    setHubFilter(userHubCodes[0] ?? '');
    setCourierFilter('');
    setSearchTerm('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Find districts (wards in response) based on selected province
  const availableDistricts = useMemo(() => {
    if (!adminUnitsQuery.data || selectedProvinceCode === null) {
      return [];
    }
    const province = adminUnitsQuery.data.find(p => p.code === selectedProvinceCode);
    return province ? province.wards : [];
  }, [adminUnitsQuery.data, selectedProvinceCode]);

  // Handle province dropdown change
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value);
    if (!code) {
      setSelectedProvinceCode(null);
      setFormProvinceName('');
      setFormDistrictName('');
      return;
    }
    setSelectedProvinceCode(code);
    const province = adminUnitsQuery.data?.find(p => p.code === code);
    setFormProvinceName(province ? province.name : '');
    setFormDistrictName(''); // reset district
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      return;
    }

    const courierId = formCourierId.trim();
    const hubCode = formHubCode.trim();
    const province = formProvinceName.trim();
    const district = formDistrictName.trim();
    const ward = formWardName.trim();

    if (!courierId || !hubCode || !province || !district || !ward) {
      setErrorMsg('Vui lòng điền đầy đủ các thông tin phân vùng.');
      return;
    }

    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await createMutation.mutateAsync({
        courierId,
        hubCode,
        province,
        district,
        ward,
        isActive: formIsActive,
      });

      setSuccessMsg('Đã tạo phân vùng cho shipper thành công!');
      // Reset form
      setFormWardName('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi tạo cấu hình phân vùng shipper.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    if (!accessToken) {
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id,
        payload: { isActive: !currentStatus },
      });
      setSuccessMsg('Đã cập nhật trạng thái hoạt động tuyến thành công!');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái hoạt động.');
    }
  };

  // Delete Assignment
  const handleDelete = async (id: string) => {
    if (!accessToken || !window.confirm('Bạn có chắc chắn muốn xóa phân vùng tuyến của shipper này?')) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      setSuccessMsg('Đã xóa cấu hình phân vùng tuyến thành công.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi khi xóa phân vùng tuyến.');
    }
  };

  // Filtering list based on search term
  const filteredAssignments = useMemo(() => {
    const list = assignmentsQuery.data ?? [];
    if (!searchTerm.trim()) {
      return list;
    }
    const q = searchTerm.toLowerCase().trim();
    return list.filter(item => 
      item.courierId.toLowerCase().includes(q) ||
      item.province.toLowerCase().includes(q) ||
      item.district.toLowerCase().includes(q) ||
      item.ward.toLowerCase().includes(q)
    );
  }, [assignmentsQuery.data, searchTerm]);

  return (
    <div style={styles.container}>
      <h2>Quản lý phân vùng tuyến Shipper</h2>
      <p style={styles.helperText}>
        Cấu hình định tuyến địa lý cho từng shipper. Khi kiện hàng được quét nhập kho tại bưu cục phát đích, hệ thống sẽ dựa trên bảng cấu hình này để tự động tạo việc và gán shipper đi phát đúng tuyến.
      </p>

      {/* Alerts */}
      {successMsg && (
        <div style={{ ...styles.alert, ...styles.alertSuccess }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div style={{ ...styles.alert, ...styles.alertError }}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div style={styles.layout}>
        {/* LEFT COLUMN: FILTER & LIST TABLE */}
        <div style={styles.listSection}>
          <div style={styles.filterCard}>
            <h4 style={styles.cardTitle}>Bộ lọc phân tuyến</h4>
            <div style={styles.filterGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Bưu cục (Hub)</label>
                <select
                  value={hubFilter}
                  onChange={(e) => setHubFilter(e.target.value)}
                  style={styles.select}
                >
                  <option value="">-- Tất cả Bưu Cục --</option>
                  {isSystemAdmin ? (
                    // System admin can see all hubs in filters
                    ['HCM-001', 'HN-001', 'DN-001', 'HP-001', 'CT-001'].map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))
                  ) : (
                    userHubCodes.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))
                  )}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Shipper</label>
                <select
                  value={courierFilter}
                  onChange={(e) => setCourierFilter(e.target.value)}
                  style={styles.select}
                >
                  <option value="">-- Tất cả Shipper --</option>
                  {couriersQuery.data?.map(c => (
                    <option key={c.courierId} value={c.courierId}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Tìm kiếm nhanh</label>
                <input
                  type="text"
                  placeholder="Nhập tỉnh, quận, phường hoặc ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.filterActions}>
              <button
                type="button"
                onClick={onApplyFilters}
                style={styles.primaryButton}
              >
                Lọc tuyến
              </button>
              <button
                type="button"
                onClick={onResetFilters}
                style={styles.secondaryButton}
              >
                Đặt lại
              </button>
            </div>
          </div>

          {/* Assignments Table */}
          <div style={styles.tableCard}>
            <div style={styles.tableHeader}>
              <h4 style={styles.cardTitle}>Danh sách Phân vùng Shipper ({filteredAssignments.length})</h4>
              {assignmentsQuery.isFetching && <Loader2 className="animate-spin" size={18} style={{ color: '#2d3f99' }} />}
            </div>

            {assignmentsQuery.isLoading ? (
              <div style={styles.loadingState}>
                <Loader2 className="animate-spin" size={32} />
                <p>Đang tải dữ liệu phân tuyến...</p>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div style={styles.emptyState}>
                <MapPin size={48} style={{ color: '#94a3b8', marginBottom: 12 }} />
                <p style={styles.emptyText}>Chưa có cấu hình phân tuyến nào khớp với bộ lọc.</p>
                <p style={styles.emptySubtext}>Hãy cấu hình thêm phân tuyến cho shipper ở form bên phải.</p>
              </div>
            ) : (
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Bưu cục</th>
                      <th>Shipper</th>
                      <th>Khu vực giao nhận</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssignments.map((assignment) => {
                      const courier = couriersQuery.data?.find(c => c.courierId === assignment.courierId);
                      return (
                        <tr key={assignment.id} style={styles.tableRow}>
                          <td>
                            <span style={styles.hubBadge}>{assignment.hubCode}</span>
                          </td>
                          <td>
                            <div style={styles.courierCell}>
                              <User size={14} style={{ color: '#64748b' }} />
                              <strong>{assignment.courierId}</strong>
                              {courier && <span style={styles.courierName}>({courier.label})</span>}
                            </div>
                          </td>
                          <td>
                            <div style={styles.areaCell}>
                              <span style={styles.areaBadge}>{assignment.ward}</span>
                              <span style={styles.areaDivider}>→</span>
                              <span style={styles.areaSub}>{assignment.district}, {assignment.province}</span>
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(assignment.id, assignment.isActive)}
                              style={styles.toggleButton}
                              title="Bấm để bật/tắt tuyến"
                            >
                              {assignment.isActive ? (
                                <ToggleRight size={28} style={{ color: '#16a34a' }} />
                              ) : (
                                <ToggleLeft size={28} style={{ color: '#94a3b8' }} />
                              )}
                            </button>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleDelete(assignment.id)}
                              style={styles.deleteButton}
                              title="Xóa phân tuyến"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CREATE ASSIGNMENT FORM */}
        <div style={styles.formSection}>
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <Plus size={20} style={{ color: '#2d3f99' }} />
              <h4 style={styles.cardTitle}>Tạo phân tuyến mới</h4>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Bưu cục (Hub)</label>
                <select
                  value={formHubCode}
                  onChange={(e) => setFormHubCode(e.target.value)}
                  style={styles.select}
                  required
                >
                  {isSystemAdmin ? (
                    ['HCM-001', 'HN-001', 'DN-001', 'HP-001', 'CT-001'].map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))
                  ) : (
                    userHubCodes.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))
                  )}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Chọn Shipper</label>
                <select
                  value={formCourierId}
                  onChange={(e) => setFormCourierId(e.target.value)}
                  style={styles.select}
                  required
                >
                  <option value="" disabled>-- Chọn Shipper --</option>
                  {couriersQuery.data?.map(c => (
                    <option key={c.courierId} value={c.courierId}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <hr style={styles.divider} />

              <div style={styles.formGroup}>
                <label style={styles.label}>Tỉnh/Thành phố</label>
                <select
                  onChange={handleProvinceChange}
                  style={styles.select}
                  value={selectedProvinceCode ?? ''}
                  required
                >
                  <option value="">-- Chọn Tỉnh / Thành phố --</option>
                  {adminUnitsQuery.data?.map(p => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Quận/Huyện</label>
                <select
                  value={formDistrictName}
                  onChange={(e) => setFormDistrictName(e.target.value)}
                  style={styles.select}
                  disabled={!selectedProvinceCode}
                  required
                >
                  <option value="">-- Chọn Quận / Huyện --</option>
                  {availableDistricts.map(d => (
                    <option key={d.code} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Tên Phường/Xã (Nhập text)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phường Bến Nghé, Xã Tân Thạnh..."
                  value={formWardName}
                  onChange={(e) => setFormWardName(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  style={styles.checkbox}
                />
                <label htmlFor="formIsActive" style={styles.checkboxLabel}>Kích hoạt tuyến ngay</label>
              </div>

              <button
                type="submit"
                style={styles.submitButton}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Đang tạo tuyến...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Lưu phân tuyến</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  helperText: {
    color: '#3b4b9b',
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 16,
  },
  layout: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
  },
  listSection: {
    flex: '2 1 600px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  formSection: {
    flex: '1 1 320px',
  },
  filterCard: {
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardTitle: {
    margin: 0,
    color: '#1f2b6f',
    fontSize: 15,
    fontWeight: 700,
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginTop: 12,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
  },
  select: {
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 13,
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  input: {
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 13,
    outline: 'none',
  },
  filterActions: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
    justifyContent: 'flex-end',
  },
  primaryButton: {
    backgroundColor: '#2d3f99',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  tableCard: {
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableResponsive: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
  },
  hubBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontWeight: 700,
    fontSize: 11,
    border: '1px solid #bfdbfe',
  },
  courierCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  courierName: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 500,
  },
  areaCell: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  areaBadge: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '3px 8px',
    borderRadius: 6,
    fontWeight: 600,
    color: '#334155',
  },
  areaDivider: {
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  areaSub: {
    color: '#64748b',
    fontSize: 12,
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 6,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s',
  },
  formCard: {
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  formHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  divider: {
    margin: '8px 0',
    border: 0,
    borderTop: '1px solid #e2e8f0',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  checkbox: {
    width: 16,
    height: 16,
    cursor: 'pointer',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#334155',
    cursor: 'pointer',
  },
  submitButton: {
    backgroundColor: '#2d3f99',
    color: '#ffffff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  alert: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 16,
    border: '1px solid',
  },
  alertSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    color: '#166534',
  },
  alertError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    color: '#991b1b',
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    padding: '30px 0',
    color: '#64748b',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    color: '#64748b',
  },
  emptyText: {
    margin: 0,
    fontWeight: 600,
    fontSize: 14,
    color: '#475569',
  },
  emptySubtext: {
    margin: '4px 0 0 0',
    fontSize: 12,
    color: '#94a3b8',
  },
};

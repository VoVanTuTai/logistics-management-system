import React from 'react';
import { useDownloadCenterStore } from '../../store/downloadCenterStore';
import { formatDateTime } from '../../utils/format';

export function DownloadCenterPage(): React.JSX.Element {
  const tasks = useDownloadCenterStore((state) => state.tasks);
  const removeTask = useDownloadCenterStore((state) => state.removeTask);
  const clearCompleted = useDownloadCenterStore((state) => state.clearCompleted);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
    return `${Math.round(bytes / 1_000)} KB`;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              marginBottom: '8px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#60a5fa' }}>
              download
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#93c5fd' }}>
              EXPORT TASK MONITOR
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0' }}>
            TRUNG TÂM TẢI VỀ TẬP TRUNG (DOWNLOAD CENTER)
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Quản lý và tải lại tất cả file xuất dữ liệu Excel/CSV vận đơn toàn hệ thống. File xuất chứa đầy đủ 25+ trường thông tin chi tiết.
          </p>
        </div>

        <button
          type="button"
          onClick={clearCompleted}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            color: '#fca5a5',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Xóa lịch sử hoàn thành
        </button>
      </div>

      {/* Task List Table */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
            Danh sách Tiến trình Xuất File ({tasks.length})
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Tự động lưu phiên làm việc</span>
        </div>

        {tasks.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '8px' }}>
              folder_off
            </span>
            <p style={{ margin: 0, fontSize: '14px' }}>Chưa có tiến trình xuất file nào.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Tên Tiến Trình / File</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Phân Hệ</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Số Bản Ghi</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Dung Lượng</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Trạng Thái</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Thời Gian Xuất</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{task.taskName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{task.fileName}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: '#f1f5f9',
                          color: '#475569',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {task.moduleName}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#2563eb' }}>
                      {task.recordCount.toLocaleString('vi-VN')} bản ghi
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{formatFileSize(task.fileSizeBytes)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: '#dcfce7',
                          color: '#15803d',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                          check_circle
                        </span>
                        Hoàn thành
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px' }}>
                      {formatDateTime(task.createdAt)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {task.downloadUrl !== '#' && (
                          <a
                            href={task.downloadUrl}
                            download={task.fileName}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              textDecoration: 'none',
                              fontSize: '12px',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                              download
                            </span>
                            Tải Lại
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => removeTask(task.id)}
                          style={{
                            padding: '6px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#94a3b8',
                            cursor: 'pointer',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

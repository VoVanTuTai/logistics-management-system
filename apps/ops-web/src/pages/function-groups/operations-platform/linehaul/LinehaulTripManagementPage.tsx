import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import qrcode from 'qrcode-generator';
import { routePaths } from '../../../../navigation/routes';
import { opsApiClient } from '../../../../services/api/client';
import { opsEndpoints } from '../../../../services/api/endpoints';
import { useAuthStore } from '../../../../store/authStore';
import { useUiStore } from '../../../../store/uiStore';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Printer, 
  Undo2, 
  Settings2,
  FileText,
  MapPin,
  Trash2,
  Truck,
  PlayCircle,
  CheckCircle2
} from 'lucide-react';
import './LinehaulStyles.css';

/* ─── Toast ─── */
interface LinehaulToast {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
}
let lhToastId = 0;

interface TaskRecord {
  id: string;
  status: string;
  type: string;
  sealCode: string;
  taskName: string;
  routeRef: string;
  routeCode: string;
  roadType: string;
  departure: string;
  destinationHubCode?: string;
  vehiclePlate?: string;
  driverName?: string;
  driverPhone?: string;
}

/**
 * Helper to render a compact barcode visual for the printed vehicle seal.
 */
const generateBarcodeSvg = (code: string) => {
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pattern = (hash % 100).toString(2).padStart(8, '0').repeat(4);
  
  return (
    <svg width="100%" height="50" viewBox="0 0 100 50" preserveAspectRatio="none">
      <rect width="100" height="50" fill="white" />
      {pattern.split('').map((bit, i) => (
        bit === '1' ? <rect key={i} x={i * (100 / pattern.length)} y="0" width="1.5" height="50" fill="black" /> : null
      ))}
      <rect x="0" y="0" width="2" height="50" fill="black" />
      <rect x="3" y="0" width="1" height="50" fill="black" />
      <rect x="96" y="0" width="1" height="50" fill="black" />
      <rect x="98" y="0" width="2" height="50" fill="black" />
    </svg>
  );
};

const getQrDataUrl = (data: any) => {
  try {
    const qr = qrcode(0, 'M');
    const qrContent = typeof data === 'string' ? data : JSON.stringify(data);
    qr.addData(qrContent);
    qr.make();
    return qr.createDataURL(5);
  } catch(e) {
    return '';
  }
};

export function LinehaulTripManagementPage() {
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const showToast = useUiStore((state) => state.showToast);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast state
  const [toasts, setToasts] = useState<LinehaulToast[]>([]);
  const addToast = (type: LinehaulToast['type'], text: string) => {
    lhToastId += 1;
    const id = lhToastId;
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };

  // Confirm modal for Xe đi / Xe đến
  const [transitAction, setTransitAction] = useState<{ task: TaskRecord; action: 'depart' | 'arrive' } | null>(null);
  const [transitSealCode, setTransitSealCode] = useState('');
  const [transitVehiclePlate, setTransitVehiclePlate] = useState('');
  const [isTransitSubmitting, setIsTransitSubmitting] = useState(false);

  const fetchManifests = async () => {
    if (!accessToken) {
      setTasks([]);
      addToast('error', 'Bạn cần đăng nhập để tải danh sách chuyến xe.');
      return;
    }

    setIsLoading(true);
    try {
      const manifests = await opsApiClient.request<any[]>(opsEndpoints.manifests.list, {
        accessToken,
      });
      const mappedTasks: TaskRecord[] = manifests
        .filter((m: any) => m.manifestCode && m.manifestCode.startsWith('SRTR'))
        .map((m: any) => {
          let noteData: any = {};
        try {
          if (m.note) {
            noteData = JSON.parse(m.note);
          }
        } catch (e) {
          // ignore parsing error
        }

        return {
          id: m.id,
          status: m.status === 'CREATED' || m.status === 'PENDING' ? 'Chờ xuất phát' :
                  m.status === 'SEALED' ? 'Đang luân chuyển' :
                  m.status === 'RECEIVED' ? 'Đã đến' : m.status,
          type: noteData.taskAttribute || 'Tuyến trục',
          sealCode: m.manifestCode,
          taskName: noteData.taskName || `Chuyến xe ${m.originHubCode} - ${m.destinationHubCode}`,
          routeRef: noteData.routeCode || 'Không rõ',
          routeCode: noteData.routeCode || '-',
          roadType: noteData.routeType || 'Quốc lộ',
          departure: m.originHubCode || '-',
          destinationHubCode: m.destinationHubCode || '-',
          vehiclePlate: noteData.vehiclePlate,
          driverName: noteData.driverName,
          driverPhone: noteData.driverPhone,
        };
      });
      setTasks(mappedTasks);
    } catch (error) {
      console.error('Failed to fetch manifests', error);
      setTasks([]);
      addToast('error', 'Không tải được danh sách chuyến xe từ hệ thống vận chuyển.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManifests();
  }, [accessToken]);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [editVehiclePlate, setEditVehiclePlate] = useState('');
  const [editDriverName, setEditDriverName] = useState('');
  const [editDriverPhone, setEditDriverPhone] = useState('');

  const [printingTask, setPrintingTask] = useState<TaskRecord | null>(null);

  const openPrintModal = (task: TaskRecord) => {
    setPrintingTask(task);
    setTimeout(() => {
      const printSection = document.getElementById('print-seal-section');
      if (!printSection) return;
      
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write('<html><head><title>In Tem Xe</title>');
        iframeDoc.write('<style>@page { margin: 0; } body { margin: 20px; font-family: Arial, sans-serif; }</style>');
        iframeDoc.write('</head><body>');
        iframeDoc.write(printSection.innerHTML);
        iframeDoc.write('</body></html>');
        iframeDoc.close();
        
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1000);
        }, 250);
      }
    }, 150);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTasks(filteredTasks.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const filteredTasks = tasks.filter(task => 
    !searchQuery || 
    task.sealCode.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (task.vehiclePlate && task.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectTask = (id: string) => {
    setSelectedTasks(prev => 
      prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
    );
  };

  const openEditModal = (task: TaskRecord) => {
    setEditingTask(task);
    setEditVehiclePlate(task.vehiclePlate || '');
    setEditDriverName(task.driverName || '');
    setEditDriverPhone(task.driverPhone || '');
    setIsEditModalOpen(true);
  };

  const handleSaveVehicleInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      const updatedNote = {
        vehiclePlate: editVehiclePlate,
        driverName: editDriverName,
        driverPhone: editDriverPhone,
      };

      await opsApiClient.request(opsEndpoints.manifests.update(editingTask.id), {
        method: 'PATCH',
        accessToken,
        body: {
          note: JSON.stringify(updatedNote),
        },
      });

      setTasks(prev => prev.map(t => {
        if (t.id === editingTask.id) {
          return {
            ...t,
            vehiclePlate: editVehiclePlate,
            driverName: editDriverName,
            driverPhone: editDriverPhone,
          };
        }
        return t;
      }));
      setIsEditModalOpen(false);
      setEditingTask(null);
      addToast('success', `✓ Đã lưu thông tin xe cho ${editingTask.sealCode}.`);
    } catch (error: any) {
      console.error(error);
      addToast('error', `Lưu thất bại: ${error.message || 'Lỗi hệ thống'}`);
    }
  };

  /* ─── Xe đi / Xe đến handlers ─── */
  const openTransitConfirm = (task: TaskRecord, action: 'depart' | 'arrive') => {
    setTransitSealCode(task.sealCode);
    setTransitVehiclePlate(task.vehiclePlate || '');
    setTransitAction({ task, action });
  };

  const handleTransitConfirm = async () => {
    if (!transitAction) return;
    const { task, action } = transitAction;

    if (!transitSealCode.trim()) {
      addToast('error', 'Vui lòng nhập mã seal xe.');
      return;
    }
    if (!transitVehiclePlate.trim()) {
      addToast('error', 'Vui lòng nhập biển số xe.');
      return;
    }

    setIsTransitSubmitting(true);
    try {
      if (action === 'depart') {
        // Seal manifest → status changes to SEALED (Đang di chuyển)
        await opsApiClient.request(opsEndpoints.manifests.seal(task.id), {
          method: 'POST',
          accessToken,
          body: {
            sealCode: transitSealCode.trim(),
            note: JSON.stringify({
              vehiclePlate: transitVehiclePlate.trim(),
              action: 'VEHICLE_DEPARTED',
              departedAt: new Date().toISOString(),
            }),
          },
        });
        setTasks(prev => prev.map(t =>
          t.id === task.id ? { ...t, status: 'Đang di chuyển', vehiclePlate: transitVehiclePlate.trim() } : t
        ));
        addToast('success', `🚛 Xe ${transitVehiclePlate.trim()} đã xuất phát. Seal: ${transitSealCode.trim()}`);
      } else {
        // Receive manifest → status changes to RECEIVED (Đã đến)
        await opsApiClient.request(opsEndpoints.manifests.receive(task.id), {
          method: 'POST',
          accessToken,
          body: {
            manifestCode: task.sealCode,
            receiverName: 'Ops User',
            note: JSON.stringify({
              vehiclePlate: transitVehiclePlate.trim(),
              sealCode: transitSealCode.trim(),
              action: 'VEHICLE_ARRIVED',
              arrivedAt: new Date().toISOString(),
            }),
          },
        });
        setTasks(prev => prev.map(t =>
          t.id === task.id ? { ...t, status: 'Đã đến' } : t
        ));
        addToast('success', `✅ Xe ${transitVehiclePlate.trim()} đã đến. Xác nhận nhận hàng thành công.`);
      }
      setTransitAction(null);
      setTransitSealCode('');
      setTransitVehiclePlate('');
    } catch (error: any) {
      addToast('error', `Thao tác thất bại: ${error.message || 'Lỗi hệ thống'}`);
    } finally {
      setIsTransitSubmitting(false);
    }
  };

  return (
    <div className="ops-page ops-linehaul-page">
      {/* Toast Container */}
      <div className="lh-toast-container" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`lh-toast lh-toast--${t.type}`}>
            <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : 'ℹ'}</span>
            <span className="lh-toast__text">{t.text}</span>
          </div>
        ))}
      </div>

      {/* KHU VỰC 1: THANH CÔNG CỤ (TOOLBAR) */}
      <div className="ops-card ops-linehaul-toolbar-card">
        <div className="ops-linehaul-toolbar">
          <div className="ops-linehaul-toolbar-actions">
            <button 
              className="ops-btn ops-btn--outline"
              onClick={() => navigate(routePaths.linehaulVehicleSeal)}
            >
              <Plus size={16} className="ops-icon-blue" />
              <span>Thêm mới</span>
            </button>
            
            <button className="ops-btn ops-btn--outline">
              <Search size={16} className="ops-icon-blue" />
              <span>Tìm kiếm</span>
            </button>
            
            <button className="ops-btn ops-btn--outline" onClick={fetchManifests}>
              <RefreshCw size={16} className="ops-icon-blue" />
              <span>Làm mới</span>
            </button>
            
            <button 
              className="ops-btn ops-btn--primary ops-btn--icon-text"
              onClick={() => {
                if (selectedTasks.length === 0) {
                  showToast('Vui lòng chọn ít nhất 1 chuyến xe để in tem.', 'error');
                } else if (selectedTasks.length === 1) {
                  const task = tasks.find(t => t.id === selectedTasks[0]);
                  if (task) openPrintModal(task);
                } else {
                  showToast('Chọn một chuyến xe để in tem theo chuẩn hiện tại.', 'info');
                }
              }}
            >
              <Printer size={16} />
              <span>In tem xe</span>
            </button>

            <div className="ops-divider-vertical"></div>

            <button className="ops-btn ops-btn--outline">
              <Undo2 size={16} className="ops-icon-orange" />
              <span>Thu hồi điều phối</span>
            </button>

            <button className="ops-btn ops-btn--outline">
              <Settings2 size={16} className="ops-icon-blue" />
              <span>Điều phối hàng loạt</span>
            </button>
          </div>

          <button 
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="ops-btn ops-btn--collapse"
          >
            <span>{isFilterExpanded ? 'Thu gọn' : 'Mở rộng'}</span>
            {isFilterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* KHU VỰC 2: FORM BỘ LỌC (GRID) */}
      {isFilterExpanded && (
        <div className="ops-card ops-linehaul-filter-card">
          <div className="ops-linehaul-filter-grid">
            <input 
              type="text" 
              placeholder="Tem xe / Biển số" 
              className="ops-input" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <input type="text" placeholder="Tên tác vụ" className="ops-input" />
            <input type="text" placeholder="Tuyến đường" className="ops-input" />
            <input type="text" placeholder="Mã tuyến" className="ops-input" />
            <select className="ops-select">
              <option value="">Thuộc tính</option>
              <option value="1">Đơn chuyển tiếp</option>
              <option value="2">Hàng thu hồi</option>
            </select>
            <input type="text" placeholder="Khu đại lý" className="ops-input" />
            <input type="text" placeholder="Biển số xe" className="ops-input" />
          </div>

          <div className="ops-linehaul-filter-grid" style={{ marginTop: '12px' }}>
            <select className="ops-select">
              <option value="">Bưu cục đi</option>
            </select>
            <select className="ops-select">
              <option value="">Bưu cục đến</option>
            </select>
            <input type="date" className="ops-input" />
            <input type="date" className="ops-input" />
            <select className="ops-select">
              <option value="">Trạng thái nhiệm vụ</option>
              <option value="pending">Chờ xuất phát</option>
              <option value="transit">Đang di chuyển</option>
            </select>
            <select className="ops-select">
              <option value="">Loại đường</option>
              <option value="highway">Cao tốc</option>
              <option value="national">Quốc lộ</option>
            </select>
            <div className="ops-checkbox-group">
              <input type="checkbox" id="myTask" className="ops-checkbox" />
              <label htmlFor="myTask">Nhiệm vụ của tôi</label>
            </div>
          </div>
        </div>
      )}

      {/* KHU VỰC 3: BẢNG DỮ LIỆU */}
      <div className="ops-card ops-linehaul-table-card">
        <div className="ops-table-wrapper">
          <table className="ops-table">
            <thead>
              <tr>
                <th className="ops-text-center" style={{ width: '40px' }}>
                  <input 
                    type="checkbox" 
                    className="ops-checkbox"
                    onChange={handleSelectAll}
                    checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                  />
                </th>
                <th>STT</th>
                <th>Trạng thái nhiệm vụ</th>
                <th>Thuộc tính nghiệp vụ</th>
                <th>Tem xe</th>
                <th>Tên tác vụ</th>
                <th>Biển số xe</th>
                <th>Tham khảo tên tuyến đường</th>
                <th>Mã tuyến đường</th>
                <th>Loại đường</th>
                <th>Địa điểm xuất</th>
                <th className="ops-text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="ops-text-center">
                    Đang tải danh sách chuyến xe...
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={12} className="ops-text-center">
                    Chưa có chuyến xe phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : filteredTasks.map((task, index) => (
                <tr key={task.id}>
                  <td className="ops-text-center">
                    <input 
                      type="checkbox" 
                      className="ops-checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => handleSelectTask(task.id)}
                    />
                  </td>
                  <td>{index + 1}</td>
                  <td>
                    <span className={`ops-badge ${
                      task.status === 'Đã đến' || task.status === 'Đã hoàn thành' ? 'ops-badge--arrived' :
                      task.status === 'Đang luân chuyển' || task.status === 'Đang di chuyển' ? 'ops-badge--transit' :
                      'ops-badge--pending'
                    }`}>
                      {task.status === 'Đang luân chuyển' ? 'Đang di chuyển' : task.status}
                    </span>
                  </td>
                  <td>{task.type}</td>
                  <td><a href="#" className="ops-link">{task.sealCode}</a></td>
                  <td>{task.taskName}</td>
                  <td>
                    {task.vehiclePlate ? (
                      <div>
                        <strong>{task.vehiclePlate}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{task.driverName}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>Chưa có xe</span>
                    )}
                  </td>
                  <td>{task.routeRef}</td>
                  <td className="ops-monospace">{task.routeCode}</td>
                  <td>{task.roadType}</td>
                  <td>
                    <div className="ops-flex-icon">
                      <MapPin size={14} className="ops-icon-muted" />
                      <span>{task.departure}</span>
                    </div>
                  </td>
                  <td>
                    <div className="ops-table-actions">
                      {!task.vehiclePlate && (
                        <button 
                          className="ops-icon-btn ops-icon-orange" 
                          title="Hoàn tất thông tin xe/tài xế"
                          onClick={() => openEditModal(task)}
                        >
                          <Truck size={18} />
                        </button>
                      )}
                      {/* Xe đi button — only for Chờ xuất phát */}
                      {(task.status === 'Chờ xuất phát') && (
                        <button
                          className="ops-transit-btn ops-transit-btn--depart"
                          title="Xác nhận xe xuất phát"
                          onClick={() => openTransitConfirm(task, 'depart')}
                        >
                          <PlayCircle size={15} />
                          <span>Xe đi</span>
                        </button>
                      )}
                      {/* Xe đến button — only for Đang di chuyển */}
                      {(task.status === 'Đang luân chuyển' || task.status === 'Đang di chuyển') && (
                        <button
                          className="ops-transit-btn ops-transit-btn--arrive"
                          title="Xác nhận xe đã đến"
                          onClick={() => openTransitConfirm(task, 'arrive')}
                        >
                          <CheckCircle2 size={15} />
                          <span>Xe đến</span>
                        </button>
                      )}
                      <button 
                        className="ops-icon-btn ops-icon-blue" 
                        title="In tem"
                        onClick={() => openPrintModal(task)}
                      >
                        <Printer size={18} />
                      </button>
                      <button className="ops-icon-btn ops-icon-blue" title="Chi tiết">
                        <FileText size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="ops-pagination">
          <span className="ops-pagination-info">
            Hiển thị {filteredTasks.length > 0 ? 1 : 0} đến {filteredTasks.length} của {filteredTasks.length} bản ghi
          </span>
          <div className="ops-pagination-controls">
            <button className="ops-btn ops-btn--outline" disabled>Trước</button>
            <button className="ops-btn ops-btn--primary">1</button>
            <button className="ops-btn ops-btn--outline" disabled>Sau</button>
          </div>
        </div>
      </div>

      {isEditModalOpen && editingTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="ops-card" style={{ width: '450px', backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Bổ sung xe & tài xế - {editingTask.sealCode}</h3>
              <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
            </div>
            <form onSubmit={handleSaveVehicleInfo}>
              <div className="ops-form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Biển số xe *</label>
                <input 
                  type="text" 
                  className="ops-input" 
                  required 
                  value={editVehiclePlate}
                  onChange={(e) => setEditVehiclePlate(e.target.value)}
                  placeholder="VD: 51C-123.45"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
              <div className="ops-form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Tên tài xế *</label>
                <input 
                  type="text" 
                  className="ops-input" 
                  required 
                  value={editDriverName}
                  onChange={(e) => setEditDriverName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
              <div className="ops-form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#334155' }}>Số điện thoại tài xế *</label>
                <input 
                  type="text" 
                  className="ops-input" 
                  required 
                  value={editDriverPhone}
                  onChange={(e) => setEditDriverPhone(e.target.value)}
                  placeholder="VD: 0901234567"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1.5rem' }}>
                <button type="button" className="ops-btn ops-btn--outline" onClick={() => setIsEditModalOpen(false)}>Hủy</button>
                <button type="submit" className="ops-btn ops-btn--primary">Hoàn tất & In tem</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Hidden Print Section - Dùng cho iframe lấy innerHTML */}
      <div style={{ display: 'none' }}>
        {printingTask && (
          <div id="print-seal-section">
            <div style={{ width: '100mm', minHeight: '150mm', padding: '5mm', border: '2px solid #000', color: '#000', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', boxSizing: 'border-box' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #000', paddingBottom: '3mm', marginBottom: '4mm' }}>
                <div>
                  <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>NEXUS EXPRESS</h1>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>LINEHAUL VEHICLE SEAL</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px' }}>Ngày in / Print Date</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{new Date().toLocaleDateString('vi-VN')}</div>
                </div>
              </div>

              {/* Barcode Section (Mã tem xe) */}
              <div style={{ textAlign: 'center', marginBottom: '5mm', border: '1px solid #eee', padding: '2mm' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2mm' }}>MÃ VẠCH TEM XE (BARCODE)</div>
                <div style={{ height: '60px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  {generateBarcodeSvg(printingTask.sealCode)}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '900', marginTop: '1mm', letterSpacing: '2px' }}>{printingTask.sealCode}</div>
              </div>

              {/* Journey Section (Hub Đi -> Hub Đến) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm', marginBottom: '5mm' }}>
                <div style={{ border: '2px solid #000', padding: '3mm', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#555' }}>HUB ĐI (SOURCE)</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', margin: '2mm 0' }}>{printingTask.departure}</div>
                </div>
                <div style={{ border: '2px solid #000', padding: '3mm', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#555' }}>HUB ĐẾN (DEST)</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', margin: '2mm 0' }}>{printingTask.destinationHubCode || 'N/A'}</div>
                </div>
              </div>

              {/* Vehicle & QR Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4mm', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '4mm 0', marginBottom: '4mm' }}>
                <div>
                  <div style={{ marginBottom: '4mm' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#555' }}>BIỂN SỐ XE (PLATE)</div>
                    <div style={{ fontSize: '28px', fontWeight: '900' }}>{printingTask.vehiclePlate || 'CHƯA CÓ'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#555' }}>TÀI XẾ (DRIVER)</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{printingTask.driverName || '---'}</div>
                    <div style={{ fontSize: '14px' }}>{printingTask.driverPhone || '---'}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', paddingLeft: '4mm', borderLeft: '1px dashed #ccc' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2mm' }}>QR DATA (JSON)</div>
                  <img 
                    src={getQrDataUrl({
                      seal: printingTask.sealCode,
                      from: printingTask.departure,
                      to: printingTask.destinationHubCode || 'N/A',
                      plate: printingTask.vehiclePlate || 'N/A'
                    })} 
                    alt="QR Code" 
                    style={{ width: '100px', height: '100px', border: '1px solid #000' }} 
                  />
                </div>
              </div>

              {/* Footer info */}
              <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Loại tuyến: <strong>{printingTask.roadType}</strong></span>
                  <span>Tác vụ: <strong>{printingTask.type}</strong></span>
                </div>
                <div style={{ marginTop: '3mm', fontStyle: 'italic', color: '#444' }}>
                  * Lưu ý: Tài xế cần mang theo tem này để thực hiện quét xác nhận tại các trạm trung chuyển.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Transit Confirm Modal (Xe đi / Xe đến) ─── */}
      {transitAction && (
        <div className="lh-modal-overlay" onClick={() => setTransitAction(null)}>
          <div className="lh-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="lh-modal__title">
              {transitAction.action === 'depart' ? '🚛 Xác nhận Xe đi' : '✅ Xác nhận Xe đến'}
            </h3>
            <div className="lh-modal__body">
              <p><strong>Chuyến:</strong> {transitAction.task.taskName}</p>
              <p><strong>Mã tem:</strong> {transitAction.task.sealCode}</p>
              <p>
                <strong>Tuyến:</strong> {transitAction.task.departure} → {transitAction.task.destinationHubCode || 'N/A'}
              </p>

              <div className="lh-modal__field">
                <label>Biển số xe <span className="lh-required">*</span></label>
                <input
                  type="text"
                  className="ops-input"
                  placeholder="VD: 51C-123.45"
                  value={transitVehiclePlate}
                  onChange={(e) => setTransitVehiclePlate(e.target.value)}
                />
              </div>

              <div className="lh-modal__field">
                <label>Mã Seal xe <span className="lh-required">*</span></label>
                <input
                  type="text"
                  className="ops-input"
                  placeholder="Nhập mã seal niêm phong"
                  value={transitSealCode}
                  onChange={(e) => setTransitSealCode(e.target.value)}
                />
              </div>

              <div className="lh-modal__warning">
                {transitAction.action === 'depart'
                  ? '⚠ Xác nhận rằng xe đã đóng seal và sẵn sàng xuất phát. Sau khi xác nhận, trạng thái chuyển sang "Đang di chuyển".'
                  : '⚠ Xác nhận rằng xe đã đến hub đích và seal nguyên vẹn. Trạng thái chuyển sang "Đã đến".'}
              </div>
            </div>
            <div className="lh-modal__actions">
              <button className="ops-btn ops-btn--outline" onClick={() => setTransitAction(null)}>Hủy</button>
              <button
                className={`ops-btn ${transitAction.action === 'depart' ? 'ops-btn--primary' : 'ops-btn--success'}`}
                disabled={isTransitSubmitting || !transitSealCode.trim() || !transitVehiclePlate.trim()}
                onClick={() => void handleTransitConfirm()}
              >
                {isTransitSubmitting ? 'Đang xử lý...' : transitAction.action === 'depart' ? '🚛 Xác nhận Xe đi' : '✅ Xác nhận Xe đến'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

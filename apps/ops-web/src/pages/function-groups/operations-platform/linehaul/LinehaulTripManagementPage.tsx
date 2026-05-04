import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import qrcode from 'qrcode-generator';
import { routePaths } from '../../../../navigation/routes';
import { opsApiClient } from '../../../../services/api/client';
import { opsEndpoints } from '../../../../services/api/endpoints';
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
  Truck
} from 'lucide-react';
import './LinehaulStyles.css';

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
  vehiclePlate?: string;
  driverName?: string;
  driverPhone?: string;
}

const MOCK_DATA: TaskRecord[] = [
  {
    id: '1',
    status: 'Chờ xuất phát',
    type: 'Đơn chuyển tiếp',
    sealCode: 'XT982341234',
    taskName: 'Chuyến xe SG - HN 12/05',
    routeRef: 'Tuyến Bắc Nam',
    routeCode: 'R-SG-HN-01',
    roadType: 'Quốc lộ',
    departure: 'HUB-HCM (003)',
  },
  {
    id: '2',
    status: 'Đang di chuyển',
    type: 'Hàng thu hồi',
    sealCode: 'XT123456789',
    taskName: 'Chuyến xe nội thành SG',
    routeRef: 'Tuyến nội thành',
    routeCode: 'R-SG-NT-05',
    roadType: 'Đường nội thị',
    departure: 'BC-Q1',
  },
  {
    id: '3',
    status: 'Đã hoàn thành',
    type: 'Phân phối nhanh',
    sealCode: 'XT556677889',
    taskName: 'Chuyến xe SG - Cần Thơ',
    routeRef: 'Tuyến Miền Tây',
    routeCode: 'R-SG-CT-02',
    roadType: 'Cao tốc',
    departure: 'HUB-HCM (003)',
  }
];

const getQrDataUrl = (code: string) => {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(code);
    qr.make();
    return qr.createDataURL(4);
  } catch(e) {
    return '';
  }
};

export function LinehaulTripManagementPage() {
  const navigate = useNavigate();
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchManifests = async () => {
    setIsLoading(true);
    try {
      const manifests = await opsApiClient.request<any[]>(opsEndpoints.manifests.list);
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
          status: m.status === 'PENDING' || m.status === 'CREATED' ? 'Chờ xuất phát' : m.status,
          type: noteData.taskAttribute || 'Tuyến trục',
          sealCode: m.manifestCode,
          taskName: noteData.taskName || `Chuyến xe ${m.originHubCode} - ${m.destinationHubCode}`,
          routeRef: noteData.routeCode || 'Không rõ',
          routeCode: noteData.routeCode || '-',
          roadType: noteData.routeType || 'Quốc lộ',
          departure: m.originHubCode || '-',
          vehiclePlate: noteData.vehiclePlate,
          driverName: noteData.driverName,
          driverPhone: noteData.driverPhone,
        };
      });
      setTasks(mappedTasks.length > 0 ? mappedTasks : MOCK_DATA);
    } catch (error) {
      console.error('Failed to fetch manifests', error);
      setTasks(MOCK_DATA); // Fallback nếu API lỗi
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManifests();
  }, []);

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
      alert('Đã lưu thông tin xe và in tem thành công!');
    } catch (error: any) {
      console.error(error);
      alert('Lưu thất bại: ' + (error.message || 'Lỗi hệ thống'));
    }
  };

  return (
    <div className="ops-page ops-linehaul-page">
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
            
            <button className="ops-btn ops-btn--outline">
              <RefreshCw size={16} className="ops-icon-blue" />
              <span>Làm mới</span>
            </button>
            
            <button 
              className="ops-btn ops-btn--primary ops-btn--icon-text"
              onClick={() => {
                if (selectedTasks.length === 0) {
                  alert("Vui lòng chọn ít nhất 1 chuyến xe để in tem");
                } else if (selectedTasks.length === 1) {
                  const task = tasks.find(t => t.id === selectedTasks[0]);
                  if (task) openPrintModal(task);
                } else {
                  alert("Tính năng in hàng loạt đang được phát triển.");
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
              {filteredTasks.map((task, index) => (
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
                    <span className={`ops-badge ops-badge--${task.status === 'Đã hoàn thành' ? 'success' : task.status === 'Đang di chuyển' ? 'info' : 'default'}`}>
                      {task.status}
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
          <span className="ops-pagination-info">Hiển thị 1 đến 3 của 3 bản ghi</span>
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
            <div style={{ width: '100%', padding: '0', border: '2px solid #000', borderRadius: '0', color: '#000', fontFamily: 'Arial, sans-serif', maxWidth: '450px' }}>
              {/* Header: Company & Routing */}
              <div style={{ display: 'flex', borderBottom: '2px solid #000' }}>
                <div style={{ padding: '12px', flex: 1, borderRight: '2px solid #000', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '1px' }}>NEXUS EXPRESS</h2>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '4px' }}>LOGISTICS & LINEHAUL</div>
                </div>
                <div style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff', width: '110px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', textAlign: 'center' }}>LINEHAUL</h3>
                </div>
              </div>

              {/* Main Info: Route & QR */}
              <div style={{ display: 'flex', borderBottom: '2px solid #000' }}>
                <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', fontWeight: 'bold' }}>Tuyến đường / Route</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>{printingTask.routeRef} ({printingTask.routeCode})</div>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', fontWeight: 'bold' }}>Hành trình / Journey</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <div style={{ fontSize: '20px', fontWeight: '900' }}>{printingTask.departure.split('-')[1] || printingTask.departure}</div>
                      <div style={{ fontSize: '20px' }}>➔</div>
                      <div style={{ fontSize: '20px', fontWeight: '900' }}>{printingTask.taskName.split(' - ')[1] || 'ĐÍCH'}</div>
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: '16px', borderLeft: '2px solid #000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={getQrDataUrl(printingTask.sealCode)} alt="QR Code" style={{ width: '80px', height: '80px' }} />
                  <div style={{ marginTop: '8px', fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px' }}>{printingTask.sealCode}</div>
                </div>
              </div>

              {/* Vehicle Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #000' }}>
                <div style={{ padding: '12px', borderRight: '2px solid #000' }}>
                  <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', fontWeight: 'bold' }}>Biển số xe / Plate</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>{printingTask.vehiclePlate || 'CHƯA CẬP NHẬT'}</div>
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', fontWeight: 'bold' }}>Tài xế / Driver</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>{printingTask.driverName || '---'}</div>
                  <div style={{ fontSize: '12px', marginTop: '2px' }}>{printingTask.driverPhone || '---'}</div>
                </div>
              </div>

              {/* Footer details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '2px solid #000' }}>
                <div style={{ padding: '12px', borderRight: '2px solid #000' }}>
                  <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', fontWeight: 'bold' }}>Loại đường</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{printingTask.roadType}</div>
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', fontWeight: 'bold' }}>Thuộc tính chuyến</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{printingTask.type}</div>
                </div>
              </div>

              <div style={{ padding: '12px', textAlign: 'center', fontSize: '10px' }}>
                <div>Sử dụng mã QR này để bộ phận kho tiến hành quét và xác nhận nhận xe.</div>
                <div style={{ marginTop: '4px', fontWeight: 'bold' }}>Ngày in: {new Date().toLocaleString('vi-VN')}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

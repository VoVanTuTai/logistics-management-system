import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routePaths } from '../../../../navigation/routes';
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
  Trash2
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

export function LinehaulTripManagementPage() {
  const navigate = useNavigate();
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTasks(MOCK_DATA.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleSelectTask = (id: string) => {
    setSelectedTasks(prev => 
      prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
    );
  };

  return (
    <div className="ops-page ops-linehaul-page">
      {/* KHU VỰC 1: THANH CÔNG CỤ (TOOLBAR) */}
      <div className="ops-card ops-linehaul-toolbar-card">
        <div className="ops-linehaul-toolbar">
          <div className="ops-linehaul-toolbar-actions">
            <button className="ops-btn ops-btn--outline">
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
              onClick={() => navigate(routePaths.linehaulVehicleSeal)}
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
            className="ops-btn ops-btn--text ops-btn--collapse"
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
            <input type="text" placeholder="Tem xe" className="ops-input" />
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
                    checked={selectedTasks.length === MOCK_DATA.length && MOCK_DATA.length > 0}
                  />
                </th>
                <th>STT</th>
                <th>Trạng thái nhiệm vụ</th>
                <th>Thuộc tính nghiệp vụ</th>
                <th>Tem xe</th>
                <th>Tên tác vụ</th>
                <th>Tham khảo tên tuyến đường</th>
                <th>Mã tuyến đường</th>
                <th>Loại đường</th>
                <th>Địa điểm xuất</th>
                <th className="ops-text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_DATA.map((task, index) => (
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
                      <button className="ops-icon-btn ops-icon-blue" title="Chi tiết">
                        <FileText size={18} />
                      </button>
                      <button className="ops-icon-btn ops-icon-emerald" title="Điều phối">
                        <Settings2 size={18} />
                      </button>
                      <button className="ops-icon-btn ops-icon-red" title="Xóa">
                        <Trash2 size={18} />
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
    </div>
  );
}

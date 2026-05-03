import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { routePaths } from '../../../../navigation/routes';
import { useAuthStore } from '../../../../store/authStore';
import './LinehaulStyles.css';

interface ManifestPayload {
  manifestCode: string;
  originHubCode: string;
  destinationHubCode: string;
  status: string;
  routeCode: string;
  routeType: string;
  taskAttribute: string;
  expectedDepartureTime: string;
  expectedArrivalTime?: string;
  vehiclePlate?: string;
  taskName?: string;
}

export function LinehaulVehicleSealPage(): React.JSX.Element {
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const userHubCode = session?.user.hubCodes?.[0] || 'HUB-HCM-001';
  const userName = session?.user.username || 'System User';

  // Hệ thống tự sinh
  const generatedManifestCode = useMemo(() => `SRTR${new Date().getTime().toString().slice(-6)}`, []);
  
  // Bắt buộc
  const [destinationHubCode, setDestinationHubCode] = useState('');
  const [routeCode, setRouteCode] = useState('');
  const [routeType, setRouteType] = useState('');
  const [taskAttribute, setTaskAttribute] = useState('');
  const [expectedDepartureTime, setExpectedDepartureTime] = useState('');

  // Tùy chọn
  const [expectedArrivalTime, setExpectedArrivalTime] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [taskName, setTaskName] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Rule 1: Chống lặp Hub
    if (destinationHubCode === userHubCode) {
      setErrorMsg('Bưu cục đích không hợp lệ (Trùng với bưu cục xuất phát).');
      return;
    }

    // Rule 2: Ràng buộc thời gian (ETA > Departure Time)
    if (expectedArrivalTime) {
      const depTime = new Date(expectedDepartureTime).getTime();
      const arrTime = new Date(expectedArrivalTime).getTime();
      if (arrTime <= depTime) {
        setErrorMsg('Thời gian kết thúc hành trình phải lớn hơn Thời gian bắt đầu khởi hành.');
        return;
      }
    }

    // Tạo Payload API
    const payload: ManifestPayload = {
      manifestCode: generatedManifestCode,
      originHubCode: userHubCode,
      destinationHubCode: destinationHubCode,
      status: 'PENDING', // Đợi điều phối
      routeCode,
      routeType,
      taskAttribute,
      expectedDepartureTime: new Date(expectedDepartureTime).toISOString(),
      expectedArrivalTime: expectedArrivalTime ? new Date(expectedArrivalTime).toISOString() : undefined,
      vehiclePlate: vehiclePlate || undefined,
      taskName: taskName || undefined,
    };

    console.log('--- GỌI API POST /manifests ---');
    console.log(JSON.stringify(payload, null, 2));

    // Rule 3: Bản chất Tem xe là "Vật chứa rỗng" trạng thái PENDING
    // Giả lập gọi API thành công
    setTimeout(() => {
      setSuccessMsg(`Tạo Tem xe ${generatedManifestCode} thành công! Hệ thống đang chờ điều phối.`);
      // Tự động chuyển hướng hoặc reset form
      // navigate(routePaths.linehaulTripManagement);
    }, 800);
  };

  return (
    <div className="ops-page">
      <header className="ops-page-header">
        <div className="ops-page-header__title">
          <button 
            type="button" 
            className="ops-btn ops-btn--text ops-btn--back"
            onClick={() => navigate(routePaths.linehaulTripManagement)}
          >
            &larr; Quay lại
          </button>
          <h2>Thêm mới Tem xe (Khởi tạo chuyến Linehaul)</h2>
        </div>
      </header>

      <div className="ops-linehaul-layout">
        <section className="ops-card ops-linehaul-form" style={{ maxWidth: '800px', flex: 2 }}>
          <form onSubmit={onSubmit}>
            
            {/* Nhóm A: Thông tin tự sinh (Readonly) */}
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>A. Thông tin hệ thống</h3>
            <div className="ops-form-row">
              <div className="ops-form-group">
                <label>Mã Tem xe</label>
                <input type="text" className="ops-input" value={generatedManifestCode} disabled style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }} />
              </div>
              <div className="ops-form-group">
                <label>Bưu cục xe đi (Source Hub)</label>
                <input type="text" className="ops-input" value={userHubCode} disabled style={{ backgroundColor: '#f8fafc' }} />
              </div>
              <div className="ops-form-group">
                <label>Trạng thái</label>
                <input type="text" className="ops-input" value="Đợi điều phối" disabled style={{ backgroundColor: '#f8fafc', color: '#f97316' }} />
              </div>
            </div>
            <div className="ops-form-row" style={{ marginTop: '0.5rem' }}>
              <div className="ops-form-group">
                <label>Người tạo</label>
                <input type="text" className="ops-input" value={userName} disabled style={{ backgroundColor: '#f8fafc' }} />
              </div>
            </div>

            {/* Nhóm B: Bắt buộc */}
            <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>B. Thông tin nghiệp vụ (* Bắt buộc)</h3>
            <div className="ops-form-row">
              <div className="ops-form-group">
                <label>Bưu cục xe đến (Dest Hub) *</label>
                <select className="ops-select" required value={destinationHubCode} onChange={(e) => setDestinationHubCode(e.target.value)}>
                  <option value="">Chọn điểm đến</option>
                  <option value="HUB-HN-001">HUB Tổng Miền Bắc (001)</option>
                  <option value="HUB-DN-002">HUB Tổng Miền Trung (002)</option>
                  <option value="HUB-HCM-001">HUB Tổng Miền Nam (003) - Test Lỗi Trùng</option>
                </select>
              </div>
              <div className="ops-form-group">
                <label>Tuyến đường (Route) *</label>
                <select className="ops-select" required value={routeCode} onChange={(e) => setRouteCode(e.target.value)}>
                  <option value="">Chọn tuyến</option>
                  <option value="RT-BACNAM">Tuyến Bắc - Nam</option>
                  <option value="RT-MIENTRUNG">Tuyến HCM - Đà Nẵng</option>
                </select>
              </div>
            </div>
            
            <div className="ops-form-row" style={{ marginTop: '1rem' }}>
              <div className="ops-form-group">
                <label>Loại đường *</label>
                <select className="ops-select" required value={routeType} onChange={(e) => setRouteType(e.target.value)}>
                  <option value="">Chọn loại</option>
                  <option value="GOM_HANG">Gom hàng</option>
                  <option value="TUYEN_TRUC">Tuyến trục (Linehaul)</option>
                  <option value="LIEN_TINH">Liên tỉnh</option>
                </select>
              </div>
              <div className="ops-form-group">
                <label>Thuộc tính nghiệp vụ *</label>
                <select className="ops-select" required value={taskAttribute} onChange={(e) => setTaskAttribute(e.target.value)}>
                  <option value="">Chọn thuộc tính</option>
                  <option value="CA_CHINH">Ca chính</option>
                  <option value="CA_PHU">Ca phụ</option>
                  <option value="TANG_CUONG">Tăng cường</option>
                </select>
              </div>
            </div>

            <div className="ops-form-row" style={{ marginTop: '1rem' }}>
              <div className="ops-form-group">
                <label>Khởi hành dự kiến (ETD) *</label>
                <input 
                  type="datetime-local" 
                  className="ops-input" 
                  required 
                  value={expectedDepartureTime}
                  onChange={(e) => setExpectedDepartureTime(e.target.value)}
                />
              </div>
            </div>

            {/* Nhóm C: Tùy chọn */}
            <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>C. Thông tin bổ sung (Tùy chọn)</h3>
            <div className="ops-form-row">
              <div className="ops-form-group">
                <label>Kết thúc dự kiến (ETA)</label>
                <input 
                  type="datetime-local" 
                  className="ops-input" 
                  value={expectedArrivalTime}
                  onChange={(e) => setExpectedArrivalTime(e.target.value)}
                />
              </div>
              <div className="ops-form-group">
                <label>Biển số xe (Có thể bổ sung sau)</label>
                <input 
                  type="text" 
                  className="ops-input" 
                  placeholder="VD: 51C-123.45"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                />
              </div>
            </div>
            <div className="ops-form-group" style={{ marginTop: '1rem' }}>
              <label>Tên tác vụ / Ghi chú chuyến xe</label>
              <input 
                type="text" 
                className="ops-input" 
                placeholder="VD: Chuyến tăng cường chở hàng sale 12/12"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </div>

            {errorMsg && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', borderLeft: '4px solid #ef4444' }}>
                <strong>Lỗi: </strong> {errorMsg}
              </div>
            )}
            
            {successMsg && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '4px', borderLeft: '4px solid #22c55e' }}>
                <strong>Thành công: </strong> {successMsg}
              </div>
            )}

            <div className="ops-form-actions" style={{ marginTop: '2rem', justifyContent: 'flex-start' }}>
              <button type="submit" className="ops-btn ops-btn--primary ops-btn--large">
                Khởi tạo Tem xe
              </button>
            </div>
          </form>
        </section>

        {/* Cột hướng dẫn */}
        <aside className="ops-linehaul-preview" style={{ flex: 1 }}>
          <div className="ops-card" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#0f172a' }}>ℹ️ Hướng dẫn vận hành</h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#475569', fontSize: '0.9rem', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '0.5rem' }}>Tem xe sau khi tạo sẽ mang trạng thái <strong>"Đợi điều phối"</strong>.</li>
              <li style={{ marginBottom: '0.5rem' }}>Lúc này tem xe là một "Vật chứa rỗng", chưa chứa đơn hàng.</li>
              <li style={{ marginBottom: '0.5rem' }}>Bộ phận điều phối sẽ quét mã Tem xe này để bắt đầu gán các Bao hàng/Kiện hàng lên xe.</li>
              <li>Bạn có thể để trống <strong>Biển số xe</strong> nếu chưa chốt được xe chạy thực tế.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

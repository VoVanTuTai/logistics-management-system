import React, { useMemo, useState } from 'react';
import { useShipmentPageQuery } from '../../../../features/shipments/shipments.api';
import { useCourierOptionsQuery } from '../../../../features/tasks/tasks.api';
import { useAuthStore } from '../../../../store/authStore';
import { useCourierTransferStore, TransferShipmentItem } from '../../../../store/courierTransferStore';
import { formatDateTime } from '../../../../utils/format';

export function CourierTaskTransferPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const user = useAuthStore((state) => state.session?.user);

  const [rawCodesInput, setRawCodesInput] = useState('');
  const [targetCourierId, setTargetCourierId] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const transferRequests = useCourierTransferStore((state) => state.requests);
  const createTransferRequest = useCourierTransferStore((state) => state.createTransferRequest);

  const shipmentQuery = useShipmentPageQuery(accessToken, { limit: 100 });
  const courierOptionsQuery = useCourierOptionsQuery(accessToken);

  const allShipments = shipmentQuery.data?.items ?? [];
  const courierOptions = courierOptionsQuery.data ?? [];

  // Parse pasted codes (by comma, space or newline)
  const parsedCodes = useMemo(() => {
    if (!rawCodesInput.trim()) return [];
    return rawCodesInput
      .split(/[\s,\n\r]+/)
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length > 0);
  }, [rawCodesInput]);

  const isTransferableStatus = (status: string): boolean => {
    const st = (status || '').toUpperCase();
    return (
      st === 'OUT_FOR_DELIVERY' ||
      st === 'OUT_FOR_PICKUP' ||
      st === 'ASSIGNED_FOR_PICKUP' ||
      st === 'IN_TRANSIT' ||
      st === 'DISPATCHED' ||
      st === 'DELIVERY_DISPATCHED' ||
      st === 'PICKUP_DISPATCHED'
    );
  };

  const getStatusBadge = (status: string) => {
    const st = (status || '').toUpperCase();
    if (st === 'OUT_FOR_DELIVERY' || st === 'DELIVERY_DISPATCHED') {
      return { label: '🚚 Phân công đi giao', bg: '#dbeafe', color: '#1e40af' };
    }
    if (st === 'OUT_FOR_PICKUP' || st === 'ASSIGNED_FOR_PICKUP' || st === 'PICKUP_DISPATCHED') {
      return { label: '📦 Phân công đi lấy', bg: '#fef3c7', color: '#92400e' };
    }
    if (st === 'IN_TRANSIT' || st === 'DISPATCHED') {
      return { label: '🔄 Đang luân chuyển / Đi giao', bg: '#e0e7ff', color: '#3730a3' };
    }
    return { label: `⚠️ Không thể chuyển (${st})`, bg: '#fee2e2', color: '#991b1b' };
  };

  // Match shipments by parsed codes
  const matchedShipments = useMemo(() => {
    if (parsedCodes.length === 0) return allShipments.slice(0, 10);
    const codeSet = new Set(parsedCodes);
    return allShipments.filter((s) => codeSet.has(s.shipmentCode.toUpperCase()));
  }, [allShipments, parsedCodes]);

  const transferableShipments = useMemo(
    () => matchedShipments.filter((s) => isTransferableStatus(s.currentStatus)),
    [matchedShipments],
  );

  const toggleSelectCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const toggleSelectAll = () => {
    if (selectedCodes.length === transferableShipments.length && transferableShipments.length > 0) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(transferableShipments.map((s) => s.shipmentCode));
    }
  };

  const handleCreateTransferRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    setActionError(null);

    if (selectedCodes.length === 0) {
      setActionError('Vui lòng chọn ít nhất một vận đơn ở trạng thái phân công đi giao/đi lấy để chuyển.');
      return;
    }

    const invalidSelected = matchedShipments.filter(
      (s) => selectedCodes.includes(s.shipmentCode) && !isTransferableStatus(s.currentStatus),
    );

    if (invalidSelected.length > 0) {
      setActionError(
        `Đơn hàng ${invalidSelected.map((s) => s.shipmentCode).join(', ')} không ở trạng thái Phân công đi giao hoặc Phân công đi lấy. Chỉ đơn đang phân công mới được chuyển.`,
      );
      return;
    }

    if (!targetCourierId) {
      setActionError('Vui lòng chọn Courier nhận bàn giao.');
      return;
    }

    const selectedShipmentItems: TransferShipmentItem[] = matchedShipments
      .filter((s) => selectedCodes.includes(s.shipmentCode))
      .map((s) => ({
        shipmentCode: s.shipmentCode,
        senderName: s.senderName ?? 'N/A',
        receiverName: s.receiverName ?? 'N/A',
        receiverAddress: s.receiverAddress ?? 'N/A',
        currentStatus: s.currentStatus,
        sourceCourierId: '30000001',
        sourceCourierName: 'Nguyễn Văn Minh',
      }));

    const targetCourier = courierOptions.find((c) => c.courierId === targetCourierId);

    const reqId = createTransferRequest({
      sourceCourierId: '30000001',
      sourceCourierName: 'Nguyễn Văn Minh',
      targetCourierId,
      targetCourierName: targetCourier?.courierId ?? targetCourierId,
      hubCode: user?.hubCodes?.[0] ?? 'HCM-001',
      shipments: selectedShipmentItems,
      note: transferNote || 'Chuyển đơn công tác bưu cục',
    });

    setActionMessage(`Đã tạo yêu cầu chuyển đơn ${selectedCodes.length} vận đơn cho Courier ${targetCourierId}. Đang chờ bên nhận xác nhận trên App Mobile.`);
    setSelectedCodes([]);
    setRawCodesInput('');
    setTransferNote('');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#38bdf8' }}>
            move_up
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#7dd3fc', letterSpacing: '0.5px' }}>
            NỀN TẢNG ĐIỀU HÀNH — QUẢN LÝ CHUYỂN ĐƠN BÀN GIAO
          </span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0' }}>
          QUẢN LÝ CHUYỂN ĐƠN GIỮA CÁC COURIER (TASK HANDOFF TRANSFER)
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, maxWidth: '850px' }}>
          Dán danh sách dãy nhiều mã vận đơn để tìm kiếm tập trung, chọn đơn và phát lệnh chuyển quyền đảm nhiệm từ Courier này sang Courier khác. Đơn chỉ hoàn tất chuyển sau khi Courier nhận chấp nhận trên App Mobile.
        </p>
      </div>

      {actionMessage && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534', fontWeight: 600, fontSize: '13px', marginBottom: '16px' }}>
          ✅ {actionMessage}
        </div>
      )}

      {actionError && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', fontWeight: 600, fontSize: '13px', marginBottom: '16px' }}>
          ⚠️ {actionError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>
        {/* Left Side: Multi-code Search & Selection Table */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: '#0f172a' }}>
            1. Dán Dãy Mã Vận Đơn Tìm Kiếm (Multi-Code Batch Search)
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
              Dán dãy mã vận đơn (Phân cách bằng xuống dòng hoặc dấu phẩy)
            </label>
            <textarea
              rows={3}
              value={rawCodesInput}
              onChange={(e) => setRawCodesInput(e.target.value)}
              placeholder="Ví dụ:&#10;NXS000001&#10;NXS000002, NXS000003"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
                backgroundColor: '#f8fafc',
              }}
            />
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Đã nhận diện: <strong>{parsedCodes.length}</strong> mã vận đơn
            </div>
          </div>

          {/* Matched Shipments Table */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
              Danh sách Vận đơn Khớp ({matchedShipments.length})
            </h4>
            <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
              Đã chọn: {selectedCodes.length} đơn
            </div>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '10px 12px', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={matchedShipments.length > 0 && selectedCodes.length === matchedShipments.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Mã VĐ</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Courier Đảm Nhận</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Người Nhận & Địa Chỉ</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {matchedShipments.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      Không tìm thấy vận đơn khớp với danh sách mã.
                    </td>
                  </tr>
                ) : (
                  matchedShipments.map((s) => {
                    const transferable = isTransferableStatus(s.currentStatus);
                    const badge = getStatusBadge(s.currentStatus);
                    return (
                      <tr key={s.shipmentCode} style={{ borderBottom: '1px solid #f1f5f9', opacity: transferable ? 1 : 0.65 }}>
                        <td style={{ padding: '10px 12px' }}>
                          <input
                            type="checkbox"
                            disabled={!transferable}
                            checked={selectedCodes.includes(s.shipmentCode)}
                            onChange={() => toggleSelectCode(s.shipmentCode)}
                          />
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a' }}>
                          {s.shipmentCode}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: '#f1f5f9', fontSize: '11px', fontWeight: 600 }}>
                            30000001 (Nguyễn Văn Minh)
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600 }}>{s.receiverName ?? 'N/A'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{s.receiverAddress ?? 'N/A'}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '3px 9px', borderRadius: '12px', backgroundColor: badge.bg, color: badge.color, fontSize: '11px', fontWeight: 700 }}>
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Form Create Transfer Request & Target Courier Selection */}
        <form
          onSubmit={handleCreateTransferRequest}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>
            2. Cấu Hình Bàn Giao (Handoff Config)
          </h3>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              COURIER HIỆN TẠI (GỬI BÀN GIAO)
            </label>
            <input
              type="text"
              readOnly
              value="30000001 — Nguyễn Văn Minh"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f1f5f9',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              CHỌN COURIER NHẬN BÀN GIAO *
            </label>
            <select
              value={targetCourierId}
              onChange={(e) => setTargetCourierId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #0f172a',
                fontSize: '13px',
                fontWeight: 600,
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
              }}
            >
              <option value="">-- Chọn Courier Nhận --</option>
              {courierOptions.map((c) => (
                <option key={c.courierId} value={c.courierId}>
                  {c.courierId}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              GHI CHÚ CHUYỂN ĐƠN
            </label>
            <textarea
              rows={2}
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              placeholder="Nhập lý do chuyển đơn..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            📤 Tạo Yêu Cầu Chuyển Đơn (Chờ Courier B Chấp Nhận)
          </button>
        </form>
      </div>

      {/* Real-time Transfer Requests Monitor Table */}
      <div style={{ marginTop: '24px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px 0', color: '#0f172a' }}>
          3. Nhật Ký Yêu Cầu Chuyển Đơn & Trạng Thái Xác Nhận Mobile
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Mã Yêu Cầu</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Courier Gửi ➔ Courier Nhận</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Số Lượng Đơn</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Ghi Chú</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Trạng Thái Xác Nhận Mobile</th>
                <th style={{ padding: '10px 12px', fontWeight: 700 }}>Thời Gian Tạo</th>
              </tr>
            </thead>
            <tbody>
              {transferRequests.map((req) => (
                <tr key={req.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 700, fontFamily: 'monospace' }}>{req.requestNo}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontWeight: 600 }}>{req.sourceCourierName}</span>
                    <span style={{ margin: '0 6px', color: '#94a3b8' }}>➔</span>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>{req.targetCourierName}</span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 700 }}>{req.shipments.length} đơn</td>
                  <td style={{ padding: '12px', color: '#64748b' }}>{req.note || 'N/A'}</td>
                  <td style={{ padding: '12px' }}>
                    {req.status === 'PENDING_ACCEPTANCE' && (
                      <span style={{ padding: '3px 10px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#d97706', fontSize: '12px', fontWeight: 700 }}>
                        ⏳ Chờ Courier B Chấp Nhận trên Mobile
                      </span>
                    )}
                    {req.status === 'ACCEPTED' && (
                      <span style={{ padding: '3px 10px', borderRadius: '12px', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: 700 }}>
                        ✅ Đã Hoàn Tất Chuyển Đảm Nhận
                      </span>
                    )}
                    {req.status === 'REJECTED' && (
                      <span style={{ padding: '3px 10px', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '12px', fontWeight: 700 }}>
                        ❌ Courier B Từ Chối
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>{formatDateTime(req.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

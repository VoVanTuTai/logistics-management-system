import React, { useMemo, useState } from 'react';

import {
  BREAK_POINT_LABELS,
  escalateToCompensationClaim,
  extendHearingDeadline,
  INVESTIGATION_STATUS_LABELS,
  readInvestigations,
  resolveAsFound,
  submitDisputeEvidence,
  writeInvestigations,
} from '../../../../features/investigation/investigation.data';
import type {
  InvestigationCase,
  InvestigationStatus,
} from '../../../../features/investigation/investigation.types';
import './StrayShipmentInvestigationPage.css';

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function calculateRemainingHours(deadlineIso?: string): { text: string; isUrgent: boolean } {
  if (!deadlineIso) return { text: 'Không áp dụng', isUrgent: false };
  const diffMs = new Date(deadlineIso).getTime() - Date.now();
  if (diffMs <= 0) return { text: 'ĐÃ HẾT HẠN', isUrgent: true };
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return { text: `Còn ${hours} giờ ${mins} phút`, isUrgent: hours < 6 };
}

export const StrayShipmentInvestigationPage: React.FC = () => {
  const [cases, setCases] = useState<InvestigationCase[]>(() => readInvestigations());
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => {
    const list = readInvestigations();
    return list.length > 0 ? list[0].id : '';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isCctvModalOpen, setIsCctvModalOpen] = useState(false);
  const [isFoundModalOpen, setIsFoundModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);

  // Form states for CCTV Modal
  const [cctvSubBy, setCctvSubBy] = useState('');
  const [cctvUrl, setCctvUrl] = useState('');
  const [cctvRange, setCctvRange] = useState('');
  const [cctvNotes, setCctvNotes] = useState('');

  // Form states for Found Modal
  const [foundLocation, setFoundLocation] = useState('');
  const [foundNotes, setFoundNotes] = useState('');
  const [foundOperator, setFoundOperator] = useState('');

  // Form states for Escalate Modal
  const [adjName, setAdjName] = useState('Trần Minh Tuấn (QA Lead)');
  const [adjNotes, setAdjNotes] = useState('');

  // Notification banner
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const showAlert = (msg: string) => {
    setAlertMessage(msg);
    setTimeout(() => setAlertMessage(null), 5000);
  };

  // KPIs
  const kpis = useMemo(() => {
    const total = cases.length;
    const inHearing = cases.filter((c) => c.status === 'IN_HEARING').length;
    const found = cases.filter((c) => c.status === 'RESOLVED_FOUND').length;
    const escalated = cases.filter((c) => c.status === 'ESCALATED_TO_CLAIM').length;
    const foundRate = total > 0 ? Math.round((found / total) * 100) : 0;
    const moneySaved = cases
      .filter((c) => c.status === 'RESOLVED_FOUND')
      .reduce((sum, c) => sum + c.declaredValue, 0);

    return { total, inHearing, found, escalated, foundRate, moneySaved };
  }, [cases]);

  // Filtered master list
  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.investigationCode.toLowerCase().includes(q) ||
        item.shipmentCode.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.packageDescription.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

      return matchQuery && matchStatus;
    });
  }, [cases, searchQuery, statusFilter]);

  const selectedCase = useMemo(() => {
    return cases.find((c) => c.id === selectedCaseId) || cases[0];
  }, [cases, selectedCaseId]);

  // Action: Trigger Auto Scan for stale shipments
  const handleAutoScan = () => {
    showAlert(
      '🔍 Hệ thống đã rà soát toàn mạng: Phát hiện thêm 2 vận đơn lưu kho >48h tại Hub Đà Nẵng và Bưu cục Hà Đông. Đã tự động cập nhật nhật ký giám định.',
    );
  };

  // Action: Submit CCTV / Dispute Evidence
  const handleSubmitCctv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !cctvSubBy.trim() || !cctvNotes.trim()) {
      alert('Vui lòng nhập tên người nộp và nội dung giải trình.');
      return;
    }

    const updated = submitDisputeEvidence(selectedCase.id, {
      submittedBy: cctvSubBy,
      partyCode: selectedCase.preliminaryReport.suspectPartyCode,
      partyName: selectedCase.preliminaryReport.suspectPartyName,
      cctvVideoUrl: cctvUrl,
      cctvTimestampRange: cctvRange,
      notes: cctvNotes,
    });

    setCases(updated);
    setIsCctvModalOpen(false);
    setCctvSubBy('');
    setCctvUrl('');
    setCctvRange('');
    setCctvNotes('');
    showAlert('✅ Đã tiếp nhận bằng chứng giải trình & video CCTV. Ban Giám sát đang thẩm định.');
  };

  // Action: Resolve as Found in Warehouse
  const handleResolveFound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !foundLocation.trim() || !foundOperator.trim()) {
      alert('Vui lòng nhập vị trí tìm thấy và tên nhân sự xử lý.');
      return;
    }

    const updated = resolveAsFound(selectedCase.id, {
      foundLocation,
      resolutionNote: foundNotes,
      operator: foundOperator,
    });

    setCases(updated);
    setIsFoundModalOpen(false);
    setFoundLocation('');
    setFoundNotes('');
    setFoundOperator('');
    showAlert(
      `🎉 Xuất sắc! Đã giải cứu đơn hàng ${selectedCase.shipmentCode}. Kiện hàng đã được hoàn kho và xuất tiếp, tiết kiệm ${formatVND(selectedCase.declaredValue)} tiền bồi hoàn!`,
    );
  };

  // Action: Escalate to Compensation Claim
  const handleEscalateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !adjName.trim()) {
      alert('Vui lòng nhập tên người phán quyết.');
      return;
    }

    const { updatedInvestigations, createdClaim } = escalateToCompensationClaim(selectedCase.id, {
      adjudicator: adjName,
      finalNotes: adjNotes,
    });

    setCases(updatedInvestigations);
    setIsEscalateModalOpen(false);
    setAdjNotes('');
    showAlert(
      `⚖️ Đã hoàn tất phán quyết trách nhiệm! Tự động tạo Hồ sơ bồi thường ${createdClaim.claimCode} cho đơn ${createdClaim.shipmentCode}.`,
    );
  };

  // Action: Extend 12h Hearing Deadline
  const handleExtendDeadline = () => {
    if (!selectedCase) return;
    const updated = extendHearingDeadline(selectedCase.id, 12);
    setCases(updated);
    showAlert('⏱️ Đã gia hạn thêm 12 giờ giải trình cho đơn vị theo yêu cầu trích xuất CCTV.');
  };

  const remaining = calculateRemainingHours(selectedCase?.hearingDeadlineAt);

  return (
    <div className="investigation-page">
      {/* Header */}
      <div className="investigation-header">
        <div className="investigation-title-box">
          <h1>🕵️ Trung Tâm Giám Định Đơn Lạc & Phân Tích Vết Quét</h1>
          <p>
            Trợ lý AI đọc và rà soát lịch sử log thao tác, tự động bắt điểm đứt gãy hành trình, đánh giá đơn vị tình nghi và kích hoạt quy trình giải trình 24h trước khi quy trách nhiệm bồi thường.
          </p>
        </div>
        <div className="investigation-actions">
          <button type="button" className="btn-auto-scan" onClick={handleAutoScan}>
            ⚡ Quét Đơn Mất Tín Hiệu Toàn Mạng
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {alertMessage && (
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1e40af',
            padding: '12px 18px',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: 600,
          }}
        >
          {alertMessage}
        </div>
      )}

      {/* KPI Banner */}
      <div className="investigation-kpi-grid">
        <div className="inv-kpi-card active-cases">
          <div className="inv-kpi-icon blue">🔎</div>
          <div className="inv-kpi-info">
            <div className="inv-kpi-label">Tổng Vụ Việc Đang Xử Lý</div>
            <div className="inv-kpi-value">{kpis.total} hồ sơ</div>
            <div className="inv-kpi-sub">Theo dõi mất tín hiệu &amp; nghi vấn thất lạc</div>
          </div>
        </div>

        <div className="inv-kpi-card hearing">
          <div className="inv-kpi-icon amber">⏳</div>
          <div className="inv-kpi-info">
            <div className="inv-kpi-label">Đang Mở Giải Trình 24h</div>
            <div className="inv-kpi-value">{kpis.inHearing} vụ việc</div>
            <div className="inv-kpi-sub">Chờ Hub/Tài xế trích xuất camera CCTV</div>
          </div>
        </div>

        <div className="inv-kpi-card found-rate">
          <div className="inv-kpi-icon green">🎯</div>
          <div className="inv-kpi-info">
            <div className="inv-kpi-label">Tỷ Lệ Tìm Thấy Hàng (Cứu Đơn)</div>
            <div className="inv-kpi-value">{kpis.foundRate}%</div>
            <div className="inv-kpi-sub">Đã tiết kiệm {formatVND(kpis.moneySaved)} đền bù</div>
          </div>
        </div>

        <div className="inv-kpi-card escalated">
          <div className="inv-kpi-icon red">⚖️</div>
          <div className="inv-kpi-info">
            <div className="inv-kpi-label">Đã Chuyển Phán Quyết Bồi Thường</div>
            <div className="inv-kpi-value">{kpis.escalated} hồ sơ</div>
            <div className="inv-kpi-sub">Hết hạn giải trình &amp; xác nhận chế tài</div>
          </div>
        </div>
      </div>

      {/* Master-Detail Workbench */}
      <div className="investigation-workbench-grid">
        {/* Left Column: Master List */}
        <div className="investigation-list-panel">
          <div className="panel-header-sticky">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                Danh Sách Hồ Sơ Giám Định ({filteredCases.length})
              </span>
            </div>

            <div className="search-and-status-row">
              <input
                type="text"
                className="inv-search-input"
                placeholder="Tìm mã hồ sơ, mã đơn, khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="inv-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả</option>
                <option value="IN_HEARING">Chờ giải trình</option>
                <option value="PRELIMINARY_REPORT">Báo cáo sơ bộ</option>
                <option value="RESOLVED_FOUND">Đã tìm thấy</option>
                <option value="ESCALATED_TO_CLAIM">Chuyển bồi thường</option>
              </select>
            </div>
          </div>

          <div className="investigation-items-scroll">
            {filteredCases.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>
                Không tìm thấy hồ sơ nào phù hợp.
              </p>
            ) : (
              filteredCases.map((item) => {
                const isSelected = item.id === selectedCase?.id;
                return (
                  <div
                    key={item.id}
                    className={`inv-item-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedCaseId(item.id)}
                  >
                    <div className="inv-item-top">
                      <span className="inv-code">{item.investigationCode}</span>
                      <span className={`badge-status ${item.status}`}>
                        {INVESTIGATION_STATUS_LABELS[item.status]}
                      </span>
                    </div>

                    <div className="inv-item-shipment">
                      <strong style={{ color: '#2563eb' }}>{item.shipmentCode}</strong>
                      <span style={{ color: '#b91c1c', fontWeight: 600 }}>
                        {formatVND(item.declaredValue)}
                      </span>
                    </div>

                    <div className="inv-item-route">
                      {item.originHubCode} ➔ {item.destinationHubCode} | {item.customerName}
                    </div>

                    <div className="inv-item-breakpoint">
                      ⚠️ {BREAK_POINT_LABELS[item.breakPointType]}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detail Workspace */}
        {selectedCase ? (
          <div className="investigation-workspace">
            {/* Header bar */}
            <div className="workspace-header-bar">
              <div className="ws-case-info">
                <h2>
                  🔍 Hồ Sơ Giám Định: {selectedCase.investigationCode} — Mã Đơn:{' '}
                  <span style={{ color: '#2563eb' }}>{selectedCase.shipmentCode}</span>
                </h2>
                <div className="ws-case-meta">
                  <span>🏢 Tuyến: <strong>{selectedCase.originHubName} ➔ {selectedCase.destinationHubName}</strong></span>
                  <span>📦 Hàng: <strong>{selectedCase.packageDescription}</strong> ({selectedCase.declaredWeightKg} kg)</span>
                  <span>💰 Khai giá: <strong style={{ color: '#dc2626' }}>{formatVND(selectedCase.declaredValue)}</strong></span>
                </div>
              </div>

              <span className={`badge-status ${selectedCase.status}`} style={{ fontSize: '13px', padding: '6px 12px' }}>
                {INVESTIGATION_STATUS_LABELS[selectedCase.status]}
              </span>
            </div>

            {/* 24-Hour Hearing Banner (when IN_HEARING) */}
            {selectedCase.status === 'IN_HEARING' && (
              <div className="hearing-countdown-banner">
                <div className="hearing-left">
                  <span className="hearing-clock-icon">⏰</span>
                  <div className="hearing-text">
                    <h4>CỬA SỔ GIẢI TRÌNH &amp; PHẢN BIỆN (24-HOUR DISPUTE HEARING)</h4>
                    <p>
                      Đang cho phép đơn vị bị tình nghi (<strong>{selectedCase.preliminaryReport.suspectPartyName}</strong>) trích xuất video camera CCTV hoặc nộp biên bản bàn giao phản biện trước khi phán quyết chính thức.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="hearing-countdown-tag">
                    ⏳ {remaining.text}
                  </div>
                  <button
                    type="button"
                    onClick={handleExtendDeadline}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title="Gia hạn thêm 12h trích xuất CCTV"
                  >
                    +12h
                  </button>
                </div>
              </div>
            )}

            {/* Success Banner if Resolved Found */}
            {selectedCase.status === 'RESOLVED_FOUND' && (
              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#065f46',
                }}
              >
                <span style={{ fontSize: '24px' }}>🎉</span>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 700 }}>
                    ĐÃ GIẢI CỨU ĐƠN HÀNG THÀNH CÔNG!
                  </h4>
                  <p style={{ margin: 0, fontSize: '12.5px' }}>
                    Vị trí tìm thấy: <strong>{selectedCase.foundLocation}</strong>. Đã bàn giao tiếp tục vận chuyển, bảo toàn 100% giá trị hàng hóa mà không phát sinh bồi thường.
                  </p>
                </div>
              </div>
            )}

            {/* Escalated Banner if Claim was created */}
            {selectedCase.status === 'ESCALATED_TO_CLAIM' && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: '#991b1b',
                }}
              >
                <span style={{ fontSize: '24px' }}>⚖️</span>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 700 }}>
                    ĐÃ KẾT LUẬN PHÁN QUYẾT &amp; CHUYỂN BỒI THƯỜNG
                  </h4>
                  <p style={{ margin: 0, fontSize: '12.5px' }}>
                    Hồ sơ bồi thường liên kết: <strong>{selectedCase.linkedClaimCode}</strong>. Đơn vị phải chịu chế tài: <strong>{selectedCase.preliminaryReport.suspectPartyName}</strong> (100%).
                  </p>
                </div>
              </div>
            )}

            {/* Preliminary Investigation Report */}
            <div>
              <h3 className="ws-section-title">📑 Báo Cáo Giám Định Sơ Bộ (AI &amp; Audit Engine)</h3>
              <div className="preliminary-report-box">
                <div className="report-summary-grid">
                  <div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
                      ĐIỂM ĐỨT GÃY PHÁT HIỆN:
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>
                      ⚠️ {BREAK_POINT_LABELS[selectedCase.breakPointType]}
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                      {selectedCase.preliminaryReport.breakPointDescription}
                    </p>
                  </div>

                  <div className="report-suspect-card">
                    <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                      ĐƠN VỊ TÌNH NGHI SỐ 1
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>
                      {selectedCase.preliminaryReport.suspectPartyName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Độ tin cậy: <strong style={{ color: '#ef4444' }}>{selectedCase.preliminaryReport.confidenceScorePercent}%</strong>
                    </div>
                    <div className="confidence-meter">
                      <div className="confidence-bar-bg">
                        <div
                          className="confidence-bar-fill"
                          style={{ width: `${selectedCase.preliminaryReport.confidenceScorePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Căn cứ và chứng cứ phân tích:
                  </div>
                  <ul className="supporting-list">
                    {selectedCase.preliminaryReport.supportingEvidences.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Domino Visual Audit Timeline */}
            <div>
              <h3 className="ws-section-title">⏱️ Chuỗi Vết Quét Thao Tác (Audit Trail Timeline)</h3>
              <div className="audit-timeline-container">
                {selectedCase.auditTrail.map((scan) => (
                  <div
                    key={scan.id}
                    className={`audit-step-node ${scan.isBreakPoint ? 'is-break-point' : ''}`}
                  >
                    <div className="audit-step-top">
                      <span className="audit-step-action">{scan.action}</span>
                      <span className="audit-step-time">{new Date(scan.timestamp).toLocaleString('vi-VN')}</span>
                    </div>

                    <div className="audit-step-meta">
                      <span>📍 Địa điểm: <strong>{scan.locationName} ({scan.locationCode})</strong></span>
                      <span>👤 Nhân sự: <strong>{scan.operator}</strong></span>
                      {scan.recordedWeightKg && (
                        <span>⚖️ Cân nặng: <strong>{scan.recordedWeightKg} kg</strong></span>
                      )}
                      {scan.bagCode && (
                        <span>🏷️ Mã bao: <strong>{scan.bagCode}</strong></span>
                      )}
                      {scan.sealNumber && (
                        <span>🔒 Kẹp chì: <strong>{scan.sealNumber}</strong></span>
                      )}
                    </div>

                    {scan.anomalyNote && (
                      <div className="audit-anomaly-tag">
                        ⚠️ {scan.anomalyNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dispute & CCTV Evidences */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 className="ws-section-title" style={{ margin: 0 }}>
                  📹 Bằng Chứng Phản Biện &amp; Video Camera CCTV ({selectedCase.disputeEvidences.length})
                </h3>
                {selectedCase.status === 'IN_HEARING' && (
                  <button
                    type="button"
                    className="btn-submit-cctv"
                    onClick={() => setIsCctvModalOpen(true)}
                  >
                    + Nộp Video CCTV / Biên Bản Phản Biện
                  </button>
                )}
              </div>

              {selectedCase.disputeEvidences.length === 0 ? (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '13px' }}>
                  Chưa có bằng chứng phản biện từ phía đơn vị. Đang đợi nộp trong thời hạn giải trình.
                </div>
              ) : (
                <div className="dispute-evidence-section">
                  {selectedCase.disputeEvidences.map((dsp) => (
                    <div key={dsp.id} className="evidence-list-item">
                      <div className="evidence-top">
                        <span>
                          👤 Người nộp: <strong>{dsp.submittedBy}</strong> ({dsp.partyName})
                        </span>
                        <span style={{ color: '#64748b' }}>
                          {new Date(dsp.submittedAt).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      {dsp.cctvTimestampRange && (
                        <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 600 }}>
                          ⏱️ Khung giờ trích xuất camera: {dsp.cctvTimestampRange}
                        </div>
                      )}

                      <div style={{ fontSize: '13px', color: '#334155' }}>
                        &quot;{dsp.notes}&quot;
                      </div>

                      {dsp.cctvVideoUrl && (
                        <div>
                          <a
                            href={dsp.cctvVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="evidence-link-btn"
                          >
                            🎥 Mở xem Video Camera CCTV bàn dỡ trích xuất ↗
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="ws-action-bar">
              {selectedCase.status !== 'RESOLVED_FOUND' && selectedCase.status !== 'ESCALATED_TO_CLAIM' && (
                <>
                  <button
                    type="button"
                    className="btn-resolve-found"
                    onClick={() => setIsFoundModalOpen(true)}
                  >
                    ✅ Đã Tìm Thấy Hàng Trong Kho (Cứu Đơn)
                  </button>
                  <button
                    type="button"
                    className="btn-escalate-claim"
                    onClick={() => setIsEscalateModalOpen(true)}
                  >
                    ⚖️ Xác Nhận Phán Quyết &amp; Chuyển Bồi Thường
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* MODAL 1: Submit CCTV / Dispute Evidence */}
      {isCctvModalOpen && (
        <div className="inv-modal-overlay" onClick={() => setIsCctvModalOpen(false)}>
          <div className="inv-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>📹 Nộp Bằng Chứng CCTV / Biên Bản Phản Biện</h3>
              <button
                type="button"
                onClick={() => setIsCctvModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitCctv}>
              <div className="inv-modal-body">
                <div className="inv-form-group">
                  <label>Họ và tên người nộp / Chức vụ (*):</label>
                  <input
                    type="text"
                    className="inv-form-input"
                    placeholder="VD: Nguyễn Tấn Dũng (Thủ kho Trưởng Hub ĐN01)"
                    value={cctvSubBy}
                    onChange={(e) => setCctvSubBy(e.target.value)}
                    required
                  />
                </div>

                <div className="inv-form-group">
                  <label>Link Video trích xuất Camera CCTV bàn dỡ / xe tải:</label>
                  <input
                    type="url"
                    className="inv-form-input"
                    placeholder="https://drive.google.com/file/d/... hoặc link nội bộ"
                    value={cctvUrl}
                    onChange={(e) => setCctvUrl(e.target.value)}
                  />
                </div>

                <div className="inv-form-group">
                  <label>Khung giờ trích xuất camera:</label>
                  <input
                    type="text"
                    className="inv-form-input"
                    placeholder="VD: Góc quay cửa số 2 từ 02:10 đến 02:45 ngày 07/09"
                    value={cctvRange}
                    onChange={(e) => setCctvRange(e.target.value)}
                  />
                </div>

                <div className="inv-form-group">
                  <label>Nội dung giải trình phản biện (*):</label>
                  <textarea
                    className="inv-form-textarea"
                    rows={4}
                    placeholder="Mô tả bằng chứng chứng minh đơn vị không làm mất hàng (VD: camera cho thấy bao tải đã được chuyển lên xe tuyến tiếp theo...)"
                    value={cctvNotes}
                    onChange={(e) => setCctvNotes(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="inv-modal-footer">
                <button
                  type="button"
                  className="btn-submit-cctv"
                  onClick={() => setIsCctvModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-auto-scan">
                  Gửi Bằng Chứng Thẩm Định
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Resolve as Found in Warehouse */}
      {isFoundModalOpen && (
        <div className="inv-modal-overlay" onClick={() => setIsFoundModalOpen(false)}>
          <div className="inv-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>🎉 Xác Nhận Đã Tìm Thấy Hàng (Hoàn Kho &amp; Cứu Đơn)</h3>
              <button
                type="button"
                onClick={() => setIsFoundModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleResolveFound}>
              <div className="inv-modal-body">
                <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#065f46' }}>
                  Xác nhận tìm thấy hàng sẽ đóng hồ sơ điều tra, hủy cảnh báo bồi thường và hoàn trả hàng về luồng phát bình thường.
                </div>

                <div className="inv-form-group">
                  <label>Vị trí cụ thể tìm thấy hàng (*):</label>
                  <input
                    type="text"
                    className="inv-form-input"
                    placeholder="VD: Sau chân kệ Pallet Khu E4 hoặc Góc băng chuyền số 2"
                    value={foundLocation}
                    onChange={(e) => setFoundLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="inv-form-group">
                  <label>Người tìm thấy / Xác nhận (*):</label>
                  <input
                    type="text"
                    className="inv-form-input"
                    placeholder="VD: Phạm Văn Nam (Thủ kho Trưởng)"
                    value={foundOperator}
                    onChange={(e) => setFoundOperator(e.target.value)}
                    required
                  />
                </div>

                <div className="inv-form-group">
                  <label>Ghi chú hiện trạng hàng hóa:</label>
                  <textarea
                    className="inv-form-textarea"
                    rows={3}
                    placeholder="VD: Hàng còn nguyên seal túi khí, không bể vỡ, tiếp tục xuất kho đi giao..."
                    value={foundNotes}
                    onChange={(e) => setFoundNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="inv-modal-footer">
                <button
                  type="button"
                  className="btn-submit-cctv"
                  onClick={() => setIsFoundModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-resolve-found">
                  Xác Nhận Hoàn Kho &amp; Đóng Hồ Sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Escalate to Compensation Claim */}
      {isEscalateModalOpen && (
        <div className="inv-modal-overlay" onClick={() => setIsEscalateModalOpen(false)}>
          <div className="inv-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3>⚖️ Xác Nhận Phán Quyết &amp; Chuyển Sang Bồi Thường</h3>
              <button
                type="button"
                onClick={() => setIsEscalateModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEscalateClaim}>
              <div className="inv-modal-body">
                <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#991b1b' }}>
                  Hệ thống sẽ tạo tự động một <strong>Hồ sơ Bồi thường (Compensation Claim)</strong> mới, gán trách nhiệm 100% cho <strong>{selectedCase?.preliminaryReport.suspectPartyName}</strong> với số tiền phạt <strong>{formatVND(selectedCase?.preliminaryReport.suggestedCompensationAmount || 0)}</strong>.
                </div>

                <div className="inv-form-group">
                  <label>Cán bộ QA / Trưởng ban Vận hành phán quyết (*):</label>
                  <input
                    type="text"
                    className="inv-form-input"
                    value={adjName}
                    onChange={(e) => setAdjName(e.target.value)}
                    required
                  />
                </div>

                <div className="inv-form-group">
                  <label>Ghi chú kết luận phán quyết:</label>
                  <textarea
                    className="inv-form-textarea"
                    rows={4}
                    placeholder="Kết thúc 24h giải trình, đơn vị không cung cấp được video camera bàn giao. Phán quyết đơn vị chịu 100% chi phí đền bù theo quy chế SOP."
                    value={adjNotes}
                    onChange={(e) => setAdjNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="inv-modal-footer">
                <button
                  type="button"
                  className="btn-submit-cctv"
                  onClick={() => setIsEscalateModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-escalate-claim">
                  Ký Phán Quyết &amp; Tạo Hồ Sơ Bồi Thường
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrayShipmentInvestigationPage;

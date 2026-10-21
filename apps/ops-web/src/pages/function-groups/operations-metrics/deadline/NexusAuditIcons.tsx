import React from 'react';

/**
 * NEXUS Operations Metrics Proprietary Vector Icon Suite
 * Purpose-built for 22:00 shift audits, inventory deficit tracking, and last-actor accountability.
 */

export interface NexusAuditIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * NEXUS Courier Motorbike Icon (Bưu tá giao nhận 2 bánh)
 * Custom carrier motorbike with rear dispatch cargo box and aerodynamic windscreen.
 */
export function NexusCourierMotorbikeIcon({
  size = 16,
  className = '',
  style,
}: NexusAuditIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', display: 'inline-block', ...style }}
      aria-hidden="true"
    >
      {/* Front & Rear Wheels */}
      <circle cx="5" cy="17" r="3" strokeWidth="2" />
      <circle cx="19" cy="17" r="3" strokeWidth="2" />
      <circle cx="5" cy="17" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="17" r="1" fill="currentColor" stroke="none" />
      {/* Chassis & Fork */}
      <path d="M5 17l4.5-5.5h4l2.5 5.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 17l-3-8h-3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Handlebar & Windshield */}
      <line x1="13" y1="9" x2="16" y2="6.5" strokeWidth="2" strokeLinecap="round" />
      {/* Courier Delivery Box on Rear Rack */}
      <rect x="2.5" y="8" width="5" height="5" rx="1" strokeWidth="1.8" />
      <line x1="2.5" y1="10.5" x2="7.5" y2="10.5" strokeWidth="1.2" />
    </svg>
  );
}

/**
 * NEXUS Warehouse Audit Scanner Icon (Thao tác kho & Máy quét kiểm tồn PDA)
 * Optical barcode reader emitting target scan beam on inventory rack.
 */
export function NexusWarehouseScanIcon({
  size = 16,
  className = '',
  style,
}: NexusAuditIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', display: 'inline-block', ...style }}
      aria-hidden="true"
    >
      {/* Handheld Terminal PDA */}
      <rect x="6" y="3" width="12" height="18" rx="2.5" strokeWidth="2" />
      {/* Scanner Screen */}
      <rect x="8.5" y="5.5" width="7" height="6" rx="1" strokeWidth="1.4" />
      {/* Scan Trigger Key & Keypad */}
      <circle cx="12" cy="15" r="1.5" strokeWidth="1.5" fill="currentColor" />
      <line x1="9" y1="18.5" x2="15" y2="18.5" strokeWidth="1.4" strokeLinecap="round" />
      {/* Optical Scan Rays */}
      <line x1="3" y1="6" x2="5" y2="6" strokeWidth="2" strokeLinecap="round" />
      <line x1="19" y1="6" x2="21" y2="6" strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="8" x2="4.5" y2="8" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="19.5" y1="8" x2="21" y2="8" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * NEXUS Dispatch Phone Icon (Liên hệ khẩn cấp bưu tá/điều phối)
 * Field telecommunication handset with transmission waves.
 */
export function NexusDispatchPhoneIcon({
  size = 14,
  className = '',
  style,
}: NexusAuditIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', display: 'inline-block', ...style }}
      aria-hidden="true"
    >
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * NEXUS Audit Deficit Warning Icon (Đơn kiểm thiếu chốt ca 22:00)
 */
export function NexusAuditDeficitIcon({
  size = 14,
  className = '',
  style,
}: NexusAuditIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', display: 'inline-block', ...style }}
      aria-hidden="true"
    >
      <path d="M12 2.5l9.5 16.5a1.5 1.5 0 0 1-1.3 2.2H3.8a1.5 1.5 0 0 1-1.3-2.2L12 2.5z" strokeWidth="2.2" strokeLinejoin="round" />
      <line x1="12" y1="8.5" x2="12" y2="13.5" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * NEXUS Audit Verified Icon (Đã kiểm tồn thành công)
 */
export function NexusAuditVerifiedIcon({
  size = 14,
  className = '',
  style,
}: NexusAuditIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', display: 'inline-block', ...style }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" strokeWidth="2.2" />
      <polyline points="7.5 12 10.5 15 16.5 9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

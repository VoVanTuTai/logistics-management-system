import React from 'react';

/**
 * NEXUS Logistics Proprietary Vector Icon Suite
 * Purpose-built for carrier operations, cashflow custody, freight tariffs, and branch reconciliation.
 * Replaces generic stock icons and emojis with high-contrast, precision-crafted brand vectors.
 */

export interface NexusIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * NEXUS Circular Exclamation Intel Icon (!)
 * Specially designed proprietary circular exclamation mark badge with 4-cardinal orientation ticks,
 * an active telemetry corner node, a dynamic tapered chisel lance, and a precision diamond base anchor.
 */
export function NexusInfoCircleIcon({ size = 15, className = '', style }: NexusIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      {/* Outer circular bezel */}
      <circle cx="12" cy="12" r="9.2" strokeWidth="2.2" />
      {/* Top-right active telemetry indicator dot */}
      <circle cx="18.5" cy="5.5" r="1.3" fill="currentColor" stroke="none" />
      {/* Cardinal orientation calibration ticks */}
      <line x1="12" y1="1.5" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="21" x2="12" y2="22.5" strokeWidth="2" strokeLinecap="round" />
      {/* Dynamic tapered vertical exclamation stylus */}
      <path d="M12 6.8v6.2" strokeWidth="2.6" strokeLinecap="round" />
      {/* Base diamond rhombus anchor */}
      <polygon points="12,15.3 13.5,16.8 12,18.3 10.5,16.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * NEXUS COD Vault Icon (Tiền thu hộ COD - Fiduciary Escrow Vault)
 * Heavy-duty armored logistics safe with combination dial, deadbolts, and security rivets,
 * emphasizing that COD is fiduciary merchant funds held in escrow, distinct from revenue.
 */
export function NexusCodVaultIcon({ size = 20, className = '', style }: NexusIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      {/* Armored safe outer body */}
      <rect x="2.5" y="3" width="19" height="18" rx="3.5" strokeWidth="2.2" />
      {/* Top & bottom armor reinforcement rules */}
      <line x1="2.5" y1="7" x2="21.5" y2="7" strokeWidth="1.2" strokeOpacity="0.6" />
      <line x1="2.5" y1="17" x2="21.5" y2="17" strokeWidth="1.2" strokeOpacity="0.6" />
      {/* Corner security rivets */}
      <circle cx="5.5" cy="5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="19" r="0.8" fill="currentColor" stroke="none" />
      {/* Rotary combination lock dial */}
      <circle cx="12" cy="12" r="4" strokeWidth="2" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      {/* Dial crosshair calibration ticks */}
      <line x1="12" y1="6.5" x2="12" y2="8.5" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="15.5" x2="12" y2="17.5" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="6.5" y1="12" x2="8.5" y2="12" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="15.5" y1="12" x2="17.5" y2="12" strokeWidth="1.8" strokeLinecap="round" />
      {/* Locking deadbolts protruding on right door jamb */}
      <path d="M21.5 9.5h-1.5 M21.5 14.5h-1.5" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * NEXUS Freight Transit Icon (Cước dịch vụ bưu chính - Linehaul Heavy Container Express)
 * Commercial heavy prime-mover container truck with high-cube aerodynamic roof deflector,
 * ISO corrugated container ribs, and tandem drive axles, representing carrier linehaul revenue.
 */
export function NexusFreightTransitIcon({ size = 20, className = '', style }: NexusIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      {/* Aerodynamic tractor cab with sloped express windscreen */}
      <path d="M13.5 7.5h5l3.2 4v5.5h-8.2v-9.5z" strokeWidth="2" strokeLinejoin="round" />
      {/* Windshield cut */}
      <path d="M15 9.5h3.2l2 2.5h-5.2v-2.5z" strokeWidth="1.4" strokeLinejoin="round" />
      {/* ISO shipping container trailer */}
      <rect x="1.5" y="5" width="12" height="12" rx="1.5" strokeWidth="2.2" />
      {/* Container corrugated reinforcement ribs */}
      <line x1="4.5" y1="5" x2="4.5" y2="17" strokeWidth="1.3" strokeOpacity="0.6" />
      <line x1="7.5" y1="5" x2="7.5" y2="17" strokeWidth="1.3" strokeOpacity="0.6" />
      <line x1="10.5" y1="5" x2="10.5" y2="17" strokeWidth="1.3" strokeOpacity="0.6" />
      {/* Triple heavy-duty wheel assemblies with central axle hubs */}
      <circle cx="4.8" cy="18.5" r="2.2" strokeWidth="2" />
      <circle cx="9.2" cy="18.5" r="2.2" strokeWidth="2" />
      <circle cx="18.5" cy="18.5" r="2.2" strokeWidth="2" />
      <circle cx="4.8" cy="18.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="9.2" cy="18.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="18.5" r="0.75" fill="currentColor" stroke="none" />
      {/* Forward momentum velocity line */}
      <line x1="19.5" y1="13.5" x2="22.5" y2="13.5" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * NEXUS Branch Ledger Icon (Tổng công nợ phải thu - Accounts Receivable & Fiduciary Balance)
 * Double-entry accounting register dossier with industrial mechanical spine rings,
 * split debit/credit audit columns, and double-underline balance summation.
 */
export function NexusBranchLedgerIcon({ size = 20, className = '', style }: NexusIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      {/* Ledger folio chassis */}
      <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" strokeWidth="2.2" />
      {/* Binder margin spine */}
      <line x1="8.5" y1="3" x2="8.5" y2="21" strokeWidth="1.8" />
      {/* Mechanical binder rings on left spine */}
      <path d="M2.5 6.5h2.5 M2.5 12h2.5 M2.5 17.5h2.5" strokeWidth="2.4" strokeLinecap="round" />
      {/* Debit / Credit column divider */}
      <line x1="14.5" y1="6.5" x2="14.5" y2="15" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
      {/* Debit / Credit transaction items */}
      <line x1="10.5" y1="8" x2="13" y2="8" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="8" x2="18.5" y2="8" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="10.5" y1="11" x2="13" y2="11" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="11" x2="18.5" y2="11" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="10.5" y1="14" x2="12.5" y2="14" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="14" x2="18.5" y2="14" strokeWidth="1.8" strokeLinecap="round" />
      {/* Double balance summary underline */}
      <line x1="10.5" y1="17.2" x2="18.5" y2="17.2" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="10.5" y1="19.2" x2="18.5" y2="19.2" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * NEXUS Net Settlement Icon (Thực chuyển ròng Shop - Two-Way Dynamic Net Clearance Engine)
 * Dual opposing clearance orbits meeting at a central calibrated diamond delta equilibrium node,
 * demonstrating direct automated netting: Shop Payout = COD Inflows - Shipping Outflows.
 */
export function NexusNetSettlementIcon({ size = 20, className = '', style }: NexusIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      {/* Upper clearance flow (COD Inflow curving right) */}
      <path d="M4 9.5C4 6.5 6.5 4 10 4h5" strokeWidth="2.2" strokeLinecap="round" />
      <polyline points="13 1.5 17.5 4 13 6.5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Lower clearance flow (Tariff deduction curving left) */}
      <path d="M20 14.5c0 3-2.5 5.5-6 5.5h-5" strokeWidth="2.2" strokeLinecap="round" />
      <polyline points="11 22.5 6.5 20 11 17.5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Center diamond delta equilibrium node */}
      <polygon points="12,8.5 15.5,12 12,15.5 8.5,12" strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * NEXUS Audit Shield Icon (Chênh lệch & Kiểm soát rủi ro tài chính)
 * Tactical carrier crest with calibrated balance scale:
 * - When isMatched: horizontal balanced scale with twin balanced pans and verified checkmark.
 * - When discrepancy: tilted scale beam with hazard alert core.
 */
export function NexusAuditShieldIcon({
  isMatched = true,
  size = 20,
  className = '',
  style,
}: NexusIconProps & { isMatched?: boolean }): React.JSX.Element {
  if (isMatched) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className={className}
        style={{ verticalAlign: 'middle', ...style }}
        aria-hidden="true"
      >
        {/* Heraldic risk shield */}
        <path d="M12 2l7.5 3.5v6.5c0 5.2-3.8 9.8-7.5 11-3.7-1.2-7.5-5.8-7.5-11V5.5L12 2z" strokeWidth="2.2" strokeLinejoin="round" />
        {/* Horizontal balanced scale beam */}
        <line x1="7.5" y1="9" x2="16.5" y2="9" strokeWidth="1.8" strokeLinecap="round" />
        {/* Twin balanced pans */}
        <path d="M7.5 9v2.2a1.5 1.5 0 0 0 3 0V9 M13.5 9v2.2a1.5 1.5 0 0 0 3 0V9" strokeWidth="1.4" />
        {/* Verification checkmark */}
        <polyline points="9.5 15 11.5 17 15 13.5" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      {/* Heraldic risk shield */}
      <path d="M12 2l7.5 3.5v6.5c0 5.2-3.8 9.8-7.5 11-3.7-1.2-7.5-5.8-7.5-11V5.5L12 2z" strokeWidth="2.2" strokeLinejoin="round" />
      {/* Tilted unbalanced scale beam */}
      <line x1="7" y1="8" x2="17" y2="11.5" strokeWidth="1.8" strokeLinecap="round" />
      {/* Unbalanced pans */}
      <path d="M7 8v2a1.5 1.5 0 0 0 3 0V8 M14 11.5v2a1.5 1.5 0 0 0 3 0v-2" strokeWidth="1.4" />
      {/* Warning discrepancy exclamation needle */}
      <line x1="12" y1="13.5" x2="12" y2="16.2" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="18.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * NEXUS Book Guide Icon (Cẩm nang Dòng tiền bưu cục)
 * Open carrier operational SOP manual with ribbon bookmark and page index tabs.
 */
export function NexusBookGuideIcon({ size = 16, className = '', style }: NexusIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      {/* Left page block */}
      <path d="M3 4.5C3 3.7 3.7 3 4.5 3h6C11.9 3 12.8 3.6 13 4.5v15c-.2-.9-1.1-1.5-2.5-1.5h-6c-.8 0-1.5.7-1.5 1.5v-15z" strokeWidth="2" strokeLinejoin="round" />
      {/* Right page block */}
      <path d="M21 4.5C21 3.7 20.3 3 19.5 3h-6c-1.4 0-2.3.6-2.5 1.5v15c.2-.9 1.1-1.5 2.5-1.5h6c.8 0 1.5.7 1.5 1.5v-15z" strokeWidth="2" strokeLinejoin="round" />
      {/* Center ribbon bookmark */}
      <path d="M12 4.5v8.5l-1.8-1.5-1.8 1.5V4.5" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2" />
      {/* Page index markers */}
      <line x1="16.5" y1="7.5" x2="19" y2="7.5" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="16.5" y1="10.5" x2="19" y2="10.5" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * NEXUS Export CSV Icon (Xuất bảng kê CSV)
 * Data matrix document sheet with explosive breakout export arrow.
 */
export function NexusExportCsvIcon({ size = 16, className = '', style }: NexusIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      {/* Manifest sheet */}
      <path d="M4 3h10l5 5v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" strokeWidth="2" />
      {/* Fold corner */}
      <polyline points="14 3 14 8 19 8" strokeWidth="1.8" />
      {/* Tabular data rows */}
      <line x1="6" y1="12" x2="12" y2="12" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="6" y1="15" x2="11" y2="15" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="6" y1="18" x2="9" y2="18" strokeWidth="1.6" strokeLinecap="round" />
      {/* Upward export vector */}
      <path d="M17 19v-6m0 0l-2.5 2.5m2.5-2.5l2.5 2.5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * NEXUS Calendar Filter Icon (Kỳ đối soát & Lịch chu kỳ)
 * Fiscal cadence calendar with top spiral binding and recurring settlement markers.
 */
export function NexusCalendarFilterIcon({ size = 16, className = '', style }: NexusIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      {/* Calendar chassis */}
      <rect x="3" y="4" width="18" height="17" rx="3" strokeWidth="2.2" />
      {/* Top spiral rings */}
      <path d="M7 2v4 M12 2v4 M17 2v4" strokeWidth="2.2" strokeLinecap="round" />
      {/* Header divider */}
      <line x1="3" y1="9.5" x2="21" y2="9.5" strokeWidth="1.8" />
      {/* Settlement cadence nodes (T2 - T4 - T6) */}
      <circle cx="7.5" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="7.5" cy="17" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * NEXUS Check Circle Status Icon (Khớp 100%)
 */
export function NexusCheckCircleIcon({ size = 14, className = '', style }: NexusIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9.5" strokeWidth="2.2" />
      <polyline points="7.5 12 10.5 15 16.5 9" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * NEXUS Alert Triangle Icon (Cảnh báo sai lệch)
 */
export function NexusAlertTriangleIcon({ size = 14, className = '', style }: NexusIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      <path d="M12 3l9.5 16.5a1.5 1.5 0 0 1-1.3 2.2H3.8a1.5 1.5 0 0 1-1.3-2.2L12 3z" strokeWidth="2.2" strokeLinejoin="round" />
      <line x1="12" y1="9" x2="12" y2="14" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="17.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * NEXUS Close Icon (Precision Cross)
 */
export function NexusCloseIcon({ size = 16, className = '', style }: NexusIconProps): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      className={className}
      style={{ verticalAlign: 'middle', ...style }}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * NEXUS Protocol Pin Badge (Replaces generic 📌 pushpin emoji)
 * Precision carrier protocol anchor badge with drop point.
 */
export function NexusPinBadge({ size = 16, className = '', style }: NexusIconProps): React.JSX.Element {
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
      <path d="M12 2a4 4 0 0 0-4 4c0 3 4 8 4 8s4-5 4-8a4 4 0 0 0-4-4z" strokeWidth="2.2" />
      <circle cx="12" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <line x1="12" y1="14" x2="12" y2="21" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * NEXUS Insight Pulse Icon (Replaces generic 💡 lightbulb emoji)
 * Faceted clarity prism with radiating energy filaments.
 */
export function NexusInsightPulse({ size = 16, className = '', style }: NexusIconProps): React.JSX.Element {
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
      <path d="M9 18h6 M10 21h4" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 3a6 6 0 0 0-6 6c0 2.2 1.2 4.1 3 5.2V16a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-1.8c1.8-1.1 3-3 3-5.2a6 6 0 0 0-6-6z" strokeWidth="2.2" />
      <line x1="12" y1="7" x2="12" y2="10" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * NEXUS Warning Badge Icon (Replaces generic ⚠️ alert emoji)
 * Hexagonal industrial caution badge with hazard exclamation.
 */
export function NexusWarningBadge({ size = 16, className = '', style }: NexusIconProps): React.JSX.Element {
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
      <path d="M10.3 2.5a2 2 0 0 1 3.4 0l7.8 13.5a2 2 0 0 1-1.7 3H4.2a2 2 0 0 1-1.7-3L10.3 2.5z" strokeWidth="2.2" strokeLinejoin="round" />
      <line x1="12" y1="8.5" x2="12" y2="13" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * NEXUS Flow Arrow Icon (Replaces generic 👉 pointing finger emoji)
 * Dual-chevron directional vector indicator.
 */
export function NexusFlowArrow({ size = 14, className = '', style }: NexusIconProps): React.JSX.Element {
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
      <polyline points="9 6 15 12 9 18" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

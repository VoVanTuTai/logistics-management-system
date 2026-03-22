import React from 'react';

interface MasterdataStatusPillProps {
  isActive: boolean;
}

export function MasterdataStatusPill({
  isActive,
}: MasterdataStatusPillProps): React.JSX.Element {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
        color: isActive ? '#166534' : '#991b1b',
      }}
    >
      {isActive ? 'ACTIVE' : 'INACTIVE'}
    </span>
  );
}

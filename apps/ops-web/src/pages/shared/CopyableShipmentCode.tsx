import React, { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';

import './CopyableShipmentCode.css';

interface CopyableShipmentCodeProps {
  code: string | null | undefined;
  className?: string;
  emptyLabel?: string;
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export function CopyableShipmentCode({
  code,
  className,
  emptyLabel = 'Không có mã',
}: CopyableShipmentCodeProps): React.JSX.Element {
  const normalizedCode = (code ?? '').trim();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  if (!normalizedCode) {
    return <span className={className}>{emptyLabel}</span>;
  }

  return (
    <button
      type="button"
      className={`ops-copy-shipment-code${className ? ` ${className}` : ''}`}
      data-copied={copied ? 'true' : 'false'}
      title={copied ? 'Đã sao chép mã vận đơn' : 'Bấm để sao chép mã vận đơn'}
      aria-label={`Sao chép mã vận đơn ${normalizedCode}`}
      onClick={() => {
        void copyText(normalizedCode).then(() => setCopied(true));
      }}
    >
      <span>{normalizedCode}</span>
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
    </button>
  );
}

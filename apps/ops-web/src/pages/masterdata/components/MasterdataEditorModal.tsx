import React from 'react';

interface MasterdataEditorModalProps {
  open: boolean;
  title: string;
  submitLabel: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
}

export function MasterdataEditorModal({
  open,
  title,
  submitLabel,
  isSubmitting,
  onClose,
  onSubmit,
  children,
}: MasterdataEditorModalProps): React.JSX.Element | null {
  if (!open) {
    return null;
  }

  return (
    <div style={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={styles.modal}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          <button type="button" onClick={onClose} style={styles.closeButton}>
            Đóng
          </button>
        </div>
        <form onSubmit={onSubmit} style={styles.form}>
          <div style={styles.body}>{children}</div>
          <div style={styles.actions}>
            <button type="button" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    padding: 16,
  },
  modal: {
    width: 'min(900px, 100%)',
    maxHeight: '92vh',
    overflow: 'auto',
    borderRadius: 14,
    border: '1px solid #d9def3',
    backgroundColor: '#ffffff',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #e7ebf8',
    padding: '12px 14px',
  },
  title: {
    margin: 0,
    fontSize: 18,
  },
  closeButton: {
    border: '1px solid #d9def3',
    borderRadius: 8,
    padding: '6px 10px',
    backgroundColor: '#ffffff',
  },
  form: {
    display: 'grid',
    gridTemplateRows: '1fr auto',
  },
  body: {
    padding: 14,
    display: 'grid',
    gap: 10,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    borderTop: '1px solid #e7ebf8',
    padding: '10px 14px',
  },
};

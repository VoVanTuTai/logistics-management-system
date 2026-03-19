import React from 'react';

import { useUiStore } from '../store/uiStore';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  const globalError = useUiStore((state) => state.globalError);
  const globalLoading = useUiStore((state) => state.globalLoading);
  const clearGlobalError = useUiStore((state) => state.clearGlobalError);

  return (
    <div style={styles.root}>
      {globalError ? (
        <button type="button" onClick={clearGlobalError} style={styles.errorBanner}>
          {globalError}
        </button>
      ) : null}
      {globalLoading ? <div style={styles.loadingBanner}>{globalLoading}</div> : null}
      <div style={styles.content}>{children}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background:
      '#ffffff',
    color: '#000080',
    fontFamily:
      '"IBM Plex Sans", "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  },
  content: {
    padding: '16px 20px',
  },
  errorBanner: {
    width: '100%',
    border: 'none',
    textAlign: 'left',
    backgroundColor: '#fee2e2',
    color: '#7f1d1d',
    padding: '10px 16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  loadingBanner: {
    backgroundColor: '#eef2ff',
    color: '#000080',
    padding: '8px 16px',
    fontWeight: 600,
  },
};


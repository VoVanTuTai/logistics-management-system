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
    <div className="app-root-shell">
      {globalError ? (
        <button type="button" onClick={clearGlobalError} className="global-banner global-banner-error">
          {globalError}
        </button>
      ) : null}
      {globalLoading ? (
        <div className="global-banner global-banner-info">{globalLoading}</div>
      ) : null}
      <div className="app-root-content">{children}</div>
    </div>
  );
}

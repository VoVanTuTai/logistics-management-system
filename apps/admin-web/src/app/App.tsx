import React, { useEffect } from 'react';

import { AppProviders } from './AppProviders';
import { AppRouter } from './AppRouter';
import { AppShell } from './AppShell';
import { hydrateAuthSession } from '../features/auth/auth.session';
import { useUiStore } from '../store/uiStore';

export function App(): React.JSX.Element {
  const setGlobalError = useUiStore((state) => state.setGlobalError);

  useEffect(() => {
    void hydrateAuthSession().catch((error) => {
      setGlobalError(
        error instanceof Error ? error.message : 'Cannot restore login session.',
      );
    });
  }, [setGlobalError]);

  return (
    <AppProviders>
      <AppShell>
        <AppRouter />
      </AppShell>
    </AppProviders>
  );
}

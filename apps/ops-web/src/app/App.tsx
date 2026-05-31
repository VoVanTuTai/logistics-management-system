import React, { Component, useEffect } from 'react';

import { AppProviders } from './AppProviders';
import { AppShell } from './AppShell';
import { AppRouter } from './AppRouter';
import {
  hydrateAuthSession,
  subscribeToAuthSessionStorage,
} from '../features/auth/auth.session';
import { useUiStore } from '../store/uiStore';

interface AppErrorBoundaryState {
  error: Error | null;
}

class AppErrorBoundary extends Component<
  { children: React.ReactNode },
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      error,
    };
  }

  componentDidCatch(error: Error): void {
    console.error(error);
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div className="app-crash">
          <div className="app-crash__panel">
            <h1>Không thể tải Ops Web</h1>
            <p>{this.state.error.message}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function App(): React.JSX.Element {
  const setGlobalError = useUiStore((state) => state.setGlobalError);

  useEffect(() => {
    void hydrateAuthSession().catch((error) => {
      setGlobalError(
        error instanceof Error ? error.message : 'Không thể khôi phục phiên đăng nhập.',
      );
    });

    return subscribeToAuthSessionStorage();
  }, [setGlobalError]);

  return (
    <AppErrorBoundary>
      <AppProviders>
        <AppShell>
          <AppRouter />
        </AppShell>
      </AppProviders>
    </AppErrorBoundary>
  );
}

import React, { useEffect } from 'react';

import { AppProviders } from './AppProviders';
import { AppRouter } from './AppRouter';
import { AppShell } from './AppShell';
import { hydrateAuthSession } from '../features/auth/auth.session';
import { useUiStore } from '../store/uiStore';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  errorMessage: string | null;
}

class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    errorMessage: null,
  };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Ứng dụng admin gặp lỗi khi hiển thị.',
    };
  }

  render(): React.ReactNode {
    if (this.state.errorMessage) {
      return (
        <main className="admin-crash-screen">
          <section className="admin-crash-card">
            <p className="admin-dashboard-kicker">Admin web</p>
            <h1>Không thể hiển thị trang quản trị</h1>
            <p>{this.state.errorMessage}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Tải lại trang
            </button>
          </section>
        </main>
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
        error instanceof Error ? error.message : 'Cannot restore login session.',
      );
    });
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

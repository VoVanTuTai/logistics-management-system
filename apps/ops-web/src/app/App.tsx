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
      const msg = this.state.error.message || '';
      const isChunkError =
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Loading chunk') ||
        msg.includes('Importing a module script failed') ||
        this.state.error.name === 'ChunkLoadError';

      if (isChunkError) {
        return (
          <div
            className="app-crash"
            style={{
              display: 'flex',
              minHeight: '100vh',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              background: '#f8fafc',
            }}
          >
            <div
              style={{
                maxWidth: 460,
                width: '100%',
                background: '#ffffff',
                borderRadius: 14,
                padding: '32px 28px',
                boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
                textAlign: 'center',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                Hệ thống vừa cập nhật phiên bản mới
              </h2>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 20 }}>
                Hệ thống vận hành vừa được phát hành phiên bản mới. Vui lòng tải lại trang để nạp các tài nguyên mới nhất.
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                }}
              >
                Tải lại trang ngay (F5)
              </button>
            </div>
          </div>
        );
      }

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

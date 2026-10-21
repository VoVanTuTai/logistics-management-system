import React from 'react';
import { createRoot } from 'react-dom/client';

import { BootstrapApp } from './app/bootstrap';
import './app/theme.css';

// Automatically handle Vite dynamic import chunk failures when a new production version is deployed
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    const storageKey = 'ops_vite_preload_reload';
    const lastReload = sessionStorage.getItem(storageKey);
    const now = Date.now();

    if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
      sessionStorage.setItem(storageKey, String(now));
      console.warn('[VitePreload] Detected new version deployment. Reloading...');
      window.location.reload();
    }
  });
}

const rootNode = document.getElementById('root');

if (!rootNode) {
  throw new Error('Không tìm thấy phần tử root');
}

createRoot(rootNode).render(
  <React.StrictMode>
    <BootstrapApp />
  </React.StrictMode>,
);

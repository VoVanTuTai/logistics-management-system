import React from 'react';
import { createRoot } from 'react-dom/client';

import { BootstrapApp } from './app/bootstrap';
import './app/theme.css';

const rootNode = document.getElementById('root');

if (!rootNode) {
  throw new Error('Không tìm thấy phần tử root');
}

createRoot(rootNode).render(
  <React.StrictMode>
    <BootstrapApp />
  </React.StrictMode>,
);

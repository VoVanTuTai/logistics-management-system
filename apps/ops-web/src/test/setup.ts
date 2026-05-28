import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

class IntersectionObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
});

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(() => true),
});

function createStorageMock(): Storage {
  let store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store = new Map<string, string>();
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

const storageMock = createStorageMock();

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  writable: true,
  value: storageMock,
});

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  writable: true,
  value: storageMock,
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

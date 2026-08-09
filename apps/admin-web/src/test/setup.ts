import '@testing-library/jest-dom/vitest';

(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };


import React from 'react';

export function useResizableColumns<T extends Record<string, number>>(
  storageKey: string,
  defaultWidths: T,
  minWidths: Record<keyof T, number>,
) {
  const [widths, setWidths] = React.useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return { ...defaultWidths, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return defaultWidths;
  });

  const resizingRef = React.useRef<{
    colKey: keyof T | null;
    startX: number;
    startWidth: number;
  }>({ colKey: null, startX: 0, startWidth: 0 });

  const handleMouseDown = React.useCallback(
    (colKey: keyof T, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = widths[colKey];
      resizingRef.current = { colKey, startX, startWidth };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!resizingRef.current.colKey) return;
        const diff = moveEvent.clientX - resizingRef.current.startX;
        const minW = minWidths[resizingRef.current.colKey] || 60;
        const newWidth = Math.max(minW, Math.round(resizingRef.current.startWidth + diff));

        setWidths((prev) => ({
          ...prev,
          [resizingRef.current.colKey!]: newWidth,
        }));
      };

      const onMouseUp = () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        if (resizingRef.current.colKey) {
          setWidths((latest) => {
            try {
              localStorage.setItem(storageKey, JSON.stringify(latest));
            } catch {
              // ignore
            }
            return latest;
          });
        }
        resizingRef.current = { colKey: null, startX: 0, startWidth: 0 };
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [widths, minWidths, storageKey],
  );

  const resetColumnWidth = React.useCallback(
    (colKey: keyof T) => {
      setWidths((prev) => {
        const next = { ...prev, [colKey]: defaultWidths[colKey] };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [defaultWidths, storageKey],
  );

  return { widths, handleMouseDown, resetColumnWidth };
}

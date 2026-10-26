import React from 'react';

export interface UseColumnSelectionOptions {
  labels?: Record<string, string>;
  onCopySuccess?: (count: number, colKey: string, label: string) => void;
}

function asElement(target: EventTarget | null): HTMLElement | null {
  if (target && 'nodeType' in target && (target as Node).nodeType === 1) {
    return target as HTMLElement;
  }
  return null;
}

/**
 * Universal Toast notification for column copying
 */
function displayGlobalToast(message: string) {
  let toast = document.getElementById('ops-global-col-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ops-global-col-toast';
    toast.className = 'ops-col-selection-toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
    <span>${message}</span>
  `;
  toast.style.display = 'flex';

  const existingTimeout = (toast as unknown as { _timeout?: ReturnType<typeof setTimeout> })._timeout;
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  (toast as unknown as { _timeout?: ReturnType<typeof setTimeout> })._timeout = setTimeout(() => {
    if (toast) {
      toast.style.display = 'none';
    }
  }, 2800);
}

/**
 * Universal hook for column-wise text selection and bulk copying in tables.
 * Allows users to click and drag vertically down ANY column to highlight and copy (Ctrl+C / Cmd+C)
 * only values from that column (separated by newlines, ready for Excel/Google Sheets).
 * Also provides 1-click header copying and double-click column selection.
 */
export function useColumnSelection(
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseColumnSelectionOptions = {},
) {
  const { labels = {}, onCopySuccess } = options;
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const toastTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMouseDownRef = React.useRef(false);
  const isDraggingRef = React.useRef(false);
  const suppressClickUntilRef = React.useRef(0);
  const dragStartRef = React.useRef<{
    colKey: string;
    rowIndex: number;
    startX: number;
    startY: number;
  } | null>(null);

  const showToast = React.useCallback((message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  const clearSelection = React.useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    root.removeAttribute('data-selecting-col');
    const activeCells = root.querySelectorAll('td[data-col-active="true"]');
    activeCells.forEach((c) => {
      c.removeAttribute('data-col-active');
      c.classList.remove('ops-col-cell-selected');
    });
  }, [containerRef]);

  /**
   * Copies all visible values of a specific column to clipboard (newline-delimited).
   */
  const copyColumn = React.useCallback(
    async (colKey: string, customLabel?: string) => {
      const root = containerRef.current;
      if (!root) return;

      const cells = root.querySelectorAll<HTMLTableCellElement>(`td[data-col-key="${colKey}"]`);
      if (cells.length === 0) return;

      const values: string[] = [];
      cells.forEach((cell) => {
        const val = cell.getAttribute('data-copy-value') ?? cell.innerText.trim();
        values.push(val);
      });

      const text = values.join('\n');
      const label = customLabel || labels[colKey] || colKey;

      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      // Visual flash animation on the entire column
      cells.forEach((c) => {
        c.setAttribute('data-col-active', 'true');
        c.classList.add('ops-col-cell-selected');
      });

      setTimeout(() => {
        cells.forEach((c) => {
          c.removeAttribute('data-col-active');
          c.classList.remove('ops-col-cell-selected');
        });
      }, 1200);

      const msg = `✓ Đã sao chép ${values.length} giá trị cột "${label}" (dán được vào Excel)`;
      showToast(msg);
      onCopySuccess?.(values.length, colKey, label);
    },
    [containerRef, labels, onCopySuccess, showToast],
  );

  /**
   * Selects all visible cells of a column.
   */
  const selectColumn = React.useCallback(
    (colKey: string) => {
      const root = containerRef.current;
      if (!root) return;

      clearSelection();
      root.setAttribute('data-selecting-col', colKey);
      const cells = root.querySelectorAll<HTMLTableCellElement>(`td[data-col-key="${colKey}"]`);
      cells.forEach((c) => {
        c.setAttribute('data-col-active', 'true');
        c.classList.add('ops-col-cell-selected');
      });
    },
    [clearSelection, containerRef],
  );

  /**
   * Helper to check if row click should be suppressed because user was selecting columns.
   */
  const shouldSuppressRowClick = React.useCallback(() => {
    if (Date.now() < suppressClickUntilRef.current) return true;
    const root = containerRef.current;
    if (root?.hasAttribute('data-selecting-col')) return true;
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return true;
    return false;
  }, [containerRef]);

  // Main event listeners for drag-to-select column
  React.useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;

      const target = asElement(e.target);
      if (!target) return;

      // Ignore interactive controls inside cells
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('input') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('.table-col-resizer') ||
        target.closest('.ops-col-copy-btn')
      ) {
        return;
      }

      const cell = target.closest<HTMLTableCellElement>('td[data-col-key]');
      if (!cell) {
        if (!target.closest('.ops-col-selection-toast')) {
          clearSelection();
        }
        return;
      }

      const colKey = cell.getAttribute('data-col-key');
      const rowIndex = parseInt(cell.getAttribute('data-row-index') || '-1', 10);
      if (!colKey || rowIndex === -1) return;

      isMouseDownRef.current = true;
      isDraggingRef.current = false;
      dragStartRef.current = {
        colKey,
        rowIndex,
        startX: e.clientX,
        startY: e.clientY,
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current || !dragStartRef.current) return;

      const deltaX = Math.abs(e.clientX - dragStartRef.current.startX);
      const deltaY = Math.abs(e.clientY - dragStartRef.current.startY);

      if (!isDraggingRef.current && (deltaY > 4 || deltaX > 4)) {
        isDraggingRef.current = true;
        root.setAttribute('data-selecting-col', dragStartRef.current.colKey);
      }

      if (!isDraggingRef.current) return;

      // Crucial: Clear native range so browser does not paint across other columns
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        sel.removeAllRanges();
      }

      const target = asElement(e.target);
      const hoveredCell = target?.closest<HTMLTableCellElement>('td[data-col-key]');
      let targetRowIndex = dragStartRef.current.rowIndex;

      if (hoveredCell) {
        const parsed = parseInt(hoveredCell.getAttribute('data-row-index') || '-1', 10);
        if (parsed !== -1) {
          targetRowIndex = parsed;
        }
      } else {
        const hoveredRow = target?.closest<HTMLTableRowElement>('tr[data-row-index]');
        if (hoveredRow) {
          const parsed = parseInt(hoveredRow.getAttribute('data-row-index') || '-1', 10);
          if (parsed !== -1) {
            targetRowIndex = parsed;
          }
        }
      }

      const start = Math.min(dragStartRef.current.rowIndex, targetRowIndex);
      const end = Math.max(dragStartRef.current.rowIndex, targetRowIndex);
      const activeColKey = dragStartRef.current.colKey;

      const allColCells = root.querySelectorAll<HTMLTableCellElement>(
        `td[data-col-key="${activeColKey}"]`,
      );

      allColCells.forEach((c) => {
        const rIndex = parseInt(c.getAttribute('data-row-index') || '-1', 10);
        if (rIndex >= start && rIndex <= end) {
          c.setAttribute('data-col-active', 'true');
          c.classList.add('ops-col-cell-selected');
        } else {
          c.removeAttribute('data-col-active');
          c.classList.remove('ops-col-cell-selected');
        }
      });
    };

    const handleSelectStart = (e: Event) => {
      if (isDraggingRef.current || root.hasAttribute('data-selecting-col')) {
        e.preventDefault();
      }
    };

    const handleMouseUp = () => {
      if (!isMouseDownRef.current) return;
      isMouseDownRef.current = false;

      if (isDraggingRef.current) {
        suppressClickUntilRef.current = Date.now() + 250;
        isDraggingRef.current = false;

        const activeCells = root.querySelectorAll('td[data-col-active="true"]');
        if (activeCells.length > 0 && dragStartRef.current) {
          const colKey = dragStartRef.current.colKey;
          const label = labels[colKey] || colKey;
          showToast(`✓ Đã bôi đen ${activeCells.length} ô cột "${label}". Nhấn Ctrl+C để sao chép`);
        }
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      const activeCells = root.querySelectorAll<HTMLTableCellElement>(
        'td[data-col-active="true"]',
      );
      if (activeCells.length === 0) return;

      const values: string[] = [];
      let colKey: string | null = null;

      activeCells.forEach((cell) => {
        if (!colKey) {
          colKey = cell.getAttribute('data-col-key');
        }
        const val = cell.getAttribute('data-copy-value') ?? cell.innerText.trim();
        values.push(val);
      });

      if (values.length > 0 && e.clipboardData) {
        e.clipboardData.setData('text/plain', values.join('\n'));
        e.preventDefault();

        const label = (colKey && labels[colKey]) || colKey || 'cột';
        showToast(`✓ Đã sao chép ${values.length} dòng cột "${label}" (dán được vào Excel)`);
        if (colKey) {
          onCopySuccess?.(values.length, colKey, label);
        }
      }
    };

    root.addEventListener('mousedown', handleMouseDown);
    root.addEventListener('selectstart', handleSelectStart);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('copy', handleCopy);

    return () => {
      root.removeEventListener('mousedown', handleMouseDown);
      root.removeEventListener('selectstart', handleSelectStart);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('copy', handleCopy);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [clearSelection, containerRef, labels, onCopySuccess, showToast]);

  const renderToast = () => {
    if (!toastMessage) return null;
    return (
      <div className="ops-col-selection-toast" role="status" aria-live="polite">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4ade80"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{toastMessage}</span>
      </div>
    );
  };

  return {
    copyColumn,
    selectColumn,
    clearSelection,
    shouldSuppressRowClick,
    renderToast,
  };
}

/**
 * Initializes global column selection across ALL tables in the OPS web interface.
 * Allows column drag-selection, copying, and double-click copying even on legacy or uninstrumented tables.
 */
export function initGlobalColumnSelection() {
  if (typeof window === 'undefined') return;

  let activeTable: HTMLTableElement | null = null;
  let activeColIndex = -1;
  let activeColKey: string | null = null;
  let startRowIndex = -1;
  let isMouseDown = false;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  const clearGlobalColSelection = () => {
    if (activeTable) {
      activeTable.removeAttribute('data-selecting-col');
      activeTable.querySelectorAll('td[data-col-active="true"]').forEach((c) => {
        c.removeAttribute('data-col-active');
        c.classList.remove('ops-col-cell-selected');
      });
      activeTable = null;
    }
    activeColIndex = -1;
    activeColKey = null;
    startRowIndex = -1;
    isMouseDown = false;
    isDragging = false;
  };

  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;

    const target = asElement(e.target);
    if (!target) return;

    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.closest('input') ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('.table-col-resizer') ||
      target.closest('.ops-col-copy-btn')
    ) {
      return;
    }

    const cell = target.closest<HTMLTableCellElement>('td');
    if (!cell) {
      if (!target.closest('.ops-col-selection-toast')) {
        clearGlobalColSelection();
      }
      return;
    }

    const table = cell.closest<HTMLTableElement>('table');
    if (!table) return;

    // Check if table is managed by local hook with data-col-key (let local hook handle it)
    if (table.closest('.ops-column-selectable-table')) {
      return;
    }

    activeTable = table;
    activeColIndex = cell.cellIndex;
    activeColKey = cell.getAttribute('data-col-key');
    const row = cell.closest<HTMLTableRowElement>('tr');
    startRowIndex = row ? row.rowIndex : -1;
    isMouseDown = true;
    isDragging = false;
    startX = e.clientX;
    startY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isMouseDown || !activeTable || activeColIndex === -1) return;

    const deltaX = Math.abs(e.clientX - startX);
    const deltaY = Math.abs(e.clientY - startY);

    if (!isDragging && (deltaY > 5 || deltaX > 5)) {
      isDragging = true;
      activeTable.setAttribute(
        'data-selecting-col',
        activeColKey || String(activeColIndex),
      );
    }

    if (!isDragging) return;

    // Crucial: Clear native range so browser does not paint across other columns
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      sel.removeAllRanges();
    }

    const target = asElement(e.target);
    const hoveredCell = target?.closest<HTMLTableCellElement>('td');
    const hoveredRow = hoveredCell ? hoveredCell.closest<HTMLTableRowElement>('tr') : target?.closest<HTMLTableRowElement>('tr');
    const targetRowIndex = hoveredRow ? hoveredRow.rowIndex : startRowIndex;

    const minRow = Math.min(startRowIndex, targetRowIndex);
    const maxRow = Math.max(startRowIndex, targetRowIndex);

    const rows = activeTable.querySelectorAll<HTMLTableRowElement>('tbody tr');
    rows.forEach((r) => {
      const c = activeColKey
        ? r.querySelector<HTMLTableCellElement>(`td[data-col-key="${activeColKey}"]`)
        : r.cells[activeColIndex];

      if (!c) return;

      if (r.rowIndex >= minRow && r.rowIndex <= maxRow) {
        c.setAttribute('data-col-active', 'true');
        c.classList.add('ops-col-cell-selected');
      } else {
        c.removeAttribute('data-col-active');
        c.classList.remove('ops-col-cell-selected');
      }
    });
  });

  document.addEventListener('selectstart', (e) => {
    if (isDragging || activeTable?.hasAttribute('data-selecting-col')) {
      e.preventDefault();
    }
  });

  window.addEventListener('mouseup', () => {
    if (!isMouseDown) return;
    isMouseDown = false;
    if (isDragging) {
      isDragging = false;
      const activeCells = activeTable?.querySelectorAll('td[data-col-active="true"]');
      if (activeCells && activeCells.length > 0 && activeTable) {
        const th = activeTable.querySelectorAll<HTMLTableCellElement>('thead th')[activeColIndex];
        const headerLabel = th ? (th.innerText || th.textContent || '').replace(/Sao chép.*$/i, '').trim() : 'cột';
        displayGlobalToast(`✓ Đã bôi đen ${activeCells.length} ô cột "${headerLabel}". Nhấn Ctrl+C để sao chép`);
      }
    }
  });

  document.addEventListener('copy', (e) => {
    if (!activeTable) return;

    const activeCells = activeTable.querySelectorAll<HTMLTableCellElement>('td[data-col-active="true"]');
    if (activeCells.length === 0) return;

    const values: string[] = [];
    activeCells.forEach((c) => {
      const val = c.getAttribute('data-copy-value') ?? c.innerText.trim();
      values.push(val);
    });

    if (values.length > 0 && e.clipboardData) {
      e.clipboardData.setData('text/plain', values.join('\n'));
      e.preventDefault();

      // Find header text for toast
      const th = activeTable.querySelectorAll<HTMLTableCellElement>('thead th')[activeColIndex];
      const headerLabel = th ? th.innerText.replace(/Sao chép.*$/i, '').trim() : 'cột';

      displayGlobalToast(`✓ Đã sao chép ${values.length} dòng cột "${headerLabel}" (dán được vào Excel)`);
    }
  });

  // Double click header to copy entire column on any table
  document.addEventListener('dblclick', async (e) => {
    const target = asElement(e.target);
    const th = target?.closest<HTMLTableCellElement>('th');
    if (!th) return;

    const table = th.closest<HTMLTableElement>('table');
    if (!table || table.closest('.ops-column-selectable-table')) return;

    const colIndex = th.cellIndex;
    const rows = table.querySelectorAll<HTMLTableRowElement>('tbody tr');
    if (rows.length === 0) return;

    const values: string[] = [];
    const cellsToFlash: HTMLTableCellElement[] = [];

    rows.forEach((r) => {
      const c = r.cells[colIndex];
      if (c) {
        const val = c.getAttribute('data-copy-value') ?? c.innerText.trim();
        values.push(val);
        cellsToFlash.push(c);
      }
    });

    if (values.length === 0) return;

    const text = values.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }

    cellsToFlash.forEach((c) => {
      c.setAttribute('data-col-active', 'true');
      c.classList.add('ops-col-cell-selected');
    });

    setTimeout(() => {
      cellsToFlash.forEach((c) => {
        c.removeAttribute('data-col-active');
        c.classList.remove('ops-col-cell-selected');
      });
    }, 1200);

    const headerLabel = th.innerText.trim();
    displayGlobalToast(`✓ Đã sao chép ${values.length} giá trị cột "${headerLabel}" (dán được vào Excel)`);
  });
}

import { useState } from 'react';

export interface UseTableColumnVisibilityOptions<K extends string> {
  storageKey: string;
  defaultVisibility: Record<K, boolean>;
}

export function useTableColumnVisibility<K extends string>({
  storageKey,
  defaultVisibility,
}: UseTableColumnVisibilityOptions<K>) {
  const [visibleColumns, setVisibleColumns] = useState<Record<K, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return { ...defaultVisibility, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return defaultVisibility;
  });

  const [isColPickerOpen, setIsColPickerOpen] = useState<boolean>(false);

  const toggleColumn = (key: K) => {
    setVisibleColumns((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const setAllColumns = (val: boolean) => {
    const updated = { ...visibleColumns };
    (Object.keys(defaultVisibility) as K[]).forEach((k) => {
      updated[k] = val;
    });
    setVisibleColumns(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const resetColumns = () => {
    setVisibleColumns(defaultVisibility);
    try {
      localStorage.setItem(storageKey, JSON.stringify(defaultVisibility));
    } catch {
      // ignore
    }
  };

  const allKeys = Object.keys(defaultVisibility) as K[];
  const visibleCount = allKeys.filter((k) => visibleColumns[k]).length;
  const totalColCount = allKeys.length;

  return {
    visibleColumns,
    setVisibleColumns,
    isColPickerOpen,
    setIsColPickerOpen,
    toggleColumn,
    setAllColumns,
    resetColumns,
    visibleCount,
    totalColCount,
  };
}

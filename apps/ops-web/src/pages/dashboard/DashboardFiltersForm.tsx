import React, { useEffect, useState } from 'react';

import type { DashboardFilters } from '../../features/dashboard/dashboard.types';

interface DashboardFiltersFormProps {
  filters: DashboardFilters;
  onApply: (filters: DashboardFilters) => void;
  onReset: () => void;
}

export function DashboardFiltersForm({
  filters,
  onApply,
  onReset,
}: DashboardFiltersFormProps): React.JSX.Element {
  const [dateInput, setDateInput] = useState(filters.date ?? '');
  const [hubInput, setHubInput] = useState(filters.hubCode ?? '');
  const [zoneInput, setZoneInput] = useState(filters.zoneCode ?? '');
  const [courierInput, setCourierInput] = useState(filters.courierId ?? '');

  useEffect(() => {
    setDateInput(filters.date ?? '');
    setHubInput(filters.hubCode ?? '');
    setZoneInput(filters.zoneCode ?? '');
    setCourierInput(filters.courierId ?? '');
  }, [filters.courierId, filters.date, filters.hubCode, filters.zoneCode]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply({
      date: dateInput.trim() || undefined,
      hubCode: hubInput.trim() || undefined,
      zoneCode: zoneInput.trim() || undefined,
      courierId: courierInput.trim() || undefined,
    });
  };

  const onResetClick = () => {
    setDateInput('');
    setHubInput('');
    setZoneInput('');
    setCourierInput('');
    onReset();
  };

  return (
    <form onSubmit={onSubmit} className="ops-dashboard-filters">
      <input type="date" value={dateInput} onChange={(event) => setDateInput(event.target.value)} />
      <input
        placeholder="Hub code"
        value={hubInput}
        onChange={(event) => setHubInput(event.target.value)}
      />
      <input
        placeholder="Zone code"
        value={zoneInput}
        onChange={(event) => setZoneInput(event.target.value)}
      />
      <input
        placeholder="Courier ID"
        value={courierInput}
        onChange={(event) => setCourierInput(event.target.value)}
      />
      <button type="submit">Apply</button>
      <button type="button" onClick={onResetClick}>
        Reset
      </button>
    </form>
  );
}

import React from 'react';
import type { DashboardSummary } from '../../types';

interface KPICardsProps {
  summary: DashboardSummary[];
  onKpiClick?: (kpi: string) => void;
}

export function KPICards({ summary, onKpiClick }: KPICardsProps) {
  const s = summary[0];
  if (!s) return null;

  const kpis = [
    { key: 'total', label: 'Всего мест', value: s.total_active_locations, color: 'text-slate-700 dark:text-slate-200' },
    { key: 'free', label: 'Свободно', value: s.free_locations, color: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'occupied', label: 'Занято', value: s.occupied_locations, color: 'text-blue-600 dark:text-blue-400' },
    { key: 'occupancy', label: 'Заполненность', value: `${s.occupancy_rate_pct}%`, color: s.occupancy_rate_pct > 80 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-200' },
    { key: 'sku', label: 'Активных SKU', value: s.active_sku_count, color: 'text-slate-700 dark:text-slate-200' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi) => (
        <button
          key={kpi.key}
          onClick={() => onKpiClick?.(kpi.key)}
          className="kpi-card text-left hover:shadow-sm transition-shadow cursor-pointer"
        >
          <div className="kpi-label">{kpi.label}</div>
          <div className={`kpi-value mt-1 ${kpi.color}`}>{kpi.value}</div>
        </button>
      ))}
    </div>
  );
}
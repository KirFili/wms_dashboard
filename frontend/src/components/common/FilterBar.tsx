import React from 'react';
import { useFilterContext } from '../../context/FilterContext';
import type { PeriodPreset } from '../../types';

const periods: { value: PeriodPreset; label: string }[] = [
  { value: 'day', label: 'День' },
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'custom', label: 'Диапазон' },
];

export function FilterBar() {
  const { filters, setFilter, resetFilters } = useFilterContext();

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      {/* Period */}
      <div className="flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setFilter('period', p.value)}
            className={`px-2.5 py-1 text-xs font-medium transition-colors ${
              filters.period === p.value
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom date range */}
      {filters.period === 'custom' && (
        <>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">с</div>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilter('dateFrom', e.target.value)}
            className="form-input w-36 text-xs py-1"
          />
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">по</div>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilter('dateTo', e.target.value)}
            className="form-input w-36 text-xs py-1"
          />
        </>
      )}

      <div className="h-5 w-px bg-slate-200 dark:bg-slate-700" />

      {/* SKU filter */}
      <input
        type="text"
        placeholder="SKU…"
        value={filters.skuId}
        onChange={(e) => setFilter('skuId', e.target.value)}
        className="form-input w-28 text-xs py-1"
      />

      {/* Category filter */}
      <input
        type="text"
        placeholder="Категория…"
        value={filters.category}
        onChange={(e) => setFilter('category', e.target.value)}
        className="form-input w-32 text-xs py-1"
      />

      {/* Reset */}
      <button
        onClick={resetFilters}
        className="btn-secondary text-xs py-1 px-2 ml-auto"
        title="Сбросить фильтры"
      >
        Сброс
      </button>
    </div>
  );
}
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFilterContext } from '../../context/FilterContext';
import { StaleIndicator } from '../common/StatusBadge';
import { ThemeToggle } from '../common/ThemeToggle';

interface HeaderProps {
  lastUpdated: string | null;
  onRefresh?: () => void;
}

export function Header({ lastUpdated, onRefresh }: HeaderProps) {
  const { user, logout } = useAuth();
  const { filters, setFilter } = useFilterContext();

  return (
    <header
      className="sticky top-0 z-20 flex items-center gap-3 h-14 px-4 border-b shrink-0"
      style={{
        backgroundColor: 'rgb(var(--color-header-bg))',
        borderColor: 'rgb(var(--color-border))',
      }}
    >
      {/* Period - compact */}
      <div className="flex items-center gap-0.5 rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        {(['day', 'week', 'month', 'custom'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setFilter('period', p)}
            className={`px-2 py-1 text-2xs font-medium transition-colors ${
              filters.period === p
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {p === 'day' ? 'День' : p === 'week' ? 'Нед' : p === 'month' ? 'Мес' : '...'}
          </button>
        ))}
      </div>

      {filters.period === 'custom' && (
        <>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilter('dateFrom', e.target.value)}
            className="form-input w-32 text-xs py-1"
          />
          <span className="text-xs text-slate-400">—</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilter('dateTo', e.target.value)}
            className="form-input w-32 text-xs py-1"
          />
        </>
      )}

      <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

      {/* Warehouse */}
      <select
        value={filters.warehouseId}
        onChange={(e) => setFilter('warehouseId', e.target.value)}
        className="form-select w-36 text-xs py-1"
      >
        <option value="">Все склады</option>
      </select>

      {/* Chamber */}
      <select
        value={filters.chamberId}
        onChange={(e) => setFilter('chamberId', e.target.value)}
        className="form-select w-36 text-xs py-1"
      >
        <option value="">Все камеры</option>
      </select>

      {/* SKU */}
      <input
        type="text"
        placeholder="SKU..."
        value={filters.skuId}
        onChange={(e) => setFilter('skuId', e.target.value)}
        className="form-input w-28 text-xs py-1"
      />

      <div className="flex-1" />

      {/* Status indicators */}
      <StaleIndicator lastUpdated={lastUpdated} onRefresh={onRefresh} />

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Обновить данные"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </button>
      )}

      <ThemeToggle />

      {/* User menu */}
      <button
        onClick={logout}
        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Выйти"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
      </button>
    </header>
  );
}
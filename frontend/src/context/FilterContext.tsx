import React, { createContext, useContext, useState, useCallback } from 'react';
import type { FilterState, PeriodPreset } from '../types';

interface FilterContextType {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  dateFrom: '',
  dateTo: '',
  warehouseId: '',
  chamberId: '',
  skuId: '',
  category: '',
  locationStatus: '',
  period: 'day',
};

const FILTER_KEY = 'wms_dashboard_filters';

function loadFilters(): FilterState {
  try {
    const stored = localStorage.getItem(FILTER_KEY);
    return stored ? { ...defaultFilters, ...JSON.parse(stored) } : defaultFilters;
  } catch {
    return defaultFilters;
  }
}

const FilterContext = createContext<FilterContextType | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(loadFilters);

  const setFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      // If period is not custom, set date range accordingly
      if (key === 'period' && value !== 'custom') {
        const now = new Date();
        next.dateTo = now.toISOString().slice(0, 10);
        if (value === 'day') {
          next.dateFrom = now.toISOString().slice(0, 10);
        } else if (value === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          next.dateFrom = weekAgo.toISOString().slice(0, 10);
        } else if (value === 'month') {
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          next.dateFrom = monthAgo.toISOString().slice(0, 10);
        }
      }
      localStorage.setItem(FILTER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    localStorage.setItem(FILTER_KEY, JSON.stringify(defaultFilters));
  }, []);

  return (
    <FilterContext.Provider value={{ filters, setFilter, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext(): FilterContextType {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('FilterContext not found');
  return ctx;
}

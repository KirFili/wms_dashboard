import { useState, useEffect, useCallback } from 'react';
import * as dashboardService from '../services/dashboard';
import type { DashboardFilters } from '../services/dashboard';
import type {
  DashboardSummary,
  ChamberOccupancy,
  OccupancyTrendPoint,
  SKUEfficiency,
  DashboardDetail,
} from '../types';

export function useDashboard(filters: DashboardFilters) {
  const [summary, setSummary] = useState<DashboardSummary[]>([]);
  const [chambersOccupancy, setChambersOccupancy] = useState<ChamberOccupancy[]>([]);
  const [trend, setTrend] = useState<OccupancyTrendPoint[]>([]);
  const [skuEfficiency, setSkuEfficiency] = useState<SKUEfficiency[]>([]);
  const [heatmap, setHeatmap] = useState<ChamberOccupancy[]>([]);
  const [details, setDetails] = useState<DashboardDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [s, co, t, se, h, d] = await Promise.all([
        dashboardService.fetchDashboardSummary(filters),
        dashboardService.fetchChambersOccupancy(filters),
        dashboardService.fetchOccupancyTrend(filters),
        dashboardService.fetchSKUEfficiency(filters),
        dashboardService.fetchHeatmap(filters),
        dashboardService.fetchDashboardDetails(filters),
      ]);
      setSummary(s);
      setChambersOccupancy(co);
      setTrend(t);
      setSkuEfficiency(se);
      setHeatmap(h);
      setDetails(d);
      setLastUpdated(new Date().toISOString());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки данных';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    summary,
    chambersOccupancy,
    trend,
    skuEfficiency,
    heatmap,
    details,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchAll,
  };
}
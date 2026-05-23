import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';
import { useFilterContext } from '../../context/FilterContext';
import { useThemeContext } from '../../context/ThemeContext';
import { KPICards } from '../Dashboard/KPICards';
import { ChamberBarChart } from '../Dashboard/ChamberBarChart';
import { OccupancyTrend } from '../Dashboard/OccupancyTrend';
import { SKUScatter } from '../Dashboard/SKUScatter';
import { ChamberHeatmap } from '../Dashboard/ChamberHeatmap';
import { DetailTable } from '../Dashboard/DetailTable';
import { Loading, Empty, ErrorState } from '../common/StatusBadge';
import { MainLayout } from '../Layout/MainLayout';

export function DashboardPage() {
  const navigate = useNavigate();
  const { filters } = useFilterContext();
  const { theme } = useThemeContext();

  const dashboardFilters = {
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    warehouse_id: filters.warehouseId || undefined,
    chamber_id: filters.chamberId || undefined,
    sku_id: filters.skuId || undefined,
    category: filters.category || undefined,
    location_status: filters.locationStatus || undefined,
  };

  const {
    summary,
    chambersOccupancy,
    trend,
    skuEfficiency,
    heatmap,
    details,
    isLoading,
    error,
    lastUpdated,
    refetch,
  } = useDashboard(dashboardFilters);

  const handleKpiClick = useCallback((kpi: string) => {
    // Navigate with prefilter
    if (kpi === 'sku') navigate('/analytics');
    else navigate('/chambers');
  }, [navigate]);

  const handleChamberClick = useCallback((chamberId: string) => {
    navigate(`/chambers?chamber_id=${chamberId}`);
  }, [navigate]);

  const handleSkuClick = useCallback((skuId: string) => {
    navigate(`/analytics?sku_id=${skuId}`);
  }, [navigate]);

  if (isLoading) {
    return (
      <MainLayout lastUpdated={lastUpdated} onRefresh={refetch}>
        <Loading text="Загрузка панели..." />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout lastUpdated={lastUpdated} onRefresh={refetch}>
        <ErrorState message={error} onRetry={refetch} />
      </MainLayout>
    );
  }

  const isEmpty = chambersOccupancy.length === 0 && trend.length === 0;

  if (isEmpty) {
    return (
      <MainLayout lastUpdated={lastUpdated} onRefresh={refetch}>
        <Empty text="Нет данных для отображения. Загрузите XLSX-файл с данными." action={{ label: 'Перейти к импорту', onClick: () => navigate('/imports') }} />
      </MainLayout>
    );
  }

  return (
    <MainLayout lastUpdated={lastUpdated} onRefresh={refetch}>
      <div className="space-y-4">
        {/* KPI Row */}
        <KPICards summary={summary} onKpiClick={handleKpiClick} />

        {/* Charts Row 1: Bar + Line */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChamberBarChart data={chambersOccupancy} onChamberClick={handleChamberClick} theme={theme} />
          <OccupancyTrend data={trend} theme={theme} />
        </div>

        {/* Charts Row 2: Scatter + Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SKUScatter data={skuEfficiency} onSkuClick={handleSkuClick} theme={theme} />
          <ChamberHeatmap data={heatmap} theme={theme} />
        </div>

        {/* Detail Table */}
        <DetailTable data={details} onChamberClick={handleChamberClick} onSkuClick={handleSkuClick} />
      </div>
    </MainLayout>
  );
}
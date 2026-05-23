import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useSKUDetail } from '../../hooks/useAnalytics';
import { useThemeContext } from '../../context/ThemeContext';
import { Loading } from '../common/Loading';
import { Empty } from '../common/Empty';
import { ErrorState as Error } from '../common/StatusBadge';

// Register ECharts components
echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

export function SKUDetail() {
  const { skuId } = useParams<{ skuId: string }>();
  const navigate = useNavigate();
  const { theme } = useThemeContext();
  const { analytics, trend, shipments, isLoading, error, refetch } = useSKUDetail(skuId || null);

  const isDark = theme === 'dark';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#334155' : '#e2e8f0';

  if (isLoading) return <Loading text="Загрузка деталей SKU..." />;
  if (error) return <Error message={error} onRetry={refetch} />;
  if (!analytics) return <Empty text="SKU не найден" action={{ label: 'Назад', onClick: () => navigate('/analytics') }} />;

  // KPI cards
  const kpis = [
    { label: 'Паллетомест', value: analytics.current_occupied_locations },
    { label: 'Хранение, м³', value: analytics.total_stored_volume.toFixed(1) },
    { label: 'Отгружено, м³', value: analytics.total_shipped_volume.toFixed(1) },
    { label: 'Отгружено, шт', value: analytics.total_shipped_qty },
    { label: 'Дней хранения', value: analytics.storage_days },
    { label: 'Оборачиваемость', value: analytics.turnover_efficiency.toFixed(2), color: analytics.turnover_efficiency > 1 ? 'text-emerald-600 dark:text-emerald-400' : analytics.turnover_efficiency < 0.5 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400' },
    { label: 'Нагрузка', value: analytics.storage_load_ratio != null ? analytics.storage_load_ratio.toFixed(2) : '—' },
  ];

  // Trend chart options
  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Паллетомест', 'Объём, м³'], textStyle: { color: textColor, fontSize: 11 } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: trend.map((p) => p.date.slice(0, 10)),
      axisLabel: { color: textColor, fontSize: 10, rotate: 30 },
      axisLine: { lineStyle: { color: gridColor } },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Паллетомест',
        axisLabel: { color: textColor, fontSize: 10 },
        splitLine: { lineStyle: { color: gridColor } },
      },
      {
        type: 'value',
        name: 'Объём',
        axisLabel: { color: textColor, fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Паллетомест',
        type: 'line',
        data: trend.map((p) => p.occupied_locations),
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2 },
        itemStyle: { color: '#3b82f6' },
      },
      {
        name: 'Объём, м³',
        type: 'line',
        yAxisIndex: 1,
        data: trend.map((p) => +p.occupied_volume.toFixed(2)),
        smooth: true,
        symbol: 'diamond',
        symbolSize: 4,
        lineStyle: { width: 2, type: 'dashed' },
        itemStyle: { color: '#10b981' },
      },
    ],
  };

  // Shipments chart options
  const shipmentOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Количество', 'Объём, м³'], textStyle: { color: textColor, fontSize: 11 } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: shipments.map((p) => p.date.slice(0, 10)),
      axisLabel: { color: textColor, fontSize: 10, rotate: 30 },
      axisLine: { lineStyle: { color: gridColor } },
    },
    yAxis: [
      {
        type: 'value',
        name: 'Кол-во',
        axisLabel: { color: textColor, fontSize: 10 },
        splitLine: { lineStyle: { color: gridColor } },
      },
      {
        type: 'value',
        name: 'Объём',
        axisLabel: { color: textColor, fontSize: 10 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Количество',
        type: 'bar',
        data: shipments.map((p) => p.shipped_qty),
        barMaxWidth: 24,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#6366f1' },
            { offset: 1, color: '#8b5cf6' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: 'Объём, м³',
        type: 'line',
        yAxisIndex: 1,
        data: shipments.map((p) => +p.shipped_volume.toFixed(2)),
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 2 },
        itemStyle: { color: '#f59e0b' },
      },
    ],
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/analytics')} className="btn-secondary text-sm px-2 py-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>
            {analytics.sku_code} — {analytics.sku_name}
          </h1>
          <p className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>
            {analytics.category || 'Без категории'} · {analytics.unit} · паллет-коэфф: {analytics.pallet_coeff ?? '—'}
          </p>
        </div>
        <button onClick={refetch} className="btn-secondary text-sm ml-auto">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="kpi-card text-center">
            <div className="kpi-label">{kpi.label}</div>
            <div className={`kpi-value mt-1 ${kpi.color || ''}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="chart-container">
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
            Тренд занятости паллетомест
          </h3>
          {trend.length > 0 ? (
            <ReactEChartsCore
              echarts={echarts}
              option={trendOption}
              style={{ height: 300 }}
              notMerge
              theme={isDark ? 'dark' : undefined}
            />
          ) : (
            <Empty text="Нет данных тренда" />
          )}
        </div>

        <div className="chart-container">
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>
            Динамика отгрузок
          </h3>
          {shipments.length > 0 ? (
            <ReactEChartsCore
              echarts={echarts}
              option={shipmentOption}
              style={{ height: 300 }}
              notMerge
              theme={isDark ? 'dark' : undefined}
            />
          ) : (
            <Empty text="Нет данных отгрузок" />
          )}
        </div>
      </div>
    </div>
  );
}
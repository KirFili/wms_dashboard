import React, { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { OccupancyTrendPoint } from '../../types';

echarts.use([LineChart, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer]);

interface OccupancyTrendProps {
  data: OccupancyTrendPoint[];
  theme: 'light' | 'dark';
}

export function OccupancyTrend({ data, theme }: OccupancyTrendProps) {
  const option = useMemo(() => {
    const isDark = theme === 'dark';
    // Group by date
    const dateMap = new Map<string, { occupied: number; free: number }>();
    data.forEach((d) => {
      const existing = dateMap.get(d.snapshot_date) || { occupied: 0, free: 0 };
      existing.occupied += d.occupied_locations;
      existing.free += d.free_locations;
      dateMap.set(d.snapshot_date, existing);
    });
    const dates = Array.from(dateMap.keys()).sort();
    const occupied = dates.map((d) => dateMap.get(d)!.occupied);
    const free = dates.map((d) => dateMap.get(d)!.free);

    return {
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: isDark ? '#1e293b' : '#fff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f8fafc' : '#0f172a', fontSize: 12 },
      },
      legend: {
        bottom: 0,
        textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
      },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: dates,
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10, rotate: 30, formatter: (v: string) => v.slice(5) },
        axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
      },
      series: [
        {
          name: 'Занято',
          type: 'line',
          data: occupied,
          smooth: true,
          lineStyle: { color: '#3b82f6', width: 2 },
          itemStyle: { color: '#3b82f6' },
          symbol: 'circle',
          symbolSize: 4,
        },
        {
          name: 'Свободно',
          type: 'line',
          data: free,
          smooth: true,
          lineStyle: { color: '#22c55e', width: 2 },
          itemStyle: { color: '#22c55e' },
          symbol: 'circle',
          symbolSize: 4,
        },
      ],
    };
  }, [data, theme]);

  return (
    <div className="chart-container">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        Динамика занятости
      </h3>
      <ReactEChartsCore echarts={echarts} option={option} style={{ height: 280 }} />
    </div>
  );
}
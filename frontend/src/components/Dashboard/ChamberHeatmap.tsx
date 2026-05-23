import React, { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import { TooltipComponent, GridComponent, VisualMapComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ChamberOccupancy } from '../../types';

echarts.use([HeatmapChart, TooltipComponent, GridComponent, VisualMapComponent, CanvasRenderer]);

interface ChamberHeatmapProps {
  data: ChamberOccupancy[];
  theme: 'light' | 'dark';
}

export function ChamberHeatmap({ data, theme }: ChamberHeatmapProps) {
  const option = useMemo(() => {
    const isDark = theme === 'dark';
    // Build heatmap data: zones as X, chamber codes as Y separated by zone, occupancy rate as value
    const zones = [...new Set(data.map((d) => d.zone || 'Default'))].sort();
    const yCategories = data.map((d) => d.chamber_code);

    const heatData: Array<[number, number, number]> = [];
    data.forEach((d, i) => {
      const zoneIdx = zones.indexOf(d.zone || 'Default');
      heatData.push([zoneIdx, i, d.occupancy_rate_pct]);
    });

    const maxVal = Math.max(...data.map((d) => d.occupancy_rate_pct), 1);

    return {
      tooltip: {
        position: 'top' as const,
        backgroundColor: isDark ? '#1e293b' : '#fff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f8fafc' : '#0f172a', fontSize: 12 },
        formatter: (params: { value: [number, number, number] }) => {
          const d = data[params.value[1]];
          if (!d) return '';
          return `<strong>${d.chamber_code} — ${d.chamber_name}</strong><br/>
            Зона: ${d.zone || '-'}<br/>
            Заполненность: <strong>${d.occupancy_rate_pct}%</strong><br/>
            Занято: ${d.occupied_locations} / ${d.total_locations}<br/>
            SKU: ${d.distinct_sku_count}`;
        },
      },
      grid: { left: '10%', right: '8%', bottom: '8%', top: '5%' },
      xAxis: {
        type: 'category' as const,
        data: zones,
        splitArea: { show: true },
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
      },
      yAxis: {
        type: 'category' as const,
        data: yCategories,
        splitArea: { show: true },
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
      },
      visualMap: {
        min: 0,
        max: maxVal,
        calculable: true,
        orient: 'horizontal' as const,
        left: 'center',
        bottom: 0,
        inRange: {
          color: ['#22c55e', '#eab308', '#ef4444'],
        },
        textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
      },
      series: [
        {
          type: 'heatmap',
          data: heatData,
          label: {
            show: true,
            color: isDark ? '#f8fafc' : '#0f172a',
            fontSize: 9,
            formatter: (params: { value: [number, number, number] }) => params.value[2].toFixed(0) + '%',
          },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' },
          },
        },
      ],
    };
  }, [data, theme]);

  return (
    <div className="chart-container">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        Heatmap загруженности камер
      </h3>
      <ReactEChartsCore echarts={echarts} option={option} style={{ height: Math.max(200, data.length * 28 + 40) }} />
    </div>
  );
}
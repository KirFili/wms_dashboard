import React, { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ChamberOccupancy } from '../../types';

echarts.use([BarChart, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer]);

interface ChamberBarChartProps {
  data: ChamberOccupancy[];
  onChamberClick?: (chamberId: string) => void;
  theme: 'light' | 'dark';
}

export function ChamberBarChart({ data, onChamberClick, theme }: ChamberBarChartProps) {
  const option = useMemo(() => {
    const isDark = theme === 'dark';

    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        backgroundColor: isDark ? '#1e293b' : '#fff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f8fafc' : '#0f172a', fontSize: 12 },
        formatter: (params: Array<{ name: string; value: number; seriesName: string; color: string }>) => {
          return params
            .map(
              (p) =>
                `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${p.color}"></span>
                  ${p.seriesName}: <strong>${p.value}%</strong>
                </div>`
            )
            .join('');
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
      },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: data.map((d) => d.chamber_code),
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10, rotate: 30 },
        axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
      },
      yAxis: {
        type: 'value' as const,
        max: 100,
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10, formatter: '{value}%' },
        splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
      },
      series: [
        {
          name: 'Заполненность',
          type: 'bar',
          data: data.map((d) => d.occupancy_rate_pct),
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: (params: { value: number }) => {
              if (params.value > 80) return '#ef4444';
              if (params.value > 60) return '#f59e0b';
              return '#3b82f6';
            },
          },
          emphasis: {
            itemStyle: { color: '#2563eb' },
          },
        },
      ],
    };
  }, [data, theme]);

  const onEvents = useMemo((): Record<string, Function> => {
    if (!onChamberClick) return {} as Record<string, Function>;
    return {
      click: (params: { name: string }) => {
        const chamber = data.find((d) => d.chamber_code === params.name);
        if (chamber) onChamberClick(chamber.chamber_id);
      },
    };
  }, [data, onChamberClick]);

  return (
    <div className="chart-container">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        Заполненность по камерам
      </h3>
      <ReactEChartsCore echarts={echarts} option={option} style={{ height: 280 }} onEvents={onEvents} />
    </div>
  );
}
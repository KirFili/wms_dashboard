import React, { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { SKUEfficiency } from '../../types';

echarts.use([ScatterChart, TooltipComponent, GridComponent, LegendComponent, CanvasRenderer]);

interface SKUScatterProps {
  data: SKUEfficiency[];
  onSkuClick?: (skuId: string) => void;
  theme: 'light' | 'dark';
}

export function SKUScatter({ data, onSkuClick, theme }: SKUScatterProps) {
  const option = useMemo(() => {
    const isDark = theme === 'dark';

    // Split by efficiency quadrant
    const efficient: Array<[number, number, string, string]> = [];
    const inefficient: Array<[number, number, string, string]> = [];

    data.forEach((d) => {
      const x = d.current_occupied_locations || 0;
      const y = d.total_shipped_volume || 0;
      const point: [number, number, string, string] = [x, y, d.sku_code, d.sku_id];
      if (d.turnover_efficiency >= 1) {
        efficient.push(point);
      } else {
        inefficient.push(point);
      }
    });

    return {
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: isDark ? '#1e293b' : '#fff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f8fafc' : '#0f172a', fontSize: 12 },
        formatter: (params: { value: [number, number, string] }) => {
          return `<strong>${params.value[2]}</strong><br/>Хранение: ${params.value[0]} мест<br/>Отгрузки: ${params.value[1]} ед.`;
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
      },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '8%', containLabel: true },
      xAxis: {
        name: 'Занято мест',
        nameTextStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
      },
      yAxis: {
        name: 'Объём отгрузок',
        nameTextStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 },
        splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
      },
      series: [
        {
          name: 'Эффективные',
          type: 'scatter',
          data: efficient,
          symbolSize: (val: [number, number]) => Math.max(8, Math.min(24, val[0] * 0.5)),
          itemStyle: { color: '#22c55e', opacity: 0.7 },
          emphasis: {
            itemStyle: { borderColor: '#fff', borderWidth: 2 },
          },
        },
        {
          name: 'Неэффективные',
          type: 'scatter',
          data: inefficient,
          symbolSize: (val: [number, number]) => Math.max(8, Math.min(24, val[0] * 0.5)),
          itemStyle: { color: '#ef4444', opacity: 0.7 },
          emphasis: {
            itemStyle: { borderColor: '#fff', borderWidth: 2 },
          },
        },
      ],
    };
  }, [data, theme]);

  const onEvents = useMemo((): Record<string, Function> => {
    if (!onSkuClick) return {} as Record<string, Function>;
    return {
      click: (params: { value: [number, number, string, string] }) => {
        onSkuClick(params.value[3]);
      },
    };
  }, [onSkuClick]);

  return (
    <div className="chart-container">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
        Эффективность SKU (хранение vs отгрузки)
      </h3>
      <ReactEChartsCore echarts={echarts} option={option} style={{ height: 280 }} onEvents={onEvents} />
    </div>
  );
}
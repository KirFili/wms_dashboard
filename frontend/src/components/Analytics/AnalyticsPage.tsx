import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../../hooks/useAnalytics';
import { Loading } from '../common/Loading';
import { Empty } from '../common/Empty';
import { ErrorState as Error } from '../common/StatusBadge';
import type { SKUAnalytics } from '../../types';

export function AnalyticsPage() {
  const navigate = useNavigate();
  const { items, total, isLoading, error, refetch } = useAnalytics();

  const sorted = useMemo(() => {
    return [...items].sort((a: SKUAnalytics, b: SKUAnalytics) => b.turnover_efficiency - a.turnover_efficiency);
  }, [items]);

  if (isLoading) return <Loading text="Загрузка аналитики..." />;
  if (error) return <Error message={error} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>Аналитика SKU</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--color-text-muted))' }}>
            {total} SKU · KPI: оборачиваемость, складская нагрузка, объёмы
          </p>
        </div>
        <button onClick={refetch} className="btn-secondary text-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Обновить
        </button>
      </div>

      {sorted.length === 0 ? (
        <Empty text="Нет данных аналитики. Загрузите XLSX-файл." action={{ label: 'Перейти к импорту', onClick: () => navigate('/imports') }} />
      ) : (
        <div className="chart-container overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="detail-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Название</th>
                  <th>Категория</th>
                  <th>Паллетомест</th>
                  <th>Хранение, м³</th>
                  <th>Отгружено, м³</th>
                  <th>Отгружено, шт</th>
                  <th>Дней хранения</th>
                  <th>Оборачиваемость</th>
                  <th>Нагрузка</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((a: SKUAnalytics) => (
                  <tr
                    key={a.sku_id}
                    className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10"
                    onClick={() => navigate(`/analytics/${a.sku_id}`)}
                  >
                    <td className="font-mono text-xs font-medium">{a.sku_code}</td>
                    <td className="max-w-[150px] truncate">{a.sku_name}</td>
                    <td className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>{a.category || '—'}</td>
                    <td className="tabular-nums font-medium">{a.current_occupied_locations}</td>
                    <td className="tabular-nums">{a.total_stored_volume.toFixed(1)}</td>
                    <td className="tabular-nums">{a.total_shipped_volume.toFixed(1)}</td>
                    <td className="tabular-nums">{a.total_shipped_qty}</td>
                    <td className="tabular-nums">{a.storage_days}</td>
                    <td className="tabular-nums">
                      <span className={`font-medium ${a.turnover_efficiency > 1 ? 'text-emerald-600 dark:text-emerald-400' : a.turnover_efficiency < 0.5 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {a.turnover_efficiency.toFixed(2)}
                      </span>
                    </td>
                    <td className="tabular-nums text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>
                      {a.storage_load_ratio != null ? a.storage_load_ratio.toFixed(2) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
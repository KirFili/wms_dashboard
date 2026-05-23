import React, { useState } from 'react';
import { Loading } from '../common/Loading';
import { Empty } from '../common/Empty';
import { ErrorState as Error } from '../common/StatusBadge';
import { StatusBadge } from '../common/StatusBadge';
import { ImportPreview } from './ImportPreview';
import type { ImportBatch } from '../../types';

interface ImportHistoryProps {
  batches: ImportBatch[];
  total: number;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function ImportHistory({ batches, total, isLoading, error, onRefresh }: ImportHistoryProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) return <Loading text="Загрузка истории импортов..." />;
  if (error) return <Error message={error} onRetry={onRefresh} />;

  const paginatedBatches = batches.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-3">
      {/* Preview for selected batch */}
      {selectedBatchId && (
        <ImportPreview batchId={selectedBatchId} />
      )}

      <div className="chart-container overflow-hidden p-0">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>
            История импортов ({total})
          </h3>
          <button onClick={onRefresh} className="btn-secondary text-xs px-2 py-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>
        </div>

        {paginatedBatches.length === 0 ? (
          <div className="p-4">
            <Empty text="Нет истории импортов" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Файл</th>
                  <th>Тип</th>
                  <th>Статус</th>
                  <th>Строк</th>
                  <th>OK</th>
                  <th>WRN</th>
                  <th>ERR</th>
                  <th>Загружен</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBatches.map((b: ImportBatch) => (
                  <tr
                    key={b.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedBatchId(selectedBatchId === b.id ? null : b.id)}
                    style={selectedBatchId === b.id ? { backgroundColor: 'rgb(var(--color-bg-tertiary))' } : {}}
                  >
                    <td className="font-medium text-xs max-w-[180px] truncate">{b.file_name}</td>
                    <td><StatusBadge status={b.import_type} /></td>
                    <td><StatusBadge status={b.status} /></td>
                    <td className="tabular-nums">{b.total_rows}</td>
                    <td className="tabular-nums text-emerald-600 dark:text-emerald-400">{b.success_rows}</td>
                    <td className="tabular-nums text-amber-600 dark:text-amber-400">{b.warning_rows}</td>
                    <td className="tabular-nums text-red-600 dark:text-red-400">{b.error_rows}</td>
                    <td className="text-xs tabular-nums" style={{ color: 'rgb(var(--color-text-muted))' }}>
                      {new Date(b.uploaded_at).toLocaleString('ru')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t" style={{ borderColor: 'rgb(var(--color-border))' }}>
            <span className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>
              Стр. {page} из {totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-xs px-2 py-1 disabled:opacity-40"
              >
                ←
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-secondary text-xs px-2 py-1 disabled:opacity-40"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
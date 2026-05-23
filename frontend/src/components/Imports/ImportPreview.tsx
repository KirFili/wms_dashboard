import React, { useState, useCallback } from 'react';
import { useImportBatch } from '../../hooks/useImports';
import { Loading } from '../common/Loading';
import { Empty } from '../common/Empty';
import { ErrorState as Error } from '../common/StatusBadge';
import { StatusBadge } from '../common/StatusBadge';
import type { ImportRow } from '../../types';

interface ImportPreviewProps {
  batchId: string;
}

export function ImportPreview({ batchId }: ImportPreviewProps) {
  const {
    batch,
    rows,
    totalRows,
    isLoading,
    error,
    parse,
    validate,
    commit,
    rollback,
    refetchRows,
    refetchBatch,
  } = useImportBatch(batchId);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'rows'>('summary');

  const handleAction = useCallback(async (action: () => Promise<unknown>, label: string) => {
    setActionLoading(label);
    try {
      await action();
      refetchBatch();
      refetchRows();
    } catch {
      // handled via error state
    } finally {
      setActionLoading(null);
    }
  }, [refetchBatch, refetchRows]);

  if (isLoading) return <Loading text="Загрузка данных импорта..." />;
  if (error) return <Error message={error} onRetry={refetchBatch} />;
  if (!batch) return <Empty text="Данные не найдены" />;

  const canParse = batch.status === 'uploaded';
  const canValidate = batch.status === 'parsed';
  const canCommit = batch.status === 'validated' || batch.status === 'warning';
  const canRollback = batch.status === 'imported';

  return (
    <div className="chart-container space-y-3">
      {/* Batch Info */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>{batch.file_name}</h3>
          <div className="flex items-center gap-2">
            <StatusBadge status={batch.status} />
            <span className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>
              Тип: {batch.import_type} | {batch.total_rows} строк | ok:{batch.success_rows} wrn:{batch.warning_rows} err:{batch.error_rows}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {canParse && (
            <button
              onClick={() => handleAction(parse, 'parse')}
              disabled={actionLoading === 'parse'}
              className="btn-secondary text-xs px-2 py-1"
            >
              {actionLoading === 'parse' ? '...' : 'Парсить'}
            </button>
          )}
          {canValidate && (
            <button
              onClick={() => handleAction(validate, 'validate')}
              disabled={actionLoading === 'validate'}
              className="btn-secondary text-xs px-2 py-1"
            >
              {actionLoading === 'validate' ? '...' : 'Валидировать'}
            </button>
          )}
          {canCommit && (
            <button
              onClick={() => handleAction(commit, 'commit')}
              disabled={actionLoading === 'commit'}
              className="btn-primary text-xs px-2 py-1"
            >
              {actionLoading === 'commit' ? '...' : 'Подтвердить'}
            </button>
          )}
          {canRollback && (
            <button
              onClick={() => handleAction(rollback, 'rollback')}
              disabled={actionLoading === 'rollback'}
              className="btn-secondary text-xs px-2 py-1 text-red-600"
            >
              {actionLoading === 'rollback' ? '...' : 'Откатить'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 rounded-md border overflow-hidden w-fit" style={{ borderColor: 'rgb(var(--color-border))' }}>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            activeTab === 'summary' ? 'bg-blue-600 text-white' : ''
          }`}
          style={activeTab !== 'summary' ? { color: 'rgb(var(--color-text-secondary))' } : {}}
        >
          Сводка
        </button>
        <button
          onClick={() => setActiveTab('rows')}
          className={`px-3 py-1 text-xs font-medium transition-colors ${
            activeTab === 'rows' ? 'bg-blue-600 text-white' : ''
          }`}
          style={activeTab !== 'rows' ? { color: 'rgb(var(--color-text-secondary))' } : {}}
        >
          Строки ({totalRows})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'summary' ? (
        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="kpi-card">
            <div className="kpi-label">Всего строк</div>
            <div className="kpi-value">{batch.total_rows}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Успешно</div>
            <div className="kpi-value text-emerald-600">{batch.success_rows}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Предупреждения</div>
            <div className="kpi-value text-amber-600">{batch.warning_rows}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Ошибки</div>
            <div className="kpi-value text-red-600">{batch.error_rows}</div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-96">
          {rows.length === 0 ? (
            <Empty text="Нет данных для предпросмотра" />
          ) : (
            <table className="detail-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Статус</th>
                  <th>Ключ</th>
                  <th>Ошибки</th>
                  <th>Данные</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: ImportRow) => (
                  <tr key={row.id}>
                    <td className="tabular-nums text-xs">{row.row_number}</td>
                    <td><StatusBadge status={row.validation_status} /></td>
                    <td className="font-mono text-xs">{row.natural_key || '—'}</td>
                    <td className="text-xs text-red-600 max-w-[200px] truncate">
                      {row.error_messages?.join(', ') || '—'}
                    </td>
                    <td className="font-mono text-xs max-w-[300px] truncate" style={{ color: 'rgb(var(--color-text-muted))' }}>
                      {JSON.stringify(row.mapped_data || row.raw_data || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
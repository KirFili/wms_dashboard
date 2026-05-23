import React, { useState, useMemo } from 'react';
import { useAudit } from '../../hooks/useAudit';
import { Loading } from '../common/Loading';
import { Empty } from '../common/Empty';
import { ErrorState as Error } from '../common/StatusBadge';
import { StatusBadge } from '../common/StatusBadge';
import type { AuditLog, AuditAction } from '../../types';

const ACTION_TYPES: AuditAction[] = [
  'login', 'logout', 'create', 'update', 'delete',
  'import_start', 'import_commit', 'import_rollback',
  'user_role_change', 'data_adjustment',
];

const ENTITY_TYPES = ['', 'chamber', 'sku', 'pallet_location', 'import_batch', 'user', 'dashboard'];

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  const params: Record<string, string> = {
    page: String(page),
    page_size: '50',
    ...(actionFilter ? { action: actionFilter } : {}),
    ...(entityFilter ? { entity_type: entityFilter } : {}),
    ...(userFilter ? { username: userFilter } : {}),
  };

  const { items, total, isLoading, error, refetch } = useAudit(params);
  const totalPages = Math.ceil(total / 50);

  if (isLoading && items.length === 0) return <Loading text="Загрузка журнала аудита..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>Журнал аудита</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--color-text-muted))' }}>Всего записей: {total}</p>
        </div>
        <button onClick={refetch} className="btn-secondary text-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Обновить
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="form-select w-44 text-sm">
          <option value="">Все действия</option>
          {ACTION_TYPES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }} className="form-select w-40 text-sm">
          <option value="">Все сущности</option>
          {ENTITY_TYPES.filter(Boolean).map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Пользователь..."
          value={userFilter}
          onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
          className="form-input w-40 text-sm"
        />
      </div>

      {error ? (
        <Error message={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <Empty text="Нет записей аудита" />
      ) : (
        <div className="chart-container overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Пользователь</th>
                  <th>Действие</th>
                  <th>Сущность</th>
                  <th>ID сущности</th>
                  <th>Детали</th>
                </tr>
              </thead>
              <tbody>
                {items.map((log: AuditLog) => (
                  <tr key={log.id}>
                    <td className="tabular-nums text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString('ru')}</td>
                    <td className="text-xs font-medium">{log.username || log.user_id.slice(0, 8)}</td>
                    <td><StatusBadge status={log.action} /></td>
                    <td className="text-xs">{log.entity_type}</td>
                    <td className="font-mono text-xs max-w-[120px] truncate">{log.entity_id || '—'}</td>
                    <td className="font-mono text-xs max-w-[300px] truncate" style={{ color: 'rgb(var(--color-text-muted))' }}>
                      {log.payload ? JSON.stringify(log.payload) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
      )}
    </div>
  );
}
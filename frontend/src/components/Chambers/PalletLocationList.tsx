import React, { useState } from 'react';
import { usePalletLocations } from '../../hooks/useChambers';
import { Loading } from '../common/Loading';
import { Empty } from '../common/Empty';
import { ErrorState as Error } from '../common/StatusBadge';
import { StatusBadge } from '../common/StatusBadge';
import * as skusService from '../../services/skus';
import type { PalletLocation, PalletLocationFormData } from '../../types';

interface PalletLocationListProps {
  chamberId: string;
}

export function PalletLocationList({ chamberId }: PalletLocationListProps) {
  const [page, setPage] = useState(1);
  const params = { page: String(page), page_size: '50' };
  const { items, total, isLoading, error, refetch, create } = usePalletLocations(chamberId, params);

  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newStatus, setNewStatus] = useState('free');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      const data: PalletLocationFormData = {
        chamber_id: chamberId,
        code: newCode.trim(),
        status: newStatus as PalletLocationFormData['status'],
        note: newNote.trim() || undefined,
      };
      await create(data);
      setNewCode('');
      setNewNote('');
      setShowCreate(false);
    } catch (err: unknown) {
      setFormError((err as Error).message || 'Ошибка создания');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="chart-container space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>
          Паллетоместа ({total})
        </h2>
        <div className="flex gap-2">
          <button onClick={refetch} className="btn-secondary text-xs px-2 py-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>
          <button onClick={() => setShowCreate(!showCreate)} className="btn-primary text-xs px-2 py-1">
            + Добавить
          </button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="flex items-end gap-2 p-3 rounded-md" style={{ backgroundColor: 'rgb(var(--color-bg-tertiary))' }}>
          <div className="flex-1">
            <label className="block text-2xs font-medium mb-0.5" style={{ color: 'rgb(var(--color-text-secondary))' }}>Код</label>
            <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value)} className="form-input text-xs py-1" required placeholder="A-01-01" />
          </div>
          <div>
            <label className="block text-2xs font-medium mb-0.5" style={{ color: 'rgb(var(--color-text-secondary))' }}>Статус</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="form-select text-xs py-1">
              <option value="free">free</option>
              <option value="blocked">blocked</option>
              <option value="unavailable">unavailable</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-2xs font-medium mb-0.5" style={{ color: 'rgb(var(--color-text-secondary))' }}>Заметка</label>
            <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} className="form-input text-xs py-1" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary text-xs px-3 py-1">
            {saving ? '...' : 'OK'}
          </button>
          <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary text-xs px-2 py-1">×</button>
        </form>
      )}

      {formError && (
        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-3 py-1">{formError}</div>
      )}

      {isLoading ? (
        <Loading text="Загрузка паллетомест..." />
      ) : error ? (
        <Error message={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <Empty text="Нет паллетомест" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Код</th>
                  <th>Статус</th>
                  <th>Блокировка</th>
                  <th>Заметка</th>
                  <th>Изменено</th>
                </tr>
              </thead>
              <tbody>
                {items.map((loc: PalletLocation) => (
                  <tr key={loc.id}>
                    <td className="font-mono text-xs font-medium">{loc.code}</td>
                    <td><StatusBadge status={loc.status} /></td>
                    <td>{loc.is_blocked ? <StatusBadge status="blocked" /> : <span className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>—</span>}</td>
                    <td className="text-xs max-w-[200px] truncate" style={{ color: 'rgb(var(--color-text-secondary))' }}>{loc.note || '—'}</td>
                    <td className="text-xs tabular-nums" style={{ color: 'rgb(var(--color-text-muted))' }}>
                      {loc.last_modified ? new Date(loc.last_modified).toLocaleString('ru') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
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
        </>
      )}
    </div>
  );
}

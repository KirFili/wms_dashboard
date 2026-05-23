import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChambers } from '../../hooks/useChambers';
import { Loading } from '../common/Loading';
import { Empty } from '../common/Empty';
import { ErrorState as Error } from '../common/StatusBadge';
import { StatusBadge } from '../common/StatusBadge';
import type { Chamber } from '../../types';

const CHAMBER_TYPES = ['', 'deep-freeze', 'cooler', 'ambient', 'dry', 'hazardous', 'quarantine'];

export function ChambersPage() {
  const navigate = useNavigate();
  const { items, total, isLoading, error, refetch } = useChambers();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return items.filter((c: Chamber) => {
      const matchSearch = !search || c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase());
      const matchType = !typeFilter || c.chamber_type === typeFilter;
      const matchStatus = statusFilter === '' || (statusFilter === 'active' ? c.is_active : !c.is_active);
      return matchSearch && matchType && matchStatus;
    });
  }, [items, search, typeFilter, statusFilter]);

  if (isLoading) return <Loading text="Загрузка камер..." />;
  if (error) return <Error message={error} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>Камеры хранения</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--color-text-muted))' }}>Всего: {total}</p>
        </div>
        <button onClick={() => navigate('/chambers/new')} className="btn-primary text-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Создать камеру
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Поиск по коду или названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input w-64 text-sm"
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="form-select w-44 text-sm">
          <option value="">Все типы</option>
          {CHAMBER_TYPES.filter(Boolean).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select w-36 text-sm">
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="inactive">Неактивные</option>
        </select>
        <button onClick={refetch} className="btn-secondary text-sm ml-auto">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Обновить
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Empty text="Камеры не найдены" action={{ label: 'Создать камеру', onClick: () => navigate('/chambers/new') }} />
      ) : (
        <div className="chart-container overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Код</th>
                  <th>Название</th>
                  <th>Тип</th>
                  <th>Вместимость</th>
                  <th>Зона</th>
                  <th>Темп. режим</th>
                  <th>Статус</th>
                  <th>Создана</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((chamber: Chamber) => (
                  <tr
                    key={chamber.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/chambers/${chamber.id}`)}
                  >
                    <td className="font-medium font-mono text-xs">{chamber.code}</td>
                    <td>{chamber.name}</td>
                    <td><StatusBadge status={chamber.chamber_type} /></td>
                    <td className="tabular-nums">{chamber.capacity_pallets}</td>
                    <td className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>{chamber.zone || '—'}</td>
                    <td className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>{chamber.temperature_mode || '—'}</td>
                    <td className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>{new Date(chamber.created_at).toLocaleDateString('ru')}</td>
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

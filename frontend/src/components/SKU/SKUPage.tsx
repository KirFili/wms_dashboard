import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSKU } from '../../hooks/useSKU';
import { Loading } from '../common/Loading';
import { Empty } from '../common/Empty';
import { ErrorState as Error } from '../common/StatusBadge';
import { StatusBadge } from '../common/StatusBadge';
import type { SKU } from '../../types';

export function SKUPage() {
  const navigate = useNavigate();
  const { items, total, isLoading, error, refetch } = useSKU();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return items.filter((s: SKU) => {
      const matchSearch = !search || s.sku_code.toLowerCase().includes(search.toLowerCase()) || s.sku_name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || s.category === categoryFilter;
      const matchStatus = statusFilter === '' || (statusFilter === 'active' ? s.is_active : !s.is_active);
      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

  const categories = useMemo(() => {
    const cats = new Set(items.map((s: SKU) => s.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [items]);

  if (isLoading) return <Loading text="Загрузка SKU..." />;
  if (error) return <Error message={error} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>Справочник SKU</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--color-text-muted))' }}>Всего: {total}</p>
        </div>
        <button onClick={() => navigate('/skus/new')} className="btn-primary text-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Создать SKU
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
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="form-select w-44 text-sm">
          <option value="">Все категории</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
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
        <Empty text="SKU не найдены" action={{ label: 'Создать SKU', onClick: () => navigate('/skus/new') }} />
      ) : (
        <div className="chart-container overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Код</th>
                  <th>Название</th>
                  <th>Категория</th>
                  <th>Ед. изм.</th>
                  <th>Паллет-коэфф.</th>
                  <th>Объём</th>
                  <th>Статус</th>
                  <th>Создан</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sku: SKU) => (
                  <tr
                    key={sku.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/skus/${sku.id}`)}
                  >
                    <td className="font-medium font-mono text-xs">{sku.sku_code}</td>
                    <td>{sku.sku_name}</td>
                    <td className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>{sku.category || '—'}</td>
                    <td className="text-xs">{sku.unit}</td>
                    <td className="tabular-nums text-xs">{sku.pallet_coeff ?? '—'}</td>
                    <td className="tabular-nums text-xs">{sku.volume ?? '—'}</td>
                    <td>{sku.is_active ? <StatusBadge status="valid" /> : <StatusBadge status="blocked" />}</td>
                    <td className="text-xs" style={{ color: 'rgb(var(--color-text-muted))' }}>{new Date(sku.created_at).toLocaleDateString('ru')}</td>
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

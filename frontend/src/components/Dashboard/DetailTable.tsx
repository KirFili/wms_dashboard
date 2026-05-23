import React, { useState, useMemo } from 'react';
import type { DashboardDetail } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface DetailTableProps {
  data: DashboardDetail[];
  onChamberClick?: (chamberId: string) => void;
  onSkuClick?: (skuId: string) => void;
}

export function DetailTable({ data, onChamberClick, onSkuClick }: DetailTableProps) {
  const [sortKey, setSortKey] = useState<keyof DashboardDetail | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterText, setFilterText] = useState('');

  const sorted = useMemo(() => {
    let filtered = data;
    if (filterText) {
      const lower = filterText.toLowerCase();
      filtered = data.filter(
        (d) =>
          d.chamber_code.toLowerCase().includes(lower) ||
          d.chamber_name.toLowerCase().includes(lower) ||
          d.sku_code.toLowerCase().includes(lower) ||
          d.sku_name.toLowerCase().includes(lower) ||
          d.location_code.toLowerCase().includes(lower),
      );
    }

    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data, sortKey, sortDir, filterText]);

  const handleSort = (key: keyof DashboardDetail) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const columns: { key: keyof DashboardDetail; label: string; sortable: boolean }[] = [
    { key: 'chamber_code', label: 'Камера', sortable: true },
    { key: 'sku_code', label: 'SKU', sortable: true },
    { key: 'location_code', label: 'Паллетоместо', sortable: true },
    { key: 'status', label: 'Статус', sortable: true },
    { key: 'occupied_locations', label: 'Занято мест', sortable: true },
    { key: 'occupied_volume', label: 'Объём', sortable: true },
    { key: 'snapshot_date', label: 'Дата снимка', sortable: true },
  ];

  const SortIcon = ({ colKey }: { colKey: keyof DashboardDetail }) => {
    if (sortKey !== colKey) return <span className="text-slate-300 dark:text-slate-600 ml-1">↕</span>;
    return <span className="text-blue-500 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Детализация ({sorted.length})
        </h3>
        <input
          type="text"
          placeholder="Поиск..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="form-input w-48 text-xs py-1"
        />
      </div>
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="detail-table w-full">
          <thead>
            <tr className="sticky-thead">
              {columns.map((col) => (
                <th key={col.key}>
                  <button
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={`inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider ${
                      col.sortable ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-200' : ''
                    }`}
                    style={{ color: 'inherit' }}
                  >
                    {col.label}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={row.id || i}>
                <td>
                  <button
                    onClick={() => onChamberClick?.(row.id)}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                  >
                    {row.chamber_code}
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => onSkuClick?.(row.id)}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                  >
                    {row.sku_code || row.sku_name}
                  </button>
                </td>
                <td className="font-mono text-xs">{row.location_code}</td>
                <td><StatusBadge status={row.status} /></td>
                <td className="tabular-nums">{row.occupied_locations}</td>
                <td className="tabular-nums">{row.occupied_volume?.toFixed(2) ?? '-'}</td>
                <td className="text-xs tabular-nums">{row.snapshot_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChambers } from '../../hooks/useChambers';
import { Loading } from '../common/Loading';
import { ErrorState as Error } from '../common/StatusBadge';
import * as chambersService from '../../services/chambers';
import type { Chamber, ChamberFormData } from '../../types';

const CHAMBER_TYPES = ['deep-freeze', 'cooler', 'ambient', 'dry', 'hazardous', 'quarantine'];

export function ChamberForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { create, update } = useChambers();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ChamberFormData>({
    warehouse_id: '',
    code: '',
    name: '',
    chamber_type: 'ambient',
    capacity_pallets: 0,
    zone: '',
    temperature_mode: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    chambersService.fetchChamber(id)
      .then((c: Chamber) => {
        setForm({
          warehouse_id: c.warehouse_id,
          code: c.code,
          name: c.name,
          chamber_type: c.chamber_type,
          capacity_pallets: c.capacity_pallets,
          zone: c.zone || '',
          temperature_mode: c.temperature_mode || '',
        });
      })
      .catch((err: unknown) => setError((err as Error).message || 'Ошибка загрузки'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleChange = (field: keyof ChamberFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit && id) {
        await update(id, form);
      } else {
        await create(form);
      }
      navigate('/chambers');
    } catch (err: unknown) {
      setError((err as Error).message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Loading text="Загрузка камеры..." />;
  if (error && isEdit) return <Error message={error} onRetry={() => navigate('/chambers')} />;

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/chambers')} className="btn-secondary text-sm px-2 py-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>
          {isEdit ? 'Редактирование камеры' : 'Новая камера'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="chart-container space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Код</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value)}
              className="form-input"
              required
              placeholder="CH-001"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Название</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="form-input"
              required
              placeholder="Камера A"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Тип камеры</label>
            <select value={form.chamber_type} onChange={(e) => handleChange('chamber_type', e.target.value)} className="form-select">
              {CHAMBER_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Вместимость (паллет)</label>
            <input
              type="number"
              value={form.capacity_pallets}
              onChange={(e) => handleChange('capacity_pallets', parseInt(e.target.value) || 0)}
              className="form-input"
              min={0}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Зона</label>
            <input
              type="text"
              value={form.zone}
              onChange={(e) => handleChange('zone', e.target.value)}
              className="form-input"
              placeholder="Зона A"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Температурный режим</label>
            <input
              type="text"
              value={form.temperature_mode}
              onChange={(e) => handleChange('temperature_mode', e.target.value)}
              className="form-input"
              placeholder="например, -18°C"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Warehouse ID</label>
          <input
            type="text"
            value={form.warehouse_id}
            onChange={(e) => handleChange('warehouse_id', e.target.value)}
            className="form-input"
            required
            placeholder="UUID склада"
          />
        </div>

        {error && (
          <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
          </button>
          <button type="button" onClick={() => navigate('/chambers')} className="btn-secondary">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

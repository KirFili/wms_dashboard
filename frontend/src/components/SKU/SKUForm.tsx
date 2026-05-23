import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSKU } from '../../hooks/useSKU';
import { Loading } from '../common/Loading';
import { ErrorState as Error } from '../common/StatusBadge';
import * as skusService from '../../services/skus';
import type { SKU, SKUFormData } from '../../types';

export function SKUForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { create, update } = useSKU();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SKUFormData>({
    sku_code: '',
    sku_name: '',
    category: '',
    unit: 'pcs',
    pallet_coeff: undefined,
    volume: undefined,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    skusService.fetchSKU(id)
      .then((s: SKU) => {
        setForm({
          sku_code: s.sku_code,
          sku_name: s.sku_name,
          category: s.category || '',
          unit: s.unit,
          pallet_coeff: s.pallet_coeff ?? undefined,
          volume: s.volume ?? undefined,
        });
      })
      .catch((err: unknown) => setError((err as Error).message || 'Ошибка загрузки'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleChange = (field: keyof SKUFormData, value: string | number | undefined) => {
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
      navigate('/skus');
    } catch (err: unknown) {
      setError((err as Error).message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Loading text="Загрузка SKU..." />;
  if (error && isEdit) return <Error message={error} onRetry={() => navigate('/skus')} />;

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/skus')} className="btn-secondary text-sm px-2 py-1">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text-primary))' }}>
          {isEdit ? 'Редактирование SKU' : 'Новый SKU'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="chart-container space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Код SKU</label>
            <input
              type="text"
              value={form.sku_code}
              onChange={(e) => handleChange('sku_code', e.target.value)}
              className="form-input"
              required
              placeholder="SKU-001"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Название</label>
            <input
              type="text"
              value={form.sku_name}
              onChange={(e) => handleChange('sku_name', e.target.value)}
              className="form-input"
              required
              placeholder="Товар А"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Категория</label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="form-input"
              placeholder="Напитки"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Ед. измерения</label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              className="form-input"
              placeholder="pcs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Паллет-коэфф.</label>
            <input
              type="number"
              value={form.pallet_coeff ?? ''}
              onChange={(e) => handleChange('pallet_coeff', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="form-input"
              step="0.01"
              placeholder="1.0"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Объём</label>
          <input
            type="number"
            value={form.volume ?? ''}
            onChange={(e) => handleChange('volume', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="form-input w-48"
            step="0.001"
            placeholder="м³"
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
          <button type="button" onClick={() => navigate('/skus')} className="btn-secondary">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

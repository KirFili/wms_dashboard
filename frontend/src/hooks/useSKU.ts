import { useState, useEffect, useCallback } from 'react';
import * as skusService from '../services/skus';
import type { SKU, SKUFormData } from '../types';

export function useSKU(params?: Record<string, string>) {
  const [items, setItems] = useState<SKU[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await skusService.fetchSKUs(params);
      setItems(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (data: SKUFormData) => {
    const created = await skusService.createSKU(data);
    setItems((prev) => [...prev, created]);
    return created;
  };

  const update = async (id: string, data: Partial<SKUFormData>) => {
    const updated = await skusService.updateSKU(id, data);
    setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
    return updated;
  };

  return { items, total, isLoading, error, refetch: fetchAll, create, update };
}
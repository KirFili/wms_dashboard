import { useState, useEffect, useCallback } from 'react';
import * as chambersService from '../services/chambers';
import * as skusService from '../services/skus';
import type { Chamber, ChamberFormData, PalletLocation, PalletLocationFormData } from '../types';

export function useChambers(params?: Record<string, string>) {
  const [items, setItems] = useState<Chamber[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await chambersService.fetchChambers(params);
      setItems(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (data: ChamberFormData) => {
    const created = await chambersService.createChamber(data);
    setItems((prev) => [...prev, created]);
    return created;
  };

  const update = async (id: string, data: Partial<ChamberFormData>) => {
    const updated = await chambersService.updateChamber(id, data);
    setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
    return updated;
  };

  return { items, total, isLoading, error, refetch: fetchAll, create, update };
}

export function usePalletLocations(chamberId?: string, params?: Record<string, string>) {
  const [items, setItems] = useState<PalletLocation[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const p = { ...params, ...(chamberId ? { chamber_id: chamberId } : {}) } as Record<string, string>;
      const res = await skusService.fetchPalletLocations(p);
      setItems(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(params), chamberId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (data: PalletLocationFormData) => {
    const created = await skusService.createPalletLocation(data);
    setItems((prev) => [...prev, created]);
    return created;
  };

  const update = async (id: string, data: Partial<PalletLocationFormData>) => {
    const updated = await skusService.updatePalletLocation(id, data);
    setItems((prev) => prev.map((it) => (it.id === id ? updated : it)));
    return updated;
  };

  return { items, total, isLoading, error, refetch: fetchAll, create, update };
}
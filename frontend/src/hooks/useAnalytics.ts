import { useState, useEffect, useCallback } from 'react';
import * as analyticsService from '../services/analytics';
import type { SKUAnalytics, SKUTrendPoint, SKUShipmentPoint } from '../types';

export function useAnalytics(params?: Record<string, string>) {
  const [items, setItems] = useState<SKUAnalytics[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await analyticsService.fetchSKUAnalytics(params);
      setItems(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { items, total, isLoading, error, refetch: fetchAll };
}

export function useSKUDetail(skuId: string | null) {
  const [analytics, setAnalytics] = useState<SKUAnalytics | null>(null);
  const [trend, setTrend] = useState<SKUTrendPoint[]>([]);
  const [shipments, setShipments] = useState<SKUShipmentPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!skuId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [a, t, s] = await Promise.all([
        analyticsService.fetchSKUAnalyticsById(skuId),
        analyticsService.fetchSKUTrend(skuId),
        analyticsService.fetchSKUShipments(skuId),
      ]);
      setAnalytics(a);
      setTrend(t);
      setShipments(s);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setIsLoading(false);
    }
  }, [skuId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { analytics, trend, shipments, isLoading, error, refetch: fetchAll };
}
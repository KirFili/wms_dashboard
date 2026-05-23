import { useState, useEffect, useCallback } from 'react';
import * as auditService from '../services/audit';
import type { AuditLog } from '../types';

export function useAudit(params?: Record<string, string>) {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await auditService.fetchAuditLogs(params);
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
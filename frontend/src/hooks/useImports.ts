import { useState, useEffect, useCallback } from 'react';
import * as importsService from '../services/imports';
import type { ImportBatch, ImportRow } from '../types';

export function useImports(params?: Record<string, string>) {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await importsService.fetchImportBatches(params);
      setBatches(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const upload = async (file: File, importType: string) => {
    const batch = await importsService.uploadFile(file, importType);
    setBatches((prev) => [batch, ...prev]);
    return batch;
  };

  return { batches, total, isLoading, error, refetch: fetchAll, upload };
}

export function useImportBatch(batchId: string | null) {
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBatch = useCallback(async () => {
    if (!batchId) return;
    setIsLoading(true);
    setError(null);
    try {
      const b = await importsService.fetchImportBatch(batchId);
      setBatch(b);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setIsLoading(false);
    }
  }, [batchId]);

  const fetchRows = useCallback(async () => {
    if (!batchId) return;
    try {
      const res = await importsService.fetchImportRows(batchId);
      setRows(res.items);
      setTotalRows(res.total);
    } catch {
      // handled separately
    }
  }, [batchId]);

  useEffect(() => { fetchBatch(); fetchRows(); }, [fetchBatch, fetchRows]);

  const parse = async () => {
    if (!batchId) return;
    const updated = await importsService.parseBatch(batchId);
    setBatch(updated);
    return updated;
  };

  const validate = async () => {
    if (!batchId) return;
    const updated = await importsService.validateBatch(batchId);
    setBatch(updated);
    return updated;
  };

  const commit = async () => {
    if (!batchId) return;
    const updated = await importsService.commitBatch(batchId);
    setBatch(updated);
    return updated;
  };

  const rollback = async () => {
    if (!batchId) return;
    const updated = await importsService.rollbackBatch(batchId);
    setBatch(updated);
    return updated;
  };

  return { batch, rows, totalRows, isLoading, error, parse, validate, commit, rollback, refetchBatch: fetchBatch, refetchRows: fetchRows };
}
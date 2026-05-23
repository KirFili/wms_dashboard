import api from './api';
import type { ImportBatch, ImportRow, PaginatedResponse } from '../types';

export async function uploadFile(file: File, importType: string): Promise<ImportBatch> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('import_type', importType);
  const res = await api.post<ImportBatch>('/imports/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function parseBatch(batchId: string): Promise<ImportBatch> {
  const res = await api.post<ImportBatch>(`/imports/${batchId}/parse`);
  return res.data;
}

export async function validateBatch(batchId: string): Promise<ImportBatch> {
  const res = await api.post<ImportBatch>(`/imports/${batchId}/validate`);
  return res.data;
}

export async function commitBatch(batchId: string): Promise<ImportBatch> {
  const res = await api.post<ImportBatch>(`/imports/${batchId}/commit`);
  return res.data;
}

export async function rollbackBatch(batchId: string): Promise<ImportBatch> {
  const res = await api.post<ImportBatch>(`/imports/${batchId}/rollback`);
  return res.data;
}

export async function fetchImportBatches(params?: Record<string, string>): Promise<PaginatedResponse<ImportBatch>> {
  const res = await api.get<PaginatedResponse<ImportBatch>>('/imports', { params });
  return res.data;
}

export async function fetchImportBatch(id: string): Promise<ImportBatch> {
  const res = await api.get<ImportBatch>(`/imports/${id}`);
  return res.data;
}

export async function fetchImportRows(batchId: string, params?: Record<string, string>): Promise<PaginatedResponse<ImportRow>> {
  const res = await api.get<PaginatedResponse<ImportRow>>(`/imports/${batchId}/rows`, { params });
  return res.data;
}
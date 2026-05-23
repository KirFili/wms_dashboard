import api from './api';
import type { AuditLog, PaginatedResponse } from '../types';

export async function fetchAuditLogs(params?: Record<string, string>): Promise<PaginatedResponse<AuditLog>> {
  const res = await api.get<PaginatedResponse<AuditLog>>('/audit-logs', { params });
  return res.data;
}
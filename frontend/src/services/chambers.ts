import api from './api';
import type { Chamber, ChamberFormData, PaginatedResponse } from '../types';

export async function fetchChambers(params?: Record<string, string>): Promise<PaginatedResponse<Chamber>> {
  const res = await api.get<PaginatedResponse<Chamber>>('/chambers', { params });
  return res.data;
}

export async function fetchChamber(id: string): Promise<Chamber> {
  const res = await api.get<Chamber>(`/chambers/${id}`);
  return res.data;
}

export async function createChamber(data: ChamberFormData): Promise<Chamber> {
  const res = await api.post<Chamber>('/chambers', data);
  return res.data;
}

export async function updateChamber(id: string, data: Partial<ChamberFormData>): Promise<Chamber> {
  const res = await api.put<Chamber>(`/chambers/${id}`, data);
  return res.data;
}
import api from './api';
import type { SKU, SKUFormData, PalletLocation, PalletLocationFormData, PaginatedResponse } from '../types';

export async function fetchSKUs(params?: Record<string, string>): Promise<PaginatedResponse<SKU>> {
  const res = await api.get<PaginatedResponse<SKU>>('/skus', { params });
  return res.data;
}

export async function fetchSKU(id: string): Promise<SKU> {
  const res = await api.get<SKU>(`/skus/${id}`);
  return res.data;
}

export async function createSKU(data: SKUFormData): Promise<SKU> {
  const res = await api.post<SKU>('/skus', data);
  return res.data;
}

export async function updateSKU(id: string, data: Partial<SKUFormData>): Promise<SKU> {
  const res = await api.put<SKU>(`/skus/${id}`, data);
  return res.data;
}

// Pallet Locations
export async function fetchPalletLocations(params?: Record<string, string>): Promise<PaginatedResponse<PalletLocation>> {
  const res = await api.get<PaginatedResponse<PalletLocation>>('/pallet-locations', { params });
  return res.data;
}

export async function createPalletLocation(data: PalletLocationFormData): Promise<PalletLocation> {
  const res = await api.post<PalletLocation>('/pallet-locations', data);
  return res.data;
}

export async function updatePalletLocation(id: string, data: Partial<PalletLocationFormData>): Promise<PalletLocation> {
  const res = await api.put<PalletLocation>(`/pallet-locations/${id}`, data);
  return res.data;
}
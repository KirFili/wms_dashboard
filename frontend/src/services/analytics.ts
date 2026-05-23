import api from './api';
import type { SKUAnalytics, SKUTrendPoint, SKUShipmentPoint, PaginatedResponse } from '../types';

export async function fetchSKUAnalytics(params?: Record<string, string>): Promise<PaginatedResponse<SKUAnalytics>> {
  const res = await api.get<PaginatedResponse<SKUAnalytics>>('/analytics/sku', { params });
  return res.data;
}

export async function fetchSKUAnalyticsById(id: string): Promise<SKUAnalytics> {
  const res = await api.get<SKUAnalytics>(`/analytics/sku/${id}`);
  return res.data;
}

export async function fetchSKUTrend(id: string, params?: Record<string, string>): Promise<SKUTrendPoint[]> {
  const res = await api.get<SKUTrendPoint[]>(`/analytics/sku/${id}/trend`, { params });
  return res.data;
}

export async function fetchSKUShipments(id: string, params?: Record<string, string>): Promise<SKUShipmentPoint[]> {
  const res = await api.get<SKUShipmentPoint[]>(`/analytics/sku/${id}/shipments`, { params });
  return res.data;
}
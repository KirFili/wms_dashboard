import api from './api';
import type {
  DashboardSummary,
  ChamberOccupancy,
  OccupancyTrendPoint,
  SKUEfficiency,
  DashboardDetail,
} from '../types';

export interface DashboardFilters {
  date_from?: string;
  date_to?: string;
  warehouse_id?: string;
  chamber_id?: string;
  sku_id?: string;
  category?: string;
  location_status?: string;
}

export async function fetchDashboardSummary(filters?: DashboardFilters): Promise<DashboardSummary[]> {
  const res = await api.get<DashboardSummary[]>('/dashboard/summary', { params: filters });
  return res.data;
}

export async function fetchChambersOccupancy(filters?: DashboardFilters): Promise<ChamberOccupancy[]> {
  const res = await api.get<ChamberOccupancy[]>('/dashboard/chambers-occupancy', { params: filters });
  return res.data;
}

export async function fetchOccupancyTrend(filters?: DashboardFilters): Promise<OccupancyTrendPoint[]> {
  const res = await api.get<OccupancyTrendPoint[]>('/dashboard/occupancy-trend', { params: filters });
  return res.data;
}

export async function fetchSKUEfficiency(filters?: DashboardFilters): Promise<SKUEfficiency[]> {
  const res = await api.get<SKUEfficiency[]>('/dashboard/sku-efficiency', { params: filters });
  return res.data;
}

export async function fetchHeatmap(filters?: DashboardFilters): Promise<ChamberOccupancy[]> {
  const res = await api.get<ChamberOccupancy[]>('/dashboard/heatmap', { params: filters });
  return res.data;
}

export async function fetchDashboardDetails(filters?: DashboardFilters): Promise<DashboardDetail[]> {
  const res = await api.get<DashboardDetail[]>('/dashboard/details', { params: filters });
  return res.data;
}

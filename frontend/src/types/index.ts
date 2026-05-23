// ====== Auth ======
export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface User {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'viewer' | 'analyst' | 'admin';

// ====== Warehouse ======
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ====== Chamber ======
export interface Chamber {
  id: string;
  warehouse_id: string;
  code: string;
  name: string;
  chamber_type: string;
  capacity_pallets: number;
  zone: string | null;
  temperature_mode: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChamberFormData {
  warehouse_id: string;
  code: string;
  name: string;
  chamber_type: string;
  capacity_pallets: number;
  zone?: string;
  temperature_mode?: string;
}

// ====== Pallet Location ======
export interface PalletLocation {
  id: string;
  chamber_id: string;
  code: string;
  status: PalletLocationStatus;
  is_blocked: boolean;
  last_modified: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type PalletLocationStatus = 'free' | 'occupied' | 'blocked' | 'unavailable';

export interface PalletLocationFormData {
  chamber_id: string;
  code: string;
  status?: PalletLocationStatus;
  note?: string;
}

// ====== SKU ======
export interface SKU {
  id: string;
  sku_code: string;
  sku_name: string;
  category: string | null;
  unit: string;
  pallet_coeff: number | null;
  volume: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SKUFormData {
  sku_code: string;
  sku_name: string;
  category?: string;
  unit?: string;
  pallet_coeff?: number;
  volume?: number;
}

// ====== Dashboard KPI ======
export interface DashboardSummary {
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
  total_active_locations: number;
  free_locations: number;
  occupied_locations: number;
  blocked_locations: number;
  unavailable_locations: number;
  active_sku_count: number;
  occupancy_rate_pct: number;
  last_snapshot_date: string | null;
  last_import_at: string | null;
}

export interface ChamberOccupancy {
  chamber_id: string;
  warehouse_id: string;
  chamber_code: string;
  chamber_name: string;
  chamber_type: string;
  zone: string | null;
  capacity_pallets: number;
  total_locations: number;
  free_locations: number;
  occupied_locations: number;
  blocked_locations: number;
  unavailable_locations: number;
  occupancy_rate_pct: number;
  distinct_sku_count: number;
}

export interface OccupancyTrendPoint {
  snapshot_date: string;
  warehouse_id: string;
  chamber_id: string;
  occupied_locations: number;
  free_locations: number;
  active_sku_count: number;
  total_occupied_volume: number;
}

export interface SKUEfficiency {
  sku_id: string;
  sku_code: string;
  sku_name: string;
  category: string | null;
  unit: string;
  pallet_coeff: number | null;
  current_occupied_locations: number;
  total_stored_volume: number;
  total_shipped_volume: number;
  total_shipped_qty: number;
  storage_days: number;
  turnover_efficiency: number;
  storage_load_ratio: number | null;
}

export interface DashboardDetail {
  id: string;
  chamber_code: string;
  chamber_name: string;
  sku_code: string;
  sku_name: string;
  location_code: string;
  status: string;
  occupied_locations: number;
  occupied_volume: number;
  snapshot_date: string;
}

// ====== Import ======
export interface ImportBatch {
  id: string;
  file_name: string;
  import_type: ImportType;
  status: ImportStatus;
  uploaded_by: string;
  uploaded_at: string;
  validated_at: string | null;
  imported_at: string | null;
  total_rows: number;
  success_rows: number;
  warning_rows: number;
  error_rows: number;
  checksum: string | null;
  meta: Record<string, unknown> | null;
}

export type ImportType = 'stock_snapshot' | 'shipment' | 'movement';
export type ImportStatus = 'uploaded' | 'parsed' | 'validated' | 'warning' | 'error' | 'imported' | 'rolled_back';

export interface ImportRow {
  id: string;
  batch_id: string;
  row_number: number;
  raw_data: Record<string, unknown> | null;
  mapped_data: Record<string, unknown> | null;
  validation_status: ImportRowValidationStatus;
  error_messages: string[] | null;
  natural_key: string | null;
  created_at: string;
}

export type ImportRowValidationStatus = 'pending' | 'valid' | 'warning' | 'error';

// ====== SKU Analytics ======
export interface SKUAnalytics {
  sku_id: string;
  sku_code: string;
  sku_name: string;
  category: string | null;
  unit: string;
  pallet_coeff: number | null;
  current_occupied_locations: number;
  avg_occupied_locations?: number;
  max_occupied_locations?: number;
  total_stored_volume: number;
  total_shipped_volume: number;
  total_shipped_qty: number;
  storage_days: number;
  turnover_efficiency: number;
  storage_load_ratio: number | null;
}

export interface SKUTrendPoint {
  date: string;
  occupied_locations: number;
  occupied_volume: number;
}

export interface SKUShipmentPoint {
  date: string;
  shipped_qty: number;
  shipped_volume: number;
}

// ====== Audit ======
export interface AuditLog {
  id: string;
  user_id: string;
  username?: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export type AuditAction = 'login' | 'logout' | 'create' | 'update' | 'delete'
  | 'import_start' | 'import_commit' | 'import_rollback'
  | 'user_role_change' | 'data_adjustment';

// ====== Common ======
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiError {
  detail: string;
  errors?: Record<string, string[]>;
}

export interface FilterState {
  dateFrom: string;
  dateTo: string;
  warehouseId: string;
  chamberId: string;
  skuId: string;
  category: string;
  locationStatus: string;
  period: PeriodPreset;
}

export type PeriodPreset = 'day' | 'week' | 'month' | 'custom';

// ====== Navigation ======
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
}

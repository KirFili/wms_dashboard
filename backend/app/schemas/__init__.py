"""
Pydantic-схемы для WMS Dashboard.
Экспорт всех схем из одного модуля.
"""

from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    UserResponse,
)
from app.schemas.dashboard import (
    DashboardSummary,
    ChamberOccupancyItem,
    OccupancyTrendItem,
    SkuEfficiencyItem,
    HeatmapItem,
    DetailItem,
)
from app.schemas.chamber import (
    ChamberCreate,
    ChamberUpdate,
    ChamberResponse,
    ChamberListResponse,
)
from app.schemas.pallet_location import (
    PalletLocationCreate,
    PalletLocationUpdate,
    PalletLocationResponse,
    PalletLocationListResponse,
)
from app.schemas.sku import (
    SKUCreate,
    SKUUpdate,
    SKUResponse,
    SKUListResponse,
)
from app.schemas.import_ import (
    ImportBatchResponse,
    ImportBatchListResponse,
    ImportRowResponse,
)
from app.schemas.analytics import (
    SKUAnalyticsResponse,
    SKUAnalyticsListResponse,
    SKUTrendItem,
    SKUShipmentItem,
    SKULocationItem,
)
from app.schemas.audit_log import (
    AuditLogResponse,
    AuditLogListResponse,
)

__all__ = [
    "LoginRequest",
    "TokenResponse",
    "UserResponse",
    "DashboardSummary",
    "ChamberOccupancyItem",
    "OccupancyTrendItem",
    "SkuEfficiencyItem",
    "HeatmapItem",
    "DetailItem",
    "ChamberCreate",
    "ChamberUpdate",
    "ChamberResponse",
    "ChamberListResponse",
    "PalletLocationCreate",
    "PalletLocationUpdate",
    "PalletLocationResponse",
    "PalletLocationListResponse",
    "SKUCreate",
    "SKUUpdate",
    "SKUResponse",
    "SKUListResponse",
    "ImportBatchResponse",
    "ImportBatchListResponse",
    "ImportRowResponse",
    "SKUAnalyticsResponse",
    "SKUAnalyticsListResponse",
    "SKUTrendItem",
    "SKUShipmentItem",
    "SKULocationItem",
    "AuditLogResponse",
    "AuditLogListResponse",
]

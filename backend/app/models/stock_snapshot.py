"""
Модель StockSnapshot — снимок состояния хранения на дату.
"""

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.warehouse import Warehouse
    from app.models.chamber import Chamber
    from app.models.pallet_location import PalletLocation
    from app.models.sku import SKU
    from app.models.import_batch import ImportBatch


class StockSnapshot(Base):
    """Снимок состояния хранения на дату."""

    __tablename__ = "stock_snapshots"
    __table_args__ = (
        UniqueConstraint("natural_key", name="uq_stock_snapshots_natural_key"),
        CheckConstraint(
            "occupied_locations >= 0", name="ch_stock_snapshots_occupied_locations"
        ),
        Index("ix_stock_snapshots_date_chamber", "snapshot_date", "chamber_id"),
        Index("ix_stock_snapshots_date_sku", "snapshot_date", "sku_id"),
        Index("ix_stock_snapshots_warehouse_date", "warehouse_id", "snapshot_date"),
        Index("ix_stock_snapshots_batch", "source_batch_id"),
        {"schema": "wms"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    snapshot_date: Mapped[date] = mapped_column(nullable=False)
    warehouse_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.warehouses.id"), nullable=False
    )
    chamber_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.chambers.id"), nullable=False
    )
    pallet_location_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.pallet_locations.id"), nullable=True
    )
    sku_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.skus.id"), nullable=False
    )
    occupied_locations: Mapped[int] = mapped_column(Integer, nullable=False)
    occupied_volume: Mapped[float | None] = mapped_column(Numeric(14, 4), nullable=True)
    source_batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.import_batches.id"), nullable=False
    )
    natural_key: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    # Связи
    warehouse: Mapped["Warehouse"] = relationship("Warehouse", back_populates="stock_snapshots")
    chamber: Mapped["Chamber"] = relationship("Chamber", back_populates="stock_snapshots")
    pallet_location: Mapped["PalletLocation | None"] = relationship(
        "PalletLocation", back_populates="stock_snapshots"
    )
    sku: Mapped["SKU"] = relationship("SKU", back_populates="stock_snapshots")
    source_batch: Mapped["ImportBatch"] = relationship(
        "ImportBatch", back_populates="stock_snapshots", foreign_keys=[source_batch_id]
    )

    def __repr__(self) -> str:
        return f"<StockSnapshot(date={self.snapshot_date}, nk='{self.natural_key}')>"
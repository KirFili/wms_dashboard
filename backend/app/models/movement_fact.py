"""
Модель MovementFact — операция: размещение / перемещение / освобождение.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
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


class MovementFact(Base):
    """Операция движения товара."""

    __tablename__ = "movement_facts"
    __table_args__ = (
        UniqueConstraint("natural_key", name="uq_movement_facts_natural_key"),
        CheckConstraint(
            "operation_type IN ('placement', 'relocation', 'release', 'adjustment', 'other')",
            name="ch_movement_facts_type",
        ),
        Index("ix_movement_facts_datetime_chamber", "operation_datetime", "chamber_id"),
        Index(
            "ix_movement_facts_datetime_warehouse", "operation_datetime", "warehouse_id"
        ),
        Index("ix_movement_facts_batch", "source_batch_id"),
        {"schema": "wms"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    operation_datetime: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    warehouse_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.warehouses.id"), nullable=False
    )
    chamber_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.chambers.id"), nullable=False
    )
    pallet_location_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.pallet_locations.id"), nullable=True
    )
    sku_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.skus.id"), nullable=True
    )
    operation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    qty: Mapped[float | None] = mapped_column(Numeric(14, 4), nullable=True)
    volume: Mapped[float | None] = mapped_column(Numeric(14, 4), nullable=True)
    source_batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.import_batches.id"), nullable=False
    )
    natural_key: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    # Связи
    warehouse: Mapped["Warehouse"] = relationship("Warehouse", back_populates="movement_facts")
    chamber: Mapped["Chamber"] = relationship("Chamber", back_populates="movement_facts")
    pallet_location: Mapped["PalletLocation | None"] = relationship(
        "PalletLocation", back_populates="movement_facts"
    )
    sku: Mapped["SKU | None"] = relationship("SKU", back_populates="movement_facts")
    source_batch: Mapped["ImportBatch"] = relationship(
        "ImportBatch", back_populates="movement_facts", foreign_keys=[source_batch_id]
    )

    def __repr__(self) -> str:
        return f"<MovementFact(dt={self.operation_datetime}, type='{self.operation_type}', nk='{self.natural_key}')>"

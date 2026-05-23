"""
Модель ShipmentFact — факт отгрузки SKU со склада.
"""

import uuid
from datetime import date, datetime
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
    from app.models.sku import SKU
    from app.models.import_batch import ImportBatch


class ShipmentFact(Base):
    """Факт отгрузки SKU."""

    __tablename__ = "shipment_facts"
    __table_args__ = (
        UniqueConstraint("natural_key", name="uq_shipment_facts_natural_key"),
        CheckConstraint("shipped_qty >= 0", name="ch_shipment_facts_qty"),
        Index("ix_shipment_facts_date_sku", "shipment_date", "sku_id"),
        Index("ix_shipment_facts_warehouse_date", "warehouse_id", "shipment_date"),
        Index("ix_shipment_facts_batch", "source_batch_id"),
        {"schema": "wms"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    shipment_date: Mapped[date] = mapped_column(nullable=False)
    warehouse_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.warehouses.id"), nullable=False
    )
    sku_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.skus.id"), nullable=False
    )
    shipped_qty: Mapped[float] = mapped_column(Numeric(14, 4), nullable=False)
    shipped_volume: Mapped[float | None] = mapped_column(Numeric(14, 4), nullable=True)
    document_number: Mapped[str | None] = mapped_column(String(200), nullable=True)
    source_batch_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.import_batches.id"), nullable=False
    )
    natural_key: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    # Связи
    warehouse: Mapped["Warehouse"] = relationship("Warehouse", back_populates="shipment_facts")
    sku: Mapped["SKU"] = relationship("SKU", back_populates="shipment_facts")
    source_batch: Mapped["ImportBatch"] = relationship(
        "ImportBatch", back_populates="shipment_facts", foreign_keys=[source_batch_id]
    )

    def __repr__(self) -> str:
        return f"<ShipmentFact(date={self.shipment_date}, nk='{self.natural_key}')>"

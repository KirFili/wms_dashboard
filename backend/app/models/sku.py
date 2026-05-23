"""
Модель SKU — номенклатурная позиция (Stock Keeping Unit).
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Numeric,
    String,
    CheckConstraint,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SKU(Base):
    """Номенклатурная позиция."""

    __tablename__ = "skus"
    __table_args__ = (
        UniqueConstraint("sku_code", name="uq_skus_sku_code"),
        CheckConstraint("sku_code <> ''", name="ch_skus_sku_code"),
        CheckConstraint(
            "pallet_coeff IS NULL OR pallet_coeff > 0", name="ch_skus_pallet_coeff"
        ),
        Index("ix_skus_sku_code", "sku_code", unique=True),
        {"schema": "wms"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    sku_code: Mapped[str] = mapped_column(String(100), nullable=False)
    sku_name: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="pcs")
    pallet_coeff: Mapped[float | None] = mapped_column(Numeric(12, 4), nullable=True)
    volume: Mapped[float | None] = mapped_column(Numeric(12, 4), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    # Связи
    stock_snapshots = relationship("StockSnapshot", back_populates="sku", lazy="raise")
    shipment_facts = relationship("ShipmentFact", back_populates="sku", lazy="raise")
    movement_facts = relationship("MovementFact", back_populates="sku", lazy="raise")

    def __repr__(self) -> str:
        return f"<SKU(id={self.id}, sku_code='{self.sku_code}', name='{self.sku_name}')>"

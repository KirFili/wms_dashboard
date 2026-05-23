"""
Модель Chamber — камера хранения внутри склада.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    CheckConstraint,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.warehouse import Warehouse
    from app.models.pallet_location import PalletLocation


class Chamber(Base):
    """Камера хранения."""

    __tablename__ = "chambers"
    __table_args__ = (
        UniqueConstraint("warehouse_id", "code", name="uq_chambers_warehouse_code"),
        CheckConstraint("code <> ''", name="ch_chambers_code"),
        CheckConstraint("capacity_pallets >= 0", name="ch_chambers_capacity"),
        Index("ix_chambers_warehouse_code", "warehouse_id", "code"),
        {"schema": "wms"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    warehouse_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wms.warehouses.id"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    chamber_type: Mapped[str] = mapped_column(String(50), nullable=False, default="standard")
    capacity_pallets: Mapped[int] = mapped_column(Integer, nullable=False)
    zone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    temperature_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    # Связи
    warehouse: Mapped["Warehouse"] = relationship("Warehouse", back_populates="chambers")
    pallet_locations: Mapped[list["PalletLocation"]] = relationship(
        "PalletLocation", back_populates="chamber", lazy="raise"
    )
    stock_snapshots = relationship("StockSnapshot", back_populates="chamber", lazy="raise")
    movement_facts = relationship("MovementFact", back_populates="chamber", lazy="raise")

    def __repr__(self) -> str:
        return f"<Chamber(id={self.id}, code='{self.code}', name='{self.name}')>"

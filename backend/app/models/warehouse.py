"""
Модель Warehouse — склад / логическая площадка хранения.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Warehouse(Base):
    """Склад."""

    __tablename__ = "warehouses"
    __table_args__ = (
        UniqueConstraint("code", name="uq_warehouses_code"),
        CheckConstraint("code <> ''", name="ch_warehouses_code"),
        {"schema": "wms"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=None,
    )
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=datetime.utcnow
    )

    # Связи
    chambers = relationship("Chamber", back_populates="warehouse", lazy="raise")
    stock_snapshots = relationship("StockSnapshot", back_populates="warehouse", lazy="raise")
    shipment_facts = relationship("ShipmentFact", back_populates="warehouse", lazy="raise")
    movement_facts = relationship("MovementFact", back_populates="warehouse", lazy="raise")

    def __repr__(self) -> str:
        return f"<Warehouse(id={self.id}, code='{self.code}', name='{self.name}')>"

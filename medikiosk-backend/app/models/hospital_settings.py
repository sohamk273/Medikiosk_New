"""HospitalSettings model for clinic configuration."""
from datetime import datetime
from sqlalchemy import String, Boolean, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class HospitalSettings(Base):
    """Hospital configuration and operational flags."""
    __tablename__ = "hospital_settings"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    hospital_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="MediKiosk District Hospital",
    )
    opd_start_time: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="09:00",
    )
    opd_end_time: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        default="17:00",
    )
    kiosk_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    ayush_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<HospitalSettings id={self.id} hospital='{self.hospital_name}' kiosk={self.kiosk_enabled} ayush={self.ayush_enabled}>"

"""Patient model for the Authoritative Patient Master Index."""
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Integer, Text, DateTime, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Patient(Base):
    """Authoritative Patient Master record."""
    __tablename__ = "patients"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    patient_uhid: Mapped[str] = mapped_column(
        String(30),
        unique=True,
        nullable=False,
        index=True,
    )
    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    age: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )
    gender: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )
    address: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    city: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    state: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )
    pincode: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships with selectin loading for async support
    identities: Mapped[List["PatientIdentity"]] = relationship(
        "PatientIdentity",
        back_populates="patient",
        lazy="selectin",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    encounters: Mapped[List["Encounter"]] = relationship(
        "Encounter",
        back_populates="patient",
        lazy="selectin",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    consent_records: Mapped[List["ConsentRecord"]] = relationship(
        "ConsentRecord",
        back_populates="patient",
        lazy="selectin",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Patient id={self.id} uhid='{self.patient_uhid}' name='{self.full_name}'>"

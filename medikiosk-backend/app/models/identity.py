"""Patient identity model allowing multiple identity mechanisms."""
import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, UniqueConstraint, Enum, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class IdentityType(str, enum.Enum):
    """Supported identity mechanisms."""
    ABHA = "ABHA"
    MOBILE = "MOBILE"


class PatientIdentity(Base):
    """External identity link (ABHA, Mobile) to a master patient record."""
    __tablename__ = "patient_identities"
    __table_args__ = (
        UniqueConstraint("identity_type", "identity_value", name="uq_patient_identity_type_val"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    identity_type: Mapped[IdentityType] = mapped_column(
        Enum(IdentityType, name="identity_type_enum", native_enum=False),
        nullable=False,
        index=True,
    )
    identity_value: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
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

    # Relationships
    patient: Mapped["Patient"] = relationship(
        "Patient",
        back_populates="identities",
    )

    def __repr__(self) -> str:
        return f"<PatientIdentity id={self.id} type={self.identity_type} val='{self.identity_value}' verified={self.is_verified}>"

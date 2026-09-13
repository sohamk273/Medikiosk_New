"""User model for doctor and staff authentication and authorization."""
import enum
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Enum, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserRole(str, enum.Enum):
    """User operational roles in MediKiosk."""
    DOCTOR = "DOCTOR"
    AYUSH_DOCTOR = "AYUSH_DOCTOR"
    HOSPITAL_ADMIN = "HOSPITAL_ADMIN"
    KIOSK_OPERATOR = "KIOSK_OPERATOR"


class User(Base):
    """User account model for doctors and clinic staff."""
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    display_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role_enum", native_enum=False),
        nullable=False,
        default=UserRole.DOCTOR,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
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

    def __repr__(self) -> str:
        return f"<User id={self.id} username='{self.username}' role={self.role}>"

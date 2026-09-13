"""Common Pydantic models and response wrappers."""
from datetime import datetime
from typing import Generic, TypeVar, Optional, Any
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standardized API envelope."""
    success: bool = True
    message: Optional[str] = None
    data: Optional[T] = None
    timestamp: datetime = datetime.utcnow()

    model_config = ConfigDict(from_attributes=True)


class ErrorResponse(BaseModel):
    """Standardized error envelope."""
    success: bool = False
    error: str
    detail: Optional[Any] = None
    timestamp: datetime = datetime.utcnow()

"""Health and readiness check schemas."""
from typing import Dict, Any, Optional
from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Liveness check response."""
    status: str
    app: str
    version: str
    environment: str


class ComponentStatus(BaseModel):
    """Component readiness status."""
    status: str  # "healthy" | "unhealthy" | "disabled"
    latency_ms: Optional[float] = None
    details: Optional[Dict[str, Any]] = None


class ReadinessResponse(BaseModel):
    """Readiness check response inspecting core infrastructure."""
    status: str  # "ready" | "not_ready"
    components: Dict[str, ComponentStatus]

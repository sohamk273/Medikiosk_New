"""SQLAlchemy declarative models registry."""
from app.models.user import User, UserRole
from app.models.patient import Patient
from app.models.identity import PatientIdentity, IdentityType
from app.models.encounter import Encounter, EncounterStatus, EncounterPriority
from app.models.queue import QueueEntry, QueueStatus
from app.models.consent import ConsentRecord
from app.models.hospital_settings import HospitalSettings

__all__ = [
    "User",
    "UserRole",
    "Patient",
    "PatientIdentity",
    "IdentityType",
    "Encounter",
    "EncounterStatus",
    "EncounterPriority",
    "QueueEntry",
    "QueueStatus",
    "ConsentRecord",
    "HospitalSettings",
]

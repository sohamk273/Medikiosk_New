"""Abstract base classes and data transfer objects for OCR providers."""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class OCRPageResult:
    """Represents OCR extracted raw text for an individual document page."""
    page_number: int
    text: str
    confidence: Optional[float] = None


@dataclass
class OCROutput:
    """Complete document OCR result preserving page boundaries and raw text."""
    raw_text: str
    page_count: int
    engine: str
    pages: List[OCRPageResult] = field(default_factory=list)


class OCRProvider(ABC):
    """Abstract interface for document OCR processing engines."""

    @property
    @abstractmethod
    def engine_name(self) -> str:
        """Returns the canonical name of the OCR engine."""
        pass

    @abstractmethod
    def extract_text(self, file_bytes: bytes, content_type: str) -> OCROutput:
        """Extracts text from document binary bytes (PDF, PNG, JPG/JPEG).
        
        Must preserve page order and page structure.
        Does NOT perform clinical interpretation or summarization.
        """
        pass

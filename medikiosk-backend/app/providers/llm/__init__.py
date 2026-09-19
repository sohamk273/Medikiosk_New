"""Large Language Model (LLM) clinical provider factory and registry (Stage 1 & Stage 7)."""
from typing import Optional
from app.core.config import settings
from app.core.logging import logger
from app.providers.llm.base import (
    LLMProvider,
    MockLLMProvider,
    ClinicalSymptomEntity,
    ClinicalEntityExtractionResult,
    CaseTakingTurnResult,
    DoctorCaseSummaryResult,
)
from app.providers.llm.gemini import (
    GeminiClinicalProvider,
    GeminiProviderError,
)

_mock_llm_provider = MockLLMProvider()
_custom_llm_provider: Optional[LLMProvider] = None


def register_llm_provider(provider: LLMProvider) -> None:
    """Registers a live or custom LLM provider."""
    global _custom_llm_provider
    _custom_llm_provider = provider


def get_llm_provider() -> LLMProvider:
    """Returns the configured LLMProvider.
    
    If AI_PROVIDER == 'gemini' or ENABLE_LIVE_LLM is True, and valid API key is present,
    returns GeminiClinicalProvider.
    Otherwise, returns MockLLMProvider for deterministic offline execution.
    """
    if _custom_llm_provider is not None:
        return _custom_llm_provider

    if settings.is_gemini_enabled:
        if settings.effective_gemini_key:
            logger.info("Using live Gemini Clinical LLM provider (%s).", settings.GEMINI_MODEL)
            return GeminiClinicalProvider(
                api_key=settings.effective_gemini_key,
                model_name=settings.GEMINI_MODEL,
                timeout_seconds=settings.GEMINI_TIMEOUT_SECONDS,
            )
        else:
            logger.warning(
                "Gemini AI provider is enabled (%s), but GEMINI_API_KEY is missing. "
                "Falling back to MockLLMProvider for offline execution.",
                settings.AI_PROVIDER,
            )

    return _mock_llm_provider


__all__ = [
    "LLMProvider",
    "MockLLMProvider",
    "GeminiClinicalProvider",
    "GeminiProviderError",
    "ClinicalSymptomEntity",
    "ClinicalEntityExtractionResult",
    "CaseTakingTurnResult",
    "DoctorCaseSummaryResult",
    "register_llm_provider",
    "get_llm_provider",
]

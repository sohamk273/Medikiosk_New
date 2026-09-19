"""API Router for Clinical Case-Taking Intelligence, Turns, and Persistence (Stage 4, 5, 6)."""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.clinical import (
    ClinicalTurnRequest,
    ClinicalTurnResponse,
    ClinicalFinalizeRequest,
    ClinicalEncounterRead,
    ClinicalSummaryResponse,
    ClinicalConversationResponse,
    ClinicalTurnRecordRead,
    StructuredClinicalSummary,
    StructuredSummaryResponse,
)
from app.services.clinical.clinical_engine import default_clinical_engine
from app.services.clinical.clinical_service import (
    finalize_clinical_case,
    get_clinical_case_by_identifier,
)

logger = logging.getLogger("clinical_api")

router = APIRouter(prefix="/clinical", tags=["clinical"])


async def _handle_clinical_turn(request: ClinicalTurnRequest) -> ClinicalTurnResponse:
    """Core handler for clinical case turn processing."""
    transcript = request.transcript.strip() if request.transcript else ""
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Transcript cannot be empty.",
        )

    lang = request.language.strip().lower() if request.language else "en"
    if lang not in ("en", "hi", "mr"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported language code '{lang}'. Must be one of ['en', 'hi', 'mr'].",
        )

    try:
        response = await default_clinical_engine.process_turn(
            transcript=transcript,
            language=lang,
            current_case_state=request.case_state,
        )
        return response
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(val_err),
        )
    except Exception as err:
        logger.exception("Clinical turn processing failure: %s", err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clinical intelligence processing failed: {str(err)}",
        )


@router.post(
    "/next-turn",
    response_model=ClinicalTurnResponse,
    status_code=status.HTTP_200_OK,
    summary="Process conversational patient turn and generate next clinical inquiry (Stage 5)",
)
async def process_next_turn(request: ClinicalTurnRequest) -> ClinicalTurnResponse:
    """Process a patient intake transcript turn and return next question (Stage 5)."""
    return await _handle_clinical_turn(request)


@router.post(
    "/process-turn",
    response_model=ClinicalTurnResponse,
    status_code=status.HTTP_200_OK,
    summary="Process patient transcript and update structured clinical state (Stage 4)",
)
async def process_clinical_turn(request: ClinicalTurnRequest) -> ClinicalTurnResponse:
    """Process a patient intake transcript turn with the clinical intelligence engine (Stage 4)."""
    return await _handle_clinical_turn(request)


# ==========================================
# STAGE 6 FINALIZATION & HANDOFF ENDPOINTS
# ==========================================

@router.post(
    "/finalize",
    response_model=ClinicalEncounterRead,
    status_code=status.HTTP_200_OK,
    summary="Finalize and persist structured clinical case intake and turns (Stage 6)",
)
async def finalize_encounter(
    request: ClinicalFinalizeRequest,
    db: AsyncSession = Depends(get_db),
) -> ClinicalEncounterRead:
    """Persist structured clinical state, all conversation turns, and generate doctor summary."""
    try:
        case_record = await finalize_clinical_case(db=db, request=request)
        return ClinicalEncounterRead.model_validate(case_record)
    except Exception as err:
        logger.exception("Failed to finalize clinical case: %s", err)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to finalize clinical case: {str(err)}",
        )


@router.get(
    "/encounters/{encounter_id}",
    response_model=ClinicalEncounterRead,
    status_code=status.HTTP_200_OK,
    summary="Retrieve complete persistent clinical case record (Stage 6)",
)
async def get_clinical_encounter(
    encounter_id: str,
    db: AsyncSession = Depends(get_db),
) -> ClinicalEncounterRead:
    """Get full clinical encounter by encounter_id or clinical_case_id."""
    case_record = await get_clinical_case_by_identifier(db=db, identifier=encounter_id)
    if not case_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical case not found for identifier '{encounter_id}'.",
        )
    return ClinicalEncounterRead.model_validate(case_record)


@router.get(
    "/encounters/{encounter_id}/summary",
    response_model=ClinicalSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve doctor-facing clinical summary (Stage 6)",
)
async def get_clinical_summary(
    encounter_id: str,
    db: AsyncSession = Depends(get_db),
) -> ClinicalSummaryResponse:
    """Get doctor-facing handoff summary for an encounter."""
    case_record = await get_clinical_case_by_identifier(db=db, identifier=encounter_id)
    if not case_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical case not found for identifier '{encounter_id}'.",
        )
    return ClinicalSummaryResponse.model_validate(case_record)


@router.get(
    "/encounters/{encounter_id}/conversation",
    response_model=ClinicalConversationResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve complete conversation turn timeline (Stage 6)",
)
async def get_clinical_conversation(
    encounter_id: str,
    db: AsyncSession = Depends(get_db),
) -> ClinicalConversationResponse:
    """Get full chronological conversation turns for an encounter."""
    case_record = await get_clinical_case_by_identifier(db=db, identifier=encounter_id)
    if not case_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical case not found for identifier '{encounter_id}'.",
        )
    turns_read = [ClinicalTurnRecordRead.model_validate(t) for t in (case_record.turns or [])]
    return ClinicalConversationResponse(
        id=case_record.id,
        encounter_id=case_record.encounter_id,
        total_turns=len(turns_read),
        turns=turns_read,
    )


# ==========================================
# STAGE 9 STRUCTURED CLINICAL SUMMARY
# ==========================================

@router.get(
    "/encounters/{encounter_id}/structured-summary",
    response_model=StructuredSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve structured clinical summary with provenance tags (Stage 9)",
)
async def get_structured_summary(
    encounter_id: str,
    db: AsyncSession = Depends(get_db),
) -> StructuredSummaryResponse:
    """Get structured, provenance-tagged clinical summary for the doctor EMR."""
    case_record = await get_clinical_case_by_identifier(db=db, identifier=encounter_id)
    if not case_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Clinical case not found for identifier '{encounter_id}'.",
        )
    if not case_record.structured_summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Structured summary not yet generated for identifier '{encounter_id}'.",
        )
    structured = StructuredClinicalSummary.model_validate(case_record.structured_summary)
    return StructuredSummaryResponse(
        id=case_record.id,
        encounter_id=case_record.encounter_id,
        structured_summary=structured,
    )

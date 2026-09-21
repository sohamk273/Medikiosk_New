/**
 * Clinical LLM Case-Taking, Turn Orchestration, and Persistence Service (Stage 4, 5, 6).
 */

export interface ClinicalSymptom {
  name: string;
  location?: string | null;
  onset?: string | null;
  duration?: string | null;
  severity?: string | null;
  character?: string | null;
  aggravating_factors?: string[];
  relieving_factors?: string[];
}

export interface RedFlagEntity {
  type: string;
  severity: string;
  source_text: string;
  clinical_note?: string | null;
  detected_at?: string;
}

export interface ExtractedClinicalEntities {
  symptoms: string[];
  body_locations: string[];
  duration: string[];
  severity: string[];
  associated_symptoms: string[];
  medications: string[];
  allergies: string[];
  medical_history: string[];
  red_flags: RedFlagEntity[];
}

export interface ClinicalCaseState {
  chief_complaint?: string | null;
  symptoms: ClinicalSymptom[];
  associated_symptoms: string[];
  fever?: boolean | null;
  medications: string[];
  allergies: string[];
  medical_history: string[];
  surgical_history: string[];
  family_history: string[];
  lifestyle_information: string[];
  red_flags: RedFlagEntity[];
  patient_language: string;
  completed_sections: string[];
  missing_information: string[];
}

export interface ConversationTurnRecord {
  turn: number;
  question: string;
  question_type: string;
  patient_transcript: string;
  language: string;
  timestamp: string;
}

export interface ClinicalTurnRequest {
  transcript: string;
  language?: string;
  case_state?: ClinicalCaseState | null;
}

export interface ClinicalTurnResponse {
  success: boolean;
  transcript: string;
  language: string;
  extracted_entities: ExtractedClinicalEntities;
  case_state: ClinicalCaseState;
  next_question: string;
  next_question_regional?: string;
  next_question_type: string;
  suggested_options?: string[];
  missing_information: string[];
  red_flags: RedFlagEntity[];
  requires_emergency_attention: boolean;
  is_case_complete: boolean;
  provider: string;
}

// Stage 6 Types
export interface ClinicalTurnRecordRead {
  id: string;
  turn_number: number;
  question: string;
  question_type: string;
  patient_transcript: string;
  language: string;
  extracted_entities: Record<string, any>;
  created_at: string;
}

export interface ClinicalFinalizeRequest {
  encounter_id?: string;
  patient_id?: string;
  case_state?: ClinicalCaseState;
  conversation_history?: Array<{
    turn_number: number;
    question: string;
    question_type: string;
    patient_transcript: string;
    language: string;
    extracted_entities?: Record<string, any>;
  }>;
  language?: string;
  is_emergency?: boolean;
}

export interface ClinicalEncounterRead {
  id: string;
  encounter_id?: string | null;
  patient_id?: string | null;
  status: string;
  patient_language: string;
  chief_complaint?: string | null;
  case_state: ClinicalCaseState;
  final_summary: string;
  red_flags: RedFlagEntity[];
  is_emergency: boolean;
  completion_status: string;
  intake_started_at: string;
  finalized_at?: string | null;
  created_at: string;
  updated_at: string;
  turns: ClinicalTurnRecordRead[];
}

export interface ClinicalSummaryResponse {
  id: string;
  encounter_id?: string | null;
  patient_id?: string | null;
  chief_complaint?: string | null;
  final_summary: string;
  is_emergency: boolean;
  red_flags: RedFlagEntity[];
  completion_status: string;
  patient_language: string;
  created_at: string;
  finalized_at?: string | null;
}

export interface ClinicalConversationResponse {
  id: string;
  encounter_id?: string | null;
  total_turns: number;
  turns: ClinicalTurnRecordRead[];
}

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '') : 'http://localhost:8000';

/**
 * Sends a patient transcript along with current cumulative case state to the clinical engine.
 */
export async function processClinicalTurn(
  transcript: string,
  language: string = 'en',
  caseState: ClinicalCaseState | null = null,
  turnNumber: number = 1
): Promise<ClinicalTurnResponse> {
  const response = await fetch(`${API_BASE}/api/v1/clinical/next-turn`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transcript,
      language,
      case_state: caseState,
      turn_number: turnNumber,
    }),
  });

  if (!response.ok) {
    let errorDetail = `Clinical turn failed with status ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.detail) {
        errorDetail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // Ignore JSON parse errors on non-200
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const processClinicalNextTurn = processClinicalTurn;

/**
 * Finalizes and persists the clinical case, conversation turns, and produces the doctor summary.
 */
export async function finalizeClinicalEncounter(
  payload: ClinicalFinalizeRequest
): Promise<ClinicalEncounterRead> {
  const response = await fetch(`${API_BASE}/api/v1/clinical/finalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = `Clinical finalize failed with status ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.detail) {
        errorDetail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch {
      // Ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Retrieves the complete persisted clinical encounter by identifier.
 */
export async function getClinicalEncounter(
  encounterId: string
): Promise<ClinicalEncounterRead> {
  const response = await fetch(`${API_BASE}/api/v1/clinical/encounters/${encounterId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch clinical encounter: ${response.status}`);
  }
  return response.json();
}

/**
 * Retrieves the doctor-facing summary for an encounter.
 */
export async function getClinicalSummary(
  encounterId: string
): Promise<ClinicalSummaryResponse> {
  const response = await fetch(`${API_BASE}/api/v1/clinical/encounters/${encounterId}/summary`);
  if (!response.ok) {
    throw new Error(`Failed to fetch clinical summary: ${response.status}`);
  }
  return response.json();
}

/**
 * Retrieves the complete chronological conversation turn history.
 */
export async function getClinicalConversation(
  encounterId: string
): Promise<ClinicalConversationResponse> {
  const response = await fetch(`${API_BASE}/api/v1/clinical/encounters/${encounterId}/conversation`);
  if (!response.ok) {
    throw new Error(`Failed to fetch clinical conversation: ${response.status}`);
  }
  return response.json();
}

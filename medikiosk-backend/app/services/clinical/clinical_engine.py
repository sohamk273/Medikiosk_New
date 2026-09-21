"""Clinical Case-Taking Intelligence and Orchestration Engine (Stage 4, 5, 7).

Integrates:
1. Provider-agnostic LLM extraction & turn orchestration (MockLLMProvider or GeminiClinicalProvider).
2. Authoritative deterministic safety & red-flag detection.
3. Multi-turn cumulative clinical case state management.
4. Intelligent entity skipping & trilingual next-question generation (EN, HI, MR).
"""
import logging
import re
from typing import Dict, Any, List, Optional, Tuple

from app.schemas.clinical import (
    ClinicalCaseState,
    ClinicalSymptom,
    ClinicalTurnResponse,
    ExtractedClinicalEntities,
    RedFlagEntity,
)
from app.providers.llm import get_llm_provider, LLMProvider, GeminiClinicalProvider

logger = logging.getLogger("clinical_engine")


RED_FLAG_PATTERNS = [
    (r"chest pain|crushing chest pain|pressure in chest|छाती में दर्द|छातीत दुखणे", "CHEST_PAIN", "CRITICAL", "High clinical priority - evaluate for ACS/cardiac etiology"),
    (r"difficulty breathing|shortness of breath|breathless|सांस लेने में तकलीफ|श्वास घेण्यास त्रास", "BREATHING_DIFFICULTY", "HIGH", "Respiratory distress protocol"),
    (r"fainted|unconscious|blackout|syncope|बेहोश|चक्कर खाऊन पडलो", "SYNCOPE", "HIGH", "Loss of consciousness evaluation"),
    (r"coughing blood|blood in vomit|hemoptysis|खून की उल्टी|रक्ताची उलटी", "HEMORRHAGE", "CRITICAL", "Active GI/Pulmonary bleed alert"),
    (r"severe head injury|trauma|दुर्घटना|डोक्याला मार", "HEAD_TRAUMA", "HIGH", "Trauma triage assessment"),
]

BODY_LOCATIONS_MAP = {
    "abdomen": ["stomach", "abdomen", "abdominal", "belly", "lower abdomen", "right side", "right-sided", "left side", "left-sided", "पेट", "पोट", "पोटात", "उदर"],
    "chest": ["chest", "छाती", "छातीत"],
    "head": ["head", "सिर", "डोके", "डोक्यात"],
    "throat": ["throat", "गला", "घसा", "घशात"],
    "back": ["back", "पीठ", "कंबर"],
    "knee": ["knee", "knees", "घुटने", "गुडघे"],
    "leg": ["leg", "legs", "पैर", "पाय"],
    "shoulder": ["shoulder", "कंधा", "खांदा"],
}

DURATION_REGEXES = [
    (r"(\d+)\s*(?:days?|दिनों?|दिन|दिवस)", lambda m: f"{m.group(1)} days"),
    (r"(?:for\s+)?three\s+days", lambda m: "three days"),
    (r"(?:for\s+)?two\s+days|दोन\s+दिवस", lambda m: "two days"),
    (r"(?:for\s+)?one\s+week|एक\s+हफ्ता", lambda m: "one week"),
    (r"(\d+)\s*(?:weeks?|सप्ताह|हफ्ते|आठवडे)", lambda m: f"{m.group(1)} weeks"),
    (r"(\d+)\s*(?:months?|महीने|महिने)", lambda m: f"{m.group(1)} months"),
    (r"(\d+)\s*(?:hours?|घंटे|तास)", lambda m: f"{m.group(1)} hours"),
    (r"(since yesterday|yesterday|कल से|कालपासून)", lambda m: "since yesterday"),
    (r"(since morning|आज सुबह से|आज सकाळपासून)", lambda m: "since morning"),
    (r"(today|आज)", lambda m: "today"),
]

SEVERITY_REGEXES = [
    (r"(\d+)\s*(?:out of|\/)\s*10", lambda m: f"{m.group(1)}/10"),
    (r"(\d+)\s*(?:on\s+a\s+scale\s+of\s+10|पैमाने पर|प्रमाणात)", lambda m: f"{m.group(1)}/10"),
    (r"severe|extreme|unbearable|बहुत तेज|असहनीय|खूप जास्त|तीव्र|तेज", lambda m: "severe"),
    (r"moderate|medium|मध्यम", lambda m: "moderate"),
    (r"mild|slight|हल्का|थोडा", lambda m: "mild"),
]

ASSOCIATED_SYMPTOMS_MAP = {
    "fever": ["fever", "temperature", "बुखार", "ताप"],
    "vomiting": ["vomiting", "vomit", "उल्टी", "उलटी"],
    "nausea": ["nausea", "मळमळ"],
    "difficulty breathing": ["shortness of breath", "difficulty breathing", "breathlessness", "सांस फूलना", "दम लागणे"],
    "headache": ["headache", "सिरदर्द", "डोकेदुखी"],
    "dizziness": ["dizziness", "giddiness", "चक्कर", "भोवळ"],
    "cough": ["cough", "खांसी", "खोकला"],
    "diarrhea": ["diarrhea", "loose motion", "दस्त", "जुलाब"],
    "chills": ["chills", "shivering", "ठंड लगना", "थंडी वाजणे"],
    "weakness": ["weakness", "tired", "कमजोरी", "थकवा"],
}

NEXT_QUESTION_MAP = {
    "CHIEF_COMPLAINT": {
        "en": "What is the primary medical problem or symptom you are experiencing today?",
        "hi": "आज आपको मुख्य रूप से क्या समस्या या परेशानी हो रही है?",
        "mr": "आज तुम्हाला मुख्यत्वे काय त्रास किंवा समस्या होत आहे?",
    },
    "LOCATION": {
        "en": "Where exactly is your discomfort or pain located?",
        "hi": "यह दर्द या परेशानी शरीर के किस हिस्से में हो रही है?",
        "mr": "हा त्रास किंवा वेदना शरीराच्या कोणत्या भागात होत आहे?",
    },
    "DURATION": {
        "en": "How long have you been experiencing this condition?",
        "hi": "आपको यह परेशानी कितने समय (दिनों/घंटों) से है?",
        "mr": "तुम्हाला हा त्रास किती दिवसांपासून किंवा वेळेपासून होत आहे?",
    },
    "SEVERITY": {
        "en": "On a scale of 1 to 10, how severe is your pain or discomfort?",
        "hi": "1 से 10 के पैमाने पर, आपकी परेशानी कितनी तेज या गंभीर है?",
        "mr": "1 ते 10 च्या प्रमाणात, तुमचा त्रास किती तीव्र आहे?",
    },
    "CHARACTER": {
        "en": "How would you describe the feeling (e.g. sharp, burning, dull ache, or throbbing)?",
        "hi": "दर्द किस प्रकार का है (जैसे तेज चुभन, जलन, भारीपन या हल्का दर्द)?",
        "mr": "वेदना कशा प्रकारच्या आहेत (उदा. ठसठसणे, जळजळ, तीव्र टोचणे किंवा मंद वेदना)?",
    },
    "ASSOCIATED_SYMPTOMS": {
        "en": "Are you experiencing any other symptoms, such as fever, nausea, vomiting, or weakness?",
        "hi": "क्या आपको इसके साथ बुखार, उल्टी, चक्कर या कमजोरी जैसी कोई अन्य परेशानी भी है?",
        "mr": "यासोबत ताप, मळमळ, उलट्या किंवा अशक्तपणा यासारखा इतर काही त्रास होत आहे का?",
    },
    "AGGRAVATING_FACTORS": {
        "en": "Does anything make your symptoms worse or bring relief, such as eating, walking, or resting?",
        "hi": "क्या किसी खास गतिविधि (जैसे चलने, खाने या आराम करने) से यह बढ़ता या घटता है?",
        "mr": "विशिष्ट गोष्टींनी (उदा. चालणे, खाणे किंवा विश्रांती) हा त्रास वाढतो किंवा कमी होतो का?",
    },
    "MEDICATIONS": {
        "en": "Are you currently taking any regular medicines or tablets?",
        "hi": "क्या आप वर्तमान में कोई नियमित दवाइयां या गोलियां ले रहे हैं?",
        "mr": "तुम्ही सध्या काही नियमित औषधे किंवा गोळ्या घेत आहात का?",
    },
    "ALLERGIES": {
        "en": "Do you have any known allergies to medicines, foods, or dust?",
        "hi": "क्या आपको किसी दवा, भोजन या धूल से कोई एलर्जी है?",
        "mr": "तुम्हाला कोणत्याही औषधांची, अन्नाची किंवा धुळीची ऍलर्जी आहे का?",
    },
    "MEDICAL_HISTORY": {
        "en": "Do you have any past medical history, such as diabetes, high blood pressure, or asthma?",
        "hi": "क्या आपको पहले से मधुमेह (शुगर), बीपी या दमा जैसी कोई बीमारी है?",
        "mr": "तुम्हाला आधीपासून मधुमेह (डायबिटीज), रक्तदाब (बीपी) किंवा दमा असा काही आजार आहे का?",
    },
    "EMERGENCY": {
        "en": "Immediate clinical attention is advised. A priority alert has been forwarded to hospital staff.",
        "hi": "चेतावनी: आपके बताए लक्षण के लिए तत्काल चिकित्सकीय देखभाल आवश्यक है। अस्पताल सहायक को सूचित कर दिया गया है।",
        "mr": "सूचना: आपल्या लक्षणांसाठी तातडीने वैद्यकीय तपासणीची आवश्यकता आहे. रुग्णालयातील सहाय्यकाला कळवले आहे.",
    },
    "COMPLETED": {
        "en": "Thank you. Your clinical intake details have been recorded and saved for the doctor.",
        "hi": "धन्यवाद। आपकी स्वास्थ्य जानकारी दर्ज कर ली गई है और डॉक्टर के पास सुरक्षित भेज दी गई है।",
        "mr": "धन्यवाद. आपली सर्व माहिती नोंदवून डॉक्टरांच्या सल्ल्यासाठी सुरक्षितपणे जतन करण्यात आली आहे.",
    },
}


class ClinicalCaseTakingEngine:
    """Clinical intelligence engine for conversational case intake and entity extraction."""

    def __init__(self, llm_provider: Optional[LLMProvider] = None):
        self._llm_provider = llm_provider

    @property
    def llm_provider(self) -> LLMProvider:
        return self._llm_provider or get_llm_provider()

    def check_red_flags(self, text: str) -> List[RedFlagEntity]:
        """Deterministic safety check against critical red-flag symptoms."""
        flags: List[RedFlagEntity] = []
        for pattern, flag_type, severity, note in RED_FLAG_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                flags.append(
                    RedFlagEntity(
                        type=flag_type,
                        severity=severity,
                        source_text=match.group(0),
                        clinical_note=note,
                    )
                )
        return flags

    def extract_entities(self, transcript: str, language: str = "en") -> ExtractedClinicalEntities:
        """Deterministic rule-based clinical entity extraction."""
        t_lower = transcript.lower()

        # 1. Red flags
        red_flags = self.check_red_flags(transcript)

        # 2. Body locations
        locations: List[str] = []
        for loc_name, keywords in BODY_LOCATIONS_MAP.items():
            for kw in keywords:
                # Use regex word boundaries or unicode boundary check
                pattern = r"(?:\b|(?<=[\s,.-]))" + re.escape(kw) + r"(?:\b|(?=[\s,.-]))"
                if re.search(pattern, t_lower):
                    locations.append(loc_name)
                    break

        # 3. Durations
        durations: List[str] = []
        for reg, formatter in DURATION_REGEXES:
            match = re.search(reg, t_lower)
            if match:
                durations.append(formatter(match))
                break

        # 4. Severity
        severities: List[str] = []
        for reg, formatter in SEVERITY_REGEXES:
            match = re.search(reg, t_lower)
            if match:
                severities.append(formatter(match))
                break

        # 5. Associated Symptoms
        associated: List[str] = []
        for sym_name, keywords in ASSOCIATED_SYMPTOMS_MAP.items():
            for kw in keywords:
                if re.search(r"(?:\b|(?<=[\s,.]))" + re.escape(kw) + r"(?:\b|(?=[\s,.]))", t_lower):
                    associated.append(sym_name)
                    break

        # 6. Primary symptoms
        symptoms: List[str] = []
        if re.search(r"chest pain|छाती में दर्द|छातीत दुख", t_lower):
            symptoms.append("chest pain")
        elif re.search(r"abdominal pain|stomach pain|पेट में दर्द|पोटात.*वेदना|पोटात.*दुख", t_lower):
            symptoms.append("abdominal pain")
        elif re.search(r"headache|सिर में दर्द|डोकेदुखी", t_lower):
            symptoms.append("headache")
        elif re.search(r"pain|दर्द|दुख|वेदना", t_lower):
            if "abdomen" in locations:
                symptoms.append("abdominal pain")
            elif "chest" in locations:
                symptoms.append("chest pain")
            elif "head" in locations:
                symptoms.append("headache")
            else:
                symptoms.append("pain")
        elif "fever" in associated:
            symptoms.append("fever")
        elif "headache" in associated:
            symptoms.append("headache")

        for sym in associated:
            if sym not in symptoms:
                symptoms.append(sym)

        # 7. Medications
        medications: List[str] = []
        med_match = re.search(r"(paracetamol|metformin|crocin|aspirin|inhaler|tablets|medicine|दवा|गोळ्या)", t_lower)
        if med_match:
            medications.append(med_match.group(0))

        # 8. Allergies
        allergies: List[str] = []
        alg_match = re.search(r"(dust|penicillin|pollen|peanuts|एलर्जी|ऍलर्जी)", t_lower)
        if alg_match:
            allergies.append(alg_match.group(0))

        # 9. Medical History
        history: List[str] = []
        hist_match = re.search(r"(diabetes|hypertension|bp|asthma|मधुमेह|दमा|रक्तदाब)", t_lower)
        if hist_match:
            history.append(hist_match.group(0))

        return ExtractedClinicalEntities(
            symptoms=symptoms,
            body_locations=locations,
            duration=durations,
            severity=severities,
            associated_symptoms=associated,
            medications=medications,
            allergies=allergies,
            medical_history=history,
            red_flags=red_flags,
        )

    def update_case_state(
        self,
        current_state: Optional[ClinicalCaseState],
        extracted: ExtractedClinicalEntities,
        transcript: str,
        language: str = "en",
    ) -> ClinicalCaseState:
        """Merges new extracted entities into the cumulative ClinicalCaseState."""
        state = current_state.model_copy(deep=True) if current_state else ClinicalCaseState()
        state.patient_language = language

        # 1. Chief Complaint
        if not state.chief_complaint:
            if extracted.symptoms:
                state.chief_complaint = extracted.symptoms[0]
            else:
                state.chief_complaint = transcript.strip()

        # 2. Character / Quality
        char_val: Optional[str] = None
        char_match = re.search(r"(sharp|burning|dull|throbbing|scratchy|stabbing|cramping|जलन|तेज चुभन|ठसठस)", transcript, re.IGNORECASE)
        if char_match:
            char_val = char_match.group(0)

        # 3. Aggravating & Relieving factors
        agg_list: List[str] = []
        rel_list: List[str] = []
        if re.search(r"walking|eating|moving|food|cold", transcript, re.IGNORECASE):
            agg_list.append(re.search(r"walking|eating|moving|food|cold", transcript, re.IGNORECASE).group(0))
        if re.search(r"rest|resting|warm water|lying down|medicine", transcript, re.IGNORECASE):
            rel_list.append(re.search(r"rest|resting|warm water|lying down|medicine", transcript, re.IGNORECASE).group(0))

        # Primary symptom update
        primary_sym: Optional[ClinicalSymptom] = None
        if state.symptoms:
            primary_sym = state.symptoms[0]
        elif extracted.symptoms:
            primary_sym = ClinicalSymptom(name=extracted.symptoms[0])
            state.symptoms.append(primary_sym)
        elif state.chief_complaint:
            primary_sym = ClinicalSymptom(name=state.chief_complaint)
            state.symptoms.append(primary_sym)

        if primary_sym:
            if extracted.body_locations and not primary_sym.location:
                primary_sym.location = extracted.body_locations[0]
            if extracted.duration and not primary_sym.duration:
                primary_sym.duration = extracted.duration[0]
            if extracted.severity and not primary_sym.severity:
                primary_sym.severity = extracted.severity[0]
            if char_val and not primary_sym.character:
                primary_sym.character = char_val
            for agg in agg_list:
                if agg not in primary_sym.aggravating_factors:
                    primary_sym.aggravating_factors.append(agg)
            for rel in rel_list:
                if rel not in primary_sym.relieving_factors:
                    primary_sym.relieving_factors.append(rel)

        # Add other distinct symptoms
        existing_names = {s.name for s in state.symptoms}
        for sym_name in extracted.symptoms:
            if sym_name not in existing_names and sym_name != "pain":
                state.symptoms.append(
                    ClinicalSymptom(
                        name=sym_name,
                        location=extracted.body_locations[0] if extracted.body_locations else None,
                        duration=extracted.duration[0] if extracted.duration else None,
                        severity=extracted.severity[0] if extracted.severity else None,
                        character=char_val,
                    )
                )
                existing_names.add(sym_name)

        # 4. Associated Symptoms
        for sym in extracted.associated_symptoms:
            if sym not in state.associated_symptoms:
                state.associated_symptoms.append(sym)
                if sym == "fever":
                    state.fever = True

        # 5. Medications
        for med in extracted.medications:
            if med not in state.medications:
                state.medications.append(med)

        # 6. Allergies
        for alg in extracted.allergies:
            if alg not in state.allergies:
                state.allergies.append(alg)

        # 7. Medical History
        for hist in extracted.medical_history:
            if hist not in state.medical_history:
                state.medical_history.append(hist)

        # 8. Red Flags
        existing_red_flag_types = {rf.type for rf in state.red_flags}
        for rf in extracted.red_flags:
            if rf.type not in existing_red_flag_types:
                state.red_flags.append(rf)
                existing_red_flag_types.add(rf.type)

        return state

    def identify_missing_dimensions(self, state: ClinicalCaseState) -> List[str]:
        """Identifies which clinical intake dimensions are still missing."""
        missing: List[str] = []
        if not state.chief_complaint:
            missing.append("CHIEF_COMPLAINT")

        primary = state.symptoms[0] if state.symptoms else None
        if not primary or not primary.location:
            missing.append("LOCATION")
        if not primary or not primary.duration:
            missing.append("DURATION")
        if not primary or not primary.severity:
            missing.append("SEVERITY")
        if not primary or not primary.character:
            missing.append("CHARACTER")
        if not state.associated_symptoms:
            missing.append("ASSOCIATED_SYMPTOMS")
        if not primary or (not primary.aggravating_factors and not primary.relieving_factors):
            missing.append("AGGRAVATING_FACTORS")
        if not state.medications:
            missing.append("MEDICATIONS")
        if not state.allergies:
            missing.append("ALLERGIES")
        if not state.medical_history:
            missing.append("MEDICAL_HISTORY")

        return missing

    def determine_next_question(
        self,
        state: ClinicalCaseState,
        turn_number: int = 1,
        language: str = "en",
        max_turns: int = 5,
    ) -> Tuple[str, str, Optional[str], bool]:
        """Determines next English question, question category, regional question, and completion flag."""
        # 1. Authoritative Emergency check
        if state.red_flags:
            en_msg = NEXT_QUESTION_MAP["EMERGENCY"]["en"]
            reg_msg = NEXT_QUESTION_MAP["EMERGENCY"].get(language, en_msg)
            return en_msg, "EMERGENCY", reg_msg, True

        # 2. Check missing dimensions
        missing = self.identify_missing_dimensions(state)

        # 3. Maximum turns or complete
        if turn_number >= max_turns or (not missing and state.chief_complaint):
            en_msg = NEXT_QUESTION_MAP["COMPLETED"]["en"]
            reg_msg = NEXT_QUESTION_MAP["COMPLETED"].get(language, en_msg)
            return en_msg, "COMPLETED", reg_msg, True

        # 4. Next missing dimension
        next_dim = missing[0] if missing else "CHIEF_COMPLAINT"
        q_dict = NEXT_QUESTION_MAP.get(next_dim, NEXT_QUESTION_MAP["CHIEF_COMPLAINT"])
        en_msg = q_dict["en"]
        reg_msg = q_dict.get(language, en_msg)

        return en_msg, next_dim, reg_msg, False

    async def process_turn(
        self,
        transcript: str,
        language: str = "en",
        current_case_state: Optional[ClinicalCaseState] = None,
        turn_number: int = 1,
        max_turns: int = 5,
    ) -> ClinicalTurnResponse:
        """Processes a conversational clinical turn with deterministic red-flag priority."""
        lang_code = language.lower() if language else "en"
        if lang_code not in ("en", "hi", "mr"):
            lang_code = "en"

        # 1. Authoritative Red-Flag safety check
        authoritative_red_flags = self.check_red_flags(transcript)

        extracted: Optional[ExtractedClinicalEntities] = None
        llm_missing: List[str] = []
        llm_question: Optional[str] = None
        llm_question_type: Optional[str] = None

        # 2. Use LLM Provider (MockLLMProvider or GeminiClinicalProvider)
        provider = self.llm_provider
        is_gemini = isinstance(provider, GeminiClinicalProvider)
        provider_name = "GEMINI_CLINICAL" if is_gemini else "MOCK_LLM"

        try:
            if is_gemini:
                # Call Gemini provider for structured extraction and conversational assistance
                gemini_res = await provider.process_clinical_turn(
                    transcript=transcript,
                    language=lang_code,
                    current_case_state=current_case_state.model_dump() if current_case_state else None,
                    turn_number=turn_number,
                )
                extracted = gemini_res.extracted_entities
                llm_missing = gemini_res.missing_information
                llm_question = gemini_res.next_question_regional or gemini_res.next_question
                llm_question_type = gemini_res.next_question_type
            else:
                # Rule-based / Mock extraction
                extracted = self.extract_entities(transcript, lang_code)
        except Exception as e:
            logger.warning(f"LLM Provider execution error ({e}), falling back to deterministic extraction.")
            extracted = self.extract_entities(transcript, lang_code)

        if not extracted:
            extracted = self.extract_entities(transcript, lang_code)

        # 3. Ensure deterministic safety flags are NEVER dropped or bypassed
        for rf in authoritative_red_flags:
            if not any(e.type == rf.type for e in extracted.red_flags):
                extracted.red_flags.append(rf)

        # 4. Update cumulative clinical case state
        updated_state = self.update_case_state(
            current_state=current_case_state,
            extracted=extracted,
            transcript=transcript,
            language=lang_code,
        )

        # 5. Determine missing dimensions & next question
        deterministic_missing = self.identify_missing_dimensions(updated_state)
        missing_dimensions = deterministic_missing if not llm_missing else deterministic_missing

        next_en_q, q_type, next_reg_q, is_complete = self.determine_next_question(
            state=updated_state,
            turn_number=turn_number,
            language=lang_code,
            max_turns=max_turns,
        )

        is_emergency = bool(updated_state.red_flags or authoritative_red_flags)

        # If LLM proposed a question in normal (non-emergency, non-completed) state, use it if compatible
        if not is_emergency and not is_complete and llm_question:
            next_reg_q = llm_question
            if is_gemini and 'gemini_res' in locals() and gemini_res.next_question:
                next_en_q = gemini_res.next_question
            if llm_question_type:
                q_type = llm_question_type

        suggested_opts = gemini_res.suggested_options if is_gemini and 'gemini_res' in locals() else []

        return ClinicalTurnResponse(
            success=True,
            transcript=transcript,
            language=lang_code,
            extracted_entities=extracted,
            case_state=updated_state,
            next_question=next_en_q,
            next_question_regional=next_reg_q,
            next_question_type=q_type,
            suggested_options=suggested_opts,
            missing_information=missing_dimensions,
            red_flags=updated_state.red_flags,
            requires_emergency_attention=is_emergency,
            is_case_complete=is_complete,
            provider=provider_name,
        )


default_clinical_engine = ClinicalCaseTakingEngine()

import React, { createContext, useContext, useState } from 'react';
import { isDemoIntelligenceModeActive, setDemoIntelligenceMode, getStoredDemoScenario, setStoredDemoScenario } from '../config/demoConfig';
import { demoClinicalInterviewEngine } from '../engines/DemoClinicalInterviewEngine';
import { demoAyushAssessmentEngine } from '../engines/DemoAyushAssessmentEngine';
import { demoEvidenceEngine } from '../engines/DemoEvidenceEngine';
import { demoConsistencyEngine } from '../engines/DemoConsistencyEngine';
import { demoCompletenessEngine } from '../engines/DemoCompletenessEngine';
import { demoTimelineEngine } from '../engines/DemoTimelineEngine';
import { DEMO_PATIENT } from '../data/demoPatient';
import { DEMO_DOCUMENTS } from '../data/demoDocuments';
import type {
  ClinicalFact,
  DiscrepancyItem,
  LabResultItem,
  AyushCaseProfile,
  TimelineEvent,
  AuditTrailEntry,
  CaseCompletenessState,
  MultimodalInterviewTurn,
} from '../types/demoTypes';

interface DemoIntelligenceContextType {
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  activeScenario: string;
  setScenario: (scenario: string) => void;
  patient: typeof DEMO_PATIENT;
  documents: typeof DEMO_DOCUMENTS;

  // Module 1: Multimodal Clinical Interview
  interviewTurn: MultimodalInterviewTurn;
  currentTurnIndex: number;
  totalInterviewTurns: number;
  isInterviewComplete: boolean;
  submitInterviewAnswer: (inputMethod: 'voice' | 'touch', answerText: string) => void;
  advanceInterviewTurn: () => void;

  // Module 2: AYUSH-Native Intelligence
  ayushProfile: AyushCaseProfile;
  verifyAyushParameter: (paramKey: keyof Omit<AyushCaseProfile, 'dashavidhaPariksha' | 'completenessScore'>) => void;

  // Module 3: Evidence-Linked AI
  clinicalFacts: ClinicalFact[];
  auditTrail: AuditTrailEntry[];
  activeEvidenceFact: ClinicalFact | null;
  isEvidenceDrawerOpen: boolean;
  openEvidenceDrawer: (factId: string) => void;
  closeEvidenceDrawer: () => void;
  verifyFact: (factId: string) => void;
  editFact: (factId: string, newValue: string) => void;

  // Module 4: Clinical Consistency & Completeness
  discrepancies: DiscrepancyItem[];
  activeDiscrepancies: DiscrepancyItem[];
  abnormalLabs: LabResultItem[];
  allLabs: LabResultItem[];
  completeness: CaseCompletenessState;
  resolveDiscrepancy: (discrepancyId: string, note: string) => void;
  resolveMissingField: (fieldId: string, value: string) => void;
  isQuickClarifyOpen: boolean;
  setIsQuickClarifyOpen: (open: boolean) => void;

  // Module 5: 30-Second Doctor View & Timeline
  timelineEvents: TimelineEvent[];
  selectedTimelineEvent: TimelineEvent | null;
  setSelectedTimelineEvent: (event: TimelineEvent | null) => void;
  isDemoScannerOpen: boolean;
  setIsDemoScannerOpen: (open: boolean) => void;

  // Master Actions
  resetDemoData: () => void;
}

const DemoIntelligenceContext = createContext<DemoIntelligenceContextType | undefined>(undefined);

export const DemoIntelligenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoModeState] = useState<boolean>(isDemoIntelligenceModeActive());
  const [activeScenario, setActiveScenarioState] = useState<string>(getStoredDemoScenario());

  // Engine reactive states
  const [interviewTurn, setInterviewTurn] = useState<MultimodalInterviewTurn>(demoClinicalInterviewEngine.getState().currentTurn);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [isInterviewComplete, setIsInterviewComplete] = useState<boolean>(false);

  const [ayushProfile, setAyushProfile] = useState<AyushCaseProfile>(demoAyushAssessmentEngine.getProfile());
  const [clinicalFacts, setClinicalFacts] = useState<ClinicalFact[]>(demoEvidenceEngine.getAllFacts());
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>(demoEvidenceEngine.getAuditTrail());

  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>(demoConsistencyEngine.getDiscrepancies());
  const [abnormalLabs, setAbnormalLabs] = useState<LabResultItem[]>(demoConsistencyEngine.getAbnormalLabs());
  const [allLabs, setAllLabs] = useState<LabResultItem[]>(demoConsistencyEngine.getAllLabs());
  const [completeness, setCompleteness] = useState<CaseCompletenessState>(demoCompletenessEngine.getState());

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(demoTimelineEngine.getEvents());
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState<TimelineEvent | null>(demoTimelineEngine.getEvents()[0] || null);

  // UI Drawer & Modal states
  const [activeEvidenceFact, setActiveEvidenceFact] = useState<ClinicalFact | null>(null);
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState<boolean>(false);
  const [isQuickClarifyOpen, setIsQuickClarifyOpen] = useState<boolean>(false);
  const [isDemoScannerOpen, setIsDemoScannerOpen] = useState<boolean>(false);

  const setDemoMode = (enabled: boolean) => {
    setIsDemoModeState(enabled);
    setDemoIntelligenceMode(enabled);
  };

  const setScenario = (scenario: string) => {
    setActiveScenarioState(scenario);
    setStoredDemoScenario(scenario);
  };

  const submitInterviewAnswer = (inputMethod: 'voice' | 'touch', answerText: string) => {
    const res = demoClinicalInterviewEngine.processTurnAnswer(interviewTurn.turnId, inputMethod, answerText);
    if (res.nextTurn) {
      setInterviewTurn(res.nextTurn);
      setCurrentTurnIndex(demoClinicalInterviewEngine.getState().currentTurnIndex);
    } else {
      setIsInterviewComplete(true);
    }
  };

  const advanceInterviewTurn = () => {
    const nextIdx = currentTurnIndex + 1;
    const nextTurn = demoClinicalInterviewEngine.getTurn(nextIdx);
    if (nextTurn) {
      setInterviewTurn(nextTurn);
      setCurrentTurnIndex(nextIdx);
    } else {
      setIsInterviewComplete(true);
    }
  };

  const verifyAyushParameter = (paramKey: keyof Omit<AyushCaseProfile, 'dashavidhaPariksha' | 'completenessScore'>) => {
    demoAyushAssessmentEngine.verifyParameter(paramKey);
    setAyushProfile({ ...demoAyushAssessmentEngine.getProfile() });
  };

  const openEvidenceDrawer = (factId: string) => {
    const fact = demoEvidenceEngine.getFactById(factId);
    if (fact) {
      setActiveEvidenceFact(fact);
      setIsEvidenceDrawerOpen(true);
    }
  };

  const closeEvidenceDrawer = () => {
    setIsEvidenceDrawerOpen(false);
  };

  const verifyFact = (factId: string) => {
    demoEvidenceEngine.verifyFactByDoctor(factId);
    setClinicalFacts(demoEvidenceEngine.getAllFacts());
    setAuditTrail(demoEvidenceEngine.getAuditTrail());
  };

  const editFact = (factId: string, newValue: string) => {
    demoEvidenceEngine.editFactValue(factId, newValue);
    setClinicalFacts(demoEvidenceEngine.getAllFacts());
    setAuditTrail(demoEvidenceEngine.getAuditTrail());
  };

  const resolveDiscrepancy = (discrepancyId: string, note: string) => {
    demoConsistencyEngine.resolveDiscrepancy(discrepancyId, note);
    setDiscrepancies(demoConsistencyEngine.getDiscrepancies());
  };

  const resolveMissingField = (fieldId: string, value: string) => {
    const updated = demoCompletenessEngine.resolveField(fieldId, value);
    setCompleteness({ ...updated });
  };

  const resetDemoData = () => {
    demoClinicalInterviewEngine.reset();
    demoAyushAssessmentEngine.reset();
    demoEvidenceEngine.reset();
    demoConsistencyEngine.reset();
    demoCompletenessEngine.reset();
    demoTimelineEngine.reset();

    setInterviewTurn(demoClinicalInterviewEngine.getState().currentTurn);
    setCurrentTurnIndex(0);
    setIsInterviewComplete(false);

    setAyushProfile(demoAyushAssessmentEngine.getProfile());
    setClinicalFacts(demoEvidenceEngine.getAllFacts());
    setAuditTrail(demoEvidenceEngine.getAuditTrail());

    setDiscrepancies(demoConsistencyEngine.getDiscrepancies());
    setAbnormalLabs(demoConsistencyEngine.getAbnormalLabs());
    setAllLabs(demoConsistencyEngine.getAllLabs());
    setCompleteness(demoCompletenessEngine.getState());

    setTimelineEvents(demoTimelineEngine.getEvents());
    setSelectedTimelineEvent(demoTimelineEngine.getEvents()[0] || null);

    setActiveEvidenceFact(null);
    setIsEvidenceDrawerOpen(false);
    setIsQuickClarifyOpen(false);
    setIsDemoScannerOpen(false);
  };

  return (
    <DemoIntelligenceContext.Provider
      value={{
        isDemoMode,
        setDemoMode,
        activeScenario,
        setScenario,
        patient: DEMO_PATIENT,
        documents: DEMO_DOCUMENTS,

        interviewTurn,
        currentTurnIndex,
        totalInterviewTurns: 3,
        isInterviewComplete,
        submitInterviewAnswer,
        advanceInterviewTurn,

        ayushProfile,
        verifyAyushParameter,

        clinicalFacts,
        auditTrail,
        activeEvidenceFact,
        isEvidenceDrawerOpen,
        openEvidenceDrawer,
        closeEvidenceDrawer,
        verifyFact,
        editFact,

        discrepancies,
        activeDiscrepancies: discrepancies.filter((d) => d.status === 'active'),
        abnormalLabs,
        allLabs,
        completeness,
        resolveDiscrepancy,
        resolveMissingField,
        isQuickClarifyOpen,
        setIsQuickClarifyOpen,

        timelineEvents,
        selectedTimelineEvent,
        setSelectedTimelineEvent,
        isDemoScannerOpen,
        setIsDemoScannerOpen,

        resetDemoData,
      }}
    >
      {children}
    </DemoIntelligenceContext.Provider>
  );
};

export const useDemoIntelligence = (): DemoIntelligenceContextType => {
  const context = useContext(DemoIntelligenceContext);
  if (!context) {
    throw new Error('useDemoIntelligence must be used within a DemoIntelligenceProvider');
  }
  return context;
};

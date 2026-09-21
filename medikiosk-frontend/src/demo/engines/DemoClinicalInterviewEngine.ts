import { DEMO_INTERVIEW_TURNS } from '../data/demoInterview';
import type { MultimodalInterviewTurn } from '../types/demoTypes';

export interface InterviewEngineState {
  currentTurnIndex: number;
  totalTurns: number;
  currentTurn: MultimodalInterviewTurn;
  answers: Array<{
    turnId: number;
    questionId: string;
    inputMethod: 'voice' | 'touch';
    transcriptOrOption: string;
    confirmed: boolean;
    timestamp: string;
  }>;
  accumulatedEntities: {
    symptoms: Array<{ name: string; duration?: string; severity?: string; trigger?: string }>;
    importantNegatives: string[];
    associatedSymptoms: string[];
    redFlags: string[];
  };
  isComplete: boolean;
}

export class DemoClinicalInterviewEngine {
  private state: InterviewEngineState;

  constructor() {
    this.state = this.getInitialState();
  }

  public getInitialState(): InterviewEngineState {
    const firstTurn = DEMO_INTERVIEW_TURNS[0];
    return {
      currentTurnIndex: 0,
      totalTurns: DEMO_INTERVIEW_TURNS.length,
      currentTurn: firstTurn,
      answers: [],
      accumulatedEntities: {
        symptoms: [],
        importantNegatives: [],
        associatedSymptoms: [],
        redFlags: [],
      },
      isComplete: false,
    };
  }

  public getState(): InterviewEngineState {
    return { ...this.state };
  }

  public getTurn(turnIndex: number): MultimodalInterviewTurn | null {
    return DEMO_INTERVIEW_TURNS[turnIndex] || null;
  }

  public processTurnAnswer(
    turnId: number,
    inputMethod: 'voice' | 'touch',
    answerText: string
  ): {
    extractedSummary: MultimodalInterviewTurn['aiUnderstoodSummary'];
    extractedEntities: MultimodalInterviewTurn['extractedEntities'];
    hasNextTurn: boolean;
    nextTurn: MultimodalInterviewTurn | null;
  } {
    const currentTurn = DEMO_INTERVIEW_TURNS.find((t) => t.turnId === turnId) || this.state.currentTurn;

    // Record answer
    this.state.answers.push({
      turnId,
      questionId: currentTurn.questionId,
      inputMethod,
      transcriptOrOption: answerText,
      confirmed: true,
      timestamp: new Date().toISOString(),
    });

    // Accumulate entities
    this.state.accumulatedEntities.symptoms.push(...currentTurn.extractedEntities.symptoms);
    this.state.accumulatedEntities.importantNegatives.push(...currentTurn.extractedEntities.importantNegatives);
    this.state.accumulatedEntities.associatedSymptoms.push(...currentTurn.extractedEntities.associatedSymptoms);
    this.state.accumulatedEntities.redFlags.push(...currentTurn.extractedEntities.redFlags);

    const nextIndex = this.state.currentTurnIndex + 1;
    const hasNext = nextIndex < DEMO_INTERVIEW_TURNS.length;

    if (hasNext) {
      this.state.currentTurnIndex = nextIndex;
      this.state.currentTurn = DEMO_INTERVIEW_TURNS[nextIndex];
    } else {
      this.state.isComplete = true;
    }

    return {
      extractedSummary: currentTurn.aiUnderstoodSummary,
      extractedEntities: currentTurn.extractedEntities,
      hasNextTurn: hasNext,
      nextTurn: hasNext ? DEMO_INTERVIEW_TURNS[nextIndex] : null,
    };
  }

  public reset(): void {
    this.state = this.getInitialState();
  }
}

export const demoClinicalInterviewEngine = new DemoClinicalInterviewEngine();

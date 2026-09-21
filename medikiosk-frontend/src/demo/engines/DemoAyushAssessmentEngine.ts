import { DEMO_AYUSH_PROFILE } from '../data/demoAyushProfile';
import type { AyushCaseProfile, AyushParameterItem } from '../types/demoTypes';

export interface AyushEngineState {
  profile: AyushCaseProfile;
  collectedAnswers: Record<string, string>;
  completeness: number;
}

export class DemoAyushAssessmentEngine {
  private state: AyushEngineState;

  constructor() {
    this.state = {
      profile: JSON.parse(JSON.stringify(DEMO_AYUSH_PROFILE)),
      collectedAnswers: {},
      completeness: DEMO_AYUSH_PROFILE.completenessScore,
    };
  }

  public getProfile(): AyushCaseProfile {
    return this.state.profile;
  }

  public updateParameter(
    parameterKey: keyof Omit<AyushCaseProfile, 'dashavidhaPariksha' | 'completenessScore'>,
    updates: Partial<AyushParameterItem>
  ): void {
    if (this.state.profile[parameterKey]) {
      this.state.profile[parameterKey] = {
        ...this.state.profile[parameterKey],
        ...updates,
      };
    }
  }

  public verifyParameter(
    parameterKey: keyof Omit<AyushCaseProfile, 'dashavidhaPariksha' | 'completenessScore'>,
    doctorName: string = 'Dr. Priya Sharma (BAMS, MD)'
  ): void {
    if (this.state.profile[parameterKey]) {
      this.state.profile[parameterKey].status = 'doctor_verified';
      this.state.profile[parameterKey].description += ` [Physician Verified by ${doctorName}]`;
    }
  }

  public getDashavidhaSummary(): AyushCaseProfile['dashavidhaPariksha'] {
    return this.state.profile.dashavidhaPariksha;
  }

  public reset(): void {
    this.state = {
      profile: JSON.parse(JSON.stringify(DEMO_AYUSH_PROFILE)),
      collectedAnswers: {},
      completeness: DEMO_AYUSH_PROFILE.completenessScore,
    };
  }
}

export const demoAyushAssessmentEngine = new DemoAyushAssessmentEngine();

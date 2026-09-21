export interface DemoConfig {
  enabled: boolean;
  activeScenario: 'default_rajesh' | 'medication_conflict' | 'allergy_conflict' | 'abnormal_labs' | 'completeness_test';
  autoSimulateOcr: boolean;
  ocrScanDurationMs: number;
  enableInteractiveEvidenceDrawer: boolean;
  enableCompletenessFeedback: boolean;
  enableVoiceSimulation: boolean;
}

export const DEFAULT_DEMO_CONFIG: DemoConfig = {
  enabled: true,
  activeScenario: 'default_rajesh',
  autoSimulateOcr: true,
  ocrScanDurationMs: 1600,
  enableInteractiveEvidenceDrawer: true,
  enableCompletenessFeedback: true,
  enableVoiceSimulation: true,
};

const STORAGE_KEY = 'medikiosk_demo_intelligence_mode';
const SCENARIO_KEY = 'medikiosk_demo_active_scenario';

export const isDemoIntelligenceModeActive = (): boolean => {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === null) return true; // Default to active for hackathon demo convenience
  return saved === 'true';
};

export const setDemoIntelligenceMode = (active: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, active ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('medikiosk_demo_mode_change', { detail: { active } }));
  }
};

export const getStoredDemoScenario = (): string => {
  if (typeof window === 'undefined') return 'default_rajesh';
  return localStorage.getItem(SCENARIO_KEY) || 'default_rajesh';
};

export const setStoredDemoScenario = (scenario: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SCENARIO_KEY, scenario);
    window.dispatchEvent(new CustomEvent('medikiosk_demo_scenario_change', { detail: { scenario } }));
  }
};

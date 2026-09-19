import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export interface KioskScreenConfig {
  onContinue?: () => void;
  onBack?: () => void;
  isContinueDisabled?: boolean;
  isBackDisabled?: boolean;
  continueLabelKey?: string;
  backLabelKey?: string;
  audioPrompt?: string;
  screenTitle?: string;
}

interface KioskScreenContextValue {
  config: KioskScreenConfig;
  setScreenConfig: (config: KioskScreenConfig) => void;
  handleContinue: () => void;
  handleBack: () => void;
}

const KioskScreenContext = createContext<KioskScreenContextValue | null>(null);

export function KioskScreenProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<KioskScreenConfig>({});
  const configRef = useRef<KioskScreenConfig>({});
  configRef.current = config;

  const setScreenConfig = useCallback((newConfig: KioskScreenConfig) => {
    setConfig((prev) => {
      if (
        prev.isContinueDisabled === newConfig.isContinueDisabled &&
        prev.isBackDisabled === newConfig.isBackDisabled &&
        prev.continueLabelKey === newConfig.continueLabelKey &&
        prev.backLabelKey === newConfig.backLabelKey &&
        prev.audioPrompt === newConfig.audioPrompt &&
        prev.screenTitle === newConfig.screenTitle &&
        prev.onContinue === newConfig.onContinue &&
        prev.onBack === newConfig.onBack
      ) {
        return prev;
      }
      return newConfig;
    });
  }, []);

  const handleContinue = useCallback(() => {
    if (configRef.current.onContinue && !configRef.current.isContinueDisabled) {
      configRef.current.onContinue();
    }
  }, []);

  const handleBack = useCallback(() => {
    if (configRef.current.onBack && !configRef.current.isBackDisabled) {
      configRef.current.onBack();
    }
  }, []);

  return (
    <KioskScreenContext.Provider
      value={{
        config,
        setScreenConfig,
        handleContinue,
        handleBack,
      }}
    >
      {children}
    </KioskScreenContext.Provider>
  );
}

export function useKioskScreenContext() {
  const context = useContext(KioskScreenContext);
  if (!context) {
    throw new Error('useKioskScreenContext must be used within KioskScreenProvider');
  }
  return context;
}

export function useKioskScreen(screenConfig: KioskScreenConfig) {
  const { setScreenConfig } = useKioskScreenContext();
  const screenConfigRef = useRef(screenConfig);
  screenConfigRef.current = screenConfig;

  useEffect(() => {
    setScreenConfig(screenConfigRef.current);
  }, [
    screenConfig.isContinueDisabled,
    screenConfig.isBackDisabled,
    screenConfig.continueLabelKey,
    screenConfig.backLabelKey,
    screenConfig.audioPrompt,
    screenConfig.screenTitle,
    setScreenConfig,
  ]);
}

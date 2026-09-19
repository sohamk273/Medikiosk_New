import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { KioskProvider } from './context/KioskContext';
import { LanguageSelectionPage } from './pages/LanguageSelectionPage';
import { AuthChoicePage } from './pages/AuthChoicePage';
import { LoginOptionsPage } from './pages/LoginOptionsPage';
import { RegisterOptionsPage } from './pages/RegisterOptionsPage';
import { PhoneInputPage } from './pages/PhoneInputPage';
import { AbhaScanPage } from './pages/AbhaScanPage';
import { OTPVerificationPage } from './pages/OTPVerificationPage';
import { DemographicFormPage } from './pages/DemographicFormPage';
import { ConsentPage } from './pages/ConsentPage';
import { ChiefComplaintPage } from './pages/ChiefComplaintPage';
import { AdaptiveHistoryPage } from './pages/AdaptiveHistoryPage';
import { AyushHistoryPage } from './pages/AyushHistoryPage';
import { DocumentScannerPage } from './pages/DocumentScannerPage';
import { RedFlagTriagePage } from './pages/RedFlagTriagePage';
import { PatientReviewPage } from './pages/PatientReviewPage';
import { SessionCompletePage } from './pages/SessionCompletePage';
import { PatientDashboardPage } from './pages/PatientDashboardPage';

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/language" replace />} />
        <Route path="/language" element={<LanguageSelectionPage />} />
        <Route path="/auth" element={<AuthChoicePage />} />
        <Route path="/login" element={<LoginOptionsPage />} />
        <Route path="/register" element={<RegisterOptionsPage />} />
        <Route path="/login/phone" element={<PhoneInputPage />} />
        <Route path="/login/abha" element={<AbhaScanPage />} />
        <Route path="/register/phone" element={<PhoneInputPage />} />
        <Route path="/register/abha" element={<AbhaScanPage />} />
        <Route path="/otp" element={<OTPVerificationPage />} />
        <Route path="/demographics" element={<DemographicFormPage />} />
        <Route path="/consent" element={<ConsentPage />} />
        <Route path="/history/chief-complaint" element={<ChiefComplaintPage />} />
        <Route path="/history/socrates" element={<AdaptiveHistoryPage />} />
        <Route path="/history/ayush" element={<AyushHistoryPage />} />
        <Route path="/documents" element={<DocumentScannerPage />} />
        <Route path="/triage-alert" element={<RedFlagTriagePage />} />
        <Route path="/review" element={<PatientReviewPage />} />
        <Route path="/complete" element={<SessionCompletePage />} />
        <Route path="/dashboard" element={<PatientDashboardPage />} />
        <Route path="*" element={<Navigate to="/language" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

export function App() {
  return (
    <KioskProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </KioskProvider>
  );
}

export default App;

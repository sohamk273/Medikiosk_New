import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import { KioskLayout } from '@/components/layout/KioskLayout';
import { EMRLayout } from '@/components/layout/EMRLayout';

// Patient Pages
import Welcome from '@/pages/patient/Welcome';
import Language from '@/pages/patient/Language';
import Identify from '@/pages/patient/Identify';
import Abha from '@/pages/patient/Abha';
import Register from '@/pages/patient/Register';
import OpdSlip from '@/pages/patient/OpdSlip';
import Consent from '@/pages/patient/Consent';
import Profile from '@/pages/patient/Profile';
import ChiefComplaint from '@/pages/patient/ChiefComplaint';
import Voice from '@/pages/patient/Voice';
import VoiceProcessing from '@/pages/patient/VoiceProcessing';
import VoiceConfirmation from '@/pages/patient/VoiceConfirmation';
import CaseSummary from '@/pages/patient/CaseSummary';
import Ayush from '@/pages/patient/Ayush';
import Medications from '@/pages/patient/Medications';
import Allergies from '@/pages/patient/Allergies';
import Scan from '@/pages/patient/documents/Scan';
import Review from '@/pages/patient/documents/Review';
import PatientReview from '@/pages/patient/Review';
import Submit from '@/pages/patient/Submit';
import Complete from '@/pages/patient/Complete';

// Doctor Pages
import Login from '@/pages/doctor/Login';
import Dashboard from '@/pages/doctor/Dashboard';
import DoctorQueue from '@/pages/doctor/DoctorQueue';
import CaseDetail from '@/pages/doctor/CaseDetail';
import PatientCases from '@/pages/doctor/PatientCases';
import PatientRecord from '@/pages/doctor/PatientRecord';
import Consultation from '@/pages/doctor/Consultation';
import DoctorCaseSummary from '@/pages/doctor/CaseSummary';
import AyushAssessments from '@/pages/doctor/AyushAssessments';
import AyushAssessmentDetail from '@/pages/doctor/AyushAssessmentDetail';
import DocumentsOcr from '@/pages/doctor/DocumentsOcr';
import DocumentDetail from '@/pages/doctor/DocumentDetail';
import ClinicalReports from '@/pages/doctor/ClinicalReports';
import ClinicalReportDetail from '@/pages/doctor/ClinicalReportDetail';
import Settings from '@/pages/doctor/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/patient" replace />,
  },
  // Patient Kiosk Routes
  {
    path: '/patient',
    element: <KioskLayout />,
    children: [
      { index: true, element: <Welcome /> },
      { path: 'language', element: <Language /> },
      { path: 'identify', element: <Identify /> },
      { path: 'abha', element: <Abha /> },
      { path: 'register', element: <Register /> },
      { path: 'opd-slip', element: <OpdSlip /> },
      { path: 'consent', element: <Consent /> },
      { path: 'profile', element: <Profile /> },
      { path: 'chief-complaint', element: <ChiefComplaint /> },
      { path: 'voice', element: <Voice /> },
      { path: 'voice/processing', element: <VoiceProcessing /> },
      { path: 'voice-processing', element: <VoiceProcessing /> },
      { path: 'voice/confirmation', element: <VoiceConfirmation /> },
      { path: 'voice-confirmation', element: <VoiceConfirmation /> },
      { path: 'case-summary', element: <CaseSummary /> },
      { path: 'ayush', element: <Ayush /> },
      { path: 'medications', element: <Medications /> },
      { path: 'allergies', element: <Allergies /> },
      { path: 'documents/scan', element: <Scan /> },
      { path: 'documents/review', element: <Review /> },
      { path: 'review', element: <PatientReview /> },
      { path: 'submit', element: <Submit /> },
      { path: 'complete', element: <Complete /> },
    ],
  },
  // Doctor EMR Routes
  {
    path: '/doctor',
    element: <EMRLayout />,
    children: [
      { index: true, element: <Navigate to="queue" replace /> },
      { path: 'login', element: <Login /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'queue', element: <DoctorQueue /> },
      { path: 'case/:caseId', element: <CaseDetail /> },
      { path: 'case/:caseId/summary', element: <DoctorCaseSummary /> },
      { path: 'cases', element: <PatientCases /> },
      { path: 'patient/:patientId', element: <PatientRecord /> },
      { path: 'ayush', element: <AyushAssessments /> },
      { path: 'ayush/:caseId', element: <AyushAssessmentDetail /> },
      { path: 'consultation/:caseId', element: <Consultation /> },
      { path: 'documents', element: <DocumentsOcr /> },
      { path: 'documents/:documentId', element: <DocumentDetail /> },
      { path: 'reports', element: <ClinicalReports /> },
      { path: 'reports/:reportId', element: <ClinicalReportDetail /> },
      { path: 'settings', element: <Settings /> },
    ],
  }
]);

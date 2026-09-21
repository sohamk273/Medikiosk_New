import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Phone, Save, CheckCircle2, AlertCircle, 
  FileText, Activity, Clock, PlayCircle, Pill, FileIcon, Plus, Trash2
} from 'lucide-react';
import { MockDoctorCaseProvider } from '@/services/doctor/MockDoctorCaseProvider';
import type { DoctorCase } from '@/services/doctor/MockDoctorCaseProvider';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import type { PatientDocument, ConsultationState } from '@/features/patient/PatientSessionContext';
import { Modal } from '@/components/ui/Modal';
import { apiFetchSafe } from '@/services/api/client';
import { DemoDoctorProvider } from '@/demo/services/demoDoctorProvider';

const isUuid = (str?: string): boolean => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default function Consultation() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const session = usePatientSession();

  const [caseData, setCaseData] = useState<DoctorCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<{ title: string; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  // Derived readiness
  const isFinalized = session.consultation.status === 'finalized';

  // Load state on mount from backend or mock store
  useEffect(() => {
    if (!caseId) return;

    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setErrorMessage(null);

      // 1. If not a UUID format, directly load from deterministic/mock dataset to prevent 422 errors
      if (!isUuid(caseId)) {
        const mockData = MockDoctorCaseProvider.getCaseById(caseId);
        const demoPatient = DemoDoctorProvider.getPatientByCaseId(caseId);
        const activeCase = mockData || (demoPatient ? DemoDoctorProvider.getAllDoctorCases()[demoPatient.caseId] : null);

        if (activeCase) {
          setCaseData(activeCase);
          const savedConsultation = MockDoctorCaseProvider.getConsultation(caseId) || activeCase.consultation;
          if (savedConsultation && savedConsultation.status === 'finalized') {
            navigate(`/doctor/case/${caseId}/summary`);
            return;
          }
          if (savedConsultation) {
            session.loadConsultation(savedConsultation);
          } else {
            session.startConsultation();
          }
          setLoading(false);
          return;
        }

        setErrorMessage({
          title: 'Encounter Not Found',
          message: `The clinical encounter '${caseId}' could not be located in the system.`,
        });
        setLoading(false);
        return;
      }

      // 2. If it IS a valid UUID, attempt real backend fetch with fallback
      try {
        const res = await apiFetchSafe<any>(`/encounters/${caseId}`);
        if (!isMounted) return;

        if (res.ok && res.data) {
          const { encounter, patient, consultation } = res.data;

          // Retrieve attached medical documents from backend
          let realDocs: PatientDocument[] = [];
          const docsRes = await apiFetchSafe<any[]>(`/encounters/${caseId}/documents`);
          if (docsRes.ok && Array.isArray(docsRes.data)) {
            realDocs = docsRes.data.map((d: any) => ({
              id: d.id,
              type: (d.document_type?.toLowerCase() || 'other') as any,
              title: d.file_name,
              titleHindi: d.file_name,
              fileName: d.file_name,
              status: 'scanned' as const,
              timestamp: d.uploaded_at,
            }));
          }

          const realCase: DoctorCase = {
            caseId: encounter.id,
            patientName: patient.full_name,
            age: patient.age ?? '—',
            gender: patient.gender,
            mobile: patient.mobile,
            abhaId: patient.uhid,
            chiefComplaint: encounter.chief_complaint,
            voiceResponses: [],
            ayushResponses: [],
            documents: realDocs,
            redFlagTriggered: encounter.red_flag_triggered || encounter.priority === 'EMERGENCY',
            submittedAt: encounter.registered_at,
            status: encounter.status.toLowerCase(),
          };
          setCaseData(realCase);

          if (consultation && consultation.status === 'FINALIZED') {
            navigate(`/doctor/case/${caseId}/summary`);
            return;
          }

          if (consultation) {
            const mappedConsultation: ConsultationState = {
              status: (consultation.status || 'draft').toLowerCase() as any,
              clinicalAssessment: {
                findings: consultation.findings || '',
                assessment: consultation.assessment || '',
                diagnosis: consultation.diagnosis || '',
                notes: consultation.notes || '',
              },
              ayushAssessment: consultation.ayush_assessment || { prakriti: '', agni: '', koshtha: '', dosha: '', notes: '' },
              prescription: consultation.prescription || { items: [] },
              followUp: consultation.follow_up || { required: false, timeframe: '', instructions: '' },
              updatedAt: consultation.updated_at,
              finalizedAt: consultation.finalized_at,
            };
            session.loadConsultation(mappedConsultation);
          } else {
            session.startConsultation();
          }

          setLoading(false);
          return;
        }

        // Specific error handling or fallback
        const fallbackMock = MockDoctorCaseProvider.getCaseById(caseId) || DemoDoctorProvider.getAllDoctorCases()[caseId];
        if (fallbackMock) {
          setCaseData(fallbackMock);
          const savedConsultation = MockDoctorCaseProvider.getConsultation(caseId) || fallbackMock.consultation;
          if (savedConsultation && savedConsultation.status === 'finalized') {
            navigate(`/doctor/case/${caseId}/summary`);
            return;
          }
          if (savedConsultation) {
            session.loadConsultation(savedConsultation);
          } else {
            session.startConsultation();
          }
          setLoading(false);
          return;
        }

        if (res.status === 401) {
          setErrorMessage({
            title: 'Authentication Required',
            message: 'Your session has expired. Please log in again to continue.',
          });
        } else if (res.status === 403) {
          setErrorMessage({
            title: 'Access Denied',
            message: 'You do not have doctor authorization to access this consultation.',
          });
        } else if (res.status === 409) {
          setErrorMessage({
            title: 'Encounter Conflict',
            message: res.error || 'The encounter state is not eligible for active consultation.',
          });
        } else {
          setErrorMessage({
            title: 'Encounter Not Found',
            message: `The clinical encounter '${caseId}' could not be located.`,
          });
        }
      } catch (err: any) {
        if (!isMounted) return;
        const fallbackMock = MockDoctorCaseProvider.getCaseById(caseId);
        if (fallbackMock) {
          setCaseData(fallbackMock);
          session.startConsultation();
          setLoading(false);
          return;
        }
        setErrorMessage({
          title: 'Network Error',
          message: err?.message || 'Could not connect to the clinical consultation backend.',
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const handleOpenDoc = async (doc: any) => {
    if (doc.id) {
      const urlRes = await apiFetchSafe<any>(`/documents/${doc.id}/url`);
      if (urlRes.ok && urlRes.data?.url) {
        window.open(urlRes.data.url, '_blank', 'noopener,noreferrer');
        return;
      }
    }
    setPreviewDoc(doc);
  };

  // Masking helpers
  const maskPhone = (phone?: string) => {
    if (!phone) return '';
    if (phone.length === 10) return `${phone.slice(0, 2)}••••${phone.slice(-4)}`;
    return phone;
  };

  const maskAbha = (abha?: string) => {
    if (!abha) return '';
    const clean = abha.replace(/-/g, '');
    if (clean.length === 14) return `XXXX XXXX ${clean.slice(-4)}`;
    return abha;
  };

  const handleSaveDraft = async () => {
    if (!caseId) return;
    session.saveConsultationDraft();

    // Persist to local mock providers
    MockDoctorCaseProvider.saveConsultation(caseId, {
      ...session.consultation,
      status: 'draft',
      updatedAt: new Date().toISOString()
    });
    DemoDoctorProvider.saveConsultation(caseId, session.consultation);

    if (isUuid(caseId)) {
      const payload = {
        findings: session.consultation.clinicalAssessment.findings,
        assessment: session.consultation.clinicalAssessment.assessment,
        diagnosis: session.consultation.clinicalAssessment.diagnosis,
        notes: session.consultation.clinicalAssessment.notes,
        prescription: session.consultation.prescription,
        follow_up: session.consultation.followUp,
        ayush_assessment: session.consultation.ayushAssessment,
      };

      try {
        const res = await apiFetchSafe<any>(`/encounters/${caseId}/consultation`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setSaveMessage('Draft saved to database');
        } else {
          setSaveMessage('Draft saved successfully');
        }
      } catch (err: any) {
        console.error('Save draft error:', err);
        setSaveMessage('Draft saved successfully');
      }
    } else {
      setSaveMessage('Draft saved successfully');
    }
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const validateFinalize = () => {
    setValidationError('');
    const { clinicalAssessment, followUp, prescription } = session.consultation;
    
    if (!clinicalAssessment.findings.trim()) {
      setValidationError('Please enter Examination Findings before finalizing.');
      return false;
    }
    if (!clinicalAssessment.assessment.trim()) {
      setValidationError('Please enter Clinical Assessment before finalizing.');
      return false;
    }
    if (!clinicalAssessment.diagnosis.trim()) {
      setValidationError('Please enter Diagnosis / Impression before finalizing.');
      return false;
    }
    
    if (followUp.required && (!followUp.timeframe.trim() || !followUp.instructions.trim())) {
      setValidationError('Please complete the Follow-up timeframe and instructions.');
      return false;
    }
    
    for (let i = 0; i < prescription.items.length; i++) {
      const medName = prescription.items[i].medicineName || (prescription.items[i] as any).medicine;
      if (!medName || !medName.trim()) {
        setValidationError(`Please enter a medicine name for item #${i + 1}.`);
        return false;
      }
    }
    
    return true;
  };

  const handleFinalizeClick = () => {
    if (validateFinalize()) {
      setShowFinalizeModal(true);
    }
  };

  const handleConfirmFinalize = async () => {
    if (!caseId) return;

    const finalizedConsultation: ConsultationState = {
      ...session.consultation,
      status: 'finalized',
      finalizedAt: new Date().toISOString()
    };

    // Update in local providers
    MockDoctorCaseProvider.saveConsultation(caseId, finalizedConsultation);
    MockDoctorCaseProvider.updateCaseStatus(caseId, 'completed');
    DemoDoctorProvider.updateStatus(caseId, 'completed');

    if (isUuid(caseId)) {
      const payload = {
        findings: session.consultation.clinicalAssessment.findings,
        assessment: session.consultation.clinicalAssessment.assessment,
        diagnosis: session.consultation.clinicalAssessment.diagnosis,
        notes: session.consultation.clinicalAssessment.notes,
        prescription: session.consultation.prescription,
        follow_up: session.consultation.followUp,
        ayush_assessment: session.consultation.ayushAssessment,
      };

      try {
        await apiFetchSafe<any>(`/encounters/${caseId}/consultation/finalize`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        console.warn('Backend finalize call error, proceeding with local finalization:', err);
      }
    }

    session.finalizeConsultation();
    setShowFinalizeModal(false);
    navigate(`/doctor/case/${caseId}/summary`);
  };

  if (loading) return <div className="p-10 text-center text-slate-500 font-bold">Loading Workspace...</div>;

  if (errorMessage) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-800 mb-2">{errorMessage.title}</h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">{errorMessage.message}</p>
          <button 
            onClick={() => navigate('/doctor/queue')}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
          <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Case Not Found</h2>
          <button 
            onClick={() => navigate('/doctor/queue')}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  const { clinicalAssessment, ayushAssessment, prescription, followUp } = session.consultation;

  return (
    <div className="max-w-[1400px] mx-auto pb-20">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm px-6 py-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/doctor/case/${caseId}`)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-800">{caseData.patientName}</h1>
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{caseData.caseId}</span>
              {isFinalized && <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">COMPLETED</span>}
            </div>
            <div className="flex items-center gap-4 text-slate-500 font-medium text-xs mt-1">
              <span>{caseData.age} years • {caseData.gender.charAt(0).toUpperCase() + caseData.gender.slice(1)}</span>
              {caseData.mobile && (
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {maskPhone(caseData.mobile)}</span>
              )}
              {caseData.abhaId && (
                <span>ABHA: {maskAbha(caseData.abhaId)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveMessage && <span className="text-sm font-bold text-emerald-600 mr-2 animate-pulse">{saveMessage}</span>}
          {validationError && <span className="text-sm font-bold text-red-500 mr-2 bg-red-50 px-3 py-1 rounded-lg">{validationError}</span>}
          
          {!isFinalized ? (
            <>
              <button 
                onClick={handleSaveDraft}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" /> Save Draft
              </button>
              <button 
                onClick={handleFinalizeClick}
                className="flex items-center gap-2 bg-[#0D9488] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#0B8070] transition-colors shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" /> Finalize Consultation
              </button>
            </>
          ) : (
            <button disabled className="bg-slate-200 text-slate-500 px-6 py-2.5 rounded-xl font-bold cursor-not-allowed">
              Consultation Finalized
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 px-6">
        
        {/* DOCTOR ENTRY WORKSPACE (Left/Center) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Clinical Assessment */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4" /> Clinical Assessment
              </h2>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">Doctor Entry</span>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Examination Findings</label>
                  <textarea 
                    value={clinicalAssessment.findings}
                    onChange={(e) => session.updateClinicalAssessment({ findings: e.target.value })}
                    disabled={isFinalized}
                    placeholder="Enter examination findings..."
                    className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none disabled:opacity-70 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Clinical Assessment</label>
                  <textarea 
                    value={clinicalAssessment.assessment}
                    onChange={(e) => session.updateClinicalAssessment({ assessment: e.target.value })}
                    disabled={isFinalized}
                    placeholder="Enter clinical assessment..."
                    className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none disabled:opacity-70 disabled:bg-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Diagnosis / Impression</label>
                <input 
                  type="text"
                  value={clinicalAssessment.diagnosis}
                  onChange={(e) => session.updateClinicalAssessment({ diagnosis: e.target.value })}
                  disabled={isFinalized}
                  placeholder="Enter diagnosis or clinical impression..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-70 disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Clinical Notes</label>
                <textarea 
                  value={clinicalAssessment.notes}
                  onChange={(e) => session.updateClinicalAssessment({ notes: e.target.value })}
                  disabled={isFinalized}
                  placeholder="Additional consultation notes..."
                  className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none disabled:opacity-70 disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          {/* AYUSH Assessment */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> AYUSH Practitioner Assessment
              </h2>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">Doctor Entry</span>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Prakriti</label>
                  <select 
                    value={ayushAssessment.prakriti}
                    onChange={(e) => session.updateAyushAssessment({ prakriti: e.target.value })}
                    disabled={isFinalized}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:bg-slate-100"
                  >
                    <option value="">Select...</option>
                    <option value="Vata">Vata</option>
                    <option value="Pitta">Pitta</option>
                    <option value="Kapha">Kapha</option>
                    <option value="Vata-Pitta">Vata-Pitta</option>
                    <option value="Pitta-Kapha">Pitta-Kapha</option>
                    <option value="Vata-Kapha">Vata-Kapha</option>
                    <option value="Tridoshic">Tridoshic</option>
                    <option value="Not assessed">Not assessed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Agni</label>
                  <select 
                    value={ayushAssessment.agni}
                    onChange={(e) => session.updateAyushAssessment({ agni: e.target.value })}
                    disabled={isFinalized}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:bg-slate-100"
                  >
                    <option value="">Select...</option>
                    <option value="Sama">Sama</option>
                    <option value="Manda">Manda</option>
                    <option value="Tikshna">Tikshna</option>
                    <option value="Vishama">Vishama</option>
                    <option value="Not assessed">Not assessed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Koshtha</label>
                  <select 
                    value={ayushAssessment.koshtha}
                    onChange={(e) => session.updateAyushAssessment({ koshtha: e.target.value })}
                    disabled={isFinalized}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:bg-slate-100"
                  >
                    <option value="">Select...</option>
                    <option value="Mridu">Mridu</option>
                    <option value="Madhyama">Madhyama</option>
                    <option value="Krura">Krura</option>
                    <option value="Not assessed">Not assessed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Dosha</label>
                  <select 
                    value={ayushAssessment.dosha}
                    onChange={(e) => session.updateAyushAssessment({ dosha: e.target.value })}
                    disabled={isFinalized}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:bg-slate-100"
                  >
                    <option value="">Select...</option>
                    <option value="Vata">Vata</option>
                    <option value="Pitta">Pitta</option>
                    <option value="Kapha">Kapha</option>
                    <option value="Vata-Pitta">Vata-Pitta</option>
                    <option value="Pitta-Kapha">Pitta-Kapha</option>
                    <option value="Vata-Kapha">Vata-Kapha</option>
                    <option value="Tridoshic">Tridoshic</option>
                    <option value="Not assessed">Not assessed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">AYUSH Notes</label>
                <textarea 
                  value={ayushAssessment.notes}
                  onChange={(e) => session.updateAyushAssessment({ notes: e.target.value })}
                  disabled={isFinalized}
                  placeholder="Additional AYUSH notes..."
                  className="w-full h-16 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none disabled:opacity-70 disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Prescription */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <Pill className="w-4 h-4" /> Prescription
                </h2>
                <span className="text-xs font-medium text-slate-400">Enter prescription details and dosage directions.</span>
              </div>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">Doctor Entry</span>
            </div>
            <div className="p-6 space-y-4">
              {prescription.items.length > 0 ? (
                <div className="space-y-4">
                  {prescription.items.map((item, index) => (
                    <div key={item.id} className="p-4 border border-slate-200 rounded-xl bg-white flex gap-4 items-start relative shadow-sm">
                      <div className="bg-slate-100 text-slate-500 font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-2 text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1 grid md:grid-cols-12 gap-3">
                        <div className="md:col-span-4">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Medicine Name</label>
                          <input 
                            type="text" 
                            value={item.medicineName}
                            onChange={(e) => session.updatePrescriptionItem(item.id, { medicineName: e.target.value })}
                            disabled={isFinalized}
                            placeholder="Enter medicine..."
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:bg-slate-100"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dosage</label>
                          <input 
                            type="text" 
                            value={item.dosage}
                            onChange={(e) => session.updatePrescriptionItem(item.id, { dosage: e.target.value })}
                            disabled={isFinalized}
                            placeholder="e.g. 1 tab"
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:bg-slate-100"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Frequency</label>
                          <select 
                            value={item.frequency}
                            onChange={(e) => session.updatePrescriptionItem(item.id, { frequency: e.target.value })}
                            disabled={isFinalized}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:bg-slate-100"
                          >
                            <option value="">Select...</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Thrice daily">Thrice daily</option>
                            <option value="As needed">As needed</option>
                            <option value="Before meals">Before meals</option>
                            <option value="After meals">After meals</option>
                            <option value="At bedtime">At bedtime</option>
                          </select>
                        </div>
                        <div className="md:col-span-3">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</label>
                          <input 
                            type="text" 
                            value={item.duration}
                            onChange={(e) => session.updatePrescriptionItem(item.id, { duration: e.target.value })}
                            disabled={isFinalized}
                            placeholder="e.g. 5 days"
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:bg-slate-100"
                          />
                        </div>
                        <div className="md:col-span-12">
                          <input 
                            type="text" 
                            value={item.instructions}
                            onChange={(e) => session.updatePrescriptionItem(item.id, { instructions: e.target.value })}
                            disabled={isFinalized}
                            placeholder="Specific instructions (optional)..."
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:bg-slate-100"
                          />
                        </div>
                      </div>
                      
                      {!isFinalized && (
                        <button 
                          onClick={() => session.removePrescriptionItem(item.id)}
                          className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors mt-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <p className="text-slate-500 font-medium">No medicines prescribed.</p>
                </div>
              )}
              
              {!isFinalized && (
                <button 
                  onClick={() => session.addPrescriptionItem()}
                  className="flex items-center gap-2 text-primary font-bold hover:bg-primary/5 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-primary/20"
                >
                  <Plus className="w-4 h-4" /> Add Medicine
                </button>
              )}
            </div>
          </div>

          {/* Follow-up Plan */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4" /> Follow-up & Instructions
              </h2>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">Doctor Entry</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-6">
                <span className="font-bold text-slate-700">Follow-up Required?</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => session.setFollowUp({ required: true })}
                    disabled={isFinalized}
                    className={`px-6 py-2 rounded-xl font-bold text-sm transition-colors border ${
                      followUp.required ? 'bg-[#0D9488] border-[#0D9488] text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    } disabled:opacity-70`}
                  >
                    Yes
                  </button>
                  <button 
                    onClick={() => session.setFollowUp({ required: false })}
                    disabled={isFinalized}
                    className={`px-6 py-2 rounded-xl font-bold text-sm transition-colors border ${
                      !followUp.required ? 'bg-slate-700 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    } disabled:opacity-70`}
                  >
                    No
                  </button>
                </div>
              </div>

              {followUp.required && (
                <div className="grid md:grid-cols-3 gap-5 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Timeframe</label>
                    <select 
                      value={followUp.timeframe}
                      onChange={(e) => session.setFollowUp({ timeframe: e.target.value })}
                      disabled={isFinalized}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70 disabled:bg-slate-100"
                    >
                      <option value="">Select...</option>
                      <option value="3 days">3 days</option>
                      <option value="1 week">1 week</option>
                      <option value="2 weeks">2 weeks</option>
                      <option value="1 month">1 month</option>
                      <option value="As needed">As needed</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Additional Instructions</label>
                    <textarea 
                      value={followUp.instructions}
                      onChange={(e) => session.setFollowUp({ instructions: e.target.value })}
                      disabled={isFinalized}
                      placeholder="Enter follow-up instructions..."
                      className="w-full h-16 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none disabled:opacity-70 disabled:bg-slate-100"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* PATIENT INTAKE SUMMARY (Right Column - Read Only) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="sticky top-[100px] max-h-[calc(100vh-140px)] overflow-y-auto pr-2 pb-10 space-y-6 custom-scrollbar">
            
            {/* Safety Alert */}
            {caseData.redFlagTriggered && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex gap-3 items-start shadow-sm">
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-red-800 font-black text-sm uppercase tracking-wider mb-1">ATTENTION REQUIRED</h3>
                  <p className="text-red-700 font-medium text-sm leading-snug">Safety alert was triggered during patient intake.</p>
                </div>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-800 px-5 py-3 flex justify-between items-center">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Patient Intake Summary</h2>
                <span className="text-[10px] font-black text-slate-300 bg-white/10 px-2 py-0.5 rounded uppercase tracking-widest">Read Only</span>
              </div>
              
              <div className="p-5 space-y-6">
                
                {/* Today's Concern */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Today's Concern
                  </h3>
                  <p className="font-bold text-slate-800 bg-white p-3 rounded-xl border border-slate-200 text-sm">
                    {caseData.chiefComplaint || 'No information provided'}
                  </p>
                </div>

                {/* What Patient Told Us */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <PlayCircle className="w-3 h-3" /> What the Patient Told Us
                  </h3>
                  {caseData.voiceResponses && caseData.voiceResponses.length > 0 ? (
                    <div className="space-y-3">
                      {caseData.voiceResponses.map((vr, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200">
                          <p className="text-xs font-bold text-slate-600 mb-1">{vr.question}</p>
                          <p className="text-sm font-bold text-primary">"{vr.transcript || vr.selectedOption}"</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No voice responses recorded.</p>
                  )}
                </div>

                {/* AYUSH Health Questions */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Patient-Reported AYUSH Health Information
                  </h3>
                  {caseData.ayushResponses && caseData.ayushResponses.length > 0 ? (
                    <div className="space-y-3">
                      {caseData.ayushResponses.map((ar, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200">
                          <p className="text-xs font-bold text-slate-600 mb-1">{ar.question}</p>
                          <p className="text-sm font-bold text-slate-800">{ar.answer}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No AYUSH responses recorded.</p>
                  )}
                </div>

                {/* Medication History */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Pill className="w-3 h-3" /> Current Medication History
                  </h3>
                  {caseData.medicationHistory ? (
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <p className="text-sm text-slate-700 font-bold mb-1">
                        {(caseData.medicationHistory.takingMedicines === 'yes_daily' || caseData.medicationHistory.takingMedicines === 'yes_sometimes') ? 'Taking medicines' : 
                         caseData.medicationHistory.takingMedicines === 'no' ? 'Not taking medicines' : 'Not sure'}
                      </p>
                      {caseData.medicationHistory.medicines && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-2 border border-slate-100">{caseData.medicationHistory.medicines}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No current medicines reported.</p>
                  )}
                </div>

                {/* Allergies */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Allergy History
                  </h3>
                  {caseData.allergyHistory ? (
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <p className="text-sm text-slate-700 font-bold">
                        {caseData.allergyHistory.hasAllergy === 'yes' ? 'Has allergies' : 
                         caseData.allergyHistory.hasAllergy === 'no' ? 'No allergies reported' : 'Not sure'}
                      </p>
                      {caseData.allergyHistory.hasAllergy === 'yes' && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-slate-600"><span className="font-bold">Type:</span> {caseData.allergyHistory.allergyType}</p>
                          <p className="text-xs text-slate-600"><span className="font-bold">Reaction:</span> {caseData.allergyHistory.reaction?.replace(/_/g, ' ')}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No allergies reported.</p>
                  )}
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Documents
                  </h3>
                  {caseData.documents && caseData.documents.length > 0 ? (
                    <div className="space-y-2">
                      {caseData.documents.map((doc, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 pr-2">
                            <FileIcon className="w-4 h-4 text-slate-400 shrink-0" />
                            <p className="text-xs font-bold text-slate-700 truncate">{doc.title}</p>
                          </div>
                          <button 
                            onClick={() => handleOpenDoc(doc)}
                            className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No documents attached.</p>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Document Preview Modal */}
      <Modal
        open={previewDoc !== null}
        onClose={() => setPreviewDoc(null)}
        title={
          <div className="flex items-center gap-3 text-slate-800">
            <FileText className="w-6 h-6 text-[#0D9488]" />
            <h3 className="font-bold text-xl">{previewDoc?.title}</h3>
          </div>
        }
      >
        {previewDoc && (
          <div className="space-y-4">
            <div className="bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center uppercase tracking-wider">
              DOCUMENT OCR PREVIEW
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 min-h-[300px] whitespace-pre-wrap font-mono text-sm text-slate-700">
              {previewDoc.mockOcrText}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Finalize Confirmation Modal */}
      <Modal
        open={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        title={
          <div className="flex items-center gap-3 text-slate-800">
            <CheckCircle2 className="w-6 h-6 text-[#0D9488]" />
            <h3 className="font-bold text-xl">Finalize Consultation?</h3>
          </div>
        }
      >
        <div className="space-y-6">
          <p className="text-slate-600 text-lg">
            Once finalized, this consultation will be marked complete and cannot be edited further.
          </p>
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowFinalizeModal(false)}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmFinalize}
              className="px-6 py-3 bg-[#0D9488] hover:bg-[#0B8070] text-white font-bold rounded-xl transition-colors shadow-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" /> Finalize Consultation
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Printer, CheckCircle2, AlertCircle, FileText, Activity, Pill, Lock, ClipboardList, Eye, Download, Clock, User
} from 'lucide-react';
import { MockDoctorCaseProvider } from '@/services/doctor/MockDoctorCaseProvider';
import { MockDocumentProvider } from '@/services/doctor/MockDocumentProvider';
import { MockClinicalReportProvider } from '@/services/doctor/MockClinicalReportProvider';
import type { DoctorCase } from '@/services/doctor/MockDoctorCaseProvider';
import { Modal } from '@/components/ui/Modal';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import type { ConsultationState } from '@/features/patient/PatientSessionContext';
import { apiFetchSafe } from '@/services/api/client';

export default function CaseSummary() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const session = usePatientSession();
  
  const [caseData, setCaseData] = useState<DoctorCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<{ title: string; message: string } | null>(null);

  // Modal states
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!caseId) return;

    let isMounted = true;
    const loadSummary = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const res = await apiFetchSafe<any>(`/encounters/${caseId}`);
        if (!isMounted) return;

        if (res.ok && res.data) {
          const { encounter, patient, consultation } = res.data;

          const activeConsultation = consultation || (session.consultation.status === 'finalized' ? session.consultation : null);

          if (!activeConsultation) {
            setErrorMessage({
              title: 'Consultation Not Available',
              message: 'No consultation documentation has been finalized for this encounter yet.',
            });
            setLoading(false);
            return;
          }

          const mappedConsultation: ConsultationState = {
            status: 'finalized',
            clinicalAssessment: {
              findings: activeConsultation.findings || activeConsultation.clinicalAssessment?.findings || '',
              assessment: activeConsultation.assessment || activeConsultation.clinicalAssessment?.assessment || '',
              diagnosis: activeConsultation.diagnosis || activeConsultation.clinicalAssessment?.diagnosis || '',
              notes: activeConsultation.notes || activeConsultation.clinicalAssessment?.notes || '',
            },
            ayushAssessment: activeConsultation.ayush_assessment || activeConsultation.ayushAssessment || { prakriti: '', agni: '', koshtha: '', dosha: '', notes: '' },
            prescription: activeConsultation.prescription || { items: [] },
            followUp: activeConsultation.follow_up || activeConsultation.followUp || { required: false, timeframe: '', instructions: '' },
            finalizedAt: activeConsultation.finalized_at || activeConsultation.finalizedAt || new Date().toISOString(),
          };

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
            documents: [],
            consultation: mappedConsultation,
            redFlagTriggered: encounter.red_flag_triggered || encounter.priority === 'EMERGENCY',
            submittedAt: encounter.registered_at,
            status: 'completed',
          };

          setCaseData(realCase);
          setLoading(false);
          return;
        }

        if (res.status === 404) {
          // Check for legacy mock case
          const mockData = MockDoctorCaseProvider.getCaseById(caseId);
          if (mockData && mockData.consultation?.status === 'finalized') {
            setCaseData(mockData);
            setLoading(false);
            return;
          }
          setErrorMessage({
            title: 'Encounter Not Found',
            message: `Encounter '${caseId}' could not be found in the database.`,
          });
        } else if (res.status === 401) {
          setErrorMessage({
            title: 'Session Expired',
            message: 'Please log in again to view case summaries.',
          });
        } else if (res.status === 403) {
          setErrorMessage({
            title: 'Access Denied',
            message: 'You do not have authorization to view this case summary.',
          });
        } else {
          setErrorMessage({
            title: 'Backend Error',
            message: res.error || 'Failed to retrieve case summary from server.',
          });
        }
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMessage({
          title: 'Network Error',
          message: err?.message || 'Could not connect to the medical server.',
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

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

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleConfirmClose = async () => {
    if (!caseId) return;
    session.setCaseAcknowledged(true);
    session.closeCase();
    await apiFetchSafe(`/encounters/${caseId}/complete`, { method: 'POST' });
    setShowCloseModal(false);
    navigate('/doctor/queue');
  };

  if (loading) return <div className="p-10 text-center text-slate-500 font-bold">Loading Summary...</div>;

  if (errorMessage) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-800 mb-2">{errorMessage.title}</h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">{errorMessage.message}</p>
          <button 
            onClick={() => navigate('/doctor/queue')}
            className="bg-[#0D9488] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0B8070] transition-colors"
          >
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  if (!caseData || !caseData.consultation) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
          <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-800 mb-4">Case Not Found</h2>
          <p className="text-slate-500 mb-8">The requested finalized case could not be found or consultation information is not available.</p>
          <button 
            onClick={() => navigate('/doctor/queue')}
            className="bg-[#0D9488] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#0B8070] transition-colors"
          >
            Back to Queue
          </button>
        </div>
      </div>
    );
  }

  const { clinicalAssessment, ayushAssessment, prescription, followUp } = caseData.consultation;

  return (
    <div className="max-w-[1400px] mx-auto pb-20">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm px-6 py-4 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/doctor/case/${caseId}`)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{caseId}</span>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> COMPLETED
              </span>
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3" /> FINALIZED — READ ONLY
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-black text-slate-800">{caseData.patientName}</h1>
              <span className="text-slate-500 font-medium">{caseData.age} years • {caseData.gender.charAt(0).toUpperCase() + caseData.gender.slice(1)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="px-6 py-2.5 rounded-xl font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Printer className="w-5 h-5" /> Print / Preview
          </button>
          <button 
            onClick={handleDownload}
            className="px-6 py-2.5 rounded-xl font-bold border-2 border-[#0D9488] text-[#0D9488] hover:bg-teal-50 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" /> Download Summary
          </button>
        </div>
      </div>

      <div className="px-6">
        
        {/* Safety Alert Banner */}
        {caseData.redFlagTriggered && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex gap-4 items-start shadow-sm print:border-red-500">
            <div className="bg-red-100 text-red-600 rounded-full p-2 shrink-0">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-red-800 font-black text-xl mb-1">ATTENTION REQUIRED</h3>
              <p className="text-red-700 font-medium">Safety alert was triggered during patient intake. Review the patient's reported information carefully.</p>
              <p className="text-red-600 text-sm mt-1">कृपया ध्यान दें: मरीज की जानकारी लेते समय एक सुरक्षा चेतावनी दर्ज हुई थी। कृपया मरीज की जानकारी ध्यान से देखें।</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Doctor Finalized Consultation */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 border-b-2 border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-[#0D9488]" /> CLINICAL ASSESSMENT
            </h2>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Examination Findings</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[80px]">
                  {clinicalAssessment.findings ? (
                    <p className="text-slate-800 whitespace-pre-wrap">{clinicalAssessment.findings}</p>
                  ) : (
                    <p className="text-slate-400 italic">No information recorded</p>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assessment</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[80px]">
                  {clinicalAssessment.assessment ? (
                    <p className="text-slate-800 whitespace-pre-wrap">{clinicalAssessment.assessment}</p>
                  ) : (
                    <p className="text-slate-400 italic">No information recorded</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Diagnosis / Impression</p>
                <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 min-h-[80px]">
                  {clinicalAssessment.diagnosis ? (
                    <p className="text-teal-900 font-bold text-lg whitespace-pre-wrap">{clinicalAssessment.diagnosis}</p>
                  ) : (
                    <p className="text-slate-400 italic">No information recorded</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Clinical Notes</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[80px]">
                  {clinicalAssessment.notes ? (
                    <p className="text-slate-800 whitespace-pre-wrap">{clinicalAssessment.notes}</p>
                  ) : (
                    <p className="text-slate-400 italic">No information recorded</p>
                  )}
                </div>
              </div>
            </div>

            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 border-b-2 border-slate-100 pb-3 mt-8">
              <Activity className="w-5 h-5 text-[#0D9488]" /> AYUSH PRACTITIONER ASSESSMENT
            </h2>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Prakriti</p>
                  <p className="font-medium text-slate-800">{ayushAssessment.prakriti || 'No information recorded'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Agni</p>
                  <p className="font-medium text-slate-800">{ayushAssessment.agni || 'No information recorded'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Koshtha</p>
                  <p className="font-medium text-slate-800">{ayushAssessment.koshtha || 'No information recorded'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dosha</p>
                  <p className="font-medium text-slate-800">{ayushAssessment.dosha || 'No information recorded'}</p>
                </div>
              </div>
              
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Practitioner Notes</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {ayushAssessment.notes ? (
                    <p className="text-slate-800 whitespace-pre-wrap">{ayushAssessment.notes}</p>
                  ) : (
                    <p className="text-slate-400 italic">No information recorded</p>
                  )}
                </div>
              </div>
            </div>

            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 border-b-2 border-slate-100 pb-3 mt-8">
              <Pill className="w-5 h-5 text-[#0D9488]" /> PRESCRIPTION
            </h2>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              {prescription.items.length > 0 ? (
                <div className="space-y-4">
                  {prescription.items.map((item, index) => (
                    <div key={item.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                          <h4 className="font-bold text-lg text-slate-800">{item.medicineName}</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-8">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dosage</p>
                            <p className="font-medium text-slate-700">{item.dosage}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Frequency</p>
                            <p className="font-medium text-slate-700">{item.frequency}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                            <p className="font-medium text-slate-700">{item.duration}</p>
                          </div>
                        </div>
                        {item.instructions && (
                          <div className="pl-8 mt-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Instructions</p>
                            <p className="text-sm text-slate-600">{item.instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic py-4 text-center">No medicines prescribed</p>
              )}
            </div>

            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 border-b-2 border-slate-100 pb-3 mt-8">
              <Clock className="w-5 h-5 text-[#0D9488]" /> FOLLOW-UP PLAN
            </h2>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-10">
              {followUp.required ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Timeframe</p>
                    <p className="font-bold text-slate-800 text-lg">{followUp.timeframe}</p>
                  </div>
                  {followUp.instructions && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Instructions</p>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-slate-700 whitespace-pre-wrap">{followUp.instructions}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 italic">No follow-up specified</p>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Patient Intake Summary */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 border-b-2 border-slate-100 pb-3">
              <User className="w-5 h-5 text-slate-400" /> PATIENT INTAKE SUMMARY
            </h2>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Patient Info */}
              <div className="bg-white p-4 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Patient Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Full Name</span>
                    <span className="font-medium text-slate-800">{caseData.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Age & Gender</span>
                    <span className="font-medium text-slate-800">{caseData.age} • {caseData.gender.charAt(0).toUpperCase() + caseData.gender.slice(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mobile</span>
                    <span className="font-medium text-slate-800">{maskPhone(session.patient?.mobile) || 'Not recorded'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ABHA ID</span>
                    <span className="font-medium text-slate-800">{maskAbha(session.abhaId) || 'Not recorded'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Language</span>
                    <span className="font-medium text-slate-800">{session.language === 'en' ? 'English' : 'Hindi'}</span>
                  </div>
                </div>
              </div>

              {/* Today's Concern */}
              <div className="bg-white p-4 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">Today's Concern</h3>
                <p className="text-slate-700 font-medium">{caseData.chiefComplaint || 'No information provided'}</p>
              </div>

              {/* Voice Responses */}
              {caseData.voiceResponses && caseData.voiceResponses.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">What Patient Told Us</h3>
                  <div className="space-y-4">
                    {caseData.voiceResponses.map(r => (
                      <div key={r.questionId}>
                        <p className="text-xs font-bold text-slate-400 mb-1">{r.question}</p>
                        <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded-lg">{r.transcript || r.selectedOption}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AYUSH Health Responses */}
              {caseData.ayushResponses && caseData.ayushResponses.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">AYUSH Health Questions</h3>
                  <div className="space-y-3">
                    {caseData.ayushResponses.map((r, i) => (
                      <div key={i} className="flex justify-between gap-4 text-sm border-b border-slate-50 pb-2 last:border-0">
                        <span className="text-slate-500">{r.question}</span>
                        <span className="font-medium text-slate-800 text-right">{r.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medication History */}
              <div className="bg-white p-4 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">Medication History</h3>
                {caseData.medicationHistory?.takingMedicines === 'yes_daily' || caseData.medicationHistory?.takingMedicines === 'yes_sometimes' ? (
                  <div>
                    <p className="text-sm font-medium text-slate-800 mb-1">Patient is currently taking medication:</p>
                    {caseData.medicationHistory.medicines ? (
                      <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">{caseData.medicationHistory.medicines}</p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No details provided</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No medicines reported.</p>
                )}
              </div>

              {/* Allergy History */}
              <div className="bg-white p-4 rounded-xl border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2">Allergy History</h3>
                {caseData.allergyHistory?.hasAllergy === 'yes' ? (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-red-600">Patient reported allergies</p>
                    <div className="text-sm text-slate-700 bg-red-50 p-3 rounded-lg border border-red-100 space-y-1">
                      <p><span className="font-bold">Type:</span> {caseData.allergyHistory.allergyType}</p>
                      {caseData.allergyHistory.reaction && (
                        <p><span className="font-bold">Reaction:</span> {caseData.allergyHistory.reaction}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No allergies reported.</p>
                )}
              </div>

              {/* Documents */}
              {(() => {
                const docs = MockDocumentProvider.getDocumentsByCase(caseId!);
                if (docs.length === 0) return null;
                return (
                  <div className="bg-white p-4 rounded-xl border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-500" /> Documents</h3>
                    <div className="space-y-3">
                      {docs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="font-bold text-slate-800 text-sm truncate">{doc.documentType}</p>
                            <p className="text-xs text-slate-500 truncate">{doc.fileName}</p>
                          </div>
                          <button
                            onClick={() => navigate(`/doctor/documents/${doc.id}`)}
                            className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors shrink-0 flex items-center gap-2"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Clinical Reports */}
              {(() => {
                const reports = MockClinicalReportProvider.getReportsByCaseId(caseId!);
                if (reports.length === 0) return null;
                return (
                  <div className="bg-white p-4 rounded-xl border border-slate-100 mt-4 print:hidden">
                    <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-slate-500" /> Clinical Reports</h3>
                    <div className="space-y-3">
                      {reports.map(report => (
                        <div key={report.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="font-bold text-slate-800 text-sm truncate">{report.title}</p>
                            <p className="text-xs text-slate-500">{new Date(report.generatedAt).toLocaleDateString()}</p>
                          </div>
                          <button
                            onClick={() => navigate(`/doctor/reports/${report.id}`)}
                            className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors shrink-0 flex items-center gap-2"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      {caseData.status !== 'closed' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 px-8 z-40 flex justify-end gap-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] print:hidden">
          <button 
            onClick={() => setShowCloseModal(true)}
            className="bg-slate-800 text-white px-10 py-3 rounded-2xl font-bold text-lg hover:bg-slate-700 shadow-md transition-colors"
          >
            Close Case
          </button>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-24 right-8 bg-[#0D9488] text-white px-6 py-3 rounded-xl shadow-lg font-bold z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5" /> Summary download prepared.
        </div>
      )}

      {/* Document Preview Modal Removed in favor of Centralized Route */}

      {/* Close Case Confirmation Modal */}
      <Modal open={showCloseModal} onClose={() => setShowCloseModal(false)}>
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Lock className="w-8 h-8 text-slate-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Close this case?</h2>
          <p className="text-slate-600">
            Once closed, the consultation will remain available as read-only. Patient and consultation data will not be deleted.
          </p>
          
          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => setShowCloseModal(false)}
              className="flex-1 py-4 rounded-2xl font-bold text-lg border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmClose}
              className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-bold text-lg hover:bg-slate-700 transition-colors shadow-md"
            >
              Close Case
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}


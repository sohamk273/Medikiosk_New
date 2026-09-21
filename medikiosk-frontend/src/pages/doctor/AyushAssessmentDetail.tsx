import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Activity, User, ShieldAlert, FileText, 
  Save, CheckCircle2, AlertCircle
} from 'lucide-react';
import { MockAyushAssessmentProvider } from '@/services/doctor/MockAyushAssessmentProvider';
import type { AyushAssessmentRecord } from '@/services/doctor/MockAyushAssessmentProvider';
import type { PatientDocument, AyushDoctorAssessment } from '@/features/patient/PatientSessionContext';
import { Modal } from '@/components/ui/Modal';

// Shared drop-down values matching slice 10
const PRAKRITI_OPTIONS = [
  'Vata', 'Pitta', 'Kapha', 
  'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha', 
  'Tridoshaja'
];
const AGNI_OPTIONS = ['Sama', 'Vishama', 'Tikshna', 'Manda'];
const KOSHTHA_OPTIONS = ['Krura', 'Mridu', 'Madhya'];
const DOSHA_OPTIONS = ['Vata', 'Pitta', 'Kapha'];

export default function AyushAssessmentDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<AyushAssessmentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [assessment, setAssessment] = useState<AyushDoctorAssessment>({
    prakriti: '', agni: '', koshtha: '', dosha: '', notes: ''
  });

  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<PatientDocument | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (caseId) {
      const data = MockAyushAssessmentProvider.getAssessmentByCaseId(caseId);
      if (data) {
        setRecord(data);
        if (data.practitionerAyushAssessment) {
          setAssessment(data.practitionerAyushAssessment);
        }
      }
    }
    setLoading(false);
  }, [caseId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveDraft = () => {
    if (!caseId) return;
    MockAyushAssessmentProvider.saveAssessmentDraft(caseId, assessment);
    const updated = MockAyushAssessmentProvider.getAssessmentByCaseId(caseId);
    if (updated) setRecord(updated);
    showToast('AYUSH assessment draft saved.');
  };

  const handleFinalize = () => {
    setShowConfirmModal(false);
    if (!caseId) return;
    MockAyushAssessmentProvider.finalizeAssessment(caseId, assessment);
    const updated = MockAyushAssessmentProvider.getAssessmentByCaseId(caseId);
    if (updated) setRecord(updated);
    showToast('AYUSH assessment finalized.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-[#0D9488] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Assessment not found</h2>
        <p className="text-slate-500 mb-6">The specified case could not be found or does not exist.</p>
        <button 
          onClick={() => navigate('/doctor/ayush')}
          className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-700 transition-colors"
        >
          Back to AYUSH Assessments
        </button>
      </div>
    );
  }

  const isCompleted = record.ayushStatus === 'completed';

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border border-amber-200">PENDING</span>;
      case 'in-progress': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border border-blue-200">IN PROGRESS</span>;
      case 'draft': return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border border-purple-200">DRAFT</span>;
      case 'completed': return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border border-emerald-200">COMPLETED</span>;
      default: return null;
    }
  };

  const getCaseStatusDisplay = (status: string) => {
    switch (status) {
      case 'waiting': return <span className="text-amber-600 font-bold">WAITING</span>;
      case 'in-consultation': return <span className="text-blue-600 font-bold">IN CONSULTATION</span>;
      case 'completed': return <span className="text-emerald-600 font-bold">COMPLETED</span>;
      case 'closed': return <span className="text-slate-400 font-bold">CLOSED</span>;
      default: return <span className="text-slate-500 font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 relative">
      
      {/* TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* 1. STICKY HEADER */}
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur border-b border-slate-200 py-4 mb-6 -mx-6 px-6 shadow-sm">
        <div className="flex items-center gap-4 mb-3">
          <button 
            onClick={() => navigate('/doctor/ayush')}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0D9488] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </button>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">{record.patientName}</h1>
                <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">{record.patientId}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
                <span>{record.age} years • {record.gender.charAt(0).toUpperCase() + record.gender.slice(1)}</span>
                <span className="text-slate-300">•</span>
                <span>Mobile: {record.maskedMobile}</span>
                <span className="text-slate-300">•</span>
                <span>ABHA: {record.maskedAbhaId}</span>
                <span className="text-slate-300">•</span>
                <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">{record.caseId}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1">
              <div className="text-xs">
                <span className="text-slate-500 font-medium uppercase tracking-wider mr-2">Case Status:</span>
                {getCaseStatusDisplay(record.caseStatus)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">AYUSH Status:</span>
                {getStatusDisplay(record.ayushStatus)}
              </div>
            </div>
            
            {!isCompleted ? (
              <div className="flex items-center gap-2 ml-4 border-l border-slate-200 pl-4">
                <button
                  onClick={handleSaveDraft}
                  className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" /> Save Draft
                </button>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="flex items-center gap-2 bg-[#0D9488] text-white px-5 py-2 rounded-xl font-bold hover:bg-[#0B8070] transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Finalize
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4 border-l border-slate-200 pl-4">
                <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl font-bold border border-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Finalized (Read-Only)
                </div>
                <button
                  onClick={() => navigate(`/doctor/case/${record.caseId}`)}
                  className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  View Case
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. SAFETY BANNER */}
      {record.redFlagTriggered && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm animate-pulse-soft mx-0">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-black text-red-800 text-lg uppercase tracking-tight">Attention Required</h3>
            <p className="text-red-700 font-medium text-sm">Safety alert was triggered during patient intake. Review the patient's intake information before proceeding.</p>
          </div>
        </div>
      )}

      {/* 3. TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: PATIENT CONTEXT (READ-ONLY) */}
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-inner">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <User className="w-4 h-4" /> Patient Context (Read-Only)
            </h2>

            {/* CHIEF COMPLAINT */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-4">
              <h3 className="font-bold text-slate-800 mb-1">Today's Concern</h3>
              <p className="text-slate-700">{record.chiefComplaint}</p>
            </div>

            {/* PATIENT AYUSH RESPONSES */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-4">
              <h3 className="font-bold text-[#0D9488] mb-3 border-b border-slate-50 pb-2">Patient-Reported AYUSH Intake</h3>
              {record.patientAyushResponses.length > 0 ? (
                <div className="space-y-3">
                  {record.patientAyushResponses.map((res, i) => (
                    <div key={i} className="bg-slate-50 p-3 rounded-lg text-sm border border-slate-100">
                      <p className="font-bold text-slate-700 mb-1">{res.question}</p>
                      <p className="text-slate-600 italic">" {res.answer} "</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No AYUSH responses collected.</p>
              )}
            </div>

            {/* DOCUMENTS */}
            {/* Note: MockAyushAssessmentProvider doesn't pull all documents, but in a real integrated provider we could. 
                For the mock, we might fetch it from DoctorCase. Let's just fetch from MockDoctorCaseProvider directly. */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
               <h3 className="font-bold text-slate-800 mb-3 border-b border-slate-50 pb-2">Documents</h3>
               {(() => {
                 const docs = record.documents || [];
                 if (docs.length === 0) return <p className="text-sm text-slate-400 italic">No documents attached.</p>;
                 return (
                   <div className="space-y-2">
                     {docs.map((doc: PatientDocument) => (
                       <div key={doc.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                         <span className="text-sm font-bold text-slate-700">{doc.type}</span>
                         <button 
                           onClick={() => { setSelectedDoc(doc); setShowDocModal(true); }}
                           className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-md font-bold text-slate-600 hover:bg-slate-100 shadow-sm"
                         >
                           View
                         </button>
                       </div>
                     ))}
                   </div>
                 );
               })()}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PRACTITIONER FORM */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#0D9488]/5 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#0D9488]" />
              <h2 className="text-lg font-black text-[#0D9488]">Practitioner AYUSH Assessment</h2>
            </div>
            
            <div className="p-6 space-y-6 flex-1 bg-white">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Prakriti (प्रकृति)</label>
                  <select 
                    disabled={isCompleted}
                    value={assessment.prakriti}
                    onChange={(e) => setAssessment({ ...assessment, prakriti: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 disabled:opacity-60 disabled:bg-slate-100"
                  >
                    <option value="">Select Prakriti...</option>
                    {PRAKRITI_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Agni (अग्नि)</label>
                  <select 
                    disabled={isCompleted}
                    value={assessment.agni}
                    onChange={(e) => setAssessment({ ...assessment, agni: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 disabled:opacity-60 disabled:bg-slate-100"
                  >
                    <option value="">Select Agni...</option>
                    {AGNI_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Koshtha (कोष्ठ)</label>
                  <select 
                    disabled={isCompleted}
                    value={assessment.koshtha}
                    onChange={(e) => setAssessment({ ...assessment, koshtha: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 disabled:opacity-60 disabled:bg-slate-100"
                  >
                    <option value="">Select Koshtha...</option>
                    {KOSHTHA_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Dominant Dosha</label>
                  <select 
                    disabled={isCompleted}
                    value={assessment.dosha}
                    onChange={(e) => setAssessment({ ...assessment, dosha: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 disabled:opacity-60 disabled:bg-slate-100"
                  >
                    <option value="">Select Dosha...</option>
                    {DOSHA_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Clinical Notes & Observations</label>
                <textarea 
                  disabled={isCompleted}
                  value={assessment.notes}
                  onChange={(e) => setAssessment({ ...assessment, notes: e.target.value })}
                  placeholder="Enter detailed AYUSH clinical notes here..."
                  className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 min-h-[200px] resize-y focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 disabled:opacity-60 disabled:bg-slate-100"
                />
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* CONFIRMATION MODAL */}
      <Modal open={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Finalize AYUSH Assessment?">
        <div className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <AlertCircle className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Are you sure?</h3>
          <p className="text-slate-600 mb-6">
            After finalization, this AYUSH assessment will become <span className="font-bold text-slate-800">read-only</span>. 
            The primary consultation status will remain unchanged ({record.caseStatus}).
          </p>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => setShowConfirmModal(false)}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleFinalize}
              className="px-6 py-2.5 bg-[#0D9488] text-white rounded-xl font-bold hover:bg-[#0B8070] transition-colors"
            >
              Finalize Assessment
            </button>
          </div>
        </div>
      </Modal>

      {/* DOCUMENT MODAL */}
      <Modal open={showDocModal} onClose={() => setShowDocModal(false)} title="Document Preview">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{selectedDoc?.type || 'Document'}</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">Scanned on {selectedDoc && new Date(selectedDoc.timestamp).toLocaleString()}</p>
          <div className="bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-md border border-amber-200 uppercase tracking-widest">
            Demo Preview - Synthetic Data
          </div>
          <div className="mt-8 w-full max-w-sm space-y-2">
            <div className="h-2 bg-slate-200 rounded w-full"></div>
            <div className="h-2 bg-slate-200 rounded w-5/6"></div>
            <div className="h-2 bg-slate-200 rounded w-4/6"></div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button 
            onClick={() => setShowDocModal(false)}
            className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </Modal>

    </div>
  );
}

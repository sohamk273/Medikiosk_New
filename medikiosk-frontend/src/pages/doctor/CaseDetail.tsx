import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Phone, CheckCircle2, AlertCircle, 
  FileText, Activity, Clock, PlayCircle, Pill, FileIcon, ClipboardList, Eye, FilePlus2
} from 'lucide-react';
import { MockDoctorCaseProvider } from '@/services/doctor/MockDoctorCaseProvider';
import { MockAyushAssessmentProvider } from '@/services/doctor/MockAyushAssessmentProvider';
import { MockDocumentProvider } from '@/services/doctor/MockDocumentProvider';
import { MockClinicalReportProvider } from '@/services/doctor/MockClinicalReportProvider';
import type { DoctorCase } from '@/services/doctor/MockDoctorCaseProvider';
import { apiFetchSafe } from '@/services/api/client';

export default function CaseDetail() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  
  const [caseData, setCaseData] = useState<DoctorCase | null>(() => {
    return caseId ? (MockDoctorCaseProvider.getCaseById(caseId) || null) : null;
  });
  const [queueEntryId, setQueueEntryId] = useState<string | null>(null);
  const [tokenNumber, setTokenNumber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!caseId) return;

    const fetchCase = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetchSafe<any>(`/encounters/${caseId}`);
        if (res.ok && res.data) {
          const { encounter, patient } = res.data;
          let uiStatus: 'waiting' | 'in-consultation' | 'completed' = 'waiting';
          const encStatus = (encounter.status || '').toLowerCase();
          const qStatus = (res.data.queue_status || '').toUpperCase();

          if (encStatus === 'in_consultation' || qStatus === 'CALLED' || qStatus === 'IN_CONSULTATION') {
            uiStatus = 'in-consultation';
          } else if (encStatus === 'completed') {
            uiStatus = 'completed';
          }

          setCaseData({
            caseId: encounter.encounter_number || encounter.id,
            patientName: patient.full_name,
            age: patient.age ?? '—',
            gender: patient.gender,
            mobile: patient.mobile,
            chiefComplaint: encounter.chief_complaint,
            voiceResponses: [],
            ayushResponses: [],
            documents: [],
            redFlagTriggered: encounter.red_flag_triggered || encounter.priority === 'EMERGENCY',
            submittedAt: encounter.registered_at,
            status: uiStatus,
          });

          setQueueEntryId(res.data.queue_entry_id || encounter.id);
          if (res.data.token_number) setTokenNumber(res.data.token_number);
          return;
        }
      } catch (err) {
        console.error('Failed to fetch encounter from backend:', err);
      } finally {
        setIsLoading(false);
      }

      // Fallback to mock data for pre-existing mock cases
      const mockData = MockDoctorCaseProvider.getCaseById(caseId);
      if (mockData) {
        setCaseData(mockData);
      }
    };

    fetchCase();
  }, [caseId]);

  if (isLoading && !caseData) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
          <p className="text-lg text-slate-500">Loading patient encounter...</p>
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
          <p className="text-lg text-slate-500 mb-8">The requested patient case could not be found.</p>
          <button 
            onClick={() => navigate('/doctor/queue')}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Back to OPD Queue
          </button>
        </div>
      </div>
    );
  }

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

  const handleStartConsultation = async () => {
    const targetId = queueEntryId || caseId;
    if (targetId) {
      try {
        await apiFetchSafe(`/queue/${targetId}/call`, {
          method: 'POST',
        });
      } catch (err) {
        console.error('Failed to trigger backend queue call transition:', err);
      }
    }
    navigate(`/doctor/consultation/${caseId}`);
  };

  const handleResumeConsultation = () => {
    navigate(`/doctor/consultation/${caseId}`);
  };

  const handleViewSummary = () => {
    navigate(`/doctor/case/${caseId}/summary`);
  };

  const getStatusBadge = () => {
    switch (caseData.status) {
      case 'waiting': return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">WAITING</span>;
      case 'in-consultation': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">IN CONSULTATION</span>;
      case 'completed': return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">COMPLETED</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-32">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#F8FAFC] pt-2 pb-4 border-b border-slate-200 shadow-sm -mx-6 px-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => navigate('/doctor/queue')}
            className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Queue
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-800">{caseData.patientName}</h1>
                {tokenNumber && (
                  <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">Token #{tokenNumber}</span>
                )}
                <span className="font-mono text-sm font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-md">{caseData.caseId}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-500 font-medium text-sm mt-1">
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
          <div>
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Safety Alert */}
      {caseData.redFlagTriggered && caseData.status !== 'completed' && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex gap-4 items-start shadow-sm">
          <div className="bg-red-100 text-red-600 rounded-full p-2 shrink-0">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-red-800 font-black text-xl mb-1">ATTENTION REQUIRED</h3>
            <p className="text-red-700 font-medium">Safety alert was triggered during patient intake.</p>
            <p className="text-red-700 font-medium">Please assess the patient before proceeding.</p>
          </div>
        </div>
      )}

      {/* Consultation Summary (If finalized) */}
      {(caseData.status === 'completed' || caseData.status === 'closed') && caseData.consultation?.status === 'finalized' && (
        <div className="bg-white border-2 border-[#0D9488] rounded-3xl p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-[#0D9488]" /> Consultation Completed
            </h2>
            <div className="text-sm font-bold text-slate-400">
              Finalized: {new Date(caseData.consultation.finalizedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Diagnosis</p>
                <p className="font-bold text-slate-800 text-lg">{caseData.consultation.clinicalAssessment.diagnosis}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Assessment</p>
                <p className="font-medium text-slate-700">{caseData.consultation.clinicalAssessment.assessment}</p>
              </div>
              {caseData.consultation.ayushAssessment.prakriti && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">AYUSH Prakriti</p>
                  <p className="font-medium text-slate-700">{caseData.consultation.ayushAssessment.prakriti}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Pill className="w-3 h-3" /> Prescription</p>
                {caseData.consultation.prescription.items.length > 0 ? (
                  <ul className="space-y-2 mt-2">
                    {caseData.consultation.prescription.items.map(item => (
                      <li key={item.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="font-bold text-slate-800 text-sm">{item.medicineName}</p>
                        <p className="text-xs text-slate-500">{item.dosage} • {item.frequency} • {item.duration}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 italic text-sm mt-2">No medicines prescribed.</p>
                )}
              </div>
              {caseData.consultation.followUp.required && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Follow-up</p>
                  <p className="font-medium text-slate-700">{caseData.consultation.followUp.timeframe}</p>
                  {caseData.consultation.followUp.instructions && (
                    <p className="text-sm text-slate-500 mt-1">{caseData.consultation.followUp.instructions}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Left Column (Main Content) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Today's Concern */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4" /> Today's Concern
            </h2>
            <p className="text-xl font-bold text-slate-800">
              {caseData.chiefComplaint || 'No information provided'}
            </p>
          </div>

          {/* Voice Case Taking */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-8 py-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <PlayCircle className="w-4 h-4" /> What the Patient Told Us
              </h2>
            </div>
            <div className="p-8 space-y-6">
              {caseData.voiceResponses && caseData.voiceResponses.length > 0 ? (
                caseData.voiceResponses.map((vr, idx) => (
                  <div key={idx} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                    <p className="font-bold text-slate-700 mb-1">{vr.question}</p>
                    {vr.questionHindi && <p className="text-sm text-slate-500 mb-3">{vr.questionHindi}</p>}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Patient said:</p>
                      <p className="font-bold text-primary text-lg">"{vr.transcript || vr.selectedOption}"</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 italic">No voice responses recorded.</p>
              )}
            </div>
          </div>

          {/* AYUSH Assessment */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-8 py-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> AYUSH Health Assessment
              </h2>
            </div>
            <div className="p-8">
              {caseData.ayushResponses && caseData.ayushResponses.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                  {caseData.ayushResponses.map((ar, idx) => (
                    <div key={idx}>
                      <p className="font-bold text-slate-500 mb-1">{ar.question}</p>
                      <p className="font-bold text-slate-800 text-lg">{ar.answer}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">No AYUSH responses recorded.</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          
          {/* Clinical History */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Pill className="w-4 h-4" /> Clinical History
              </h2>
            </div>
            
            {/* Medications */}
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 mb-3">Current Medicines</h3>
              {caseData.medicationHistory ? (
                <>
                  <p className="text-slate-600 font-medium mb-2">
                    {(caseData.medicationHistory.takingMedicines === 'yes_daily' || caseData.medicationHistory.takingMedicines === 'yes_sometimes') ? 'Taking medicines' : 
                     caseData.medicationHistory.takingMedicines === 'no' ? 'Not taking medicines' : 'Not sure'}
                  </p>
                  {caseData.medicationHistory.medicines && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Medicines reported:</p>
                      <p className="font-medium text-slate-700">{caseData.medicationHistory.medicines}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-500 italic">No medicines reported.</p>
              )}
            </div>

            {/* Allergies */}
            <div className="p-6">
              <h3 className="font-bold text-slate-800 mb-3">Allergies</h3>
              {caseData.allergyHistory ? (
                <>
                  <p className="text-slate-600 font-medium mb-2">
                    {caseData.allergyHistory.hasAllergy === 'yes' ? 'Has allergies' : 
                     caseData.allergyHistory.hasAllergy === 'no' ? 'No allergies reported' : 'Not sure'}
                  </p>
                  {caseData.allergyHistory.hasAllergy === 'yes' && (
                    <div className="space-y-3 mt-3">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Allergy type:</p>
                        <p className="font-medium text-slate-700">{caseData.allergyHistory.allergyType || 'Not answered'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reaction:</p>
                        <p className="font-medium text-slate-700">
                          {caseData.allergyHistory.reaction?.replace(/_/g, ' ') || 'Not answered'}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-500 italic">No allergies reported.</p>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4" /> Documents
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const docs = MockDocumentProvider.getDocumentsByCase(caseId!);
                if (docs.length === 0) return <p className="text-slate-500 italic">No documents attached.</p>;
                return docs.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-slate-200">
                        <FileIcon className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-700 truncate">{doc.documentType}</p>
                        <p className="text-xs text-slate-500 truncate">{doc.fileName || doc.id}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/doctor/documents/${doc.id}`)}
                      className="text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors whitespace-nowrap ml-2 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Clinical Reports */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Clinical Reports
              </h2>
              <button 
                onClick={() => navigate('/doctor/reports')}
                className="text-teal-600 hover:text-teal-700 text-sm font-bold flex items-center gap-1"
              >
                <FilePlus2 className="w-4 h-4" /> Generate Report
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const reports = MockClinicalReportProvider.getReportsByCaseId(caseId!);
                if (reports.length === 0) return <p className="text-slate-500 italic">No reports available.</p>;
                return reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-slate-200 text-teal-600">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-700 truncate">{report.title}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {report.status.toUpperCase()} • {new Date(report.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/doctor/reports/${report.id}`)}
                      className="text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors whitespace-nowrap ml-2 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4" /> Case Timeline
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="text-xs font-bold text-slate-400 w-16 pt-1">
                    {new Date(caseData.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="border-l-2 border-slate-200 pl-4 relative">
                    <div className="absolute w-2 h-2 bg-slate-300 rounded-full -left-[5px] top-1.5"></div>
                    <p className="font-medium text-slate-700">Case submitted to OPD</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 px-8 z-40 flex justify-end gap-4 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        {caseData.status === 'waiting' && (
          <button 
            onClick={handleStartConsultation}
            className="bg-[#0D9488] text-white px-10 py-3 rounded-2xl font-bold text-lg hover:bg-[#0B8070] shadow-md transition-colors flex items-center gap-2"
          >
            Start Consultation
          </button>
        )}
        
        {caseData.status === 'in-consultation' && (
          <button 
            onClick={handleResumeConsultation}
            className="bg-slate-800 text-white px-10 py-3 rounded-2xl font-bold text-lg hover:bg-slate-700 shadow-md transition-colors flex items-center gap-2"
          >
            Resume Consultation
          </button>
        )}

        {(caseData.status === 'completed' || caseData.status === 'closed') && (
          <button 
            onClick={handleViewSummary}
            className="bg-[#0D9488] text-white px-10 py-3 rounded-2xl font-bold text-lg hover:bg-[#0B8070] shadow-md transition-colors flex items-center gap-2"
          >
            View Final Summary
          </button>
        )}

        {(() => {
          const ayushData = MockAyushAssessmentProvider.getAssessmentByCaseId(caseId!);
          if (!ayushData) return null;
          
          return (
            <button 
              onClick={() => navigate(`/doctor/ayush/${caseId}`)}
              className="bg-white border-2 border-[#0D9488] text-[#0D9488] px-8 py-3 rounded-2xl font-bold text-lg hover:bg-[#0D9488]/5 shadow-sm transition-colors flex items-center gap-2"
            >
              <Activity className="w-5 h-5" />
              {ayushData.ayushStatus === 'pending' ? 'Start AYUSH' : 
               (ayushData.ayushStatus === 'in-progress' || ayushData.ayushStatus === 'draft') ? 'Resume AYUSH' : 
               'View AYUSH'}
            </button>
          );
        })()}
      </div>

      {/* Document Preview Modal Removed */}

    </div>
  );
}

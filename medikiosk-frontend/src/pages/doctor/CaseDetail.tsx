import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, AlertCircle, 
  Activity, PlayCircle, 
  ChevronDown, ChevronUp, ShieldAlert, AlertTriangle, FileText, FlaskConical, Clock, User
} from 'lucide-react';
import { MockDoctorCaseProvider } from '@/services/doctor/MockDoctorCaseProvider';
import type { DoctorCase } from '@/services/doctor/MockDoctorCaseProvider';
import type { PatientDocument } from '@/features/patient/PatientSessionContext';
import { apiFetchSafe } from '@/services/api/client';
import type { ClinicalEncounterRead } from '@/services/clinical/clinicalService';
import { DemoDoctorProvider } from '@/demo/services/demoDoctorProvider';
import type { DemoDoctorPatient } from '@/demo/data/demoDoctorDataset';

export default function CaseDetail() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  
  const [caseData, setCaseData] = useState<DoctorCase | null>(() => {
    return caseId ? (MockDoctorCaseProvider.getCaseById(caseId) || null) : null;
  });
  const [demoPatient, setDemoPatient] = useState<DemoDoctorPatient | null>(() => {
    return caseId ? (DemoDoctorProvider.getPatientByCaseId(caseId) || null) : null;
  });
  const [clinicalEncounter, setClinicalEncounter] = useState<ClinicalEncounterRead | null>(null);
  const [showConversation, setShowConversation] = useState(false);
  const [queueEntryId, setQueueEntryId] = useState<string | null>(null);
  const [tokenNumber, setTokenNumber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isUuid = (str?: string): boolean => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  useEffect(() => {
    if (!caseId) return;

    const dp = DemoDoctorProvider.getPatientByCaseId(caseId);
    if (dp) {
      setDemoPatient(dp);
      setTokenNumber(dp.tokenNumber);
    }

    const mockData = MockDoctorCaseProvider.getCaseById(caseId) || (dp ? DemoDoctorProvider.getAllDoctorCases()[dp.caseId] : null);
    if (mockData) {
      setCaseData(mockData);
    }

    if (!isUuid(caseId)) {
      setIsLoading(false);
      return;
    }

    const fetchCase = async () => {
      setIsLoading(true);
      try {
        // Fetch core encounter
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

          // Fetch real documents for this encounter
          let realDocs: PatientDocument[] = [];
          if (encounter.id && isUuid(encounter.id)) {
            const docsRes = await apiFetchSafe<any[]>(`/encounters/${encounter.id}/documents`);
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
          }

          const mappedCase: DoctorCase = {
            caseId: encounter.encounter_number || encounter.id,
            patientName: patient?.full_name || 'Patient',
            age: patient?.age || 0,
            gender: (patient?.gender?.toLowerCase() || 'male') as any,
            status: uiStatus,
            chiefComplaint: encounter.chief_complaint || 'General medical consultation',
            redFlagTriggered: encounter.red_flag_triggered || false,
            submittedAt: encounter.registered_at || new Date().toISOString(),
            voiceResponses: [],
            ayushResponses: [],
            documents: realDocs,
            mobile: patient?.mobile || '',
            abhaId: patient?.patient_uhid || '',
          };

          setCaseData(mappedCase);
          setQueueEntryId(res.data.queue_entry_id || null);
          setTokenNumber(res.data.token_number || null);
        }

        // Fetch Stage 6 persistent clinical intake case
        const clinRes = await apiFetchSafe<ClinicalEncounterRead>(`/clinical/encounters/${caseId}`);
        if (clinRes.ok && clinRes.data) {
          setClinicalEncounter(clinRes.data);
        }
      } catch (err) {
        console.error('Failed to load encounter or clinical case:', err);
      } finally {
        setIsLoading(false);
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

  const isEmergency =
    caseData.redFlagTriggered ||
    clinicalEncounter?.is_emergency ||
    (clinicalEncounter?.red_flags && clinicalEncounter.red_flags.length > 0) ||
    (demoPatient?.redFlagTriggered) ||
    false;

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

  const getStatusBadge = () => {
    switch (caseData.status) {
      case 'waiting': return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">WAITING</span>;
      case 'in-consultation': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">IN CONSULTATION</span>;
      case 'completed': return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">COMPLETED</span>;
      case 'closed': return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider">CLOSED</span>;
    }
  };

  const caseState = clinicalEncounter?.case_state;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-32">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#F8FAFC] pt-2 pb-4 border-b border-slate-200 shadow-sm -mx-6 px-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => navigate('/doctor/queue')}
            className="flex items-center gap-2 text-slate-500 hover:text-primary font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Queue
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl">
              {caseData.patientName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-800">{caseData.patientName}</h1>
                {tokenNumber && (
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">Token #{tokenNumber}</span>
                )}
                <span className="font-mono text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{caseData.caseId}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 font-medium text-xs mt-1 flex-wrap">
                <span>{caseData.age} years • {caseData.gender.charAt(0).toUpperCase() + caseData.gender.slice(1)}</span>
                {caseData.mobile && <span>Mobile: {caseData.mobile}</span>}
                {caseData.abhaId && <span>UHID: {caseData.abhaId}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => navigate(`/doctor/30s-view?patientId=${caseId}`)}
              className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5 text-teal-700" />
              <span>30s Clinical View</span>
            </button>
            {getStatusBadge()}
            {caseData.status !== 'completed' && (
              <button
                type="button"
                onClick={handleStartConsultation}
                className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Start Consultation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Emergency / Red Flag Banner */}
      {isEmergency && (
        <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-6 shadow-md flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-red-700 bg-red-200 px-2.5 py-0.5 rounded-full">
                PRIORITY CLINICAL ALERT
              </span>
              <span className="text-xs font-bold text-red-600">Immediate Assessment Recommended</span>
            </div>
            <h2 className="text-lg font-bold text-red-900">
              Red Flag Detected During Clinical Intake
            </h2>
            {clinicalEncounter?.red_flags && clinicalEncounter.red_flags.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-red-800">
                {clinicalEncounter.red_flags.map((rf, idx) => (
                  <li key={idx} className="font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    <span>[{rf.type}] {rf.source_text}</span>
                    <span className="text-xs text-red-600">({rf.severity})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Stage 6: Structured Clinical Case Handoff Summary */}
      <div className="bg-white border-2 border-teal-600 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-teal-50 px-8 py-5 border-b border-teal-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-teal-950 uppercase tracking-wider">
                Clinical Intake & Handoff Summary
              </h2>
              <p className="text-xs text-teal-700">
                Language: {clinicalEncounter?.patient_language?.toUpperCase() || 'EN'} • Status: {clinicalEncounter?.completion_status || 'COMPLETED'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-teal-800 bg-teal-100 border border-teal-300 px-3 py-1 rounded-full uppercase">
            Doctor Handoff Record
          </span>
        </div>

        <div className="p-8 space-y-6">
          {/* Chief Complaint */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Chief Complaint</span>
            <p className="text-xl font-black text-slate-800 mt-0.5">
              {clinicalEncounter?.chief_complaint || caseData.chiefComplaint || 'Not reported'}
            </p>
          </div>

          {/* History of Presenting Complaint */}
          <div className="border-t border-slate-100 pt-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 block">
              History of Presenting Complaint (HPI)
            </span>
            {caseState?.symptoms && caseState.symptoms.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {caseState.symptoms.map((s, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <p className="font-bold text-slate-800 text-base capitalize">{s.name}</p>
                    <div className="text-xs text-slate-600 mt-2 space-y-1">
                      <p><span className="text-slate-400 font-medium">Location:</span> <span className="font-semibold text-slate-700">{s.location || 'Not reported'}</span></p>
                      <p><span className="text-slate-400 font-medium">Duration:</span> <span className="font-semibold text-slate-700">{s.duration || 'Not reported'}</span></p>
                      <p><span className="text-slate-400 font-medium">Severity:</span> <span className="font-semibold text-slate-700">{s.severity || 'Not reported'}</span></p>
                      <p><span className="text-slate-400 font-medium">Character:</span> <span className="font-semibold text-slate-700">{s.character || 'Not reported'}</span></p>
                      {s.aggravating_factors && s.aggravating_factors.length > 0 && (
                        <p><span className="text-slate-400 font-medium">Aggravating:</span> <span className="font-semibold text-slate-700">{s.aggravating_factors.join(', ')}</span></p>
                      )}
                      {s.relieving_factors && s.relieving_factors.length > 0 && (
                        <p><span className="text-slate-400 font-medium">Relieving:</span> <span className="font-semibold text-slate-700">{s.relieving_factors.join(', ')}</span></p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No detailed symptom attributes captured.</p>
            )}
          </div>

          {/* Associated Symptoms & Background */}
          <div className="grid sm:grid-cols-3 gap-4 border-t border-slate-100 pt-5">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Associated Symptoms
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {caseState?.associated_symptoms?.length ? caseState.associated_symptoms.join(', ') : 'None reported'}
              </p>
              {caseState?.fever !== undefined && caseState?.fever !== null && (
                <p className="text-xs text-slate-500 mt-1">Fever: {caseState.fever ? 'Present' : 'Absent'}</p>
              )}
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Medications & Allergies
              </span>
              <p className="text-xs text-slate-700">
                <span className="font-bold">Meds:</span> {caseState?.medications?.length ? caseState.medications.join(', ') : 'Not reported'}
              </p>
              <p className="text-xs text-slate-700 mt-1">
                <span className="font-bold">Allergies:</span> {caseState?.allergies?.length ? caseState.allergies.join(', ') : 'No known allergies'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                History & Systemic
              </span>
              <p className="text-xs text-slate-700">
                <span className="font-bold">Medical:</span> {caseState?.medical_history?.length ? caseState.medical_history.join(', ') : 'None reported'}
              </p>
              <p className="text-xs text-slate-700 mt-1">
                <span className="font-bold">Family:</span> {caseState?.family_history?.length ? caseState.family_history.join(', ') : 'None reported'}
              </p>
            </div>
          </div>

          {/* Formatted Full Text Summary (Collapsible/Verbatim) */}
          {clinicalEncounter?.final_summary && (
            <div className="border-t border-slate-100 pt-5">
              <details className="group">
                <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-teal-700 flex items-center justify-between">
                  <span>View Formatted Doctor Summary Text</span>
                  <span className="text-teal-600 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <pre className="mt-3 p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {clinicalEncounter.final_summary}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>

      {/* Discrepancy & Consistency Warning Card (if any discrepancy flagged) */}
      {demoPatient?.discrepancies && demoPatient.discrepancies.length > 0 && (
        <div className="bg-amber-50/70 border-2 border-amber-400 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-amber-950 uppercase tracking-wider">
                Clinical Discrepancies & Contradictions Flagged ({demoPatient.discrepancies.length})
              </h2>
              <p className="text-xs text-amber-800">
                Cross-verification between patient oral statements and scanned EHR documents
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {demoPatient.discrepancies.map((disc) => (
              <div key={disc.id} className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                    {disc.title}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{disc.category.toUpperCase()}</span>
                </div>
                <p className="text-xs text-slate-700 font-medium">{disc.description}</p>
                <div className="grid sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-rose-50/70 rounded-lg border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 block uppercase mb-1 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Patient Stated at Kiosk
                    </span>
                    <p className="font-semibold text-rose-950">"{disc.patientStatement.text}"</p>
                    <span className="text-[10px] text-rose-600 block mt-1">Source: {disc.patientStatement.source}</span>
                  </div>
                  <div className="p-3 bg-teal-50/70 rounded-lg border border-teal-200">
                    <span className="text-[10px] font-bold text-teal-800 block uppercase mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Scanned Document Evidence
                    </span>
                    <p className="font-semibold text-teal-950">"{disc.documentEvidence.text}"</p>
                    <span className="text-[10px] text-teal-700 block mt-1">{disc.documentEvidence.documentTitle} ({disc.documentEvidence.date})</span>
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200 font-medium">
                  <strong>Recommended Physician Action:</strong> {disc.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Abnormal Labs Investigation Results (if any) */}
      {demoPatient?.abnormalLabs && demoPatient.abnormalLabs.length > 0 && (
        <div className="bg-white border-2 border-rose-300 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black">
                <FlaskConical className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">
                  Diagnostic Laboratory Findings & Abnormal Values ({demoPatient.abnormalLabs.length})
                </h2>
                <p className="text-xs text-slate-500">Provable lab results extracted from scanned diagnostic reports</p>
              </div>
            </div>
            <span className="text-xs font-black text-rose-700 bg-rose-100 px-3 py-1 rounded-full uppercase">
              Physician Attention
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase">
                  <th className="py-2.5 px-3">Test Name</th>
                  <th className="py-2.5 px-3">Result Value</th>
                  <th className="py-2.5 px-3">Reference Range</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Clinical Significance</th>
                  <th className="py-2.5 px-3">Report Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {demoPatient.abnormalLabs.map((lab) => (
                  <tr key={lab.id} className="hover:bg-rose-50/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-800">{lab.testName}</td>
                    <td className="py-3 px-3 font-black text-rose-700 text-sm">
                      {lab.value} {lab.unit}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">{lab.referenceRange} {lab.unit}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full font-black text-[10px] uppercase bg-rose-100 text-rose-800 border border-rose-200">
                        {lab.abnormalSeverity?.toUpperCase() || 'ABNORMAL'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-xs">{lab.clinicalSignificance}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{lab.reportDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scanned Medical Documents Library */}
      {demoPatient?.documents && demoPatient.documents.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500 text-white flex items-center justify-center font-black">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">
                Scanned Medical Document Library ({demoPatient.documents.length})
              </h2>
              <p className="text-xs text-slate-500">Prescriptions, discharge notes, and diagnostic investigations scanned at kiosk</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {demoPatient.documents.map((doc) => (
              <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-teal-300 transition-all flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                  PDF
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">{doc.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{doc.fileName} • {new Date(doc.timestamp || '').toLocaleDateString()}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                      OCR Verified
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {doc.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient Longitudinal Timeline */}
      {demoPatient?.timeline && demoPatient.timeline.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-black">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">
                Patient Longitudinal Clinical Timeline ({demoPatient.timeline.length} Events)
              </h2>
              <p className="text-xs text-slate-500">Multi-year chronological health progression reconstructed from historical records</p>
            </div>
          </div>

          <div className="relative pl-6 border-l-2 border-indigo-200 space-y-6 my-2">
            {demoPatient.timeline.map((evt) => (
              <div key={evt.id} className="relative group">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-xs" />
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-colors">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <span className="font-black text-indigo-700 text-xs uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                      {evt.year} • {evt.date}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase">{evt.category}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{evt.title}</h4>
                  <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">{evt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Conversational Turn History */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setShowConversation(!showConversation)}
          className="w-full bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <PlayCircle className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Full Conversation History ({clinicalEncounter?.turns?.length || caseData.voiceResponses?.length || 0} Turns)
              </h2>
              <p className="text-xs text-slate-500">Original patient voice responses and transcripts</p>
            </div>
          </div>
          {showConversation ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showConversation && (
          <div className="p-8 space-y-6">
            {clinicalEncounter?.turns && clinicalEncounter.turns.length > 0 ? (
              clinicalEncounter.turns.map((turn, idx) => (
                <div key={turn.id || idx} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      Turn {turn.turn_number} • {turn.question_type}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {turn.language.toUpperCase()}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm mb-2">{turn.question}</p>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Patient Response:
                    </span>
                    <p className="font-semibold text-primary text-base">"{turn.patient_transcript}"</p>
                  </div>
                </div>
              ))
            ) : caseData.voiceResponses && caseData.voiceResponses.length > 0 ? (
              caseData.voiceResponses.map((vr, idx) => (
                <div key={idx} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                  <p className="font-bold text-slate-700 mb-1">{vr.question}</p>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="font-bold text-primary text-base">"{vr.transcript || vr.selectedOption}"</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm italic">No conversational records available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

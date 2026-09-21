import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Activity, User, ShieldAlert, FileText,
  Pill, Calendar, Search, History
} from 'lucide-react';
import { MockPatientCaseProvider } from '@/services/doctor/MockPatientCaseProvider';
import type { PatientRecord, PatientEncounter } from '@/services/doctor/MockPatientCaseProvider';
import type { PatientDocument } from '@/features/patient/PatientSessionContext';
import { Modal } from '@/components/ui/Modal';

export default function PatientRecordDetail() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<PatientRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<PatientDocument | null>(null);

  useEffect(() => {
    if (patientId) {
      const data = MockPatientCaseProvider.getPatientRecordById(patientId);
      setRecord(data || null);
    }
    setLoading(false);
  }, [patientId]);

  const maskMobile = (mobile?: string) => {
    if (!mobile) return 'N/A';
    if (mobile.length >= 10) return `${mobile.slice(0, 2)}••••${mobile.slice(-4)}`;
    return mobile;
  };

  const maskAbha = (abha?: string) => {
    if (!abha) return 'N/A';
    const clean = abha.replace(/[^a-zA-Z0-9]/g, '');
    if (clean.length === 14) return `XXXX XXXX ${clean.slice(-4)}`;
    return abha;
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'waiting': return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">WAITING</span>;
      case 'in-consultation': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">IN CONSULT.</span>;
      case 'completed': return <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">COMPLETED</span>;
      case 'closed': return <span className="bg-slate-100 text-slate-400 border border-slate-200 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">CLOSED</span>;
      default: return null;
    }
  };

  const handleEncounterClick = (e: PatientEncounter) => {
    if (e.status === 'completed' || e.status === 'closed') {
      navigate(`/doctor/case/${e.caseId}/summary`);
    } else {
      navigate(`/doctor/case/${e.caseId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Patient record not found</h2>
        <p className="text-slate-500 mb-6">Please return to Patient Cases and select another patient.</p>
        <button
          onClick={() => navigate('/doctor/cases')}
          className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-700 transition-colors"
        >
          Back to Patient Cases
        </button>
      </div>
    );
  }

  // Aggregate finalized consultations and prescriptions
  const finalizedEncounters = record.encounters.filter(e => e.consultationFinalized && e.consultation);
  const encountersWithMeds = record.encounters.filter(e => e.consultationFinalized && e.consultation?.prescription?.items && e.consultation.prescription.items.length > 0);
  // Collect all documents
  const allDocs: PatientDocument[] = [];
  record.encounters.forEach(e => {
    if (e.documents) {
      e.documents.forEach(d => allDocs.push(d));
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">

      {/* 1. STICKY HEADER */}
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur border-b border-slate-200 py-4 mb-6 -mx-6 px-6 shadow-sm">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate('/doctor/cases')}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Patient Cases
          </button>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">{record.name}</h1>
                <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">{record.patientId}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-mono">
                <span>{record.age} years • {record.gender.charAt(0).toUpperCase() + record.gender.slice(1)}</span>
                <span className="text-slate-300">•</span>
                <span>Mobile: {maskMobile(record.mobile)}</span>
                <span className="text-slate-300">•</span>
                <span>ABHA: {maskAbha(record.abhaId)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {record.activeCaseId && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Case</span>
                <span className="font-mono text-sm font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                  {record.activeCaseId}
                </span>
                {getStatusDisplay(record.currentStatus || 'waiting')}
                <button
                  onClick={() => navigate(`/doctor/case/${record.activeCaseId}`)}
                  className="bg-[#0D9488] text-white px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-[#0B8070] transition-colors ml-2 shadow-sm"
                >
                  Open Active Case
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. SAFETY BANNER */}
      {record.attentionRequired && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm animate-pulse-soft">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-black text-red-800 text-lg">ATTENTION REQUIRED</h3>
            <p className="text-red-700 font-medium text-sm">Safety alert was triggered during patient intake for the active case.</p>
          </div>
        </div>
      )}

      {/* 3. PATIENT OVERVIEW */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-400" />
          <h2 className="text-lg font-black text-slate-800">Patient Overview</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4 md:col-span-1">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">First Visit</p>
              <p className="font-medium text-slate-800">{new Date(record.firstVisit).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Visits</p>
              <p className="font-medium text-slate-800">{record.totalVisits}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Latest Status</p>
              <div className="mt-1">{getStatusDisplay(record.currentStatus || 'closed')}</div>
            </div>
          </div>
          <div className="md:col-span-2 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Latest Concern</p>
            <p className="text-lg font-medium text-slate-800">{record.latestConcern || 'No chief complaint recorded.'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COLUMN - CLINICAL HISTORY */}
        <div className="lg:col-span-2 space-y-6">

          {/* ENCOUNTER HISTORY */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <History className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-black text-slate-800">Encounter History</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {record.encounters.length > 0 ? (
                record.encounters.map(encounter => (
                  <div
                    key={encounter.caseId}
                    className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => handleEncounterClick(encounter)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">{encounter.caseId}</span>
                          {getStatusDisplay(encounter.status)}
                          <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(encounter.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800">{encounter.chiefComplaint || 'No chief complaint recorded'}</p>
                        {encounter.consultationFinalized && (
                          <div className="text-sm text-slate-600 bg-white p-2 rounded-lg border border-slate-100 inline-block">
                            <span className="font-bold text-slate-700">Diagnosis:</span> {encounter.diagnosis || 'None recorded'}
                          </div>
                        )}
                        {encounter.redFlagTriggered && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase tracking-widest mt-1">
                            <ShieldAlert className="w-3 h-3" /> Attention Required
                          </span>
                        )}
                      </div>
                      <div className="shrink-0">
                        <button className="bg-white border border-slate-200 px-4 py-1.5 rounded-lg text-sm font-bold text-slate-600 group-hover:bg-slate-100 transition-colors shadow-sm">
                          {encounter.status === 'completed' || encounter.status === 'closed' ? 'View Summary' : 'Open Case'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <p>No previous encounters found.</p>
                </div>
              )}
            </div>
          </div>

          {/* CONSULTATION HISTORY */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-black text-slate-800">Consultation History</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {finalizedEncounters.length > 0 ? (
                finalizedEncounters.map(encounter => (
                  <div key={encounter.caseId} className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{encounter.caseId}</span>
                      <span className="text-sm font-medium text-slate-500">{new Date(encounter.date).toLocaleDateString()}</span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Diagnosis / Impression</p>
                      <p className="text-sm font-medium text-slate-800">{encounter.diagnosis || 'None recorded'}</p>
                    </div>

                    {encounter.assessment && (
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clinical Assessment</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">{encounter.assessment}</p>
                      </div>
                    )}

                    {encounter.consultation?.ayushAssessment && encounter.consultation.ayushAssessment.notes && (
                      <div>
                        <p className="text-xs font-bold text-[#0D9488] uppercase tracking-wider mb-1">AYUSH Practitioner Assessment</p>
                        <div className="bg-[#0D9488]/5 p-3 rounded-xl border border-[#0D9488]/10 text-sm">
                          <p className="font-bold text-slate-800 mb-1">Prakriti: {encounter.consultation.ayushAssessment.prakriti || 'Not set'}</p>
                          <p className="text-slate-700">{encounter.consultation.ayushAssessment.notes}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
                      <span className="text-sm font-bold text-slate-600">{encounter.prescriptionCount} Prescriptions</span>
                      <button
                        onClick={() => navigate(`/doctor/case/${encounter.caseId}/summary`)}
                        className="text-[#0D9488] text-sm font-bold hover:underline"
                      >
                        View Final Summary →
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <p>No finalized consultations yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* VOICE CASE-TAKING HISTORY */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-black text-slate-800">Voice Case-Taking History</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">What the Patient Told Us</p>
            </div>
            <div className="divide-y divide-slate-100">
              {record.encounters.map(encounter => (
                encounter.voiceResponses && encounter.voiceResponses.length > 0 ? (
                  <div key={encounter.caseId} className="p-6">
                    <div className="mb-4">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{encounter.caseId}</span>
                    </div>
                    <div className="space-y-4">
                      {encounter.voiceResponses.map((vr, i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-sm font-bold text-slate-800 mb-2">Q: {vr.question}</p>
                          <p className="text-sm text-slate-700 italic">" {vr.transcript || vr.selectedOption || 'No response'} "</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              ))}
              {!record.encounters.some(e => e.voiceResponses && e.voiceResponses.length > 0) && (
                <div className="p-8 text-center text-slate-500">
                  <p>No patient-reported voice history.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - SIDEBAR PANELS */}
        <div className="space-y-6">

          {/* PRESCRIPTION HISTORY */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Pill className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-black text-slate-800">Prescription History</h2>
            </div>
            <div className="p-0">
              {encountersWithMeds.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {encountersWithMeds.map(encounter => (
                    <div key={encounter.caseId} className="p-4 bg-white">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-mono text-[10px] font-bold text-slate-400">{encounter.caseId}</span>
                        <span className="text-xs font-medium text-slate-500">{new Date(encounter.date).toLocaleDateString()}</span>
                      </div>
                      <div className="space-y-3">
                        {encounter.consultation?.prescription?.items?.map(med => (
                          <div key={med.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <p className="font-bold text-slate-800 text-sm">{med.medicineName}</p>
                            <p className="text-xs text-slate-600 mt-1">{med.dosage} • {med.frequency} • {med.duration}</p>
                            {med.instructions && <p className="text-[10px] text-slate-500 mt-1 italic">"{med.instructions}"</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <p className="text-sm font-medium">No prescriptions recorded.</p>
                </div>
              )}
            </div>
          </div>

          {/* ALLERGIES & MEDS HISTORY */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-lg font-black text-slate-800">Allergies & Meds</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Patient Reported</p>
            </div>
            <div className="p-6 space-y-6">

              {/* Allergies */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">Allergies</h3>
                {record.encounters[0]?.allergyHistory?.hasAllergy === 'yes' ? (
                  <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-sm">
                    <p className="font-bold text-red-800 mb-1">Type: {record.encounters[0].allergyHistory.allergyType}</p>
                    <p className="text-red-700">{record.encounters[0].allergyHistory.reaction}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No allergies reported.</p>
                )}
              </div>

              {/* Medications */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2">Current Medications</h3>
                {record.encounters[0]?.medicationHistory?.takingMedicines === 'yes_daily' || record.encounters[0]?.medicationHistory?.takingMedicines === 'yes_sometimes' ? (
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-sm text-slate-700">
                    <p>{record.encounters[0].medicationHistory.medicines}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No current medications reported.</p>
                )}
              </div>

            </div>
          </div>

          {/* DOCUMENT HISTORY */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800">Document History</h2>
              <FileText className="w-5 h-5 text-slate-400" />
            </div>
            <div className="p-0">
              {allDocs.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {allDocs.map(doc => (
                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{doc.type}</p>
                        <p className="text-xs text-slate-500">{new Date(doc.timestamp).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => { setSelectedDoc(doc); setShowDocModal(true); }}
                        className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 shadow-sm"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <p className="text-sm font-medium">No documents attached.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* DOCUMENT PREVIEW MODAL */}
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

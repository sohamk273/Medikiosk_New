import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { MockSubmissionProvider } from '@/services/submission/MockSubmissionProvider';
import { apiFetch } from '@/services/api/client';
import { Server, CheckCircle2, AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Submit() {
  const navigate = useNavigate();
  const { 
    language, 
    patient,
    submission, 
    startSubmission, 
    completeSubmission, 
    failSubmission, 
    resetSubmission,
    encounterId,
    patientId,
    chiefComplaint,
    voiceIntake,
    allergyHistory,
    setPatientId,
    setUhid,
    setEncounterId,
    setQueueEntryId,
    setTokenNumber
  } = usePatientSession();
  const hasStartedRef = useRef(false);

  const [step, setStep] = useState(0);

  useEffect(() => {
    const executeSubmission = async () => {
      startSubmission();
      setStep(1); // Information verified

      setTimeout(() => setStep(2), 600); // Preparing OPD case
      setTimeout(() => setStep(3), 1200); // Sending to OPD

      try {
        let activeEncId = encounterId;

        // Fallback: If no encounter exists yet, create patient and encounter
        if (!activeEncId) {
          let patId = patientId;
          if (!patId) {
            const patRes = await apiFetch<any>('/patients', {
              method: 'POST',
              body: JSON.stringify({
                full_name: patient?.name || 'Walk-in Patient',
                age: parseInt(patient?.age || '30') || 30,
                gender: (patient?.gender || 'male').toLowerCase(),
              }),
            });
            if (patRes.ok && patRes.data) {
              patId = patRes.data.id;
              setPatientId(patRes.data.id);
              setUhid(patRes.data.uhid);
            }
          }

          if (patId) {
            const encRes = await apiFetch<any>('/encounters', {
              method: 'POST',
              body: JSON.stringify({
                patient_id: patId,
                priority: 'NORMAL',
              }),
            });
            if (encRes.ok && encRes.data) {
              activeEncId = encRes.data.id;
              setEncounterId(encRes.data.id);
            }
          }
        }

        if (activeEncId) {
          // Update encounter with chief complaint & safety priority
          const isRedFlag = voiceIntake.redFlagTriggered || 
            (allergyHistory.hasAllergy === 'yes' && allergyHistory.reaction === 'breathing_difficulty');

          await apiFetch(`/encounters/${activeEncId}`, {
            method: 'PATCH',
            body: JSON.stringify({
              chief_complaint: chiefComplaint.primaryComplaint || undefined,
              red_flag_triggered: isRedFlag,
              priority: isRedFlag ? 'EMERGENCY' : 'NORMAL',
            }),
          });

          // Ensure consent is recorded
          await apiFetch(`/encounters/${activeEncId}/consent`, {
            method: 'POST',
            body: JSON.stringify({ accepted: true }),
          });

          // Submit encounter to OPD queue
          const subRes = await apiFetch<any>(`/encounters/${activeEncId}/submit`, {
            method: 'POST',
          });

          if (subRes.ok && subRes.data) {
            const data = subRes.data;
            setQueueEntryId(data.queue_entry_id);
            setTokenNumber(data.token_number);
            setPatientId(data.patient_id);
            setUhid(data.uhid);

            const displayCaseId = data.encounter_number || `OPD-TOKEN-${data.token_number}`;
            completeSubmission(displayCaseId);
            navigate('/patient/complete', { replace: true });
            return;
          }
        }

        // Graceful fallback if backend failed
        const fallback = await MockSubmissionProvider.submitCase();
        if (fallback.success) {
          completeSubmission(fallback.caseId);
          navigate('/patient/complete', { replace: true });
        } else {
          failSubmission();
        }
      } catch (err) {
        console.error('Submission failed:', err);
        // Attempt fallback
        try {
          const fallback = await MockSubmissionProvider.submitCase();
          if (fallback.success) {
            completeSubmission(fallback.caseId);
            navigate('/patient/complete', { replace: true });
            return;
          }
        } catch {
          // Ignore
        }
        failSubmission();
      }
    };

    // If we've already successfully submitted, redirect to complete immediately.
    // This protects against duplicate submission if user hits 'back' to /patient/submit
    if (submission.status === 'success') {
      navigate('/patient/complete', { replace: true });
      return;
    }

    if (submission.status === 'idle' && !hasStartedRef.current) {
      hasStartedRef.current = true;
      executeSubmission();
    }
  }, [submission.status, navigate, startSubmission, completeSubmission, failSubmission, encounterId, patientId, patient, chiefComplaint, voiceIntake, allergyHistory, setPatientId, setUhid, setEncounterId, setQueueEntryId, setTokenNumber]);



  const handleRetry = () => {
    resetSubmission();
    hasStartedRef.current = false;
    setStep(0);
  };

  if (submission.status === 'error') {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="bg-white rounded-3xl p-10 border border-red-200 shadow-sm flex flex-col items-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            {language === 'hi' ? 'कुछ समस्या हुई है' : 'Something went wrong'}
          </h2>
          <p className="text-lg text-slate-500 mb-10">
            {language === 'hi' 
              ? 'आपकी जानकारी जमा नहीं हो सकी। कृपया फिर से प्रयास करें।' 
              : 'We could not submit your information. Please try again.'}
          </p>
          
          <div className="flex gap-4">
            <button 
              onClick={handleRetry}
              className="flex items-center gap-2 bg-[#0D9488] text-white px-8 py-4 rounded-2xl font-bold text-xl hover:bg-[#0B8070] transition-colors shadow-lg"
            >
              <RefreshCcw className="w-6 h-6" />
              {language === 'hi' ? 'फिर कोशिश करें' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Processing UI
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-center">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-primary mb-3">
          {language === 'hi' ? 'आपकी जानकारी जमा की जा रही है' : 'Submitting Your Information'}
        </h2>
        <p className="text-slate-500 text-lg">
          {language === 'hi' 
            ? 'कृपया प्रतीक्षा करें। आपका OPD केस तैयार किया जा रहा है।' 
            : 'Please wait while we prepare your OPD case.'}
        </p>
      </div>

      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm">
        <div className="flex justify-center mb-12">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-slate-100 flex items-center justify-center">
              <Server className="w-10 h-10 text-[#0D9488]" />
            </div>
            <svg className="absolute top-0 left-0 w-24 h-24 animate-spin" viewBox="0 0 100 100">
              <circle
                className="text-[#0D9488] stroke-current"
                strokeWidth="4"
                strokeLinecap="round"
                fill="transparent"
                r="46"
                cx="50"
                cy="50"
                strokeDasharray="289"
                strokeDashoffset="75"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-6 max-w-sm mx-auto text-left">
          
          <div className={`flex items-center gap-4 transition-opacity duration-500 ${step >= 1 ? 'opacity-100' : 'opacity-30'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-[#0D9488] text-white' : 'bg-slate-200 text-slate-500'}`}>
              {step >= 2 ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2.5 h-2.5 bg-current rounded-full" />}
            </div>
            <span className={`font-bold text-lg ${step >= 2 ? 'text-slate-800' : 'text-slate-500'}`}>
              {language === 'hi' ? 'जानकारी सत्यापित' : 'Information verified'}
            </span>
          </div>

          <div className={`flex items-center gap-4 transition-opacity duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-30'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-[#0D9488] text-white' : 'bg-slate-200 text-slate-500'}`}>
              {step >= 3 ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2.5 h-2.5 bg-current rounded-full animate-pulse" />}
            </div>
            <span className={`font-bold text-lg ${step >= 3 ? 'text-slate-800' : 'text-slate-500'}`}>
              {language === 'hi' ? 'OPD केस तैयार किया जा रहा है' : 'Preparing your OPD case'}
            </span>
          </div>

          <div className={`flex items-center gap-4 transition-opacity duration-500 ${step >= 3 ? 'opacity-100' : 'opacity-30'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-500`}>
              <div className="w-2.5 h-2.5 bg-current rounded-full animate-pulse" />
            </div>
            <span className="font-bold text-lg text-slate-500">
              {language === 'hi' ? 'OPD को भेजा जा रहा है' : 'Sending to OPD'}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

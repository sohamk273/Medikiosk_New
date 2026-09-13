import { useState } from 'react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { CheckCircle2, User, Activity, FileText, BellRing, HelpCircle, FileCheck } from 'lucide-react';

export default function Complete() {
  const { language, patient, abhaId, chiefComplaint, documentIntake, submission, tokenNumber, uhid } = usePatientSession();
  const [sahayakNotified, setSahayakNotified] = useState(false);
  const [isDone, setIsDone] = useState(false);

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

  const handleCallSahayak = () => {
    setSahayakNotified(true);
    // Hide notification after 3 seconds
    setTimeout(() => setSahayakNotified(false), 3000);
  };

  const handleDone = () => {
    // Simply set a local flag to show completion was acknowledged
    // Do NOT clear context or navigate away.
    setIsDone(true);
  };

  if (isDone) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="bg-[#E6FAF5] rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-[#0D9488]" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">
          {language === 'hi' ? 'आपका काम पूरा हुआ' : "You're all set"}
        </h2>
        <p className="text-lg text-slate-500 mb-8">
          {language === 'hi' 
            ? 'कृपया प्रतीक्षा कक्ष में बैठें। आपका नंबर स्क्रीन पर दिखाया जाएगा।' 
            : 'Please have a seat in the waiting area. Your number will be displayed on the screen.'}
        </p>
        <div className="p-6 bg-white border border-slate-200 rounded-3xl inline-block shadow-sm">
          <p className="text-sm text-slate-500 mb-1 uppercase tracking-wider font-bold">
            {tokenNumber ? (language === 'hi' ? 'OPD टोकन' : 'OPD TOKEN') : (language === 'hi' ? 'OPD केस नंबर' : 'OPD CASE NUMBER')}
          </p>
          <p className="text-3xl font-black text-primary tracking-tight">
            {tokenNumber ? `Token #${tokenNumber}` : submission.caseId}
          </p>
          {tokenNumber && (
            <p className="text-xs text-slate-400 font-mono mt-1">
              Case: {submission.caseId}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 pt-6 pb-32">
      
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#E6FAF5] rounded-full mb-4">
          <CheckCircle2 className="w-10 h-10 text-[#0D9488]" />
        </div>
        <h1 className="text-4xl font-black text-slate-800 mb-3 tracking-tight">
          {language === 'hi' ? 'पंजीकरण पूरा हुआ' : 'Registration Complete'}
        </h1>
        <p className="text-xl text-slate-500">
          {language === 'hi' 
            ? 'आपकी जानकारी OPD को सफलतापूर्वक भेज दी गई है।' 
            : 'Your information has been successfully submitted to the OPD.'}
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-6 mb-8">
        
        {/* Left Column: Case ID & Next Steps */}
        <div className="md:col-span-3 space-y-6">
          
          <div className="bg-gradient-to-br from-[#0D9488] to-[#0F766E] rounded-3xl p-8 shadow-lg text-white">
            <p className="text-teal-100 uppercase tracking-widest font-bold text-sm mb-2 flex items-center gap-2">
              <FileCheck className="w-5 h-5" />
              {tokenNumber ? (language === 'hi' ? 'OPD टोकन संख्या' : 'OPD TOKEN NUMBER') : (language === 'hi' ? 'OPD केस नंबर' : 'OPD CASE NUMBER')}
            </p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
              {tokenNumber ? `Token #${tokenNumber}` : submission.caseId || 'PROCESSING...'}
            </h2>
            {tokenNumber && (
              <p className="text-teal-100 font-mono text-sm mb-4">
                Case: {submission.caseId} {uhid ? `• UHID: ${uhid}` : ''}
              </p>
            )}
            <div className="bg-black/10 rounded-xl p-4 inline-block">
              <p className="text-teal-50 font-medium">
                {language === 'hi' 
                  ? 'कृपया यह नंबर याद रखें या सहायक को दिखाएँ।' 
                  : 'Please remember this number or show it to the Sahayak.'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-primary" />
              {language === 'hi' ? 'अब आगे क्या होगा?' : 'What happens next?'}
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#E6FAF5] text-[#0D9488] font-bold flex items-center justify-center shrink-0">1</div>
                <p className="text-slate-600 font-medium pt-1">
                  {language === 'hi' ? 'आपका केस OPD कतार में जोड़ दिया गया है।' : 'Your case has been added to the OPD queue.'}
                </p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[#E6FAF5] text-[#0D9488] font-bold flex items-center justify-center shrink-0">2</div>
                <p className="text-slate-600 font-medium pt-1">
                  {language === 'hi' ? 'कृपया अपना नाम या केस नंबर बुलाए जाने की प्रतीक्षा करें।' : 'Please wait for your name or case number to be called.'}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Case Summary */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-lg">
                {language === 'hi' ? 'केस का विवरण' : 'Case Summary'}
              </h3>
            </div>
            <div className="p-6 space-y-6">
              
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {language === 'hi' ? 'मरीज़' : 'Patient'}
                </p>
                {patient ? (
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{patient.name}</p>
                    <p className="text-slate-500">
                      {patient.age} • {patient.gender === 'Male' ? (language === 'hi' ? 'पुरुष' : 'Male') : patient.gender === 'Female' ? (language === 'hi' ? 'महिला' : 'Female') : patient.gender}
                    </p>
                    {abhaId && <p className="text-slate-500 text-sm mt-1">{maskAbha(abhaId)}</p>}
                    <p className="text-slate-500 text-sm">{maskPhone(patient.mobile)}</p>
                  </div>
                ) : (
                  <p className="text-slate-500 italic">{language === 'hi' ? 'कोई जानकारी नहीं' : 'No information provided'}</p>
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  {language === 'hi' ? 'समस्या' : "Today's Concern"}
                </p>
                {chiefComplaint.primaryComplaint ? (
                  <div className="bg-slate-50 rounded-xl p-3 font-bold text-slate-700">
                    {chiefComplaint.primaryComplaint}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">{language === 'hi' ? 'कोई जानकारी नहीं' : 'No information provided'}</p>
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {language === 'hi' ? 'दस्तावेज़' : 'Documents'}
                </p>
                {documentIntake.documents.length > 0 ? (
                  <p className="font-bold text-slate-700">
                    {documentIntake.documents.length} {language === 'hi' ? 'दस्तावेज़ संलग्न' : 'documents attached'}
                  </p>
                ) : (
                  <p className="text-slate-500 italic">{language === 'hi' ? 'कोई दस्तावेज़ नहीं' : 'No documents added'}</p>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-6 mt-12 border-t border-slate-200 pt-10">
        <button 
          onClick={handleDone}
          className="bg-primary text-white px-16 py-5 rounded-2xl font-bold text-2xl hover:bg-primary/90 transition-colors shadow-lg"
        >
          {language === 'hi' ? 'हो गया' : 'Done'}
        </button>

        <div className="relative">
          <button 
            onClick={handleCallSahayak}
            className="flex items-center gap-2 text-slate-500 font-bold px-8 py-3 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <BellRing className="w-5 h-5" />
            {language === 'hi' ? 'सहायक बुलाएँ' : 'Call Sahayak'}
          </button>
          
          {/* Mock notification bubble */}
          {sahayakNotified && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-2">
              {language === 'hi' ? 'सहायक को सूचित कर दिया गया है।' : 'Sahayak has been notified.'}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

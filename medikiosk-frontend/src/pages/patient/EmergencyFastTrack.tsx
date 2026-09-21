import { useEffect, useRef } from 'react';
import { AlertOctagon, PhoneCall, VolumeX } from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';

export function EmergencyFastTrack() {
  const session = usePatientSession();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Play Web Audio API Siren Loop
  useEffect(() => {
    if (session.emergencyStatus === 'TRIGGERED') {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;

        const playSiren = () => {
          if (!audioCtxRef.current) return;
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          
          osc.type = 'square';
          // Sweep from 800Hz to 1200Hz
          osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
          osc.frequency.linearRampToValueAtTime(1200, audioCtxRef.current.currentTime + 0.4);
          
          gain.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
          gain.gain.linearRampToValueAtTime(0.1, audioCtxRef.current.currentTime + 0.05); // low volume so it's not deafening
          gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime + 0.35);
          gain.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 0.4);

          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          
          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 0.4);
          oscillatorRef.current = osc;
        };

        // Play initially and then loop every 500ms
        playSiren();
        intervalRef.current = window.setInterval(playSiren, 500);
      } catch (e) {
        console.warn('Audio Context failed to start (autoplay policy)', e);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (oscillatorRef.current) {
        try { oscillatorRef.current.stop(); } catch (e) { /* ignore */ }
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [session.emergencyStatus]);

  if (session.emergencyStatus !== 'TRIGGERED') {
    return null; // Should be unmounted anyway, but defensive return
  }

  return (
    <div className="relative z-50 flex-1 w-full flex flex-col items-center justify-center bg-red-600 animate-in fade-in duration-300 p-4">
      <div className="absolute inset-0 bg-black/10 pointer-events-none animate-pulse"></div>
      
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-center border-4 border-red-700/50 max-h-full overflow-y-auto">
        
        {/* Header Icon */}
        <div className="flex justify-center mb-4 relative">
          <div className="absolute inset-0 bg-red-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center relative shadow-inner">
            <AlertOctagon className="w-10 h-10 text-red-600 animate-bounce" />
          </div>
        </div>

        {/* Urgent Titles */}
        <h1 className="text-3xl sm:text-4xl font-black text-red-700 mb-2 tracking-tight">
          EMERGENCY RESPONSE ACTIVE
        </h1>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-6 uppercase tracking-widest">
          Immediate Medical Assistance Required
        </h2>

        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 sm:p-5 mb-6 text-left">
          <div className="flex justify-between items-center mb-4">
            <span className="bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full tracking-widest uppercase shadow-sm">
              Priority: CRITICAL
            </span>
            <span className="text-red-700 font-bold font-mono bg-red-100 px-3 py-1 rounded-lg text-sm">
              {new Date(session.emergencyTriggeredAt || Date.now()).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Reason</p>
              <p className="text-lg font-bold text-red-900 leading-tight">
                {session.emergencyReason || 'Unspecified Medical Emergency'}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-red-200/60">
              <div>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Patient</p>
                <p className="text-sm font-bold text-red-900">
                  {session.patient?.name || 'Unknown Patient'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Location</p>
                <p className="text-sm font-bold text-red-900">
                  OPD Kiosk Terminal
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-slate-500 font-bold text-base mb-6">
          🚨 Please remain with the patient.<br/>
          Hospital emergency staff have been alerted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          <button 
            type="button"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-base px-6 py-3 rounded-xl shadow-lg transition-colors cursor-default"
          >
            <PhoneCall className="w-5 h-5" />
            Hospital Casualty Desk Alerted
          </button>
          
          <button 
            type="button"
            onClick={session.acknowledgeEmergency}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base px-6 py-3 rounded-xl shadow-sm transition-colors"
          >
            <VolumeX className="w-5 h-5" />
            Stop Alarm / Acknowledge
          </button>
        </div>
        
      </div>
    </div>
  );
}

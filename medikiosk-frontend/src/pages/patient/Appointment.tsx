import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  ArrowRight,
  MapPin,
  UserCheck
} from 'lucide-react';
import { usePatientSession } from '@/features/patient/PatientSessionContext';
import { useKioskScreen } from '@/context/KioskScreenContext';
import { GlassCard } from '@/components/ui/GlassCard';

interface TimeSlot {
  time: string;
  period: 'morning' | 'afternoon' | 'evening';
  available: boolean;
}

const TIME_SLOTS: TimeSlot[] = [
  { time: '09:30 AM', period: 'morning', available: true },
  { time: '10:00 AM', period: 'morning', available: true },
  { time: '10:30 AM', period: 'morning', available: true },
  { time: '11:00 AM', period: 'morning', available: false }, // booked
  { time: '11:30 AM', period: 'morning', available: true },
  { time: '12:00 PM', period: 'afternoon', available: true },
  { time: '12:30 PM', period: 'afternoon', available: false }, // booked
  { time: '02:00 PM', period: 'afternoon', available: true },
  { time: '02:30 PM', period: 'afternoon', available: true },
  { time: '03:00 PM', period: 'afternoon', available: true },
  { time: '03:30 PM', period: 'afternoon', available: true }, // target slot
  { time: '04:00 PM', period: 'evening', available: true },
  { time: '04:30 PM', period: 'evening', available: true },
  { time: '05:00 PM', period: 'evening', available: true },
  { time: '05:30 PM', period: 'evening', available: true },
];

export default function Appointment() {
  const navigate = useNavigate();
  const {
    appointment,
    setAppointmentSlot,
    confirmAppointment,
    patient,
  } = usePatientSession();

  const [selectedSlot, setSelectedSlot] = useState<string>(appointment?.timeSlot || '03:30 PM');

  const handleSelectSlot = (slot: TimeSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot.time);
    setAppointmentSlot(slot.time);
  };

  const handleConfirmAppointment = () => {
    if (!selectedSlot) return;
    setAppointmentSlot(selectedSlot);
    confirmAppointment();
    navigate('/patient/submit');
  };

  const handleBack = () => {
    navigate('/patient/review');
  };

  useKioskScreen({
    onContinue: handleConfirmAppointment,
    onBack: handleBack,
    continueLabelKey: 'Confirm Appointment',
    isContinueDisabled: !selectedSlot,
    audioPrompt: 'Please select a convenient appointment time slot for today and tap Confirm Appointment.',
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-1 flex flex-col justify-between">
      {/* Header Banner & Flow Breadcrumbs */}
      <GlassCard className="p-3 mb-2 flex items-center justify-between border-medigreen-200/80 bg-gradient-to-r from-medigreen-50/60 via-white/95 to-teal-50/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-medigreen-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Calendar className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-navy-900 tracking-tight font-devanagari leading-none">
                Schedule Your Appointment
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-600" />
                Same-Day Consultation
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Select a convenient time slot with Dr. Priya Sharma for today
            </p>
          </div>
        </div>

        {/* Stage tracker pill */}
        <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
          <span className="text-medigreen-700 font-extrabold">CASE TAKING ✓</span>
          <span>→</span>
          <span className="text-medigreen-700 font-extrabold">AYUSH ✓</span>
          <span>→</span>
          <span className="text-mediblue-700 font-extrabold">APPOINTMENT</span>
          <span>→</span>
          <span>FINAL TOKEN</span>
        </div>
      </GlassCard>

      {/* Main Grid: Left Slot Selector (8 cols) / Right Confirmation Card (4 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-2">
        {/* Left: Time Slots Selection (8 cols) */}
        <GlassCard className="md:col-span-8 p-3.5 border-medigreen-200/80 bg-white/95 shadow-xs flex flex-col justify-between">
          <div>
            {/* Date Indicator Bar */}
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-navy-900 uppercase tracking-wide">
                  Today's Appointments
                </span>
                <span className="bg-medigreen-600 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-md shadow-2xs">
                  Today
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                15 Available Daily Slots
              </span>
            </div>

            {/* Slots Grid (3 columns x 5 rows = 15 slots) */}
            <div id="sahayak-target-slots" className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isSelected = selectedSlot === slot.time;
                const isAvailable = slot.available;

                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => handleSelectSlot(slot)}
                    className={`p-2.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center relative ${
                      !isAvailable
                        ? 'opacity-40 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : isSelected
                        ? 'border-medigreen-600 bg-gradient-to-br from-medigreen-500 to-teal-600 text-white shadow-md scale-[1.02] cursor-pointer'
                        : 'border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-medigreen-300 text-navy-900 shadow-2xs cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                      <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : isAvailable ? 'text-medigreen-600' : 'text-slate-400'}`} />
                      <span>{slot.time}</span>
                    </div>

                    <div className="mt-0.5">
                      {!isAvailable ? (
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                          Booked
                        </span>
                      ) : isSelected ? (
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-100 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Selected
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium text-emerald-700">
                          Available
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend footer */}
          <div className="flex items-center justify-center gap-4 mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-100 border border-slate-300" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-medigreen-600" />
              <span className="font-bold text-medigreen-800">Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="text-slate-400">Booked / Full</span>
            </div>
          </div>
        </GlassCard>

        {/* Right: Selected Appointment Preview (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-2">
          <GlassCard className="p-3.5 border-2 border-medigreen-300 bg-gradient-to-br from-white via-medigreen-50/30 to-teal-50/40 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-medigreen-800 font-extrabold text-[11px] uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-medigreen-600" />
                <span>Selected Appointment</span>
              </div>

              {/* Highlight Box */}
              <div className="p-3 bg-gradient-to-r from-medigreen-600 to-teal-700 text-white rounded-xl shadow-xs mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">
                  Consultation Slot
                </span>
                <div className="text-xl font-mono font-black mt-0.5">
                  Today, {selectedSlot}
                </div>
              </div>

              {/* Consultation Details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 bg-white/90 p-2 rounded-lg border border-slate-200/80">
                  <UserCheck className="w-4 h-4 text-medigreen-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Patient</span>
                    <span className="font-extrabold text-navy-900">{patient?.name || 'Rajesh Sharma'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white/90 p-2 rounded-lg border border-slate-200/80">
                  <Stethoscope className="w-4 h-4 text-mediblue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Assigned Doctor</span>
                    <span className="font-bold text-navy-900">Dr. Priya Sharma</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-white/90 p-2 rounded-lg border border-slate-200/80">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Consultation Location</span>
                    <span className="font-bold text-navy-900">Room 4 · Smart OPD &amp; AYUSH</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm CTA */}
            <div className="mt-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={!selectedSlot}
                onClick={handleConfirmAppointment}
                className="w-full bg-gradient-to-r from-medigreen-600 to-teal-700 hover:from-medigreen-700 hover:to-teal-800 disabled:opacity-50 text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Appointment</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

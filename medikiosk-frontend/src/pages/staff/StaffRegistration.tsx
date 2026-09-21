import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, CheckCircle2, ArrowLeft, Printer, 
  Phone, ShieldCheck 
} from 'lucide-react';
import { MockStaffProvider, type StaffAppointment } from '@/services/staff/MockStaffProvider';
import { Modal } from '@/components/ui/Modal';

export default function StaffRegistration() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    mobile: '',
    abhaId: '',
    address: '',
    preferredLanguage: 'English',
    opdDepartment: 'General OPD',
    doctorName: 'Dr. Priya Sharma',
    appointmentType: 'New Walk-in' as StaffAppointment['appointmentType'],
    paymentStatus: 'Paid' as StaffAppointment['paymentStatus'],
  });

  const [createdApt, setCreatedApt] = useState<StaffAppointment | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [validationError, setValidationError] = useState('');

  const doctorsByDept: Record<string, string[]> = {
    'General OPD': ['Dr. Priya Sharma', 'Dr. Sandeep Varma'],
    'Ayurveda': ['Dr. Priya Sharma (MD Ayu)', 'Dr. Rajesh Vaidya'],
    'Orthopedics': ['Dr. Rajesh Kulkarni'],
    'Pediatrics': ['Dr. Anjali Deshmukh'],
    'Gynecology': ['Dr. Anita Roy'],
    'ENT': ['Dr. Sandeep Varma'],
    'Dermatology': ['Dr. Manish Trivedi'],
  };

  const handleDeptChange = (dept: string) => {
    const docs = doctorsByDept[dept] || ['Dr. Priya Sharma'];
    setFormData({
      ...formData,
      opdDepartment: dept,
      doctorName: docs[0]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!formData.patientName.trim()) {
      setValidationError('Please enter patient full name.');
      return;
    }
    if (!formData.age || isNaN(Number(formData.age)) || Number(formData.age) <= 0) {
      setValidationError('Please enter a valid age.');
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.length < 10) {
      setValidationError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const newAppointment = MockStaffProvider.registerPatient({
      patientName: formData.patientName.trim(),
      age: Number(formData.age),
      gender: formData.gender,
      mobile: formData.mobile.trim(),
      abhaId: formData.abhaId.trim() || undefined,
      doctorName: formData.doctorName,
      opdDepartment: formData.opdDepartment,
      appointmentType: formData.appointmentType,
      paymentStatus: formData.paymentStatus,
    });

    setCreatedApt(newAppointment);
    setShowSlipModal(true);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient OPD Registration</h1>
            <p className="text-xs text-slate-500 font-medium">Create new OPD token and route patient to designated clinic room</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Station</span>
          <span className="text-xs font-bold text-teal-800">Counter 01 / Desk 02</span>
        </div>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
        
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
            {validationError}
          </div>
        )}

        {/* 1. Patient Demographics */}
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-800 text-[11px] flex items-center justify-center font-bold">1</span>
            Patient Demographics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="e.g. Ramesh Chandra Verma"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Age <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Years"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                  placeholder="10-digit mobile number"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>
            </div>

            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ABHA ID / Aadhaar (Optional)
              </label>
              <div className="relative">
                <ShieldCheck className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.abhaId}
                  onChange={(e) => setFormData({ ...formData, abhaId: e.target.value })}
                  placeholder="e.g. 91-4432-8871-0010"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>
            </div>

            <div className="md:col-span-8">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Residential Address / Village
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="District / Area / Street"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Preferred Language
              </label>
              <select
                value={formData.preferredLanguage}
                onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Marathi">Marathi (मराठी)</option>
                <option value="Gujarati">Gujarati (ગુજરાતી)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Department & Doctor Routing */}
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-800 text-[11px] flex items-center justify-center font-bold">2</span>
            Clinical Department & Appointment Type
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                OPD Specialty
              </label>
              <select
                value={formData.opdDepartment}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
              >
                {Object.keys(doctorsByDept).map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Assigned Doctor & Room
              </label>
              <select
                value={formData.doctorName}
                onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
              >
                {(doctorsByDept[formData.opdDepartment] || ['Dr. Priya Sharma']).map((doc) => (
                  <option key={doc} value={doc}>{doc}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Appointment Category
              </label>
              <select
                value={formData.appointmentType}
                onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
              >
                <option value="New Walk-in">New Walk-in</option>
                <option value="Follow-up">Follow-up Visit</option>
                <option value="Consultation Referral">Consultation Referral</option>
                <option value="Priority / Senior">Priority / Senior Citizen</option>
              </select>
            </div>

            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Registration Fee / Scheme Coverage
              </label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer"
              >
                <option value="Paid">Standard OPD Fee Paid (₹10 / ₹20)</option>
                <option value="PM-JAY Covered">Ayushman Bharat PM-JAY (Exempted)</option>
                <option value="Exempted">Govt. Senior / Freedom Fighter / BPL Exemption</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/staff/dashboard')}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register & Generate Token</span>
          </button>
        </div>

      </form>

      {/* OPD Token Generated Modal Preview */}
      <Modal
        open={showSlipModal}
        onClose={() => {
          setShowSlipModal(false);
          navigate('/staff/dashboard');
        }}
        title={
          <div className="flex items-center gap-2 text-slate-900">
            <CheckCircle2 className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-base">OPD Slip & Token Generated</h3>
          </div>
        }
      >
        {createdApt && (
          <div className="space-y-4">
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-3 font-sans">
              <div className="text-center pb-3 border-b border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">District Civil Hospital — OPD Suite</p>
                <h4 className="text-2xl font-black text-teal-900 font-mono tracking-wider mt-1">{createdApt.tokenDisplay}</h4>
                <p className="text-xs text-slate-600 font-medium">{createdApt.opdDepartment} • {createdApt.roomNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Patient Name</span>
                  <span className="font-bold text-slate-800">{createdApt.patientName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Age / Gender</span>
                  <span className="font-medium text-slate-700">{createdApt.age}y • {createdApt.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Doctor</span>
                  <span className="font-semibold text-slate-800">{createdApt.doctorName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Time / Date</span>
                  <span className="font-mono text-slate-700">{createdApt.appointmentTime} • 21 Sep</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-medium">Estimated Wait Time:</span>
                <span className="font-bold text-teal-800 font-mono">~ 15 - 20 mins</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handlePrintSlip}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Token Slip</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowSlipModal(false);
                  navigate('/staff/dashboard');
                }}
                className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                Done / Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}

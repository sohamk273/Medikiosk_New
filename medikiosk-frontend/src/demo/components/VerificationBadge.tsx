import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, UserCheck } from 'lucide-react';
import type { VerificationStatus } from '../types/demoTypes';

interface Props {
  status: VerificationStatus;
}

export const VerificationBadge: React.FC<Props> = ({ status }) => {
  switch (status) {
    case 'doctor_verified':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-300">
          <CheckCircle2 className="w-3 h-3 text-blue-600" />
          <span>Doctor Verified</span>
        </span>
      );
    case 'patient_confirmed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-300">
          <UserCheck className="w-3 h-3 text-teal-600" />
          <span>Patient Confirmed</span>
        </span>
      );
    case 'discrepancy_flagged':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-800 border border-rose-300 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          <span>Discrepancy Flagged</span>
        </span>
      );
    case 'needs_verification':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Verification Pending</span>
        </span>
      );
  }
};

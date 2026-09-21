export interface StaffAppointment {
  id: string;
  tokenNumber: number;
  tokenDisplay: string;
  patientName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  abhaId?: string;
  doctorName: string;
  opdDepartment: string;
  roomNumber: string;
  appointmentTime: string;
  appointmentType: 'New Walk-in' | 'Follow-up' | 'Consultation Referral' | 'Priority / Senior';
  status: 'Checked In' | 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled' | 'Scheduled';
  waitingMinutes: number;
  registeredAt: string;
  checkedInAt?: string;
  stage: 'Registration' | 'Waiting' | 'Doctor Consultation' | 'Diagnostics / Documents' | 'Pharmacy / Billing' | 'Completed';
  paymentStatus: 'Paid' | 'Exempted' | 'PM-JAY Covered' | 'Pending';
  documentsVerified: boolean;
}

export interface StaffAlertItem {
  id: string;
  type: 'delay' | 'doctor' | 'capacity' | 'document' | 'token';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  timestamp: string;
  department: string;
  resolved: boolean;
}

export interface StaffDocumentCheckItem {
  id: string;
  patientName: string;
  tokenDisplay: string;
  documentType: 'Aadhaar Card' | 'ABHA Digital Card' | 'Previous Prescription' | 'Lab Report' | 'Discharge Summary';
  status: 'Verified' | 'Pending' | 'Uploaded' | 'Missing';
  uploadedAt: string;
  verifiedBy?: string;
}

// Initial deterministic state matching MediKiosk demo hospital baseline
const INITIAL_APPOINTMENTS: StaffAppointment[] = [
  {
    id: 'APT-2026-001',
    tokenNumber: 10,
    tokenDisplay: 'OPD-010',
    patientName: 'Aarav Mehta',
    age: 42,
    gender: 'male',
    mobile: '9876543210',
    abhaId: '91-4432-8871-0010',
    doctorName: 'Dr. Priya Sharma',
    opdDepartment: 'General OPD',
    roomNumber: 'Room 4',
    appointmentTime: '08:30 AM',
    appointmentType: 'Follow-up',
    status: 'Waiting',
    waitingMinutes: 24,
    registeredAt: '08:15 AM',
    checkedInAt: '08:20 AM',
    stage: 'Waiting',
    paymentStatus: 'Paid',
    documentsVerified: true,
  },
  {
    id: 'APT-2026-002',
    tokenNumber: 12,
    tokenDisplay: 'OPD-012',
    patientName: 'Rameshwar Patil',
    age: 58,
    gender: 'male',
    mobile: '9822334455',
    abhaId: '91-8876-1122-0012',
    doctorName: 'Dr. Priya Sharma',
    opdDepartment: 'General OPD',
    roomNumber: 'Room 4',
    appointmentTime: '09:00 AM',
    appointmentType: 'New Walk-in',
    status: 'In Consultation',
    waitingMinutes: 8,
    registeredAt: '08:35 AM',
    checkedInAt: '08:42 AM',
    stage: 'Doctor Consultation',
    paymentStatus: 'PM-JAY Covered',
    documentsVerified: true,
  },
  {
    id: 'APT-2026-003',
    tokenNumber: 13,
    tokenDisplay: 'OPD-013',
    patientName: 'Sunita Sharma',
    age: 49,
    gender: 'female',
    mobile: '9811223344',
    abhaId: '91-6677-4433-0013',
    doctorName: 'Dr. Priya Sharma',
    opdDepartment: 'Ayurveda',
    roomNumber: 'Room 4',
    appointmentTime: '09:30 AM',
    appointmentType: 'Follow-up',
    status: 'Waiting',
    waitingMinutes: 18,
    registeredAt: '09:05 AM',
    checkedInAt: '09:12 AM',
    stage: 'Waiting',
    paymentStatus: 'Paid',
    documentsVerified: true,
  },
  {
    id: 'APT-2026-004',
    tokenNumber: 14,
    tokenDisplay: 'OPD-014',
    patientName: 'Kavita Sundaram',
    age: 34,
    gender: 'female',
    mobile: '9744556677',
    abhaId: '91-3322-9988-0014',
    doctorName: 'Dr. Rajesh Kulkarni',
    opdDepartment: 'Orthopedics',
    roomNumber: 'Room 2',
    appointmentTime: '09:45 AM',
    appointmentType: 'New Walk-in',
    status: 'Waiting',
    waitingMinutes: 12,
    registeredAt: '09:20 AM',
    checkedInAt: '09:28 AM',
    stage: 'Waiting',
    paymentStatus: 'Paid',
    documentsVerified: true,
  },
  {
    id: 'APT-2026-005',
    tokenNumber: 15,
    tokenDisplay: 'OPD-015',
    patientName: 'Vikram Joshi',
    age: 29,
    gender: 'male',
    mobile: '9655443322',
    abhaId: '91-2233-4455-0015',
    doctorName: 'Dr. Anjali Deshmukh',
    opdDepartment: 'Pediatrics',
    roomNumber: 'Room 6',
    appointmentTime: '10:00 AM',
    appointmentType: 'Consultation Referral',
    status: 'Checked In',
    waitingMinutes: 6,
    registeredAt: '09:40 AM',
    checkedInAt: '09:50 AM',
    stage: 'Waiting',
    paymentStatus: 'Exempted',
    documentsVerified: true,
  },
  {
    id: 'APT-2026-006',
    tokenNumber: 16,
    tokenDisplay: 'OPD-016',
    patientName: 'Meenakshi Iyer',
    age: 63,
    gender: 'female',
    mobile: '9833445566',
    abhaId: '91-5544-3322-0016',
    doctorName: 'Dr. Priya Sharma',
    opdDepartment: 'General OPD',
    roomNumber: 'Room 4',
    appointmentTime: '10:15 AM',
    appointmentType: 'Priority / Senior',
    status: 'Checked In',
    waitingMinutes: 4,
    registeredAt: '09:55 AM',
    checkedInAt: '10:02 AM',
    stage: 'Waiting',
    paymentStatus: 'PM-JAY Covered',
    documentsVerified: true,
  },
  {
    id: 'APT-2026-007',
    tokenNumber: 17,
    tokenDisplay: 'OPD-017',
    patientName: 'Devendra Rathore',
    age: 51,
    gender: 'male',
    mobile: '9788990011',
    abhaId: '91-7788-9900-0017',
    doctorName: 'Dr. Rajesh Kulkarni',
    opdDepartment: 'Orthopedics',
    roomNumber: 'Room 2',
    appointmentTime: '10:30 AM',
    appointmentType: 'Follow-up',
    status: 'Scheduled',
    waitingMinutes: 0,
    registeredAt: '10:05 AM',
    stage: 'Registration',
    paymentStatus: 'Pending',
    documentsVerified: false,
  },
  {
    id: 'APT-2026-008',
    tokenNumber: 18,
    tokenDisplay: 'OPD-018',
    patientName: 'Pooja Verma',
    age: 38,
    gender: 'female',
    mobile: '9911002233',
    abhaId: '91-1122-3344-0018',
    doctorName: 'Dr. Anita Roy',
    opdDepartment: 'Gynecology',
    roomNumber: 'Room 5',
    appointmentTime: '10:45 AM',
    appointmentType: 'New Walk-in',
    status: 'Scheduled',
    waitingMinutes: 0,
    registeredAt: '10:10 AM',
    stage: 'Registration',
    paymentStatus: 'Paid',
    documentsVerified: true,
  },
  {
    id: 'APT-2026-009',
    tokenNumber: 8,
    tokenDisplay: 'OPD-008',
    patientName: 'Harish Chandra',
    age: 67,
    gender: 'male',
    mobile: '9844332211',
    abhaId: '91-9988-7766-0008',
    doctorName: 'Dr. Priya Sharma',
    opdDepartment: 'General OPD',
    roomNumber: 'Room 4',
    appointmentTime: '08:00 AM',
    appointmentType: 'Follow-up',
    status: 'Completed',
    waitingMinutes: 14,
    registeredAt: '07:45 AM',
    checkedInAt: '07:50 AM',
    stage: 'Completed',
    paymentStatus: 'Paid',
    documentsVerified: true,
  },
  {
    id: 'APT-2026-010',
    tokenNumber: 9,
    tokenDisplay: 'OPD-009',
    patientName: 'Geeta Ben',
    age: 44,
    gender: 'female',
    mobile: '9766554433',
    abhaId: '91-4455-6677-0009',
    doctorName: 'Dr. Anjali Deshmukh',
    opdDepartment: 'Pediatrics',
    roomNumber: 'Room 6',
    appointmentTime: '08:15 AM',
    appointmentType: 'New Walk-in',
    status: 'Completed',
    waitingMinutes: 10,
    registeredAt: '08:00 AM',
    checkedInAt: '08:05 AM',
    stage: 'Completed',
    paymentStatus: 'PM-JAY Covered',
    documentsVerified: true,
  }
];

const INITIAL_ALERTS: StaffAlertItem[] = [
  {
    id: 'ALT-001',
    type: 'delay',
    severity: 'medium',
    title: 'Patient Waiting Over 20 Minutes',
    message: 'Aarav Mehta (OPD-010) has been waiting 24 mins in General OPD queue.',
    timestamp: '10:41 AM',
    department: 'General OPD',
    resolved: false
  },
  {
    id: 'ALT-002',
    type: 'doctor',
    severity: 'low',
    title: 'Room 2 Consultation In Progress',
    message: 'Dr. Rajesh Kulkarni has 4 waiting patients queued for Orthopedics.',
    timestamp: '10:35 AM',
    department: 'Orthopedics',
    resolved: false
  },
  {
    id: 'ALT-003',
    type: 'document',
    severity: 'low',
    title: 'Document Verification Pending',
    message: 'Devendra Rathore (OPD-017) requires Aadhaar / ABHA verification before triage.',
    timestamp: '10:15 AM',
    department: 'Front Desk',
    resolved: false
  },
  {
    id: 'ALT-004',
    type: 'capacity',
    severity: 'medium',
    title: 'Morning Shift Capacity at 78%',
    message: 'General OPD queue capacity is approaching morning session threshold (48/60).',
    timestamp: '10:00 AM',
    department: 'Hospital Operations',
    resolved: false
  }
];

const INITIAL_DOCS: StaffDocumentCheckItem[] = [
  { id: 'DOC-101', patientName: 'Aarav Mehta', tokenDisplay: 'OPD-010', documentType: 'Aadhaar Card', status: 'Verified', uploadedAt: '08:16 AM', verifiedBy: 'Receptionist Ananya' },
  { id: 'DOC-102', patientName: 'Aarav Mehta', tokenDisplay: 'OPD-010', documentType: 'ABHA Digital Card', status: 'Verified', uploadedAt: '08:18 AM', verifiedBy: 'Receptionist Ananya' },
  { id: 'DOC-103', patientName: 'Rameshwar Patil', tokenDisplay: 'OPD-012', documentType: 'Previous Prescription', status: 'Verified', uploadedAt: '08:38 AM', verifiedBy: 'Receptionist Rahul' },
  { id: 'DOC-104', patientName: 'Sunita Sharma', tokenDisplay: 'OPD-013', documentType: 'Lab Report', status: 'Verified', uploadedAt: '09:08 AM', verifiedBy: 'Receptionist Ananya' },
  { id: 'DOC-105', patientName: 'Kavita Sundaram', tokenDisplay: 'OPD-014', documentType: 'Aadhaar Card', status: 'Verified', uploadedAt: '09:22 AM', verifiedBy: 'Receptionist Rahul' },
  { id: 'DOC-106', patientName: 'Devendra Rathore', tokenDisplay: 'OPD-017', documentType: 'ABHA Digital Card', status: 'Pending', uploadedAt: '10:06 AM' },
  { id: 'DOC-107', patientName: 'Pooja Verma', tokenDisplay: 'OPD-018', documentType: 'Previous Prescription', status: 'Uploaded', uploadedAt: '10:12 AM' }
];

let liveAppointments: StaffAppointment[] = JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS));
let liveAlerts: StaffAlertItem[] = JSON.parse(JSON.stringify(INITIAL_ALERTS));
let liveDocs: StaffDocumentCheckItem[] = JSON.parse(JSON.stringify(INITIAL_DOCS));
let nextTokenNumber = 19;

export class MockStaffProvider {
  static getAppointments(): StaffAppointment[] {
    return [...liveAppointments];
  }

  static getAppointmentById(id: string): StaffAppointment | undefined {
    return liveAppointments.find(a => a.id === id || a.tokenDisplay.toLowerCase() === id.toLowerCase());
  }

  static getQueue(): StaffAppointment[] {
    return liveAppointments.filter(a => a.status !== 'Cancelled' && a.status !== 'Completed');
  }

  static getOverviewMetrics() {
    const totalToday = 48; // Simulated total including morning walk-ins
    const checkedIn = liveAppointments.filter(a => a.status === 'Checked In' || a.status === 'Waiting' || a.status === 'In Consultation' || a.status === 'Completed').length + 26;
    const waiting = liveAppointments.filter(a => a.status === 'Waiting').length;
    const inConsultation = liveAppointments.filter(a => a.status === 'In Consultation').length;
    const completed = liveAppointments.filter(a => a.status === 'Completed').length + 18;

    return {
      patientsToday: totalToday,
      checkedIn: checkedIn,
      waiting: waiting,
      inConsultation: inConsultation,
      completed: completed,
    };
  }

  static checkInPatient(id: string): StaffAppointment | undefined {
    const apt = liveAppointments.find(a => a.id === id);
    if (apt) {
      apt.status = 'Waiting';
      apt.stage = 'Waiting';
      apt.checkedInAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return apt;
    }
    return undefined;
  }

  static registerPatient(data: {
    patientName: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    mobile: string;
    abhaId?: string;
    doctorName: string;
    opdDepartment: string;
    appointmentType: StaffAppointment['appointmentType'];
    paymentStatus?: StaffAppointment['paymentStatus'];
  }): StaffAppointment {
    const currentToken = nextTokenNumber++;
    const tokenDisplay = `OPD-${String(currentToken).padStart(3, '0')}`;
    const newApt: StaffAppointment = {
      id: `APT-2026-${String(currentToken).padStart(3, '0')}`,
      tokenNumber: currentToken,
      tokenDisplay: tokenDisplay,
      patientName: data.patientName,
      age: data.age,
      gender: data.gender,
      mobile: data.mobile,
      abhaId: data.abhaId || `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${currentToken}`,
      doctorName: data.doctorName,
      opdDepartment: data.opdDepartment,
      roomNumber: data.opdDepartment === 'General OPD' ? 'Room 4' : data.opdDepartment === 'Orthopedics' ? 'Room 2' : data.opdDepartment === 'Pediatrics' ? 'Room 6' : 'Room 5',
      appointmentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      appointmentType: data.appointmentType,
      status: 'Waiting',
      waitingMinutes: 0,
      registeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkedInAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stage: 'Waiting',
      paymentStatus: data.paymentStatus || 'Paid',
      documentsVerified: true,
    };

    liveAppointments.unshift(newApt);
    return newApt;
  }

  static updatePatientStage(id: string, stage: StaffAppointment['stage']): void {
    const apt = liveAppointments.find(a => a.id === id);
    if (apt) {
      apt.stage = stage;
      if (stage === 'Doctor Consultation') {
        apt.status = 'In Consultation';
      } else if (stage === 'Completed') {
        apt.status = 'Completed';
      } else if (stage === 'Waiting') {
        apt.status = 'Waiting';
      }
    }
  }

  static updateAppointmentStatus(id: string, status: StaffAppointment['status']): void {
    const apt = liveAppointments.find(a => a.id === id);
    if (apt) {
      apt.status = status;
      if (status === 'Completed') apt.stage = 'Completed';
      if (status === 'In Consultation') apt.stage = 'Doctor Consultation';
      if (status === 'Waiting') apt.stage = 'Waiting';
    }
  }

  static getAlerts(): StaffAlertItem[] {
    return [...liveAlerts];
  }

  static resolveAlert(id: string): void {
    const alert = liveAlerts.find(a => a.id === id);
    if (alert) alert.resolved = true;
  }

  static getDocuments(): StaffDocumentCheckItem[] {
    return [...liveDocs];
  }

  static verifyDocument(docId: string, verifiedBy: string = 'Reception Staff'): void {
    const doc = liveDocs.find(d => d.id === docId);
    if (doc) {
      doc.status = 'Verified';
      doc.verifiedBy = verifiedBy;
    }
  }
}

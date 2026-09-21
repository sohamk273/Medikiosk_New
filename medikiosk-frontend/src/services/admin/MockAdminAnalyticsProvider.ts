export interface AdminKpiMetrics {
  totalPatients: number;
  consultationsCompleted: number;
  appointmentCompletionRate: number;
  averageWaitingTimeMinutes: number;
  averageConsultationMinutes: number;
  activeDoctors: number;
  totalAppointments: number;
  cancelledNoShow: number;
}

export interface OpdDistributionItem {
  department: string;
  count: number;
  percentage: number;
  activeDoctors: number;
  avgWaitTime: number;
  capacity: number;
  utilization: number;
}

export interface HourlyLoadItem {
  hour: string;
  patients: number;
  walkIns: number;
  appointments: number;
}

export interface DiseaseCategoryItem {
  category: string;
  count: number;
  percentage: number;
  commonCases: string;
}

export interface DoctorPerformanceItem {
  id: string;
  name: string;
  department: string;
  roomNumber: string;
  consultationsToday: number;
  averageConsultationMinutes: number;
  status: 'In Consultation' | 'Available' | 'On Break' | 'Offline';
  waitingQueueCount: number;
}

export interface StaffOperationsItem {
  id: string;
  name: string;
  counter: string;
  role: string;
  shift: string;
  status: 'Active' | 'On Break' | 'Offline';
  patientsHandledToday: number;
  averageCheckInSeconds: number;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: 'Doctor' | 'Staff' | 'Admin' | 'System';
  action: string;
  entity: string;
  department: string;
  status: 'Success' | 'Warning' | 'Failed';
}

export interface AdminReportItem {
  id: string;
  reportCode: string;
  title: string;
  category: 'OPD Operations' | 'Clinical Analytics' | 'Financial & Billing' | 'Quality & Compliance';
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'On-Demand';
  lastGenerated: string;
  format: 'PDF' | 'CSV' | 'Excel';
  fileSize: string;
}

export interface AdminUserRoleItem {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: 'Doctor' | 'Staff' | 'Admin';
  department: string;
  status: 'Active' | 'Inactive';
  lastActive: string;
  phone: string;
}

// -------------------------------------------------------------------------
// DETERMINISTIC DATA BASELINE
// -------------------------------------------------------------------------

const KPI_METRICS: AdminKpiMetrics = {
  totalPatients: 1284,
  consultationsCompleted: 936,
  appointmentCompletionRate: 84,
  averageWaitingTimeMinutes: 18,
  averageConsultationMinutes: 14,
  activeDoctors: 12,
  totalAppointments: 980,
  cancelledNoShow: 70,
};

const OPD_DISTRIBUTION: OpdDistributionItem[] = [
  { department: 'General OPD', count: 420, percentage: 33, activeDoctors: 4, avgWaitTime: 16, capacity: 480, utilization: 88 },
  { department: 'Pediatrics', count: 215, percentage: 17, activeDoctors: 2, avgWaitTime: 15, capacity: 260, utilization: 83 },
  { department: 'Ayurveda & AYUSH', count: 185, percentage: 14, activeDoctors: 2, avgWaitTime: 12, capacity: 220, utilization: 84 },
  { department: 'Orthopedics', count: 160, percentage: 12, activeDoctors: 2, avgWaitTime: 24, capacity: 180, utilization: 89 },
  { department: 'ENT', count: 120, percentage: 9, activeDoctors: 1, avgWaitTime: 14, capacity: 140, utilization: 86 },
  { department: 'Dermatology', count: 98, percentage: 8, activeDoctors: 1, avgWaitTime: 18, capacity: 120, utilization: 82 },
  { department: 'Gynecology', count: 86, percentage: 7, activeDoctors: 1, avgWaitTime: 19, capacity: 100, utilization: 86 },
];

const HOURLY_LOAD: HourlyLoadItem[] = [
  { hour: '08:00 AM', patients: 84, walkIns: 60, appointments: 24 },
  { hour: '09:00 AM', patients: 168, walkIns: 110, appointments: 58 },
  { hour: '10:00 AM', patients: 215, walkIns: 135, appointments: 80 },
  { hour: '11:00 AM', patients: 194, walkIns: 120, appointments: 74 },
  { hour: '12:00 PM', patients: 152, walkIns: 92, appointments: 60 },
  { hour: '01:00 PM', patients: 98, walkIns: 62, appointments: 36 },
  { hour: '02:00 PM', patients: 136, walkIns: 84, appointments: 52 },
  { hour: '03:00 PM', patients: 122, walkIns: 76, appointments: 46 },
  { hour: '04:00 PM', patients: 78, walkIns: 50, appointments: 28 },
  { hour: '05:00 PM', patients: 37, walkIns: 25, appointments: 12 },
];

const DISEASE_CATEGORIES: DiseaseCategoryItem[] = [
  { category: 'Gastrointestinal & Digestive', count: 358, percentage: 28, commonCases: 'GERD, Dyspepsia, Gastritis, IBS' },
  { category: 'Respiratory & Pulmonary', count: 282, percentage: 22, commonCases: 'Allergic Rhinitis, Bronchitis, Asthma, URTI' },
  { category: 'Musculoskeletal & Joint', count: 244, percentage: 19, commonCases: 'Osteoarthritis, Lumbar Spondylosis, Myalgia' },
  { category: 'Metabolic & Endocrine', count: 205, percentage: 16, commonCases: 'Type 2 Diabetes, Hypertension, Dyslipidemia' },
  { category: 'Dermatological', count: 116, percentage: 9, commonCases: 'Eczema, Fungal Infections, Urticaria' },
  { category: 'General Health & Preventive', count: 79, percentage: 6, commonCases: 'Annual Checkup, Weakness, Lifestyle Care' },
];

const DOCTOR_PERFORMANCE: DoctorPerformanceItem[] = [
  { id: 'DOC-01', name: 'Dr. Priya Sharma', department: 'General OPD / Ayu', roomNumber: 'Room 4', consultationsToday: 32, averageConsultationMinutes: 13, status: 'In Consultation', waitingQueueCount: 3 },
  { id: 'DOC-02', name: 'Dr. Rajesh Kulkarni', department: 'Orthopedics', roomNumber: 'Room 2', consultationsToday: 26, averageConsultationMinutes: 19, status: 'In Consultation', waitingQueueCount: 4 },
  { id: 'DOC-03', name: 'Dr. Anjali Deshmukh', department: 'Pediatrics', roomNumber: 'Room 6', consultationsToday: 29, averageConsultationMinutes: 11, status: 'Available', waitingQueueCount: 1 },
  { id: 'DOC-04', name: 'Dr. Anita Roy', department: 'Gynecology', roomNumber: 'Room 5', consultationsToday: 24, averageConsultationMinutes: 17, status: 'In Consultation', waitingQueueCount: 2 },
  { id: 'DOC-05', name: 'Dr. Sandeep Varma', department: 'ENT', roomNumber: 'Room 3', consultationsToday: 22, averageConsultationMinutes: 14, status: 'Available', waitingQueueCount: 1 },
  { id: 'DOC-06', name: 'Dr. Manish Trivedi', department: 'Dermatology', roomNumber: 'Room 7', consultationsToday: 21, averageConsultationMinutes: 15, status: 'On Break', waitingQueueCount: 2 },
];

const STAFF_OPERATIONS: StaffOperationsItem[] = [
  { id: 'STF-01', name: 'Ananya Deshmukh', counter: 'Reception Desk 02', role: 'OPD Receptionist', shift: 'Morning Shift', status: 'Active', patientsHandledToday: 142, averageCheckInSeconds: 42 },
  { id: 'STF-02', name: 'Rahul Shinde', counter: 'Registration Counter 01', role: 'Registration Clerk', shift: 'Morning Shift', status: 'Active', patientsHandledToday: 156, averageCheckInSeconds: 38 },
  { id: 'STF-03', name: 'Sunita Rao', counter: 'Billing & PM-JAY Desk', role: 'Billing Operator', shift: 'Morning Shift', status: 'Active', patientsHandledToday: 118, averageCheckInSeconds: 55 },
  { id: 'STF-04', name: 'Vikas Patel', counter: 'Helpdesk & Kiosk Support', role: 'Patient Guide', shift: 'Morning Shift', status: 'Active', patientsHandledToday: 94, averageCheckInSeconds: 30 },
];

const AUDIT_LOGS: AdminAuditLog[] = [
  { id: 'AUD-001', timestamp: '10:48 AM', actorName: 'Ananya Deshmukh', actorRole: 'Staff', action: 'Patient Check-In', entity: 'Aarav Mehta (OPD-010)', department: 'General OPD', status: 'Success' },
  { id: 'AUD-002', timestamp: '10:42 AM', actorName: 'Dr. Priya Sharma', actorRole: 'Doctor', action: 'Finalize Consultation', entity: 'Rameshwar Patil (OPD-012)', department: 'General OPD', status: 'Success' },
  { id: 'AUD-003', timestamp: '10:39 AM', actorName: 'System Service', actorRole: 'System', action: 'ABHA Token Sync', entity: 'ABHA Gateway #44', department: 'NIC Integration', status: 'Success' },
  { id: 'AUD-004', timestamp: '10:34 AM', actorName: 'Rahul Shinde', actorRole: 'Staff', action: 'Patient Registration', entity: 'Devendra Rathore (OPD-017)', department: 'Front Desk', status: 'Success' },
  { id: 'AUD-005', timestamp: '10:28 AM', actorName: 'Rajesh Varma', actorRole: 'Admin', action: 'Updated OPD Capacity', entity: 'Orthopedics Room 2 (+20 slots)', department: 'Hospital Ops', status: 'Success' },
  { id: 'AUD-006', timestamp: '10:15 AM', actorName: 'Dr. Rajesh Kulkarni', actorRole: 'Doctor', action: 'Prescription Finalized', entity: 'Kavita Sundaram (OPD-014)', department: 'Orthopedics', status: 'Success' },
  { id: 'AUD-007', timestamp: '09:58 AM', actorName: 'Sunita Rao', actorRole: 'Staff', action: 'PM-JAY Verification', entity: 'Meenakshi Iyer (OPD-016)', department: 'Billing Desk', status: 'Success' },
  { id: 'AUD-008', timestamp: '09:42 AM', actorName: 'Ananya Deshmukh', actorRole: 'Staff', action: 'Token Re-routed', entity: 'Vikram Joshi (OPD-015)', department: 'Reception 02', status: 'Success' },
];

const ADMIN_REPORTS: AdminReportItem[] = [
  { id: 'REP-001', reportCode: 'D-OPD-01', title: 'Daily OPD Patient Census & Footfall Summary', category: 'OPD Operations', frequency: 'Daily', lastGenerated: 'Today, 06:00 AM', format: 'PDF', fileSize: '1.4 MB' },
  { id: 'REP-002', reportCode: 'W-WAIT-04', title: 'Weekly Average Waiting & Triage Latency Audit', category: 'Quality & Compliance', frequency: 'Weekly', lastGenerated: '20 Sep 2026', format: 'PDF', fileSize: '2.8 MB' },
  { id: 'REP-003', reportCode: 'M-DOC-02', title: 'Monthly Doctor Consultation Volume & Duration Breakdown', category: 'Clinical Analytics', frequency: 'Monthly', lastGenerated: '01 Sep 2026', format: 'Excel', fileSize: '3.6 MB' },
  { id: 'REP-004', reportCode: 'D-BILL-09', title: 'Daily PM-JAY & Free Healthcare Scheme Billing Audit', category: 'Financial & Billing', frequency: 'Daily', lastGenerated: 'Today, 07:30 AM', format: 'Excel', fileSize: '1.9 MB' },
  { id: 'REP-005', reportCode: 'M-DIS-03', title: 'Morbidity & Clinical Diagnosis Distribution Report', category: 'Clinical Analytics', frequency: 'Monthly', lastGenerated: '01 Sep 2026', format: 'PDF', fileSize: '4.2 MB' },
  { id: 'REP-006', reportCode: 'D-KIOSK-07', title: 'Self-Service MediKiosk Touch & Voice Usage Statistics', category: 'OPD Operations', frequency: 'Daily', lastGenerated: 'Today, 08:00 AM', format: 'PDF', fileSize: '980 KB' },
];

const USER_ROLES: AdminUserRoleItem[] = [
  { id: 'USR-01', fullName: 'Dr. Priya Sharma', username: 'dr.priya', email: 'priya.sharma@medikiosk.gov.in', role: 'Doctor', department: 'General OPD / Ayurveda', status: 'Active', lastActive: '2 mins ago', phone: '9876500001' },
  { id: 'USR-02', fullName: 'Dr. Rajesh Kulkarni', username: 'dr.rajesh', email: 'rajesh.kulkarni@medikiosk.gov.in', role: 'Doctor', department: 'Orthopedics', status: 'Active', lastActive: '5 mins ago', phone: '9876500002' },
  { id: 'USR-03', fullName: 'Dr. Anjali Deshmukh', username: 'dr.anjali', email: 'anjali.deshmukh@medikiosk.gov.in', role: 'Doctor', department: 'Pediatrics', status: 'Active', lastActive: '12 mins ago', phone: '9876500003' },
  { id: 'USR-04', fullName: 'Ananya Deshmukh', username: 'ananya.desk', email: 'ananya.d@medikiosk.gov.in', role: 'Staff', department: 'Front Desk Reception', status: 'Active', lastActive: 'Just now', phone: '9876500004' },
  { id: 'USR-05', fullName: 'Rahul Shinde', username: 'rahul.reg', email: 'rahul.s@medikiosk.gov.in', role: 'Staff', department: 'OPD Registration', status: 'Active', lastActive: '1 min ago', phone: '9876500005' },
  { id: 'USR-06', fullName: 'Sunita Rao', username: 'sunita.bill', email: 'sunita.r@medikiosk.gov.in', role: 'Staff', department: 'Billing & PM-JAY', status: 'Active', lastActive: '8 mins ago', phone: '9876500006' },
  { id: 'USR-07', fullName: 'Rajesh Varma', username: 'admin.rajesh', email: 'admin.varma@medikiosk.gov.in', role: 'Admin', department: 'Hospital Administration', status: 'Active', lastActive: 'Just now', phone: '9876500007' },
  { id: 'USR-08', fullName: 'Dr. Anita Roy', username: 'dr.anita', email: 'anita.roy@medikiosk.gov.in', role: 'Doctor', department: 'Gynecology', status: 'Active', lastActive: '18 mins ago', phone: '9876500008' },
];

export class MockAdminAnalyticsProvider {
  static getKpiMetrics(range: string = 'Today'): AdminKpiMetrics {
    if (range === 'Yesterday') {
      return { ...KPI_METRICS, totalPatients: 1198, consultationsCompleted: 890, appointmentCompletionRate: 82, averageWaitingTimeMinutes: 19 };
    }
    if (range === 'This Week') {
      return { ...KPI_METRICS, totalPatients: 7420, consultationsCompleted: 5410, appointmentCompletionRate: 85, averageWaitingTimeMinutes: 17 };
    }
    if (range === 'This Month') {
      return { ...KPI_METRICS, totalPatients: 31250, consultationsCompleted: 23140, appointmentCompletionRate: 86, averageWaitingTimeMinutes: 16 };
    }
    return KPI_METRICS;
  }

  static getOpdDistribution(): OpdDistributionItem[] {
    return [...OPD_DISTRIBUTION];
  }

  static getHourlyLoad(): HourlyLoadItem[] {
    return [...HOURLY_LOAD];
  }

  static getDiseaseCategories(): DiseaseCategoryItem[] {
    return [...DISEASE_CATEGORIES];
  }

  static getDoctorPerformance(): DoctorPerformanceItem[] {
    return [...DOCTOR_PERFORMANCE];
  }

  static getStaffOperations(): StaffOperationsItem[] {
    return [...STAFF_OPERATIONS];
  }

  static getAuditLogs(): AdminAuditLog[] {
    return [...AUDIT_LOGS];
  }

  static getReports(): AdminReportItem[] {
    return [...ADMIN_REPORTS];
  }

  static getUserRoles(): AdminUserRoleItem[] {
    return [...USER_ROLES];
  }

  static getPatientJourneyStats() {
    return {
      regToCheckInMinutes: 4,
      checkInToDoctorMinutes: 18,
      doctorToCompletionMinutes: 22,
      totalHospitalStayMinutes: 44,
      funnel: [
        { stage: 'Registration', count: 1284, dropRate: '0%' },
        { stage: 'Check-In Completed', count: 1190, dropRate: '7.3%' },
        { stage: 'Doctor Consultation', count: 974, dropRate: '1.2%' },
        { stage: 'Pharmacy / Diagnostics', count: 950, dropRate: '0.8%' },
        { stage: 'Visit Completed', count: 936, dropRate: '0%' },
      ]
    };
  }

  static getLiveHospitalStatus() {
    return {
      currentlyInHospital: 47,
      waitingInQueue: 12,
      inActiveConsultation: 5,
      completedToday: 30,
      totalAvailableDoctors: 12,
      averageRoomWaitMinutes: 18,
    };
  }
}

import { useState } from 'react';
import { 
  CreditCard, Search, CheckCircle2, 
  Receipt, Download, Clock, ShieldCheck, 
  Banknote, QrCode, Filter, X
} from 'lucide-react';
import { MockStaffProvider, type StaffAppointment } from '@/services/staff/MockStaffProvider';

interface BillingRecord {
  id: string;
  tokenDisplay: string;
  patientName: string;
  mobile: string;
  department: string;
  doctorName: string;
  category: 'General OPD' | 'Specialty' | 'PM-JAY Beneficiary' | 'Senior Citizen' | 'Follow-up';
  amount: number;
  paymentMode: 'Cash' | 'UPI / QR' | 'PM-JAY Scheme' | 'Exempted' | 'Card POS';
  status: 'Paid' | 'Exempted' | 'PM-JAY Covered' | 'Pending';
  receiptNo: string;
  timestamp: string;
}

export default function StaffBilling() {
  const [appointments] = useState<StaffAppointment[]>(MockStaffProvider.getAppointments());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Pending' | 'PM-JAY Covered' | 'Exempted'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<BillingRecord | null>(null);

  // Generate deterministic billing list from appointments
  const billingRecords: BillingRecord[] = appointments.map((apt, idx) => {
    let category: BillingRecord['category'] = 'General OPD';
    let amount = 50;
    let mode: BillingRecord['paymentMode'] = 'Cash';

    if (apt.paymentStatus === 'PM-JAY Covered') {
      category = 'PM-JAY Beneficiary';
      amount = 0;
      mode = 'PM-JAY Scheme';
    } else if (apt.paymentStatus === 'Exempted' || apt.age >= 60) {
      category = 'Senior Citizen';
      amount = 0;
      mode = 'Exempted';
    } else if (apt.opdDepartment === 'Orthopedics' || apt.opdDepartment === 'Dermatology') {
      category = 'Specialty';
      amount = 150;
      mode = idx % 2 === 0 ? 'UPI / QR' : 'Card POS';
    } else if (apt.appointmentType === 'Follow-up') {
      category = 'Follow-up';
      amount = 20;
      mode = 'UPI / QR';
    }

    return {
      id: `BIL-2026-${(idx + 1).toString().padStart(3, '0')}`,
      tokenDisplay: apt.tokenDisplay,
      patientName: apt.patientName,
      mobile: apt.mobile,
      department: apt.opdDepartment,
      doctorName: apt.doctorName,
      category,
      amount,
      paymentMode: mode,
      status: apt.paymentStatus,
      receiptNo: `RCPT-0${100 + idx}`,
      timestamp: apt.registeredAt,
    };
  });

  const filteredRecords = billingRecords.filter(item => {
    const matchesSearch = 
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tokenDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mobile.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCollected = billingRecords
    .filter(r => r.status === 'Paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const pmjayClaims = billingRecords.filter(r => r.status === 'PM-JAY Covered').length;
  const exemptedCount = billingRecords.filter(r => r.status === 'Exempted').length;
  const pendingCount = billingRecords.filter(r => r.status === 'Pending').length;

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payments &amp; OPD Billing</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Front-desk OPD fee collection, Ayushman Bharat PM-JAY registration, and official receipt generation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Shift Register: Counter #02
          </span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Collected Today</span>
            <Banknote className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">₹{totalCollected.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">From standard OPD registration fees</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>PM-JAY Claims</span>
            <ShieldCheck className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl font-bold text-teal-800">{pmjayClaims}</div>
          <div className="text-[11px] text-teal-700 mt-1">100% cashless under govt scheme</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Exempted / Free</span>
            <CheckCircle2 className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{exemptedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Senior citizen &amp; hospital staff passes</div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Pending Fees</span>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold text-amber-800">{pendingCount}</div>
          <div className="text-[11px] text-amber-700 mt-1">Awaiting counter clearance</div>
        </div>
      </div>

      {/* Main Billing Table Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Patient, Token, Receipt No..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            {(['all', 'Paid', 'Pending', 'PM-JAY Covered', 'Exempted'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors capitalize ${
                  statusFilter === status
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {status === 'all' ? 'All Transactions' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Token / Patient</th>
                <th className="py-3 px-4">OPD / Doctor</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No billing records match your filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {item.receiptNo}
                      <span className="block text-[10px] text-slate-400 font-normal">{item.timestamp}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 font-mono font-bold rounded text-[11px] border border-slate-200">
                          {item.tokenDisplay}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">{item.patientName}</p>
                          <p className="text-[10px] text-slate-500">{item.mobile}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{item.department}</p>
                      <p className="text-[10px] text-slate-500">{item.doctorName}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-600 font-medium">{item.category}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.amount === 0 ? '₹0.00' : `₹${item.amount}.00`}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                        {item.paymentMode === 'UPI / QR' && <QrCode className="w-3 h-3 text-teal-700" />}
                        {item.paymentMode === 'Cash' && <Banknote className="w-3 h-3 text-emerald-700" />}
                        {item.paymentMode === 'Card POS' && <CreditCard className="w-3 h-3 text-blue-700" />}
                        {item.paymentMode === 'PM-JAY Scheme' && <ShieldCheck className="w-3 h-3 text-teal-700" />}
                        {item.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        item.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.status === 'PM-JAY Covered'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : item.status === 'Exempted'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <div className="w-10 h-10 bg-teal-50 text-teal-800 rounded-lg flex items-center justify-center font-bold text-sm mx-auto mb-2 border border-teal-200">
                MK
              </div>
              <h2 className="text-base font-bold text-slate-900">MediKiosk Civil Hospital</h2>
              <p className="text-xs text-slate-500">Government OPD &amp; Diagnostic Center</p>
              <p className="text-[11px] font-mono text-slate-400 mt-1">Official Payment Voucher</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt Number:</span>
                <span className="font-mono font-bold text-slate-800">{selectedReceipt.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date &amp; Time:</span>
                <span className="text-slate-800">{new Date().toLocaleDateString('en-IN')} {selectedReceipt.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Token Number:</span>
                <span className="font-mono font-bold text-teal-800">{selectedReceipt.tokenDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department / OPD:</span>
                <span className="text-slate-800">{selectedReceipt.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attending Doctor:</span>
                <span className="text-slate-800">{selectedReceipt.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="text-slate-800 font-semibold">{selectedReceipt.paymentMode}</span>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-700">Total Amount:</span>
                <span className="text-slate-900">
                  {selectedReceipt.amount === 0 ? '₹0.00 (Exempted)' : `₹${selectedReceipt.amount}.00`}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert(`Receipt #${selectedReceipt.receiptNo} sent to thermal printer.`);
                  setSelectedReceipt(null);
                }}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, RefreshCw, ArrowLeft 
} from 'lucide-react';
import { MockStaffProvider, type StaffAppointment } from '@/services/staff/MockStaffProvider';

export default function StaffQueue() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<StaffAppointment[]>([]);
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = (manual = false) => {
    if (manual) setIsRefreshing(true);
    setQueue(MockStaffProvider.getQueue());
    if (manual) setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 5000);
    return () => clearInterval(interval);
  }, []);

  const departments = [
    { name: 'All', room: 'All Rooms', activeToken: '—', count: queue.length },
    { name: 'General OPD', room: 'Room 4', activeToken: 'OPD-012', count: queue.filter(q => q.opdDepartment === 'General OPD').length },
    { name: 'Ayurveda', room: 'Room 4', activeToken: 'OPD-013', count: queue.filter(q => q.opdDepartment === 'Ayurveda').length },
    { name: 'Orthopedics', room: 'Room 2', activeToken: 'OPD-014', count: queue.filter(q => q.opdDepartment === 'Orthopedics').length },
    { name: 'Pediatrics', room: 'Room 6', activeToken: 'OPD-015', count: queue.filter(q => q.opdDepartment === 'Pediatrics').length },
  ];

  const filteredQueue = queue.filter(item => {
    const matchDept = selectedDept === 'All' || item.opdDepartment === selectedDept;
    const matchSearch = searchTerm.trim() === '' ||
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tokenDisplay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mobile.includes(searchTerm);
    return matchDept && matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Live OPD Queue Management</h1>
              <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Live Tracker</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Real-time room occupancy, waiting order, and patient triage status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            className="h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-700' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* 2. Department Room Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {departments.map((d) => {
          const isSelected = selectedDept === d.name;
          return (
            <button
              key={d.name}
              onClick={() => setSelectedDept(d.name)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-2xs ${
                isSelected
                  ? 'bg-teal-900 text-white border-teal-900 ring-2 ring-teal-600/30'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>
                  {d.room}
                </span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-600'}`}>
                  {d.count} waiting
                </span>
              </div>
              <p className="font-bold text-sm truncate">{d.name}</p>
              <div className="mt-2 pt-2 border-t border-slate-200/40 flex justify-between items-center text-[11px]">
                <span className={isSelected ? 'text-teal-200' : 'text-slate-500'}>Now Calling:</span>
                <span className={`font-mono font-bold ${isSelected ? 'text-teal-100' : 'text-teal-800'}`}>{d.activeToken}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Filterable Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search token, patient name, or mobile..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            Showing {filteredQueue.length} queue entries for <span className="font-bold text-slate-800">{selectedDept}</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Specialty</th>
                <th className="py-3 px-4">Doctor & Room</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Waiting Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredQueue.length > 0 ? (
                filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-teal-800 text-sm">
                      {item.tokenDisplay}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{item.patientName}</p>
                      <p className="text-[10px] text-slate-400">{item.age}y • {item.gender} • {item.mobile}</p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {item.opdDepartment}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-800">{item.doctorName}</p>
                      <p className="text-[10px] text-slate-400">{item.roomNumber}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === 'Waiting' && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                          Waiting
                        </span>
                      )}
                      {item.status === 'In Consultation' && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                          In Consult.
                        </span>
                      )}
                      {item.status === 'Checked In' && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase">
                          Checked In
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600">
                      {item.waitingMinutes > 0 ? `${item.waitingMinutes} mins` : 'Just checked in'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/staff/movement?patientId=${item.id}`)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Flow Track
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    No waiting patients in this OPD queue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  FlaskConical, 
  Cpu, 
  BarChart3, 
  ShieldAlert, 
  Plus, 
  Clock,
  Search,
  Sliders,
  X
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { StaffMember } from '../../types';

export const HospitalAdminView: React.FC = () => {
  const {
    currentHospital,
    staffMembers,
    labMachines,
    departments,
    tests,
    counters,
    patients,
    queueTokens,
    auditLogs,
    createStaffMember,
    toggleStaffStatus,
    updateLabAvailability,
    updateMachineCounts
  } = useHospitalStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'labs' | 'machines' | 'analytics' | 'audit'>('overview');

  // Staff creation modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState<StaffMember['role']>('lab_staff');
  const [staffLabId, setStaffLabId] = useState<string>(departments[0]?.id || 'dept-pathology');
  const [staffPassword, setStaffPassword] = useState('staff123');

  // Filter staff
  const [staffSearch, setStaffSearch] = useState('');
  const filteredStaff = staffMembers.filter(s =>
    s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.staffId.toLowerCase().includes(staffSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(staffSearch.toLowerCase())
  );

  // Analytics derivations
  const totalCompletedToday = queueTokens.filter(t => t.status === 'completed').length;
  const totalWaiting = queueTokens.filter(t => t.status === 'waiting').length;
  const avgWait = counters.length > 0 
    ? Math.round(counters.reduce((acc, c) => acc + c.averageServiceMinutes, 0) / counters.length * 3)
    : 18;

  const handleCreateStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim()) return;

    const assignedLab = departments.find(d => d.id === staffLabId);
    const codeNum = staffMembers.length + 1;

    createStaffMember({
      hospitalId: currentHospital.id,
      staffId: `STAFF-${staffRole.substring(0, 3).toUpperCase()}-${codeNum < 10 ? '0' + codeNum : codeNum}`,
      name: staffName.trim(),
      email: staffEmail.trim() || `staff${codeNum}@${currentHospital.code?.toLowerCase() || 'qcare'}.demo`,
      phone: staffPhone.trim() || '+91 99000 00000',
      role: staffRole,
      assignedLabId: staffRole === 'lab_staff' ? staffLabId : undefined,
      assignedLabName: staffRole === 'lab_staff' ? assignedLab?.name : undefined,
      status: 'active',
      password: staffPassword || 'staff123'
    });

    setIsStaffModalOpen(false);
    setStaffName('');
    setStaffEmail('');
    setStaffPhone('');
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {currentHospital.name}
                </h1>
                <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {currentHospital.code || 'QCARE-HOSP-001'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hospital Administration & Resource Configuration Console
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStaffModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Staff Account</span>
          </button>
        </div>
      </div>

      {/* Hospital Admin Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200/80 pb-3">
        {[
          { id: 'overview', label: 'Console Overview', icon: <Sliders className="w-3.5 h-3.5" /> },
          { id: 'staff', label: `Staff Accounts (${staffMembers.length})`, icon: <Users className="w-3.5 h-3.5" /> },
          { id: 'labs', label: `Diagnostic Labs (${departments.length})`, icon: <FlaskConical className="w-3.5 h-3.5" /> },
          { id: 'machines', label: `Machine Inventory (${labMachines.length})`, icon: <Cpu className="w-3.5 h-3.5" /> },
          { id: 'analytics', label: 'Hospital Analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
          { id: 'audit', label: `Audit Log (${auditLogs.length})`, icon: <ShieldAlert className="w-3.5 h-3.5" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Active Hospital Staff</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{staffMembers.length}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">Across 4 Medical Roles</div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Patients in Queue Today</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{patients.length}</div>
              <div className="text-[11px] text-blue-600 font-semibold mt-1">{totalWaiting} Currently Waiting</div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Tests Completed & Verified</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalCompletedToday}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-1">Verified with digital signoff</div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Avg Hospital Wait Time</span>
              <div className="text-2xl font-black text-slate-900 mt-1">~{avgWait} min</div>
              <div className="text-[11px] text-slate-500 mt-1">Optimized by QCare Smart Router</div>
            </div>
          </div>

          {/* Machine Breakdown & Active Machine Controls */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Quick Machine & Lab Status Control
                </h3>
                <p className="text-xs text-slate-500">
                  Adjust active machines or lab availability. If active machines drop to 0, system marks lab unavailable and reroutes patients dynamically.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {departments.slice(0, 4).map(dept => {
                const isUnavailable = dept.availabilityStatus === 'unavailable';
                const mach = labMachines.find(m => m.departmentId === dept.id);
                const activeCount = mach?.activeCount ?? 1;
                const totalCount = mach?.totalCount ?? 2;

                return (
                  <div key={dept.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{dept.name.split('&')[0]}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isUnavailable ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {dept.availabilityStatus || 'Available'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex justify-between items-center">
                      <span>Active Machines:</span>
                      <span className="font-mono font-bold text-slate-900">{activeCount} / {totalCount}</span>
                    </div>

                    {/* Quick Active Count Toggles */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => updateMachineCounts(dept.id, totalCount, Math.max(0, activeCount - 1))}
                        disabled={activeCount <= 0}
                        className="flex-1 py-1 px-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                      >
                        - Breakdown
                      </button>
                      <button
                        onClick={() => updateMachineCounts(dept.id, totalCount, Math.min(totalCount, activeCount + 1))}
                        disabled={activeCount >= totalCount}
                        className="flex-1 py-1 px-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-40"
                      >
                        + Restore
                      </button>
                    </div>

                    <button
                      onClick={() => updateLabAvailability(dept.id, isUnavailable ? 'available' : 'unavailable')}
                      className={`w-full py-1 rounded-xl text-[10px] font-bold border transition-colors ${
                        isUnavailable
                          ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                          : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      {isUnavailable ? 'Mark Available' : 'Simulate Downtime'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF MANAGEMENT */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-sm text-slate-900">Hospital Staff Accounts</h2>
              <p className="text-[11px] text-slate-500">
                Role-based staff credentials for this hospital workspace
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={staffSearch}
                onChange={e => setStaffSearch(e.target.value)}
                placeholder="Search staff name or ID..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Staff Member</th>
                  <th className="py-3 px-4">Staff ID</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Assigned Lab / Desk</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStaff.map(st => {
                  const isActive = st.status !== 'inactive';
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-5">
                        <div className="font-bold text-slate-900">{st.name}</div>
                        <div className="text-[11px] text-slate-400">{st.email} • {st.phone}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {st.staffId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-semibold text-slate-800">
                          {st.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {st.assignedLabName || 'Hospital Wide'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => toggleStaffStatus(st.id, isActive ? 'inactive' : 'active')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                            isActive
                              ? 'border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DIAGNOSTIC LABS */}
      {activeTab === 'labs' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Configured Diagnostic Laboratories & Tests
            </h3>
            <p className="text-xs text-slate-500">
              Processing durations, preparation instructions, and counter availability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tests.slice(0, 6).map(test => {
              const dept = departments.find(d => d.id === test.departmentId);
              return (
                <div key={test.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{test.name}</span>
                    <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md text-[10px]">
                      {test.code}
                    </span>
                  </div>
                  <div className="text-slate-600 flex items-center justify-between text-[11px]">
                    <span>Average Duration: <strong>{test.averageDurationMinutes} min</strong></span>
                    <span>Standard Fee: ₹{test.standardPrice}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] bg-white p-2 rounded-xl border border-slate-200/80">
                    <span className="font-bold text-slate-700 block text-[10px]">Preparation Rule:</span>
                    {test.preparationNotes}
                  </div>
                  <div className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Location: {dept?.location.room} ({dept?.location.floor}, {dept?.location.wing})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: MACHINES INVENTORY */}
      {activeTab === 'machines' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Lab Machine & Diagnostic Hardware Inventory
            </h3>
            <p className="text-xs text-slate-500">
              Simulate machine breakdown or maintenance to dynamically alter waiting times
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labMachines.map(mach => {
              const dept = departments.find(d => d.id === mach.departmentId);
              return (
                <div key={mach.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{mach.name}</h4>
                      <p className="text-[11px] text-slate-500">{dept?.name}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      mach.status === 'operational'
                        ? 'bg-emerald-100 text-emerald-800'
                        : mach.status === 'degraded'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {mach.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Active Units</span>
                      <span className="text-xl font-black text-slate-900">{mach.activeCount} / {mach.totalCount}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateMachineCounts(mach.departmentId, mach.totalCount, Math.max(0, mach.activeCount - 1))}
                        disabled={mach.activeCount <= 0}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold disabled:opacity-40"
                      >
                        - Breakdown
                      </button>
                      <button
                        onClick={() => updateMachineCounts(mach.departmentId, mach.totalCount, Math.min(mach.totalCount, mach.activeCount + 1))}
                        disabled={mach.activeCount >= mach.totalCount}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold disabled:opacity-40"
                      >
                        + Restore
                      </button>
                    </div>
                  </div>

                  {mach.notes && (
                    <p className="text-[10px] text-slate-400 italic">
                      Note: {mach.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Queue Throughput</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patients Processed Today</span>
                  <span className="font-bold text-slate-900">{patients.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tests Completed Today</span>
                  <span className="font-bold text-slate-900">{totalCompletedToday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Peak Hour</span>
                  <span className="font-bold text-slate-900">09:00 AM – 11:30 AM</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Busiest Diagnostic Stations</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Hematology / Blood Collection</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">High</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Cardiology (12-Lead ECG)</span>
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Moderate</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Ultrasonography & Doppler</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Optimal</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Efficiency Metric</h4>
              <div className="text-center py-2">
                <div className="text-3xl font-black text-blue-600">~38%</div>
                <p className="text-[11px] text-slate-500 mt-1">Average Wait Time Saved per Patient</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">
              Staff Clinical & Administrative Audit Trail
            </h3>
            <p className="text-xs text-slate-500">
              Immutable chronological records of patient creation, test status changes, and machine adjustments
            </p>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {auditLogs.map(log => (
              <div key={log.id} className="p-4 hover:bg-slate-50/60 text-xs flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                      {log.staffRole}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{log.details}</p>
                  <p className="text-slate-400 text-[10px]">
                    By: <strong>{log.staffName}</strong> ({log.staffId})
                    {log.patientName && ` • Patient: ${log.patientName}`}
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Staff Account Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Create Staff Account</h3>
                <p className="text-[11px] text-blue-100">Assign role and permissions in this hospital</p>
              </div>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaffSubmit} className="p-5 space-y-3.5 text-xs text-slate-800">
              <div>
                <label className="font-bold block text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={e => setStaffName(e.target.value)}
                  placeholder="e.g. Ramesh Kulkarni"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Role *</label>
                  <select
                    value={staffRole}
                    onChange={e => setStaffRole(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                  >
                    <option value="lab_staff">Lab Staff</option>
                    <option value="doctor_assistant">Doctor Assistant</option>
                    <option value="reception">Reception Staff</option>
                    <option value="hospital_admin">Hospital Admin</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Assigned Lab</label>
                  <select
                    value={staffLabId}
                    onChange={e => setStaffLabId(e.target.value)}
                    disabled={staffRole !== 'lab_staff'}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold disabled:opacity-40"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name.split(' ')[0]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={e => setStaffEmail(e.target.value)}
                    placeholder="staff@qcare.demo"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={staffPhone}
                    onChange={e => setStaffPhone(e.target.value)}
                    placeholder="+91 99000 00000"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block text-slate-700 mb-1">Password</label>
                <input
                  type="text"
                  value={staffPassword}
                  onChange={e => setStaffPassword(e.target.value)}
                  placeholder="staff123"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-all"
                >
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

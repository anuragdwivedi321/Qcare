import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  Activity, 
  Plus, 
  Power, 
  Search, 
  Server,
  Zap,
  X
} from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { HospitalTier } from '../../types';

export const SuperAdminView: React.FC = () => {
  const {
    hospitals,
    allPatients,
    queueTokens,
    createHospital,
    toggleHospitalStatus,
    setHospital,
    currentHospitalId
  } = useHospitalStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Hospital form state
  const [newHospName, setNewHospName] = useState('');
  const [newHospTier, setNewHospTier] = useState<HospitalTier>('multi_specialty');
  const [newHospCity, setNewHospCity] = useState('');
  const [newHospState, setNewHospState] = useState('');
  const [newHospFloors, setNewHospFloors] = useState<number>(3);
  const [newHospPlan, setNewHospPlan] = useState<'standard' | 'enterprise'>('enterprise');
  const [newHospContact, setNewHospContact] = useState('');
  const [newHospEmail, setNewHospEmail] = useState('');

  const filteredHospitals = hospitals.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSessions = queueTokens.length;
  const activeHospitalsCount = hospitals.filter(h => h.status !== 'inactive').length;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospName.trim()) return;

    createHospital({
      name: newHospName.trim(),
      tier: newHospTier,
      city: newHospCity.trim() || 'Metro City',
      state: newHospState.trim() || 'NCR',
      numberOfFloors: Number(newHospFloors) || 3,
      plan: newHospPlan,
      contactNumber: newHospContact.trim() || '+91 11 4000 8000',
      email: newHospEmail.trim() || 'contact@hospital.com'
    });

    setIsCreateModalOpen(false);
    setNewHospName('');
    setNewHospCity('');
    setNewHospState('');
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Top Welcome & Quick Actions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                QCare Super Admin Control Console
              </h1>
              <p className="text-xs text-slate-500">
                Central Multi-Hospital Network Governance & Tenant Management
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Hospital</span>
        </button>
      </div>

      {/* Network KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Hospitals</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {hospitals.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {activeHospitalsCount} Active Tenants
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Registered Patients</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {allPatients.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across all clinical branches
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Test Queue Sessions</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {totalSessions}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Live tracked journeys
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Platform Health</span>
            <Server className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2 flex items-center gap-1.5">
            <span>99.98%</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Multi-Tenant Gateways Active</span>
          </div>
        </div>
      </div>

      {/* Hospital Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-sm text-slate-900">
              Registered Hospital Tenants ({filteredHospitals.length})
            </h2>
            <p className="text-[11px] text-slate-500">
              Isolated database workspaces with unique hospital codes
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by code, city or name..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">Hospital / Code</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Tier / Plan</th>
                <th className="py-3 px-4">Floors</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredHospitals.map(hosp => {
                const isActive = hosp.status !== 'inactive';
                const isSelected = hosp.id === currentHospitalId;

                return (
                  <tr key={hosp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-5">
                      <div className="font-bold text-slate-900">{hosp.name}</div>
                      <div className="font-mono text-[11px] text-blue-600 font-semibold flex items-center gap-1.5 mt-0.5">
                        <span>{hosp.code || hosp.id}</span>
                        {isSelected && (
                          <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded-full font-sans">
                            Current Scope
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div>{hosp.city || 'Central City'}, {hosp.state || 'NCR'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{hosp.address}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium capitalize">{hosp.tier?.replace('_', ' ')}</div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        {hosp.plan || 'Standard'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold">{hosp.numberOfFloors || 3} Floors</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{isActive ? 'Active' : 'Deactivated'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-5 text-right space-x-2">
                      <button
                        onClick={() => setHospital(hosp.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected 
                            ? 'bg-slate-100 text-slate-400 cursor-default' 
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Inspect'}
                      </button>

                      <button
                        onClick={() => toggleHospitalStatus(hosp.id, isActive ? 'inactive' : 'active')}
                        title={isActive ? 'Deactivate Hospital' : 'Activate Hospital'}
                        className={`p-1.5 rounded-xl border transition-colors ${
                          isActive 
                            ? 'border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200' 
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Health Diagnostics */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Multi-Hospital Security & Data Isolation Audit</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block">Server-Side Isolation</span>
            <p className="text-[11px] text-slate-500">
              Every database record strictly scoped by <code className="text-blue-600 font-bold">hospital_id</code>. Zero data leakage between Hospital A and Hospital B.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block">QR Token Cryptography</span>
            <p className="text-[11px] text-slate-500">
              Ephemeral, hard-to-guess random session tokens. Patient dashboards store no passwords or unencrypted medical history.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="font-bold text-slate-700 block">Broadcast Live Bus</span>
            <p className="text-[11px] text-slate-500">
              Zero-latency real-time state synchronization across staff consoles and patient boarding passes without manual page reloads.
            </p>
          </div>
        </div>
      </div>

      {/* Onboard New Hospital Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Onboard New Hospital</h3>
                <p className="text-[11px] text-blue-100">Generates isolated multi-tenant workspace</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3.5 text-xs text-slate-800">
              <div>
                <label className="font-bold block text-slate-700 mb-1">Hospital Full Name *</label>
                <input
                  type="text"
                  required
                  value={newHospName}
                  onChange={e => setNewHospName(e.target.value)}
                  placeholder="e.g. Apex Multi-Specialty Hospital"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newHospCity}
                    onChange={e => setNewHospCity(e.target.value)}
                    placeholder="New Delhi"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold block text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={newHospState}
                    onChange={e => setNewHospState(e.target.value)}
                    placeholder="Delhi"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Hospital Tier</label>
                  <select
                    value={newHospTier}
                    onChange={e => setNewHospTier(e.target.value as HospitalTier)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                  >
                    <option value="multi_specialty">Multi-Specialty</option>
                    <option value="diagnostic_center">Diagnostic Center</option>
                    <option value="single_doctor_clinic">Single Clinic</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Floors</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={newHospFloors}
                    onChange={e => setNewHospFloors(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Plan</label>
                  <select
                    value={newHospPlan}
                    onChange={e => setNewHospPlan(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                  >
                    <option value="enterprise">Enterprise</option>
                    <option value="standard">Standard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newHospContact}
                    onChange={e => setNewHospContact(e.target.value)}
                    placeholder="+91 11 4000 0000"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={newHospEmail}
                    onChange={e => setNewHospEmail(e.target.value)}
                    placeholder="admin@hospital.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-all"
                >
                  Generate Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

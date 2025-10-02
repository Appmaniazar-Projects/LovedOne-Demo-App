import React, { useState } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { mockDeceasedProfiles } from '../../data/mockData';
import CaseCard from './CaseCard';
import { DeceasedProfile } from '../../types';

const Cases: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [cases, setCases] = useState<DeceasedProfile[]>(mockDeceasedProfiles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    dateOfBirth: '',
    dateOfDeath: '',
    serviceType: 'burial' as DeceasedProfile['serviceType'],
    status: 'quote' as DeceasedProfile['status'],
    assignedDirector: '',
    clientId: '',
    culturalRequirements: '',
    picture: ''
  });

  const filteredCases = cases.filter(caseData => {
    const matchesSearch = caseData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseData.assignedDirector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || caseData.status === statusFilter;
    const matchesService = serviceFilter === 'all' || caseData.serviceType === serviceFilter;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  const resetForm = () => {
    setForm({
      name: '',
      dateOfBirth: '',
      dateOfDeath: '',
      serviceType: 'burial',
      status: 'quote',
      assignedDirector: '',
      clientId: '',
      culturalRequirements: '',
      picture: ''
    });
  };

  const handleAddCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.dateOfBirth || !form.dateOfDeath || !form.assignedDirector || !form.clientId) {
      // Basic required validation
      return;
    }

    const newCase: DeceasedProfile = {
      id: (cases.length + 1).toString(),
      name: form.name,
      dateOfBirth: new Date(form.dateOfBirth),
      dateOfDeath: new Date(form.dateOfDeath),
      picture: form.picture || undefined,
      serviceType: form.serviceType,
      status: form.status,
      assignedDirector: form.assignedDirector,
      clientId: form.clientId,
      culturalRequirements: form.culturalRequirements || undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setCases(prev => [newCase, ...prev]);
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fadeInDown">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cases</h1>
          <p className="text-slate-600 dark:text-gray-300">Manage deceased profiles and service cases</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2 hover:scale-105 hover:shadow-lg">
          <Plus className="w-5 h-5" />
          <span>New Case</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-400 dark:text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="quote">Quote</option>
              <option value="ongoing">Ongoing</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Services</option>
            <option value="burial">Burial</option>
            <option value="cremation">Cremation</option>
            <option value="memorial">Memorial</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-all duration-300 hover:shadow-md hover:scale-105 cursor-pointer">
          <p className="text-sm text-slate-600 dark:text-gray-300">Total Cases</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{cases.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-all duration-300 hover:shadow-md hover:scale-105 cursor-pointer">
          <p className="text-sm text-slate-600 dark:text-gray-300">Active Cases</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {cases.filter(c => c.status === 'ongoing').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-all duration-300 hover:shadow-md hover:scale-105 cursor-pointer">
          <p className="text-sm text-slate-600 dark:text-gray-300">Quotes</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {cases.filter(c => c.status === 'quote').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-all duration-300 hover:shadow-md hover:scale-105 cursor-pointer">
          <p className="text-sm text-slate-600 dark:text-gray-300">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {cases.filter(c => c.status === 'closed').length}
          </p>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.length > 0 ? (
          filteredCases.map((caseData, index) => (
            <div key={caseData.id} className="animate-fadeInUp" style={{ animationDelay: `${300 + index * 50}ms` }}>
              <CaseCard
                case={caseData}
                onClick={() => console.log('View case', caseData.id)}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <p className="text-slate-500 dark:text-gray-400">No cases found matching your criteria</p>
          </div>
        )}
      </div>

      {filteredCases.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-400 text-lg">No cases found</div>
          <p className="text-slate-500 mt-2">Try adjusting your search or filters</p>
        </div>
      )}

      {/* New Case Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="rounded-lg shadow-2xl p-8 w-full max-w-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 animate-fadeInUp">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">New Case</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleAddCase} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Assigned Director</label>
                  <input value={form.assignedDirector} onChange={(e) => setForm({ ...form, assignedDirector: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Date of Death</label>
                  <input type="date" value={form.dateOfDeath} onChange={(e) => setForm({ ...form, dateOfDeath: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" required />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Service Type</label>
                  <select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value as DeceasedProfile['serviceType'] })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white">
                    <option value="burial">Burial</option>
                    <option value="cremation">Cremation</option>
                    <option value="memorial">Memorial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DeceasedProfile['status'] })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white">
                    <option value="quote">Quote</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Client ID</label>
                  <input value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" placeholder="e.g. 1" required />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Picture URL (optional)</label>
                  <input value={form.picture} onChange={(e) => setForm({ ...form, picture: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Cultural Requirements (optional)</label>
                  <textarea value={form.culturalRequirements} onChange={(e) => setForm({ ...form, culturalRequirements: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" rows={3} />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button type="button" onClick={() => { setIsModalOpen(false); }} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Add Case</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases;
import React, { useState } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { mockDeceasedProfiles } from '../../data/mockData';
import CaseCard from './CaseCard';

const Cases: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');

  const filteredCases = mockDeceasedProfiles.filter(caseData => {
    const matchesSearch = caseData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseData.assignedDirector.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || caseData.status === statusFilter;
    const matchesService = serviceFilter === 'all' || caseData.serviceType === serviceFilter;
    
    return matchesSearch && matchesStatus && matchesService;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cases</h1>
          <p className="text-slate-600">Manage deceased profiles and service cases</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>New Case</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Services</option>
            <option value="burial">Burial</option>
            <option value="cremation">Cremation</option>
            <option value="memorial">Memorial</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Total Cases</p>
          <p className="text-2xl font-bold text-slate-900">{mockDeceasedProfiles.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Active Cases</p>
          <p className="text-2xl font-bold text-blue-600">
            {mockDeceasedProfiles.filter(c => c.status === 'ongoing').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Quotes</p>
          <p className="text-2xl font-bold text-yellow-600">
            {mockDeceasedProfiles.filter(c => c.status === 'quote').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {mockDeceasedProfiles.filter(c => c.status === 'closed').length}
          </p>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.map((caseData) => (
          <CaseCard
            key={caseData.id}
            case={caseData}
            onClick={() => console.log('Case clicked:', caseData.id)}
          />
        ))}
      </div>

      {filteredCases.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-400 text-lg">No cases found</div>
          <p className="text-slate-500 mt-2">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default Cases;
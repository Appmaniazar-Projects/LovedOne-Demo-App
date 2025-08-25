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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cases</h1>
          <p className="text-slate-600 dark:text-gray-300">Manage deceased profiles and service cases</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>New Case</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-300">Total Cases</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{mockDeceasedProfiles.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-300">Active Cases</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {mockDeceasedProfiles.filter(c => c.status === 'ongoing').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-300">Quotes</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {mockDeceasedProfiles.filter(c => c.status === 'quote').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-300">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {mockDeceasedProfiles.filter(c => c.status === 'closed').length}
          </p>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.length > 0 ? (
          filteredCases.map((caseData) => (
            <CaseCard
              key={caseData.id}
              case={caseData}
              onClick={() => console.log('View case', caseData.id)}
            />
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
    </div>
  );
};

export default Cases;
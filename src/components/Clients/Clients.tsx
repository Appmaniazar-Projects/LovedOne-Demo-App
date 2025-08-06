import React, { useState } from 'react';
import { Plus, Search, Phone, Mail, MapPin, Users } from 'lucide-react';
import { mockClients } from '../../data/mockData';

const Clients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = mockClients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-600">Manage family contacts and relationships</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>New Client</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search clients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Clients</p>
              <p className="text-2xl font-bold text-slate-900">{mockClients.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Active Cases</p>
          <p className="text-2xl font-bold text-blue-600">12</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">New This Month</p>
          <p className="text-2xl font-bold text-green-600">5</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Satisfaction Rate</p>
          <p className="text-2xl font-bold text-purple-600">98%</p>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">
                    {client.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{client.name}</h3>
                  <p className="text-sm text-slate-500">{client.relationship}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Mail className="w-4 h-4" />
                <span>{client.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Phone className="w-4 h-4" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4" />
                <span>{client.address}</span>
              </div>
            </div>

            {client.culturalPreferences && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Cultural Preferences:</span> {client.culturalPreferences}
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Added: {client.createdAt.toLocaleDateString()}</span>
                <button className="text-blue-600 hover:text-blue-800 font-medium">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <div className="text-slate-400 text-lg">No clients found</div>
          <p className="text-slate-500 mt-2">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
};

export default Clients;
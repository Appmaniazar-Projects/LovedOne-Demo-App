import React, { useState } from 'react';
import { Plus, Search, Calendar, MapPin, Users, Clock, Filter } from 'lucide-react';
import { mockServices } from '../../data/mockData';
import { Service } from '../../types';

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || service.type === typeFilter;
    
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = new Date(service.date).toDateString() === new Date().toDateString();
    } else if (dateFilter === 'week') {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      matchesDate = new Date(service.date) <= weekFromNow;
    } else if (dateFilter === 'month') {
      const monthFromNow = new Date();
      monthFromNow.setMonth(monthFromNow.getMonth() + 1);
      matchesDate = new Date(service.date) <= monthFromNow;
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'funeral':
        return '⚱️';
      case 'memorial':
        return '🕯️';
      case 'cremation':
        return '🔥';
      case 'burial':
        return '⚰️';
      default:
        return '🏛️';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'funeral':
        return 'bg-purple-100 text-purple-800';
      case 'memorial':
        return 'bg-blue-100 text-blue-800';
      case 'cremation':
        return 'bg-orange-100 text-orange-800';
      case 'burial':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDateStatus = (date: Date) => {
    const today = new Date();
    const serviceDate = new Date(date);
    const diffTime = serviceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Past', color: 'text-gray-500' };
    if (diffDays === 0) return { text: 'Today', color: 'text-red-600 font-semibold' };
    if (diffDays === 1) return { text: 'Tomorrow', color: 'text-orange-600 font-semibold' };
    if (diffDays <= 7) return { text: `In ${diffDays} days`, color: 'text-yellow-600' };
    return { text: `In ${diffDays} days`, color: 'text-green-600' };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Services</h1>
          <p className="text-slate-600">Schedule and manage funeral services</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Schedule Service</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="funeral">Funeral</option>
              <option value="memorial">Memorial</option>
              <option value="cremation">Cremation</option>
              <option value="burial">Burial</option>
            </select>
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Total Services</p>
          <p className="text-2xl font-bold text-slate-900">{services.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">This Week</p>
          <p className="text-2xl font-bold text-blue-600">
            {services.filter(s => {
              const weekFromNow = new Date();
              weekFromNow.setDate(weekFromNow.getDate() + 7);
              return new Date(s.date) <= weekFromNow && new Date(s.date) >= new Date();
            }).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Today</p>
          <p className="text-2xl font-bold text-red-600">
            {services.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Upcoming</p>
          <p className="text-2xl font-bold text-green-600">
            {services.filter(s => new Date(s.date) > new Date()).length}
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => {
          const dateStatus = getDateStatus(service.date);
          return (
            <div key={service.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getServiceIcon(service.type)}</div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{service.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(service.type)} mt-1`}>
                      {service.type.charAt(0).toUpperCase() + service.type.slice(1)}
                    </span>
                  </div>
                </div>
                <span className={`text-sm ${dateStatus.color}`}>
                  {dateStatus.text}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(service.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>{service.time}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span>{service.venue}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Users className="w-4 h-4" />
                  <span>{service.staff.length} staff assigned</span>
                </div>
              </div>

              {service.notes && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">Notes:</span> {service.notes}
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {service.staff.slice(0, 3).map((staff, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white text-xs font-medium text-blue-600"
                      >
                        {staff.charAt(0)}
                      </div>
                    ))}
                    {service.staff.length > 3 && (
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white text-xs font-medium text-slate-600">
                        +{service.staff.length - 3}
                      </div>
                    )}
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <div className="text-slate-400 text-lg">No services found</div>
          <p className="text-slate-500 mt-2">Try adjusting your search terms or schedule a new service</p>
        </div>
      )}
    </div>
  );
};

export default Services;
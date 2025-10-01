import React, { useState } from 'react';
import { Plus, Search, Calendar, MapPin, Users, Clock, Filter } from 'lucide-react';
import { mockServices } from '../../data/mockData';
import { Service } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

const Services: React.FC = () => {
  const { theme } = useTheme();
  const [services, setServices] = useState<Service[]>(mockServices);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    date: '',
    time: '',
    venue: '',
    type: 'funeral' as Service['type'],
    caseId: '',
    staff: '',
    notes: ''
  });

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
    const colors = {
      funeral: {
        light: 'bg-purple-100 text-purple-800',
        dark: 'bg-purple-900/30 text-purple-300'
      },
      memorial: {
        light: 'bg-blue-100 text-blue-800',
        dark: 'bg-blue-900/30 text-blue-300'
      },
      cremation: {
        light: 'bg-orange-100 text-orange-800',
        dark: 'bg-orange-900/30 text-orange-300'
      },
      burial: {
        light: 'bg-green-100 text-green-800',
        dark: 'bg-green-900/30 text-green-300'
      },
      default: {
        light: 'bg-gray-100 text-gray-800',
        dark: 'bg-gray-700/50 text-gray-200'
      }
    };

    const color = colors[type as keyof typeof colors] || colors.default;
    return color[theme as keyof typeof color];
  };

  const getDateStatus = (date: Date) => {
    const today = new Date();
    const serviceDate = new Date(date);
    const diffTime = serviceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        text: 'Past', 
        color: theme === 'dark' ? 'text-gray-400' : 'text-gray-500' 
      };
    }
    if (diffDays === 0) {
      return { 
        text: 'Today', 
        color: theme === 'dark' ? 'text-red-400 font-semibold' : 'text-red-600 font-semibold' 
      };
    }
    if (diffDays === 1) {
      return { 
        text: 'Tomorrow', 
        color: theme === 'dark' ? 'text-orange-400 font-semibold' : 'text-orange-600 font-semibold' 
      };
    }
    if (diffDays <= 7) {
      return { 
        text: `In ${diffDays} days`, 
        color: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600' 
      };
    }
    return { 
      text: `In ${diffDays} days`, 
      color: theme === 'dark' ? 'text-green-400' : 'text-green-600' 
    };
  };

  const handleScheduleService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.date || !serviceForm.time || !serviceForm.venue || !serviceForm.caseId) {
      return;
    }

    const staffArray = serviceForm.staff.split(',').map(s => s.trim()).filter(s => s);

    const newService: Service = {
      id: (services.length + 1).toString(),
      name: serviceForm.name,
      date: new Date(serviceForm.date),
      time: serviceForm.time,
      venue: serviceForm.venue,
      type: serviceForm.type,
      caseId: serviceForm.caseId,
      staff: staffArray.length > 0 ? staffArray : ['Unassigned'],
      notes: serviceForm.notes || undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setServices(prev => [newService, ...prev]);
    setIsModalOpen(false);
    setServiceForm({
      name: '',
      date: '',
      time: '',
      venue: '',
      type: 'funeral',
      caseId: '',
      staff: '',
      notes: ''
    });
  };

  return (
    <div className={`p-6 space-y-6 min-h-screen transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Services</h1>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}>Schedule and manage funeral services</p>
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
      <div className={`rounded-lg shadow-sm border p-6 transition-colors duration-200 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-slate-200'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              theme === 'dark' ? 'text-gray-400' : 'text-slate-400'
            }`} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'border border-slate-300 bg-white text-gray-900'
              }`}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className={`w-5 h-5 ${
              theme === 'dark' ? 'text-gray-400' : 'text-slate-400'
            }`} />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`flex-1 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'border border-slate-300 bg-white text-gray-900'
              }`}
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
            className={`rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'border border-slate-300 bg-white text-gray-900'
            }`}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-lg shadow-sm border p-4 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
        }`}>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>Total Services</p>
          <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {services.length}
          </p>
        </div>
        <div className={`rounded-lg shadow-sm border p-4 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
        }`}>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>This Week</p>
          <p className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
          }`}>
            {services.filter(s => {
              const weekFromNow = new Date();
              weekFromNow.setDate(weekFromNow.getDate() + 7);
              return new Date(s.date) <= weekFromNow && new Date(s.date) >= new Date();
            }).length}
          </p>
        </div>
        <div className={`rounded-lg shadow-sm border p-4 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
        }`}>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>Today</p>
          <p className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-red-400' : 'text-red-600'
          }`}>
            {services.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length}
          </p>
        </div>
        <div className={`rounded-lg shadow-sm border p-4 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'
        }`}>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>Upcoming</p>
          <p className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-green-400' : 'text-green-600'
          }`}>
            {services.filter(s => new Date(s.date) > new Date()).length}
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => {
          const dateStatus = getDateStatus(service.date);
          return (
            <div 
              key={service.id} 
              className={`rounded-lg shadow-sm border p-6 hover:shadow-md transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getServiceIcon(service.type)}</div>
                  <div>
                    <h3 className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {service.name}
                    </h3>
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
                <div className={`flex items-center space-x-2 text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
                }`}>
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(service.date).toLocaleDateString()}</span>
                </div>
                <div className={`flex items-center space-x-2 text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span>{service.time}</span>
                </div>
                <div className={`flex items-center space-x-2 text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-slate-600'
                }`}>
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
                  <button 
                    onClick={() => {
                      setSelectedService(service);
                      setIsDetailsModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
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

      {/* Service Details Modal */}
      {isDetailsModalOpen && selectedService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-lg shadow-2xl w-full max-w-2xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{getServiceIcon(selectedService.type)}</div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-900">{selectedService.name}</h2>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedService.type)} mt-1`}>
                    {selectedService.type.charAt(0).toUpperCase() + selectedService.type.slice(1)}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">✕</button>
            </div>

            <div className="space-y-6">
              {/* Date & Time Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 mb-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">Date</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-900">
                    {new Date(selectedService.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className={`text-sm mt-1 ${getDateStatus(selectedService.date).color}`}>
                    {getDateStatus(selectedService.date).text}
                  </p>
                </div>
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Time</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-900">{selectedService.time}</p>
                </div>
              </div>

              {/* Venue Section */}
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">Venue</span>
                </div>
                <p className="text-lg text-slate-900 dark:text-slate-900">{selectedService.venue}</p>
              </div>

              {/* Staff Section */}
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 mb-3">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Assigned Staff ({selectedService.staff.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedService.staff.map((staff, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-full">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                        {staff.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-200">{staff}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes Section */}
              {selectedService.notes && (
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 mb-2">
                    <span className="font-medium">Notes</span>
                  </div>
                  <p className="text-slate-900 dark:text-slate-900">{selectedService.notes}</p>
                </div>
              )}

              {/* Case ID */}
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Case ID</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-900">#{selectedService.caseId}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-6 mt-6 border-t border-white/20">
              <button onClick={() => setIsDetailsModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-slate-900 hover:bg-slate-50 dark:hover:bg-gray-700">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Service Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-lg shadow-2xl w-full max-w-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-900">Schedule Service</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleScheduleService} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Service Name</label>
                  <input value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" placeholder="e.g. Memorial Service" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Service Type</label>
                  <select value={serviceForm.type} onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value as Service['type'] })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white">
                    <option value="funeral">Funeral</option>
                    <option value="memorial">Memorial</option>
                    <option value="cremation">Cremation</option>
                    <option value="burial">Burial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Case ID</label>
                  <input value={serviceForm.caseId} onChange={(e) => setServiceForm({ ...serviceForm, caseId: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" placeholder="e.g. 1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Date</label>
                  <input type="date" value={serviceForm.date} onChange={(e) => setServiceForm({ ...serviceForm, date: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 dark:hover:border-gray-500 transition-all cursor-pointer" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Time</label>
                  <input type="time" value={serviceForm.time} onChange={(e) => setServiceForm({ ...serviceForm, time: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 dark:hover:border-gray-500 transition-all cursor-pointer" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Venue</label>
                  <input value={serviceForm.venue} onChange={(e) => setServiceForm({ ...serviceForm, venue: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" placeholder="e.g. St. Mary's Church, Cape Town" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Staff (comma-separated)</label>
                  <input value={serviceForm.staff} onChange={(e) => setServiceForm({ ...serviceForm, staff: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" placeholder="e.g. John Doe, Jane Smith" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Notes (optional)</label>
                  <textarea value={serviceForm.notes} onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" rows={3} placeholder="Additional notes or special requirements..." />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-slate-900 hover:bg-slate-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Schedule Service</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
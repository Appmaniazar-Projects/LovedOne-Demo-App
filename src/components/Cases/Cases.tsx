import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { useParams } from 'react-router-dom';
import CaseCard from './CaseCard';
import { DeceasedProfile, Client } from '../../types';
import { supabase, isSupabaseConfigured } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

interface ServiceType {
  id: string;
  name: string;
  description?: string;
}

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
}

interface PlanSummary {
  id: string;
  name: string;
}

const Cases: React.FC = () => {
  const { parlorName } = useParams<{ parlorName: string }>();
  const [currentParlorId, setCurrentParlorId] = useState<string>('');
  const LOCAL_STORAGE_KEY = 'lovedone_cases';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [cases, setCases] = useState<DeceasedProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<DeceasedProfile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<string>('');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const [form, setForm] = useState({
    name: '',
    dateOfBirth: '',
    dateOfDeath: '',
    serviceType: 'burial' as DeceasedProfile['serviceType'],
    status: 'quote' as DeceasedProfile['status'],
    assignedDirector: '',
    clientId: '',
    culturalRequirements: '',
    picture: '',
    planId: ''
  });

  useEffect(() => {
    const fetchParlorId = async () => {
      if (!parlorName) {
        return;
      }

      const { data: parlorData, error: parlorError } = await supabase
        .from('parlors')
        .select('id')
        .eq('name', decodeURIComponent(parlorName))
        .single();

      if (parlorError) {
        console.error('Error fetching parlor:', parlorError);
        return;
      }

      if (parlorData && parlorData.id !== currentParlorId) {
        setCurrentParlorId(parlorData.id);
      }
    };

    fetchParlorId();
  }, [parlorName, currentParlorId]);

  // Load cases from Supabase if configured
  useEffect(() => {
    // Load service types for this branch
    const loadServiceTypes = async (): Promise<ServiceType[]> => {
      if (!isSupabaseConfigured()) return [] as ServiceType[];
      const { data, error } = await supabase
        .from('service_types')
        .select('id, name, description')
        .eq('parlor_id', currentParlorId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Failed to load service types:', error);
        return [] as ServiceType[];
      }
      setServiceTypes(data || []);
      if (data && data.length > 0) {
        const first = data[0];
        setSelectedServiceTypeId(first.id);

        // Initialise form service type enum based on first service type
        const name = String(first.name || '').toLowerCase();
        let mapped: DeceasedProfile['serviceType'] = 'burial';
        if (name.includes('cremation')) mapped = 'cremation';
        else if (name.includes('memorial')) mapped = 'memorial';
        setForm(prev => ({ ...prev, serviceType: mapped }));
      }

      return data || [];
    };

    // Load clients (Supabase -> fallback to mocks already in state)
    const loadClients = async (): Promise<Client[]> => {
      if (!isSupabaseConfigured()) return [] as Client[];
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, phone, address, relationship, cultural_preferences, profile_picture_url, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to load clients from Supabase, using mocks');
        return [] as Client[];
      }
      const mapped: Client[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email || '',
        phone: row.phone || '',
        address: row.address || '',
        relationship: row.relationship || '',
        culturalPreferences: row.cultural_preferences || undefined,
        profilePictureUrl: row.profile_picture_url || undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
      setClients(mapped);

      return mapped;
    };

    const loadStaff = async () => {
      if (!isSupabaseConfigured() || !currentParlorId) return;

      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role, parlor_id')
        .eq('parlor_id', currentParlorId);

      if (error) {
        console.error('Failed to load staff for cases:', error);
        return;
      }

      const staffRows = (data || []).filter((row: any) =>
        row.role === 'staff' || row.role === 'admin'
      );

      setStaff(
        staffRows.map((row: any) => ({
          id: row.id as string,
          full_name: (row.full_name as string) || 'Unknown staff member',
          role: (row.role as string) || 'staff',
        }))
      );
    };

    const loadPlans = async () => {
      if (!isSupabaseConfigured() || !currentParlorId) return;

      const { data, error } = await supabase
        .from('plans')
        .select('id, name')
        .eq('parlor_id', currentParlorId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Failed to load plans for cases:', error);
        return;
      }

      setPlans((data || []).map((row: any) => ({ id: row.id as string, name: String(row.name || '') })));
      if (data && data.length > 0) {
        setSelectedPlanId(data[0].id);
      }
    };

    loadServiceTypes();
    loadClients();
    loadStaff();
    loadPlans();

    const readFromLocalStorage = (): DeceasedProfile[] | null => {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as any[];
        return parsed.map((row: any) => ({
          id: row.id,
          name: row.name,
          dateOfBirth: new Date(row.dateOfBirth),
          dateOfDeath: new Date(row.dateOfDeath),
          picture: row.picture || undefined,
          serviceType: row.serviceType,
          status: row.status,
          assignedDirector: row.assignedDirector,
          clientId: row.clientId,
          culturalRequirements: row.culturalRequirements || undefined,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt)
        }));
      } catch {
        return null;
      }
    };

    const loadCases = async () => {
      if (!isSupabaseConfigured()) {
        const cached = readFromLocalStorage();
        if (cached && cached.length > 0) setCases(cached);
        return;
      }

      const { data, error } = await supabase
        .from('cases')
        .select('id, deceased_name, date_of_birth, date_of_death, picture, case_status, assigned_director, client_id, cultural_requirements, created_at, updated_at, parlor_id, service_type_id')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load cases from Supabase:', error);
        const cached = readFromLocalStorage();
        if (cached && cached.length > 0) setCases(cached);
        return;
      }

      const mapped: DeceasedProfile[] = (data || []).map((row: any) => {
        // Find the service type name for this case
        const serviceType = serviceTypes.find(st => st.id === row.service_type_id);
        // Map service type name to DeceasedProfile serviceType enum (burial/cremation/memorial)
        // For now, use a simple mapping or default to 'burial'
        let mappedServiceType: DeceasedProfile['serviceType'] = 'burial';
        if (serviceType) {
          const name = serviceType.name.toLowerCase();
          if (name.includes('cremation')) mappedServiceType = 'cremation';
          else if (name.includes('memorial')) mappedServiceType = 'memorial';
          else mappedServiceType = 'burial';
        }
        return {
          id: row.id,
          name: row.deceased_name,
          dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : new Date(),
          dateOfDeath: new Date(row.date_of_death),
          picture: row.picture || undefined,
          serviceType: mappedServiceType,
          status: (row.case_status || 'quote') as DeceasedProfile['status'],
          assignedDirector: row.assigned_director || '',
          clientId: row.client_id,
          culturalRequirements: row.cultural_requirements || undefined,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at)
        };
      });

      setCases(mapped);
      const writeToLocalStorage = (items: DeceasedProfile[]) => {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
        } catch {
          // ignore
        }
      };
      writeToLocalStorage(mapped);
    };

    loadCases();
  }, [currentParlorId]);

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
      picture: '',
      planId: ''
    });
    setSelectedServiceTypeId(serviceTypes[0]?.id ?? '');
    setSelectedPlanId(plans[0]?.id ?? '');
  };

  const handleEditClick = (caseData: DeceasedProfile) => {
    setEditingCase(caseData);
    setForm({
      name: caseData.name,
      dateOfBirth: caseData.dateOfBirth.toISOString().slice(0, 10),
      dateOfDeath: caseData.dateOfDeath.toISOString().slice(0, 10),
      serviceType: caseData.serviceType,
      status: caseData.status,
      assignedDirector: caseData.assignedDirector,
      clientId: caseData.clientId || '',
      culturalRequirements: caseData.culturalRequirements || '',
      picture: caseData.picture || '',
      planId: ''
    });

    if (serviceTypes.length > 0) {
      const matched = serviceTypes.find(st => {
        const name = String(st.name || '').toLowerCase();
        if (caseData.serviceType === 'cremation') return name.includes('cremation');
        if (caseData.serviceType === 'memorial') return name.includes('memorial');
        return name.includes('burial') || (!name.includes('cremation') && !name.includes('memorial'));
      });
      if (matched) {
        setSelectedServiceTypeId(matched.id);
      }
    }

    setIsModalOpen(true);
  };

  const handleAddCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.dateOfBirth || !form.dateOfDeath || !form.assignedDirector || !form.clientId) {
      toast.error('Please fill all required fields');
      return;
    }

    const fallbackNew: DeceasedProfile = {
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

    if (!isSupabaseConfigured()) {
      setCases(prev => {
        const next = [fallbackNew, ...prev];
        const writeToLocalStorage = (items: DeceasedProfile[]) => {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
          } catch {
            // ignore
          }
        };
        writeToLocalStorage(next);
        return next;
      });
      setIsModalOpen(false);
      resetForm();
      toast.success('Case saved locally');
      return;
    }

    const { data, error } = await supabase
      .from('cases')
      .insert({
        deceased_name: form.name,
        date_of_birth: form.dateOfBirth,
        date_of_death: form.dateOfDeath,
        picture: form.picture || null,
        case_status: form.status,
        assigned_director: form.assignedDirector,
        client_id: form.clientId,
        cultural_requirements: form.culturalRequirements || null,
        parlor_id: currentParlorId,
        service_type_id: selectedServiceTypeId || null,
        plan_id: selectedPlanId || null
      })
      .select('id, deceased_name, date_of_birth, date_of_death, picture, case_status, assigned_director, client_id, cultural_requirements, created_at, updated_at, parlor_id, service_type_id, plan_id')
      .single();

    if (error || !data) {
      console.error('Failed to save case to Supabase, using local fallback:', error);
      setCases(prev => {
        const next = [fallbackNew, ...prev];
        const writeToLocalStorage = (items: DeceasedProfile[]) => {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
          } catch {
            // ignore
          }
        };
        writeToLocalStorage(next);
        return next;
      });
      toast.success('Case saved locally (offline mode)');
    } else {
      const saved: DeceasedProfile = {
        id: data.id,
        name: data.deceased_name,
        dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : new Date(),
        dateOfDeath: new Date(data.date_of_death),
        picture: data.picture || undefined,
        serviceType: form.serviceType,
        status: (data.case_status || 'quote') as DeceasedProfile['status'],
        assignedDirector: data.assigned_director || '',
        clientId: data.client_id,
        culturalRequirements: data.cultural_requirements || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
      setCases(prev => {
        const next = [saved, ...prev];
        const writeToLocalStorage = (items: DeceasedProfile[]) => {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
          } catch {
            // ignore
          }
        };
        writeToLocalStorage(next);
        return next;
      });
      toast.success('Case saved');
    }

    setIsModalOpen(false);
    resetForm();
    setEditingCase(null);
  };

  const handleUpdateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCase) {
      return;
    }

    if (!form.name || !form.dateOfBirth || !form.dateOfDeath || !form.assignedDirector || !form.clientId) {
      toast.error('Please fill all required fields');
      return;
    }

    const updatedCase: DeceasedProfile = {
      ...editingCase,
      name: form.name,
      dateOfBirth: new Date(form.dateOfBirth),
      dateOfDeath: new Date(form.dateOfDeath),
      serviceType: form.serviceType,
      status: form.status,
      assignedDirector: form.assignedDirector,
      clientId: form.clientId,
      culturalRequirements: form.culturalRequirements || undefined,
      picture: form.picture || undefined,
      updatedAt: new Date()
    };

    if (!isSupabaseConfigured()) {
      setCases(prev => {
        const next = prev.map(c => (c.id === editingCase.id ? updatedCase : c));
        const writeToLocalStorage = (items: DeceasedProfile[]) => {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
          } catch {
          }
        };
        writeToLocalStorage(next);
        return next;
      });
      setIsModalOpen(false);
      resetForm();
      setEditingCase(null);
      toast.success('Case updated locally');
      return;
    }

    const { data, error } = await supabase
      .from('cases')
      .update({
        deceased_name: form.name,
        date_of_birth: form.dateOfBirth,
        date_of_death: form.dateOfDeath,
        picture: form.picture || null,
        case_status: form.status,
        assigned_director: form.assignedDirector,
        client_id: form.clientId,
        cultural_requirements: form.culturalRequirements || null,
        parlor_id: currentParlorId,
        service_type_id: selectedServiceTypeId || null,
        plan_id: selectedPlanId || null
      })
      .eq('id', editingCase.id)
      .select('id, deceased_name, date_of_birth, date_of_death, picture, case_status, assigned_director, client_id, cultural_requirements, created_at, updated_at, parlor_id, service_type_id, plan_id')
      .single();

    if (error || !data) {
      console.error('Failed to update case in Supabase:', error);
      toast.error('Failed to update case');
      return;
    }

    const saved: DeceasedProfile = {
      id: data.id,
      name: data.deceased_name,
      dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : new Date(),
      dateOfDeath: new Date(data.date_of_death),
      picture: data.picture || undefined,
      serviceType: form.serviceType,
      status: (data.case_status || 'quote') as DeceasedProfile['status'],
      assignedDirector: data.assigned_director || '',
      clientId: data.client_id,
      culturalRequirements: data.cultural_requirements || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    setCases(prev => {
      const next = prev.map(c => (c.id === editingCase.id ? saved : c));
      const writeToLocalStorage = (items: DeceasedProfile[]) => {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
        } catch {
        }
      };
      writeToLocalStorage(next);
      return next;
    });

    toast.success('Case updated');
    setIsModalOpen(false);
    resetForm();
    setEditingCase(null);
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
                onClick={() => handleEditClick(caseData)}
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
          <div className="rounded-lg shadow-2xl p-6 md:p-8 w-full max-w-xl max-h-[90vh] bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 animate-fadeInUp flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{editingCase ? 'Edit Case' : 'New Case'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={editingCase ? handleUpdateCase : handleAddCase} className="flex flex-col gap-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Assigned Director</label>
                  {staff.length > 0 ? (
                    <select
                      value={form.assignedDirector}
                      onChange={(e) => setForm({ ...form, assignedDirector: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                      required
                    >
                      <option value="" disabled>
                        Select director...
                      </option>
                      {staff.map((member) => (
                        <option key={member.id} value={member.full_name}>
                          {member.full_name} ({member.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={form.assignedDirector}
                      onChange={(e) => setForm({ ...form, assignedDirector: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Date of Death</label>
                  <input
                    type="date"
                    value={form.dateOfDeath}
                    onChange={(e) => setForm({ ...form, dateOfDeath: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Service Type</label>
                  <select
                    value={selectedServiceTypeId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedServiceTypeId(newId);
                      const st = serviceTypes.find(s => s.id === newId);
                      if (st) {
                        const name = st.name.toLowerCase();
                        let mapped: DeceasedProfile['serviceType'] = 'burial';
                        if (name.includes('cremation')) mapped = 'cremation';
                        else if (name.includes('memorial')) mapped = 'memorial';
                        setForm(prev => ({ ...prev, serviceType: mapped }));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                  >
                    <option value="" disabled>Select service type...</option>
                    {serviceTypes.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Plan / Package (optional)</label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => {
                      const planId = e.target.value;
                      setSelectedPlanId(planId);
                      setForm(prev => ({ ...prev, planId }));
                    }}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                  >
                    <option value="">No specific plan</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as DeceasedProfile['status'] })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                  >
                    <option value="quote">Quote</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Client</label>
                  <select
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="" disabled>Select client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Picture URL (optional)</label>
                  <input
                    value={form.picture}
                    onChange={(e) => setForm({ ...form, picture: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                    placeholder="https://..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-slate-600 dark:text-gray-300 mb-1">Cultural Requirements (optional)</label>
                  <textarea
                    value={form.culturalRequirements}
                    onChange={(e) => setForm({ ...form, culturalRequirements: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingCase(null); resetForm(); }}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  {editingCase ? 'Save Changes' : 'Add Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases;
import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Calendar, User, Flag } from 'lucide-react';
import { useOutletContext, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { useTheme } from '../../contexts/ThemeContext';
import { supabase, isSupabaseConfigured } from '../../supabaseClient';
import { Client, DeceasedProfile } from '../../types';

interface StaffProfile {
  id: string;
  full_name: string;
  role: string;
  parlor_id?: string | null;
}

interface ServiceType {
  id: string;
  name: string;
  description?: string;
}

interface PlanSummary {
  id: string;
  name: string;
}

const LOCAL_STORAGE_KEY = 'lovedone_cases';

type CaseStatus = DeceasedProfile['status'];

const statusColumns: Array<{
  id: CaseStatus;
  title: string;
  light: string;
  dark: string;
  textLight: string;
  textDark: string;
}> = [
  {
    id: 'quote',
    title: 'Pending',
    light: 'bg-slate-100',
    dark: 'bg-slate-800/50',
    textLight: 'text-slate-800',
    textDark: 'text-slate-200',
  },
  {
    id: 'ongoing',
    title: 'In Progress',
    light: 'bg-blue-100',
    dark: 'bg-blue-900/30',
    textLight: 'text-blue-800',
    textDark: 'text-blue-200',
  },
  {
    id: 'closed',
    title: 'Completed',
    light: 'bg-green-100',
    dark: 'bg-green-900/30',
    textLight: 'text-green-800',
    textDark: 'text-green-200',
  },
];

const CasesBoard: React.FC = () => {
  const { theme } = useTheme();
  const { parlorId: parlorKey } = useParams<{ parlorId: string }>();
  const outlet = useOutletContext<{ parlorId: string; parlorRouteKey: string; parlorName: string }>();
  const resolvedParlorId = outlet?.parlorId || '';
  void parlorKey;

  const [currentParlorId, setCurrentParlorId] = useState<string>('');
  const [userRole, setUserRole] = useState<string | null>(null);

  const [cases, setCases] = useState<DeceasedProfile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [plans, setPlans] = useState<PlanSummary[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    dateOfBirth: '',
    dateOfDeath: '',
    status: 'quote' as CaseStatus,
    clientId: '',
    assignedDirector: '',
    serviceTypeId: '',
    planId: '',
  });

  const canCreateCases = userRole === 'admin' || userRole === 'super_admin' || userRole === 'staff';
  const canUpdateStatus = userRole === 'admin' || userRole === 'super_admin' || userRole === 'staff';

  const getStatusColumnStyle = (column: typeof statusColumns[number]) => {
    return {
      color: theme === 'dark' ? column.dark : column.light,
      textColor: theme === 'dark' ? column.textDark : column.textLight,
    };
  };

  useEffect(() => {
    const loadUserRole = async () => {
      if (!isSupabaseConfigured()) {
        setUserRole(null);
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error fetching user for cases board:', userError);
        setUserRole(null);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching user role for cases board:', profileError);
        setUserRole(null);
        return;
      }

      setUserRole(profile.role);
    };

    loadUserRole();
  }, []);

  useEffect(() => {
    if (resolvedParlorId && resolvedParlorId !== currentParlorId) {
      setCurrentParlorId(resolvedParlorId);
    }
  }, [resolvedParlorId, currentParlorId]);

  const readFromLocalStorage = () => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return [] as DeceasedProfile[];
      const parsed = JSON.parse(raw) as any[];
      return parsed.map((row: any) => ({
        id: row.id,
        name: row.name,
        dateOfBirth: new Date(row.dateOfBirth),
        dateOfDeath: new Date(row.dateOfDeath),
        picture: row.picture || undefined,
        serviceType: row.serviceType || 'burial',
        serviceTypeId: row.serviceTypeId || undefined,
        status: row.status || 'quote',
        assignedDirector: row.assignedDirector || '',
        clientId: row.clientId || '',
        planId: row.planId || undefined,
        culturalRequirements: row.culturalRequirements || undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })) as DeceasedProfile[];
    } catch {
      return [] as DeceasedProfile[];
    }
  };

  const writeToLocalStorage = (items: DeceasedProfile[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch {
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!isSupabaseConfigured()) {
        setCases(readFromLocalStorage());
        return;
      }

      if (!currentParlorId) {
        setCases([]);
        setClients([]);
        setStaffList([]);
        setServiceTypes([]);
        setPlans([]);
        return;
      }

      try {
        const [casesRes, clientsRes, staffRes, serviceTypesRes, plansRes] = await Promise.all([
          supabase
            .from('cases')
            .select('id, deceased_name, date_of_birth, date_of_death, picture, case_status, assigned_director, client_id, cultural_requirements, created_at, updated_at, parlor_id, service_type_id, plan_id')
            .eq('parlor_id', currentParlorId)
            .order('created_at', { ascending: false }),
          supabase
            .from('clients')
            .select('id, name, email, phone, address, relationship, cultural_preferences, profile_picture_url, created_at, updated_at')
            .eq('parlor_id', currentParlorId)
            .order('created_at', { ascending: false }),
          supabase
            .from('users')
            .select('id, full_name, role, parlor_id')
            .eq('parlor_id', currentParlorId),
          supabase
            .from('service_types')
            .select('id, name, description')
            .eq('parlor_id', currentParlorId)
            .order('name', { ascending: true }),
          supabase
            .from('plans')
            .select('id, name')
            .eq('parlor_id', currentParlorId)
            .order('name', { ascending: true }),
        ]);

        if (clientsRes.error) {
          console.error('Error loading clients for cases board:', clientsRes.error);
        } else {
          const mappedClients: Client[] = (clientsRes.data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            email: row.email || '',
            phone: row.phone || '',
            address: row.address || '',
            relationship: row.relationship || '',
            culturalPreferences: row.cultural_preferences || undefined,
            profilePictureUrl: row.profile_picture_url || undefined,
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
            updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
          }));
          setClients(mappedClients);
        }

        if (staffRes.error) {
          console.error('Error loading staff for cases board:', staffRes.error);
        } else {
          const staffRows = (staffRes.data || []).filter((row: any) => row.role !== 'viewer');
          setStaffList(staffRows);
        }

        if (serviceTypesRes.error) {
          console.error('Error loading service types for cases board:', serviceTypesRes.error);
        } else {
          setServiceTypes(serviceTypesRes.data || []);
        }

        if (plansRes.error) {
          console.error('Error loading plans for cases board:', plansRes.error);
        } else {
          setPlans((plansRes.data || []).map((row: any) => ({ id: row.id as string, name: String(row.name || '') })));
        }

        if (casesRes.error) {
          console.error('Error loading cases for cases board:', casesRes.error);
          setCases([]);
        } else {
          const nextCases: DeceasedProfile[] = (casesRes.data || []).map((row: any) => {
            const serviceType = (serviceTypesRes.data || []).find((st: any) => st.id === row.service_type_id);
            let mappedServiceType: DeceasedProfile['serviceType'] = 'burial';
            if (serviceType) {
              const name = String(serviceType.name || '').toLowerCase();
              if (name.includes('cremation')) mappedServiceType = 'cremation';
              else if (name.includes('memorial')) mappedServiceType = 'memorial';
              else mappedServiceType = 'burial';
            }

            return {
              id: row.id,
              name: row.deceased_name || 'Unnamed case',
              dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : new Date(),
              dateOfDeath: row.date_of_death ? new Date(row.date_of_death) : new Date(),
              picture: row.picture || undefined,
              serviceType: mappedServiceType,
              serviceTypeId: row.service_type_id || undefined,
              status: (row.case_status || 'quote') as CaseStatus,
              assignedDirector: row.assigned_director || '',
              clientId: row.client_id || '',
              planId: row.plan_id || undefined,
              culturalRequirements: row.cultural_requirements || undefined,
              createdAt: row.created_at ? new Date(row.created_at) : new Date(),
              updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
            };
          });
          setCases(nextCases);
        }
      } catch (err) {
        console.error('Unexpected error loading cases board data:', err);
        setCases([]);
      }
    };

    loadData();
  }, [currentParlorId]);

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of clients) map.set(c.id, c.name);
    return map;
  }, [clients]);

  const planNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of plans) map.set(p.id, p.name);
    return map;
  }, [plans]);

  const getCasesByStatus = (status: CaseStatus) => {
    return cases.filter(c => c.status === status);
  };

  const isValidUuid = (value: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  };

  const handleStatusChange = async (
    caseId: string,
    previousStatus: CaseStatus,
    newStatus: CaseStatus
  ) => {
    if (isSupabaseConfigured() && !canUpdateStatus) {
      toast.error('You do not have permission to update case status');
      return;
    }

    let nextCases: DeceasedProfile[] | null = null;

    setCases(prev => {
      nextCases = prev.map(c =>
        c.id === caseId ? { ...c, status: newStatus, updatedAt: new Date() } : c
      );
      return nextCases;
    });

    if (!isSupabaseConfigured()) {
      if (nextCases) {
        writeToLocalStorage(nextCases);
      }
      return;
    }

    if (!isValidUuid(caseId)) {
      return;
    }

    const { error } = await supabase
      .from('cases')
      .update({ case_status: newStatus })
      .eq('id', caseId);

    if (error) {
      console.error('Error updating case status:', error);
      toast.error('Could not update case status');
      setCases(prev =>
        prev.map(c => (c.id === caseId ? { ...c, status: previousStatus, updatedAt: new Date() } : c))
      );
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      dateOfBirth: '',
      dateOfDeath: '',
      status: 'quote',
      clientId: '',
      assignedDirector: '',
      serviceTypeId: serviceTypes[0]?.id || '',
      planId: plans[0]?.id || '',
    });
  };

  const handleAddCase = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSupabaseConfigured() && !currentParlorId) {
      toast.error('Parlor is not loaded yet. Please try again in a moment.');
      return;
    }

    if (isSupabaseConfigured() && !canCreateCases) {
      toast.error('You do not have permission to create cases');
      return;
    }

    if (!form.name || !form.dateOfBirth || !form.dateOfDeath || !form.clientId) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!plans.length) {
      toast.error('Please create a plan before creating a case');
      return;
    }

    if (!form.planId) {
      toast.error('Please select a plan');
      return;
    }

    const fallbackNew: DeceasedProfile = {
      id: (cases.length + 1).toString(),
      name: form.name,
      dateOfBirth: new Date(form.dateOfBirth),
      dateOfDeath: new Date(form.dateOfDeath),
      picture: undefined,
      serviceType: 'burial',
      serviceTypeId: form.serviceTypeId || undefined,
      status: form.status,
      assignedDirector: form.assignedDirector || '',
      clientId: form.clientId,
      planId: form.planId || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!isSupabaseConfigured()) {
      setCases(prev => {
        const next = [fallbackNew, ...prev];
        writeToLocalStorage(next);
        return next;
      });
      setIsModalOpen(false);
      resetForm();
      toast.success('Case added locally');
      return;
    }

    const { data, error } = await supabase
      .from('cases')
      .insert({
        deceased_name: form.name,
        date_of_birth: form.dateOfBirth,
        date_of_death: form.dateOfDeath,
        case_status: form.status,
        assigned_director: form.assignedDirector || null,
        client_id: form.clientId,
        parlor_id: currentParlorId,
        service_type_id: form.serviceTypeId || null,
        plan_id: form.planId || null,
      })
      .select('id, deceased_name, date_of_birth, date_of_death, picture, case_status, assigned_director, client_id, cultural_requirements, created_at, updated_at, parlor_id, service_type_id, plan_id')
      .single();

    if (error || !data) {
      console.error('Error saving case to Supabase, using local fallback:', error);
      setCases(prev => [fallbackNew, ...prev]);
      toast.success('Case added locally (offline mode)');
      setIsModalOpen(false);
      resetForm();
      return;
    }

    const saved: DeceasedProfile = {
      id: data.id,
      name: data.deceased_name || fallbackNew.name,
      dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : fallbackNew.dateOfBirth,
      dateOfDeath: data.date_of_death ? new Date(data.date_of_death) : fallbackNew.dateOfDeath,
      picture: data.picture || undefined,
      serviceType: fallbackNew.serviceType,
      serviceTypeId: data.service_type_id || fallbackNew.serviceTypeId,
      status: (data.case_status || 'quote') as CaseStatus,
      assignedDirector: data.assigned_director || '',
      clientId: data.client_id || '',
      planId: data.plan_id || undefined,
      culturalRequirements: data.cultural_requirements || undefined,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
    };

    setCases(prev => [saved, ...prev]);
    toast.success('Case created');
    setIsModalOpen(false);
    resetForm();
  };

  const CaseCard: React.FC<{ item: DeceasedProfile }> = ({ item }) => {
    return (
      <div
        className={`rounded-lg shadow-sm border p-4 hover:shadow-md transition-all ${
          theme === 'dark'
            ? 'border-gray-700 bg-gray-800 hover:bg-gray-700/80'
            : 'border-slate-200 bg-white hover:bg-slate-50'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0">
            <h3 className={`font-medium text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {item.name}
            </h3>
            <p className={`text-xs mt-1 truncate ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
              {item.clientId ? (clientNameById.get(item.clientId) || 'Policyholder') : 'Policyholder'}
            </p>
            <p className={`text-xs mt-1 truncate ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
              {item.planId ? (planNameById.get(item.planId) || 'Plan') : 'Plan'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {canUpdateStatus && (
            <div
              className={`flex items-center space-x-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}
            >
              <Flag className="w-4 h-4" />
              <select
                value={item.status}
                onChange={(e) => handleStatusChange(item.id, item.status, e.target.value as CaseStatus)}
                className="bg-transparent border border-slate-300 dark:border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="quote">Pending</option>
                <option value="ongoing">In Progress</option>
                <option value="closed">Completed</option>
              </select>
            </div>
          )}

          <div className={`flex items-center space-x-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
            <User className="w-4 h-4" />
            <span>{item.assignedDirector || 'Unassigned'}</span>
          </div>

          <div className={`flex items-center space-x-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
            <Calendar className="w-4 h-4" />
            <span>{item.dateOfDeath.toLocaleDateString('en-ZA')}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cases Board</h1>
          <p className="text-slate-600 dark:text-gray-400">Create, assign, and track cases through your workflow</p>
        </div>
        {(!isSupabaseConfigured() || canCreateCases) && (
          <button
            onClick={() => {
              setIsModalOpen(true);
              if (!form.serviceTypeId && serviceTypes[0]?.id) {
                setForm(prev => ({ ...prev, serviceTypeId: serviceTypes[0].id }));
              }
              if (!form.planId && plans[0]?.id) {
                setForm(prev => ({ ...prev, planId: plans[0].id }));
              }
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 w-full md:w-auto justify-center"
          >
            <Plus className="w-5 h-5" />
            <span>New Case</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-400">Total Cases</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{cases.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{cases.filter(c => c.status === 'quote').length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-400">In Progress</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{cases.filter(c => c.status === 'ongoing').length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{cases.filter(c => c.status === 'closed').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statusColumns.map((column) => {
          const columnStyle = getStatusColumnStyle(column);
          return (
            <div
              key={column.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 transition-colors duration-200"
            >
              <div className={`${columnStyle.color} px-4 py-3 rounded-t-lg transition-colors duration-200`}>
                <h3
                  className={`font-semibold flex items-center justify-between ${
                    theme === 'dark' ? column.textDark : column.textLight
                  }`}
                >
                  {column.title}
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      theme === 'dark' ? 'bg-gray-700/50 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    {getCasesByStatus(column.id).length}
                  </span>
                </h3>
              </div>
              <div className="p-3 space-y-3 min-h-[400px] overflow-y-auto">
                {getCasesByStatus(column.id).map((item) => (
                  <CaseCard key={item.id} item={item} />
                ))}
                {getCasesByStatus(column.id).length === 0 && (
                  <div className="text-center py-8 text-slate-400 dark:text-gray-500">
                    <p className="text-sm">No {column.title.toLowerCase()} cases</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-lg shadow-2xl w-full max-w-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-8 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">New Case</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCase} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Deceased Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                    placeholder="Full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as CaseStatus }))}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                  >
                    <option value="quote">Pending</option>
                    <option value="ongoing">In Progress</option>
                    <option value="closed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Assigned To</label>
                  <select
                    value={form.assignedDirector}
                    onChange={(e) => setForm(prev => ({ ...prev, assignedDirector: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                  >
                    <option value="">Unassigned</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.full_name || s.id}>
                        {s.full_name || s.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Date of Death</label>
                  <input
                    type="date"
                    value={form.dateOfDeath}
                    onChange={(e) => setForm(prev => ({ ...prev, dateOfDeath: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Policyholder</label>
                  <select
                    value={form.clientId}
                    onChange={(e) => setForm(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">Select policyholder...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Service Type</label>
                  <select
                    value={form.serviceTypeId}
                    onChange={(e) => setForm(prev => ({ ...prev, serviceTypeId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                  >
                    <option value="">Select service type...</option>
                    {serviceTypes.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Plan</label>
                  <select
                    value={form.planId}
                    onChange={(e) => setForm(prev => ({ ...prev, planId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="" disabled>Select plan...</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  Add Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CasesBoard;

// Services.tsx - Complete implementation with real Supabase integration

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, Heart, Plus, Edit2, Trash2, Clock, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { supabase } from '../../supabaseClient';

interface Plan {
  id: string;
  parlor_id: string;
  name: string;
  monthly_premium: number;
  cover_amount: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServiceType {
  id: string;
  parlor_id: string;
  name: string;
  description: string;
  default_duration_minutes: number;
  created_at: string;
}

const Services: React.FC = () => {
  const { parlorName } = useParams<{ parlorName: string }>();
  
  // State management
  const [plans, setPlans] = useState<Plan[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parlorId, setParlorId] = useState<string | null>(null);
  const [planStats, setPlanStats] = useState<Record<string, number>>({});
  const [serviceStats, setServiceStats] = useState<Record<string, number>>({});

  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    monthly_premium: '',
    cover_amount: '',
    description: '',
    is_active: true,
  });

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    default_duration_minutes: '',
  });

  const [savingPlan, setSavingPlan] = useState(false);
  const [savingService, setSavingService] = useState(false);

  // Fetch parlor ID from parlor name in URL (matches App.tsx & ParlorLayout)
  useEffect(() => {
    const fetchParlor = async () => {
      try {
        if (!parlorName) {
          setError('No parlor specified');
          setLoading(false);
          return;
        }

        // Decode parlor name from URL and look up by name
        const decodedParlorName = decodeURIComponent(parlorName);
        const { data, error: parlorError } = await supabase
          .from('parlors')
          .select('id')
          .eq('name', decodedParlorName)
          .single();

        if (parlorError) throw parlorError;
        
        setParlorId(data.id);
      } catch (err) {
        console.error('Error fetching parlor:', err);
        setError('Failed to load parlor information');
        setLoading(false);
      }
    };

    fetchParlor();
  }, [parlorName]);

  // Fetch all data when parlor ID is available
  useEffect(() => {
    if (!parlorId) return;
    fetchAllData();
  }, [parlorId]);

  const fetchAllData = async () => {
    if (!parlorId) return;

    setLoading(true);
    try {
      // Fetch plans for this parlor
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('parlor_id', parlorId)
        .order('monthly_premium', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Fetch service types for this parlor
      const { data: servicesData, error: servicesError } = await supabase
        .from('service_types')
        .select('*')
        .eq('parlor_id', parlorId)
        .order('name', { ascending: true });

      if (servicesError) throw servicesError;
      setServiceTypes(servicesData || []);

      // Fetch case statistics
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('id, plan_id, service_type_id')
        .eq('parlor_id', parlorId);

      if (casesError) throw casesError;

      // Calculate statistics
      const planCounts: Record<string, number> = {};
      const serviceCounts: Record<string, number> = {};

      casesData?.forEach(caseItem => {
        if (caseItem.plan_id) {
          planCounts[caseItem.plan_id] = (planCounts[caseItem.plan_id] || 0) + 1;
        }
        if (caseItem.service_type_id) {
          serviceCounts[caseItem.service_type_id] = (serviceCounts[caseItem.service_type_id] || 0) + 1;
        }
      });

      setPlanStats(planCounts);
      setServiceStats(serviceCounts);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load plans and services');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      // Refresh data
      await fetchAllData();
    } catch (err) {
      console.error('Error deleting plan:', err);
      alert('Failed to delete plan. It may be in use by existing cases.');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this service type?')) return;

    try {
      const { error } = await supabase
        .from('service_types')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      // Refresh data
      await fetchAllData();
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Failed to delete service. It may be in use by existing cases.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const openAddPlanModal = () => {
    setEditingPlan(null);
    setPlanForm({
      name: '',
      monthly_premium: '',
      cover_amount: '',
      description: '',
      is_active: true,
    });
    setIsPlanModalOpen(true);
  };

  const openEditPlanModal = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      monthly_premium: String(plan.monthly_premium ?? ''),
      cover_amount: String(plan.cover_amount ?? ''),
      description: plan.description || '',
      is_active: plan.is_active,
    });
    setIsPlanModalOpen(true);
  };

  const closePlanModal = () => {
    if (savingPlan) return;
    setIsPlanModalOpen(false);
    setEditingPlan(null);
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!parlorId) {
      toast.error('Parlor information is not loaded yet.');
      return;
    }

    const name = planForm.name.trim();
    const monthly = Number(planForm.monthly_premium);
    const cover = Number(planForm.cover_amount);

    if (!name) {
      toast.error('Plan name is required.');
      return;
    }
    if (!Number.isFinite(monthly) || monthly <= 0) {
      toast.error('Monthly premium must be greater than 0.');
      return;
    }
    if (!Number.isFinite(cover) || cover <= 0) {
      toast.error('Cover amount must be greater than 0.');
      return;
    }

    setSavingPlan(true);
    try {
      if (editingPlan) {
        const { error: updateError } = await supabase
          .from('plans')
          .update({
            name,
            monthly_premium: monthly,
            cover_amount: cover,
            description: planForm.description,
            is_active: planForm.is_active,
          })
          .eq('id', editingPlan.id);

        if (updateError) throw updateError;
        toast.success('Plan updated.');
      } else {
        const { error: insertError } = await supabase
          .from('plans')
          .insert({
            parlor_id: parlorId,
            name,
            monthly_premium: monthly,
            cover_amount: cover,
            description: planForm.description,
            is_active: planForm.is_active,
          });

        if (insertError) throw insertError;
        toast.success('Plan created.');
      }

      await fetchAllData();
      setIsPlanModalOpen(false);
      setEditingPlan(null);
    } catch (err: any) {
      console.error('Error saving plan:', err);
      const message = err?.message || 'Failed to save plan.';
      toast.error(message);
    } finally {
      setSavingPlan(false);
    }
  };

  const openAddServiceModal = () => {
    setEditingService(null);
    setServiceForm({
      name: '',
      description: '',
      default_duration_minutes: '',
    });
    setIsServiceModalOpen(true);
  };

  const openEditServiceModal = (service: ServiceType) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      default_duration_minutes: String(service.default_duration_minutes ?? ''),
    });
    setIsServiceModalOpen(true);
  };

  const closeServiceModal = () => {
    if (savingService) return;
    setIsServiceModalOpen(false);
    setEditingService(null);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!parlorId) {
      toast.error('Parlor information is not loaded yet.');
      return;
    }

    const name = serviceForm.name.trim();
    const duration = parseInt(serviceForm.default_duration_minutes, 10);

    if (!name) {
      toast.error('Service name is required.');
      return;
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      toast.error('Default duration must be greater than 0 minutes.');
      return;
    }

    setSavingService(true);
    try {
      if (editingService) {
        const { error: updateError } = await supabase
          .from('service_types')
          .update({
            name,
            description: serviceForm.description,
            default_duration_minutes: duration,
          })
          .eq('id', editingService.id);

        if (updateError) throw updateError;
        toast.success('Service type updated.');
      } else {
        const { error: insertError } = await supabase
          .from('service_types')
          .insert({
            parlor_id: parlorId,
            name,
            description: serviceForm.description,
            default_duration_minutes: duration,
          });

        if (insertError) throw insertError;
        toast.success('Service type created.');
      }

      await fetchAllData();
      setIsServiceModalOpen(false);
      setEditingService(null);
    } catch (err: any) {
      console.error('Error saving service type:', err);
      const message = err?.message || 'Failed to save service type.';
      toast.error(message);
    } finally {
      setSavingService(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading plans and services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-800 dark:to-pink-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Services & Plans</h1>
        <p className="text-purple-100 dark:text-purple-200">
          Manage your funeral plans and service offerings
        </p>
      </div>

      {/* Funeral Plans Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Funeral Plans
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {plans.length} coverage plan{plans.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <button
            onClick={openAddPlanModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Shield className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Plans Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get started by adding your first funeral plan
            </p>
            <button
              onClick={() => alert('Use the SQL seed script provided to add plans')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Your First Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div
                key={plan.id}
                className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      {!plan.is_active && (
                        <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 px-2 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditPlanModal(plan)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Edit plan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {plan.description}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Monthly Premium
                    </span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(plan.monthly_premium)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cover Amount
                    </span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(plan.cover_amount)}
                    </span>
                  </div>
                </div>

                {planStats[plan.id] && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Active Cases
                      </span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {planStats[plan.id]} case{planStats[plan.id] !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service Types Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Service Types
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {serviceTypes.length} service type{serviceTypes.length !== 1 ? 's' : ''} configured
            </p>
          </div>
          <button
            onClick={openAddServiceModal}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Service Type
          </button>
        </div>

        {serviceTypes.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Heart className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Service Types Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Add service types like Traditional Burial, Cremation, etc.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceTypes.map(service => (
              <div
                key={service.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {service.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditServiceModal(service)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {service.description}
                </p>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Duration</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {service.default_duration_minutes} min
                  </span>
                </div>

                {serviceStats[service.id] && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Active Cases
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {serviceStats[service.id]} case{serviceStats[service.id] !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingPlan ? 'Edit Funeral Plan' : 'Add Funeral Plan'}
              </h3>
              <button
                type="button"
                onClick={closePlanModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handlePlanSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Premium (ZAR)</label>
                  <input
                    type="number"
                    min="0"
                    value={planForm.monthly_premium}
                    onChange={(e) => setPlanForm({ ...planForm, monthly_premium: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Amount (ZAR)</label>
                  <input
                    type="number"
                    min="0"
                    value={planForm.cover_amount}
                    onChange={(e) => setPlanForm({ ...planForm, cover_amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={planForm.is_active}
                    onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  Active plan
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closePlanModal}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    disabled={savingPlan}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={savingPlan}
                  >
                    {savingPlan ? 'Saving...' : editingPlan ? 'Save Changes' : 'Create Plan'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingService ? 'Edit Service Type' : 'Add Service Type'}
              </h3>
              <button
                type="button"
                onClick={closeServiceModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleServiceSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Name</label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Duration (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={serviceForm.default_duration_minutes}
                  onChange={(e) => setServiceForm({ ...serviceForm, default_duration_minutes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeServiceModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  disabled={savingService}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={savingService}
                >
                  {savingService ? 'Saving...' : editingService ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
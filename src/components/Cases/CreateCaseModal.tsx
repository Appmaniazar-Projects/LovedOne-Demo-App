import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import { X, Save, AlertCircle } from 'lucide-react';
import { DeceasedProfile } from '../../types';

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  dependants?: Array<{ id: string; name: string; relationship: string }>;
  onCaseCreated: (newCase: DeceasedProfile) => void;
  parlorId: string;
}

const CreateCaseModal: React.FC<CreateCaseModalProps> = ({ 
  isOpen, 
  onClose, 
  clientId, 
  clientName,
  dependants = [],
  onCaseCreated,
  parlorId
}) => {
  const [formData, setFormData] = useState({
    name: clientName,
    dateOfBirth: new Date(),
    dateOfDeath: new Date(),
    serviceType: 'burial' as 'burial' | 'cremation' | 'memorial',
    status: 'quote' as 'quote' | 'ongoing' | 'closed',
    assignedDirector: '',
    culturalRequirements: '',
    isDependant: false,
    dependantId: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientPlan, setClientPlan] = useState<{ id: string; name: string } | null>(null);

  const serviceTypes = [
    { value: 'burial', label: 'Burial' },
    { value: 'cremation', label: 'Cremation' },
    { value: 'memorial', label: 'Memorial' }
  ];

  useEffect(() => {
    if (isOpen && clientId) {
      fetchClientPlan();
    }
  }, [isOpen, clientId]);

  const fetchClientPlan = async () => {
    try {
      // Fetch the client to get their plan
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('plan_id, plans!inner(id, name)')
        .eq('id', clientId)
        .single();

      if (clientError) {
        console.error('Error fetching client plan:', clientError);
        return;
      }

      if (clientData?.plan_id && clientData.plans && Array.isArray(clientData.plans)) {
        const plan = clientData.plans[0]; // Take the first plan if it's an array
        setClientPlan({
          id: clientData.plan_id,
          name: plan.name
        });
      }
    } catch (err: any) {
      console.error('Error fetching client plan:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to create a case');
      }

      const caseData = {
        name: formData.name,
        dateOfBirth: formData.dateOfBirth.toISOString(),
        dateOfDeath: formData.dateOfDeath.toISOString(),
        serviceType: formData.serviceType,
        status: formData.status,
        assignedDirector: formData.assignedDirector,
        culturalRequirements: formData.culturalRequirements,
        clientId: formData.isDependant ? undefined : clientId,
        planId: clientPlan?.id || null, // Use client's plan if available
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data: newCase, error: caseError } = await supabase
        .from('deceased_profiles')
        .insert(caseData)
        .select()
        .single();

      if (caseError) throw caseError;

      toast.success('Case created successfully!');
      onCaseCreated(newCase);
      onClose();
      
      // Reset form
      setFormData({
        name: clientName,
        dateOfBirth: new Date(),
        dateOfDeath: new Date(),
        serviceType: 'burial',
        status: 'quote',
        assignedDirector: '',
        culturalRequirements: '',
        isDependant: false,
        dependantId: ''
      });
    } catch (err: any) {
      console.error('Error creating case:', err);
      setError(err.message || 'Failed to create case');
      toast.error(err.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  const selectedDependant = dependants.find(d => d.id === formData.dependantId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Case for {clientName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Info Alert */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Creating a Case</p>
              <p>A case represents when a client or their dependent has passed away. This will track the funeral arrangements and related tasks.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Person Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Who Passed Away?
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!formData.isDependant}
                  onChange={() => handleInputChange('isDependant', false)}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>Client:</strong> {clientName} (Policy Holder)
                </span>
              </label>
              {dependants.length > 0 && (
                <>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.isDependant}
                      onChange={() => handleInputChange('isDependant', true)}
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">A Dependant:</span>
                  </label>
                  {formData.isDependant && (
                    <select
                      value={formData.dependantId}
                      onChange={(e) => handleInputChange('dependantId', e.target.value)}
                      className="ml-6 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                      required
                    >
                      <option value="">Select dependant...</option>
                      {dependants.map(dependant => (
                        <option key={dependant.id} value={dependant.id}>
                          {dependant.name} ({dependant.relationship})
                        </option>
                      ))}
                    </select>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Plan Information */}
          {clientPlan && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Funeral Plan</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">{clientPlan.name}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">This plan will be automatically assigned to the case</p>
            </div>
          )}

          {/* Update name based on selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deceased Name
            </label>
            <input
              type="text"
              value={formData.isDependant && selectedDependant ? selectedDependant.name : formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
              disabled={formData.isDependant && !!selectedDependant}
              required
            />
            {formData.isDependant && selectedDependant && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Name automatically filled from selected dependant
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth.toISOString().split('T')[0]}
                onChange={(e) => handleInputChange('dateOfBirth', new Date(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Death
              </label>
              <input
                type="date"
                value={formData.dateOfDeath.toISOString().split('T')[0]}
                onChange={(e) => handleInputChange('dateOfDeath', new Date(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Service Type
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => handleInputChange('serviceType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
              >
                {serviceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assigned Director
              </label>
              <input
                type="text"
                value={formData.assignedDirector}
                onChange={(e) => handleInputChange('assignedDirector', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                placeholder="Enter director name..."
                required
              />
            </div>
          </div>

          {/* Cultural Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cultural Requirements
            </label>
            <textarea
              value={formData.culturalRequirements}
              onChange={(e) => handleInputChange('culturalRequirements', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
              placeholder="Enter any cultural or religious requirements..."
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (formData.isDependant && !formData.dependantId)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Creating...' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCaseModal;

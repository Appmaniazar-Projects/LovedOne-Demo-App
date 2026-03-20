import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import { X, Save, AlertCircle } from 'lucide-react';
import { DeceasedProfile } from '../../types';

interface Client {
  id: string;
  name: string;
  relationship: string;
}

interface Dependant {
  id: string;
  name: string;
  relationship: string;
  client_id: string;
}

interface CreateCaseFromBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated: (newCase: DeceasedProfile) => void;
  parlorId: string;
}

const CreateCaseFromBoardModal: React.FC<CreateCaseFromBoardModalProps> = ({ 
  isOpen, 
  onClose, 
  onCaseCreated,
  parlorId 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: new Date(),
    dateOfDeath: new Date(),
    serviceType: 'burial' as 'burial' | 'cremation' | 'memorial',
    status: 'quote' as 'quote' | 'ongoing' | 'closed',
    assignedDirector: '',
    culturalRequirements: '',
    picture: '',
    clientId: '',
    planId: ''
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [dependants, setDependants] = useState<Dependant[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientPlans, setClientPlans] = useState<Record<string, { id: string; name: string }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceTypes = [
    { value: 'burial', label: 'Burial' },
    { value: 'cremation', label: 'Cremation' },
    { value: 'memorial', label: 'Memorial' }
  ];

  const statuses = [
    { value: 'quote', label: 'Pending' },
    { value: 'ongoing', label: 'In Progress' },
    { value: 'closed', label: 'Closed' }
  ];

  useEffect(() => {
    if (isOpen && parlorId) {
      fetchClientsAndDependants();
    }
  }, [isOpen, parlorId]);

  const fetchClientsAndDependants = async () => {
    try {
      // Fetch clients with their plans
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, relationship, plan_id, plans!inner(id, name)')
        .eq('parlor_id', parlorId);

      if (clientsError) throw clientsError;
      
      const clientsList = clientsData || [];
      setClients(clientsList.map(c => ({
        id: c.id,
        name: c.name,
        relationship: c.relationship
      })));

      // Store client plans for auto-selection
      const plansMap: Record<string, { id: string; name: string }> = {};
      clientsList.forEach(client => {
        if (client.plan_id && client.plans && Array.isArray(client.plans)) {
          const plan = client.plans[0]; // Take the first plan if it's an array
          plansMap[client.id] = {
            id: client.plan_id,
            name: plan.name
          };
        }
      });
      setClientPlans(plansMap);

      // Fetch dependants
      const { data: dependantsData, error: dependantsError } = await supabase
        .from('dependants')
        .select('id, name, relationship, client_id')
        .in('client_id', clientsList.map(c => c.id));

      if (dependantsError) throw dependantsError;
      setDependants(dependantsData || []);
    } catch (err: any) {
      console.error('Error fetching clients and dependants:', err);
      toast.error('Failed to fetch clients');
    }
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setFormData(prev => ({ 
        ...prev, 
        name: client.name, 
        clientId: client.id,
        planId: clientPlans[clientId]?.id || ''
      }));
    }
  };

  const handleDependantChange = (dependantId: string) => {
    const dependant = dependants.find(d => d.id === dependantId);
    if (dependant) {
      setFormData(prev => ({ ...prev, name: dependant.name, clientId: dependant.client_id }));
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
        picture: formData.picture,
        clientId: formData.clientId,
        planId: formData.planId || null,
        parlor_id: parlorId,
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
        name: '',
        dateOfBirth: new Date(),
        dateOfDeath: new Date(),
        serviceType: 'burial',
        status: 'quote',
        assignedDirector: '',
        culturalRequirements: '',
        picture: '',
        clientId: '',
        planId: ''
      });
      setSelectedClientId('');
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

  const availableDependants = dependants.filter(d => d.client_id === selectedClientId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Case
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                required
              >
                <option value="">Choose a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.relationship})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Person (Client or Dependant)
              </label>
              <select
                onChange={(e) => handleDependantChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                disabled={!selectedClientId}
                required
              >
                <option value="">Choose person...</option>
                <option value={selectedClientId}>
                  Policy Holder: {clients.find(c => c.id === selectedClientId)?.name}
                </option>
                {availableDependants.map(dependant => (
                  <option key={dependant.id} value={dependant.id}>
                    Dependant: {dependant.name} ({dependant.relationship})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plan Information */}
          {selectedClientId && clientPlans[selectedClientId] && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Funeral Plan</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">{clientPlans[selectedClientId].name}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">This plan will be automatically assigned to the case</p>
            </div>
          )}

          {/* Case Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Deceased Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
                required
              />
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
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
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
                value={formData.dateOfDeath ? new Date(formData.dateOfDeath).toISOString().split('T')[0] : ''}
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
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg"
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
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
              disabled={loading || !formData.clientId}
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

export default CreateCaseFromBoardModal;

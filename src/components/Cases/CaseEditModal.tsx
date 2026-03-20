import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import { X, Save } from 'lucide-react';
import { DeceasedProfile } from '../../types';

interface CaseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: DeceasedProfile | null;
  onCaseUpdated: (updatedCase: DeceasedProfile) => void;
  parlorId: string;
}

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

const CaseEditModal: React.FC<CaseEditModalProps> = ({ 
  isOpen, 
  onClose, 
  caseData, 
  onCaseUpdated, 
  parlorId 
}) => {
  const [formData, setFormData] = useState<Partial<DeceasedProfile>>({
    name: '',
    dateOfBirth: new Date(),
    dateOfDeath: new Date(),
    serviceType: 'burial',
    status: 'quote',
    assignedDirector: '',
    culturalRequirements: '',
    picture: ''
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [dependants, setDependants] = useState<Dependant[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
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

  useEffect(() => {
    if (caseData) {
      setFormData({
        name: caseData.name,
        dateOfBirth: new Date(caseData.dateOfBirth),
        dateOfDeath: new Date(caseData.dateOfDeath),
        serviceType: caseData.serviceType,
        status: caseData.status,
        assignedDirector: caseData.assignedDirector,
        culturalRequirements: caseData.culturalRequirements || '',
        picture: caseData.picture || ''
      });
    }
  }, [caseData]);

  const fetchClientsAndDependants = async () => {
    try {
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, relationship')
        .eq('parlor_id', parlorId);

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

      // Fetch dependants
      const { data: dependantsData, error: dependantsError } = await supabase
        .from('dependants')
        .select('id, name, relationship, client_id')
        .in('client_id', clientsData?.map(c => c.id) || []);

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
      setFormData(prev => ({ ...prev, name: client.name, clientId: client.id }));
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
      if (!caseData?.id) {
        throw new Error('Case ID is required');
      }

      const updateData = {
        ...formData,
        dateOfBirth: formData.dateOfBirth?.toISOString(),
        dateOfDeath: formData.dateOfDeath?.toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data: updatedCase, error: updateError } = await supabase
        .from('deceased_profiles')
        .update(updateData)
        .eq('id', caseData.id)
        .select()
        .single();

      if (updateError) throw updateError;

      toast.success('Case updated successfully!');
      onCaseUpdated(updatedCase);
      onClose();
    } catch (err: any) {
      console.error('Error updating case:', err);
      setError(err.message || 'Failed to update case');
      toast.error(err.message || 'Failed to update case');
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
            {caseData ? 'Edit Case' : 'Create New Case'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
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
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaseEditModal;

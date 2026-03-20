// src/components/Clients/AddClientModal.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Client } from './Clients';
import { toast } from 'react-hot-toast';
import { Plus, X, Upload, FileText, Shield, Users } from 'lucide-react';
import { Plan } from '../../types';
import GoogleAddressAutocomplete from '../GoogleAddressAutocomplete';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: (newClient: Client) => void;
  parlorId: string;
}

interface Dependant {
  id: string;
  name: string;
  age: string;
  relationship: string;
  idNumber?: string;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onClientAdded, parlorId }) => {
  // Section 1 - Policy Holder Details
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  
  // Section 2 - Funeral Plan
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [policyStartDate, setPolicyStartDate] = useState('');
  const [policyStatus, setPolicyStatus] = useState<'active' | 'lapsed' | 'deceased'>('active');
  
  // Section 3 - Dependants
  const [dependants, setDependants] = useState<Dependant[]>([]);
  
  // Section 4 - Documents
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const relationshipOptions = [
    'Spouse',
    'Child', 
    'Parent',
    'Sibling',
    'Extended Family',
    'Other'
  ];

  const documentTypes = [
    'ID Copy',
    'Proof of Address',
    'Birth Certificate',
    'Marriage Certificate',
    'Policy Agreement'
  ];

  // Fetch plans when modal opens
  useEffect(() => {
    if (isOpen && parlorId) {
      fetchPlans();
    }
  }, [isOpen, parlorId]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('parlor_id', parlorId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      toast.error('Failed to fetch plans');
    }
  };

  // Handle plan selection
  useEffect(() => {
    if (selectedPlanId) {
      const plan = plans.find(p => p.id === selectedPlanId);
      setSelectedPlan(plan || null);
    } else {
      setSelectedPlan(null);
    }
  }, [selectedPlanId, plans]);

  const addDependant = () => {
    const newDependant: Dependant = {
      id: Date.now().toString(),
      name: '',
      age: '',
      relationship: '',
      idNumber: ''
    };
    setDependants([...dependants, newDependant]);
  };

  const updateDependant = (id: string, field: keyof Dependant, value: string) => {
    setDependants(dependants.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    ));
  };

  const removeDependant = (id: string) => {
    setDependants(dependants.filter(d => d.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!parlorId) {
        throw new Error('Parlor ID is required to create a client');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to create a client');
      }

      // Create client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: `${firstName} ${surname}`,
          relationship: 'Policy Holder',
          email: '', // Can be added later
          phone: phoneNumber,
          address: address,
          cultural_preferences: '',
          plan_id: selectedPlanId || null,
          status: policyStatus,
          user_id: user.id,
          parlor_id: parlorId,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Create dependants
      if (dependants.length > 0 && clientData) {
        const dependantsToInsert = dependants.map(d => ({
          client_id: clientData.id,
          name: d.name,
          relationship: d.relationship,
          date_of_birth: d.age ? new Date().getFullYear() - parseInt(d.age) + '-01-01' : null,
          contact_number: '',
          email: '',
          notes: d.idNumber ? `ID: ${d.idNumber}` : ''
        }));

        const { error: dependantsError } = await supabase
          .from('dependants')
          .insert(dependantsToInsert);

        if (dependantsError) throw dependantsError;
      }

      // Handle document uploads (simplified for now)
      if (uploadedFiles.length > 0 && clientData) {
        // TODO: Implement actual file upload to storage
        console.log('Files to upload:', uploadedFiles);
      }

      toast.success('Client added successfully!');
      onClientAdded(clientData as Client);
      
      // Reset form
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to add client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setSurname('');
    setPhoneNumber('');
    setIdNumber('');
    setAddress('');
    setSelectedPlanId('');
    setSelectedPlan(null);
    setPolicyStartDate('');
    setPolicyStatus('active');
    setDependants([]);
    setSelectedDocumentType('');
    setUploadedFiles([]);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Add New Client</h2>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1 - Policy Holder Details */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Policy Holder Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Surname"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="ID Number (optional but recommended)"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg"
              />
              <div className="md:col-span-2">
                <GoogleAddressAutocomplete
                  value={address}
                  onChange={setAddress}
                  apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}
                  placeholder="Enter address..."
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Section 2 - Funeral Plan */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Funeral Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Plan
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg"
                >
                  <option value="">Select a plan</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedPlan && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Monthly Premium:</span>
                    <span className="font-medium">R{selectedPlan.monthly_premium}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Payout Amount:</span>
                    <span className="font-medium">R{selectedPlan.cover_amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Maximum Dependants:</span>
                    <span className="font-medium">Not specified</span>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Policy Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={policyStartDate}
                  onChange={(e) => setPolicyStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Policy Status
                </label>
                <select
                  value={policyStatus}
                  onChange={(e) => setPolicyStatus(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="lapsed">Lapsed</option>
                  <option value="deceased">Deceased</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3 - Dependants */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Dependants
            </h3>
            
            <button
              type="button"
              onClick={addDependant}
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Dependant
            </button>
            
            {dependants.map((dependant) => (
              <div key={dependant.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={dependant.name}
                    onChange={(e) => updateDependant(dependant.id, 'name', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Age"
                    value={dependant.age}
                    onChange={(e) => updateDependant(dependant.id, 'age', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white rounded-lg"
                  />
                  <select
                    value={dependant.relationship}
                    onChange={(e) => updateDependant(dependant.id, 'relationship', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white rounded-lg"
                  >
                    <option value="">Select Relationship</option>
                    {relationshipOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="ID Number (optional)"
                      value={dependant.idNumber}
                      onChange={(e) => updateDependant(dependant.id, 'idNumber', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeDependant(dependant.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Section 4 - Initial Documents */}
          <div className="pb-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Initial Documents (Optional)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This can also be done later from the client profile
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Document Type
                </label>
                <select
                  value={selectedDocumentType}
                  onChange={(e) => setSelectedDocumentType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg"
                >
                  <option value="">Select document type</option>
                  {documentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Upload Document
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </label>
                  <span className="text-sm text-gray-500">
                    {uploadedFiles.length} file(s) selected
                  </span>
                </div>
              </div>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                    <span className="text-sm truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientModal;

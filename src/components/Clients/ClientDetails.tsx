import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Phone, Mail, MapPin, User as UserIcon, Edit, Save, X, Plus, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ClientDocuments from './ClientDocuments';
import { getClientBySlug } from '../../utils/slugify';
import CreateCaseModal from '../Cases/CreateCaseModal';

interface Client {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  address: string;
  cultural_preferences: string;
  profile_picture_url: string | null;
  created_at: string;
  user_id: string | null;
}

const ClientDetails: React.FC = () => {
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);
  const [dependants, setDependants] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Check if this is a mock client
    if (client?.id?.startsWith('mock-client-')) {
      toast.error('Profile picture upload is not available in demo mode');
      return;
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${client?.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `profile-pictures/${fileName}`;
    
    setUploading(true);
    try {
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('client-profiles')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client-profiles')
        .getPublicUrl(filePath);
      
      // Update the client with the new profile picture URL
      const { error: updateError } = await supabase
        .from('clients')
        .update({ profile_picture_url: publicUrl })
        .eq('id', client?.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setClient(prev => prev ? { ...prev, profile_picture_url: publicUrl } : null);
      setEditingClient(prev => prev ? { ...prev, profile_picture_url: publicUrl } : null);
      
      toast.success('Profile picture updated successfully');
    } catch (err: any) {
      console.error('Error uploading image:', err);
      toast.error(err.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setUserRole(null);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          setUserRole(null);
          return;
        }

        setUserRole(profile.role as string);
      } catch {
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    const fetchClient = async () => {
      if (!clientSlug) {
        setError('No client slug provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching client for slug:', clientSlug);
        
        // Use the name-based lookup function
        const clientData = await getClientBySlug(clientSlug, supabase);
        
        console.log('Client data found:', clientData);
        
        if (!clientData) {
          throw new Error(`Client not found for slug: "${clientSlug}". The client may not exist or the URL may be incorrect.`);
        }

        setClient(clientData);
        setEditingClient({ ...clientData });

        // Fetch dependants for this client
        const { data: dependantsData, error: dependantsError } = await supabase
          .from('dependants')
          .select('*')
          .eq('client_id', clientData.id);

        if (dependantsError) {
          console.error('Error fetching dependants:', dependantsError);
        } else {
          setDependants(dependantsData || []);
        }

        console.log('Client data:', clientData); // Debug: Check what fields are available
      } catch (err: any) {
        console.error('Error fetching client:', err);
        setError(err.message || 'Failed to load client details');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientSlug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading client details...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error || 'Client not found'}</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editingClient) return;
    const { name, value } = e.target;
    setEditingClient({
      ...editingClient,
      [name]: value
    });
  };

  const handleSave = async () => {
    if (!editingClient || !client?.id) return;
    
    setSaving(true);
    try {
      // Check if this is a mock client
      if (client?.id?.startsWith('mock-client-')) {
        console.log('Updating mock client:', client?.id);
        const { updateMockClient } = await import('../../data/mockClients');
        const updatedClient = updateMockClient(client?.id, {
          name: editingClient.name,
          relationship: editingClient.relationship,
          email: editingClient.email,
          phone: editingClient.phone,
          address: editingClient.address,
          cultural_preferences: editingClient.cultural_preferences,
          profile_picture_url: editingClient.profile_picture_url
        });
        
        if (!updatedClient) {
          throw new Error('Failed to update mock client');
        }
        
        setClient(updatedClient);
        setIsEditing(false);
        toast.success('Client updated successfully');
        setSaving(false);
        return;
      }
      
      // Otherwise update in Supabase
      const { data, error } = await supabase
        .from('clients')
        .update({
          name: editingClient.name,
          relationship: editingClient.relationship,
          email: editingClient.email,
          phone: editingClient.phone,
          address: editingClient.address,
          cultural_preferences: editingClient.cultural_preferences,
          profile_picture_url: editingClient.profile_picture_url
        })
        .eq('id', client?.id)
        .select()
        .single();

      if (error) throw error;
      
      setClient(data);
      setIsEditing(false);
      toast.success('Client updated successfully');
    } catch (err: any) {
      console.error('Error updating client:', err);
      toast.error(err.message || 'Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!client?.id || !client) return;
    if (deleting) return;

    const confirmed = window.confirm('Are you sure you want to delete this client? This action cannot be undone.');
    if (!confirmed) return;

    setDeleting(true);
    try {
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', client?.id);

      if (deleteError) {
        const message = deleteError.message || 'Failed to delete client';
        toast.error(message);
        setDeleting(false);
        return;
      }

      toast.success('Client deleted successfully');
      navigate(-1);
    } catch (err: any) {
      const message = err && err.message ? String(err.message) : 'Failed to delete client';
      toast.error(message);
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </button>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Client
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingClient(client ? { ...client } : null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4 mr-2 inline" />
                Cancel
              </button>
            </>
          )}
          {(userRole === 'admin' || userRole === 'super_admin') && !client?.id?.startsWith('mock-client-') && (
            <button
              onClick={handleDeleteClient}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Client'}
            </button>
          )}
          <button
            onClick={() => setShowCreateCaseModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Case
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 p-6 text-white">
          <div className="flex items-center">
            <div className="relative group">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-6 overflow-hidden">
                {client.profile_picture_url ? (
                  <img 
                    src={client.profile_picture_url} 
                    alt={client.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-10 h-10" />
                )}
              </div>
              <label 
                className={`absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${uploading ? 'opacity-100' : ''}`}
                title="Change profile picture"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Edit className="w-5 h-5 text-white" />
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  disabled={uploading}
                />
              </label>
            </div>
            <div>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    name="name"
                    value={editingClient?.name || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded border border-gray-300 text-gray-900 bg-white"
                  />
                  <input
                    type="text"
                    name="relationship"
                    value={editingClient?.relationship || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded border border-gray-300 text-sm text-gray-900 bg-white"
                    placeholder="Relationship"
                  />
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-white text-2xl">{client.name}</h3>
                  <p className="text-blue-100">{client.relationship}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editingClient?.email || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                      />
                    ) : (
                      <p className="text-gray-800 dark:text-gray-200">{client.email || 'N/A'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={editingClient?.phone || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                      />
                    ) : (
                      <p className="text-gray-800 dark:text-gray-200">{client.phone || 'N/A'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                    {isEditing ? (
                      <textarea
                        name="address"
                        value={editingClient?.address || ''}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                      />
                    ) : (
                      <p className="text-gray-800 dark:text-gray-200">{client.address || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  {isEditing ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cultural Preferences:</label>
                      <textarea
                        name="cultural_preferences"
                        value={editingClient?.cultural_preferences || ''}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Cultural Preferences:</span> {client.cultural_preferences}
                    </p>
                  )}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {new Date(client.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h2>
            <p className="text-gray-600 dark:text-gray-400">No recent activity to display.</p>
          </div>
        </div>
      </div>

      {/* Client Documents Section */}
      <div className="mt-6">
        <ClientDocuments clientId={client?.id || ''} clientName={client.name} />
      </div>

      {/* Create Case Modal */}
      <CreateCaseModal
        isOpen={showCreateCaseModal}
        onClose={() => setShowCreateCaseModal(false)}
        clientId={client?.id || ''}
        clientName={client.name}
        dependants={dependants}
        onCaseCreated={() => {
          toast.success('Case created successfully!');
          setShowCreateCaseModal(false);
          // Optionally navigate to cases board
          // navigate('/cases');
        }}
        parlorId={'ubunye-funerals'} // TODO: Get from client data once we fix the type
      />
    </div>
  );
};

export default ClientDetails;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Phone, Mail, MapPin, User as UserIcon, Calendar, Edit, Save, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Partial<Client> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
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
        .eq('id', id);
      
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
    const fetchClient = async () => {
      if (!id) {
        setError('No client ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Client not found');

setClient(data);
        setEditingClient({ ...data });
      } catch (err: any) {
        console.error('Error fetching client:', err);
        setError(err.message || 'Failed to load client details');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

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
    if (!editingClient || !id) return;
    
    setSaving(true);
    try {
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
        .eq('id', id)
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Clients
        </button>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Client
          </button>
        ) : (
          <div className="space-x-2">
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
              className="ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="w-4 h-4 mr-2 inline" />
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
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
                    className="w-full p-2 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    name="relationship"
                    value={editingClient?.relationship || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded border border-gray-300 text-sm"
                    placeholder="Relationship"
                  />
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-slate-900">{client.name}</h3>
                  <p className="text-blue-100">{client.relationship}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-sm text-gray-500">Email</p>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={editingClient?.email || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 rounded border border-gray-300"
                      />
                    ) : (
                      <p className="text-gray-800">{client.email || 'N/A'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-sm text-gray-500">Phone</p>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={editingClient?.phone || ''}
                        onChange={handleInputChange}
                        className="w-full p-2 rounded border border-gray-300"
                      />
                    ) : (
                      <p className="text-gray-800">{client.phone || 'N/A'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="w-full">
                    <p className="text-sm text-gray-500">Address</p>
                    {isEditing ? (
                      <textarea
                        name="address"
                        value={editingClient?.address || ''}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full p-2 rounded border border-gray-300"
                      />
                    ) : (
                      <p className="text-gray-800">{client.address || 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  {isEditing ? (
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-1">Cultural Preferences:</label>
                      <textarea
                        name="cultural_preferences"
                        value={editingClient?.cultural_preferences || ''}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full p-2 rounded border border-gray-300 text-sm"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Cultural Preferences:</span> {client.cultural_preferences}
                    </p>
                  )}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="text-gray-800">
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

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <p className="text-gray-600">No recent activity to display.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;

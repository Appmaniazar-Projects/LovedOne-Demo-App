import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, MapPin, Users } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import AddClientModal from './AddClientModal'; // FIX: Import the modal component

// Define the Client type based on the new Supabase table
export interface Client {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  address: string;
  cultural_preferences: string;
  created_at: string;
  user_id: string | null;
}

// Add a new Profile type
interface Profile {
  id: string;
  role: 'staff' | 'admin' | 'super_admin';
  full_name: string;
}

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null); // For user role
  const [staffList, setStaffList] = useState<Profile[]>([]); // For assignment dropdown

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Get the current user's profile to determine their role
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user logged in");

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, full_name')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setUserProfile(profile as Profile);

        // 2. Fetch all clients (RLS will filter them based on role)
        const { data, error } = await supabase.from('clients').select('*');
        if (error) throw error;
        if (data) setClients(data);

        // 3. If user is an admin, fetch all staff members for the assignment dropdown
        if (profile.role === 'admin' || profile.role === 'super_admin') {
          const { data: staff, error: staffError } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .in('role', ['staff', 'admin']); // Or just ['staff'] depending on who can be assigned
          
          if (staffError) throw staffError;
          setStaffList(staff as Profile[]);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAssignClient = async (clientId: string, newStaffId: string) => {
    // Optimistically update the UI
    setClients(clients.map(c => c.id === clientId ? { ...c, user_id: newStaffId } : c));

    const { error } = await supabase
      .from('clients')
      .update({ user_id: newStaffId })
      .eq('id', clientId);

    if (error) {
      // If the update fails, revert the change and show an error
      setError(`Failed to assign client: ${error.message}`);
      // Consider reverting the optimistic update here if needed
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.phone && client.phone.includes(searchTerm))
  );

  if (loading) {
    return <div className="p-6 text-center">Loading clients...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }

  return (
    // FIX: Wrap everything in a React Fragment
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
            <p className="text-slate-600">Manage family contacts and relationships</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Client</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search clients by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Clients</p>
                <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          {/* Other stats can be re-added here if needed */}
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-lg">
                      {client.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{client.name}</h3>
                    <p className="text-sm text-slate-500">{client.relationship || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4" />
                  <span>{client.email || 'No email'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span>{client.address || 'No address'}</span>
                </div>
              </div>

              {client.cultural_preferences && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Cultural Preferences:</span> {client.cultural_preferences}
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Added: {new Date(client.created_at).toLocaleDateString()}</span>
                  <button className="text-blue-600 hover:text-blue-800 font-medium">
                    View Details
                  </button>
                </div>
              </div>

              {/* --- Client Assignment UI for Admins --- */}
              {(userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <label htmlFor={`assign-${client.id}`} className="text-sm font-medium text-slate-700 block mb-1">
                    Assign to:
                  </label>
                  <select
                    id={`assign-${client.id}`}
                    value={client.user_id || ''}
                    onChange={(e) => handleAssignClient(client.id, e.target.value)}
                    className="w-full px-2 py-1 border border-slate-300 rounded-md text-sm"
                  >
                    <option value="" disabled>Select Staff...</option>
                    {staffList.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <div className="text-slate-400 text-lg">No clients found</div>
            <p className="text-slate-500 mt-2">Try adjusting your search terms</p>
          </div>
        )}
      </div>
      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClientAdded={(newClient: Client) => { // FIX: Add type to newClient
          setClients((prevClients) => [...prevClients, newClient]);
          setIsModalOpen(false);
        }}
      />
    </>
  );
};

export default Clients;
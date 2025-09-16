import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, MapPin, Users, ArrowRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';
import AddClientModal from './AddClientModal';
import { useNavigate } from 'react-router-dom';

interface Client {
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

interface Profile {
  id: string;
  role: 'staff' | 'admin' | 'super_admin';
  full_name: string;
}

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const { theme: _ } = useTheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [staffList, setStaffList] = useState<Profile[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user logged in");

        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role, full_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          setUserProfile(profile);

          // Fetch clients based on user role
          let query = supabase.from('clients').select('*');

          if (profile.role === 'staff') {
            query = query.eq('user_id', user.id);
          }

          const { data: clientsData, error: clientsError } = await query;
          if (clientsError) throw clientsError;

          // If admin/super_admin, fetch staff for assignment
          if (profile.role === 'admin' || profile.role === 'super_admin') {
            const { data: staffData } = await supabase
              .from('profiles')
              .select('id, full_name, role')
              .eq('role', 'staff');
            setStaffList(staffData || []);
          }

          setClients(clientsData || []);
        }
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAssignClient = async (clientId: string, newStaffId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ user_id: newStaffId || null })
        .eq('id', clientId);

      if (error) throw error;

      setClients(prevClients =>
        prevClients.map(client =>
          client.id === clientId ? { ...client, user_id: newStaffId || null } : client
        )
      );
    } catch (error) {
      console.error('Error assigning client:', error);
    }
  };

  const filteredClients = clients.filter(
    client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.phone && client.phone.includes(searchTerm))
  );

  if (loading) {
    return <div className="p-6 text-center dark:text-white">Loading clients...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500 dark:text-red-400">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage your clients and their information</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Client
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <div className="text-gray-500 dark:text-gray-400 text-lg">No clients found</div>
          <p className="text-gray-400 dark:text-gray-500 mt-2">
            {searchTerm ? 'Try adjusting your search terms' : 'Add a new client to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {client.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {client.relationship}
                    </p>
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/clients/${client.id}`);
                    }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Mail className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                    <span className="truncate">{client.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                    <span>{client.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                    <span className="line-clamp-2">{client.address || 'No address'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/clients/${client.id}`);
                      }}
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Added: {new Date(client.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {(userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label
                      htmlFor={`assign-${client.id}`}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Assign to:
                    </label>
                    <select
                      id={`assign-${client.id}`}
                      value={client.user_id || ''}
                      onChange={(e) => handleAssignClient(client.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="" disabled>
                        Select Staff...
                      </option>
                      {staffList.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClientAdded={(newClient: Client) => {
          setClients((prevClients) => [...prevClients, newClient]);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Clients;
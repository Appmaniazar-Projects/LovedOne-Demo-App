import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, Users, ArrowRight, FileText, Users2, Shield } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';
import AddClientModal from './AddClientModal';
import { useNavigate, useLocation, useOutletContext, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plan, Dependant, Payment } from '../../types';
import { slugify } from '../../utils/slugify';

export interface Client {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  address: string;
  cultural_preferences: string;
  plan_id?: string | null;
  status: 'active' | 'lapsed' | 'deceased';
  parlor_id?: string;
  created_at: string;
  user_id: string | null;
  document_count?: number;
  plan?: Plan | null;
  dependants?: Dependant[];
  payments?: Payment[];
  lastPayment?: Payment | null;
}

interface UserProfile {
  id: string;
  role: 'staff' | 'admin' | 'super_admin' | 'viewer';
  full_name: string;
  parlor_id?: string;
}

const Clients: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme: _ } = useTheme();
  const { parlorId: parlorKey } = useParams<{ parlorId: string }>();
  const outlet = useOutletContext<{ parlorId: string; parlorRouteKey: string; parlorName: string }>();
  const resolvedParlorId = outlet?.parlorId || '';
  void parlorKey;
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [currentParlorId, setCurrentParlorId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      if (resolvedParlorId) {
        setCurrentParlorId(resolvedParlorId);
      } else {
        console.warn('No parlor specified in URL');
        setCurrentParlorId('');
        setError('No parlor specified in URL');
      }

      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('You must be logged in to view clients');
        }

        console.log('Fetching data for user:', user.id);

        // Fetch user profile from users table
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('id, role, full_name, parlor_id')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          throw new Error('User profile not found. Please contact an administrator.');
        }

        console.log('User profile:', profileData);

        if (profileData) {
          setUserProfile(profileData);

          // Determine which parlor ID to use when creating/assigning, but
          // do not use it to limit which clients are visible.
          let filterParlorId = resolvedParlorId;
          if (!filterParlorId && profileData.parlor_id) {
            filterParlorId = profileData.parlor_id;
          }

          // Fetch all clients for this company/parlor with related data
          console.log('Fetching all clients for role:', profileData.role);
          const { data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select(`
              *,
              plans:plan_id (
                id,
                name,
                is_active,
                description,
                monthly_premium,
                cover_amount
              ),
              dependants (
                id,
                name,
                relationship,
                date_of_birth,
                contact_number,
                email,
                notes
              )
            `)
            .order('created_at', { ascending: false });

          if (clientsError) {
            console.error('Error fetching clients:', clientsError);
            setError(clientsError.message);
            setClients([]);
            return;
          }

          console.log('Fetched clients data:', clientsData);

          // Fetch document counts for each client
          if (clientsData && clientsData.length > 0) {
            const clientsWithDocCounts = await Promise.all(
              clientsData.map(async (client) => {
                try {
                  const { count, error: countError } = await supabase
                    .from('client_documents')
                    .select('*', { count: 'exact', head: true })
                    .eq('client_id', client.id);

                  if (countError) {
                    console.log('Could not fetch document count for client:', client.id, countError);
                    return { ...client, document_count: 0 };
                  }

                  return { ...client, document_count: count || 0 };
                } catch (docError) {
                  console.log('Could not fetch document count for client:', client.id, docError);
                  return { ...client, document_count: 0 };
                }
              })
            );
            setClients(clientsWithDocCounts);
          } else {
            setClients([]);
          }

          // If admin/super_admin, fetch staff for assignment, optionally scoped
          // to the same parlor when a parlor ID is available.
          if (profileData.role === 'admin' || profileData.role === 'super_admin') {
            let staffQuery = supabase
              .from('users')
              .select('id, full_name, role')
              .eq('role', 'staff');

            if (filterParlorId) {
              staffQuery = staffQuery.eq('parlor_id', filterParlorId);
            }

            const { data: staffData } = await staffQuery;
            setStaffList(staffData || []);
          }
        } else {
          console.log('No profile found for user');
          setClients([]);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.pathname, resolvedParlorId]);

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
      
      toast.success('Client assigned successfully!');
    } catch (error) {
      console.error('Error assigning client:', error);
      toast.error('Failed to assign client');
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

  console.log('Rendering clients component with:', { clients: clients.length, searchTerm, filteredClients: filteredClients.length });

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clients</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage your clients and their information</p>
        </div>
        <button
          onClick={() => {
            if (!currentParlorId) {
              console.error('Cannot open modal: No parlor ID available');
              setError('Cannot add client: Parlor not properly loaded');
              return;
            }
            console.log('Opening modal with parlor ID:', currentParlorId);
            setIsModalOpen(true);
          }}
          disabled={!currentParlorId}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors w-full md:w-auto justify-center"
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
              onClick={() => navigate(`/${resolvedParlorId}/clients/${slugify(client.name)}`)}
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
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Mail className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                    <span className="truncate">{client.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                    <span>{client.phone || 'No phone'}</span>
                  </div>
                  
                  {/* Plan */}
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Shield className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                    <span>{client.plan?.name || 'No plan'}</span>
                  </div>
                  
                  {/* Dependants */}
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Users2 className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                    <span>{client.dependants?.length || 0} dependant(s)</span>
                  </div>
                  
                  {/* Status */}
                  <div className="flex items-center text-sm">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      client.status === 'active' ? 'bg-green-500' :
                      client.status === 'lapsed' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className={`font-medium ${
                      client.status === 'active' ? 'text-green-700 dark:text-green-400' :
                      client.status === 'lapsed' ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'
                    }`}>
                      {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/${resolvedParlorId}/clients/${slugify(client.name)}`);
                      }}
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <FileText className="w-4 h-4 mr-1" />
                        <span>{client.document_count || 0} docs</span>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(client.created_at).toLocaleDateString()}
                      </span>
                    </div>
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
                      <option value="">Unassigned</option>
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

      {currentParlorId && (
        <AddClientModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          parlorId={currentParlorId}
          onClientAdded={(newClient: Client) => {
            console.log('New client added:', newClient);
            const clientWithDocCount = { ...newClient, document_count: 0 };
            setClients((prevClients) => {
              return [...prevClients, clientWithDocCount];
            });
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Clients;
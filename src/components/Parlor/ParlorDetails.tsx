import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Phone, Mail, MapPin, Users, Search } from 'lucide-react';

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

const ParlorDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchClients = async () => {
      if (!id) {
        console.error('No parlor ID provided');
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching clients for parlor ID:', id);
        
        // First, get the parlor slug from the id
        const { data: parlor, error: parlorError } = await supabase
          .from('parlors')
          .select('slug')
          .eq('id', id)
          .single();
          
        if (parlorError) throw parlorError;
        if (!parlor) throw new Error('Parlor not found');
        
        // Then fetch clients for this parlor
        const { data, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('parlor_slug', parlor.slug);
          
        if (clientsError) throw clientsError;
        
        console.log('Fetched clients data:', data);
        setClients(data || []);
      } catch (err: any) {
        console.error('Error fetching clients:', err);
        setError('Failed to load client details');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Loading Client Information</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">Loading client details...</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (error || clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error || 'No clients found for this parlor'}</span>
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Parlors
        </button>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search clients..."
            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Information</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {clients.length} {clients.length === 1 ? 'client' : 'clients'} found
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Relationship
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Cultural Preferences
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Added
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {clients
                .filter(client => 
                  client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  client.relationship.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  client.email.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {client.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-gray-200">
                        {client.relationship || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm text-gray-900 dark:text-gray-200">
                          <Mail className="h-4 w-4 mr-2 text-blue-500" />
                          {client.email || 'N/A'}
                        </div>
                        <div className="flex items-center text-sm text-gray-900 dark:text-gray-200">
                          <Phone className="h-4 w-4 mr-2 text-green-500" />
                          {client.phone || 'N/A'}
                        </div>
                        <div className="flex items-start text-sm text-gray-900 dark:text-gray-200">
                          <MapPin className="h-4 w-4 mr-2 mt-0.5 text-red-500 flex-shrink-0" />
                          <span>{client.address || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-200">
                        {client.cultural_preferences || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ParlorDetails;

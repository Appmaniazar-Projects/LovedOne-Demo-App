// Mock client data that persists on page reload
export interface MockClient {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  address: string;
  cultural_preferences: string;
  profile_picture_url: string | null;
  user_id: string;
  created_at: string;
  document_count?: number;
}

export const getMockClients = (): MockClient[] => {
  console.log('Getting mock clients from localStorage...');
  
  // Get clients from localStorage or return default mock clients
  const stored = localStorage.getItem('lovedone_mock_clients');
  console.log('Stored clients:', stored);
  
  if (stored) {
    try {
      const parsedClients = JSON.parse(stored);
      console.log('Parsed clients from localStorage:', parsedClients);
      return parsedClients;
    } catch (error) {
      console.error('Error parsing stored clients:', error);
    }
  }
  
  console.log('No stored clients found, creating default mock clients');
  
  // Default mock clients
  const defaultClients: MockClient[] = [
    {
      id: 'mock-client-1',
      name: 'Aphiwe Ncama',
      relationship: 'Son',
      email: 'aphiwencama@gmail.com',
      phone: '+27 82 123 4567',
      address: '123 Main Street, Cape Town, 8001',
      cultural_preferences: 'Christian burial with traditional Zulu elements',
      profile_picture_url: null,
      user_id: 'mock-user',
      created_at: new Date('2024-01-15').toISOString(),
      document_count: 3
    },
    {
      id: 'mock-client-2',
      name: 'Akhona Majola',
      relationship: 'Daughter',
      email: 'akhona.majola@email.com',
      phone: '+27 83 234 5678',
      address: '456 Oak Avenue, Johannesburg, 2000',
      cultural_preferences: 'Catholic funeral service with Xhosa traditions',
      profile_picture_url: null,
      user_id: 'mock-user',
      created_at: new Date('2024-01-20').toISOString(),
      document_count: 1
    },
    {
      id: 'mock-client-3',
      name: 'David Williams',
      relationship: 'Husband',
      email: 'david.williams@email.com',
      phone: '+27 84 345 6789',
      address: '789 Pine Road, Durban, 4000',
      cultural_preferences: 'Hindu cremation with traditional ceremonies',
      profile_picture_url: null,
      user_id: 'mock-user',
      created_at: new Date('2024-01-25').toISOString(),
      document_count: 2
    },
    {
      id: 'mock-client-4',
      name: 'Nomsa Dlamini',
      relationship: 'Mother',
      email: 'nomsa.dlamini@email.com',
      phone: '+27 85 456 7890',
      address: '321 Elm Street, Pretoria, 0001',
      cultural_preferences: 'Traditional Swazi burial with family gathering',
      profile_picture_url: null,
      user_id: 'mock-user',
      created_at: new Date('2024-02-01').toISOString(),
      document_count: 4
    },
    {
      id: 'mock-client-5',
      name: 'Thabo Mthembu',
      relationship: 'Brother',
      email: 'thabo.mthembu@email.com',
      phone: '+27 86 567 8901',
      address: '654 Birch Lane, Port Elizabeth, 6001',
      cultural_preferences: 'Methodist funeral with Zulu cultural elements',
      profile_picture_url: null,
      user_id: 'mock-user',
      created_at: new Date('2024-02-05').toISOString(),
      document_count: 0
    }
  ];
  
  // Save default clients to localStorage
  console.log('Saving default clients to localStorage:', defaultClients);
  localStorage.setItem('lovedone_mock_clients', JSON.stringify(defaultClients));
  console.log('Default clients saved successfully');
  return defaultClients;
};

export const saveMockClients = (clients: MockClient[]) => {
  localStorage.setItem('lovedone_mock_clients', JSON.stringify(clients));
};

export const addMockClient = (client: Omit<MockClient, 'id' | 'created_at'>): MockClient => {
  const newClient: MockClient = {
    ...client,
    id: `mock-client-${Date.now()}`,
    created_at: new Date().toISOString(),
    document_count: 0,
    profile_picture_url: client.profile_picture_url || null
  };
  
  const clients = getMockClients();
  const updatedClients = [...clients, newClient];
  saveMockClients(updatedClients);
  
  return newClient;
};

export const updateMockClient = (id: string, updates: Partial<MockClient>): MockClient | null => {
  const clients = getMockClients();
  const clientIndex = clients.findIndex(c => c.id === id);
  
  if (clientIndex === -1) return null;
  
  const updatedClient = { ...clients[clientIndex], ...updates };
  clients[clientIndex] = updatedClient;
  saveMockClients(clients);
  
  return updatedClient;
};

export const deleteMockClient = (id: string): boolean => {
  const clients = getMockClients();
  const filteredClients = clients.filter(c => c.id !== id);
  
  if (filteredClients.length === clients.length) return false;
  
  saveMockClients(filteredClients);
  return true;
};

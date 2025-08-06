import { Client, DeceasedProfile, Task, Payment, Document, Service, Notification, User, Analytics } from '../types';

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Aphiwe Ncama',
    email: 'aphiwencama@gmail.com',
    phone: '+27 82 123 4567',
    address: '123 Main St, Cape Town',
    relationship: 'Son',
    culturalPreferences: 'Christian',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Akhona Majola',
    email: 'akhona.majola@email.com',
    phone: '+27 83 234 5678',
    address: '456 Oak Ave, Johannesburg',
    relationship: 'Daughter',
    culturalPreferences: 'Catholic',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '3',
    name: 'David Williams',
    email: 'david.williams@email.com',
    phone: '+27 84 345 6789',
    address: '789 Pine Rd, Durban',
    relationship: 'Husband',
    culturalPreferences: 'Hindu',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  }
];

export const mockDeceasedProfiles: DeceasedProfile[] = [
  {
    id: '1',
    name: 'Aphiwe Ncama ',
    dateOfBirth: new Date('1945-03-15'),
    dateOfDeath: new Date('2024-01-10'),
    picture: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    serviceType: 'burial',
    status: 'ongoing',
    assignedDirector: 'Kgopotso',
    clientId: '1',
    culturalRequirements: 'Christian burial service',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Ezile Qhama',
    dateOfBirth: new Date('1952-07-22'),
    dateOfDeath: new Date('2024-01-18'),
    picture: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    serviceType: 'cremation',
    status: 'quote',
    assignedDirector: 'Kgopotso',
    clientId: '2',
    culturalRequirements: 'Catholic cremation service',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '3',
    name: 'Priya Williams',
    dateOfBirth: new Date('1958-12-05'),
    dateOfDeath: new Date('2024-01-22'),
    picture: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    serviceType: 'burial',
    status: 'closed',
    assignedDirector: 'Kgopotso',
    clientId: '3',
    culturalRequirements: 'Hindu burial customs',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25')
  }
];

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Obtain death certificate',
    description: 'Collect official death certificate from Department of Health',
    type: 'legal',
    priority: 'high',
    status: 'completed',
    assignedTo: 'Kgopotso',
    dueDate: new Date('2024-01-17'),
    caseId: '1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-17')
  },
  {
    id: '2',
    title: 'Prepare burial site',
    description: 'Coordinate with cemetery for grave preparation',
    type: 'burial',
    priority: 'medium',
    status: 'in-progress',
    assignedTo: 'Kgopotso',
    dueDate: new Date('2024-01-28'),
    caseId: '1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '3',
    title: 'Arrange cremation appointment',
    description: 'Schedule cremation with approved facility',
    type: 'cremation',
    priority: 'urgent',
    status: 'pending',
    assignedTo: 'Kgopotso',
    dueDate: new Date('2024-01-30'),
    caseId: '2',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20')
  }
];

export const mockPayments: Payment[] = [
  {
    id: '1',
    amount: 15000,
    method: 'eft',
    status: 'completed',
    transactionId: 'TXN-2024-001',
    caseId: '1',
    description: 'Funeral service deposit',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: '2',
    amount: 8500,
    method: 'easypay',
    status: 'pending',
    transactionId: 'EP-2024-002',
    caseId: '2',
    description: 'Cremation service payment',
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21')
  },
  {
    id: '3',
    amount: 25000,
    method: 'card',
    status: 'completed',
    transactionId: 'CC-2024-003',
    caseId: '3',
    description: 'Full service payment',
    createdAt: new Date('2024-01-26'),
    updatedAt: new Date('2024-01-26')
  }
];

export const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Death Certificate.pdf',
    type: 'death-certificate',
    url: '/documents/death-cert-1.pdf',
    size: 245760,
    caseId: '1',
    uploadedBy: 'Kgopotso',
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17')
  },
  {
    id: '2',
    name: 'ID Copy.pdf',
    type: 'id',
    url: '/documents/id-copy-1.pdf',
    size: 189440,
    caseId: '1',
    uploadedBy: 'Kgopotso',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: '3',
    name: 'Insurance Policy.pdf',
    type: 'insurance',
    url: '/documents/insurance-2.pdf',
    size: 532480,
    caseId: '2',
    uploadedBy: 'Kgopotso',
    expiryDate: new Date('2024-12-31'),
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21')
  }
];

export const mockServices: Service[] = [
  {
    id: '1',
    name: 'Memorial Service',
    date: new Date('2024-01-30'),
    time: '14:00',
    venue: 'St. Mary\'s Church, Cape Town',
    type: 'memorial',
    caseId: '1',
    staff: ['Kgopotso', 'John Anderson'],
    notes: 'Family requested traditional hymns',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '2',
    name: 'Cremation Service',
    date: new Date('2024-02-02'),
    time: '10:00',
    venue: 'Johannesburg Crematorium',
    type: 'cremation',
    caseId: '2',
    staff: ['Kgopotso', 'Lisa Wilson'],
    notes: 'Small family gathering',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-21')
  }
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Payment Received',
    message: 'Payment of R15,000 received for Margaret Smith case',
    type: 'success',
    read: false,
    userId: '1',
    caseId: '1',
    createdAt: new Date('2024-01-16')
  },
  {
    id: '2',
    title: 'Task Overdue',
    message: 'Cremation appointment task is overdue',
    type: 'warning',
    read: false,
    userId: '2',
    caseId: '2',
    createdAt: new Date('2024-01-22')
  },
  {
    id: '3',
    title: 'Document Uploaded',
    message: 'New death certificate uploaded for case #1',
    type: 'info',
    read: true,
    userId: '1',
    caseId: '1',
    createdAt: new Date('2024-01-17')
  }
];

export const mockUser: User = {
  id: '1',
  name: 'Kgopotso',
  email: 'Kgopotso@lovedone.com',
  role: 'manager',
  avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  permissions: ['read', 'write', 'delete', 'manage_users'],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

export const mockAnalytics: Analytics = {
  totalCases: 45,
  activeCases: 12,
  completedCases: 33,
  totalRevenue: 1250000,
  monthlyRevenue: 185000,
  avgCaseValue: 27777,
  taskCompletionRate: 85,
  pendingPayments: 3
};
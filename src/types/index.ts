export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  relationship: string;
  culturalPreferences?: string;
  profilePictureUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeceasedProfile {
  id: string;
  name: string;
  dateOfBirth: Date;
  dateOfDeath: Date;
  picture?: string;
  serviceType: 'burial' | 'cremation' | 'memorial';
  serviceTypeId?: string | null;
  status: 'quote' | 'ongoing' | 'closed';
  assignedDirector: string;
  clientId?: string;
  planId?: string | null;
  culturalRequirements?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'legal' | 'ceremonial' | 'burial' | 'cremation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  assignedTo: string;   // will hold users.id
  dueDate: Date;
  caseId: string;
  parlorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  amount: number;
  method: 'eft' | 'easypay' | 'snapscan' | 'card';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  caseId?: string | null;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  name: string;
  type: 'id' | 'death-certificate' | 'contract' | 'insurance' | 'other';
  url: string;
  size: number;
  caseId: string;
  uploadedBy: string;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  name: string;
  date: Date;
  time: string;
  venue: string;
  type: 'funeral' | 'memorial' | 'cremation' | 'burial';
  caseId: string;
  staff: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  userId: string;
  caseId?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'assistant' | 'viewer';
  avatar?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytics {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  totalRevenue: number;
  monthlyRevenue: number;
  avgCaseValue: number;
  taskCompletionRate: number;
  pendingPayments: number;
}
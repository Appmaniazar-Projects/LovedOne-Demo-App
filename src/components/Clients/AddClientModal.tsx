// src/components/Clients/AddClientModal.tsx
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../supabaseClient';
import { Client } from './Clients'; // Assuming Client interface is exported from Clients.tsx
import { toast } from 'react-hot-toast';
import { addMockClient } from '../../data/mockClients';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: (newClient: Client) => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onClientAdded }) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [culturalPreferences, setCulturalPreferences] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      console.log('Adding new client...');
      console.log('Form data:', { name, relationship, email, phone, address, culturalPreferences });
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        console.log('Supabase not configured, creating mock client with persistence');
        // Create mock client if Supabase is not configured
        const newClient = addMockClient({
          name,
          relationship,
          email,
          phone,
          address,
          cultural_preferences: culturalPreferences,
          profile_picture_url: null,
          user_id: 'mock-user',
        });
        
        console.log('Mock client created and saved:', newClient);
        // Also ensure cached list updated
        try {
          const raw = localStorage.getItem('lovedone_mock_clients');
          const arr = raw ? JSON.parse(raw) : [];
          localStorage.setItem('lovedone_mock_clients', JSON.stringify([...arr, newClient]));
        } catch {}
        toast.success('Client added successfully!');
        onClientAdded(newClient);
        
        // Reset form
        setName('');
        setRelationship('');
        setEmail('');
        setPhone('');
        setAddress('');
        setCulturalPreferences('');
        onClose();
        return;
      }

      console.log('Supabase is configured, proceeding with real database');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      
      if (!user) {
        console.log('No user logged in, creating mock client with persistence');
        // Create mock client if no user is logged in
        const newClient = addMockClient({
          name,
          relationship,
          email,
          phone,
          address,
          cultural_preferences: culturalPreferences,
          profile_picture_url: null,
          user_id: 'mock-user',
        });
        
        console.log('Mock client created and saved:', newClient);
        toast.success('Client added successfully!');
        onClientAdded(newClient);
        
        // Reset form
        setName('');
        setRelationship('');
        setEmail('');
        setPhone('');
        setAddress('');
        setCulturalPreferences('');
        onClose();
        return;
      }
      
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name,
          relationship,
          email,
          phone,
          address,
          cultural_preferences: culturalPreferences,
          user_id: user.id, // Assign client to current user
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding client:', error);
        throw error;
      }

      if (data) {
        console.log('Client added successfully:', data);
        toast.success('Client added successfully!');
        // Ensure local cache also has this client so navigation back still shows it
        try {
          const raw = localStorage.getItem('lovedone_mock_clients');
          const arr = raw ? JSON.parse(raw) : [];
          const cacheClient = {
            id: data.id,
            name: data.name,
            relationship: data.relationship || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            cultural_preferences: data.cultural_preferences || '',
            profile_picture_url: data.profile_picture_url || null,
            user_id: data.user_id || 'mock-user',
            created_at: (data.created_at || new Date().toISOString()),
            document_count: 0
          };
          localStorage.setItem('lovedone_mock_clients', JSON.stringify([...arr, cacheClient]));
        } catch {}
        onClientAdded(data as any);
        // Reset form
        setName('');
        setRelationship('');
        setEmail('');
        setPhone('');
        setAddress('');
        setCulturalPreferences('');
        onClose(); // Close modal on success
      }
    } catch (err: any) {
      console.error('Error in handleSubmit:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to add client');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="rounded-lg shadow-2xl p-8 w-full max-w-md bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/50">
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Add New Client</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg"
            required
          />
          <input
            type="text"
            placeholder="Relationship (e.g., Spouse, Sibling)"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg"
          />
          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg"
          />
          <textarea
            placeholder="Cultural Preferences"
            value={culturalPreferences}
            onChange={(e) => setCulturalPreferences(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg"
            rows={3}
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 disabled:bg-blue-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isSubmitting}
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
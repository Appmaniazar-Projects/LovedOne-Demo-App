import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Building, Sun, Moon, Edit2, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Parlor {
  id: string;
  name: string;
  address: string;
  contact_email?: string;
  contact_phone?: string;
}

interface UserProfile {
  id: string;
  role: 'super_admin' | 'admin' | 'staff' | 'viewer';
  parlor_id?: string;
}

const ParlorSelector: React.FC = () => {
  const [parlors, setParlors] = useState<Parlor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedParlor, setSelectedParlor] = useState<Parlor | null>(null);
  const [parlorForm, setParlorForm] = useState({
    name: '',
    address: ''
  });
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();


  useEffect(() => {
    const fetchUserAndParlors = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('You must be logged in to access parlors.');
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, role, parlor_id')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setError('Could not load user profile.');
          return;
        }

        setUserProfile(profile);

        // Fetch parlors based on user role
        let parlorQuery = supabase.from('parlors').select('*');
        
        if (profile.role === 'super_admin') {
          // Super admin can see all parlors
          console.log('Super admin - showing all parlors');
        } else if (profile.parlor_id) {
          // Admin/staff can only see their assigned parlor
          parlorQuery = parlorQuery.eq('id', profile.parlor_id);
          console.log('Admin/staff - showing assigned parlor only:', profile.parlor_id);
        } else {
          setError('You are not assigned to any parlor. Please contact an administrator.');
          return;
        }

        const { data: parlorData, error: parlorError } = await parlorQuery;
        if (parlorError) throw parlorError;
        
        setParlors(parlorData ?? []);
      } catch (err: any) {
        console.error('Error fetching data:', err.message || err);
        setError('Could not load parlors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndParlors();
  }, []);

  const handleCreateParlor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parlorForm.name || !parlorForm.address) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('parlors')
        .insert({
          name: parlorForm.name,
          address: parlorForm.address
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setParlors(prev => [...prev, data]);
        setIsModalOpen(false);
        setParlorForm({ name: '', address: '' });
      }
    } catch (err: any) {
      console.error('Error creating parlor:', err.message);
      alert('Failed to create parlor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditParlor = (parlor: Parlor) => {
    setSelectedParlor(parlor);
    setParlorForm({
      name: parlor.name,
      address: parlor.address
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateParlor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParlor || !parlorForm.name || !parlorForm.address) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('parlors')
        .update({
          name: parlorForm.name,
          address: parlorForm.address
        })
        .eq('id', selectedParlor.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setParlors(prev => prev.map(p => p.id === data.id ? data : p));
        setIsEditModalOpen(false);
        setParlorForm({ name: '', address: '' });
        setSelectedParlor(null);
      }
    } catch (err: any) {
      console.error('Error updating parlor:', err.message);
      alert('Failed to update parlor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteParlor = async (parlorId: string) => {
    if (!confirm('Are you sure you want to delete this parlor? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('parlors')
        .delete()
        .eq('id', parlorId);

      if (error) throw error;

      setParlors(prev => prev.filter(p => p.id !== parlorId));
    } catch (err: any) {
      console.error('Error deleting parlor:', err.message);
      alert('Failed to delete parlor. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-slate-600 dark:text-slate-400 text-lg">Loading parlors...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-red-600 dark:text-red-400 text-lg">{error}</span>
      </div>
    );
  }

  if (parlors.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-slate-500 dark:text-slate-400 text-lg">No parlors found. Please add some parlors first.</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Select a Parlor</h1>
          <p className="text-gray-600 dark:text-gray-300">Choose a parlor to manage or create a new one</p>
        </div>
        <div className="flex justify-end mb-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Your Parlors</h2>
            <div className="space-y-3">
              {parlors.map((parlor) => (
                <div 
                  key={parlor.id} 
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div 
                    className="flex items-center flex-1 cursor-pointer"
                    onClick={() => navigate(`/${parlor.id}/dashboard`)}
                  >
                    <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                      <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{parlor.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{parlor.address}</p>
                      {parlor.contact_phone && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">📞 {parlor.contact_phone}</p>
                      )}
                    </div>
                  </div>
                  {userProfile?.role === 'super_admin' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditParlor(parlor);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Edit parlor"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteParlor(parlor.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete parlor"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {userProfile?.role === 'super_admin' && (
              <button
                className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                onClick={() => setIsModalOpen(true)}
              >
                + Create New Parlor
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Parlor Modal */}
      {isEditModalOpen && selectedParlor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-lg shadow-2xl w-full max-w-md bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-900">Edit Parlor</h2>
              <button onClick={() => {
                setIsEditModalOpen(false);
                setSelectedParlor(null);
                setParlorForm({ name: '', address: '' });
              }} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleUpdateParlor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Parlor Name</label>
                <input 
                  value={parlorForm.name} 
                  onChange={(e) => setParlorForm({ ...parlorForm, name: e.target.value })} 
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" 
                  placeholder="e.g. Peaceful Rest Funeral Home" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Address</label>
                <textarea 
                  value={parlorForm.address} 
                  onChange={(e) => setParlorForm({ ...parlorForm, address: e.target.value })} 
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" 
                  rows={3}
                  placeholder="e.g. 123 Main Street, Cape Town" 
                  required 
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedParlor(null);
                    setParlorForm({ name: '', address: '' });
                  }} 
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-slate-900 hover:bg-slate-50 dark:hover:bg-gray-700"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Parlor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Parlor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-lg shadow-2xl w-full max-w-md bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-900">Create New Parlor</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleCreateParlor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Parlor Name</label>
                <input 
                  value={parlorForm.name} 
                  onChange={(e) => setParlorForm({ ...parlorForm, name: e.target.value })} 
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" 
                  placeholder="e.g. Peaceful Rest Funeral Home" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Address</label>
                <textarea 
                  value={parlorForm.address} 
                  onChange={(e) => setParlorForm({ ...parlorForm, address: e.target.value })} 
                  className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" 
                  rows={3}
                  placeholder="e.g. 123 Main Street, Cape Town" 
                  required 
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-slate-900 hover:bg-slate-50 dark:hover:bg-gray-700"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Parlor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParlorSelector;

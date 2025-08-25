import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Building, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Parlor {
  id: string;
  name: string;
  slug: string;
  address: string;
}

const ParlorSelector: React.FC = () => {
  const [parlors, setParlors] = useState<Parlor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();

    useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
        } else {
          setUser(profile);
        }
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchParlors = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('parlors').select('*');

        if (error) throw error;
        setParlors(data ?? []);
      } catch (err: any) {
        console.error('Error fetching parlors:', err.message || err);
        setError('Could not load parlors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchParlors();
  }, []);

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
                  className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                  onClick={() => navigate(`/${parlor.slug}/dashboard`)}
                >
                  <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                    <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{parlor.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{parlor.address}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              onClick={() => console.log('Create new parlor')}
            >
              + Create New Parlor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParlorSelector;

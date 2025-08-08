import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Building, Sun, Moon } from 'lucide-react';

interface Parlor {
  id: string;
  name: string;
  slug: string;
  address: string;
}

const ParlorSelector: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [parlors, setParlors] = useState<Parlor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Add a useEffect to apply dark mode class to the root element
  useEffect(() => {
    const html = document.querySelector('html');
    if (html) {
      if (isDarkMode) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  }, [isDarkMode]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Select a Parlor</h1>
            {user && user.role === 'super_admin' && (
              <p className="text-slate-600 dark:text-slate-400">Welcome, Super Admin!</p>
            )}
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>
        <p className="text-slate-600 dark:text-slate-400 mb-8">Choose which funeral parlor you would like to manage.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {parlors.map((parlor) => (
            <Link
              to={`/${parlor.slug}/dashboard`}
              key={parlor.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-700 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="flex-grow">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-primary-100 dark:bg-primary-900 text-primary-600 p-3 rounded-lg">
                    <Building className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{parlor.name}</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{parlor.address}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-primary-600 dark:text-primary-400 font-semibold text-sm">Manage Parlor &rarr;</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParlorSelector;

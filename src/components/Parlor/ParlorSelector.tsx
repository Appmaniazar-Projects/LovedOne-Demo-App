import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Building } from 'lucide-react';

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
        <span className="text-slate-600 text-lg">Loading parlors...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-red-600 text-lg">{error}</span>
      </div>
    );
  }

  if (parlors.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="text-slate-500 text-lg">No parlors found.</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Select a Parlor</h1>
        <p className="text-slate-600 mb-8">Choose which funeral parlor you would like to manage.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {parlors.map((parlor) => (
            <Link
              to={`/${parlor.slug}/dashboard`}
              key={parlor.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="flex-grow">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                    <Building className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{parlor.name}</h2>
                </div>
                <p className="text-slate-500 text-sm">{parlor.address}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-blue-600 font-semibold text-sm">Manage Parlor &rarr;</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParlorSelector;

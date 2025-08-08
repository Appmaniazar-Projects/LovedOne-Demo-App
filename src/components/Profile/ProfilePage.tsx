import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
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
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!user) {
    return <div>Could not load user profile.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h1>
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex items-center space-x-6 mb-8">
          <img
            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=0D8ABC&color=fff`}
            alt={user.full_name}
            className="w-24 h-24 rounded-full"
          />
          <div>
            <h2 className="text-3xl font-bold text-slate-900">{user.role === 'super_admin' ? 'Super Admin' : user.full_name}</h2>
            <p className="text-slate-500 capitalize">{user.role}</p>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-500">Full Name</label>
              <p className="text-slate-800">{user.full_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500">Email Address</label>
              <p className="text-slate-800">{user.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

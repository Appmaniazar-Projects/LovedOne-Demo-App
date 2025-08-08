import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search, User, LogOut, Settings } from 'lucide-react';
import { mockNotifications } from '../../data/mockData';
import { supabase } from '../../supabaseClient';

interface HeaderProps {
  parlorName: string;
}

const Header: React.FC<HeaderProps> = ({ parlorName }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

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

  const unreadNotifications = mockNotifications.filter(n => !n.read).length;

  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Parlor Name */}
        <div>
          <h1 className="text-xl font-bold text-slate-800">{parlorName}</h1>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md ml-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search cases, clients, or tasks..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bell className="w-6 h-6" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {mockNotifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="p-4 border-b border-slate-100 hover:bg-slate-50">
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.read ? 'bg-slate-300' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{notification.title}</p>
                          <p className="text-sm text-slate-600">{notification.message}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {notification.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4">
                  <button className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
                      <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                {loading ? (
                  <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
                ) : user && (
                  <>
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=0D8ABC&color=fff`}
                      alt={user.full_name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="text-left">
                      <p className="text-sm font-medium text-slate-900">{user.role === 'super_admin' ? 'Super Admin' : user.full_name}</p>
                      <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                    </div>
                  </>
                )}
              </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                                {user && (
                  <div className="p-4 border-b border-slate-200">
                    <p className="font-medium text-slate-900 truncate">{user.role === 'super_admin' ? 'Super Admin' : user.full_name}</p>
                    <p className="text-sm text-slate-500 truncate" title={user.email}>{user.email}</p>
                  </div>
                )}
                <div className="p-2">
                                    <Link to="profile" className="w-full flex items-center space-x-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-100 rounded-lg">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link to="settings" className="w-full flex items-center space-x-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-100 rounded-lg">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <hr className="my-2 border-slate-200" />
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
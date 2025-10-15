import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search, User, LogOut, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { theme, toggleTheme } = useTheme();

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
    <header className={`bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4 w-full animate-slideInDown`}>
      <div className="flex items-center justify-between w-full">
        {/* Parlor Name */}
        <div className="animate-fadeIn animation-delay-100">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            {parlorName.split('').map((letter, index) => (
              <span 
                key={index} 
                className="animate-fadeInLetter"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {letter === ' ' ? '\u00A0' : letter}
              </span>
            ))}
          </h1>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md ml-6 animate-fadeIn animation-delay-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400 w-5 h-5 animate-pulse-slow" />
            <input
              type="text"
              placeholder="Search cases, clients, or tasks..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4 animate-fadeIn animation-delay-300">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-300 hover:scale-110"
            >
              <Bell className="w-6 h-6 text-yellow-500 transition-transform duration-300 hover:rotate-12" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700 animate-fadeInDown`}>
                <div className="p-4 border-b border-slate-200 dark:border-gray-700">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {mockNotifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="p-4 border-b border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700">
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.read ? 'bg-slate-300' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-gray-100">{notification.title}</p>
                          <p className="text-sm text-slate-600 dark:text-gray-300">{notification.message}</p>
                          <p className="text-xs text-slate-400 dark:text-gray-400 mt-1">
                            {notification.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4">
                  <button className="w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 hover:rotate-180"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 animate-spin-slow text-white" />
            ) : (
              <Moon className="w-5 h-5 animate-spin-slow text-black" />
            )}
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105"
            >
              {loading ? (
                <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse" />
              ) : user && (
                <>
                  <img
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=Kgopotso&background=0D8ABC&color=fff`}
                    alt="Kgopotso"
                    className="w-8 h-8 rounded-full transition-transform duration-300 hover:scale-110 hover:rotate-6"
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Kgopotso</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 capitalize">{user.role}</p>
                  </div>
                </>
              )}
            </button>

            {showProfile && (
              <div className={`absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700 animate-fadeInDown`}>
                {user && (
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-700">
                    <p className="font-medium text-slate-900 dark:text-white truncate">Kgopotso</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400 truncate" title={user.email}>{user.email}</p>
                  </div>
                )}
                <div className="p-2">
                  <Link to="profile" className="w-full flex items-center space-x-2 px-3 py-2 text-left text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <Link to="settings" className="w-full flex items-center space-x-2 px-3 py-2 text-left text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <hr className="my-2 border-slate-200 dark:border-gray-700" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
                <div className="px-4 py-2 border-t border-slate-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Theme</span>
                    <button
                      onClick={toggleTheme}
                      className="p-1 rounded-full text-gray-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700"
                      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                    >
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4" />
                      ) : (
                        <Moon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
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
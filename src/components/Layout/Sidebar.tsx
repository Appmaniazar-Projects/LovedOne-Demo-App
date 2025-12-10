import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  CreditCard, 
  CheckSquare, 
  Calendar,
  BarChart3,
  Bell,
  Settings
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';
import LovedOneLogo from '../../assets/LovedOne_dashboard.png';

interface SidebarProps {
  parlorId: string;
  parlorName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ parlorId, parlorName }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const location = useLocation();

  const encodedParlorName = encodeURIComponent(parlorName);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: `/${encodedParlorName}/dashboard` },
    { id: 'clients', label: 'Clients', icon: Users, path: `/${encodedParlorName}/clients` },
    { id: 'cases', label: 'Cases', icon: FileText, path: `/${encodedParlorName}/cases` },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: `/${encodedParlorName}/payments` },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: `/${encodedParlorName}/tasks` },
    { id: 'services', label: 'Services', icon: Calendar, path: `/${encodedParlorName}/services` },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: `/${encodedParlorName}/reports` },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: `/${encodedParlorName}/notifications` },
    { id: 'settings', label: 'Settings', icon: Settings, path: `/${encodedParlorName}/settings` },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Fetch user profile from the users table
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .eq('parlor_id', parlorId)
          .single();
        
        setUser({ ...authUser, ...userProfile });
      }
      setLoading(false);
    };

    fetchUser();
  }, [parlorId]);

  return (
    <div className="w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-white h-full flex flex-col border-r border-slate-200 dark:border-slate-700 animate-slideInLeft transition-all duration-300 relative">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 animate-fadeIn">
        <div className="flex items-center space-x-3">
          <img
            src={LovedOneLogo}
            alt="LovedOne logo"
            className="w-10 h-10 rounded-lg object-contain"
          />
          <div>
            <h1 className="text-xl font-bold animate-fadeInUp bg-gradient-to-r from-red-600 via-red-400 to-white bg-clip-text text-transparent hover:scale-110 transition-all duration-300 cursor-pointer animate-pulse-text animate-gradient-shift drop-shadow-lg">
              LovedOne
            </h1>
            <p className="text-xs text-slate-400 animate-fadeInUp animation-delay-100">Funeral Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 flex flex-col">
        <ul className="flex-1 flex flex-col justify-between">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.id} className="animate-fadeInUp relative group" style={{ animationDelay: `${index * 150}ms` }}>
                <Link
                  to={item.path}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-left transition-all duration-300 transform hover:scale-105 hover:translate-x-1 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 animate-fadeIn animation-delay-500">
        <p className="text-sm text-slate-900 dark:text-slate-400 text-center animate-pulse-text">
          &copy; 2025 LovedOne<br />
          Compassionate tech for life's hardest moments
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
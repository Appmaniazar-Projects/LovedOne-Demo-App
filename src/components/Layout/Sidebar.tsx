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
  Settings,
  Heart,
  Menu,
  X
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarProps {
  parlorSlug: string;
}

const Sidebar: React.FC<SidebarProps> = ({ parlorSlug }) => {
  const [, setUser] = useState<any>(null);
  const [, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme } = useTheme();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: `/${parlorSlug}/dashboard` },
    { id: 'clients', label: 'Clients', icon: Users, path: `/${parlorSlug}/clients` },
    { id: 'cases', label: 'Cases', icon: FileText, path: `/${parlorSlug}/cases` },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: `/${parlorSlug}/payments` },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: `/${parlorSlug}/tasks` },
    { id: 'services', label: 'Services', icon: Calendar, path: `/${parlorSlug}/services` },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: `/${parlorSlug}/reports` },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: `/${parlorSlug}/notifications` },
    { id: 'settings', label: 'Settings', icon: Settings, path: `/${parlorSlug}/settings` },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data) {
        setUser(data.user);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-${theme === 'dark' ? 'slate-900' : 'white'} text-${theme === 'dark' ? 'white' : 'slate-900'} h-full flex flex-col border-r border-slate-200 dark:border-slate-700 animate-slideInLeft transition-all duration-300 relative`}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute -right-3 top-6 z-50 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110`}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
      </button>

      {/* Logo */}
      <div className="p-6 border-b border-slate-700 animate-fadeIn">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center animate-pulse-slow">
            <Heart className="w-6 h-6 animate-heartbeat text-red-500 fill-red-500" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold animate-fadeInUp bg-gradient-to-r from-red-600 via-red-400 to-white bg-clip-text text-transparent hover:scale-110 transition-all duration-300 cursor-pointer animate-pulse-text animate-gradient-shift drop-shadow-lg">
                LovedOne
              </h1>
              <p className="text-xs text-slate-400 animate-fadeInUp animation-delay-100">Funeral Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 flex flex-col">
        <ul className="flex-1 flex flex-col justify-between">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.id} className="animate-fadeInUp" style={{ animationDelay: `${index * 150}ms` }}>
                <Link
                  to={item.path}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-2.5 rounded-lg text-left transition-all duration-300 transform hover:scale-105 ${isCollapsed ? '' : 'hover:translate-x-1'} ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : `text-${theme === 'dark' ? 'slate-300' : 'slate-900'} hover:bg-${theme === 'dark' ? 'slate-800' : 'slate-100'} hover:text-${theme === 'dark' ? 'white' : 'slate-900'}`
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-slate-700 dark:border-slate-700 animate-fadeIn animation-delay-500">
          <p className="text-sm text-slate-900 dark:text-slate-400 text-center animate-pulse-text">
            &copy; 2025 LovedOne<br />
            Compassionate tech for life's hardest moments
          </p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
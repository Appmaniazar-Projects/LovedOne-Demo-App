import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  CreditCard, 
  FolderOpen, 
  CheckSquare, 
  Calendar,
  BarChart3,
  Bell,
  Settings,
  Heart
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarProps {
  parlorSlug: string;
}

const Sidebar: React.FC<SidebarProps> = ({ parlorSlug }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: `/${parlorSlug}/dashboard` },
    { id: 'clients', label: 'Clients', icon: Users, path: `/${parlorSlug}/clients` },
    { id: 'cases', label: 'Cases', icon: FileText, path: `/${parlorSlug}/cases` },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: `/${parlorSlug}/payments` },
    { id: 'documents', label: 'Documents', icon: FolderOpen, path: `/${parlorSlug}/documents` },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: `/${parlorSlug}/tasks` },
    { id: 'services', label: 'Services', icon: Calendar, path: `/${parlorSlug}/services` },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: `/${parlorSlug}/reports` },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: `/${parlorSlug}/notifications` },
    { id: 'settings', label: 'Settings', icon: Settings, path: `/${parlorSlug}/settings` },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data) {
        setUser(data.user);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  return (
    <div className={`w-64 bg-${theme === 'dark' ? 'slate-900' : 'white'} text-${theme === 'dark' ? 'white' : 'slate-900'} min-h-screen flex flex-col`}>
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">LovedOne</h1>
            <p className="text-xs text-slate-400">Funeral Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : `text-${theme === 'dark' ? 'slate-300' : 'slate-900'} hover:bg-${theme === 'dark' ? 'slate-800' : 'slate-100'} hover:text-${theme === 'dark' ? 'white' : 'slate-900'}`
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 text-center">
          &copy; 2025 LovedOne<br />
          Compassionate tech for life's hardest moments
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
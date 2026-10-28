import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  CreditCard, 
  CheckSquare, 
  ListTodo,
  Calendar,
  BarChart3,
  Bell,
  Settings,
  AlertTriangle,
  ShieldCheck,
  Repeat
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useTheme } from '../../contexts/ThemeContext';
import LovedOneLogoLight from '../../assets/LovedOne_Logo_without-words_black.png';
import LovedOneLogoDark from '../../assets/LovedOne_dashboard.png';

interface SidebarProps {
  parlorId: string;        // real parlor UUID — used for DB queries
  parlorRouteKey?: string; // slug (or UUID) used to build URLs — falls back to parlorId
  parlorName: string;
  isMobile?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ parlorId, parlorRouteKey, parlorName, isMobile = false, onClose }) => {
  const [user, setUser] = useState<{ role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const location = useLocation();
  const routeKey = parlorRouteKey || parlorId;

  void parlorName;
  void loading;

  const isSuperAdmin = user?.role === 'super_admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: `/${routeKey}/dashboard` },
    { id: 'clients', label: 'Clients', icon: Users, path: `/${routeKey}/clients` },
    { id: 'cases', label: 'Cases', icon: CheckSquare, path: `/${routeKey}/cases` },
    { id: 'tasks', label: 'Tasks', icon: ListTodo, path: `/${routeKey}/tasks` },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: `/${routeKey}/payments` },
    { id: 'payment-alerts', label: 'Payment Alerts', icon: AlertTriangle, path: `/${routeKey}/payment-alerts` },
    { id: 'services', label: 'Services', icon: Calendar, path: `/${routeKey}/services` },
    { id: 'reports', label: 'Reports', icon: BarChart3, path: `/${routeKey}/reports` },
    // LovedOne-side, cross-parlour concern — only super_admin manages Pay@Go
    // onboarding, so this item (and its route) is hidden from every other role.
    ...(isSuperAdmin
      ? [{ id: 'payat-onboarding', label: 'Pay@ Onboarding', icon: ShieldCheck, path: `/${routeKey}/payat-onboarding` }]
      : []),
    { id: 'notifications', label: 'Notifications', icon: Bell, path: `/${routeKey}/notifications` },
    { id: 'settings', label: 'Settings', icon: Settings, path: `/${routeKey}/settings` },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Fetch by id only — NOT filtered by this page's parlorId. A
        // super_admin (or, once in use, any admin with 2+ parlours) can be
        // viewing a parlour that isn't their own users.parlor_id, and the
        // old `.eq('parlor_id', parlorId)` filter silently returned no row
        // in that case, meaning role-gated nav (like Pay@ Onboarding below)
        // never showed up for them outside their home parlour.
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching user profile for sidebar:', error);
        } else {
          setUser(userProfile);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [parlorId]);

  return (
    <div className={`w-64 lg:w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-white h-full flex flex-col border-r border-slate-200 dark:border-slate-700 animate-slideInLeft transition-all duration-300 relative ${
      isMobile ? 'fixed inset-y-0 left-0 z-50' : ''
    }`}>
      {/* Logo */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 animate-fadeIn">
        <div className="flex items-center space-x-3">
          <img
            src={theme === 'dark' ? LovedOneLogoDark : LovedOneLogoLight}
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
                  onClick={isMobile ? onClose : undefined}
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

        {/* Cross-parlour switcher — super_admin only. Non-super_admin users
            with 2+ parlours (once that's a real case) reach the same
            /select-parlor route automatically via RoleBasedRedirect when
            they have no single home parlour, so they don't need this link
            in daily nav. */}
        {isSuperAdmin && (
          <Link
            to="/select-parlor"
            onClick={isMobile ? onClose : undefined}
            className="mt-4 w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all duration-300"
          >
            <Repeat className="w-5 h-5" />
            <span className="text-sm font-medium">Switch Parlour</span>
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 animate-fadeIn animation-delay-500">
        <p className="text-sm text-slate-900 dark:text-slate-400 text-center animate-pulse-text">
          &copy; 2026 LovedOne<br />
          Compassionate tech for life's hardest moments
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
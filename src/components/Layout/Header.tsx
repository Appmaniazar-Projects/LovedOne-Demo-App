import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { Bell, Search, User, LogOut, Settings, Sun, Moon, Menu } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';
import { Notification } from '../../types';

interface HeaderProps {
  parlorName: string;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ parlorName, onMenuClick }) => {
  const { parlorId: parlorKey } = useParams<{ parlorId: string }>();
  const outlet = useOutletContext<{ parlorId: string; parlorRouteKey: string; parlorName: string }>();
  const parlorId = outlet?.parlorId || '';
  const parlorRouteKey = outlet?.parlorRouteKey || parlorKey || '';
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

  useEffect(() => {
    if (!parlorId) {
      setNotifications([]);
      return;
    }

    const getStorageKey = (userId: string | null) => `notifications:${userId || 'anon'}:${parlorId || 'no-parlor'}`;

    const loadPersistedState = (userId: string | null) => {
      try {
        const raw = localStorage.getItem(getStorageKey(userId));
        if (!raw) {
          return { readIds: new Set<string>(), deletedIds: new Set<string>() };
        }
        const parsed = JSON.parse(raw) as { readIds?: string[]; deletedIds?: string[] };
        return {
          readIds: new Set<string>(parsed.readIds || []),
          deletedIds: new Set<string>(parsed.deletedIds || []),
        };
      } catch {
        return { readIds: new Set<string>(), deletedIds: new Set<string>() };
      }
    };

    const load = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();

        const userId = auth?.user?.id ?? null;

        const { readIds, deletedIds } = loadPersistedState(userId);

        const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [paymentsRes, tasksRes, casesRes] = await Promise.all([
          supabase
            .from('payments')
            .select('id, amount, status, created_at, case_id')
            .eq('parlor_id', parlorId)
            .gte('created_at', weekAgoIso)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('tasks')
            .select('id, title, status, due_date, created_at, case_id')
            .eq('parlor_id', parlorId)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('cases')
            .select('id, deceased_name, case_status, created_at')
            .eq('parlor_id', parlorId)
            .gte('created_at', weekAgoIso)
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

        const anyError = paymentsRes.error || tasksRes.error || casesRes.error;
        if (anyError) {
          console.error('Failed to load header notifications:', anyError);
          setNotifications([]);
          return;
        }

        const mapped: Notification[] = [];

        (paymentsRes.data || []).forEach((p: any) => {
          const status = String(p.status || '').toLowerCase();
          const title = status === 'completed' ? 'Payment Received' : status === 'pending' ? 'Payment Pending' : 'Payment Updated';
          const id = `payment-${p.id}`;
          mapped.push({
            id,
            title,
            message: `Payment of ${new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(p.amount || 0))} (${status || 'unknown'})`,
            type: status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info',
            read: readIds.has(id),
            userId: userId || 'system',
            caseId: p.case_id || undefined,
            createdAt: p.created_at ? new Date(p.created_at) : new Date(),
          });
        });

        (tasksRes.data || []).forEach((t: any) => {
          const status = String(t.status || '').toLowerCase();
          const due = t.due_date ? new Date(t.due_date) : null;
          const isOverdue = due ? due.getTime() < Date.now() && status !== 'completed' : false;
          const title = isOverdue ? 'Task Overdue' : status === 'completed' ? 'Task Completed' : 'Task Updated';
          const id = `task-${t.id}`;
          mapped.push({
            id,
            title,
            message: String(t.title || 'Task'),
            type: isOverdue ? 'warning' : status === 'completed' ? 'success' : 'info',
            read: readIds.has(id),
            userId: userId || 'system',
            caseId: t.case_id || undefined,
            createdAt: t.created_at ? new Date(t.created_at) : new Date(),
          });
        });

        (casesRes.data || []).forEach((c: any) => {
          const status = String(c.case_status || '').toLowerCase();
          const title = status === 'closed' ? 'Case Closed' : 'New Case Created';
          const id = `case-${c.id}`;
          mapped.push({
            id,
            title,
            message: String(c.deceased_name || 'Case'),
            type: status === 'closed' ? 'success' : 'info',
            read: readIds.has(id),
            userId: userId || 'system',
            caseId: c.id,
            createdAt: c.created_at ? new Date(c.created_at) : new Date(),
          });
        });

        const next = mapped
          .filter((n) => !deletedIds.has(n.id))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 10);

        setNotifications(next);
      } catch (e) {
        console.error('Failed to load header notifications:', e);
        setNotifications([]);
      }
    };

    load();

    const channel = supabase
      .channel(`realtime header-notifications:${parlorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `parlor_id=eq.${parlorId}` },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `parlor_id=eq.${parlorId}` },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cases', filter: `parlor_id=eq.${parlorId}` },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [parlorId]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className={`bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-3 sm:px-6 py-4 w-full animate-slideInDown`}>
      <div className="flex items-center justify-between w-full gap-2 sm:gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-300"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6 text-slate-800 dark:text-white" />
        </button>

        {/* Parlor Name */}
        <div className="animate-fadeIn animation-delay-100">
          <h1 className="text-base sm:text-xl font-bold text-slate-800 dark:text-white">
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

        {/* Search - Hidden on mobile, visible on md and up */}
        <div className="hidden md:flex flex-1 max-w-md ml-2 md:ml-6 animate-fadeIn animation-delay-200">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400 w-5 h-5 animate-pulse-slow" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.length > 0);
              }}
              onFocus={() => searchQuery.length > 0 && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              placeholder="Search cases, clients, or tasks..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:shadow-md text-sm"
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-slate-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50 animate-fadeInDown">
                <div className="p-3 border-b border-slate-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                    Search results for "{searchQuery}"
                  </p>
                </div>
                
                {/* Mock search results - you can replace with actual data */}
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase">
                    Clients
                  </div>
                  <button className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">John Doe</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Client ID: #12345</p>
                  </button>
                  
                  <div className="px-3 py-2 mt-2 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase">
                    Cases
                  </div>
                  <button className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Case #789</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Status: Active</p>
                  </button>
                  
                  <div className="px-3 py-2 mt-2 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase">
                    Tasks
                  </div>
                  <button className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Follow up with family</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Due: Today</p>
                  </button>
                </div>
                
                <div className="p-3 border-t border-slate-200 dark:border-gray-700">
                  <button className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                    View all results
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2 sm:space-x-4 animate-fadeIn animation-delay-300">
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
              <div className={`absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700 animate-fadeInDown ${
                isMobile ? 'right-2 left-2 w-auto' : 'right-0'
              }`}>
                <div className="p-4 border-b border-slate-200 dark:border-gray-700">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.slice(0, 5).map((notification) => (
                    <button
                      key={notification.id}
                      className="w-full text-left p-4 border-b border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700"
                      onClick={() => {
                        setShowNotifications(false);
                        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
                        (async () => {
                          try {
                            const { data: auth } = await supabase.auth.getUser();
                            const userId = auth?.user?.id ?? null;

                            const key = `notifications:${userId || 'anon'}:${parlorId || 'no-parlor'}`;
                            const raw = localStorage.getItem(key);
                            const parsed = raw ? (JSON.parse(raw) as { readIds?: string[]; deletedIds?: string[] }) : {};
                            const readIds = new Set<string>(parsed.readIds || []);
                            const deletedIds = new Set<string>(parsed.deletedIds || []);
                            readIds.add(notification.id);
                            localStorage.setItem(key, JSON.stringify({ readIds: Array.from(readIds), deletedIds: Array.from(deletedIds) }));
                          } catch {
                            // ignore
                          }
                        })();

                        if (parlorRouteKey) {
                          navigate(`/${parlorRouteKey}/notifications`);
                        }
                      }}
                    >
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
                    </button>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-4 text-sm text-slate-600 dark:text-gray-300">No notifications</div>
                  )}
                </div>
                <div className="p-4">
                  <button
                    className="w-full text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                    onClick={() => {
                      setShowNotifications(false);
                      if (parlorRouteKey) {
                        navigate(`/${parlorRouteKey}/notifications`);
                      }
                    }}
                  >
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
              className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-105"
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
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Kgopotso</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 capitalize">{user.role}</p>
                  </div>
                </>
              )}
            </button>

            {showProfile && (
              <div className={`absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden z-10 border border-gray-200 dark:border-gray-700 animate-fadeInDown ${
                isMobile ? 'right-2 left-2 w-auto' : 'right-0'
              }`}>
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
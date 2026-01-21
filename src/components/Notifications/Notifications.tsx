import React, { useState, useEffect } from 'react';
import { Bell, Check, X, AlertTriangle, Info, CheckCircle, XCircle, Filter, Search } from 'lucide-react';
import { Notification } from '../../types';
import { useOutletContext, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const Notifications: React.FC = () => {
  const { parlorId: parlorKey } = useParams<{ parlorId: string }>();
  const outlet = useOutletContext<{ parlorId: string; parlorRouteKey: string; parlorName: string }>();
  const parlorId = outlet?.parlorId || '';
  void parlorKey;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  const savePersistedState = (userId: string | null, readIds: Set<string>, deletedIds: Set<string>) => {
    try {
      localStorage.setItem(
        getStorageKey(userId),
        JSON.stringify({ readIds: Array.from(readIds), deletedIds: Array.from(deletedIds) }),
      );
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!parlorId) {
          setNotifications([]);
          setError('No parlor specified');
          return;
        }

        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id ?? null;
        const { readIds, deletedIds } = loadPersistedState(userId);

        const nowIso = new Date().toISOString();
        const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [paymentsRes, tasksRes, casesRes] = await Promise.all([
          supabase
            .from('payments')
            .select('id, amount, status, created_at, case_id')
            .eq('parlor_id', parlorId)
            .gte('created_at', weekAgoIso)
            .order('created_at', { ascending: false })
            .limit(30),
          supabase
            .from('tasks')
            .select('id, title, status, due_date, created_at, case_id')
            .eq('parlor_id', parlorId)
            .order('created_at', { ascending: false })
            .limit(30),
          supabase
            .from('cases')
            .select('id, deceased_name, case_status, created_at')
            .eq('parlor_id', parlorId)
            .gte('created_at', weekAgoIso)
            .order('created_at', { ascending: false })
            .limit(30),
        ]);

        const anyError = paymentsRes.error || tasksRes.error || casesRes.error;
        if (anyError) {
          setNotifications([]);
          setError(anyError.message || 'Failed to load notifications');
          return;
        }

        const mapped: Notification[] = [];

        (paymentsRes.data || []).forEach((p: any) => {
          const status = String(p.status || '').toLowerCase();
          const title = status === 'completed' ? 'Payment Received' : status === 'pending' ? 'Payment Pending' : 'Payment Updated';
          mapped.push({
            id: `payment-${p.id}`,
            title,
            message: `Payment of ${new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(p.amount || 0))} (${status || 'unknown'})`,
            type: status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info',
            read: readIds.has(`payment-${p.id}`),
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
          mapped.push({
            id: `task-${t.id}`,
            title,
            message: String(t.title || 'Task'),
            type: isOverdue ? 'warning' : status === 'completed' ? 'success' : 'info',
            read: readIds.has(`task-${t.id}`),
            userId: userId || 'system',
            caseId: t.case_id || undefined,
            createdAt: t.created_at ? new Date(t.created_at) : new Date(),
          });
        });

        (casesRes.data || []).forEach((c: any) => {
          const status = String(c.case_status || '').toLowerCase();
          const title = status === 'closed' ? 'Case Closed' : 'New Case Created';
          mapped.push({
            id: `case-${c.id}`,
            title,
            message: String(c.deceased_name || 'Case'),
            type: status === 'closed' ? 'success' : 'info',
            read: readIds.has(`case-${c.id}`),
            userId: userId || 'system',
            caseId: c.id,
            createdAt: c.created_at ? new Date(c.created_at) : new Date(),
          });
        });

        const next = mapped
          .filter((n) => !deletedIds.has(n.id))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 50);

        setNotifications(next);
      } catch (e: any) {
        setNotifications([]);
        setError(e?.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [parlorId]);

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !notification.read) ||
                         (filter === 'read' && notification.read) ||
                         notification.type === filter;
    return matchesSearch && matchesFilter;
  });

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));

    supabase.auth.getUser().then(({ data }) => {
      const userId = data?.user?.id ?? null;
      const state = loadPersistedState(userId);
      state.readIds.add(id);
      savePersistedState(userId, state.readIds, state.deletedIds);
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map(notification => ({ ...notification, read: true })));
    supabase.auth.getUser().then(({ data }) => {
      const userId = data?.user?.id ?? null;
      const state = loadPersistedState(userId);
      notifications.forEach((n) => state.readIds.add(n.id));
      savePersistedState(userId, state.readIds, state.deletedIds);
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter(notification => notification.id !== id));
    supabase.auth.getUser().then(({ data }) => {
      const userId = data?.user?.id ?? null;
      const state = loadPersistedState(userId);
      state.deletedIds.add(id);
      savePersistedState(userId, state.readIds, state.deletedIds);
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'info':
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return new Date(date).toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="w-8 h-8 text-slate-700 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
            <p className="text-slate-600 dark:text-gray-300">Stay updated with important alerts and messages</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Check className="w-5 h-5" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <p className="text-slate-600 dark:text-gray-300">Loading notifications...</p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-slate-400 dark:text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-white">Total</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{notifications.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-white">Unread</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{unreadCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-white">Warnings</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {notifications.filter(n => n.type === 'warning').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-white">Success</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {notifications.filter(n => n.type === 'success').length}
          </p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 ${getNotificationColor(notification.type)} bg-white dark:bg-gray-800 ${
              !notification.read ? 'border-r-4 border-r-blue-500' : ''
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className={`font-semibold ${!notification.read ? 'text-slate-900 dark:text-gray-100' : 'text-slate-700 dark:text-gray-300'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className={`${!notification.read ? 'text-slate-700 dark:text-gray-300' : 'text-slate-600 dark:text-gray-400'} mb-2`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-gray-400">
                      <span>{formatTimeAgo(notification.createdAt)}</span>
                      {notification.caseId && (
                        <span className="bg-slate-100 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded text-xs">
                          Case #{notification.caseId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-slate-400 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-slate-400 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-slate-400 dark:text-gray-500 mx-auto mb-4" />
          <div className="text-slate-400 dark:text-gray-300 text-lg">No notifications found</div>
          <p className="text-slate-500 dark:text-gray-400 mt-2">
            {searchTerm || filter !== 'all' 
              ? 'Try adjusting your search terms or filters' 
              : 'You\'re all caught up!'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
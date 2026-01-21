import React, { useEffect, useState } from 'react';
import { Clock, User, FileText, CreditCard } from 'lucide-react';
import { useOutletContext, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const RecentActivity: React.FC = () => {
  const { parlorId: parlorKey } = useParams<{ parlorId: string }>();
  const outlet = useOutletContext<{ parlorId: string; parlorRouteKey: string; parlorName: string }>();
  const parlorId = outlet?.parlorId || '';
  void parlorKey;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<
    Array<{
      id: string;
      type: 'case' | 'payment' | 'task' | 'client';
      title: string;
      description: string;
      user: string;
      time: string;
      icon: any;
      color: 'blue' | 'green' | 'purple' | 'yellow';
      createdAt: Date;
    }>
  >([]);

  const formatRelativeTime = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!parlorId) {
          setActivities([]);
          setLoading(false);
          return;
        }

        const [casesRes, paymentsRes, tasksRes, clientsRes] = await Promise.all([
          supabase
            .from('cases')
            .select('id, deceased_name, created_at')
            .eq('parlor_id', parlorId)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('payments')
            .select('id, amount, status, created_at')
            .eq('parlor_id', parlorId)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('tasks')
            .select('id, title, status, created_at')
            .eq('parlor_id', parlorId)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('clients')
            .select('id, name, created_at')
            .eq('parlor_id', parlorId)
            .order('created_at', { ascending: false })
            .limit(3),
        ]);

        const anyError = casesRes.error || paymentsRes.error || tasksRes.error || clientsRes.error;
        if (anyError) {
          setError(anyError.message || 'Failed to load recent activity');
          setActivities([]);
          return;
        }

        const merged = [
          ...(casesRes.data || []).map((c: any) => {
            const createdAt = c.created_at ? new Date(c.created_at) : new Date();
            return {
              id: `case-${c.id}`,
              type: 'case' as const,
              title: 'New case created',
              description: String(c.deceased_name || 'Unnamed case'),
              user: 'System',
              time: formatRelativeTime(createdAt),
              icon: FileText,
              color: 'blue' as const,
              createdAt,
            };
          }),
          ...(paymentsRes.data || []).map((p: any) => {
            const createdAt = p.created_at ? new Date(p.created_at) : new Date();
            const status = String(p.status || '').toLowerCase();
            const title = status === 'completed' ? 'Payment received' : status === 'pending' ? 'Payment pending' : 'Payment updated';
            return {
              id: `payment-${p.id}`,
              type: 'payment' as const,
              title,
              description: `${formatCurrency(Number(p.amount || 0))} (${status || 'unknown'})`,
              user: 'System',
              time: formatRelativeTime(createdAt),
              icon: CreditCard,
              color: status === 'completed' ? ('green' as const) : ('yellow' as const),
              createdAt,
            };
          }),
          ...(tasksRes.data || []).map((t: any) => {
            const createdAt = t.created_at ? new Date(t.created_at) : new Date();
            const status = String(t.status || '').toLowerCase();
            const title = status === 'completed' ? 'Task completed' : 'Task updated';
            return {
              id: `task-${t.id}`,
              type: 'task' as const,
              title,
              description: String(t.title || 'Untitled task'),
              user: 'System',
              time: formatRelativeTime(createdAt),
              icon: Clock,
              color: 'purple' as const,
              createdAt,
            };
          }),
          ...(clientsRes.data || []).map((c: any) => {
            const createdAt = c.created_at ? new Date(c.created_at) : new Date();
            return {
              id: `client-${c.id}`,
              type: 'client' as const,
              title: 'New client added',
              description: String(c.name || 'Unnamed client'),
              user: 'System',
              time: formatRelativeTime(createdAt),
              icon: User,
              color: 'yellow' as const,
              createdAt,
            };
          }),
        ]
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 6);

        setActivities(merged);
      } catch (e: any) {
        setError(e?.message || 'Failed to load recent activity');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [parlorId]);

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 transition-colors duration-200">
      <div className="p-6 border-b border-slate-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
      </div>
      <div className="p-6">
        {error ? (
          <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
        ) : loading ? (
          <div className="text-sm text-slate-600 dark:text-gray-300">Loading activity...</div>
        ) : activities.length === 0 ? (
          <div className="text-sm text-slate-600 dark:text-gray-300">No recent activity yet</div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start space-x-4 group">
                  <div className={`p-2 rounded-lg transition-colors duration-200 ${colorClasses[activity.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">{activity.title}</p>
                    <p className="text-sm text-slate-600 dark:text-gray-300">{activity.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-slate-500 dark:text-gray-400">by {activity.user}</span>
                      <span className="text-xs text-slate-400 dark:text-gray-600">•</span>
                      <span className="text-xs text-slate-500 dark:text-gray-400">{activity.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
import React from 'react';
import { Clock, User, FileText, CreditCard } from 'lucide-react';

const RecentActivity: React.FC = () => {
  const activities = [
    {
      id: 1,
      type: 'case',
      title: 'New case created',
      description: 'Margaret Smith - Burial service',
      user: 'Sarah Johnson',
      time: '2 hours ago',
      icon: FileText,
      color: 'blue'
    },
    {
      id: 2,
      type: 'payment',
      title: 'Payment received',
      description: 'R15,000 deposit payment',
      user: 'System',
      time: '4 hours ago',
      icon: CreditCard,
      color: 'green'
    },
    {
      id: 3,
      type: 'task',
      title: 'Task completed',
      description: 'Death certificate obtained',
      user: 'John Anderson',
      time: '6 hours ago',
      icon: Clock,
      color: 'purple'
    },
    {
      id: 4,
      type: 'user',
      title: 'Client updated',
      description: 'Contact information modified',
      user: 'Emma Davis',
      time: '1 day ago',
      icon: User,
      color: 'yellow'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className={`p-2 rounded-lg ${colorClasses[activity.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{activity.title}</p>
                  <p className="text-sm text-slate-600">{activity.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-slate-500">by {activity.user}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{activity.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;
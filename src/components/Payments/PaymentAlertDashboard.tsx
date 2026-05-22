import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { PaymentAlertService } from '../../services/paymentAlertService';
import { PaymentAlert } from '../../types';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Eye } from 'lucide-react';

interface ParlorContext {
  parlorId: string;
  parlorName: string;
}

const PaymentAlertDashboard: React.FC = () => {
  const { parlorId } = useOutletContext<ParlorContext>();
  const [alerts, setAlerts] = useState<PaymentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  useEffect(() => {
    if (parlorId) {
      loadAlerts();
    }
  }, [parlorId]);

  const loadAlerts = async () => {
    try {
      const paymentAlerts = await PaymentAlertService.generateAlerts(parlorId);
      setAlerts(paymentAlerts);
    } catch (error) {
      console.error('Error loading payment alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => 
    filter === 'all' || alert.alertLevel === filter
  );

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertBgColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800';
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      // Get current user ID from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await PaymentAlertService.resolveAlert(alertId, user.id);
        loadAlerts(); // Refresh alerts
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading payment alerts...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payment Alerts</h1>
        <div className="flex gap-2">
          {['all', 'critical', 'warning', 'info'].map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level as any)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                filter === level 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {level} ({level === 'all' ? alerts.length : alerts.filter(a => a.alertLevel === level).length})
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border ${getAlertBgColor(alert.alertLevel)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.alertLevel)}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">{alert.message}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Created {alert.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // Navigate to case details
                    window.location.href = `/${parlorId}/cases/${alert.caseId}`;
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Case"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleResolveAlert(alert.id)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Resolve
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Payment Alerts</h3>
            <p className="text-gray-600 dark:text-gray-400">All payments are up to date!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentAlertDashboard;

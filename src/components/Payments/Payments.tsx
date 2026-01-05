import React, { useState, useEffect } from "react";
import { Plus, Search, CreditCard, TrendingUp, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import RequestPaymentModal from './RequestPaymentModal';
import ViewPaymentModal from './ViewPaymentModal';
import { supabase } from '../../supabaseClient';
import { Payment } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useCountUp } from '../../hooks/useCountUp';
import { useParams } from 'react-router-dom';

const Payments: React.FC = () => {
  const { theme } = useTheme();
  const { parlorName } = useParams<{ parlorName: string }>();
  const [currentParlorId, setCurrentParlorId] = useState<string>('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    const fetchParlorId = async () => {
      if (!parlorName) return;

      const { data: parlorData, error: parlorError } = await supabase
        .from('parlors')
        .select('id')
        .eq('name', decodeURIComponent(parlorName))
        .single();

      if (parlorError) {
        console.error('Error fetching parlor for payments:', parlorError);
        return;
      }

      if (parlorData?.id) {
        setCurrentParlorId(parlorData.id);
      }
    };

    fetchParlorId();
  }, [parlorName]);

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewModalOpen(true);
  };

  const handleDownloadPayment = (payment: Payment) => {
    // Create a receipt/invoice content
    const receiptContent = `
PAYMENT RECEIPT
=================================================================================

Receipt ID: ${payment.id}
Transaction ID: ${payment.transactionId || 'N/A'}
Date: ${new Date(payment.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}

================================================================================
PAYMENT DETAILS
================================================================================

Description: ${payment.description}
Amount: ${formatCurrency(payment.amount)}
Payment Method: ${payment.method.toUpperCase()}
Status: ${payment.status.toUpperCase()}
Case ID: ${payment.caseId || 'N/A'}

=================================================================================

Thank you for your payment.

For any queries, please contact us with your receipt ID.

================================================================================
Generated on: ${new Date().toLocaleString('en-US')}
    `.trim();

    // Create a blob and download
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-receipt-${payment.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      console.error('Error fetching payments:', error);
    } else {
      const formattedData = data.map(p => ({ ...p, createdAt: new Date(p.created_at), updatedAt: new Date(p.updated_at), transactionId: p.transaction_id, caseId: p.case_id })) as Payment[];
      setPayments(formattedData);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();

    const channel = supabase.channel('realtime payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
        console.log('Change received!', payload);
        fetchPayments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredPayments = payments.filter(payment => {
    const searchStr = `${payment.description} ${payment.transactionId}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const statusColors = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    failed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
    refunded: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
  };

  const methodColors = {
    eft: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    easypay: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
    snapscan: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
    card: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
    payat: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
    bank_transfer: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const successfulTransactions = payments.filter(p => p.status === 'completed').length;

  // Animated values
  const animatedTotalRevenue = useCountUp(totalRevenue, 3000, 100);
  const animatedPendingAmount = useCountUp(pendingAmount, 3000, 150);
  const animatedSuccessfulTransactions = useCountUp(successfulTransactions, 3000, 200);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center text-red-600">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Error Fetching Data</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      <RequestPaymentModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        parlorId={currentParlorId}
      />
      <ViewPaymentModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} payment={selectedPayment} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 animate-fadeInDown">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payments</h1>
          <p className="text-slate-600 dark:text-gray-300">Manage and track all payments</p>
        </div>
        <button
          onClick={() => {
            if (!currentParlorId) {
              return;
            }
            setIsRequestModalOpen(true);
          }}
          disabled={!currentParlorId}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>Request Payment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md hover:scale-105 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(animatedTotalRevenue)}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md hover:scale-105 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Pending Payments</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(animatedPendingAmount)}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-all duration-300 hover:shadow-md hover:scale-105 cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-gray-400">Successful Transactions</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {animatedSuccessfulTransactions}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-6 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-gray-500 w-5 h-5 transition-all duration-300 peer-focus:text-blue-500 peer-focus:scale-110" />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 transition-all duration-300 hover:border-blue-400 focus:scale-[1.02] peer"
          />
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <div className="relative group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400 hover:scale-105 cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-gray-300 transition-transform duration-300 group-hover:scale-110">
              <svg className="fill-current h-4 w-4 transition-transform duration-300 group-hover:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>

          <div className="relative group">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400 hover:scale-105 cursor-pointer"
            >
              <option value="all">All Methods</option>
              <option value="eft">EFT</option>
              <option value="easypay">EasyPay</option>
              <option value="snapscan">SnapScan</option>
              <option value="card">Card</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-gray-300 transition-transform duration-300 group-hover:scale-110">
              <svg className="fill-current h-4 w-4 transition-transform duration-300 group-hover:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className={`${theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-lg border overflow-hidden transition-colors duration-200 animate-fadeInUp`} style={{ animationDelay: '300ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}>
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-800' : 'divide-gray-200'}`}>
              {filteredPayments.map((payment, index) => (
                <tr 
                  key={payment.id} 
                  className={`${theme === 'dark' ? 'hover:bg-gray-800/80' : 'hover:bg-blue-50'} transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:-translate-y-1 cursor-pointer animate-fadeInUp group`}
                  style={{ animationDelay: `${400 + index * 30}ms` }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400`}>
                        {payment.description}
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} transition-all duration-300 group-hover:text-blue-500 dark:group-hover:text-blue-300`}>
                        {payment.transactionId || '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} transition-all duration-300 group-hover:scale-110 group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:font-bold`}>
                      {formatCurrency(payment.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${methodColors[payment.method]} ${theme === 'dark' ? 'bg-opacity-20' : 'bg-opacity-10'} transition-all duration-300 hover:scale-110 group-hover:scale-105 group-hover:shadow-md`}>
                      {(() => {
                        switch (payment.method) {
                          case 'card': return 'CARD';
                          case 'eft': return 'BANK TRANSFER';
                          case 'easypay': return 'EASYPAY';
                          case 'snapscan': return 'SNAPSCAN';
                          default:
                            // Fallback for any other method not explicitly handled
                            const unhandledMethod = payment.method as string;
                            return unhandledMethod ? unhandledMethod.toUpperCase() : 'UNKNOWN';
                        }
                      })()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusColors[payment.status]} ${theme === 'dark' ? 'bg-opacity-20' : 'bg-opacity-10'} transition-all duration-300 hover:scale-110 group-hover:scale-105 group-hover:shadow-md group-hover:ring-2 group-hover:ring-offset-1 ${payment.status === 'completed' ? 'group-hover:ring-green-400' : payment.status === 'pending' ? 'group-hover:ring-yellow-400' : 'group-hover:ring-red-400'}`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} transition-all duration-300 group-hover:text-gray-900 dark:group-hover:text-gray-200 group-hover:font-medium`}>
                    {new Date(payment.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => handleViewPayment(payment)} 
                      className={`${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} mr-4 transition-all duration-300 font-medium hover:scale-125 group-hover:scale-110 hover:underline hover:decoration-2 hover:underline-offset-4`}
                    >
                      View
                    </button>
                    <button 
                      className={`${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-all duration-300 font-medium hover:scale-125 group-hover:scale-110 hover:underline hover:decoration-2 hover:underline-offset-4`}
                      onClick={() => handleDownloadPayment(payment)}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <div className="text-slate-400 text-lg">No payments found</div>
          <p className="text-slate-500 mt-2">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default Payments;
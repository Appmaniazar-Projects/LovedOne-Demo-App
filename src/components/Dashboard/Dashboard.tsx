import React, { useState, useEffect } from 'react';
import { FileText, Clock, TrendingUp, DollarSign, AlertTriangle, Users, ArrowRight, Heart, CreditCard, Shield, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from './StatsCard';
import RecentActivity from './RecentActivity';
import { mockAnalytics } from '../../data/mockData';
import { useCountUp } from '../../hooks/useCountUp';
import { supabase } from '../../supabaseClient';

interface Client {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  address: string;
  cultural_preferences: string;
  created_at: string;
  user_id: string | null;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = window.location.pathname;
  const parlorSlug = location.split('/')[1]; // Extract parlor slug from URL
  const [clients, setClients] = useState<Client[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ role: string; full_name: string } | null>(null);
  const [paymentsData, setPaymentsData] = useState({
    totalPayments: 0,
    pendingPayments: 0,
    completedPayments: 0,
    totalRevenue: 0
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error fetching user:', userError);
          return;
        }
        
        if (!user) {
          console.log('No user logged in');
          return;
        }

        console.log('Logged in user:', user.id);

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        if (profile) {
          console.log('User profile:', profile);
          setUserProfile(profile);

          // Fetch clients based on role
          let countQuery = supabase.from('clients').select('*', { count: 'exact', head: true });
          let dataQuery = supabase.from('clients').select('*');

          if (profile.role === 'staff') {
            console.log('Filtering clients for staff user');
            countQuery = countQuery.eq('user_id', user.id);
            dataQuery = dataQuery.eq('user_id', user.id);
          } else {
            console.log('Fetching all clients (admin/super_admin)');
          }

          // Get total count
          const { count, error: countError } = await countQuery;
          
          if (countError) {
            console.error('Error counting clients:', countError);
          } else {
            console.log('Total client count:', count);
          }
          
          // Get recent clients (limit 5)
          const { data: clientsData, error: clientsError } = await dataQuery.order('created_at', { ascending: false }).limit(5);
          
          if (clientsError) {
            console.error('Error fetching clients:', clientsError);
            setError(`Failed to load clients: ${clientsError.message}`);
          } else {
            console.log('Fetched clients:', clientsData);
            setClients(clientsData || []);
            setTotalClients(count || 0);
          }

          // Fetch payments data
          const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('amount, status');

          if (paymentsError) {
            console.error('Error fetching payments:', paymentsError);
          } else if (payments) {
            const pending = payments.filter(p => p.status === 'pending').length;
            const completed = payments.filter(p => p.status === 'completed').length;
            const revenue = payments
              .filter(p => p.status === 'completed')
              .reduce((sum, p) => sum + (p.amount || 0), 0);

            setPaymentsData({
              totalPayments: payments.length,
              pendingPayments: pending,
              completedPayments: completed,
              totalRevenue: revenue
            });
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error fetching dashboard data:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Animated values for Quick Overview
  const animatedCompletedCases = useCountUp(mockAnalytics.completedCases, 3000, 800);
  const animatedMonthlyRevenue = useCountUp(mockAnalytics.monthlyRevenue, 3000, 900);
  const animatedAvgCaseValue = useCountUp(mockAnalytics.avgCaseValue, 3000, 1000);
  const animatedPendingPayments = useCountUp(mockAnalytics.pendingPayments, 3000, 1100);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 rounded-lg p-6 text-white animate-fadeIn">
        <h1 className="text-2xl font-bold mb-2">
          {`Welcome back, ${userProfile?.full_name || 'User'}`.split('').map((letter, index) => (
            <span 
              key={index} 
              className="animate-fadeInLetter"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </span>
          ))}
        </h1>
        <p className="text-blue-100 dark:text-blue-200 animate-fadeInUp animation-delay-500">Here's what's happening with your funeral home today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="animate-fadeInUp" style={{ animationDelay: '200ms' }}>
          <StatsCard
            title="Total Clients"
            value={totalClients}
            icon={Users}
            change={`${totalClients} registered`}
            changeType="neutral"
            color="blue"
            animationDelay={200}
          />
        </div>
        <div className="animate-fadeInUp" style={{ animationDelay: '300ms' }}>
          <StatsCard
            title="Total Cases"
            value={mockAnalytics.totalCases}
            icon={FileText}
            change="+12% from last month"
            changeType="increase"
            color="purple"
            animationDelay={300}
          />
        </div>
        <div className="animate-fadeInUp" style={{ animationDelay: '400ms' }}>
          <StatsCard
            title="Active Cases"
            value={mockAnalytics.activeCases}
            icon={Clock}
            change="+3 this week"
            changeType="increase"
            color="yellow"
            animationDelay={400}
          />
        </div>
        <div className="animate-fadeInUp" style={{ animationDelay: '500ms' }}>
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(mockAnalytics.totalRevenue)}
            icon={DollarSign}
            change="+8% from last month"
            changeType="increase"
            color="green"
            animationDelay={500}
          />
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-6 hover:shadow-lg cursor-pointer">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform duration-300" />
                </div>
                <span className="text-slate-700 dark:text-gray-300">Completed Cases</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">{animatedCompletedCases}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-6 hover:shadow-lg cursor-pointer">
                  <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400 transition-transform duration-300" />
                </div>
                <span className="text-slate-700 dark:text-gray-300">Monthly Revenue</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(animatedMonthlyRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-6 hover:shadow-lg cursor-pointer">
                  <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400 transition-transform duration-300" />
                </div>
                <span className="text-slate-700 dark:text-gray-300">Avg Case Value</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(animatedAvgCaseValue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-6 hover:shadow-lg cursor-pointer">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 transition-transform duration-300" />
                </div>
                <span className="text-slate-700 dark:text-gray-300">Pending Payments</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">{animatedPendingPayments}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </div>

      {/* Services & Payments Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeInUp" style={{ animationDelay: '1000ms' }}>
        {/* Services Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Funeral Services</h3>
                <p className="text-xs text-slate-600 dark:text-gray-400">Available plans & coverage</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/${parlorSlug}/services`)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Main Plans */}
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-purple-900 dark:text-purple-200">Main Funeral Plans</h4>
                <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">3 Plans</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-slate-700 dark:text-gray-300">Family Burial Society - R120/month</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-slate-700 dark:text-gray-300">Kopano (Most Popular) - R170/month</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-slate-700 dark:text-gray-300">Urmbisa Premium - R270/month</span>
                </div>
              </div>
            </div>

            {/* Inkomo Products */}
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200">Inkomo Products</h4>
                <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">Flexible</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-slate-700 dark:text-gray-300">Non-Members from R105</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-slate-700 dark:text-gray-300">Immediate Family - R75</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-slate-700 dark:text-gray-300">Extended Coverage - R70</span>
                </div>
              </div>
            </div>

            {/* Coverage Info */}
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-800 dark:text-green-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Coverage from R5,000 to R30,000 available
              </p>
            </div>
          </div>
        </div>

        {/* Payments Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Payment Overview</h3>
                <p className="text-xs text-slate-600 dark:text-gray-400">Transaction summary</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/${parlorSlug}/payments`)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Total Payments */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-gray-400">Total Payments</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{paymentsData.totalPayments}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending & Completed */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs text-slate-600 dark:text-gray-400">Pending</p>
                </div>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{paymentsData.pendingPayments}</p>
              </div>

              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <p className="text-xs text-slate-600 dark:text-gray-400">Completed</p>
                </div>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{paymentsData.completedPayments}</p>
              </div>
            </div>

            {/* Total Revenue */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(paymentsData.totalRevenue)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods Info */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-600 dark:text-gray-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Accepting Cash, Card, EFT & Mobile Money
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Clients */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 transition-colors duration-200 animate-fadeInUp" style={{ animationDelay: '1200ms' }}>
        <div className="p-6 border-b border-slate-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Clients</h3>
            <button
              onClick={() => navigate(`/${parlorSlug}/clients`)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Loading clients...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No clients yet</p>
              <button
                onClick={() => navigate(`/${parlorSlug}/clients`)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Client
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map((client, index) => (
                <div
                  key={client.id}
                  onClick={() => navigate(`/${parlorSlug}/clients/${client.id}`)}
                  className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-all duration-300 hover:shadow-md hover:scale-[1.02] cursor-pointer animate-fadeInUp"
                  style={{ animationDelay: `${1300 + index * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center transition-all duration-300">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 dark:text-white">{client.name}</h4>
                    <p className="text-sm text-slate-600 dark:text-gray-300">{client.relationship}</p>
                    <p className="text-sm text-slate-500 dark:text-gray-400">{client.email || client.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(client.created_at).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
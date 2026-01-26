import React, { useState, useEffect } from 'react';
import { FileText, Clock, TrendingUp, DollarSign, AlertTriangle, Users, ArrowRight, Heart, CreditCard, Shield, CheckCircle2 } from 'lucide-react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import StatsCard from './StatsCard';
import RecentActivity from './RecentActivity';
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
  const { parlorId: parlorKey } = useParams<{ parlorId: string }>();
  const outlet = useOutletContext<{ parlorId: string; parlorRouteKey: string; parlorName: string }>();
  const parlorId = outlet?.parlorId || '';
  const parlorRouteKey = outlet?.parlorRouteKey || parlorKey || '';
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

  const [totalCases, setTotalCases] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);

  const [completedCases, setCompletedCases] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [avgCaseValue, setAvgCaseValue] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

  const [planSummary, setPlanSummary] = useState<{ count: number; minCover: number | null; maxCover: number | null; topPlans: Array<{ id: string; name: string; monthly_premium: number }> }>({
    count: 0,
    minCover: null,
    maxCover: null,
    topPlans: [],
  });

  const [casesMonthChangePct, setCasesMonthChangePct] = useState<number | null>(null);
  const [tasksWeekChangeCount, setTasksWeekChangeCount] = useState<number | null>(null);
  const [revenueMonthChangePct, setRevenueMonthChangePct] = useState<number | null>(null);

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

        if (!parlorId) {
          setError('No parlor specified');
          return;
        }
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

        // Fetch user profile from users table
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role, full_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        if (profile) {
          console.log('User profile:', profile);
          const displayName = profile.full_name || (user.user_metadata && user.user_metadata.full_name) || user.email || 'User';
          setUserProfile({ role: profile.role, full_name: displayName });

          // Fetch clients for the whole parlor/company. All roles can see all
          // clients; role-based restrictions apply only to actions elsewhere
          // (e.g. delete/assign), not to visibility.
          console.log('Fetching all clients for dashboard, role:', profile.role);
          const { count, error: countError } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('parlor_id', parlorId);

          if (countError) {
            console.error('Error counting clients:', countError);
          } else {
            console.log('Total client count:', count);
          }

          // Get recent clients (limit 5)
          const { data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select('*')
            .eq('parlor_id', parlorId)
            .order('created_at', { ascending: false })
            .limit(5);

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
            .select('amount, status, created_at, case_id')
            .eq('parlor_id', parlorId);

          if (paymentsError) {
            console.error('Error fetching payments:', paymentsError);
          } else if (payments) {
            const pending = payments.filter(p => p.status === 'pending').length;
            const completed = payments.filter(p => p.status === 'completed').length;
            const revenue = payments
              .filter(p => p.status === 'completed')
              .reduce((sum, p) => sum + (p.amount || 0), 0);

            const now = new Date();
            const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            const startOfPrevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
            const endOfPrevMonth = startOfMonth;
            const monthRevenue = payments
              .filter(p => p.status === 'completed')
              .filter(p => {
                const created = p.created_at ? new Date(p.created_at) : null;
                return created ? created >= startOfMonth : false;
              })
              .reduce((sum, p) => sum + (p.amount || 0), 0);

            const prevMonthRevenue = payments
              .filter(p => p.status === 'completed')
              .filter(p => {
                const created = p.created_at ? new Date(p.created_at) : null;
                return created ? created >= startOfPrevMonth && created < endOfPrevMonth : false;
              })
              .reduce((sum, p) => sum + (p.amount || 0), 0);

            const completedPayments = payments.filter(p => p.status === 'completed');
            const avgValue = completedPayments.length > 0 ? revenue / completedPayments.length : 0;

            setPaymentsData({
              totalPayments: payments.length,
              pendingPayments: pending,
              completedPayments: completed,
              totalRevenue: revenue
            });

            setMonthlyRevenue(monthRevenue);
            setAvgCaseValue(avgValue);
            setPendingPaymentsCount(pending);

            if (prevMonthRevenue === 0) {
              setRevenueMonthChangePct(monthRevenue === 0 ? 0 : 100);
            } else {
              setRevenueMonthChangePct(((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100);
            }
          }

          // Fetch total cases
          const { count: casesCount, error: casesError } = await supabase
            .from('cases')
            .select('*', { count: 'exact', head: true })
            .eq('parlor_id', parlorId);

          if (casesError) {
            console.error('Error counting cases:', casesError);
          } else {
            setTotalCases(casesCount || 0);
          }

          // Fetch total tasks
          const { count: tasksCount, error: tasksError } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('parlor_id', parlorId);

          if (tasksError) {
            console.error('Error counting tasks:', tasksError);
          } else {
            setTotalTasks(tasksCount || 0);
          }

          // Compute month-over-month change for cases
          {
            const now = new Date();
            const startOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            const startOfPrevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
            const endOfPrevMonth = startOfThisMonth;

            const [thisMonthRes, prevMonthRes] = await Promise.all([
              supabase
                .from('cases')
                .select('*', { count: 'exact', head: true })
                .eq('parlor_id', parlorId)
                .gte('created_at', startOfThisMonth.toISOString()),
              supabase
                .from('cases')
                .select('*', { count: 'exact', head: true })
                .eq('parlor_id', parlorId)
                .gte('created_at', startOfPrevMonth.toISOString())
                .lt('created_at', endOfPrevMonth.toISOString()),
            ]);

            if (thisMonthRes.error) {
              console.error('Error counting cases for current month:', thisMonthRes.error);
              setCasesMonthChangePct(null);
            } else if (prevMonthRes.error) {
              console.error('Error counting cases for previous month:', prevMonthRes.error);
              setCasesMonthChangePct(null);
            } else {
              const thisMonth = thisMonthRes.count || 0;
              const prevMonth = prevMonthRes.count || 0;

              if (prevMonth === 0) {
                setCasesMonthChangePct(thisMonth === 0 ? 0 : 100);
              } else {
                setCasesMonthChangePct(((thisMonth - prevMonth) / prevMonth) * 100);
              }
            }
          }

          // Compute week-over-week change for tasks
          {
            const now = new Date();
            const startOfThisWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7));
            const startOfPrevWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 14));
            const endOfPrevWeek = startOfThisWeek;

            const [thisWeekRes, prevWeekRes] = await Promise.all([
              supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('parlor_id', parlorId)
                .gte('created_at', startOfThisWeek.toISOString()),
              supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('parlor_id', parlorId)
                .gte('created_at', startOfPrevWeek.toISOString())
                .lt('created_at', endOfPrevWeek.toISOString()),
            ]);

            if (thisWeekRes.error) {
              console.error('Error counting tasks for current week:', thisWeekRes.error);
              setTasksWeekChangeCount(null);
            } else if (prevWeekRes.error) {
              console.error('Error counting tasks for previous week:', prevWeekRes.error);
              setTasksWeekChangeCount(null);
            } else {
              const thisWeek = thisWeekRes.count || 0;
              const prevWeek = prevWeekRes.count || 0;
              setTasksWeekChangeCount(thisWeek - prevWeek);
            }
          }

          // Fetch completed cases
          const { count: completedCount, error: completedError } = await supabase
            .from('cases')
            .select('*', { count: 'exact', head: true })
            .eq('parlor_id', parlorId)
            .eq('case_status', 'closed');

          if (completedError) {
            console.error('Error counting completed cases:', completedError);
          } else {
            setCompletedCases(completedCount || 0);
          }

          // Fetch plans summary (used for the dashboard services card)
          const { data: plansData, error: plansError } = await supabase
            .from('plans')
            .select('id, name, monthly_premium, cover_amount')
            .eq('parlor_id', parlorId)
            .eq('is_active', true)
            .order('monthly_premium', { ascending: true });

          if (plansError) {
            console.error('Error loading plans for dashboard:', plansError);
          } else {
            const rows = plansData || [];
            const coverValues = rows
              .map((p: any) => (typeof p.cover_amount === 'number' ? p.cover_amount : null))
              .filter((v: number | null): v is number => v !== null);

            setPlanSummary({
              count: rows.length,
              minCover: coverValues.length > 0 ? Math.min(...coverValues) : null,
              maxCover: coverValues.length > 0 ? Math.max(...coverValues) : null,
              topPlans: rows.slice(0, 3).map((p: any) => ({
                id: p.id,
                name: String(p.name || ''),
                monthly_premium: typeof p.monthly_premium === 'number' ? p.monthly_premium : 0,
              })),
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
  }, [parlorId]);

  // Animated values for Quick Overview
  const animatedCompletedCases = useCountUp(completedCases, 3000, 800);
  const animatedMonthlyRevenue = useCountUp(monthlyRevenue, 3000, 900);
  const animatedAvgCaseValue = useCountUp(avgCaseValue, 3000, 1000);
  const animatedPendingPayments = useCountUp(pendingPaymentsCount, 3000, 1100);

  if (!parlorId) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6">
          <p className="text-slate-700 dark:text-gray-300">No parlor specified</p>
        </div>
      </div>
    );
  }

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <button
          type="button"
          onClick={() => navigate(`/${parlorRouteKey}/clients`)}
          className="text-left animate-fadeInUp"
          style={{ animationDelay: '200ms' }}
        >
          <StatsCard
            title="Total Clients"
            value={totalClients}
            icon={Users}
            change={`${totalClients} registered`}
            changeType="neutral"
            color="blue"
            animationDelay={200}
          />
        </button>
        <button
          type="button"
          onClick={() => navigate(`/${parlorRouteKey}/cases`)}
          className="text-left animate-fadeInUp"
          style={{ animationDelay: '300ms' }}
        >
          <StatsCard
            title="Total Cases"
            value={totalCases}
            icon={FileText}
            change={
              casesMonthChangePct === null
                ? '—'
                : `${casesMonthChangePct >= 0 ? '+' : ''}${Math.round(casesMonthChangePct)}% from last month`
            }
            changeType={
              casesMonthChangePct === null
                ? 'neutral'
                : casesMonthChangePct >= 0
                  ? 'increase'
                  : 'decrease'
            }
            color="purple"
            animationDelay={300}
          />
        </button>
        <button
          type="button"
          onClick={() => navigate(`/${parlorRouteKey}/tasks`)}
          className="text-left animate-fadeInUp"
          style={{ animationDelay: '400ms' }}
        >
          <StatsCard
            title="Total Tasks"
            value={totalTasks}
            icon={Clock}
            change={
              tasksWeekChangeCount === null
                ? '—'
                : `${tasksWeekChangeCount >= 0 ? '+' : ''}${tasksWeekChangeCount} this week`
            }
            changeType={
              tasksWeekChangeCount === null
                ? 'neutral'
                : tasksWeekChangeCount >= 0
                  ? 'increase'
                  : 'decrease'
            }
            color="yellow"
            animationDelay={400}
          />
        </button>
        <button
          type="button"
          onClick={() => navigate(`/${parlorRouteKey}/payments`)}
          className="text-left animate-fadeInUp"
          style={{ animationDelay: '500ms' }}
        >
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(paymentsData.totalRevenue)}
            icon={DollarSign}
            change={
              revenueMonthChangePct === null
                ? '—'
                : `${revenueMonthChangePct >= 0 ? '+' : ''}${Math.round(revenueMonthChangePct)}% from last month`
            }
            changeType={
              revenueMonthChangePct === null
                ? 'neutral'
                : revenueMonthChangePct >= 0
                  ? 'increase'
                  : 'decrease'
            }
            color="green"
            animationDelay={500}
          />
        </button>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 animate-fadeInUp" style={{ animationDelay: '1000ms' }}>
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
              onClick={() => navigate(`/${parlorRouteKey}/services`)}
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
                <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">{planSummary.count} Plans</span>
              </div>
              <div className="space-y-2">
                {planSummary.topPlans.length === 0 ? (
                  <div className="text-sm text-slate-700 dark:text-gray-300">No active plans yet</div>
                ) : (
                  planSummary.topPlans.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-slate-700 dark:text-gray-300">{p.name} - {formatCurrency(p.monthly_premium)}/month</span>
                    </div>
                  ))
                )}
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
                {planSummary.minCover !== null && planSummary.maxCover !== null
                  ? `Coverage from ${formatCurrency(planSummary.minCover)} to ${formatCurrency(planSummary.maxCover)} available`
                  : 'Coverage information not available yet'}
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
              onClick={() => navigate(`/${parlorRouteKey}/payments`)}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
              onClick={() => navigate(`/${parlorRouteKey}/clients`)}
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
                onClick={() => navigate(`/${parlorRouteKey}/clients`)}
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
                  onClick={() => navigate(`/${parlorRouteKey}/clients/${client.id}`)}
                  className={`p-4 rounded-lg border border-slate-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-fadeInUp`}
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
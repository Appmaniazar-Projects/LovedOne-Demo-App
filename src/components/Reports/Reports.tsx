import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileText, TrendingUp, Calendar, Users, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import { useOutletContext, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const Reports: React.FC = () => {
  const { parlorId: parlorKey } = useParams<{ parlorId: string }>();
  const outlet = useOutletContext<{ parlorId: string; parlorRouteKey: string; parlorName: string }>();
  const parlorId = outlet?.parlorId || '';
  void parlorKey;
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<{
    totalCases: number;
    activeCases: number;
    completedCases: number;
    totalClients: number;
    totalRevenue: number;
    monthlyRevenue: number;
    avgCaseValue: number;
    pendingPayments: number;
    taskCompletionRate: number;
    serviceDistribution: Array<{ label: string; count: number }>;
    revenueTrend: Array<{ label: string; amount: number }>;
    paymentMethods: Record<string, number>;
    paymentStatus: Record<string, number>;
  } | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const startDateIso = useMemo(() => {
    const now = new Date();

    if (dateRange === 'week') {
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7)).toISOString();
    }
    if (dateRange === 'month') {
      return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    }
    if (dateRange === 'quarter') {
      const quarterStartMonth = Math.floor(now.getUTCMonth() / 3) * 3;
      return new Date(Date.UTC(now.getUTCFullYear(), quarterStartMonth, 1)).toISOString();
    }
    if (dateRange === 'year') {
      return new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
    }

    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  }, [dateRange]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!parlorId) {
          setMetrics(null);
          setError('No parlor specified');
          return;
        }

        const now = new Date();
        const oldestMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        const [casesRes, clientsRes, tasksRes, paymentsRes, serviceTypesRes] = await Promise.all([
          supabase
            .from('cases')
            .select('id, case_status, created_at, service_type_id')
            .eq('parlor_id', parlorId)
            .gte('created_at', startDateIso),
          supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('parlor_id', parlorId),
          supabase
            .from('tasks')
            .select('id, status')
            .eq('parlor_id', parlorId)
            .gte('created_at', startDateIso),
          supabase
            .from('payments')
            .select('amount, status, method, created_at')
            .eq('parlor_id', parlorId)
            .gte('created_at', oldestMonth.toISOString()),
          supabase
            .from('service_types')
            .select('id, name')
            .eq('parlor_id', parlorId),
        ]);

        const anyError = casesRes.error || clientsRes.error || tasksRes.error || paymentsRes.error || serviceTypesRes.error;
        if (anyError) {
          setMetrics(null);
          setError(anyError.message || 'Failed to load reports');
          return;
        }

        const serviceTypeNameById = new Map<string, string>();
        (serviceTypesRes.data || []).forEach((st: any) => {
          serviceTypeNameById.set(String(st.id), String(st.name || 'Service'));
        });

        const cases = casesRes.data || [];
        const tasks = tasksRes.data || [];
        const payments = paymentsRes.data || [];

        const totalCases = cases.length;
        const activeCases = cases.filter((c: any) => (c.case_status || '').toLowerCase() !== 'closed').length;
        const completedCases = cases.filter((c: any) => (c.case_status || '').toLowerCase() === 'closed').length;

        const paymentsInRange = payments.filter((p: any) => {
          const created = p.created_at ? new Date(p.created_at) : null;
          return created ? created >= new Date(startDateIso) : false;
        });

        const completedPayments = paymentsInRange.filter((p: any) => (p.status || '').toLowerCase() === 'completed');
        const pendingPayments = paymentsInRange.filter((p: any) => (p.status || '').toLowerCase() === 'pending');

        const totalRevenue = completedPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
        const monthlyRevenue = payments
          .filter((p: any) => (p.status || '').toLowerCase() === 'completed')
          .filter((p: any) => {
            const created = p.created_at ? new Date(p.created_at) : null;
            return created ? created >= startOfMonth : false;
          })
          .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

        const avgCaseValue = completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0;

        const completedTasks = tasks.filter((t: any) => (t.status || '').toLowerCase() === 'completed').length;
        const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

        const serviceCounts = new Map<string, number>();
        cases.forEach((c: any) => {
          const id = c.service_type_id ? String(c.service_type_id) : 'unknown';
          serviceCounts.set(id, (serviceCounts.get(id) || 0) + 1);
        });
        const serviceDistribution = Array.from(serviceCounts.entries())
          .map(([serviceTypeId, count]) => ({
            label: serviceTypeId === 'unknown' ? 'Unspecified' : (serviceTypeNameById.get(serviceTypeId) || 'Service'),
            count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        const paymentMethods: Record<string, number> = {};
        const paymentStatus: Record<string, number> = {};
        paymentsInRange.forEach((p: any) => {
          const method = String(p.method || 'unknown');
          const status = String(p.status || 'unknown');
          const amount = Number(p.amount || 0);
          paymentMethods[method] = (paymentMethods[method] || 0) + amount;
          paymentStatus[status] = (paymentStatus[status] || 0) + amount;
        });

        const revenueTrend: Array<{ label: string; amount: number }> = [];
        for (let i = 3; i >= 0; i -= 1) {
          const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
          const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
          const label = monthStart.toLocaleDateString('en-ZA', { month: 'long' });
          const amount = payments
            .filter((p: any) => (p.status || '').toLowerCase() === 'completed')
            .filter((p: any) => {
              const created = p.created_at ? new Date(p.created_at) : null;
              return created ? created >= monthStart && created < nextMonthStart : false;
            })
            .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
          revenueTrend.push({ label, amount });
        }

        setMetrics({
          totalCases,
          activeCases,
          completedCases,
          totalClients: clientsRes.count || 0,
          totalRevenue,
          monthlyRevenue,
          avgCaseValue,
          pendingPayments: pendingPayments.length,
          taskCompletionRate,
          serviceDistribution,
          revenueTrend,
          paymentMethods,
          paymentStatus,
        });
      } catch (e: any) {
        setMetrics(null);
        setError(e?.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [parlorId, startDateIso]);

  const exportReport = () => {
    if (!metrics) {
      return;
    }
    const reportName = reportTypes.find(r => r.id === selectedReport)?.name || 'Report';
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${reportName.replace(/\s+/g, '_')}_${dateRange}_${timestamp}`;

    // Create PDF
    const doc = new jsPDF();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(reportName, 20, yPosition);
    yPosition += 10;

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date Range: ${dateRange}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPosition);
    yPosition += 15;

    // Content based on report type
    doc.setFontSize(12);
    const data = metrics;

    switch (selectedReport) {
      case 'overview':

        // Key Metrics Section
        doc.setFont('helvetica', 'bold');
        doc.text('KEY METRICS', 20, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        doc.text(`Total Cases: ${data.totalCases}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Total Revenue: ${formatCurrency(data.totalRevenue)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Active Cases: ${data.activeCases}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Completed Cases: ${data.completedCases}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Task Completion Rate: ${data.taskCompletionRate}%`, 25, yPosition);
        yPosition += 6;
        doc.text(`Average Case Value: ${formatCurrency(data.avgCaseValue)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Monthly Revenue: ${formatCurrency(data.monthlyRevenue)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Pending Payments: ${data.pendingPayments}`, 25, yPosition);
        yPosition += 12;

        // Service Distribution
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('SERVICE DISTRIBUTION', 20, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        if (data.serviceDistribution.length > 0) {
          const total = data.serviceDistribution.reduce((sum, s) => sum + s.count, 0) || 1;
          data.serviceDistribution.slice(0, 3).forEach((s) => {
            const pct = Math.round((s.count / total) * 100);
            doc.text(`${s.label}: ${pct}%`, 25, yPosition);
            yPosition += 6;
          });
        } else {
          doc.text('No service distribution data available', 25, yPosition);
        }
        yPosition += 12;

        // Monthly Revenue Trend
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('MONTHLY REVENUE TREND', 20, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        if (data.revenueTrend.length > 0) {
          data.revenueTrend.forEach((r) => {
            doc.text(`${r.label}: ${formatCurrency(r.amount)}`, 25, yPosition);
            yPosition += 6;
          });
        } else {
          doc.text('No revenue trend data available', 25, yPosition);
        }
        break;

      case 'financial':

        // Payment Methods
        doc.setFont('helvetica', 'bold');
        doc.text('PAYMENT METHODS', 20, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        Object.entries(data.paymentMethods).forEach(([method, amt]) => {
          doc.text(`${method.toUpperCase()}: ${formatCurrency(amt)}`, 25, yPosition);
          yPosition += 6;
        });
        yPosition += 12;

        // Payment Status
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYMENT STATUS', 20, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        Object.entries(data.paymentStatus).forEach(([status, amt]) => {
          doc.text(`${status.toUpperCase()}: ${formatCurrency(amt)}`, 25, yPosition);
          yPosition += 6;
        });
        yPosition += 12;

        // Key Metrics
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('KEY METRICS', 20, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        doc.text(`Average Case Value: ${formatCurrency(data.avgCaseValue)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Monthly Revenue: ${formatCurrency(data.monthlyRevenue)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Pending Payments: ${data.pendingPayments}`, 25, yPosition);
        break;

      default:
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`This report contains detailed ${reportName.toLowerCase()} information.`, 20, yPosition);
    }

    // Save PDF
    doc.save(`${filename}.pdf`);
  };

  const reportTypes = [
    { id: 'overview', name: 'Business Overview', icon: BarChart3, description: 'General business metrics and KPIs' },
    { id: 'financial', name: 'Financial Report', icon: () => <span className="font-bold text-2xl">R</span>, description: 'Revenue, payments, and financial analysis' },
    { id: 'cases', name: 'Cases Report', icon: FileText, description: 'Case statistics and completion rates' },
    { id: 'clients', name: 'Client Report', icon: Users, description: 'Client demographics and relationships' },
    { id: 'services', name: 'Services Report', icon: Calendar, description: 'Service types and scheduling analysis' },
    { id: 'performance', name: 'Performance Report', icon: TrendingUp, description: 'Staff performance and efficiency metrics' }
  ];

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white dark:bg-gradient-to-r dark:from-blue-900 dark:to-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 dark:text-blue-200">Total Cases</p>
              <p className="text-3xl font-bold">{metrics?.totalCases ?? 0}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-200 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white dark:bg-gradient-to-r dark:from-green-900 dark:to-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 dark:text-green-200">Total Revenue</p>
              <p className="text-3xl font-bold">{formatCurrency(metrics?.totalRevenue ?? 0)}</p>
            </div>
            <span className="text-4xl font-bold text-green-200 dark:text-green-400">R</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white dark:bg-gradient-to-r dark:from-purple-900 dark:to-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 dark:text-purple-200">Active Cases</p>
              <p className="text-3xl font-bold">{metrics?.activeCases ?? 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-200 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white dark:bg-gradient-to-r dark:from-orange-900 dark:to-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 dark:text-orange-200">Completion Rate</p>
              <p className="text-3xl font-bold">{metrics?.taskCompletionRate ?? 0}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-200 dark:text-orange-400" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Service Types Distribution</h3>
          <div className="space-y-4">
            {(metrics?.serviceDistribution || []).map((s) => {
              const total = (metrics?.serviceDistribution || []).reduce((sum, x) => sum + x.count, 0) || 1;
              const pct = Math.round((s.count / total) * 100);
              return (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-gray-300">{s.label}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-slate-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="text-sm font-medium">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Monthly Revenue Trend</h3>
          <div className="space-y-4">
            {(metrics?.revenueTrend || []).map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-gray-300">{r.label}</span>
                <span className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinancialReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {Object.entries(metrics?.paymentMethods || {}).map(([method, amt]) => (
              <div key={method} className="flex justify-between">
                <span className="text-slate-600 dark:text-gray-300">{method.toUpperCase()}</span>
                <span className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(amt)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Payment Status</h3>
          <div className="space-y-3">
            {Object.entries(metrics?.paymentStatus || {}).map(([status, amt]) => (
              <div key={status} className="flex justify-between">
                <span className="text-slate-600 dark:text-gray-300">{status.toUpperCase()}</span>
                <span className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(amt)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Key Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-gray-300">Avg Case Value</span>
              <span className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(metrics?.avgCaseValue ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-gray-300">Monthly Revenue</span>
              <span className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(metrics?.monthlyRevenue ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-gray-300">Pending Payments</span>
              <span className="font-medium text-yellow-600">{metrics?.pendingPayments ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'overview':
        return renderOverviewReport();
      case 'financial':
        return renderFinancialReport();
      case 'cases':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Cases Analysis</h3>
            <p className="text-slate-600 dark:text-gray-300">Detailed case statistics and analysis will be displayed here.</p>
          </div>
        );

      case 'clients':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Client Demographics</h3>
            <p className="text-slate-600 dark:text-gray-300">Client relationship and demographic analysis will be displayed here.</p>
          </div>
        );

      case 'services':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Services Analysis</h3>
            <p className="text-slate-600 dark:text-gray-300">Service scheduling and type analysis will be displayed here.</p>
          </div>
        );

      case 'performance':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Performance Metrics</h3>
            <p className="text-slate-600 dark:text-gray-300">Staff performance and efficiency metrics will be displayed here.</p>
          </div>
        );

      default:
        return renderOverviewReport();
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
          <p className="text-slate-600 dark:text-gray-300">Generate and view business reports and analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={exportReport}
            disabled={loading || !metrics}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <p className="text-slate-600 dark:text-gray-300">Loading reports...</p>
        </div>
      )}

      {/* Report Types */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 transition-colors duration-200">
        <div className="p-6 border-b border-slate-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Report Types</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedReport === report.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-500 hover:bg-slate-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className={`w-6 h-6 ${selectedReport === report.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-gray-400'}`} />
                  <h4 className={`font-medium ${selectedReport === report.id ? 'text-blue-900 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                    {report.name}
                  </h4>
                </div>
                <p className="text-sm text-slate-600 dark:text-gray-300">{report.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Content */}
      {!loading && renderReportContent()}
    </div>
  );
};

export default Reports;
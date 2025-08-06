import React from 'react';
import { FileText, Users, CheckCircle, Clock, TrendingUp, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import StatsCard from './StatsCard';
import RecentActivity from './RecentActivity';
import { mockAnalytics } from '../../data/mockData';

const Dashboard: React.FC = () => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, Kgopotso</h1>
        <p className="text-blue-100">Here's what's happening with your funeral home today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Cases"
          value={mockAnalytics.totalCases}
          icon={FileText}
          change="+12% from last month"
          changeType="increase"
          color="blue"
        />
        <StatsCard
          title="Active Cases"
          value={mockAnalytics.activeCases}
          icon={Clock}
          change="+3 this week"
          changeType="increase"
          color="yellow"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(mockAnalytics.totalRevenue)}
          icon={DollarSign}
          change="+8% from last month"
          changeType="increase"
          color="green"
        />
        <StatsCard
          title="Task Completion"
          value={`${mockAnalytics.taskCompletionRate}%`}
          icon={CheckCircle}
          change="+5% from last week"
          changeType="increase"
          color="purple"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-slate-700">Completed Cases</span>
              </div>
              <span className="font-semibold text-slate-900">{mockAnalytics.completedCases}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-slate-700">Monthly Revenue</span>
              </div>
              <span className="font-semibold text-slate-900">{formatCurrency(mockAnalytics.monthlyRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-slate-700">Avg Case Value</span>
              </div>
              <span className="font-semibold text-slate-900">{formatCurrency(mockAnalytics.avgCaseValue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <span className="text-slate-700">Pending Payments</span>
              </div>
              <span className="font-semibold text-slate-900">{mockAnalytics.pendingPayments}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </div>

      {/* Upcoming Services */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Upcoming Services</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-slate-900">Memorial Service - Margaret Smith</h4>
                <p className="text-sm text-slate-600">January 30, 2024 at 2:00 PM</p>
                <p className="text-sm text-slate-500">St. Mary's Church, Cape Town</p>
              </div>
              <div className="text-right">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  Tomorrow
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-slate-900">Cremation Service - Robert Johnson</h4>
                <p className="text-sm text-slate-600">February 2, 2024 at 10:00 AM</p>
                <p className="text-sm text-slate-500">Johannesburg Crematorium</p>
              </div>
              <div className="text-right">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  In 3 days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
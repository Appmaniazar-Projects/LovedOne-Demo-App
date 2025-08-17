import React, { useState } from 'react';
import { Download, FileText, TrendingUp, Calendar, DollarSign, Users, BarChart3, PieChart } from 'lucide-react';
import { mockAnalytics, mockClients, mockDeceasedProfiles, mockPayments } from '../../data/mockData';

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('month');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const generateReport = (type: string) => {
    console.log(`Generating ${type} report...`);
    // Here you would implement actual report generation
  };

  const reportTypes = [
    { id: 'overview', name: 'Business Overview', icon: BarChart3, description: 'General business metrics and KPIs' },
    { id: 'financial', name: 'Financial Report', icon: DollarSign, description: 'Revenue, payments, and financial analysis' },
    { id: 'cases', name: 'Cases Report', icon: FileText, description: 'Case statistics and completion rates' },
    { id: 'clients', name: 'Client Report', icon: Users, description: 'Client demographics and relationships' },
    { id: 'services', name: 'Services Report', icon: Calendar, description: 'Service types and scheduling analysis' },
    { id: 'performance', name: 'Performance Report', icon: TrendingUp, description: 'Staff performance and efficiency metrics' }
  ];

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Cases</p>
              <p className="text-3xl font-bold">{mockAnalytics.totalCases}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Total Revenue</p>
              <p className="text-3xl font-bold">{formatCurrency(mockAnalytics.totalRevenue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Active Cases</p>
              <p className="text-3xl font-bold">{mockAnalytics.activeCases}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Completion Rate</p>
              <p className="text-3xl font-bold">{mockAnalytics.taskCompletionRate}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Service Types Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Burial Services</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="text-sm font-medium">45%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Cremation Services</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-slate-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
                <span className="text-sm font-medium">35%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Memorial Services</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-slate-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <span className="text-sm font-medium">20%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Revenue Trend</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">January</span>
              <span className="font-medium">{formatCurrency(150000)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">February</span>
              <span className="font-medium">{formatCurrency(185000)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">March</span>
              <span className="font-medium">{formatCurrency(220000)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">April</span>
              <span className="font-medium">{formatCurrency(195000)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinancialReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">EFT</span>
              <span className="font-medium">{formatCurrency(500000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Card</span>
              <span className="font-medium">{formatCurrency(350000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">EasyPay</span>
              <span className="font-medium">{formatCurrency(250000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">SnapScan</span>
              <span className="font-medium">{formatCurrency(150000)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Completed</span>
              <span className="font-medium text-green-600">{formatCurrency(1100000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Pending</span>
              <span className="font-medium text-yellow-600">{formatCurrency(100000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Failed</span>
              <span className="font-medium text-red-600">{formatCurrency(25000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Refunded</span>
              <span className="font-medium text-gray-600">{formatCurrency(25000)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Avg Case Value</span>
              <span className="font-medium">{formatCurrency(mockAnalytics.avgCaseValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Monthly Revenue</span>
              <span className="font-medium">{formatCurrency(mockAnalytics.monthlyRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Pending Payments</span>
              <span className="font-medium text-yellow-600">{mockAnalytics.pendingPayments}</span>
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
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Cases Analysis</h3>
            <p className="text-slate-600">Detailed case statistics and analysis will be displayed here.</p>
          </div>
        );
      case 'clients':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Client Demographics</h3>
            <p className="text-slate-600">Client relationship and demographic analysis will be displayed here.</p>
          </div>
        );
      case 'services':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Services Analysis</h3>
            <p className="text-slate-600">Service scheduling and type analysis will be displayed here.</p>
          </div>
        );
      case 'performance':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance Metrics</h3>
            <p className="text-slate-600">Staff performance and efficiency metrics will be displayed here.</p>
          </div>
        );
      default:
        return renderOverviewReport();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-600">Generate and view business reports and analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button 
            onClick={() => generateReport(selectedReport)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Report Types */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Report Types</h3>
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
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className={`w-6 h-6 ${selectedReport === report.id ? 'text-blue-600' : 'text-slate-400'}`} />
                  <h4 className={`font-medium ${selectedReport === report.id ? 'text-blue-900' : 'text-slate-900'}`}>
                    {report.name}
                  </h4>
                </div>
                <p className="text-sm text-slate-600">{report.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
};

export default Reports;
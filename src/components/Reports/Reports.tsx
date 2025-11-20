import React, { useState } from 'react';
import { Download, FileText, TrendingUp, Calendar, Users, BarChart3 } from 'lucide-react';
import { mockAnalytics } from '../../data/mockData';
import jsPDF from 'jspdf';

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

  const exportReport = () => {
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
    
    switch (selectedReport) {
      case 'overview':
        // Key Metrics Section
        doc.setFont('helvetica', 'bold');
        doc.text('KEY METRICS', 20, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        doc.text(`Total Cases: ${mockAnalytics.totalCases}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Total Revenue: ${formatCurrency(mockAnalytics.totalRevenue)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Active Cases: ${mockAnalytics.activeCases}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Completed Cases: ${mockAnalytics.completedCases}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Task Completion Rate: ${mockAnalytics.taskCompletionRate}%`, 25, yPosition);
        yPosition += 6;
        doc.text(`Average Case Value: ${formatCurrency(mockAnalytics.avgCaseValue)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Monthly Revenue: ${formatCurrency(mockAnalytics.monthlyRevenue)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Pending Payments: ${mockAnalytics.pendingPayments}`, 25, yPosition);
        yPosition += 12;

        // Service Distribution
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('SERVICE DISTRIBUTION', 20, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        doc.text('Burial Services: 45%', 25, yPosition);
        yPosition += 6;
        doc.text('Cremation Services: 35%', 25, yPosition);
        yPosition += 6;
        doc.text('Memorial Services: 20%', 25, yPosition);
        yPosition += 12;

        // Monthly Revenue Trend
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('MONTHLY REVENUE TREND', 20, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        doc.text(`January: ${formatCurrency(150000)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`February: ${formatCurrency(185000)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`March: ${formatCurrency(220000)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`April: ${formatCurrency(195000)}`, 25, yPosition);
        break;
        
      case 'financial':
        // Payment Methods
        doc.setFont('helvetica', 'bold');
        doc.text('PAYMENT METHODS', 20, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        doc.text(`EFT: ${formatCurrency(500000)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Card: ${formatCurrency(350000)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`EasyPay: ${formatCurrency(250000)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`SnapScan: ${formatCurrency(150000)}`, 25, yPosition);
        yPosition += 12;

        // Payment Status
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('PAYMENT STATUS', 20, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        doc.text(`Completed: ${formatCurrency(1100000)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Pending: ${formatCurrency(100000)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Failed: ${formatCurrency(25000)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Refunded: ${formatCurrency(25000)}`, 25, yPosition);
        yPosition += 12;

        // Key Metrics
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('KEY METRICS', 20, yPosition);
        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        doc.text(`Average Case Value: ${formatCurrency(mockAnalytics.avgCaseValue)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Monthly Revenue: ${formatCurrency(mockAnalytics.monthlyRevenue)}`, 25, yPosition);
        yPosition += 6;
        doc.text(`Pending Payments: ${mockAnalytics.pendingPayments}`, 25, yPosition);
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
              <p className="text-3xl font-bold">{mockAnalytics.totalCases}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-200 dark:text-blue-400" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white dark:bg-gradient-to-r dark:from-green-900 dark:to-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 dark:text-green-200">Total Revenue</p>
              <p className="text-3xl font-bold">{formatCurrency(mockAnalytics.totalRevenue)}</p>
            </div>
            <span className="text-4xl font-bold text-green-200 dark:text-green-400">R</span>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white dark:bg-gradient-to-r dark:from-purple-900 dark:to-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 dark:text-purple-200">Active Cases</p>
              <p className="text-3xl font-bold">{mockAnalytics.activeCases}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-200 dark:text-purple-400" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white dark:bg-gradient-to-r dark:from-orange-900 dark:to-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 dark:text-orange-200">Completion Rate</p>
              <p className="text-3xl font-bold">{mockAnalytics.taskCompletionRate}%</p>
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
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-gray-300">Burial Services</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-slate-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="text-sm font-medium">45%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-gray-300">Cremation Services</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-slate-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
                <span className="text-sm font-medium">35%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-gray-300">Memorial Services</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-slate-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <span className="text-sm font-medium">20%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Monthly Revenue Trend</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-gray-300">January</span>
              <span className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(150000)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-gray-300">February</span>
              <span className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(185000)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-gray-300">March</span>
              <span className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(220000)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-gray-300">April</span>
              <span className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(195000)}</span>
            </div>
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
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-gray-300">EFT</span>
              <span className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(500000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-gray-300">Card</span>
              <span className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(350000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-gray-300">EasyPay</span>
              <span className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(250000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-gray-300">SnapScan</span>
              <span className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(150000)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Payment Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-gray-300">Completed</span>
              <span className="font-medium text-green-600">{formatCurrency(1100000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-gray-300">Pending</span>
              <span className="font-medium text-yellow-600">{formatCurrency(100000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-gray-300">Failed</span>
              <span className="font-medium text-red-600">{formatCurrency(25000)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-gray-300">Refunded</span>
              <span className="font-medium text-gray-600 dark:text-gray-300">{formatCurrency(25000)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Key Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-gray-300">Avg Case Value</span>
              <span className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(mockAnalytics.avgCaseValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-gray-300">Monthly Revenue</span>
              <span className="font-medium text-slate-900 dark:text-gray-100">{formatCurrency(mockAnalytics.monthlyRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-gray-300">Pending Payments</span>
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
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

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
      {renderReportContent()}
    </div>
  );
};

export default Reports;
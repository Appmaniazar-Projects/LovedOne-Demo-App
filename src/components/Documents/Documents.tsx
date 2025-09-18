import React, { useState } from 'react';
import { Plus, Search, FileText, Download, Eye, Trash2, Upload, Calendar, User } from 'lucide-react';
import { mockDocuments } from '../../data/mockData';
import { Document } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'death-certificate':
        return '';
      case 'id':
        return '';
      case 'insurance':
        return '';
      case 'contract':
        return '';
      default:
        return '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeColor = (type: string) => {
    const baseStyles = {
      'death-certificate': {
        light: 'bg-red-100 text-red-800',
        dark: 'bg-red-900/30 text-red-300'
      },
      'id': {
        light: 'bg-blue-100 text-blue-800',
        dark: 'bg-blue-900/30 text-blue-300'
      },
      'insurance': {
        light: 'bg-green-100 text-green-800',
        dark: 'bg-green-900/30 text-green-300'
      },
      'contract': {
        light: 'bg-purple-100 text-purple-800',
        dark: 'bg-purple-900/30 text-purple-300'
      },
      'default': {
        light: 'bg-gray-100 text-gray-800',
        dark: 'bg-gray-700 text-gray-300'
      }
    };

    const colorSet = baseStyles[type as keyof typeof baseStyles] || baseStyles.default;
    return colorSet[theme as keyof typeof colorSet] || colorSet.light;
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Documents</h1>
          <p className="text-slate-600 dark:text-gray-400">Manage case documents and files</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 transition-colors duration-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 transition-colors duration-200"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-slate-900 dark:text-white transition-colors duration-200"
          >
            <option value="all">All Types</option>
            <option value="death-certificate">Death Certificate</option>
            <option value="id">ID Document</option>
            <option value="insurance">Insurance</option>
            <option value="contract">Contract</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-400">Total Documents</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{documents.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-400">Death Certificates</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {documents.filter(d => d.type === 'death-certificate').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-400">Insurance Docs</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {documents.filter(d => d.type === 'insurance').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-4 transition-colors duration-200">
          <p className="text-sm text-slate-600 dark:text-gray-400">Expiring Soon</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {documents.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
          </p>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 transition-colors duration-200">
        <div className="p-6 border-b border-slate-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Document Library</h3>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-gray-700">
          {filteredDocuments.map((document) => (
            <div 
              key={document.id} 
              className="p-6 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getDocumentIcon(document.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-slate-900 dark:text-white">{document.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(document.type)}`}>
                        {document.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-sm text-slate-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>Uploaded by {document.uploadedBy}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(document.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span>{formatFileSize(document.size)}</span>
                      {document.expiryDate && (
                        <span className={`font-medium ${
                          new Date(document.expiryDate) < new Date() 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          Expires: {new Date(document.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/30' 
                        : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button 
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-green-400 hover:bg-green-900/30'
                        : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button 
                    className={`p-2 rounded-lg transition-colors ${
                      theme === 'dark'
                        ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30'
                        : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-slate-400 dark:text-gray-600 mx-auto mb-4" />
          <div className="text-slate-400 dark:text-gray-500 text-lg">No documents found</div>
          <p className="text-slate-500 dark:text-gray-600 mt-2">Try adjusting your search terms or upload new documents</p>
        </div>
      )}
    </div>
  );
};

export default Documents;
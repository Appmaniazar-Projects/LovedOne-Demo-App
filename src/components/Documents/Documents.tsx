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
  const [uploadForm, setUploadForm] = useState<{
    name: string;
    type: Document['type'];
    caseId: string;
    uploadedBy: string;
    expiryDate: string;
    file: File | null;
  }>({
    name: '',
    type: 'other',
    caseId: '',
    uploadedBy: '',
    expiryDate: '',
    file: null
  });

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

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.name || !uploadForm.caseId || !uploadForm.uploadedBy) {
      return;
    }

    const newDocument: Document = {
      id: (documents.length + 1).toString(),
      name: uploadForm.name,
      type: uploadForm.type,
      url: uploadForm.file ? URL.createObjectURL(uploadForm.file) : '/documents/placeholder.pdf',
      size: uploadForm.file ? uploadForm.file.size : 0,
      caseId: uploadForm.caseId,
      uploadedBy: uploadForm.uploadedBy,
      expiryDate: uploadForm.expiryDate ? new Date(uploadForm.expiryDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setDocuments(prev => [newDocument, ...prev]);
    setIsUploadModalOpen(false);
    setUploadForm({
      name: '',
      type: 'other',
      caseId: '',
      uploadedBy: '',
      expiryDate: '',
      file: null
    });
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

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-lg shadow-2xl w-full max-w-xl bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-900">Upload Document</h2>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">✕</button>
            </div>
            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Document Name</label>
                  <input value={uploadForm.name} onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" placeholder="e.g. Death Certificate.pdf" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Document Type</label>
                  <select value={uploadForm.type} onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value as Document['type'] })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white">
                    <option value="death-certificate">Death Certificate</option>
                    <option value="id">ID Document</option>
                    <option value="insurance">Insurance</option>
                    <option value="contract">Contract</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Case ID</label>
                  <input value={uploadForm.caseId} onChange={(e) => setUploadForm({ ...uploadForm, caseId: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" placeholder="e.g. 1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Uploaded By</label>
                  <input value={uploadForm.uploadedBy} onChange={(e) => setUploadForm({ ...uploadForm, uploadedBy: e.target.value })} className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white" placeholder="Your name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">Expiry Date (optional)</label>
                  <input 
                    type="date" 
                    value={uploadForm.expiryDate} 
                    onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })} 
                    className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 dark:hover:border-gray-500 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-datetime-edit-fields-wrapper]:py-0 [&::-webkit-datetime-edit]:py-0 [&::-webkit-datetime-edit-year-field]:text-slate-900 [&::-webkit-datetime-edit-month-field]:text-slate-900 [&::-webkit-datetime-edit-day-field]:text-slate-900 dark:[&::-webkit-datetime-edit-year-field]:text-white dark:[&::-webkit-datetime-edit-month-field]:text-white dark:[&::-webkit-datetime-edit-day-field]:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 dark:text-slate-900 mb-1">File</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      id="file-upload"
                      onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })} 
                      className="hidden" 
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                    />
                    <label 
                      htmlFor="file-upload" 
                      className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-lg cursor-pointer bg-white dark:bg-gray-700 hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Upload className="w-5 h-5 mr-2 text-slate-600 dark:text-gray-300" />
                      <span className="text-sm text-slate-600 dark:text-gray-300">
                        {uploadForm.file ? uploadForm.file.name : 'Choose file or drag here'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-slate-900 hover:bg-slate-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Upload Document</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
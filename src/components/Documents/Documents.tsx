import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, Eye, Trash2, Upload, Calendar, User } from 'lucide-react';
import { Document } from '../../types';
import { supabase } from '../../supabaseClient';

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch documents from Supabase
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          description,
          file_url,
          uploaded_by,
          deceased_id,
          client_id,
          parlor_id,
          created_at,
          updated_at,
          type,
          size,
          expiry_date
        `)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching documents:', error.message);
        setDocuments([]);
      } else {
        setDocuments(
          (data as any[]).map((doc) => ({
            id: doc.id,
            name: doc.title,
            description: doc.description,
            type: doc.type ?? 'other',
            url: doc.file_url,
            size: doc.size ?? 0,
            caseId: doc.deceased_id ?? doc.client_id ?? doc.parlor_id ?? '',
            uploadedBy: doc.uploaded_by ?? 'Unknown',
            expiryDate: doc.expiry_date ? new Date(doc.expiry_date) : undefined,
            createdAt: doc.created_at ? new Date(doc.created_at) : new Date(),
            updatedAt: doc.updated_at ? new Date(doc.updated_at) : (doc.created_at ? new Date(doc.created_at) : new Date()),
          }))
        );
      }
      setLoading(false);
    };
    fetchDocuments();
  }, []);

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'death-certificate':
        return '📜';
      case 'id':
        return '🆔';
      case 'insurance':
        return '🛡️';
      case 'contract':
        return '📋';
      default:
        return '📄';
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
    switch (type) {
      case 'death-certificate':
        return 'bg-red-100 text-red-800';
      case 'id':
        return 'bg-blue-100 text-blue-800';
      case 'insurance':
        return 'bg-green-100 text-green-800';
      case 'contract':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-600">Manage case documents and files</p>
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
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Total Documents</p>
          <p className="text-2xl font-bold text-slate-900">{documents.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Death Certificates</p>
          <p className="text-2xl font-bold text-red-600">
            {documents.filter(d => d.type === 'death-certificate').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Insurance Docs</p>
          <p className="text-2xl font-bold text-green-600">
            {documents.filter(d => d.type === 'insurance').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600">Expiring Soon</p>
          <p className="text-2xl font-bold text-yellow-600">
            {documents.filter(d => d.expiryDate && new Date(d.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
          </p>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Document Library</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getDocumentIcon(document.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-slate-900">{document.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(document.type)}`}>
                        {document.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-slate-500">
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
                        <span className={`font-medium ${new Date(document.expiryDate) < new Date() ? 'text-red-600' : 'text-yellow-600'}`}>
                          Expires: {new Date(document.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Download className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <div className="text-slate-400 text-lg">No documents found</div>
          <p className="text-slate-500 mt-2">Try adjusting your search terms or upload new documents</p>
        </div>
      )}
    </div>
  );
};

export default Documents;
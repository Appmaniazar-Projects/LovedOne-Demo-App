import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Eye, Trash2, AlertCircle, CheckCircle, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../supabaseClient';
import { toast } from 'react-hot-toast';

interface ClientDocument {
  id: string;
  client_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_by: string;
  uploaded_at: string;
  notes?: string;
}

interface ClientDocumentsProps {
  clientId: string;
  clientName: string;
}

const REQUIRED_DOCUMENTS = [
  { type: 'id_document', label: 'ID Document', description: 'Valid South African ID or Passport' },
  { type: 'proof_of_residence', label: 'Proof of Residence', description: 'Recent utility bill or bank statement' },
  { type: 'death_certificate', label: 'Death Certificate', description: 'Official death certificate (if applicable)' },
  { type: 'insurance_policy', label: 'Insurance Policy', description: 'Funeral insurance policy documents' },
  { type: 'marriage_certificate', label: 'Marriage Certificate', description: 'Marriage certificate (if applicable)' },
  { type: 'other', label: 'Other Documents', description: 'Any additional supporting documents' }
];

const ClientDocuments: React.FC<ClientDocumentsProps> = ({ clientId, clientName }) => {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    document_type: 'id_document',
    file: null as File | null,
    notes: ''
  });

  useEffect(() => {
    fetchDocuments();
  }, [clientId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) {
      toast.error('Please select a file');
      return;
    }

    // Respect bucket limit (5MB) for this demo
    const maxBytes = 5 * 1024 * 1024;
    if (uploadForm.file.size > maxBytes) {
      toast.error('File is too large. Maximum size is 5MB for this demo.');
      return;
    }

    if (!isSupabaseConfigured()) {
      toast.error('Document upload is not available in this demo environment.');
      return;
    }

    setUploading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to Supabase Storage
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${clientId}/${uploadForm.document_type}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(fileName, uploadForm.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('client-documents')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;

      // Save document metadata to database
      const { error: dbError } = await supabase
        .from('client_documents')
        .insert({
          client_id: clientId,
          document_type: uploadForm.document_type,
          file_name: uploadForm.file.name,
          file_url: publicUrl,
          file_size: uploadForm.file.size,
          uploaded_by: user.id,
          notes: uploadForm.notes
        });

      if (dbError) throw dbError;

      toast.success('Document uploaded successfully!');
      setIsUploadModalOpen(false);
      setUploadForm({ document_type: 'id_document', file: null, notes: '' });
      fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      const message = (error && error.message) ? String(error.message) : 'Failed to upload document';

      const lower = message.toLowerCase();
      if (lower.includes('row level security') || lower.includes('rls')) {
        toast.error('Document upload is not available in this demo environment (permissions).');
      } else if (lower.includes('storage bucket') || lower.includes('resource was not found')) {
        toast.error('Document storage is not fully configured. Upload has been disabled for this demo.');
      } else {
        toast.error(message);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      if (!isSupabaseConfigured()) {
        toast.error('Document delete is not available in this demo environment.');
        return;
      }

      // Extract file path from URL
      let bucketName = 'documents';
      let filePath = '';

      if (fileUrl.includes('/documents/')) {
        const parts = fileUrl.split('/documents/');
        filePath = parts[1];
        bucketName = 'documents';
      } else if (fileUrl.includes('/client-documents/')) {
        const parts = fileUrl.split('/client-documents/');
        filePath = parts[1];
        bucketName = 'client-documents';
      }

      // Delete from storage
      if (filePath) {
        await supabase.storage
          .from(bucketName)
          .remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast.error(error.message || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentStatus = (type: string) => {
    const hasDocument = documents.some(doc => doc.document_type === type);
    return hasDocument;
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = REQUIRED_DOCUMENTS.find(d => d.type === type);
    return docType?.label || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Client Documents</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage documents for {clientName}</p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Required Documents Checklist */}
      <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Required Documents</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {REQUIRED_DOCUMENTS.map((docType) => {
            const hasDoc = getDocumentStatus(docType.type);
            return (
              <div
                key={docType.type}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  hasDoc
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
              >
                {hasDoc ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    hasDoc ? 'text-green-900 dark:text-green-100' : 'text-gray-900 dark:text-white'
                  }`}>
                    {docType.label}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{docType.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Documents List */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No documents uploaded yet</p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-4 text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              Upload your first document
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">{doc.file_name}</h4>
                    <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">
                        {getDocumentTypeLabel(doc.document_type)}
                      </span>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{doc.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="View document"
                  >
                    <Eye className="w-5 h-5" />
                  </a>
                  <a
                    href={doc.file_url}
                    download
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    title="Download document"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => handleDeleteDocument(doc.id, doc.file_url)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Document</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleFileUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Document Type
                </label>
                <select
                  value={uploadForm.document_type}
                  onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {REQUIRED_DOCUMENTS.map((docType) => (
                    <option key={docType.type} value={docType.type}>
                      {docType.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select File
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                    className="hidden"
                    id="file-input"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    required
                  />
                  <label
                    htmlFor="file-input"
                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-700"
                  >
                    <Upload className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {uploadForm.file ? uploadForm.file.name : 'Choose file or drag here'}
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 5MB)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add any notes about this document..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDocuments;

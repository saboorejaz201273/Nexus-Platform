import React, { useEffect, useState, useRef } from 'react';
import { getDocuments, uploadDocument, signDocument, deleteDocument, updateDocumentStatus } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL;

interface DocumentItem {
  _id: string;
  title: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedBy: { _id: string; name: string; email: string; role: string };
  version: number;
  status: string;
  signature: string;
  signedBy?: { _id: string; name: string; email: string; role: string } | null;
  signedAt?: string | null;
  createdAt: string;
}

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [signModalDoc, setSignModalDoc] = useState<DocumentItem | null>(null);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await getDocuments();
      setDocuments(res.data);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (!title) {
        setTitle(e.target.files[0].name);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);

    setUploading(true);
    try {
      await uploadDocument(formData);
      toast.success('Document uploaded successfully!');
      setFile(null);
      setTitle('');
      fetchDocuments();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await deleteDocument(id);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateDocumentStatus(id, status);
      toast.success(`Status updated to ${status}`);
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // --- Signature Pad ---
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2937';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !signModalDoc) return;

    const signatureData = canvas.toDataURL('image/png');

    try {
      await signDocument(signModalDoc._id, signatureData);
      toast.success('Document signed successfully!');
      setSignModalDoc(null);
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to sign document');
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-700';
      case 'approved': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isPDF = (fileType: string) => fileType === 'application/pdf';
  const isImage = (fileType: string) => fileType.startsWith('image/');

  if (loading) {
    return <div className="p-6">Loading documents...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Document Processing Chamber</h1>

      {/* Upload Box */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold mb-3">Upload New Document</h2>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Document title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Supported: PDF, Images, Word docs (max 10MB)</p>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No documents uploaded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc._id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold">{doc.title}</h3>
                  <p className="text-sm text-gray-500">
                    {doc.fileName} • {formatSize(doc.fileSize)} • v{doc.version}
                  </p>
                  <p className="text-sm text-gray-500">
                    Uploaded by: <span className="font-medium">{doc.uploadedBy?.name}</span> ({doc.uploadedBy?.role})
                  </p>
                  {doc.signedBy && (
                    <p className="text-sm text-green-600">
                      ✍️ Signed by {doc.signedBy.name} on {new Date(doc.signedAt!).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(doc.status)}`}>
                  {doc.status}
                </span>
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                >
                  👁️ Preview
                </button>

                <a
                  href={`${API_BASE}/uploads/${doc.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                >
                  ⬇️ Download
                </a>

                {doc.status !== 'signed' && (
                  <button
                    onClick={() => setSignModalDoc(doc)}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                  >
                    ✍️ Sign Document
                  </button>
                )}

                {doc.status === 'signed' && (
                  <button
                    onClick={() => handleStatusChange(doc._id, 'approved')}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                  >
                    ✅ Approve
                  </button>
                )}

                {doc.uploadedBy?._id === user?.id && (
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">{previewDoc.title}</h2>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              {isPDF(previewDoc.fileType) && (
                <iframe
                  src={`${API_BASE}/uploads/${previewDoc.filePath}`}
                  className="w-full h-[70vh] border rounded"
                  title={previewDoc.title}
                />
              )}
              {isImage(previewDoc.fileType) && (
                <img
                  src={`${API_BASE}/uploads/${previewDoc.filePath}`}
                  alt={previewDoc.title}
                  className="w-full max-h-[70vh] object-contain"
                />
              )}
              {!isPDF(previewDoc.fileType) && !isImage(previewDoc.fileType) && (
                <div className="text-center py-12 text-gray-500">
                  <p>Preview not available for this file type.</p>
                  <a
                    href={`${API_BASE}/uploads/${previewDoc.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mt-2 inline-block"
                  >
                    Download to view
                  </a>
                </div>
              )}

              {previewDoc.signature && (
                <div className="mt-4 border-t pt-4">
                  <p className="text-sm font-medium mb-2">E-Signature:</p>
                  <img src={previewDoc.signature} alt="Signature" className="border rounded max-w-xs" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sign Modal */}
      {signModalDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">Sign: {signModalDoc.title}</h2>
              <button
                onClick={() => { setSignModalDoc(null); clearCanvas(); }}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-2">Draw your signature below:</p>
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="border border-gray-300 rounded w-full bg-gray-50 cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={clearCanvas}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                >
                  Clear
                </button>
                <button
                  onClick={handleSign}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                >
                  Confirm Sign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
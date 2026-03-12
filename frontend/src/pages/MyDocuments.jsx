import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  DocumentPlusIcon,
  DocumentIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const MyDocuments = () => {
  const { user } = useAuth();
  const [internProfile, setInternProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/interns/me/profile');
      setInternProfile(data.intern);
    } catch (err) {
      console.error('Error fetching intern profile:', err);
      setError('Impossible de charger vos documents. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation du fichier
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format de fichier non supporté. Utilisez PDF ou Word.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 5 Mo).');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);
    formData.append('name', file.name);
    formData.append('type', 'intern-doc');

    try {
      setUploading(true);
      const response = await api.post('/interns/me/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.success) {
        toast.success('Document ajouté avec succès');
        fetchProfile(); // Recharger le profil pour voir le nouveau document
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi du document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    try {
      await api.delete(`/interns/me/documents/${docId}`);
      toast.success('Document supprimé');
      fetchProfile();
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error('Erreur lors de la suppression');
    }
  };

  const API_BASE_URL = (api.defaults.baseURL || '').replace('/api', '');

  const filteredDocuments = internProfile?.documents?.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) return <LoadingSpinner fullScreen />;
  if (error) return <ErrorMessage message={error} retry={fetchProfile} />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-300">
            Mes Documents
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez vos attestations, conventions et autres documents importants.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className={`btn-primary flex items-center cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {uploading ? (
              <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <DocumentPlusIcon className="w-5 h-5 mr-2" />
            )}
            {uploading ? 'Envoi en cours...' : 'Ajouter un document'}
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Statistics & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="md:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Rechercher un document..."
            className="input-field pl-10 h-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg mr-3">
              <DocumentTextIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{internProfile?.documents?.length || 0}</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
            À jour
          </span>
        </div>
      </div>

      {/* Grid of documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc, index) => (
            <div
              key={doc._id}
              className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <DocumentIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={`${API_BASE_URL}${doc.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
                    title="Télécharger"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => handleDeleteDocument(doc._id)}
                    className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate mb-1">
                {doc.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Ajouté le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
              </p>

              <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {doc.url.split('.').pop()}
                </span>
                <a
                  href={`${API_BASE_URL}${doc.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Ouvrir
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <DocumentIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'Aucun document trouvé' : 'Aucun document pour le moment'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
              {searchTerm 
                ? 'Ajustez votre recherche pour trouver ce que vous cherchez.'
                : 'Commencez par ajouter votre convention de stage ou votre pièce d\'identité.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDocuments;

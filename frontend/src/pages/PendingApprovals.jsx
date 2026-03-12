import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  Calendar,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ExternalLink,
  RotateCcw,
  Trash2,
  TrendingUp
} from 'lucide-react';

const PendingApprovals = () => {
  const { user } = useAuth();
  const [pendingInterns, setPendingInterns] = useState([]);
  const [stats, setStats] = useState({ approvedMonth: 0, rejectedMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, rejected

  useEffect(() => {
    fetchPendingInterns();
  }, []);

  const fetchPendingInterns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/pending-interns');
      setPendingInterns(response.interns);
      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, firstName, lastName) => {
    try {
      await api.put(`/admin/approve-intern/${id}`);
      
      toast.success(`${firstName} ${lastName} a été approuvé avec succès`);
      fetchPendingInterns();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (id, firstName, lastName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir rejeter ${firstName} ${lastName} ?`)) {
      try {
        await api.put(`/admin/reject-intern/${id}`);
        
        toast.success(`${firstName} ${lastName} a été rejeté`);
        fetchPendingInterns();
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du rejet');
      }
    }
  };

  const handleRestore = async (id, firstName, lastName) => {
    try {
      await api.put(`/admin/restore-intern/${id}`);
      toast.success(`${firstName} ${lastName} est de nouveau en attente`);
      fetchPendingInterns();
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la restauration');
    }
  };

  const handleDeletePermanent = async (id, firstName, lastName) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${firstName} ${lastName} ? Cette action est irréversible.`)) {
      return;
    }
    try {
      await api.delete(`/users/${id}`);
      toast.success('Utilisateur supprimé définitivement');
      fetchPendingInterns();
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleUpgradeRole = async (id, firstName, lastName, currentRole) => {
    const nextRole = currentRole === 'intern' ? 'supervisor' : 'admin';
    if (!window.confirm(`Voulez-vous promouvoir ${firstName} ${lastName} au rang de ${nextRole === 'supervisor' ? 'Superviseur' : 'Administrateur'} ?`)) {
      return;
    }
    try {
      await api.put(`/users/${id}`, { role: nextRole });
      toast.success(`${firstName} ${lastName} a été promu au rang de ${nextRole}`);
      fetchPendingInterns();
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la promotion');
    }
  };

  // Filtrer les stagiaires
  const filteredInterns = pendingInterns.filter(intern => {
    const matchesSearch = 
      intern.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'pending' && (!intern.application || intern.application.status === 'pending')) ||
                         (filter === 'rejected' && intern.application?.status === 'rejected');
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 mb-2">
          Demandes d'inscription
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
          Gérez les demandes d'inscription des nouveaux stagiaires
        </p>
      </div>


      {/* Barre de recherche et filtres */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 dark:text-white transition-all shadow-sm font-medium"
          />
        </div>
        
        <div className="flex bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'pending' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            En attente ({pendingInterns.filter(i => !i.application || i.application.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'rejected' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Rejetés ({pendingInterns.filter(i => i.application?.status === 'rejected').length})
          </button>
        </div>

        <button
          onClick={fetchPendingInterns}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* Liste des demandes */}
      {filteredInterns.length === 0 ? (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/50 dark:border-white/10 p-12 text-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Aucune demande en attente
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Les nouvelles demandes d'inscription apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInterns.map((intern, index) => (
            <div
              key={intern._id}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/50 dark:border-white/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${0.6 + index * 0.05}s` }}
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  {/* Informations du stagiaire */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-300 font-semibold">
                          {intern.firstName?.charAt(0)}{intern.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {intern.firstName} {intern.lastName}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          intern.application?.status === 'rejected' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {intern.application?.status === 'rejected' ? 'Rejeté' : 'En attente'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="text-sm">{intern.email}</span>
                      </div>
                      {intern.phone && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4 mr-2" />
                          <span className="text-sm">{intern.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          Inscrit le {new Date(intern.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    {/* Candidature / CV Section */}
                    {intern.application && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              CV joint : {intern.application.cvName || 'Document'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Postule pour : <span className="capitalize">{intern.application.appliedFor || 'Stage'}</span>
                            </p>
                          </div>
                        </div>
                        <a
                          href={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')}${intern.application.cvUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Voir le CV
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                    {intern.application?.status === 'rejected' ? (
                      <>
                        <button
                          onClick={() => handleRestore(intern._id, intern.firstName, intern.lastName)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Restaurer
                        </button>
                        <button
                          onClick={() => handleDeletePermanent(intern._id, intern.firstName, intern.lastName)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApprove(intern._id, intern.firstName, intern.lastName)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approuver
                        </button>
                        <button
                          onClick={() => handleUpgradeRole(intern._id, intern.firstName, intern.lastName, intern.role)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                          title="Promouvoir l'utilisateur"
                        >
                          <TrendingUp className="h-4 w-4" />
                          Promouvoir
                        </button>
                        <button
                          onClick={() => handleReject(intern._id, intern.firstName, intern.lastName)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium border border-red-100"
                        >
                          <XCircle className="h-4 w-4" />
                          Rejeter
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
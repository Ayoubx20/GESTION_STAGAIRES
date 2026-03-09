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
  Clock
} from 'lucide-react';

const PendingApprovals = () => {
  const { user } = useAuth();
  const [pendingInterns, setPendingInterns] = useState([]);
  const [stats, setStats] = useState({ approvedMonth: 0, rejectedMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

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
        await api.delete(`/admin/reject-intern/${id}`);
        
        toast.success(`${firstName} ${lastName} a été rejeté`);
        fetchPendingInterns();
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du rejet');
      }
    }
  };

  // Filtrer les stagiaires
  const filteredInterns = pendingInterns.filter(intern => {
    const matchesSearch = 
      intern.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
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

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/50 dark:border-white/10 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-xl">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">En attente</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pendingInterns.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/50 dark:border-white/10 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Approuvés (mois)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approvedMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/50 dark:border-white/10 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-xl">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rejetés (mois)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejectedMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          En attente
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
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <button
                      onClick={() => handleApprove(intern._id, intern.firstName, intern.lastName)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      Approuver
                    </button>
                    <button
                      onClick={() => handleReject(intern._id, intern.firstName, intern.lastName)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                    >
                      <UserX className="h-4 w-4" />
                      Rejeter
                    </button>
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
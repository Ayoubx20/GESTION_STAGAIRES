import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { internService } from '../services/interns';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  StarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const Interns = () => {
  const { isAdmin, isSupervisor, isIntern } = useAuth();
  const navigate = useNavigate();
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    school: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInterns, setSelectedInterns] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  // ✅ REDIRECTION SI STAGIAIRE
  useEffect(() => {
    if (isIntern) {
      toast.error('Accès non autorisé - Espace réservé aux administrateurs et superviseurs');
      navigate('/dashboard');
    }
  }, [isIntern, navigate]);

  // Live search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (!isIntern) {
        fetchInterns();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filters, pagination.page, isIntern]);

  const fetchInterns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await internService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        search: searchTerm
      });

      if (Array.isArray(data)) {
        setInterns(data);
        setPagination(prev => ({ ...prev, total: data.length, pages: Math.ceil(data.length / prev.limit) }));
      } else {
        setInterns(data.interns || []);
        setPagination({
          page: data.page || 1,
          limit: data.limit || 10,
          total: data.total || 0,
          pages: data.pages || 0
        });
      }
    } catch (error) {
      console.error('Error fetching interns:', error);
      setError('Impossible de charger la liste des stagiaires');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchInterns();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error('Seul un administrateur peut supprimer un stagiaire');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce stagiaire ?')) {
      return;
    }

    try {
      await internService.delete(id);
      toast.success('Stagiaire supprimé avec succès');
      fetchInterns();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleBulkDelete = async () => {
    if (!isAdmin) {
      toast.error('Seul un administrateur peut supprimer des stagiaires');
      return;
    }

    if (selectedInterns.length === 0) return;

    if (!window.confirm(`Voulez-vous supprimer ${selectedInterns.length} stagiaire(s) ?`)) {
      return;
    }

    try {
      await Promise.all(selectedInterns.map(id => internService.delete(id)));
      toast.success(`${selectedInterns.length} stagiaire(s) supprimé(s)`);
      setSelectedInterns([]);
      fetchInterns();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      setExportLoading(true);
      toast.success(`Export ${format} réussi (simulation)`);
    } catch (error) {
      toast.error("Erreur lors de l'export");
    } finally {
      setExportLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedInterns.length === interns.length) {
      setSelectedInterns([]);
    } else {
      setSelectedInterns(interns.map(i => i._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedInterns(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: 'badge-success', label: 'Actif' },
      pending: { class: 'badge-warning', label: 'En attente' },
      completed: { class: 'badge-info', label: 'Terminé' },
      terminated: { class: 'badge-danger', label: 'Interrompu' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  // ✅ AFFICHAGE SI STAGIAIRE
  if (isIntern) {
    return null; // Sera redirigé par le useEffect
  }

  if (loading && interns.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400">
            Gestion des Stagiaires
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            {isAdmin ? 'Gérez tous les stagiaires de votre plateforme' :
              isSupervisor ? 'Gérez les stagiaires sous votre supervision' :
                'Consultez la liste des stagiaires'}
          </p>
        </div>
        <div className="flex space-x-3">
          {/* Export Button - Admin et Superviseur seulement */}
          {(isAdmin || isSupervisor) && (
            <Menu as="div" className="relative">
              <Menu.Button className="btn-secondary" disabled={exportLoading}>
                {exportLoading ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                    Exporter
                  </>
                )}
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none z-10">
                  <div className="p-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleExport('csv')}
                          className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg`}
                        >
                          Exporter en CSV
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleExport('excel')}
                          className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg`}
                        >
                          Exporter en Excel
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => handleExport('pdf')}
                          className={`${active ? 'bg-gray-100 dark:bg-gray-700' : ''
                            } group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg`}
                        >
                          Exporter en PDF
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          )}

          {/* Add Intern Button - Admin et Superviseur SEULEMENT */}
          {(isAdmin || isSupervisor) && (
            <Link to="/interns/new" className="btn-primary">
              <PlusIcon className="w-5 h-5 mr-2" />
              Nouveau stagiaire
            </Link>
          )}
        </div>
      </div>

      {/* Bulk Actions - Admin SEULEMENT */}
      {isAdmin && selectedInterns.length > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-2xl p-4 flex items-center justify-between opacity-0 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <span className="text-sm text-primary-700 dark:text-primary-300">
            {selectedInterns.length} stagiaire(s) sélectionné(s)
          </span>
          <div className="flex space-x-2">
            <button
              onClick={handleBulkDelete}
              className="btn-danger text-sm py-1.5"
            >
              <TrashIcon className="w-4 h-4 mr-1" />
              Supprimer
            </button>
            <button
              onClick={() => setSelectedInterns([])}
              className="btn-secondary text-sm py-1.5"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters - visible pour admin et superviseur */}
      {(isAdmin || isSupervisor) && (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/50 dark:border-white/10 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex gap-4 w-full">
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                placeholder="Rechercher par nom, email, institution..."
                className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 dark:text-white transition-all shadow-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                showFilters 
                  ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 border-primary-200' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-300'
              }`}
            >
              <FunnelIcon className="w-5 h-5 mr-2" />
              Filtres
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Statut
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="active">Actif</option>
                    <option value="pending">En attente</option>
                    <option value="completed">Terminé</option>
                    <option value="terminated">Interrompu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Département
                  </label>
                  <select
                    value={filters.department}
                    onChange={(e) => handleFilterChange('department', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Tous les départements</option>
                    <option value="informatique">Informatique</option>
                    <option value="rh">Ressources Humaines</option>
                    <option value="marketing">Marketing</option>
                    <option value="finance">Finance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    École
                  </label>
                  <input
                    type="text"
                    value={filters.school}
                    onChange={(e) => handleFilterChange('school', e.target.value)}
                    placeholder="Nom de l'école"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid of Floating Cards */}
      {interns.length === 0 ? (
        <EmptyState
          title="Aucun stagiaire"
          description={isAdmin || isSupervisor ?
            "Commencez par ajouter votre premier stagiaire." :
            "Aucun stagiaire n'est actuellement enregistré."}
          action={(isAdmin || isSupervisor) ? () => window.location.href = '/interns/new' : null}
          actionText="Ajouter un stagiaire"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {interns.map((intern, index) => {
            const startDate = new Date(intern.startDate);
            const endDate = new Date(intern.endDate);
            const today = new Date();
            const totalDuration = endDate - startDate;
            const elapsed = today - startDate;
            const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

            return (
              <div
                key={intern._id}
                className="group relative bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-white/10 p-6 shadow-xl hover:shadow-primary-500/10 hover:-translate-y-2 transition-all duration-500 overflow-hidden"
              >
                {/* Checkbox for Admin - Top Right */}
                {isAdmin && (
                  <div className="absolute top-4 left-4 z-10">
                    <input
                      type="checkbox"
                      checked={selectedInterns.includes(intern._id)}
                      onChange={() => toggleSelect(intern._id)}
                      className="w-5 h-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500 transition-all cursor-pointer bg-white/50"
                    />
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-6 right-6">
                  {getStatusBadge(intern.status)}
                </div>

                <div className="flex items-start space-x-4">
                  {/* Avatar with Glow */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg transform group-hover:rotate-6 transition-transform">
                      {intern.user?.firstName?.charAt(0)}{intern.user?.lastName?.charAt(0)}
                    </div>
                  </div>

                  {/* Identity */}
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {intern.user?.firstName} {intern.user?.lastName}
                    </h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      #{intern.studentId}
                    </p>
                  </div>
                </div>

                {/* Details Section */}
                <div className="mt-8 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Département</p>
                      <div className="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                        <BuildingOfficeIcon className="w-3.5 h-3.5 mr-1.5 text-primary-500" />
                        {intern.major || 'Non spécifié'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Institution</p>
                      <div className="flex items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                        <AcademicCapIcon className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                        <span className="truncate">{intern.school}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <span>Progrès du stage</span>
                      <span className="text-primary-600">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <EnvelopeIcon className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                        {intern.user?.email}
                      </span>
                    </div>

                    {/* Action Button - Floating Menu */}
                    <Menu as="div" className="relative">
                      <Menu.Button className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-500 hover:text-primary-600 transition-all">
                        <EllipsisVerticalIcon className="w-5 h-5" />
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95 translate-y-2"
                        enterTo="transform opacity-100 scale-100 translate-y-0"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 bottom-full mb-2 w-48 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700 focus:outline-none z-50 overflow-hidden">
                          <div className="p-1.5 space-y-1">
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  to={`/interns/${intern._id}`}
                                  className={`${active ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-700 dark:text-gray-300'} flex items-center w-full px-3 py-2 text-sm font-medium rounded-xl transition-colors`}
                                >
                                  <EyeIcon className="w-4 h-4 mr-3" />
                                  Voir Profil
                                </Link>
                              )}
                            </Menu.Item>

                            {(isAdmin || isSupervisor) && (
                              <Menu.Item>
                                {({ active }) => (
                                  <Link
                                    to={`/interns/${intern._id}/evaluations`}
                                    className={`${active ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-700 dark:text-gray-300'} flex items-center w-full px-3 py-2 text-sm font-medium rounded-xl transition-colors`}
                                  >
                                    <StarIcon className="w-4 h-4 mr-3" />
                                    Évaluations
                                  </Link>
                                )}
                              </Menu.Item>
                            )}
                            {(isAdmin || isSupervisor) && (
                              <Menu.Item>
                                {({ active }) => (
                                  <Link
                                    to={`/interns/${intern._id}/edit`}
                                    className={`${active ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-700 dark:text-gray-300'} flex items-center w-full px-3 py-2 text-sm font-medium rounded-xl transition-colors`}
                                  >
                                    <PencilIcon className="w-4 h-4 mr-3" />
                                    Modifier
                                  </Link>
                                )}
                              </Menu.Item>
                            )}
                            {isAdmin && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleDelete(intern._id)}
                                    className={`${active ? 'bg-red-50 dark:bg-red-900/30 text-red-600' : 'text-red-500'} flex items-center w-full px-3 py-2 text-sm font-medium rounded-xl transition-colors`}
                                  >
                                    <TrashIcon className="w-4 h-4 mr-3" />
                                    Supprimer
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </div>
                </div>

                {/* Supervisor Indicator Corner */}
                {intern.supervisor && (
                  <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden rounded-tr-3xl">
                    <div className="absolute top-[-8px] right-[-32px] w-24 h-6 bg-indigo-500/10 dark:bg-indigo-400/10 rotate-45 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest translate-y-1">Supervisé</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (isAdmin || isSupervisor) && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Affichage {(pagination.page - 1) * pagination.limit + 1} à{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
            {pagination.total} résultats
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="btn-secondary px-3 py-2 disabled:opacity-50"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="btn-secondary px-3 py-2 disabled:opacity-50"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interns;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/tasks';
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  CalendarIcon,
  FlagIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
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

const Tasks = () => {
  const { user, isAdmin, isSupervisor, isIntern } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTasks();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [pagination.page, filters, searchTerm]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        search: searchTerm
      });
      
      if (Array.isArray(data)) {
        setTasks(data);
        setPagination(prev => ({ ...prev, total: data.length, pages: Math.ceil(data.length / prev.limit) }));
      } else {
        setTasks(data.tasks || []);
        setPagination({
          page: data.page || 1,
          limit: data.limit || 12,
          total: data.total || 0,
          pages: data.pages || 0
        });
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Impossible de charger la liste des tâches');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await taskService.updateStatus(id, newStatus);
      toast.success(`Tâche ${newStatus === 'completed' ? 'terminée ✓' : 'mise à jour'}`);
      fetchTasks();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleValidation = async (id, decision) => {
    // decision = 'approve' or 'reject'
    const feedback = decision === 'reject' ? prompt("Raison du rejet (sera ajoutée aux commentaires) :") : "";
    if (decision === 'reject' && feedback === null) return; // cancelled

    try {
      await taskService.validate(id, decision, feedback);
      toast.success(decision === 'approve' ? 'Tâche approuvée ✓' : 'Tâche renvoyée pour correction');
      fetchTasks();
    } catch (error) {
      toast.error('Erreur lors de la validation');
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin && !isSupervisor) {
      toast.error('Privilèges insuffisants pour supprimer');
      return;
    }

    if (!window.confirm('Supprimer cette tâche définitivement ?')) return;

    try {
      await taskService.delete(id);
      toast.success('Tâche supprimée');
      fetchTasks();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      urgent: { 
        bg: 'bg-red-500/10', 
        text: 'text-red-600 dark:text-red-400', 
        border: 'border-red-500/20',
        glow: 'shadow-red-500/20',
        label: 'Urgente'
      },
      high: { 
        bg: 'bg-orange-500/10', 
        text: 'text-orange-600 dark:text-orange-400', 
        border: 'border-orange-500/20',
        glow: 'shadow-orange-500/20',
        label: 'Haute'
      },
      medium: { 
        bg: 'bg-blue-500/10', 
        text: 'text-blue-600 dark:text-blue-400', 
        border: 'border-blue-500/20',
        glow: 'shadow-blue-500/20',
        label: 'Moyenne'
      },
      low: { 
        bg: 'bg-gray-500/10', 
        text: 'text-gray-600 dark:text-gray-400', 
        border: 'border-gray-500/20',
        glow: 'shadow-gray-500/20',
        label: 'Basse'
      }
    };
    return configs[priority] || configs.medium;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      in_progress: 'En cours',
      pending_validation: 'En validation',
      completed: 'Terminée',
      overdue: 'En retard',
      cancelled: 'Annulée'
    };
    return labels[status] || status;
  };

  if (loading && tasks.length === 0) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-white/10 shadow-xl opacity-0 animate-fade-in-up">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-primary-500/30">
            <ClipboardDocumentListIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Gestion des <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-300">Tâches</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-[0.2em] text-[10px]">
               {tasks.length} Tâches actives • Central de Productivité
            </p>
          </div>
        </div>

        {(isAdmin || isSupervisor) && (
          <Link 
            to="/tasks/new" 
            className="mt-6 md:mt-0 px-8 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1 active:scale-95 transition-all flex items-center group"
          >
            <PlusIcon className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-300" />
            Nouvelle Tâche
          </Link>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/30 dark:bg-gray-800/20 backdrop-blur-sm p-4 rounded-3xl border border-white/40 dark:border-white/5 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="md:col-span-2 relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Rechercher par titre ou description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-primary-500/50 transition-all font-medium text-gray-700 dark:text-gray-200"
          />
        </div>
        
        <select 
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="bg-white/80 dark:bg-gray-800/80 border-none rounded-2xl py-3 px-4 font-bold text-xs uppercase tracking-widest text-gray-500 focus:ring-2 focus:ring-primary-500/50"
        >
          <option value="">Tous les Status</option>
          <option value="pending">En attente</option>
          <option value="in_progress">En cours</option>
          <option value="pending_validation">À valider</option>
          <option value="completed">Terminées</option>
          <option value="overdue">En retard</option>
        </select>

        <select 
           value={filters.priority}
           onChange={(e) => setFilters({...filters, priority: e.target.value})}
           className="bg-white/80 dark:bg-gray-800/80 border-none rounded-2xl py-3 px-4 font-bold text-xs uppercase tracking-widest text-gray-500 focus:ring-2 focus:ring-primary-500/50"
        >
          <option value="">Toutes Priorités</option>
          <option value="urgent">Urgente</option>
          <option value="high">Haute</option>
          <option value="medium">Moyenne</option>
          <option value="low">Basse</option>
        </select>
      </div>

      {/* Quick Filter Chips - New Upgrade */}
      <div className="flex flex-wrap gap-3 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        {[
          { id: '', label: 'Toutes les missions', icon: ClipboardDocumentListIcon },
          { id: 'me', label: 'Mes Tâches', icon: UserCircleIcon },
          { id: 'urgent', label: 'Urgentes', icon: ExclamationCircleIcon },
          { id: 'in_progress', label: 'En cours', icon: ArrowPathIcon },
          { id: 'completed', label: 'Terminées', icon: CheckCircleIcon },
        ].map((chip) => {
          const isActive = (chip.id === '' && !filters.status && !filters.priority && !filters.assignedTo) || 
                           (chip.id === 'me' && filters.assignedTo === 'me') ||
                           (chip.id === 'urgent' && filters.priority === 'urgent') ||
                           (chip.id === 'in_progress' && filters.status === 'in_progress') ||
                           (chip.id === 'completed' && filters.status === 'completed');
          
          return (
            <button
              key={chip.id}
              onClick={() => {
                const newFilters = { status: '', priority: '', assignedTo: '' };
                if (chip.id === 'me') newFilters.assignedTo = 'me';
                else if (chip.id === 'urgent') newFilters.priority = 'urgent';
                else if (chip.id === 'in_progress' || chip.id === 'completed') newFilters.status = chip.id;
                setFilters(newFilters);
              }}
              className={`flex items-center px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${
                isActive 
                  ? 'bg-primary-600 text-white border-primary-600 shadow-primary-500/20' 
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-500 border-white/50 dark:border-white/10 hover:bg-white dark:hover:bg-gray-700 hover:border-primary-200'
              }`}
            >
              <chip.icon className={`w-3.5 h-3.5 mr-2 ${isActive ? 'text-white' : 'text-primary-500'}`} />
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Tasks Grid */}
      {tasks.length === 0 ? (
        <EmptyState 
          title="Aucune tâche trouvée"
          description="Ajustez vos filtres ou créez une nouvelle mission pour vos stagiaires."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tasks.map((task, idx) => {
            const pConfig = getPriorityConfig(task.priority);
            return (
              <div 
                key={task._id}
                className={`group relative bg-white/70 dark:bg-gray-800/60 backdrop-blur-md rounded-[2rem] p-6 border border-white/40 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col opacity-0 animate-fade-in-up`}
                style={{ animationDelay: `${0.2 + idx * 0.05}s` }}
              >
                {/* Priority Indicator Stripe */}
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-gradient-to-br transition-all duration-500 opacity-20 group-hover:opacity-40 rounded-full blur-2xl ${task.priority === 'urgent' ? 'from-red-500' : task.priority === 'high' ? 'from-orange-500' : 'from-primary-500'}`}></div>

                {/* Header */}
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${pConfig.bg} ${pConfig.text} ${pConfig.border} flex items-center`}>
                    <FlagIcon className="w-3 h-3 mr-1.5" />
                    {pConfig.label}
                  </div>
                  
                  <Menu as="div" className="relative">
                    <Menu.Button className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-xl transition-all text-gray-400 hover:text-gray-600 dark:hover:text-white">
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition duration-200 ease-out" enterFrom="translate-y-2 opacity-0" enterTo="translate-y-0 opacity-100"
                    >
                      <Menu.Items className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-2 z-50">
                        <Menu.Item>
                          {({ active }) => (
                            <Link to={`/tasks/${task._id}`} className={`${active ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-600 dark:text-gray-300'} flex items-center px-4 py-2 text-sm font-bold rounded-xl transition-all`}>
                              <EyeIcon className="w-4 h-4 mr-3" /> Voir Détails
                            </Link>
                          )}
                        </Menu.Item>
                        {(isAdmin || isSupervisor) && (
                          <Menu.Item>
                            {({ active }) => (
                              <Link to={`/tasks/${task._id}/edit`} className={`${active ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'text-gray-600 dark:text-gray-300'} flex items-center px-4 py-2 text-sm font-bold rounded-xl transition-all mt-1`}>
                                <PencilIcon className="w-4 h-4 mr-3" /> Modifier
                              </Link>
                            )}
                          </Menu.Item>
                        )}
                        {isAdmin && (
                          <Menu.Item>
                            {({ active }) => (
                              <button onClick={() => handleDelete(task._id)} className={`${active ? 'bg-red-50 dark:bg-red-900/30 text-red-600' : 'text-red-500'} flex items-center w-full px-4 py-2 text-sm font-bold rounded-xl transition-all mt-1`}>
                                <TrashIcon className="w-4 h-4 mr-3" /> Supprimer
                              </button>
                            )}
                          </Menu.Item>
                        )}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>

                {/* Title & Description */}
                <div className="flex-1 relative z-10">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-primary-600 transition-colors">
                    {task.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">
                    {task.description}
                  </p>
                </div>

                {/* Progress Bar Upgrade */}
                <div className="mb-6 relative z-10">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progression</span>
                     <span className="text-sm font-black text-primary-600">{task.progress || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r from-primary-500 to-indigo-600 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]`}
                      style={{ width: `${task.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Footer Info */}
                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700/50 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-[10px] font-black text-gray-500 dark:text-gray-400 border-2 border-white dark:border-gray-800 shadow-sm uppercase">
                        {task.assignedTo?.firstName?.[0]}{task.assignedTo?.lastName?.[0]}
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-900/40 px-3 py-1 rounded-lg">
                      <ClockIcon className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                      {format(new Date(task.dueDate), 'dd MMM', { locale: fr })}
                    </div>
                  </div>

                  {/* Quick Action Buttons - New Functionality */}
                  <div className="grid grid-cols-2 gap-2">
                    {task.status === 'pending_validation' ? (
                        (isAdmin || isSupervisor) ? (
                            <>
                                <button
                                    onClick={() => handleValidation(task._id, 'approve')}
                                    className="py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-green-500 text-white shadow-lg shadow-green-500/20 hover:bg-green-600"
                                >
                                    Approuver
                                </button>
                                <button
                                    onClick={() => handleValidation(task._id, 'reject')}
                                    className="py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600"
                                >
                                    Rejeter
                                </button>
                            </>
                        ) : (
                            <div className="col-span-2 flex items-center justify-center py-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-500/20">
                                <ClockIcon className="w-4 h-4 text-yellow-500 mr-2" />
                                <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-[0.2em]">En validation par superviseur</span>
                            </div>
                        )
                    ) : (
                      task.status !== 'completed' && (
                        <button 
                          onClick={() => handleStatusChange(task._id, task.status === 'pending' ? 'in_progress' : 'completed')}
                          className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            task.status === 'pending' 
                              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 hover:bg-primary-600' 
                              : 'bg-green-500 text-white shadow-lg shadow-green-500/20 hover:bg-green-600'
                          }`}
                        >
                          {task.status === 'pending' ? 'Démarrer' : 'Terminer'}
                        </button>
                      )
                    )}
                    {task.status === 'completed' ? (
                      <div className="col-span-2 flex items-center justify-center py-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-500/20">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.2em]">Mission Accomplie</span>
                      </div>
                    ) : (
                      task.status !== 'pending_validation' && (
                        <Link 
                          to={`/tasks/${task._id}`}
                          className="py-2.5 bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-300"
                        >
                          Détails
                        </Link>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Tasks;
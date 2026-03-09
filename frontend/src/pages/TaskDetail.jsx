import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/tasks';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
  CalendarIcon,
  FlagIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isSupervisor } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const data = await taskService.getById(id);
      setTask(data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette tâche définitivement ?')) return;

    try {
      await taskService.delete(id);
      toast.success('Tâche supprimée');
      navigate('/tasks');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await taskService.updateStatus(id, newStatus);
      toast.success('Statut mis à jour');
      fetchTask();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await taskService.addComment(id, comment);
      setComment('');
      fetchTask();
      toast.success('Commentaire ajouté');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    }
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      urgent: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20', label: 'Urgente', shadow: 'shadow-red-500/10' },
      high: { bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20', label: 'Haute', shadow: 'shadow-orange-500/10' },
      medium: { bg: 'bg-primary-500/10', text: 'text-primary-600 dark:text-primary-400', border: 'border-primary-500/20', label: 'Moyenne', shadow: 'shadow-primary-500/10' },
      low: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/20', label: 'Basse', shadow: 'shadow-gray-500/5' }
    };
    return configs[priority] || configs.medium;
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!task) return <div className="p-20 text-center font-black opacity-50 uppercase tracking-[0.4em]">Tâche Introuvable</div>;

  const pConfig = getPriorityConfig(task.priority);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 overflow-hidden">
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-[2rem] border border-white/60 dark:border-white/10 shadow-xl opacity-0 animate-fade-in-up">
        <div className="flex items-center space-x-5">
          <button
            onClick={() => navigate('/tasks')}
            className="group flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-700/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-200 transition-all duration-300"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:-translate-x-1 transition-all" />
          </button>
          <div>
            <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.3em] mb-1 block">
               Task Management • ID #{task._id.slice(-6).toUpperCase()}
            </span>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-none">Détails de la mission</h1>
          </div>
        </div>

        <div className="flex space-x-3 mt-6 md:mt-0">
          {(isAdmin || isSupervisor || task.assignedTo?._id === user?.id) && (
            <Link to={`/tasks/${id}/edit`} className="btn-secondary px-6 rounded-xl font-bold flex items-center">
              <PencilIcon className="w-4 h-4 mr-2" /> Modifier
            </Link>
          )}
          {isAdmin && (
            <button onClick={handleDelete} className="btn-danger px-6 rounded-xl font-bold flex items-center">
              <TrashIcon className="w-4 h-4 mr-2" /> Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Main Task Card */}
      <div className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-white/50 dark:border-white/10 shadow-2xl opacity-0 animate-scale-in`}>
        {/* Glow Background Overlay */}
        <div className={`absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 bg-gradient-to-br transition-all duration-500 opacity-10 rounded-full blur-3xl ${task.priority === 'urgent' ? 'from-red-500' : 'from-primary-500'}`}></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight max-w-2xl">
              {task.title}
            </h2>
            <div className="flex flex-wrap gap-3">
               <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${pConfig.bg} ${pConfig.text} border ${pConfig.border} ${pConfig.shadow} flex items-center`}>
                  <FlagIcon className="w-4 h-4 mr-2" /> {pConfig.label}
               </div>
               <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20 flex items-center`}>
                  <ClockIcon className="w-4 h-4 mr-2" /> Statut: {getStatusLabel(task.status)}
               </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50/50 dark:bg-gray-900/40 rounded-3xl border border-gray-100 dark:border-white/5 mb-10">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
              {task.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Assigné à</span>
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700/50 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-600">
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-black text-sm">
                  {task.assignedTo?.firstName?.[0]}{task.assignedTo?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white leading-none mb-1">
                    {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Stagiaire</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Créé par</span>
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700/50 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-600">
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-black text-sm">
                  {task.assignedBy?.firstName?.[0]}{task.assignedBy?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white leading-none mb-1">
                    {task.assignedBy?.firstName} {task.assignedBy?.lastName}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Responsable</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Date d'échéance</span>
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700/50 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-600">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white leading-none mb-1">
                    {format(new Date(task.dueDate), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Deadline</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Progression</span>
              <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700/50 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-600">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-xs">
                  {task.progress || 0}%
                </div>
                <div className="flex-1">
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-900/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full"
                      style={{ width: `${task.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Update Actions */}
          {(isAdmin || isSupervisor || task.assignedTo?._id === user?.id) && task.status !== 'completed' && (
            <div className="p-6 bg-primary-500/5 dark:bg-primary-500/5 border border-primary-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">Mettre à jour l'avancement</h3>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Indiquez l'état actuel de votre mission pour le suivi de l'équipe.</p>
              </div>
              <div className="flex space-x-3 mt-4 md:mt-0">
                <button
                  onClick={() => handleStatusChange('pending')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${task.status === 'pending' ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/30' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}
                >
                  En attente
                </button>
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${task.status === 'in_progress' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}
                >
                  En cours
                </button>
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-green-500/30 transition-all flex items-center"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-2" /> Terminée
                </button>
              </div>
            </div>
          )}
          
          {task.status === 'completed' && (
            <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-3xl flex items-center space-x-4">
               <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600">
                  <CheckCircleIcon className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-lg font-black text-green-700 dark:text-green-400">Mission Terminée avec Succès</h3>
                  <p className="text-xs font-medium text-green-600/70">Cette tâche a été validée le {format(new Date(task.updatedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}.</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section Upgrade */}
      <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-white/10 shadow-2xl p-8 md:p-12">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600">
               <ChatBubbleLeftIcon className="w-6 h-6" />
            </div>
            <div>
               <h3 className="text-2xl font-black text-gray-900 dark:text-white">Discussion</h3>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{task.comments?.length || 0} Commentaires échangés</p>
            </div>
          </div>
        </div>

        {/* Add Comment Portal Style */}
        <form onSubmit={handleAddComment} className="mb-12 relative">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Écrire une mise à jour ou poser une question..."
            className="w-full bg-white/80 dark:bg-gray-900/60 border border-gray-100 dark:border-white/5 rounded-3xl p-6 text-gray-700 dark:text-gray-200 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium min-h-[120px]"
          />
          <button
            type="submit"
            disabled={!comment.trim()}
            className="absolute bottom-4 right-4 px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
          >
            Envoyer
          </button>
        </form>

        {/* Comments Feed Layout */}
        <div className="space-y-6">
          {task.comments?.length === 0 ? (
            <div className="text-center py-10 opacity-30 font-black uppercase tracking-[0.3em] text-xs">Aucun message pour le moment</div>
          ) : (
            task.comments.map((c, idx) => (
              <div key={idx} className={`flex ${c.user?._id === user?.id ? 'flex-row-reverse' : 'flex-row'} items-start gap-4 animate-fade-in-up`} style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center text-xs font-black uppercase text-white ${c.user?._id === user?.id ? 'bg-primary-500' : 'bg-gray-400'}`}>
                  {c.user?.firstName?.[0]}{c.user?.lastName?.[0]}
                </div>
                <div className={`flex-1 max-w-[80%]`}>
                  <div className={`p-5 rounded-3xl ${c.user?._id === user?.id ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 rounded-tl-none'} shadow-sm`}>
                    <div className="flex justify-between items-center mb-2">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${c.user?._id === user?.id ? 'text-primary-200' : 'text-gray-400'}`}>
                          {c.user?.firstName} {c.user?.lastName}
                       </span>
                       <span className={`text-[8px] font-bold ${c.user?._id === user?.id ? 'text-primary-300' : 'text-gray-400'}`}>
                          {format(new Date(c.createdAt), 'dd MMM, HH:mm', { locale: fr })}
                       </span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed">{c.text}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const getStatusLabel = (status) => {
  const labels = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminée',
    overdue: 'En retard',
    cancelled: 'Annulée'
  };
  return labels[status] || status;
};

export default TaskDetail;
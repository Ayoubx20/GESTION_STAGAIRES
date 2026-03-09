import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/tasks';
import { internService } from '../services/interns';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TaskForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isSupervisor } = useAuth();
  const [loading, setLoading] = useState(false);
  const [interns, setInterns] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
    category: 'assignment',
    status: 'pending',
    progress: 0
  });

  useEffect(() => {
    fetchInterns();
    if (id) {
      fetchTask();
    }
  }, [id]);

  const fetchInterns = async () => {
    try {
      const data = await internService.getAll();
      setInterns(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des stagiaires');
    }
  };

  const fetchTask = async () => {
    try {
      setLoading(true);
      const data = await taskService.getById(id);
      setFormData({
        title: data.title || '',
        description: data.description || '',
        assignedTo: data.assignedTo?._id || '',
        dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
        priority: data.priority || 'medium',
        category: data.category || 'assignment',
        status: data.status || 'pending',
        progress: data.progress || 0
      });
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const finalValue = (type === 'number' || type === 'range') ? parseInt(value) : value;
    setFormData({ ...formData, [name]: finalValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await taskService.update(id, formData);
        toast.success('Mise à jour réussie !');
      } else {
        await taskService.create(formData);
        toast.success('Tâche créée avec succès !');
      }
      navigate('/tasks');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin && !isSupervisor) {
    return <div className="p-20 text-center font-black opacity-30 uppercase tracking-[0.4em]">Accès Réservé à l'Administration</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center space-x-6 p-8 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-white/10 shadow-xl animate-fade-in-up">
        <button
          onClick={() => navigate('/tasks')}
          className="group flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-700/50 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-200 transition-all duration-300"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-all" />
        </button>
        <div>
          <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.3em] mb-1 block">
             Mission Designer • {id ? 'Modification' : 'Création'}
          </span>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {id ? 'Modifier la mission' : 'Nouvelle mission'}
          </h1>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/40 dark:border-white/10 p-8 md:p-12 animate-scale-in">
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Main Info */}
          <div className="space-y-6">
            <div className="form-group">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.2em]">Titre de la tâche</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Ex: Refonte du module Auth..."
                className="w-full bg-gray-50 dark:bg-gray-900/40 border-none rounded-2xl p-4 text-lg font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 transition-all"
              />
            </div>

            <div className="form-group">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.2em]">Description détaillée</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="5"
                placeholder="Décrivez les objectifs et les résultats attendus..."
                className="w-full bg-gray-50 dark:bg-gray-900/40 border-none rounded-2xl p-4 text-gray-700 dark:text-gray-300 font-medium focus:ring-4 focus:ring-primary-500/10 transition-all resize-none"
              />
            </div>
          </div>

          {/* Assignments & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="form-group">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.2em]">Attribuer à</label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 dark:bg-gray-900/40 border-none rounded-2xl p-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 transition-all"
              >
                <option value="">Sélectionner un collaborateur</option>
                {interns.map((intern) => (
                  <option key={intern._id} value={intern.user?._id}>
                    {intern.user?.firstName || 'Utilisateur'} {intern.user?.lastName || ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.2em]">Date d'échéance (Deadline)</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                required
                className="w-full bg-gray-50 dark:bg-gray-900/40 border-none rounded-2xl p-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 transition-all"
              />
            </div>
          </div>

          {/* Priority & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="form-group">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.2em]">Niveau de Priorité</label>
              <div className="grid grid-cols-2 gap-3">
                {['low', 'medium', 'high', 'urgent'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({...formData, priority: p})}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                      formData.priority === p 
                        ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/20' 
                        : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 hover:border-primary-200'
                    }`}
                  >
                    {p === 'low' ? 'Basse' : p === 'medium' ? 'Moyenne' : p === 'high' ? 'Haute' : 'Urgente'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.2em]">Catégorie de mission</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-gray-50 dark:bg-gray-900/40 border-none rounded-2xl p-4 font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 transition-all"
              >
                <option value="assignment">Devoir Hebdomadaire</option>
                <option value="project">Projet Spécial</option>
                <option value="report">Rapport / Synthèse</option>
                <option value="presentation">Présentation / Démo</option>
                <option value="other">Autre Mission</option>
              </select>
            </div>
          </div>

          {/* Progress Slider - New Upgrade */}
          <div className="p-8 bg-primary-500/5 rounded-3xl border border-primary-500/10">
            <div className="flex justify-between items-center mb-6">
               <label className="text-sm font-black text-gray-700 dark:text-white uppercase tracking-widest">Avancement de la mission</label>
               <span className="text-2xl font-black text-primary-600">{formData.progress}%</span>
            </div>
            <input 
              type="range" 
              name="progress"
              min="0" 
              max="100" 
              value={formData.progress}
              onChange={handleChange}
              className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-primary-600"
            />
            <div className="flex justify-between mt-3">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pas commencé</span>
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Terminé</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end items-center space-x-6 pt-6 border-t border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="text-sm font-black text-gray-400 hover:text-gray-600 dark:hover:text-white uppercase tracking-widest transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-12 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Traitement...' : (id ? 'Sauvegarder les modifications' : 'Lancer la mission')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;
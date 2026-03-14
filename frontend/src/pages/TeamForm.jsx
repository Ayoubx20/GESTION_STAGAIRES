import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teamService } from '../services/teams';
import { internService } from '../services/interns';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TeamForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isSupervisor } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [availableInterns, setAvailableInterns] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    interns: []
  });

  useEffect(() => {
    if (!isAdmin && !isSupervisor) {
      navigate('/dashboard');
      return;
    }
    
    fetchData();
  }, [id, isAdmin, isSupervisor, navigate]);

  const fetchData = async () => {
    try {
      setFetching(true);
      
      // Load all available interns 
      const res = await internService.getAll({ limit: 1000 });
      const internsList = Array.isArray(res) ? res : res.interns || [];
      setAvailableInterns(internsList);

      if (id) {
        const teamData = await teamService.getById(id);
        const mappedInternIds = teamData.interns.map(i => i._id || i);
        
        setFormData({
          name: teamData.name || '',
          description: teamData.description || '',
          interns: mappedInternIds
        });
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleInternToggle = (internId) => {
    setFormData(prev => {
      const isSelected = prev.interns.includes(internId);
      if (isSelected) {
        return { ...prev, interns: prev.interns.filter(id => id !== internId) };
      } else {
        return { ...prev, interns: [...prev.interns, internId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await teamService.update(id, formData);
        toast.success('Équipe mise à jour avec succès');
      } else {
        await teamService.create(formData);
        toast.success('Équipe créée avec succès');
      }
      navigate('/teams');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/teams')}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {id ? 'Modifier l\'équipe' : 'Nouvelle équipe'}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom de l'équipe *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Ex: Équipe Développement Web"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Décrivez les objectifs ou le rôle de cette équipe..."
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Stagiaires ({formData.interns.length} sélectionnés)
            </label>
            <p className="text-xs text-gray-500 mb-4">Sélectionnez les stagiaires qui font partie de cette équipe</p>
            
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2 bg-gray-50 dark:bg-gray-900/50">
              {availableInterns.length === 0 ? (
                <p className="text-sm text-center text-gray-500 py-4">Aucun stagiaire disponible dans la base</p>
              ) : (
                availableInterns.map((intern) => (
                  <label 
                    key={intern._id}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-all border ${
                      formData.interns.includes(intern._id) 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' 
                        : 'border-transparent hover:bg-white dark:hover:bg-gray-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.interns.includes(intern._id)}
                      onChange={() => handleInternToggle(intern._id)}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div className="ml-3 flex-1 flex justify-between items-center">
                      <div>
                        <span className="block text-sm font-medium text-gray-900 dark:text-white">
                          {intern.user?.firstName} {intern.user?.lastName}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {intern.user?.email}
                        </span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        {intern.major || 'N/A'}
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/teams')}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Enregistrement...' : (id ? 'Mettre à jour' : 'Créer l\'équipe')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamForm;

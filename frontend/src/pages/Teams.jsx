import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teamService } from '../services/teams';
import {
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

const Teams = () => {
  const { isIntern, isAdmin, isSupervisor } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isIntern) {
      navigate('/dashboard');
      return;
    }
    fetchTeams();
  }, [isIntern, navigate]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await teamService.getAll();
      setTeams(data);
    } catch (error) {
      toast.error('Erreur lors du chargement des équipes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette équipe ?')) return;

    try {
      await teamService.delete(id);
      toast.success('Équipe supprimée');
      fetchTeams();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center opacity-0 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400">
            Équipes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Gérez vos équipes et assignez des stagiaires
          </p>
        </div>
        {(isAdmin || isSupervisor) && (
          <Link to="/teams/new" className="btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            Nouvelle équipe
          </Link>
        )}
      </div>

      {teams.length === 0 ? (
        <EmptyState
          title="Aucune équipe"
          description="Vous n'avez pas encore d'équipe. Créez-en une pour regrouper vos stagiaires."
          action={() => navigate('/teams/new')}
          actionText="Créer une équipe"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div key={team._id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                    <UserGroupIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{team.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{team.interns?.length || 0} stagiaires</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link to={`/teams/${team._id}/edit`} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <PencilIcon className="w-5 h-5" />
                  </Link>
                  <button onClick={() => handleDelete(team._id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                {team.description || "Aucune description fournie"}
              </p>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Membres</p>
                <div className="flex flex-wrap gap-2">
                  {team.interns?.slice(0, 5).map(intern => (
                    <div key={intern._id} className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs text-gray-700 dark:text-gray-300">
                      <UserIcon className="w-3 h-3" />
                      <span>{intern.user?.firstName} {intern.user?.lastName}</span>
                    </div>
                  ))}
                  {team.interns?.length > 5 && (
                    <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-700 w-6 h-6 rounded-full text-xs text-gray-700 dark:text-gray-300">
                      +{team.interns.length - 5}
                    </div>
                  )}
                  {(!team.interns || team.interns.length === 0) && (
                    <span className="text-sm text-gray-500 italic">Aucun stagiaire assigné</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Teams;

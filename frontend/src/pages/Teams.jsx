import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teamService } from '../services/teams';
import {
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  UserIcon,
  ChartPieIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon
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
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await teamService.getAll();
      
      const processedTeams = data.map(team => {
        if (!team.interns) return team;
        const seen = new Set();
        const uniqueInterns = team.interns.filter(intern => {
          // Deduplicate by user email to 100% prevent same user showing up multiple times
          const id = intern.user?.email || intern.user?._id || intern.user || intern._id || intern;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        return { ...team, interns: uniqueInterns };
      });

      setTeams(processedTeams);
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
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <UserGroupIcon className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{team.name}</h3>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">{team.interns?.length || 0} membres actifs</p>
                    {team.project && (
                      <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold leading-4 bg-primary-100 text-primary-800 dark:bg-primary-900/60 dark:text-primary-300 w-max border border-primary-200 dark:border-primary-800">
                        Travail à faire : {team.project}
                      </span>
                    )}
                  </div>
                </div>
                
                {(isAdmin || isSupervisor) && (
                  <div className="flex space-x-2">
                    <Link to={`/teams/${team._id}/edit`} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <PencilIcon className="w-5 h-5" />
                    </Link>
                    <button onClick={() => handleDelete(team._id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 mt-2 line-clamp-2 font-medium">
                {team.description || "Aucune description fournie"}
              </p>

              {/* Advanced Team Statistics */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Performances</span>
                  <span className="text-sm font-black text-primary-600">
                    {team.totalTasks > 0 ? Math.round((team.completedTasks / team.totalTasks) * 100) : 0}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-indigo-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${team.totalTasks > 0 ? Math.round((team.completedTasks / team.totalTasks) * 100) : 0}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                   <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <ChartPieIcon className="w-4 h-4 text-gray-400 mb-1" />
                     <span className="text-lg font-black text-gray-900 dark:text-white">{team.totalTasks || 0}</span>
                     <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Total</span>
                   </div>
                   <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <ClipboardDocumentCheckIcon className="w-4 h-4 text-green-500 mb-1" />
                     <span className="text-lg font-black text-green-600 dark:text-green-400">{team.completedTasks || 0}</span>
                     <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Terminées</span>
                   </div>
                   <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <ClockIcon className="w-4 h-4 text-yellow-500 mb-1" />
                     <span className="text-lg font-black text-yellow-600 dark:text-yellow-400">{team.pendingValidationTasks || 0}</span>
                     <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold text-center">À Valider</span>
                   </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Membres de l'équipe</p>
                <div className="flex flex-wrap gap-2">
                  {team.interns?.slice(0, 5).map(intern => (
                    <div key={intern._id} className="flex items-center space-x-1.5 bg-white dark:bg-gray-900 px-3 py-1.5 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm hover:-translate-y-0.5 transition-transform cursor-default">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-[8px] text-gray-600 dark:text-gray-400">
                        {intern.user?.firstName?.[0]}{intern.user?.lastName?.[0]}
                      </div>
                      <span>{intern.user?.firstName} {intern.user?.lastName}</span>
                    </div>
                  ))}
                  {team.interns?.length > 5 && (
                    <div className="flex items-center justify-center bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 px-3 py-1.5 rounded-full text-xs font-bold text-primary-700 dark:text-primary-400">
                      +{team.interns.length - 5}
                    </div>
                  )}
                  {(!team.interns || team.interns.length === 0) && (
                    <span className="text-sm text-gray-400 italic">L'équipe n'a pas encore de membres</span>
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

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { evaluationService } from '../services/evaluations';
import { internService } from '../services/interns';
import {
  StarIcon,
  ChatBubbleBottomCenterTextIcon,
  FlagIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  PlusIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Evaluations = () => {
  const { id: internId } = useParams();
  const { isAdmin, isSupervisor, user } = useAuth();
  const [intern, setIntern] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [newEval, setNewEval] = useState({
    ratings: [
      { category: 'Compétences Techniques', score: 0 },
      { category: 'Communication', score: 0 },
      { category: 'Autonomie', score: 0 },
      { category: 'Esprit d\'équipe', score: 0 },
      { category: 'Assiduité & Ponctualité', score: 0 },
      { category: 'Esprit d\'initiative', score: 0 },
      { category: 'Discipline', score: 0 },
      { category: 'Résolution de problèmes', score: 0 }
    ],
    feedback: { strengths: '', areasForImprovement: '', generalComments: '' },
    nextPeriodGoals: [{ title: '', description: '' }]
  });

  useEffect(() => {
    fetchData();
  }, [internId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [internData, evalData] = await Promise.all([
        internService.getById(internId),
        evaluationService.getInternEvaluations(internId)
      ]);
      setIntern(internData);
      setEvaluations(evalData.evaluations || []);
    } catch (err) {
      setError("Erreur lors du chargement des données d'évaluation");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (index, score) => {
    const updatedRatings = [...newEval.ratings];
    updatedRatings[index].score = score;
    setNewEval({ ...newEval, ratings: updatedRatings });
  };

  const calculateTotal = (ratings) => {
    return ratings.reduce((sum, r) => sum + (r.score || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newEval.ratings.some(r => r.score === 0)) {
      return toast.error("Veuillez évaluer toutes les catégories.");
    }

    try {
      setLoading(true);
      await evaluationService.create({
        intern: internId,
        ...newEval,
        status: 'submitted'
      });
      toast.success("Évaluation soumise avec succès !");
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error("Erreur lors de la soumission de l'évaluation");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !intern) return <LoadingSpinner fullScreen />;
  if (error) return <ErrorMessage message={error} retry={fetchData} />;

  return (
    <div className="space-y-8 pb-12 overflow-hidden">
      {/* Header - Premium Navigation Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-white/10 shadow-xl shadow-gray-200/20 dark:shadow-none opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center space-x-6">
          <Link 
            to="/interns" 
            className="group flex items-center justify-center w-12 h-12 bg-white dark:bg-gray-700 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:border-primary-200 transition-all duration-300"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:-translate-x-1 transition-all" />
          </Link>
          <div>
            <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.3em] mb-1 block">
              Performance Monitor
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-300">
                  {intern?.user?.firstName} {intern?.user?.lastName}
               </span>
            </h1>
            <div className="flex flex-wrap items-center mt-3 gap-4 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              <span className="flex items-center px-3 py-1.5 bg-gray-100/50 dark:bg-gray-700/50 rounded-full">
                <BuildingOfficeIcon className="w-3.5 h-3.5 mr-2 text-primary-500"/> 
                {intern?.department?.name || 'Département non spécifié'}
              </span>
              <span className="flex items-center px-3 py-1.5 bg-gray-100/50 dark:bg-gray-700/50 rounded-full">
                <AcademicCapIcon className="w-3.5 h-3.5 mr-2 text-indigo-500"/> 
                {intern?.school || 'Établissement non spécifié'}
              </span>
            </div>
          </div>
        </div>
        
        {(isAdmin || isSupervisor) && !showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="mt-6 md:mt-0 px-8 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1 active:scale-95 transition-all flex items-center group"
          >
            <PlusIcon className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-300" />
            Nouvelle Évaluation
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Evaluation Form - Fixed in a card with glassmorphism */}
        {showForm && (
          <div className="card border-primary-500/20 shadow-2xl shadow-primary-500/10 opacity-0 animate-scale-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold flex items-center text-gray-900 dark:text-white">
                <StarIcon className="w-6 h-6 mr-3 text-yellow-500" />
                Fiche d'Évaluation Hebdomadaire
              </h2>
              <div className="px-6 py-2 bg-primary-500/10 rounded-2xl border border-primary-500/20 backdrop-blur-md">
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mr-2 tracking-widest leading-none">Total:</span>
                <span className="text-2xl font-black text-primary-600">{calculateTotal(newEval.ratings)}/40</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Ratings Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {newEval.ratings.map((rating, idx) => (
                  <div key={idx} className="p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:border-primary-500/30 transition-colors">
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-[0.2em]">
                      {rating.category}
                    </label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleRatingChange(idx, s)}
                          className="transform transition-all hover:scale-125 focus:outline-none"
                        >
                          {s <= rating.score ? (
                            <StarIconSolid className="w-7 h-7 text-yellow-500 drop-shadow-glow" />
                          ) : (
                            <StarIcon className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback Section */}
              <div className="space-y-6">
                <div className="form-group">
                  <label className="input-label flex items-center font-bold">
                    <ChatBubbleBottomCenterTextIcon className="w-5 h-5 mr-2 text-primary-500" />
                    Commentaires Généraux & Recommandations
                  </label>
                  <textarea
                    rows="4"
                    className="input-field resize-none bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                    placeholder="Décrivez les forces et les points d'amélioration..."
                    onChange={(e) => setNewEval({
                      ...newEval,
                      feedback: { ...newEval.feedback, generalComments: e.target.value }
                    })}
                  />
                </div>

                <div className="form-group">
                  <label className="input-label flex items-center font-bold">
                    <FlagIcon className="w-5 h-5 mr-2 text-indigo-500" />
                    Objectifs pour la période suivante
                  </label>
                  <input
                    type="text"
                    className="input-field bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                    placeholder="Ex: Maîtriser le déploiement sur AWS..."
                    onChange={(e) => setNewEval({
                      ...newEval,
                      nextPeriodGoals: [{ title: e.target.value, description: '' }]
                    })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary px-6 rounded-xl"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary px-8 py-3 rounded-xl shadow-lg shadow-primary-500/20">
                  Soumettre l'Évaluation
                </button>
              </div>
            </form>
          </div>
        )}

        {/* History Section Wrapper */}
        <div className="space-y-6">
          <div className="flex items-center space-x-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Historique des Évaluations</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-gray-200 dark:from-gray-700 to-transparent"></div>
          </div>
      
      {evaluations.length === 0 && !showForm ? (
        <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <StarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">Aucune évaluation enregistrée pour le moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {evaluations.map((evalItem, idx) => (
            <div 
              key={evalItem._id}
              className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
                 <div>
                    <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full uppercase tracking-tighter">
                       Semaine {evalItem.period?.week || idx + 1}
                    </span>
                    <h4 className="text-gray-500 text-[10px] mt-2 flex items-center italic">
                       Evalué par {evalItem.supervisor?.firstName} le {format(new Date(evalItem.createdAt), 'dd MMMM yyyy', { locale: fr })}
                    </h4>
                 </div>
                 
                 <div className="flex items-center space-x-6">
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                      {evalItem.ratings.map((r, i) => (
                        <div key={i} className="group/star relative">
                          <StarIconSolid className={`w-4 h-4 ${r.score >= 4 ? 'text-green-500' : r.score >= 3 ? 'text-yellow-500' : 'text-red-500'}`} />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-[8px] text-white rounded opacity-0 group-hover/star:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {r.category}: {r.score}/5
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="h-10 w-[1px] bg-gray-100 dark:bg-gray-700 mx-2"></div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Note Globale</p>
                       <p className="text-2xl font-black text-primary-600">{calculateTotal(evalItem.ratings)}<span className="text-sm text-gray-400">/40</span></p>
                    </div>
                 </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl">
                 <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                    "{evalItem.feedback?.generalComments}"
                 </p>
              </div>

              {evalItem.nextPeriodGoals?.length > 0 && evalItem.nextPeriodGoals[0].title && (
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50 flex items-center">
                  <FlagIcon className="w-4 h-4 text-indigo-500 mr-2" />
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest">
                    Objectif Prochaine Semaine : {evalItem.nextPeriodGoals[0].title}
                  </p>
                </div>
              )}
            </div>
          ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Evaluations;

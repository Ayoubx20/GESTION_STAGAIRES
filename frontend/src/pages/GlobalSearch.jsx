import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  UserCircleIcon, 
  ClipboardDocumentListIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';

const GlobalSearch = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState({ interns: [], tasks: [] });

  useEffect(() => {
    if (query) {
      performSearch();
    } else {
      setLoading(false);
    }
  }, [query]);

  const performSearch = async () => {
    try {
      setLoading(true);
      // We can search interns and tasks in parallel
      const [internsRes, tasksRes] = await Promise.all([
        api.get(`/interns?search=${encodeURIComponent(query)}&limit=5`),
        api.get(`/tasks?search=${encodeURIComponent(query)}&limit=5`)
      ]);

      setResults({
        interns: internsRes.interns || [],
        tasks: tasksRes.tasks || []
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const hasNoResults = results.interns.length === 0 && results.tasks.length === 0;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center space-x-4 mb-8">
        <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-2xl">
          <MagnifyingGlassIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            Résultats de recherche
          </h1>
          <div className="flex items-center space-x-3">
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              "{query}" • {results.interns.length + results.tasks.length} résultats trouvés
            </p>
            <button 
              onClick={performSearch}
              className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/40 text-gray-500 hover:text-primary-600 rounded-lg transition-all"
              title="Rafraîchir les résultats"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {hasNoResults ? (
        <div className="text-center py-20 bg-white/50 dark:bg-gray-800/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
          <ExclamationCircleIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Aucun résultat trouvé</h3>
          <p className="text-gray-500 mt-2">Essayez avec d'autres mots-clés ou vérifiez l'orthographe.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Interns Results */}
          <section className="space-y-4">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] pl-4">Stagiaires ({results.interns.length})</h2>
            <div className="space-y-3">
              {results.interns.map((intern) => (
                <Link
                  key={intern._id}
                  to={`/interns/${intern._id}`}
                  className="flex items-center p-4 bg-white/70 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/10 shadow-sm hover:shadow-md hover:border-primary-500/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg mr-4">
                    {intern.user?.firstName?.charAt(0)}{intern.user?.lastName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                      {intern.user?.firstName} {intern.user?.lastName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                      {intern.major || 'Département non spécifié'} • {intern.school}
                    </p>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                </Link>
              ))}
              {results.interns.length === 0 && (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/20 rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-400 text-sm italic">
                  Aucun stagiaire trouvé
                </div>
              )}
            </div>
          </section>

          {/* Tasks Results */}
          <section className="space-y-4">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] pl-4">Tâches ({results.tasks.length})</h2>
            <div className="space-y-3">
              {results.tasks.map((task) => (
                <Link
                  key={task._id}
                  to={`/tasks/${task._id}`}
                  className="flex items-center p-4 bg-white/70 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/50 dark:border-white/10 shadow-sm hover:shadow-md hover:border-primary-500/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg mr-4">
                    <ClipboardDocumentListIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                      Statut: {task.status} • Assigné à: {task.assignedTo?.firstName}
                    </p>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
                </Link>
              ))}
              {results.tasks.length === 0 && (
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/20 rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-400 text-sm italic">
                  Aucune tâche trouvée
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;

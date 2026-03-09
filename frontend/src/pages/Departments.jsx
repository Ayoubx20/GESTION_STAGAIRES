import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { departmentService } from '../services/departments';
import {
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UsersIcon,
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

const Departments = () => {
  const { isAdmin, isSupervisor, isIntern } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Rediriger les stagiaires
    if (isIntern) {
      toast.error('Accès non autorisé');
      // navigate('/dashboard');
      return;
    }
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await departmentService.getAll();
      setDepartments(Array.isArray(data) ? data : data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Impossible de charger la liste des départements');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) {
      toast.error('Seul un administrateur peut supprimer un département');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce département ?')) {
      return;
    }

    try {
      await departmentService.delete(id);
      toast.success('Département supprimé avec succès');
      fetchDepartments();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Si c'est un stagiaire, afficher accès refusé
  if (isIntern) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-center">
          <BuildingOfficeIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">
            Accès non autorisé
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Vous n'avez pas les permissions nécessaires pour voir cette page.
          </p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block btn-primary"
          >
            Retour au Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} retry={fetchDepartments} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400">
            Gestion des Départements
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            {isAdmin ? 'Gérez tous les départements' : 'Consultez les départements'}
          </p>
        </div>
        
        {/* Bouton d'ajout - Admin seulement */}
        {isAdmin && (
          <Link to="/departments/new" className="btn-primary">
            <PlusIcon className="w-5 h-5 mr-2" />
            Nouveau département
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/50 dark:border-white/10 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un département..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Departments Grid */}
      {filteredDepartments.length === 0 ? (
        <EmptyState
          title="Aucun département"
          description={isAdmin ? 
            "Commencez par créer votre premier département." : 
            "Aucun département n'est actuellement enregistré."}
          action={isAdmin ? () => window.location.href = '/departments/new' : null}
          actionText="Créer un département"
          icon={BuildingOfficeIcon}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDepartments.map((dept, index) => (
            <div
              key={dept._id}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/50 dark:border-white/10 p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 opacity-0 animate-fade-in-up"
              style={{ animationDelay: `${0.3 + index * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                    <BuildingOfficeIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {dept.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Code: {dept.code}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {dept.description || 'Aucune description'}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <UsersIcon className="w-4 h-4 mr-2" />
                  Stagiaires: {dept.currentInterns || 0}/{dept.maxInterns}
                </div>
                {dept.contactEmail && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <EnvelopeIcon className="w-4 h-4 mr-2" />
                    {dept.contactEmail}
                  </div>
                )}
              </div>

              {/* Actions - selon le rôle */}
              <div className="flex space-x-2">
                <Link
                  to={`/departments/${dept._id}`}
                  className="flex-1 btn-secondary text-center py-2"
                >
                  <EyeIcon className="w-4 h-4 mr-2 inline" />
                  Détails
                </Link>
                
                {/* Admin seulement peut modifier/supprimer */}
                {isAdmin && (
                  <>
                    <Link
                      to={`/departments/${dept._id}/edit`}
                      className="flex-1 btn-secondary py-2"
                    >
                      <PencilIcon className="w-4 h-4 mr-2 inline" />
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDelete(dept._id)}
                      className="flex-1 btn-danger py-2"
                    >
                      <TrashIcon className="w-4 h-4 mr-2 inline" />
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Departments;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { internService } from '../services/interns';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  AcademicCapIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const InternDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isSupervisor, isIntern } = useAuth();
  const [intern, setIntern] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Rediriger les stagiaires
    if (isIntern) {
      toast.error('Accès non autorisé');
      navigate('/dashboard');
      return;
    }
    fetchIntern();
  }, [id]);

  const fetchIntern = async () => {
    try {
      const data = await internService.getById(id);
      setIntern(data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      toast.error('Seul un administrateur peut supprimer un stagiaire');
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce stagiaire ?')) {
      return;
    }

    try {
      await internService.delete(id);
      toast.success('Stagiaire supprimé');
      navigate('/interns');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
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

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!intern) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Stagiaire non trouvé</h2>
        <button
          onClick={() => navigate('/interns')}
          className="mt-4 btn-primary"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/interns')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Détails du stagiaire
          </h1>
        </div>
        
        {/* Boutons d'action selon le rôle */}
        <div className="flex space-x-2">
          {/* Admin peut modifier et supprimer */}
          {isAdmin && (
            <>
              <Link
                to={`/interns/${id}/edit`}
                className="btn-secondary"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Modifier
              </Link>
              <button
                onClick={handleDelete}
                className="btn-danger"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Supprimer
              </button>
            </>
          )}
          
          {/* Superviseur peut seulement modifier */}
          {isSupervisor && !isAdmin && (
            <Link
              to={`/interns/${id}/edit`}
              className="btn-secondary"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Modifier
            </Link>
          )}
        </div>
      </div>

      {/* Informations du stagiaire */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
              {intern.user?.firstName?.charAt(0)}{intern.user?.lastName?.charAt(0)}
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {intern.user?.firstName} {intern.user?.lastName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {intern.studentId}
              </p>
              <div className="mt-2">
                {getStatusBadge(intern.status)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Coordonnées
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <EnvelopeIcon className="w-5 h-5 mr-3 text-gray-400" />
                {intern.user?.email}
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <PhoneIcon className="w-5 h-5 mr-3 text-gray-400" />
                {intern.user?.phone || 'Non renseigné'}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Études
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <AcademicCapIcon className="w-5 h-5 mr-3 text-gray-400" />
                {intern.school}
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <DocumentTextIcon className="w-5 h-5 mr-3 text-gray-400" />
                {intern.major}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Période de stage
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <CalendarIcon className="w-5 h-5 mr-3 text-gray-400" />
                Du {format(new Date(intern.startDate), 'dd MMMM yyyy', { locale: fr })}
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <CalendarIcon className="w-5 h-5 mr-3 text-gray-400" />
                Au {format(new Date(intern.endDate), 'dd MMMM yyyy', { locale: fr })}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Supervision
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <BuildingOfficeIcon className="w-5 h-5 mr-3 text-gray-400" />
                {intern.supervisor?.firstName || 'Non assigné'} {intern.supervisor?.lastName || ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternDetail;
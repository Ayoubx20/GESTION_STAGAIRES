import React from 'react';
import { Link } from 'react-router-dom';
import { ClockIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const RegistrationPending = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
        <div className="text-center">
          {/* Icône */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-6">
            <ClockIcon className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
          </div>
          
          {/* Titre */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Inscription en attente
          </h1>
          
          {/* Message */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Votre demande d'inscription a bien été reçue. 
            Un administrateur va vérifier vos informations et approuver votre compte.
          </p>
          
          {/* Délai d'attente */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⏱️ Délai d'approbation habituel : <strong>24-48h</strong>
            </p>
          </div>
          
          {/* Instructions */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
              <EnvelopeIcon className="w-5 h-5 mr-2 text-primary-600" />
              Prochaines étapes :
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>Vous recevrez un email de confirmation</li>
              <li>Une fois approuvé, vous pourrez vous connecter</li>
              <li>Accédez à votre tableau de bord pour voir vos tâches</li>
            </ol>
          </div>
          
          {/* Bouton retour */}
          <Link
            to="/login"
            className="btn-primary inline-block w-full"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPending;
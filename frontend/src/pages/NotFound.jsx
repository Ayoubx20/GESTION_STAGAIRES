import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-8">
          <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">404</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Page non trouvée
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/dashboard"
          className="btn-primary inline-flex items-center"
        >
          <HomeIcon className="w-5 h-5 mr-2" />
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
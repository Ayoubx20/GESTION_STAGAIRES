import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const ErrorMessage = ({ message, retry }) => {
  return (
    <div className="text-center py-12">
      <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        Une erreur est survenue
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {message || "Impossible de charger les données. Veuillez réessayer."}
      </p>
      {retry && (
        <button
          onClick={retry}
          className="mt-4 btn-primary"
        >
          Réessayer
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
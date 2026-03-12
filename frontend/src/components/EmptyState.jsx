import React from 'react';
import { DocumentPlusIcon } from '@heroicons/react/24/outline';

const EmptyState = ({ 
  title = "Aucune donnée", 
  description = "Commencez par ajouter un élément.", 
  action,
  actionText = "Ajouter",
  icon: Icon = DocumentPlusIcon
}) => {
  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {description}
      </p>
      {action && (
        <button
          onClick={action}
          className="mt-4 btn-primary"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
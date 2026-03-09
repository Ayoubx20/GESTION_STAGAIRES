import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { departmentService } from '../services/departments';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const DepartmentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    manager: '',
    maxInterns: 10,
    location: {
      building: '',
      floor: '',
      office: ''
    },
    contactEmail: '',
    contactPhone: '',
    budget: {
      allocated: 0,
      spent: 0,
      currency: 'MAD'
    }
  });

  useEffect(() => {
    if (id) {
      fetchDepartment();
    }
  }, [id]);

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      const data = await departmentService.getById(id);
      setFormData({
        name: data.name || '',
        code: data.code || '',
        description: data.description || '',
        manager: data.manager?._id || '',
        maxInterns: data.maxInterns || 10,
        location: data.location || { building: '', floor: '', office: '' },
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        budget: data.budget || { allocated: 0, spent: 0, currency: 'MAD' }
      });
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      toast.error('Vous n\'avez pas les droits pour cette action');
      return;
    }

    setLoading(true);
    try {
      if (id) {
        await departmentService.update(id, formData);
        toast.success('Département modifié avec succès');
      } else {
        await departmentService.create(formData);
        toast.success('Département créé avec succès');
      }
      navigate('/departments');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Accès non autorisé</h2>
        <p className="mt-2 text-gray-600">Seuls les administrateurs peuvent gérer les départements.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/departments')}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {id ? 'Modifier le département' : 'Nouveau département'}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Capacité maximale
              </label>
              <input
                type="number"
                name="maxInterns"
                value={formData.maxInterns}
                onChange={handleChange}
                min="1"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email de contact
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Téléphone
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
              Localisation
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Bâtiment
                </label>
                <input
                  type="text"
                  name="location.building"
                  value={formData.location.building}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Étage
                </label>
                <input
                  type="text"
                  name="location.floor"
                  value={formData.location.floor}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Bureau
                </label>
                <input
                  type="text"
                  name="location.office"
                  value={formData.location.office}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">
              Budget
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Alloué
                </label>
                <input
                  type="number"
                  name="budget.allocated"
                  value={formData.budget.allocated}
                  onChange={handleChange}
                  min="0"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Dépensé
                </label>
                <input
                  type="number"
                  name="budget.spent"
                  value={formData.budget.spent}
                  onChange={handleChange}
                  min="0"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Devise
                </label>
                <select
                  name="budget.currency"
                  value={formData.budget.currency}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="MAD">MAD</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/departments')}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Enregistrement...' : (id ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentForm;
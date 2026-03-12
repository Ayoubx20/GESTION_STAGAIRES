import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  UserPlusIcon,
  UserCircleIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XCircleIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';
import PremiumToggle from '../components/PremiumToggle';

const Users = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'supervisor',
    phone: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Impossible de charger la liste des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettings = async (user) => {
    setSelectedUser(user);
    try {
      const response = await api.get(`/users/${user._id}/settings`);
      setUserSettings(response.settings);
      setShowSettingsModal(true);
    } catch (error) {
      toast.error('Erreur lors du chargement des paramètres');
    }
  };

  const handleSaveUserSettings = async () => {
    try {
      await api.put(`/users/${selectedUser._id}/settings`, userSettings);
      toast.success('Paramètres utilisateur mis à jour');
      setShowSettingsModal(false);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser._id}`, formData);
        toast.success('Utilisateur modifié avec succès');
      } else {
        await api.post('/users', formData);
        toast.success('Superviseur créé avec succès');
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'supervisor',
        phone: ''
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '',
      role: user.role || 'supervisor',
      phone: user.phone || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      toast.success('Utilisateur supprimé');
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/users/${id}/status`, { isActive: !currentStatus });
      toast.success(`Utilisateur ${!currentStatus ? 'activé' : 'désactivé'}`);
      fetchUsers();
    } catch (error) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });


  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { class: 'badge-danger', label: 'Admin' },
      supervisor: { class: 'badge-info', label: 'Superviseur' },
      intern: { class: 'badge-success', label: 'Stagiaire' }
    };
    const config = roleConfig[role] || roleConfig.intern;
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <ShieldCheckIcon className="mx-auto h-16 w-16 text-red-500" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Accès non autorisé</h2>
        <p className="mt-2 text-gray-600">Seuls les administrateurs peuvent gérer les utilisateurs.</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} retry={fetchUsers} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400">
            Gestion des Utilisateurs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Gérez les superviseurs et Stagiaires
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              password: '',
              role: 'supervisor',
              phone: ''
            });
            setShowModal(true);
          }}
          className="btn-primary"
        >
          <UserPlusIcon className="w-5 h-5 mr-2" />
          Nouvel utilisateur
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-3xl border border-white/50 dark:border-white/10 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <UserCircleIcon className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 border border-transparent rounded-2xl focus:ring-2 focus:ring-primary-500/50 dark:text-white transition-all shadow-sm font-medium"
          />
        </div>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <EmptyState
          title="Aucun utilisateur"
          description="Commencez par créer votre premier superviseur."
          action={() => setShowModal(true)}
          actionText="Ajouter un superviseur"
          icon={UserCircleIcon}
        />
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/50 dark:border-white/10 overflow-hidden opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Utilisateur</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Contact</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Rôle</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Statut</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">Date d'inscription</th>
                  <th className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <EnvelopeIcon className="w-4 h-4 mr-2" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="badge badge-success flex items-center w-fit">
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          Actif
                        </span>
                      ) : (
                        <span className="badge badge-danger flex items-center w-fit">
                          <XCircleIcon className="w-3 h-3 mr-1" />
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1 hover:bg-gray-100 rounded-lg"
                          title="Modifier"
                        >
                          <PencilIcon className="w-5 h-5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleOpenSettings(user)}
                          className="p-1 hover:bg-gray-100 rounded-lg text-primary-600"
                          title="Paramètres de l'utilisateur"
                        >
                          <Cog6ToothIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user._id, user.isActive)}
                          className={`p-1 hover:bg-gray-100 rounded-lg ${user.isActive ? 'text-yellow-600' : 'text-green-600'
                            }`}
                          title={user.isActive ? 'Désactiver' : 'Activer'}
                        >
                          {user.isActive ? (
                            <XCircleIcon className="w-5 h-5" />
                          ) : (
                            <CheckCircleIcon className="w-5 h-5" />
                          )}
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="p-1 hover:bg-gray-100 rounded-lg text-red-600"
                            title="Supprimer"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for adding/editing user */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up" style={{ animationDelay: '0s' }}>
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20 dark:border-white/10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mot de passe {editingUser ? '(Laissez vide pour ne pas changer)' : '*'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                  minLength={6}
                  placeholder={editingUser ? '••••••••' : ''}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rôle
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-colors"
                >
                  <option value="intern">Stagiaire</option>
                  <option value="supervisor">Superviseur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                  }}
                  className="btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingUser ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Settings Modal */}
      {showSettingsModal && selectedUser && userSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20 dark:border-white/10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Paramètres : {selectedUser.firstName} {selectedUser.lastName}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Langue</label>
                <select
                  value={userSettings.language}
                  onChange={(e) => setUserSettings({ ...userSettings, language: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-neutral-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Notifications Email</span>
                <PremiumToggle
                  checked={userSettings.emailNotifications}
                  onChange={(checked) => setUserSettings({ ...userSettings, emailNotifications: checked })}
                  labelLeft="Off"
                  labelRight="On"
                />
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">Rappels de tâches</span>
                <PremiumToggle
                  checked={userSettings.taskReminders}
                  onChange={(checked) => setUserSettings({ ...userSettings, taskReminders: checked })}
                  labelLeft="Off"
                  labelRight="On"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button type="button" onClick={() => setShowSettingsModal(false)} className="btn-secondary">Annuler</button>
              <button type="button" onClick={handleSaveUserSettings} className="btn-primary">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
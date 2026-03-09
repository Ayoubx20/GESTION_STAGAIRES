import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Cog6ToothIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  BellIcon,
  LockClosedIcon,
  DocumentTextIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';
import toast from 'react-hot-toast';
import api from '../services/api';

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // General settings
    language: 'fr',
    timezone: 'Africa/Casablanca',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    taskReminders: true,
    internUpdates: true,
    reportAlerts: true,
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    
    // Application
    companyName: 'Gestion Stagiaire',
    companyLogo: null,
    primaryColor: '#4f46e5',
    itemsPerPage: 20,
    
    // Email
    smtpServer: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    senderEmail: 'noreply@gestion-stagiaire.com',
    senderName: 'Gestion Stagiaire'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.get('/settings');
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', name: t('general'), icon: Cog6ToothIcon },
    { id: 'appearance', name: t('appearance'), icon: PaintBrushIcon },
    { id: 'notifications', name: t('notifications'), icon: BellIcon },
    { id: 'security', name: t('security'), icon: LockClosedIcon, adminOnly: true },
    { id: 'email', name: t('email'), icon: GlobeAltIcon, adminOnly: true },
    { id: 'backup', name: t('backup'), icon: ArrowPathIcon, adminOnly: true },
  ];

  const filteredTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/settings', settings);
      toast.success('Paramètres enregistrés avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      const defaultSettings = {
        language: 'fr',
        timezone: 'Africa/Casablanca',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        emailNotifications: true,
        pushNotifications: false,
        taskReminders: true,
        internUpdates: true,
        reportAlerts: true,
        twoFactorAuth: false,
        sessionTimeout: 30,
        passwordExpiry: 90,
        companyName: 'Gestion Stagiaire',
        companyLogo: null,
        primaryColor: '#4f46e5',
        itemsPerPage: 20,
        smtpServer: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUsername: '',
        smtpPassword: '',
        senderEmail: 'noreply@gestion-stagiaire.com',
        senderName: 'Gestion Stagiaire'
      };
      
      setLoading(true);
      try {
        await api.put('/settings', defaultSettings);
        setSettings(defaultSettings);
        toast.success('Paramètres réinitialisés');
      } catch (error) {
        toast.error('Erreur lors de la réinitialisation');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBackup = async () => {
    try {
      toast.loading('Génération de la sauvegarde...', { id: 'backup' });
      const response = await api.get('/settings/backup');
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Sauvegarde téléchargée avec succès', { id: 'backup' });
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde', { id: 'backup' });
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.settings) {
          await api.put('/settings', data.settings);
          setSettings(data.settings);
          toast.success('Paramètres restaurés avec succès');
        } else {
          toast.error('Format de fichier invalide');
        }
      } catch (error) {
        toast.error('Fichier corrompu ou invalide');
      }
    };
    reader.readAsText(file);
  };

  const handleTestSmtp = async () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Test de la configuration...',
        success: 'Connexion SMTP réussie !',
        error: 'Échec de la connexion SMTP.',
      }
    );
  };


  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSettingChange('companyLogo', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('settings')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gérez la configuration de votre application
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-1">
              {filteredTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    {t('general')}
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Langue
                        </label>
                        <select
                          value={settings.language}
                          onChange={(e) => {
                            const newLang = e.target.value;
                            handleSettingChange('language', newLang);
                            setLang(newLang);
                          }}
                          className="input-field"
                        >
                          <option value="fr">Français</option>
                          <option value="en">English</option>
                          <option value="ar">العربية</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Fuseau horaire
                        </label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => handleSettingChange('timezone', e.target.value)}
                          className="input-field"
                        >
                          <option value="Africa/Casablanca">Casablanca</option>
                          <option value="Europe/Paris">Paris</option>
                          <option value="UTC">UTC</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Format de date
                        </label>
                        <select
                          value={settings.dateFormat}
                          onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                          className="input-field"
                        >
                          <option value="DD/MM/YYYY">31/12/2024</option>
                          <option value="MM/DD/YYYY">12/31/2024</option>
                          <option value="YYYY-MM-DD">2024-12-31</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Format heure
                        </label>
                        <select
                          value={settings.timeFormat}
                          onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
                          className="input-field"
                        >
                          <option value="24h">24h (14:30)</option>
                          <option value="12h">12h (02:30 PM)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Éléments par page
                      </label>
                      <select
                        value={settings.itemsPerPage}
                        onChange={(e) => handleSettingChange('itemsPerPage', parseInt(e.target.value))}
                        className="input-field w-32"
                      >
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Informations de l'entreprise
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nom de l'entreprise
                      </label>
                      <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => handleSettingChange('companyName', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Logo
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          {settings.companyLogo ? (
                            <img src={settings.companyLogo} alt="Logo" className="max-w-full max-h-full" />
                          ) : (
                            <BuildingOfficeIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <label className="btn-secondary cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                          />
                          Changer le logo
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Thème
                  </h3>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Mode sombre
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Activer le thème sombre pour l'interface
                      </p>
                    </div>
                    <Switch
                      checked={theme === 'dark'}
                      onChange={toggleTheme}
                      className={`${
                        theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Couleur principale
                  </h3>
                  <div className="grid grid-cols-6 gap-3">
                    {['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleSettingChange('primaryColor', color)}
                        className={`w-full aspect-square rounded-lg ${
                          settings.primaryColor === color ? 'ring-2 ring-offset-2 ring-primary-500' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Canaux de notification
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Notifications email
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Recevoir des notifications par email
                        </p>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onChange={(checked) => handleSettingChange('emailNotifications', checked)}
                        className={`${
                          settings.emailNotifications ? 'bg-primary-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                      >
                        <span
                          className={`${
                            settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                      </Switch>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Notifications push
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Recevoir des notifications dans le navigateur
                        </p>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onChange={(checked) => handleSettingChange('pushNotifications', checked)}
                        className={`${
                          settings.pushNotifications ? 'bg-primary-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Types de notifications
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Rappels de tâches
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Être notifié des échéances de tâches
                        </p>
                      </div>
                      <Switch
                        checked={settings.taskReminders}
                        onChange={(checked) => handleSettingChange('taskReminders', checked)}
                        className={`${
                          settings.taskReminders ? 'bg-primary-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full`}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Mises à jour stagiaires
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Nouveaux stagiaires et changements de statut
                        </p>
                      </div>
                      <Switch
                        checked={settings.internUpdates}
                        onChange={(checked) => handleSettingChange('internUpdates', checked)}
                        className={`${
                          settings.internUpdates ? 'bg-primary-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full`}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Alertes rapports
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Notifications pour les rapports générés
                        </p>
                      </div>
                      <Switch
                        checked={settings.reportAlerts}
                        onChange={(checked) => handleSettingChange('reportAlerts', checked)}
                        className={`${
                          settings.reportAlerts ? 'bg-primary-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Authentification
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Authentification à deux facteurs
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Renforcer la sécurité de votre compte
                        </p>
                      </div>
                      <Switch
                        checked={settings.twoFactorAuth}
                        onChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                        className={`${
                          settings.twoFactorAuth ? 'bg-primary-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 items-center rounded-full`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Durée de session (minutes)
                      </label>
                      <input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                        min="5"
                        max="480"
                        className="input-field w-32"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expiration du mot de passe (jours)
                      </label>
                      <input
                        type="number"
                        value={settings.passwordExpiry}
                        onChange={(e) => handleSettingChange('passwordExpiry', parseInt(e.target.value))}
                        min="0"
                        max="365"
                        className="input-field w-32"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        0 = jamais
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Journal de sécurité
                  </h3>
                  <button className="btn-secondary">
                    Télécharger le journal des connexions
                  </button>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Configuration SMTP
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Serveur SMTP
                        </label>
                        <input
                          type="text"
                          value={settings.smtpServer}
                          onChange={(e) => handleSettingChange('smtpServer', e.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Port
                        </label>
                        <input
                          type="number"
                          value={settings.smtpPort}
                          onChange={(e) => handleSettingChange('smtpPort', parseInt(e.target.value))}
                          className="input-field"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nom d'utilisateur
                      </label>
                      <input
                        type="text"
                        value={settings.smtpUsername}
                        onChange={(e) => handleSettingChange('smtpUsername', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Mot de passe
                      </label>
                      <input
                        type="password"
                        value={settings.smtpPassword}
                        onChange={(e) => handleSettingChange('smtpPassword', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email expéditeur
                      </label>
                      <input
                        type="email"
                        value={settings.senderEmail}
                        onChange={(e) => handleSettingChange('senderEmail', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nom expéditeur
                      </label>
                      <input
                        type="text"
                        value={settings.senderName}
                        onChange={(e) => handleSettingChange('senderName', e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <button 
                      type="button"
                      onClick={handleTestSmtp}
                      className="btn-secondary"
                    >
                      Tester la configuration
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Backup Settings */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Sauvegarde des données
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Dernière sauvegarde
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date().toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleBackup}
                        className="btn-primary"
                      >
                        <ArrowPathIcon className="w-4 h-4 mr-2" />
                        Sauvegarder maintenant
                      </button>
                      
                      <label className="btn-secondary cursor-pointer">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleRestore}
                          className="hidden"
                        />
                        Restaurer une sauvegarde
                      </label>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Planification automatique
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fréquence
                      </label>
                      <select className="input-field w-48">
                        <option>Quotidienne</option>
                        <option>Hebdomadaire</option>
                        <option>Mensuelle</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Heure
                      </label>
                      <input
                        type="time"
                        value="02:00"
                        className="input-field w-32"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Actions */}
            <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-6 flex justify-end space-x-3">
              <button
                onClick={handleReset}
                className="btn-secondary"
              >
                Réinitialiser
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
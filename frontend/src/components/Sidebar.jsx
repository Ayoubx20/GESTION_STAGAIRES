import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  UserCircleIcon,
  MoonIcon,
  SunIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { user, logout, isAdmin, isSupervisor, isIntern } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Navigation pour ADMIN et SUPERVISEUR
  const adminSupervisorNavigation = [
    { name: t('dashboard'), to: '/dashboard', icon: HomeIcon },
    { name: t('interns'), to: '/interns', icon: UsersIcon },
    { name: 'Équipes', to: '/teams', icon: UserGroupIcon },
    { name: t('tasks'), to: '/tasks', icon: ClipboardDocumentListIcon },
    { name: 'Rapports', to: '/reports', icon: ChartBarIcon },
  ];

  // Navigation pour STAGIAIRE
  const internNavigation = [
    { name: t('dashboard'), to: '/dashboard', icon: HomeIcon },
    { name: t('tasks'), to: '/tasks', icon: ClipboardDocumentListIcon },
    { name: 'Mes Documents', to: '/my-documents', icon: DocumentTextIcon },
  ];

  // Navigation ADMIN SEULEMENT
  const adminNavigation = isAdmin ? [
    { name: 'Utilisateurs', to: '/users', icon: UserGroupIcon },
    { name: 'Approbations', to: '/approvals', icon: ClockIcon },
  ] : [];

  const bottomNavigation = [
    { name: t('profile'), to: '/profile', icon: UserCircleIcon },
    { name: t('settings'), to: '/settings', icon: Cog6ToothIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Choisir la navigation en fonction du rôle
  const navigation = isIntern ? internNavigation : adminSupervisorNavigation;

  return (
    <div className={`relative ${collapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 flex flex-col h-screen`}>
      {/* Toggle button - Clean pill style on the divider */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[28px] bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 rounded-full p-1.5 shadow-md border border-gray-100 dark:border-gray-600 hover:bg-primary-50 dark:hover:bg-gray-600 transition-all duration-300 transform hover:scale-110 z-30 group"
      >
        {collapsed ? (
          <ChevronRightIcon className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
        ) : (
          <ChevronLeftIcon className="w-4 h-4 group-hover:-rotate-180 transition-transform duration-500" />
        )}
      </button>

      {/* Logo */}
      <div className="h-20 flex items-center justify-center border-b border-gray-100 dark:border-gray-700/50">
        {collapsed ? (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/20 transform hover:rotate-6 transition-transform">
            <span className="text-white font-bold text-xl">GS</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">GS</span>
            </div>
            <h1 className="text-lg font-black bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 bg-clip-text text-transparent tracking-tight">
              GESTION <span className="text-gray-400 dark:text-gray-500 font-medium">STAGIAIRE</span>
            </h1>
          </div>
        )}
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <item.icon className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
            {!collapsed && item.name}
          </NavLink>
        ))}

        {/* Liens admin seulement */}
        {adminNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <item.icon className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
            {!collapsed && item.name}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {theme === 'dark' ? (
            <SunIcon className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
          ) : (
            <MoonIcon className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
          )}
          {!collapsed && (theme === 'dark' ? 'Mode clair' : 'Mode sombre')}
        </button>

        {bottomNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <item.icon className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
            {!collapsed && item.name}
          </NavLink>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <ArrowLeftOnRectangleIcon className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
          {!collapsed && t('logout')}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MagnifyingGlassIcon,
  BellIcon,
  EnvelopeIcon,
  ChevronDownIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState({
    notifications: [],
    unreadNotifications: 0,
    messages: [],
    unreadMessages: 0
  });

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const fetchActivity = async () => {
    try {
      const res = await api.get('/notifications/navbar');
      if (res.success) {
        setData({
          notifications: res.notifications,
          unreadNotifications: res.unreadNotifications,
          messages: res.messages,
          unreadMessages: res.unreadMessages
        });
      }
    } catch (error) {
      console.error('Erreur chargement notifications', error);
    }
  };

  const handleReadNotification = async (id, currentRead) => {
    if (currentRead) return;
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchActivity(); // Refresh list to update badge
    } catch (error) {
      console.error(error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section - Search */}
          <div className="flex-1 max-w-lg">
            <form onSubmit={handleSearch} className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un stagiaire, une tâche..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </form>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Messages */}
            <Menu as="div" className="relative">
              <Menu.Button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <EnvelopeIcon className="w-6 h-6" />
                {data.unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded-full">
                    {data.unreadMessages}
                  </span>
                )}
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 focus:outline-none z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {data.messages.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">Aucun message</div>
                    ) : (
                      data.messages.map((msg) => (
                        <Menu.Item key={msg._id}>
                          {({ active }) => (
                            <div className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!msg.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {msg.sender?.firstName} {msg.sender?.lastName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {msg.content}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: fr })}
                              </p>
                            </div>
                          )}
                        </Menu.Item>
                      ))
                    )}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* Notifications */}
            <Menu as="div" className="relative">
              <Menu.Button className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <BellIcon className="w-6 h-6" />
                {data.unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                    {data.unreadNotifications}
                  </span>
                )}
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {data.notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">Aucune notification</div>
                    ) : (
                      data.notifications.map((notification) => (
                        <Menu.Item key={notification._id}>
                          {({ active }) => (
                            <div
                              onClick={() => handleReadNotification(notification._id, notification.read)}
                              className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                !notification.read ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                              }`}
                            >
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
                              </p>
                            </div>
                          )}
                        </Menu.Item>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-100 dark:border-gray-700 text-center bg-gray-50 dark:bg-gray-800">
                    <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium">
                      Voir toutes les notifications
                    </button>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>

            {/* User menu */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-3 focus:outline-none">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role === 'admin' ? 'Administrateur' : 
                     user?.role === 'supervisor' ? 'Superviseur' : 'Stagiaire'}
                  </p>
                </div>
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none z-50">
                  <div className="p-2">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => navigate('/profile')}
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          } group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg transition-colors`}
                        >
                          <UserCircleIcon className="w-5 h-5 mr-3 text-gray-400" />
                          Mon profil
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => navigate('/settings')}
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          } group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg transition-colors`}
                        >
                          <Cog6ToothIcon className="w-5 h-5 mr-3 text-gray-400" />
                          Paramètres
                        </button>
                      )}
                    </Menu.Item>
                    <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={logout}
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          } group flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg transition-colors`}
                        >
                          <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3 text-red-400" />
                          Déconnexion
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  UsersIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Dashboard = () => {
  const { user, isAdmin, isSupervisor, isIntern } = useAuth();
  const [stats, setStats] = useState({
    totalInterns: 0,
    activeInterns: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    myTasks: 0,
    upcomingDeadlines: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isAdmin || isSupervisor) {
        // Admin et Superviseur voient TOUTES les données
        const [internsRes, tasksRes] = await Promise.all([
          api.get('/interns'),
          api.get('/tasks')
        ]);

        const interns = internsRes.interns || [];
        const tasks = tasksRes.tasks || [];

        setStats({
          totalInterns: interns.length,
          activeInterns: interns.filter(i => i.status === 'active').length,
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          pendingTasks: tasks.filter(t => t.status === 'pending').length,
          inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
          myTasks: tasks.filter(t => t.assignedTo?._id === user?.id).length,
          upcomingDeadlines: tasks
            .filter(t => t.status !== 'completed' && new Date(t.dueDate) > new Date())
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5)
        });
      } else {
        // Stagiaire voit SEULEMENT ses données
        const tasksRes = await api.get('/tasks');
        const tasks = tasksRes.tasks || [];
        const myTasks = tasks.filter(t => t.assignedTo?._id === user?.id);

        setStats({
          totalTasks: myTasks.length,
          completedTasks: myTasks.filter(t => t.status === 'completed').length,
          pendingTasks: myTasks.filter(t => t.status === 'pending').length,
          inProgressTasks: myTasks.filter(t => t.status === 'in_progress').length,
          myTasks: myTasks.length,
          upcomingDeadlines: myTasks
            .filter(t => t.status !== 'completed' && new Date(t.dueDate) > new Date())
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 5)
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Impossible de charger les données du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  // Statistiques pour Admin/Superviseur (avec données stagiaires)
  const adminStats = [
    {
      title: 'Total Stagiaires',
      value: stats.totalInterns,
      icon: UsersIcon,
      color: 'from-blue-500 to-cyan-500',
      link: '/interns',
      bgColor: 'bg-blue-50/50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      shadow: 'hover:shadow-blue-500/20'
    },
    {
      title: 'Stagiaires Actifs',
      value: stats.activeInterns,
      icon: UserGroupIcon,
      color: 'from-emerald-500 to-teal-500',
      link: '/interns?status=active',
      bgColor: 'bg-emerald-50/50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      shadow: 'hover:shadow-emerald-500/20'
    },
    {
      title: 'Tâches en Cours',
      value: stats.inProgressTasks,
      icon: BriefcaseIcon,
      color: 'from-purple-500 to-indigo-500',
      link: '/tasks?status=in_progress',
      bgColor: 'bg-purple-50/50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      shadow: 'hover:shadow-purple-500/20'
    },
    {
      title: 'Tâches Complétées',
      value: stats.completedTasks,
      icon: CheckCircleIcon,
      color: 'from-pink-500 to-rose-500',
      link: '/tasks?status=completed',
      bgColor: 'bg-rose-50/50 dark:bg-rose-900/20',
      textColor: 'text-rose-600 dark:text-rose-400',
      shadow: 'hover:shadow-rose-500/20'
    },
  ];

  // Statistiques pour Stagiaire (sans données stagiaires)
  const internStats = [
    {
      title: 'Mes Tâches',
      value: stats.totalTasks,
      icon: ClipboardDocumentCheckIcon,
      color: 'from-blue-500 to-cyan-500',
      link: '/tasks',
      bgColor: 'bg-blue-50/50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      shadow: 'hover:shadow-blue-500/20'
    },
    {
      title: 'En Cours',
      value: stats.inProgressTasks,
      icon: BriefcaseIcon,
      color: 'from-purple-500 to-indigo-500',
      link: '/tasks?status=in_progress',
      bgColor: 'bg-purple-50/50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      shadow: 'hover:shadow-purple-500/20'
    },
    {
      title: 'Terminées',
      value: stats.completedTasks,
      icon: CheckCircleIcon,
      color: 'from-emerald-500 to-teal-500',
      link: '/tasks?status=completed',
      bgColor: 'bg-emerald-50/50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      shadow: 'hover:shadow-emerald-500/20'
    },
    {
      title: 'En Attente',
      value: stats.pendingTasks,
      icon: ClockIcon,
      color: 'from-amber-500 to-orange-500',
      link: '/tasks?status=pending',
      bgColor: 'bg-amber-50/50 dark:bg-amber-900/20',
      textColor: 'text-amber-600 dark:text-amber-400',
      shadow: 'hover:shadow-amber-500/20'
    },
  ];

  const taskDistributionData = {
    labels: ['En attente', 'En cours', 'Terminées'],
    datasets: [
      {
        data: [stats.pendingTasks, stats.inProgressTasks, stats.completedTasks],
        backgroundColor: ['#FCD34D', '#60A5FA', '#34D399'],
      },
    ],
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} retry={fetchDashboardData} />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex justify-between items-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-600 dark:from-primary-400 dark:to-indigo-300 leading-tight">
            👋 Bonjour, {user?.firstName} {user?.lastName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            {isAdmin ? 'Voici un aperçu complet de votre plateforme.' :
             isSupervisor ? 'Voici les données sous votre supervision.' :
             'Voici un aperçu de vos activités.'}
          </p>
        </div>
      </div>

      {/* Stats Grid - Affichage différent selon le rôle */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(isAdmin || isSupervisor ? adminStats : internStats).map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className={`stat-card group opacity-0 animate-fade-in-up border-transparent hover:border-gray-100 dark:hover:border-gray-700 shadow-sm ${stat.shadow}`}
            style={{ animationDelay: `${0.2 + index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bgColor} p-3 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
            <p className="stat-label">{stat.title}</p>
            <p className="stat-value">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Container Graphique & Échéances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique - Visible seulement pour Admin/Superviseur */}
        {(isAdmin || isSupervisor) && (
          <div className="card opacity-0 animate-fade-in-up flex flex-col overflow-hidden" style={{ animationDelay: '0.6s' }}>
            <h2 className="card-title mb-4">Distribution des Tâches</h2>
            <div className="h-64 flex justify-center flex-1 pb-4">
              <Doughnut 
                data={taskDistributionData} 
                options={{ 
                  maintainAspectRatio: false, 
                  plugins: { 
                    legend: { 
                      position: 'bottom', 
                      labels: { 
                        padding: 20, 
                        usePointStyle: true, 
                        font: { size: 12, weight: '500' }
                      }
                    }
                  } 
                }} 
              />
            </div>
          </div>
        )}

        {/* Échéances à Venir */}
        <div className={`card opacity-0 animate-fade-in-up flex flex-col ${(!isAdmin && !isSupervisor) ? 'lg:col-span-2' : ''}`} style={{ animationDelay: '0.7s' }}>
          <div className="card-header">
            <h2 className="card-title flex items-center text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 font-bold">
              <CalendarIcon className="w-5 h-5 mr-2 text-primary-600" />
              {isIntern ? 'Mes Échéances' : 'Échéances à Venir'}
            </h2>
            <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap">
              Voir tout
            </Link>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto">
            {stats.upcomingDeadlines.length > 0 ? (
              stats.upcomingDeadlines.map((task, index) => (
                <Link
                  key={index}
                  to={`/tasks/${task._id}`}
                  className="group flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/30 rounded-xl border border-transparent hover:border-primary-100 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all duration-300"
                >
                  <div className="min-w-0 pr-4">
                    <p className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">{task.title}</p>
                    {(isAdmin || isSupervisor) && task.assignedTo && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                        <div className="w-5 h-5 flex-shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs mr-2 border border-primary-200">
                          {task.assignedTo.firstName?.charAt(0) || ''}{task.assignedTo.lastName?.charAt(0) || ''}
                        </div>
                        <span className="truncate">{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/40 px-3 py-1 rounded-full whitespace-nowrap">
                      {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-[256px] py-8 text-center bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <CalendarIcon className="w-10 h-10 text-gray-400 mb-3" />
                <p className="text-gray-500 font-medium">Aucune échéance à venir</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
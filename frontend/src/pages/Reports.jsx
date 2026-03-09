import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  DocumentTextIcon,
  ChartBarIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, subDays, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const Reports = () => {
  const { isAdmin, isSupervisor, isIntern } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: { totalInterns: 0, completedTasks: 0, inProgressTasks: 0, totalDepartments: 0 },
    internData: [],
    taskData: [],
    departmentData: []
  });

  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchData();
  }, []); // Reload when dates change if you add them to API later

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/stats/reports');
      setData({
        stats: res.stats,
        internData: res.internData,
        taskData: res.taskData,
        departmentData: res.departmentData
      });
    } catch (error) {
      toast.error('Erreur lors du chargement des rapports');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Rediriger les stagiaires
  if (isIntern) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-center">
          <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h2 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">
            Accès non autorisé
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Les rapports ne sont pas accessibles aux stagiaires.
          </p>
          <Link
            to="/dashboard"
            className="mt-4 inline-block btn-primary"
          >
            Retour au Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleExport = (format) => {
    toast.success(`Export ${format} en cours de développement`);
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400">
            Rapports et Analyses
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            {isAdmin ? 'Analyse complète des données' : 'Visualisez les statistiques'}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleExport('PDF')}
            className="btn-secondary"
          >
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Exporter PDF
          </button>
          <button
            onClick={() => handleExport('CSV')}
            className="btn-primary"
          >
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-white/50 dark:border-white/10 p-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center space-x-4">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="input-field w-auto"
          />
          <span className="text-gray-500">au</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="input-field w-auto"
          />
          <button className="btn-primary">Appliquer</button>
        </div>
      </div>

      {/* Statistiques clés */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="stat-label mt-4">Total Stagiaires</p>
          <p className="stat-value">{data.stats.totalInterns}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-xl">
              <ClipboardDocumentCheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="stat-label mt-4">Tâches Complétées</p>
          <p className="stat-value">{data.stats.completedTasks}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-xl">
              <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="stat-label mt-4">Tâches en Cours</p>
          <p className="stat-value">{data.stats.inProgressTasks}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
              <BuildingOfficeIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="stat-label mt-4">Départements</p>
          <p className="stat-value">{data.stats.totalDepartments}</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="card">
          <h3 className="card-title mb-4">Évolution des Stagiaires</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.internData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#4f46e5" name="Total" />
                <Line type="monotone" dataKey="actifs" stroke="#10b981" name="Actifs" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title mb-4">Activité des Tâches</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.taskData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="créées" fill="#4f46e5" />
                <Bar dataKey="complétées" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="card-title mb-4">Répartition par Département</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
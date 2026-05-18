import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon, ArrowDownTrayIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Timesheet = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  // Unique key for storage per user (retained for migration check)
  const storageKey = user?._id ? `timesheet_data_${user._id}` : 'timesheet_data';

  const fetchTimesheet = useCallback(async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    try {
      const response = await api.get('/timesheet');
      if (response.success && response.data) {
        // Deep compare stringified objects to prevent re-renders unless data actually changed
        setData(prevData => {
          if (JSON.stringify(prevData) !== JSON.stringify(response.data)) {
            return response.data;
          }
          return prevData;
        });
      }
    } catch (e) {
      console.error('Error fetching timesheet from MongoDB', e);
      if (!isSilent) toast.error('Erreur lors du chargement de la feuille de temps');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [user]);

  // Initial fetch and optional localStorage migration
  useEffect(() => {
    const initialLoad = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await api.get('/timesheet');
        if (response.success && response.data && Object.keys(response.data).length > 0) {
          setData(response.data);
        } else {
          // Check for existing local storage data to migrate to MongoDB
          const localDataStr = localStorage.getItem(storageKey);
          if (localDataStr) {
            try {
              const localData = JSON.parse(localDataStr);
              if (Object.keys(localData).length > 0) {
                setData(localData);
                // Save it to MongoDB
                await api.post('/timesheet', { days: localData });
                toast.success('Données locales synchronisées sur le serveur !');
              }
            } catch (err) {
              console.error('Error parsing local timesheet during migration', err);
            }
            // Clean up local storage
            localStorage.removeItem(storageKey);
          } else {
            setData({});
          }
        }
      } catch (e) {
        console.error('Error fetching timesheet from MongoDB', e);
        toast.error('Erreur lors du chargement de la feuille de temps');
      } finally {
        setLoading(false);
      }
    };

    initialLoad();
  }, [user, storageKey]);

  // Real-time synchronization listeners (Focus & Periodic polling)
  useEffect(() => {
    if (!user) return;

    // 1. Sync instantly when switching tabs / focusing window
    const handleFocus = () => {
      fetchTimesheet(true); // Silent sync in the background
    };

    window.addEventListener('focus', handleFocus);

    // 2. Periodic sync every 5 seconds (fast real-time polling)
    const interval = setInterval(() => {
      fetchTimesheet(true); // Silent sync in the background
    }, 5000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [user, fetchTimesheet]);

  const saveData = async (newData) => {
    // Optimistic update
    setData(newData);
    try {
      await api.post('/timesheet', { days: newData });
    } catch (e) {
      console.error('Error saving timesheet to MongoDB', e);
      toast.error('Erreur lors de la sauvegarde sur le serveur');
    }
  };


  // Get the period that contains a specific date
  const getPeriodForDate = useCallback((date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    let periodYear = year;
    let periodMonth = month;

    if (day < 20) {
      periodMonth = month - 1;
      if (periodMonth < 0) {
        periodMonth = 11;
        periodYear = year - 1;
      }
    }

    return new Date(periodYear, periodMonth, 20);
  }, []);

  // Get today's period start
  const getTodayPeriodStart = useCallback(() => {
    return getPeriodForDate(new Date());
  }, [getPeriodForDate]);

  // Get days in the current period
  const getDaysInPeriod = useCallback(() => {
    const startYear = currentDate.getFullYear();
    const startMonth = currentDate.getMonth();
    const start = new Date(startYear, startMonth, 20);
    const end = new Date(startYear, startMonth + 1, 20);
    const days = [];
    let current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [currentDate]);

  const periodDays = getDaysInPeriod();
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  // Go to today - ALWAYS switches to the correct period
  const goToToday = useCallback(() => {
    const todayPeriodStart = getTodayPeriodStart();
    setCurrentDate(todayPeriodStart);
    // Small delay to ensure render then scroll
    setTimeout(() => {
      const todayCard = document.querySelector('[data-today="true"]');
      if (todayCard) {
        todayCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        todayCard.style.transition = 'all 0.3s';
        todayCard.style.transform = 'scale(1.02)';
        setTimeout(() => {
          todayCard.style.transform = '';
        }, 500);
      }
    }, 200);
  }, [getTodayPeriodStart]);

  const handlePrevMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() - 1;
    setCurrentDate(new Date(year, month, 20));
  };

  const handleNextMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    setCurrentDate(new Date(year, month, 20));
  };

  const handleResetMonth = () => {
    if (window.confirm('Voulez-vous vraiment réinitialiser toutes les données de cette période ?')) {
      const newData = { ...data };
      periodDays.forEach(date => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        delete newData[dateKey];
      });
      saveData(newData);
    }
  };

  const getDayData = (dateKey) => {
    const val = data[dateKey];
    if (!val) return { hours: 0, transportOnly: false };
    if (typeof val === 'object') {
      return { hours: Number(val.hours) || 0, transportOnly: !!val.transportOnly };
    }
    return { hours: parseFloat(val) || 0, transportOnly: false };
  };

  const incrementHour = (dateKey) => {
    const dayData = getDayData(dateKey);
    const newDayData = {
      ...dayData,
      hours: dayData.hours + 0.5
    };
    const newData = { ...data, [dateKey]: newDayData };
    saveData(newData);
  };

  const decrementHour = (dateKey) => {
    const dayData = getDayData(dateKey);
    const newDayData = {
      ...dayData,
      hours: Math.max(0, dayData.hours - 0.5)
    };
    const newData = { ...data };
    if (newDayData.hours === 0 && !newDayData.transportOnly) {
      delete newData[dateKey];
    } else {
      newData[dateKey] = newDayData;
    }
    saveData(newData);
  };

  const toggleTransportOnly = (dateKey) => {
    const dayData = getDayData(dateKey);
    const newDayData = {
      ...dayData,
      transportOnly: !dayData.transportOnly
    };
    const newData = { ...data };
    if (newDayData.hours === 0 && !newDayData.transportOnly) {
      delete newData[dateKey];
    } else {
      newData[dateKey] = newDayData;
    }
    saveData(newData);
  };

  const exportData = (format) => {
    const monthData = [];
    periodDays.forEach(date => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const dayData = getDayData(dateKey);
      const hours = dayData.hours;
      const transport = (hours > 0 || dayData.transportOnly) ? 200 : 0;
      const total = (hours * 700) + transport;

      monthData.push({
        Date: dateKey,
        Heures: hours,
        "Frais Transport (DH)": transport,
        "Total Jour (DH)": total
      });
    });

    if (format === 'csv') {
      const headers = ["Date", "Heures", "Frais Transport (DH)", "Total Jour (DH)"];
      const csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + monthData.map(row => `${row.Date},${row.Heures},${row["Frais Transport (DH)"]},${row["Total Jour (DH)"]}`).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `timesheet_${currentDate.getFullYear()}_${currentDate.getMonth() + 1}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(monthData, null, 2));
      const link = document.createElement("a");
      link.setAttribute("href", dataStr);
      link.setAttribute("download", `timesheet_${currentDate.getFullYear()}_${currentDate.getMonth() + 1}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  let totalMonthHours = 0;
  let totalTransport = 0;
  let grandTotal = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayPeriodStart = getTodayPeriodStart();
  const isCurrentPeriodTodayPeriod = currentDate.getTime() === todayPeriodStart.getTime();

  const daysRender = [];
  periodDays.forEach((date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${dayStr}`;

    const dayData = getDayData(dateKey);
    const numHours = dayData.hours;
    const transportOnly = dayData.transportOnly;

    const hasTransport = numHours > 0 || transportOnly;
    const transport = hasTransport ? 200 : 0;
    const dailyTotal = (numHours * 700) + transport;

    totalMonthHours += numHours;
    totalTransport += transport;
    grandTotal += dailyTotal;

    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
    const monthNameShort = date.toLocaleDateString('fr-FR', { month: 'short' });

    const isToday = date.toDateString() === today.toDateString();
    const isTodayInThisPeriod = isToday && isCurrentPeriodTodayPeriod;

    daysRender.push(
      <div
        key={dateKey}
        data-today={isTodayInThisPeriod ? "true" : "false"}
        className={`p-4 rounded-xl border ${hasTransport
            ? 'bg-green-50/60 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : 'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700'
          } ${isTodayInThisPeriod
            ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-lg'
            : ''
          } shadow-sm transition-all hover:shadow-md flex flex-col justify-between`}
      >
        <div>
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center space-x-2">
              <span className="w-auto px-2 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm">{date.getDate()} {monthNameShort}</span>
              <span className="capitalize">{dayName}</span>
              {isTodayInThisPeriod && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-500 text-white">Aujourd'hui</span>
              )}
            </span>
            {dailyTotal > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {dailyTotal} DH
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Heures travaillées</label>
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-1">
                <button
                  onClick={() => decrementHour(dateKey)}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                >
                  <MinusIcon className="w-4 h-4" />
                </button>
                <span className="text-lg font-bold text-gray-900 dark:text-white w-12 text-center">
                  {numHours}
                </span>
                <button
                  onClick={() => incrementHour(dateKey)}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Transport:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">{transport} DH</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
          <button
            onClick={() => toggleTransportOnly(dateKey)}
            disabled={numHours > 0}
            className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
              transportOnly
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                : numHours > 0
                  ? 'bg-gray-50 text-gray-400 border-gray-100 dark:bg-gray-800/40 dark:text-gray-600 dark:border-gray-800 cursor-not-allowed'
                  : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            🚗 {transportOnly ? 'Transport Seul Actif' : 'Ajouter Transport Seul'}
          </button>
        </div>
      </div>
    );
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>

        {/* Date Selector Skeleton */}
        <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>

        {/* Info Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gray-250 dark:bg-gray-700 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-600/20"></div>
          <div className="h-32 bg-gray-250 dark:bg-gray-700 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20"></div>
          <div className="h-32 bg-gray-250 dark:bg-gray-700 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20"></div>
        </div>

        {/* Days Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3 h-48 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="h-10 w-full bg-gray-100 dark:bg-gray-700/50 rounded-md"></div>
              </div>
              <div className="h-8 w-full bg-gray-100 dark:bg-gray-700/50 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Format period display
  const startMonth = monthNames[currentDate.getMonth()];
  const endMonth = monthNames[(currentDate.getMonth() + 1) % 12];
  const startYear = currentDate.getFullYear();
  const endYear = currentDate.getMonth() === 11 ? startYear + 1 : startYear;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Pointage Mensuel</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gérez vos heures de travail et frais de transport</p>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={() => exportData('csv')} className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            CSV
          </button>
          <button onClick={() => exportData('json')} className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            JSON
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button onClick={handlePrevMonth} className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm transition-all border border-gray-200 dark:border-gray-600">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          <div className="text-lg font-bold text-gray-900 dark:text-white min-w-[200px] text-center">
            {startMonth} {startYear} → {endMonth} {endYear}
          </div>

          <button onClick={handleNextMonth} className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm transition-all border border-gray-200 dark:border-gray-600">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={goToToday}
            className="inline-flex items-center px-4 py-2 border border-green-200 text-green-700 dark:border-green-800/30 dark:text-green-400 bg-green-50 dark:bg-green-900/10 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-xl text-sm font-semibold transition-colors"
          >
            📅 Aujourd'hui
          </button>
          <button onClick={handleResetMonth} className="inline-flex items-center px-4 py-2 border border-red-200 text-red-600 dark:border-red-800/30 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl text-sm font-semibold transition-colors">
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Réinitialiser le mois
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 dark:shadow-none relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-indigo-100 text-sm font-medium mb-1">Total Heures Travaillées</p>
            <p className="text-3xl font-black">{totalMonthHours} <span className="text-lg font-medium opacity-80">h</span></p>
            <p className="text-indigo-100 text-sm mt-2">Soit {(totalMonthHours * 700).toLocaleString('fr-FR')} DH</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-amber-200 dark:shadow-none relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-amber-100 text-sm font-medium mb-1">Frais de Transport</p>
            <p className="text-3xl font-black">{totalTransport.toLocaleString('fr-FR')} <span className="text-lg font-medium opacity-80">DH</span></p>
            <p className="text-amber-100 text-sm mt-2">{totalTransport / 200} jours travaillés</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200 dark:shadow-none relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-emerald-100 text-sm font-medium mb-1">Total Général Mensuel</p>
            <p className="text-4xl font-black">{grandTotal.toLocaleString('fr-FR')} <span className="text-xl font-medium opacity-80">DH</span></p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {daysRender}
      </div>
    </div>
  );
};

export default Timesheet;
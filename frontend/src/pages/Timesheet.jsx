import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon, ArrowDownTrayIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';

const Timesheet = () => {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState({});

  useEffect(() => {
    const savedData = localStorage.getItem('timesheet_data');
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch (e) {
        console.error('Error parsing timesheet data', e);
      }
    }
  }, []);

  const saveData = (newData) => {
    setData(newData);
    localStorage.setItem('timesheet_data', JSON.stringify(newData));
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const getDaysInPeriod = useCallback(() => {
    const start = new Date(currentYear, currentMonth, 20);
    const end = new Date(currentYear, currentMonth + 1, 20);
    const days = [];
    let current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [currentYear, currentMonth]);

  const periodDays = getDaysInPeriod();
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  const isTodayInPeriod = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(currentYear, currentMonth, 20);
    start.setHours(0, 0, 0, 0);
    const end = new Date(currentYear, currentMonth + 1, 20);
    end.setHours(0, 0, 0, 0);
    return today >= start && today <= end;
  }, [currentYear, currentMonth]);

  const scrollToToday = useCallback(() => {
    const todayCard = document.querySelector('[data-today="true"]');

    if (todayCard && isTodayInPeriod()) {
      todayCard.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });

      // Temporary highlight effect
      todayCard.style.transition = 'all 0.3s';
      todayCard.style.transform = 'scale(1.02)';
      todayCard.style.boxShadow = '0 0 0 3px #4f46e5, 0 10px 25px -5px rgba(0,0,0,0.2)';

      setTimeout(() => {
        todayCard.style.transform = 'scale(1)';
        todayCard.style.boxShadow = '';
      }, 600);
    } else if (!isTodayInPeriod()) {
      alert("La date d'aujourd'hui n'est pas dans la période affichée.");
    }
  }, [isTodayInPeriod]);

  // Auto-scroll when period changes
  useEffect(() => {
    setTimeout(() => {
      if (isTodayInPeriod()) {
        scrollToToday();
      }
    }, 200);
  }, [currentDate, data, isTodayInPeriod, scrollToToday]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
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

  const incrementHour = (dateKey) => {
    const current = parseInt(data[dateKey] || 0, 10);
    const newData = { ...data, [dateKey]: current + 1 };
    saveData(newData);
  };

  const decrementHour = (dateKey) => {
    const current = parseInt(data[dateKey] || 0, 10);
    const newData = { ...data };
    if (current <= 1) {
      delete newData[dateKey];
    } else {
      newData[dateKey] = current - 1;
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

      const hours = data[dateKey] || 0;
      const transport = hours > 0 ? 200 : 0;
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
      link.setAttribute("download", `timesheet_${currentYear}_${currentMonth + 1}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === 'json') {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(monthData, null, 2));
      const link = document.createElement("a");
      link.setAttribute("href", dataStr);
      link.setAttribute("download", `timesheet_${currentYear}_${currentMonth + 1}.json`);
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

  const daysRender = [];
  periodDays.forEach((date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${dayStr}`;

    const hours = data[dateKey] || '';
    const numHours = parseInt(hours, 10) || 0;

    const transport = numHours > 0 ? 200 : 0;
    const dailyTotal = (numHours * 700) + transport;

    totalMonthHours += numHours;
    totalTransport += transport;
    grandTotal += dailyTotal;

    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
    const monthNameShort = date.toLocaleDateString('fr-FR', { month: 'short' });

    const isToday = date.toDateString() === today.toDateString();
    const isTodayInCurrentPeriod = isTodayInPeriod();

    daysRender.push(
      <div
        key={dateKey}
        data-today={isToday && isTodayInCurrentPeriod ? "true" : "false"}
        className={`p-4 rounded-xl border ${numHours > 0
            ? 'bg-green-50/60 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : 'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700'
          } ${isToday && isTodayInCurrentPeriod
            ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 shadow-lg'
            : ''
          } shadow-sm transition-all hover:shadow-md`}
      >
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center space-x-2">
            <span className="w-auto px-2 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm">{date.getDate()} {monthNameShort}</span>
            <span className="capitalize">{dayName}</span>
            {isToday && isTodayInCurrentPeriod && (
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
    );
  });

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

          <div className="flex space-x-2">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentDate(new Date(currentYear, parseInt(e.target.value), 1))}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none font-semibold"
            >
              {monthNames.map((m, idx) => (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>

            <select
              value={currentYear}
              onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), currentMonth, 1))}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none font-semibold"
            >
              {Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button onClick={handleNextMonth} className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-sm transition-all border border-gray-200 dark:border-gray-600">
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={scrollToToday}
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
            <p className="text-indigo-100 text-sm mt-2">Soit {totalMonthHours * 700} DH</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-amber-200 dark:shadow-none relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-amber-100 text-sm font-medium mb-1">Frais de Transport</p>
            <p className="text-3xl font-black">{totalTransport} <span className="text-lg font-medium opacity-80">DH</span></p>
            <p className="text-amber-100 text-sm mt-2">{totalTransport / 200} jours travaillés</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200 dark:shadow-none relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-emerald-100 text-sm font-medium mb-1">Total Général Mensuel</p>
            <p className="text-4xl font-black">{grandTotal} <span className="text-xl font-medium opacity-80">DH</span></p>
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
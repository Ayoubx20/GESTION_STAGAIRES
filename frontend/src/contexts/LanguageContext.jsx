import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const LanguageContext = createContext();

const translations = {
  fr: {
    dashboard: 'Tableau de Bord',
    tasks: 'Tâches',
    interns: 'Stagiaires',
    settings: 'Paramètres',
    profile: 'Profil',
    logout: 'Déconnexion',
    search: 'Rechercher...',
    no_tasks: 'Aucune tâche trouvée',
    urgent: 'Urgent',
    normal: 'Normal',
    low: 'Basse',
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminé',
    dueDate: 'Date d\'échéance',
    assignedTo: 'Assigné à',
    language: 'Langue',
    timezone: 'Fuseau horaire',
    general: 'Général',
    appearance: 'Apparence',
    notifications: 'Notifications',
    security: 'Sécurité',
    email: 'Email',
    backup: 'Sauvegarde',
    save_changes: 'Enregistrer les modifications',
    reset: 'Réinitialiser',
    welcome: 'Bienvenue',
  },
  en: {
    dashboard: 'Dashboard',
    tasks: 'Tasks',
    interns: 'Interns',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    search: 'Search...',
    no_tasks: 'No tasks found',
    urgent: 'Urgent',
    normal: 'Normal',
    low: 'Low',
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    dueDate: 'Due Date',
    assignedTo: 'Assigned To',
    language: 'Language',
    timezone: 'Timezone',
    general: 'General',
    appearance: 'Appearance',
    notifications: 'Notifications',
    security: 'Security',
    email: 'Email',
    backup: 'Backup',
    save_changes: 'Save Changes',
    reset: 'Reset',
    welcome: 'Welcome',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    tasks: 'المهام',
    interns: 'المتدربين',
    settings: 'الإعدادات',
    profile: 'الملف الشخصي',
    logout: 'تسجيل الخروج',
    search: 'بحث...',
    no_tasks: 'لم يتم العثور على مهام',
    urgent: 'عاجل',
    normal: 'عادي',
    low: 'منخفض',
    pending: 'قيد الانتظار',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتمل',
    dueDate: 'تاريخ الاستحقاق',
    assignedTo: 'مسند إلى',
    language: 'اللغة',
    timezone: 'المنطقة الزمنية',
    general: 'عام',
    appearance: 'المظهر',
    notifications: 'الإشعارات',
    security: 'الأمان',
    email: 'البريد الإلكتروني',
    backup: 'النسخ الاحتياطي',
    save_changes: 'حفظ التغييرات',
    reset: 'إعادة تعيين',
    welcome: 'مرحباً',
  }
};

export const LanguageProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Use a unique key per user for local storage fallback
  const storageKey = user ? `app_lang_${user.id}` : 'app_lang_guest';
  
  const [lang, setLang] = useState(() => {
    // 1. Priority: User settings from backend (if available in user object)
    if (user?.settings?.language) return user.settings.language;
    // 2. Secondary: User's stored preference on this machine
    return localStorage.getItem(storageKey) || 'fr';
  });

  // Sync with user changes
  useEffect(() => {
    if (user?.settings?.language && user.settings.language !== lang) {
      setLang(user.settings.language);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(storageKey, lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, storageKey]);

  const t = (key) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);


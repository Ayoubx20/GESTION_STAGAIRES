export const PAGE_ACCESS_OPTIONS = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', description: 'Vue d’ensemble et indicateurs', roles: ['intern', 'supervisor'] },
  { key: 'interns', label: 'Stagiaires', path: '/interns', description: 'Gestion des stagiaires et évaluations', roles: ['supervisor'] },
  { key: 'teams', label: 'Équipes', path: '/teams', description: 'Organisation des équipes', roles: ['intern', 'supervisor'] },
  { key: 'tasks', label: 'Tâches', path: '/tasks', description: 'Suivi des tâches', roles: ['intern', 'supervisor'] },
  { key: 'timesheet', label: 'Pointage', path: '/timesheet', description: 'Heures travaillées et transport', roles: ['intern', 'supervisor'] },
  { key: 'admin-timesheet', label: 'Pointage équipe', path: '/admin-timesheet', description: 'Suivi des pointages de l’équipe', roles: ['supervisor'] },
  { key: 'reports', label: 'Rapports', path: '/reports', description: 'Rapports d’activité', roles: ['supervisor'] },
  { key: 'my-documents', label: 'Mes documents', path: '/my-documents', description: 'Documents personnels', roles: ['intern'] },
  { key: 'search', label: 'Recherche', path: '/search', description: 'Recherche dans l’espace de travail', roles: ['intern', 'supervisor'] },
  { key: 'binary', label: 'Binary Lab', path: '/binary', description: 'Outils du laboratoire', roles: ['intern', 'supervisor'] },
  { key: 'profile', label: 'Profil', path: '/profile', description: 'Informations du compte', roles: ['intern', 'supervisor'] },
  { key: 'settings', label: 'Paramètres', path: '/settings', description: 'Préférences du compte', roles: ['intern', 'supervisor'] }
];

const ROUTE_PAGE_KEYS = {
  '/dashboard': 'dashboard',
  '/interns': 'interns',
  '/teams': 'teams',
  '/tasks': 'tasks',
  '/timesheet': 'timesheet',
  '/admin-timesheet': 'admin-timesheet',
  '/reports': 'reports',
  '/my-documents': 'my-documents',
  '/search': 'search',
  '/binary': 'binary',
  '/quiz': 'binary',
  '/profile': 'profile',
  '/settings': 'settings',
  '/users': 'users',
  '/approvals': 'approvals'
};

export const getPageAccessOptions = (role) =>
  PAGE_ACCESS_OPTIONS.filter((page) => page.roles.includes(role));

export const getPageKeyForPath = (pathname) => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const route = Object.keys(ROUTE_PAGE_KEYS)
    .sort((left, right) => right.length - left.length)
    .find((candidate) => normalizedPath === candidate || normalizedPath.startsWith(`${candidate}/`));

  return route ? ROUTE_PAGE_KEYS[route] : null;
};

export const getConfiguredPageKeys = (user) => {
  const rolePages = getPageAccessOptions(user?.role);

  if (user?.pageAccess === 'dashboard') return ['dashboard'];
  if (user?.pageAccess === 'timesheet') return ['timesheet'];
  if (user?.pageAccess === 'custom') {
    return rolePages.filter((page) => user.allowedPages?.includes(page.key)).map((page) => page.key);
  }

  return rolePages.map((page) => page.key);
};

export const hasPageAccess = (user, pathname) => {
  if (!user || user.role === 'admin' || !user.pageAccess || user.pageAccess === 'all') return true;

  const pageKey = getPageKeyForPath(pathname);
  if (user.pageAccess === 'dashboard') return pageKey === 'dashboard';
  if (user.pageAccess === 'timesheet') return pageKey === 'timesheet';
  return user.pageAccess === 'custom' && !!pageKey && user.allowedPages?.includes(pageKey);
};

export const getAllowedPagePath = (user) => {
  if (user?.pageAccess === 'dashboard') return '/dashboard';
  if (user?.pageAccess === 'timesheet') return '/timesheet';

  const allowedPages = getConfiguredPageKeys(user);
  return getPageAccessOptions(user?.role).find((page) => allowedPages.includes(page.key))?.path || '/dashboard';
};
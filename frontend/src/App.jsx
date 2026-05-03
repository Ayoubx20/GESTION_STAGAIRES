import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Layout
import Layout from './components/Layout.jsx';

// Pages Publiques
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const RegistrationPending = lazy(() => import('./pages/RegistrationPending.jsx'));

// Pages Principales
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Interns = lazy(() => import('./pages/Interns.jsx'));
const InternDetail = lazy(() => import('./pages/InternDetail.jsx'));
const InternForm = lazy(() => import('./pages/InternForm.jsx'));
const Tasks = lazy(() => import('./pages/Tasks.jsx'));
const TaskDetail = lazy(() => import('./pages/TaskDetail.jsx'));
const TaskForm = lazy(() => import('./pages/TaskForm.jsx'));
const Teams = lazy(() => import('./pages/Teams.jsx'));
const TeamForm = lazy(() => import('./pages/TeamForm.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Users = lazy(() => import('./pages/Users.jsx'));
const PendingApprovals = lazy(() => import('./pages/PendingApprovals.jsx'));
const Evaluations = lazy(() => import('./pages/Evaluations.jsx'));
const MyDocuments = lazy(() => import('./pages/MyDocuments.jsx'));
const GlobalSearch = lazy(() => import('./pages/GlobalSearch.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

// Protected Route
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />

            <Suspense fallback={
              <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            }>
              <Routes>
              {/* ========== ROUTES PUBLIQUES ========== */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/registration-pending" element={<RegistrationPending />} />

              {/* ========== ROUTES PROTÉGÉES ========== */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                {/* Redirection par défaut */}
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* Dashboard - accessible à tous */}
                <Route path="dashboard" element={<Dashboard />} />

                {/* ===== GESTION DES STAGIAIRES ===== */}
                <Route path="interns" element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <Interns />
                  </ProtectedRoute>
                } />
                <Route path="interns/new" element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <InternForm />
                  </ProtectedRoute>
                } />
                <Route path="interns/:id" element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <InternDetail />
                  </ProtectedRoute>
                } />
                <Route path="interns/:id/edit" element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <InternForm />
                  </ProtectedRoute>
                } />

                {/* ===== GESTION DES EQUIPES ===== */}
                <Route path="teams" element={<Teams />} />
                <Route path="teams/new" element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <TeamForm />
                  </ProtectedRoute>
                } />
                <Route path="teams/:id/edit" element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <TeamForm />
                  </ProtectedRoute>
                } />

                {/* ===== GESTION DES TÂCHES ===== */}
                <Route path="tasks" element={<Tasks />} />
                <Route path="tasks/new" element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <TaskForm />
                  </ProtectedRoute>
                } />
                <Route path="tasks/:id" element={<TaskDetail />} />
                <Route path="tasks/:id/edit" element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <TaskForm />
                  </ProtectedRoute>
                } />


                {/* ===== GESTION DES UTILISATEURS ===== */}
                <Route path="users" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Users />
                  </ProtectedRoute>
                } />

                {/* ===== GESTION DES APPROBATIONS (Admin seulement) ===== */}
                <Route path="approvals" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PendingApprovals />
                  </ProtectedRoute>
                } />

                {/* ===== RAPPORTS ===== */}
                <Route path="reports" element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <Reports />
                  </ProtectedRoute>
                } />

                {/* ===== EVALUATIONS ===== */}
                <Route path="interns/:id/evaluations" element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <Evaluations />
                  </ProtectedRoute>
                } />

                {/* ===== AUTRES PAGES ===== */}
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />

                {/* ===== DOCUMENTS STAGIAIRE ===== */}
                <Route path="my-documents" element={
                  <ProtectedRoute allowedRoles={['intern']}>
                    <MyDocuments />
                  </ProtectedRoute>
                } />

                {/* ===== RECHERCHE GLOBALE ===== */}
                <Route path="search" element={<GlobalSearch />} />
              </Route>

              {/* ========== ROUTE 404 ========== */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
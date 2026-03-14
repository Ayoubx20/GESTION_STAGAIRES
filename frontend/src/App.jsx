import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Layout
import Layout from './components/Layout.jsx';

// Pages Publiques
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import RegistrationPending from './pages/RegistrationPending.jsx';

// Pages Principales
import Dashboard from './pages/Dashboard.jsx';
import Interns from './pages/Interns.jsx';
import InternDetail from './pages/InternDetail.jsx';
import InternForm from './pages/InternForm.jsx';
import Tasks from './pages/Tasks.jsx';
import TaskDetail from './pages/TaskDetail.jsx';
import TaskForm from './pages/TaskForm.jsx';
import Teams from './pages/Teams.jsx';
import TeamForm from './pages/TeamForm.jsx';
import Profile from './pages/Profile.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import Users from './pages/Users.jsx';
import PendingApprovals from './pages/PendingApprovals.jsx';
import Evaluations from './pages/Evaluations.jsx';
import MyDocuments from './pages/MyDocuments.jsx';
import GlobalSearch from './pages/GlobalSearch.jsx';
import NotFound from './pages/NotFound.jsx';

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
                <Route path="teams" element={
                  <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <Teams />
                  </ProtectedRoute>
                } />
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
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { SessionProvider } from './contexts/SessionContext';
import { TaskProvider } from './contexts/TaskContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { TimerProvider } from './contexts/TimerContext';
import { FocusMonitorProvider } from './contexts/FocusMonitorContext';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute';

import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { TimerPage } from './pages/TimerPage';
import { TasksPage } from './pages/TasksPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CoachPage } from './pages/CoachPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <SessionProvider>
          <TaskProvider>
            <NotificationProvider>
              <TimerProvider>
                <FocusMonitorProvider>
                  <BrowserRouter>
                    <Routes>
                      {/* Public Landing Page */}
                      <Route path="/" element={<LandingPage />} />

                      {/* Public routes only accessible when NOT logged in */}
                      <Route element={<PublicOnlyRoute />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                      </Route>

                      {/* Protected Application Routes */}
                      <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                          <Route path="/timer" element={<TimerPage />} />
                          <Route path="/analytics" element={<AnalyticsPage />} />
                          <Route path="/coach" element={<CoachPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route path="/syllabus" element={<Navigate to="/timer" replace />} />
                          <Route path="/tasks" element={<Navigate to="/timer" replace />} />
                        </Route>
                      </Route>


                  {/* Fallback routes */}
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </BrowserRouter>
            </FocusMonitorProvider>
          </TimerProvider>
        </NotificationProvider>
      </TaskProvider>
    </SessionProvider>
  </SettingsProvider>
</AuthProvider>
  );
};

export default App;

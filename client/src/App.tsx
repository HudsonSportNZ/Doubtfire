import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import PayRunsPage from './pages/PayRunsPage';
import EmployeesPage from './pages/EmployeesPage';
import RuleSetsPage from './pages/RuleSetsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import PlaceholderPage from './pages/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* All protected pages share the AppLayout (sidebar + topbar) */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="/clients"     element={<ClientsPage />} />
            <Route path="/pay-runs"    element={<PayRunsPage />} />
            <Route path="/employees"   element={<EmployeesPage />} />
            <Route path="/timesheets"  element={<PlaceholderPage />} />
            <Route path="/expenses"    element={<PlaceholderPage />} />
            <Route path="/leave"       element={<PlaceholderPage />} />
            <Route path="/rule-sets"   element={<RuleSetsPage />} />
            <Route path="/reports"     element={<ReportsPage />} />
            <Route path="/settings"    element={<Navigate to="/settings/business" replace />} />
            <Route path="/settings/:section" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

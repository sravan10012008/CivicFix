import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import GlowCursor from '@/components/GlowCursor';
import ProtectedRoute from '@/components/ProtectedRoute';
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import CitizenDashboard from '@/pages/CitizenDashboard';
import ReportIssue from '@/pages/ReportIssue';
import MyComplaints from '@/pages/MyComplaints';
import TrackComplaint from '@/pages/TrackComplaint';
import ComplaintDetails from '@/pages/ComplaintDetails';
import AdminDashboard from '@/pages/AdminDashboard';
import WorkerDashboard from '@/pages/WorkerDashboard';
import Departments from '@/pages/Departments';
import Workers from '@/pages/Workers';
import UsersPage from '@/pages/Users';
import Reports from '@/pages/Reports';
import AllComplaints from '@/pages/AllComplaints';

function RoleRedirect() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (isAuthenticated && user && ['/login', '/register'].includes(location.pathname)) {
    const dest =
      user.role === 'admin'
        ? '/admin'
        : user.role === 'worker'
          ? '/worker'
          : '/citizen';

    return <Navigate to={dest} replace />;
  }

  return null;
}

const AuthenticatedApp = () => {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    navigateToLogin
  } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <>
      <RoleRedirect />

      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/track" element={<TrackComplaint />} />

        <Route path="/complaint/:id" element={<ComplaintDetails />} />

        <Route
          element={
            <ProtectedRoute
              unauthenticatedElement={<Navigate to="/login" replace />}
              allowedRoles={["citizen", "admin"]}
            />
          }
        >
          <Route path="/citizen" element={<CitizenDashboard />} />
          <Route path="/report" element={<ReportIssue />} />
          <Route path="/my-complaints" element={<MyComplaints />} />
        </Route>

        <Route
          element={
            <ProtectedRoute
              unauthenticatedElement={<Navigate to="/login" replace />}
              allowedRoles={["worker"]}
            />
          }
        >
          <Route path="/worker" element={<WorkerDashboard />} />
        </Route>

        <Route
          element={
            <ProtectedRoute
              unauthenticatedElement={<Navigate to="/login" replace />}
              allowedRoles={["admin"]}
            />
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/all-complaints" element={<AllComplaints />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/reports" element={<Reports />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <GlowCursor />
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>

        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
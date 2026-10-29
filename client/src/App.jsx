import { Navigate, Outlet, Route, Routes, useLocation, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Spinner, ErrorState } from './components/UI';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import ApplicationForm from './pages/ApplicationForm';

function Protected() {
  const { user } = useAuth();
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to="/login" state={{ from: `${location.pathname}${location.search}` }} replace />;
}
export default function App() {
  const { loading, error, retry } = useAuth();
  if (loading) return <div className="app-loading"><Spinner /></div>;
  if (error) return <div className="app-loading"><ErrorState error={error} retry={retry} /></div>;
  return <><a href="#main-content" className="skip-link">Skip to content</a><Routes>
    <Route path="/login" element={<Auth key="login" />} /><Route path="/register" element={<Auth key="register" register />} />
    <Route element={<Protected />}><Route element={<Layout />}><Route index element={<Dashboard />} /><Route path="applications" element={<Applications key="all" />} /><Route path="interviews" element={<Applications key="interviews" interviews />} /><Route path="applications/new" element={<ApplicationForm key="new" />} /><Route path="applications/:id/edit" element={<ApplicationForm key="edit" />} /><Route path="*" element={<div className="empty-state"><p className="eyebrow">404</p><h1>A small detour.</h1><p>This page doesn’t exist. Let’s get you back to your workspace.</p><Link className="btn btn-primary" to="/">Back to overview</Link></div>} /></Route></Route>
  </Routes></>;
}

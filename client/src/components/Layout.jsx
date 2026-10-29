import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, BriefcaseBusiness, CalendarDays, LogOut, Menu, X, ArrowUpRight, ChevronRight } from 'lucide-react';
import { Brand } from './UI';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { initials } from '../lib/format';

export default function Layout() {
  const { user, logout } = useAuth();
  const notify = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = event => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  const { pathname } = useLocation();
  const section = pathname.startsWith('/interviews') ? 'Interviews' : pathname.startsWith('/applications') ? 'Applications' : 'Overview';
  async function signOut() { setBusy(true); try { await logout(); } catch (error) { notify(error.message, 'error'); } finally { setBusy(false); } }
  return <div className="app-shell">
    {open && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="sidebar-brand"><Brand /><button className="mobile-close icon-button" aria-label="Close navigation" onClick={() => setOpen(false)}><X size={20} /></button></div>
      <p className="nav-label">YOUR WORKSPACE</p>
      <nav aria-label="Main navigation">
        {[['/', 'Overview', LayoutDashboard], ['/applications', 'Applications', BriefcaseBusiness], ['/interviews', 'Interviews', CalendarDays]].map(([to, label, Icon]) => <NavLink key={to} end={to === '/'} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={19} /><span>{label}</span>{label === 'Overview' && <span className="nav-active-dot" />}</NavLink>)}
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-tip"><span className="tip-icon"><ArrowUpRight size={21} /></span><h3>Small steps. Big moves.</h3><p>Every application is a new possibility. Keep showing up.</p><span className="tip-line" /></div>
      <div className="sidebar-user"><span className="avatar">{initials(user.name)}</span><div><strong>{user.name}</strong><span>Personal workspace</span></div><button className="icon-button" title="Sign out" aria-label="Sign out" disabled={busy} onClick={signOut}><LogOut size={18} /></button></div></div>
    </aside>
    <div className="main-shell"><header className="topbar"><div className="flex items-center gap-3"><button className="mobile-menu icon-button" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={21} /></button><span className="breadcrumb-parent">Workspace</span><ChevronRight size={14} className="text-slate-400" /><span className="breadcrumb-current">{section}</span></div><div className="topbar-right"><span className="today-date"><CalendarDays size={15} />{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span><span className="topbar-divider" /><span className="avatar avatar-small" title={user.name}>{initials(user.name)}</span></div></header>
    <main id="main-content" className="main-content"><Outlet /></main><footer className="app-footer"><span>A little more organized. A little closer to your next role.</span><span>Made for your next chapter <ArrowUpRight size={13} /></span></footer></div>
  </div>;
}

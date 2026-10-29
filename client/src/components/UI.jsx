import { ArrowUpRight, AlertCircle, Inbox, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { statusClass } from '../lib/format';

export function Brand() { return <Link className="brand" to="/"><span className="brand-mark"><ArrowUpRight size={25} strokeWidth={2.6} /></span>ApplyTrack<span className="brand-dot">.</span></Link>; }
export function Spinner({ label = 'Loading your workspace…' }) { return <div className="loading-state" role="status"><LoaderCircle className="animate-spin" size={25} /><span>{label}</span></div>; }
export function ErrorState({ error, retry }) { return <div className="error-state" role="alert"><AlertCircle size={25} /><h3>Something needs a quick check</h3><p>{error.message}</p>{retry && <button className="btn btn-secondary" onClick={retry}>Try again</button>}</div>; }
export function EmptyState({ title = 'A fresh start, full of possibilities', text = 'Add your first application and take the next step toward your next role.', filtered = false, onClear }) { return <div className="empty-state"><span className="empty-icon"><Inbox size={28} /></span><h3>{title}</h3><p>{text}</p>{filtered ? <button className="btn btn-secondary" onClick={onClear}>Clear filters</button> : <Link className="btn btn-primary" to="/applications/new">Add an application <ArrowUpRight size={16} /></Link>}</div>; }
export function StatusBadge({ status }) { return <span className={`status-badge ${statusClass(status)}`}><span />{status}</span>; }
export function PageHeading({ eyebrow, title, description, action }) { return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div>; }
export function Field({ label, id, error, children, hint, className = '' }) { return <div className={`field ${className}`}><label htmlFor={id}>{label}</label>{children}{error ? <span id={`${id}-error`} className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}</div>; }

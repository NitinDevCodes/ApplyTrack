import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin, LoaderCircle } from 'lucide-react';
import { StatusBadge } from './UI';
import { STATUSES, statusClass, initials, formatDate, formatInterview } from '../lib/format';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

export default function ApplicationTable({ applications, onUpdate, compact = false, interviews = false }) {
  const [pending, setPending] = useState(null);
  const notify = useToast();
  async function changeStatus(application, status) {
    setPending(application._id);
    try { await api(`/applications/${application._id}`, { method: 'PATCH', body: { status } }); notify(`Moved ${application.company} to ${status.toLowerCase()}.`); onUpdate(); }
    catch (error) { notify(error.message, 'error'); }
    finally { setPending(null); }
  }
  return <div className="table-scroll"><table className="application-table"><thead><tr><th>Company & role</th>{!compact && <th>Job type</th>}<th>Status</th><th>{interviews ? 'Interview date' : 'Date applied'}</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{applications.map((item, index) => <tr key={item._id}>
    <td><div className="company-cell"><span className={`company-logo logo-${index % 5}`}>{initials(item.company)}</span><div><Link className="company-name" to={`/applications/${item._id}/edit`}>{item.company}</Link><span className="job-title">{item.jobTitle}</span>{!compact && item.location && <span className="location"><MapPin size={11} />{item.location}</span>}</div></div></td>
    {!compact && <td><span className="type-tag">{item.jobType}</span></td>}
    <td>{compact ? <StatusBadge status={item.status} /> : <div className="status-select-wrap">{pending === item._id ? <LoaderCircle size={16} className="animate-spin" /> : <span className={`select-dot ${statusClass(item.status)}`} />}<select className={`status-select ${statusClass(item.status)}`} aria-label={`Status for ${item.company}`} value={item.status} disabled={pending !== null} onChange={event => changeStatus(item, event.target.value)}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></div>}</td>
    <td className="date-cell">{interviews ? formatInterview(item.interviewDate) : formatDate(item.applicationDate)}</td><td><Link className="table-action" title={`Edit ${item.company}`} aria-label={`Edit ${item.company}`} to={`/applications/${item._id}/edit`}><ArrowUpRight size={18} /></Link></td>
  </tr>)}</tbody></table></div>;
}

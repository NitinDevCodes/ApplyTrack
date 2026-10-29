import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, CalendarDays, FileText, LoaderCircle, Save, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { JOB_TYPES, STATUSES, today, toLocalInput } from '../lib/format';
import { Field, PageHeading, Spinner, ErrorState } from '../components/UI';
import { useToast } from '../context/ToastContext';

const emptyForm = () => ({ company: '', jobTitle: '', jobType: 'Internship', location: '', applicationUrl: '', salary: '', applicationDate: today(), interviewDate: '', status: 'Applied', notes: '' });
export default function ApplicationForm() {
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const notify = useToast();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(edit);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [retry, setRetry] = useState(0);
  const dialog = useRef(null);
  useEffect(() => {
    if (!id) { setForm(emptyForm()); setLoading(false); return; }
    const controller = new AbortController(); setLoading(true); setLoadError(null);
    api(`/applications/${id}`, { signal: controller.signal }).then(({ application }) => {
      if (controller.signal.aborted) return;
      const values = Object.fromEntries(Object.keys(emptyForm()).map(key => [key, application[key] ?? '']));
      setForm({ ...values, applicationDate: application.applicationDate.slice(0, 10), interviewDate: toLocalInput(application.interviewDate) });
    }).catch(error => { if (!controller.signal.aborted) setLoadError(error); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, retry]);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const body = { ...form, interviewDate: form.interviewDate ? new Date(form.interviewDate).toISOString() : null };
      await api(edit ? `/applications/${id}` : '/applications', { method: edit ? 'PATCH' : 'POST', body });
      notify(edit ? 'Application updated. You’re all caught up.' : 'Application added. One step closer!'); navigate('/applications');
    } catch (error) { setError(error); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    finally { setBusy(false); }
  }
  async function remove() {
    setDeleting(true);
    try { await api(`/applications/${id}`, { method: 'DELETE' }); dialog.current.close(); notify('Application deleted.'); navigate('/applications'); }
    catch (error) { dialog.current.close(); notify(error.message, 'error'); }
    finally { setDeleting(false); }
  }
  function props(key) {
    const update = event => {
      const value = event.currentTarget.value;
      setForm(previous => ({ ...previous, [key]: value }));
    };
    return { id: key, name: key, value: form[key], onChange: update, ...(['applicationDate', 'interviewDate'].includes(key) ? { onInput: update } : {}), 'aria-invalid': !!error?.errors?.[key], 'aria-describedby': error?.errors?.[key] ? `${key}-error` : undefined };
  }
  function field(key, label, input, extra = {}) { return <Field id={key} label={label} error={error?.errors?.[key]} {...extra}>{input}</Field>; }
  return <><Link className="back-link" to="/applications"><ArrowLeft size={16} />Back to applications</Link><PageHeading eyebrow={edit ? 'KEEP YOUR MOMENTUM' : 'A NEW POSSIBILITY'} title={edit ? 'The next step starts here.' : 'Let’s add an opportunity.'} description={edit ? 'Update the details, capture your notes, and keep moving.' : 'The details today. A little more clarity tomorrow.'} />
  {loading ? <Spinner /> : loadError ? <ErrorState error={loadError} retry={() => setRetry(value => value + 1)} /> : <div className="form-layout"><form className="panel application-form" onSubmit={submit}>{error && <div className="form-alert m-6" role="alert">{error.message}{error.errors?.form && ` ${error.errors.form}`}</div>}<fieldset disabled={busy || deleting}><section className="form-section"><div className="form-section-title"><span><BriefcaseBusiness size={19} /></span><div><h2>The opportunity</h2><p>Tell us where you’re making your next move.</p></div></div><div className="form-grid">
  {field('company', 'Company name *', <input {...props('company')} placeholder="e.g. Notion" required maxLength={100} />)}
  {field('jobTitle', 'Job title *', <input {...props('jobTitle')} placeholder="e.g. Frontend Developer Intern" required maxLength={120} />)}
  {field('jobType', 'Job type', <select {...props('jobType')}>{JOB_TYPES.map(type => <option key={type}>{type}</option>)}</select>)}
  {field('location', 'Location', <input {...props('location')} placeholder="e.g. Bengaluru / Remote" maxLength={120} />)}
  {field('applicationUrl', 'Application URL', <input {...props('applicationUrl')} type="url" placeholder="https://company.com/careers/role" maxLength={2000} />, { className: 'full-width' })}
  {field('salary', 'Salary / stipend', <input {...props('salary')} placeholder="e.g. ₹25,000/month or $60,000/year" maxLength={100} />, { className: 'full-width', hint: 'Include the currency and pay period, if known.' })}
  </div></section><section className="form-section"><div className="form-section-title"><span><CalendarDays size={19} /></span><div><h2>The next steps</h2><p>Keep the dates and the details in one place.</p></div></div><div className="form-grid">
  {field('status', 'Status', <select {...props('status')}>{STATUSES.map(status => <option key={status}>{status}</option>)}</select>)}
  {field('applicationDate', 'Application date *', <input {...props('applicationDate')} type="date" required />, { hint: 'For saved roles, use the date you saved the opportunity.' })}
  {field('interviewDate', 'Interview date & time', <input {...props('interviewDate')} type="datetime-local" />, { className: 'full-width', hint: 'Optional. Enter your local time. Choose Interview status to show upcoming dates on your dashboard.' })}
  </div></section><section className="form-section"><div className="form-section-title"><span><FileText size={19} /></span><div><h2>Make a note</h2><p>Anything your future self will thank you for.</p></div></div>{field('notes', 'Notes', <textarea {...props('notes')} rows={5} placeholder="Recruiter details, interview preparation, follow-up reminders…" maxLength={5000} />, { hint: `${form.notes.length.toLocaleString()} / 5,000 characters` })}</section><div className="form-actions"><Link to="/applications" className="btn btn-secondary">Cancel</Link><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}{busy ? 'Saving…' : edit ? 'Save changes' : 'Add application'}</button></div></fieldset></form><aside className="form-aside"><div className="form-advice"><span className="advice-icon"><ArrowUpRight size={26} /></span><h3>A little detail goes a long way.</h3><p>Capture the essentials now. You can always come back and fill in the rest.</p><div className="advice-divider" /><strong>Your quick checklist</strong><ul><li>The company and role</li><li>Where things stand</li><li>Any dates to remember</li><li>A note for your future self</li></ul></div>{edit && <div className="danger-card"><h3>Done with this opportunity?</h3><p>Withdraw it using the status field, or permanently delete it below.</p><button type="button" className="btn btn-danger-light" onClick={() => dialog.current.showModal()} disabled={busy}><Trash2 size={16} />Delete application</button></div>}</aside></div>}
  <dialog ref={dialog} className="confirm-dialog" onCancel={event => { if (deleting) event.preventDefault(); }} aria-labelledby="delete-title"><button className="dialog-close icon-button" aria-label="Close dialog" disabled={deleting} onClick={() => dialog.current.close()}><X size={18} /></button><span className="delete-icon"><Trash2 size={24} /></span><h2 id="delete-title">Delete this application?</h2><p>Your application to <strong>{form.company}</strong> and its notes will be permanently removed.</p><div className="dialog-actions"><button className="btn btn-secondary" autoFocus disabled={deleting} onClick={() => dialog.current.close()}>Keep application</button><button className="btn btn-danger" disabled={deleting} onClick={remove}>{deleting ? 'Deleting…' : 'Delete application'}</button></div></dialog>
  </>;
}

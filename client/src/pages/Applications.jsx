import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, SlidersHorizontal, ArrowDownWideNarrow, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useApi, useDebounce } from '../hooks/useApi';
import { STATUSES } from '../lib/format';
import { PageHeading, Spinner, ErrorState, EmptyState } from '../components/UI';
import ApplicationTable from '../components/ApplicationTable';

export default function Applications({ interviews = false }) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const debouncedSearch = useDebounce(search);
  const status = interviews ? 'Interview' : STATUSES.includes(params.get('status')) ? params.get('status') : '';
  const sort = params.get('sort') === 'oldest' ? 'oldest' : 'newest';
  const page = Math.max(1, Number(params.get('page')) || 1);
  useEffect(() => { setSearch(params.get('search') || ''); }, [params.get('search')]);
  useEffect(() => {
    if (debouncedSearch !== (params.get('search') || '')) setParams(previous => { const next = new URLSearchParams(previous); if (debouncedSearch) next.set('search', debouncedSearch); else next.delete('search'); next.delete('page'); return next; }, { replace: true });
  }, [debouncedSearch]);
  const query = new URLSearchParams({ search: params.get('search') || '', sort, page: String(page), ...(status ? { status } : {}) });
  const { data, loading, error, refresh } = useApi(`/applications?${query}`);
  function change(key, value) { setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); if (key !== 'page') next.delete('page'); return next; }); }
  function reset() { setSearch(''); setParams({}); }
  function afterUpdate() { if (data?.applications.length === 1 && page > 1) change('page', String(page - 1)); else refresh(); }
  const filtered = Boolean(search || (!interviews && status));
  return <><PageHeading eyebrow="YOUR OPPORTUNITIES" title={interviews ? 'Make a great first impression.' : 'One place. Every possibility.'} description={interviews ? 'Manage your interviews, preparation notes, and next steps.' : 'Stay on top of every application, from saved to signed.'} action={<Link className="btn btn-primary" to="/applications/new"><Plus size={17} />Add application</Link>} />
    <section className="panel applications-panel"><div className="panel-heading"><div><h2>{interviews ? 'Interviews' : 'All applications'}{data && <span className="count-chip">{data.pagination.total}</span>}</h2><p>{interviews ? 'Scheduled, unscheduled, and past interviews. Times are shown in your timezone.' : 'Your career journey, organized.'}</p></div></div>
    <div className="filter-bar"><div className="search-field"><Search size={18} /><input aria-label="Search by company or job title" placeholder="Search company or job title…" value={search} maxLength={100} onChange={event => setSearch(event.target.value)} />{search && <button aria-label="Clear search" onClick={() => setSearch('')}><X size={15} /></button>}</div><div className="filter-controls">{!interviews && <label className="filter-select"><SlidersHorizontal size={15} /><select aria-label="Filter by status" value={status} onChange={event => change('status', event.target.value)}><option value="">All statuses</option>{STATUSES.map(status => <option key={status}>{status}</option>)}</select></label>}<label className="filter-select"><ArrowDownWideNarrow size={16} /><select aria-label="Sort by application date" value={sort} onChange={event => change('sort', event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div></div>
    {loading ? <Spinner label="Finding your opportunities…" /> : error ? <ErrorState error={error} retry={refresh} /> : data.applications.length ? <><ApplicationTable applications={data.applications} onUpdate={afterUpdate} interviews={interviews} /><div className="pagination"><span>Showing {(page - 1) * data.pagination.limit + 1}–{Math.min(page * data.pagination.limit, data.pagination.total)} of {data.pagination.total} applications</span><div><button className="pagination-button" disabled={page <= 1} onClick={() => change('page', String(page - 1))} aria-label="Previous page"><ChevronLeft size={17} /></button><span>{page} / {data.pagination.pages}</span><button className="pagination-button" disabled={page >= data.pagination.pages} onClick={() => change('page', String(page + 1))} aria-label="Next page"><ChevronRight size={17} /></button></div></div></> : <EmptyState filtered={filtered || page > 1} onClear={reset} title={filtered || page > 1 ? 'No matching opportunities' : interviews ? 'Your next conversation is ahead' : undefined} text={filtered || page > 1 ? 'Try a different search or clear your filters to see all applications.' : interviews ? 'Change an application to Interview and add a date to start preparing.' : undefined} />}
    </section><div className="below-table-note"><span className="note-dot" />{interviews ? 'Tip: open an application to add your interview time and preparation notes.' : 'A new update? Change a status right from the table.'}</div>
  </>;
}

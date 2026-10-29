import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, Eye, EyeOff, LoaderCircle, Sparkles } from 'lucide-react';
import { Brand, Field } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function Auth({ register = false }) {
  const { user, authenticate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  if (user) return <Navigate to="/" replace />;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(null);
    try { await authenticate(register ? 'register' : 'login', register ? form : { email: form.email, password: form.password }); const from = location.state?.from; navigate(typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/', { replace: true }); }
    catch (error) { setError(error); }
    finally { setBusy(false); }
  }
  function inputProps(key) { return { id: key, name: key, value: form[key], onChange: event => setForm({ ...form, [key]: event.target.value }), 'aria-invalid': !!error?.errors?.[key], 'aria-describedby': error?.errors?.[key] ? `${key}-error` : undefined }; }
  return <div className="auth-layout"><aside className="auth-story"><Brand /><div className="auth-story-content"><span className="auth-kicker"><Sparkles size={15} />A LITTLE CLARITY. A LOT OF POSSIBILITY.</span><h1>Your next chapter,<br /><em>organized.</em></h1><p>From the first application to the offer you’ve been waiting for. Make every step count.</p><div className="auth-journey"><div className="journey-line" />{[['01', 'Find your opportunity', 'Save the roles that feel like you.'], ['02', 'Make your move', 'Track applications and interviews.'], ['03', 'Start something great', 'Celebrate the next chapter.']].map(([number, title, text]) => <div className="journey-step" key={number}><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div></div>)}</div></div><div className="auth-story-footer"><span className="mini-brand"><ArrowUpRight size={16} /></span>Small steps today. Big possibilities tomorrow.</div><div className="auth-decoration" aria-hidden="true" /></aside>
    <main id="main-content" className="auth-main"><div className="auth-mobile-brand"><Brand /></div><div className="auth-top-link">{register ? 'Already have an account?' : 'New to ApplyTrack?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Get started'} <ArrowUpRight size={14} /></Link></div><div className="auth-form-wrap"><span className="auth-form-icon"><ArrowUpRight size={27} /></span><p className="eyebrow">YOUR PERSONAL CAREER WORKSPACE</p><h2>{register ? 'Make room for what’s next.' : 'Welcome back.'}</h2><p className="auth-description">{register ? 'Create your account. Your next opportunity starts here.' : 'Good to see you. Let’s keep your momentum going.'}</p><form onSubmit={submit} className="auth-form">{error && <div className="form-alert" role="alert">{error.message}</div>}
    {register && <Field label="Full name" id="name" error={error?.errors?.name}><input {...inputProps('name')} placeholder="Your name" autoComplete="name" required minLength={2} maxLength={60} /></Field>}
    <Field label="Email address" id="email" error={error?.errors?.email}><input {...inputProps('email')} type="email" placeholder="you@example.com" autoComplete="email" required maxLength={254} /></Field>
    <Field label="Password" id="password" error={error?.errors?.password} hint={register ? 'At least 8 characters. Make it something unique.' : undefined}><div className="password-input"><input {...inputProps('password')} type={showPassword ? 'text' : 'password'} placeholder={register ? 'Create a strong password' : 'Enter your password'} autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : undefined} required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></Field>
    <button className="btn btn-primary auth-submit" disabled={busy}>{busy ? <LoaderCircle size={18} className="animate-spin" /> : null}{busy ? 'Just a moment…' : register ? 'Create your account' : 'Sign in to your workspace'}{!busy && <ArrowRight size={18} />}</button></form><div className="auth-assurance"><Check size={14} />Your applications. Your private workspace.</div></div><div className="auth-bottom">A little more organized. A little closer to your next role.</div></main></div>;
}

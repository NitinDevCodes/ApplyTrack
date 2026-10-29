import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  async function load() {
    setLoading(true); setError(null);
    try { const data = await api('/auth/me'); setUser(data.user); }
    catch (error) { if (error.status === 401) setUser(null); else setError(error); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    load();
    const expire = () => setUser(null);
    window.addEventListener('session-expired', expire);
    return () => window.removeEventListener('session-expired', expire);
  }, []);
  async function authenticate(mode, body) { const data = await api(`/auth/${mode}`, { method: 'POST', body }); setUser(data.user); }
  async function logout() { try { await api('/auth/logout', { method: 'POST' }); } catch (error) { if (error.status !== 401) throw error; } setUser(null); }
  return <AuthContext.Provider value={{ user, loading, error, retry: load, authenticate, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);

const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export async function api(path, { body, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${base}${path}`, { ...options, credentials: 'include', headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...options.headers }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Cannot reach the server. Check that the API is running and try again.');
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({ message: 'The server returned an unexpected response. Please try again.' }));
  if (!response.ok) {
    const error = Object.assign(new Error(data.message || 'Request failed.'), { status: response.status, errors: data.errors });
    if (response.status === 401 && !['/auth/login', '/auth/register', '/auth/me'].includes(path)) window.dispatchEvent(new Event('session-expired'));
    throw error;
  }
  return data;
}

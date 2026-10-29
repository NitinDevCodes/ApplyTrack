import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    api(path, { signal: controller.signal }).then(data => { if (!controller.signal.aborted) setState({ data, loading: false, error: null }); }).catch(error => { if (!controller.signal.aborted) setState({ data: null, loading: false, error }); });
    return () => controller.abort();
  }, [path, version]);
  return { ...state, refresh };
}
export function useDebounce(value, delay = 300) {
  const [result, setResult] = useState(value);
  useEffect(() => { const timer = setTimeout(() => setResult(value), delay); return () => clearTimeout(timer); }, [value, delay]);
  return result;
}

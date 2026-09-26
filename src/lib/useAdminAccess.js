import { useCallback, useEffect, useRef, useState } from 'react';
import { getSupabaseFunctionHeaders, readResponsePayload } from './adminPostEditor';

const SESSION_KEY = 'ajt3_admin_secret';

export default function useAdminAccess() {
  const [password, setPassword] = useState('');
  const [session, setSession] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');
  const requestRef = useRef(null);
  const serviceUrl = process.env.REACT_APP_SUPABASE_URL?.trim().replace(/\/+$/, '');

  const authenticate = useCallback(async (secret) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setIsChecking(true);
    setError('');

    try {
      if (!serviceUrl) throw new Error('Admin sign-in is unavailable right now. Please try again later.');
      if (!secret) throw new Error('Enter your admin password to continue.');

      let response;
      let payload;
      try {
        response = await fetch(`${serviceUrl}/functions/v1/admin-blog-post`, {
          method: 'POST',
          headers: getSupabaseFunctionHeaders({ json: true }),
          body: JSON.stringify({ action: 'list', adminSecret: secret }),
          signal: controller.signal
        });
        payload = await readResponsePayload(response);
      } catch {
        throw new Error("We couldn't verify your password because the sign-in service is unavailable. Please try again later.");
      }
      if (controller.signal.aborted) return;
      if (response.status === 404 || response.status >= 500) throw new Error('Admin sign-in is temporarily unavailable. Please try again later.');
      if (response.status === 401 || response.status === 403) throw new Error('That password was not accepted. Please try again.');
      if (!response.ok || !Array.isArray(payload.data?.posts)) throw new Error("We couldn't complete sign-in. Please try again.");

      setSession({ secret, posts: payload.data.posts });
      setPassword('');
    } catch (failure) {
      if (controller.signal.aborted) return;
      setSession(null);
      setError(failure.message || 'Unable to sign in. Please try again.');
      try {
        window.sessionStorage.removeItem(SESSION_KEY);
      } catch {
        // A stored password never grants access without server verification.
      }
    } finally {
      if (!controller.signal.aborted) setIsChecking(false);
    }
  }, [serviceUrl]);

  useEffect(() => () => requestRef.current?.abort(), []);

  function login(event) {
    event.preventDefault();
    authenticate(password);
  }

  function logout() {
    requestRef.current?.abort();
    setSession(null);
    setPassword('');
    setError('');
    setIsChecking(false);
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // The current app is locked even if browser storage is unavailable.
    }
  }

  async function refreshPosts() {
    if (!session) return;
    const secret = session.secret;
    const response = await fetch(`${serviceUrl}/functions/v1/admin-blog-post`, {
      method: 'POST',
      headers: getSupabaseFunctionHeaders({ json: true }),
      body: JSON.stringify({ action: 'list', adminSecret: secret })
    });
    const payload = await readResponsePayload(response);
    if (!response.ok || !Array.isArray(payload.data?.posts)) throw new Error('Unable to refresh posts. Please retry.');
    setSession((current) => current?.secret === secret ? { ...current, posts: payload.data.posts } : current);
  }

  return { session, password, setPassword, isChecking, error, login, logout, refreshPosts, isConfigured: Boolean(serviceUrl) };
}

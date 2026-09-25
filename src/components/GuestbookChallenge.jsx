import React, { useEffect, useRef, useState } from 'react';

let scriptPromise;
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    const fail = () => { clearTimeout(timeout); script.remove(); scriptPromise = null; reject(new Error('Bot check could not load.')); };
    const timeout = setTimeout(fail, 15000);
    script.onerror = fail;
    script.onload = () => {
      clearTimeout(timeout);
      if (window.turnstile) resolve(window.turnstile);
      else fail();
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function GuestbookChallenge({ sitekey, onToken, resetKey }) {
  const container = useRef(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let mounted = true;
    let widget;
    let api;
    onToken('');
    setError('');
    loadTurnstile().then((loaded) => {
      if (!mounted) return;
      api = loaded;
      widget = api.render(container.current, {
        sitekey, action: 'guestbook', theme: 'dark', size: container.current.clientWidth < 300 ? 'compact' : 'flexible',
        callback: (token) => { if (mounted) { onToken(token); setError(''); } },
        'expired-callback': () => { if (mounted) onToken(''); },
        'error-callback': () => { if (mounted) { onToken(''); setError('Bot check failed. Please retry.'); } }
      });
    }).catch(() => { if (mounted) setError('Bot check could not load. Check your connection or content blocker.'); });
    return () => { mounted = false; if (widget !== undefined) api.remove(widget); };
  }, [sitekey, onToken, resetKey, retry]);
  return <div className="guestbook__challenge"><div ref={container} />{error && <p role="alert">{error} <button type="button" onClick={() => setRetry((value) => value + 1)}>Retry bot check</button></p>}</div>;
}

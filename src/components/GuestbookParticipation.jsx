import React, { useEffect, useRef, useState } from 'react';
import { guestbookTerms } from '../data/guestbookTerms';
import { privacyPolicy } from '../data/privacyPolicy';
import GuestbookChallenge from './GuestbookChallenge';
import { verifyGuestbook } from '../lib/guestbook';

export function areGuestbookTermsPublished() {
  return typeof guestbookTerms.version === 'string' && Boolean(guestbookTerms.version.trim())
    && typeof guestbookTerms.content === 'string' && Boolean(guestbookTerms.content.trim());
}

export function canParticipate(participant) {
  return areGuestbookTermsPublished() && typeof participant?.name === 'string'
    && participant.name.trim().length > 0 && participant.name.trim().length <= 40
    && participant.ageConfirmed === true && participant.termsAccepted === true
    && participant.termsVersion === guestbookTerms.version;
}

export default function GuestbookParticipation({ participant, onContinue, blockedMessage = '', session }) {
  const heading = useRef(null);
  const [name, setName] = useState(participant?.name || '');
  const [ageConfirmed, setAgeConfirmed] = useState(canParticipate(participant));
  const [termsAccepted, setTermsAccepted] = useState(canParticipate(participant));
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [challengeKey, setChallengeKey] = useState(0);
  const controller = useRef(null);
  const published = areGuestbookTermsPublished();
  const nextParticipant = { name: name.trim(), ageConfirmed, termsAccepted, termsVersion: guestbookTerms.version };
  const sitekey = process.env.REACT_APP_TURNSTILE_SITE_KEY;
  const sessionReady = Boolean(session?.token && session.expiresAt > Date.now());
  const ready = canParticipate(nextParticipant) && (sessionReady || Boolean(sitekey && token)) && !blockedMessage && !verifying;

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => () => controller.current?.abort(), []);

  async function continueToMessages(event) {
    event.preventDefault();
    if (!ready) return;
    if (sessionReady) { onContinue(nextParticipant, session); return; }
    const pending = new AbortController();
    controller.current = pending;
    setVerifying(true); setError('');
    try {
      const result = await verifyGuestbook(nextParticipant, token, pending.signal);
      if (pending.signal.aborted) return;
      if (typeof result.session !== 'string' || !result.session || !Number.isFinite(result.expiresAt) || result.expiresAt <= Date.now()) throw new Error('Verification could not be confirmed. Please retry.');
      onContinue(nextParticipant, { token: result.session, expiresAt: result.expiresAt });
    } catch (failure) {
      if (!pending.signal.aborted) setError(failure.message);
    } finally {
      if (!pending.signal.aborted) { setVerifying(false); setToken(''); setChallengeKey((value) => value + 1); }
    }
  }

  return <form className="guestbook-messages__participation" aria-labelledby="guestbook-join-title" onSubmit={continueToMessages}>
    <h2 id="guestbook-join-title" ref={heading} tabIndex={-1}>Before you join</h2>
    <p>Enter a display name, confirm both requirements, and complete the bot check to open the conversations.</p>
    <label className="guestbook-messages__join-name" htmlFor="guestbook-display-name">Display name</label>
    <input id="guestbook-display-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required autoComplete="nickname" aria-describedby="guestbook-name-notice" placeholder="What should we call you?" />
    <p id="guestbook-name-notice" className="guestbook-messages__join-hint">Your display name and messages will be public.</p>
    {published ? <details className="guestbook-messages__terms"><summary>Read the Terms and Conditions</summary><p>{guestbookTerms.content}</p><small>Version: {guestbookTerms.version}</small></details> : <p className="guestbook-messages__terms-pending" role="status">Terms and Conditions are being prepared. Message entry will open once they are published.</p>}
    <details className="guestbook-messages__terms"><summary>Read the Privacy Policy</summary><p>{privacyPolicy.content}</p><small>Version: {privacyPolicy.version}</small></details>
    <fieldset className="guestbook-messages__agreements">
      <legend className="sr-only">Requirements to join</legend>
      <label className="guestbook-messages__agreement"><input type="checkbox" required checked={ageConfirmed} onChange={(event) => setAgeConfirmed(event.target.checked)} /><span>I confirm that I am at least 18 years old.</span></label>
      <label className="guestbook-messages__agreement"><input type="checkbox" required disabled={!published} checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} /><span>I have read and agree to the Terms and Conditions.</span></label>
    </fieldset>
    {sessionReady ? <p className="guestbook-messages__join-hint">Your bot verification is still active.</p> : sitekey ? <>
      <GuestbookChallenge sitekey={sitekey} onToken={setToken} resetKey={challengeKey} appearance="always" />
      <p className="guestbook-messages__join-hint" role="status">{token ? 'Bot check complete.' : 'Complete the Cloudflare verification to continue.'}</p>
    </> : null}
    {blockedMessage && <p role="alert">{blockedMessage}</p>}
    {error && <p role="alert">{error}</p>}
    <button type="submit" disabled={!ready}>{verifying ? 'Verifying...' : 'Continue to messages'}</button>
    <p className="guestbook-messages__join-hint">Age is self-declared. No date of birth or ID is collected.</p>
  </form>;
}

import React, { useEffect, useRef, useState } from 'react';
import { guestbookTerms } from '../data/guestbookTerms';
import { privacyPolicy } from '../data/privacyPolicy';
import GuestbookChallenge from './GuestbookChallenge';

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

export default function GuestbookParticipation({ participant, onContinue, blockedMessage = '', token, onToken }) {
  const heading = useRef(null);
  const [name, setName] = useState(participant?.name || '');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const published = areGuestbookTermsPublished();
  const nextParticipant = { name: name.trim(), ageConfirmed, termsAccepted, termsVersion: guestbookTerms.version };
  const sitekey = process.env.REACT_APP_TURNSTILE_SITE_KEY;
  const ready = canParticipate(nextParticipant) && Boolean(sitekey && token) && !blockedMessage;

  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);

  function continueToMessages(event) {
    event.preventDefault();
    if (ready) onContinue(nextParticipant);
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
    {sitekey ? <>
      <GuestbookChallenge sitekey={sitekey} onToken={onToken} appearance="always" />
      <p className="guestbook-messages__join-hint" role="status">{token ? 'Bot check complete.' : 'Complete the Cloudflare verification to continue.'}</p>
    </> : <p role="status">Joining is unavailable until spam protection is configured.</p>}
    {blockedMessage && <p role="alert">{blockedMessage}</p>}
    <button type="submit" disabled={!ready}>Continue to messages</button>
    <p className="guestbook-messages__join-hint">Age is self-declared. No date of birth or ID is collected.</p>
  </form>;
}

import React, { useState } from 'react';
import { guestbookTerms } from '../data/guestbookTerms';

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

export default function GuestbookParticipation({ participant, onContinue, blockedMessage = '' }) {
  const [name, setName] = useState(participant?.name || '');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const published = areGuestbookTermsPublished();
  const nextParticipant = { name: name.trim(), ageConfirmed, termsAccepted, termsVersion: guestbookTerms.version };
  const ready = canParticipate(nextParticipant) && !blockedMessage;

  function continueToMessages(event) {
    event.preventDefault();
    if (ready) onContinue(nextParticipant);
  }

  return <form className="guestbook-messages__participation" aria-labelledby="guestbook-join-title" onSubmit={continueToMessages}>
    <h3 id="guestbook-join-title">Before you join</h3>
    <p>Introduce yourself and confirm the requirements below to write a message. You can still read the conversations without joining.</p>
    <label className="guestbook-messages__join-name" htmlFor="guestbook-display-name">Display name</label>
    <input id="guestbook-display-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} required autoComplete="nickname" aria-describedby="guestbook-name-notice" placeholder="How should we call you?" />
    <p id="guestbook-name-notice" className="guestbook-messages__join-hint">Your display name and messages will be public.</p>
    <label className="guestbook-messages__agreement"><input type="checkbox" required checked={ageConfirmed} onChange={(event) => setAgeConfirmed(event.target.checked)} /><span>I confirm that I am at least 18 years old.</span></label>
    {published ? <details className="guestbook-messages__terms"><summary>Read the Terms and Conditions</summary><p>{guestbookTerms.content}</p><small>Version: {guestbookTerms.version}</small></details> : <p className="guestbook-messages__terms-pending" role="status">Terms and Conditions are being prepared. Message entry will open once they are published.</p>}
    <label className="guestbook-messages__agreement"><input type="checkbox" required disabled={!published} checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} /><span>I have read and agree to the Terms and Conditions.</span></label>
    {blockedMessage && <p role="alert">{blockedMessage}</p>}
    <button type="submit" disabled={!ready}>Continue to messages</button>
    <p className="guestbook-messages__join-hint">The age confirmation is a self-declaration. We do not collect your date of birth or identity documents.</p>
  </form>;
}

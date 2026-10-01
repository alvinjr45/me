import React, { useMemo, useState } from 'react';
import './Mail.css';

export const MAIL_RECIPIENT = 'alvinjr15@gmail.com';
export const DEFAULT_MAIL_SUBJECT = "Let's connect";
export const DEFAULT_MAIL_BODY = `Hi AJ,

I came across your website and would love to connect. It would be great to learn more about your work and find a time to chat.

Best,`;

function Mail() {
  const [subject, setSubject] = useState(DEFAULT_MAIL_SUBJECT);
  const [body, setBody] = useState(DEFAULT_MAIL_BODY);
  const mailto = useMemo(() => (
    `mailto:${MAIL_RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  ), [body, subject]);

  return (
    <main className="mail-app">
      <header className="mail-compose__toolbar">
        <span className="mail-compose__done" aria-hidden="true">Cancel</span>
        <h1>New Message</h1>
        <a className="mail-compose__send" href={mailto} aria-label={`Send email to ${MAIL_RECIPIENT}`} title="Open in your mail app">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="m12 20V5m-6 6 6-6 6 6" />
          </svg>
        </a>
      </header>

      <section className="mail-compose" aria-label="Email composer">
        <div className="mail-compose__field">
          <label htmlFor="mail-to">To:</label>
          <input id="mail-to" type="email" value={MAIL_RECIPIENT} readOnly />
          <span className="mail-compose__add" aria-hidden="true">+</span>
        </div>
        <div className="mail-compose__field mail-compose__field--muted" aria-hidden="true">
          <span>Cc/Bcc, From:</span>
        </div>
        <div className="mail-compose__field">
          <label htmlFor="mail-subject">Subject:</label>
          <input id="mail-subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
        </div>
        <label className="sr-only" htmlFor="mail-body">Message</label>
        <textarea id="mail-body" value={body} onChange={(event) => setBody(event.target.value)} spellCheck="true" />
      </section>

    </main>
  );
}

export default Mail;

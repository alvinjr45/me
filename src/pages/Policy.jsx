import React from 'react';
import { Link } from 'react-router-dom';
import { guestbookTerms } from '../data/guestbookTerms';
import { privacyPolicy } from '../data/privacyPolicy';
import './Policy.css';

export default function Policy({ privacy = false }) {
  const policy = privacy ? privacyPolicy : guestbookTerms;
  return <main className="policy-page">
    <header><span>AJT3 / SITE POLICIES</span><h1>{privacy ? 'Privacy Policy' : 'Terms and Conditions'}</h1><p>Effective date: <time dateTime={policy.version}>{policy.version}</time></p></header>
    <nav aria-label="Site policies"><Link to="/terms" aria-current={!privacy ? 'page' : undefined}>Terms and Conditions</Link><Link to="/privacy" aria-current={privacy ? 'page' : undefined}>Privacy Policy</Link><Link to="/guestbook">Open guestbook</Link></nav>
    {policy.content.split('\n\n').map((section) => {
      const [heading, ...body] = section.split('\n');
      return <section key={heading}><h2>{heading}</h2><p>{body.join('\n')}</p></section>;
    })}
    <section><h2>Contact AJ Thompson</h2><p>For policy questions, guestbook reports, or removal requests, <a href="https://www.instagram.com/_ajt3_/" target="_blank" rel="noopener noreferrer">contact AJ on Instagram (opens in a new tab)</a>.</p></section>
    {privacy && <section><h2>Provider privacy notices</h2><ul>
      <li><a href="https://www.cloudflare.com/turnstile-privacy-policy/">Cloudflare Turnstile Privacy Addendum</a></li>
      <li><a href="https://supabase.com/privacy">Supabase Privacy Policy</a></li>
      <li><a href="https://www.apple.com/legal/privacy/">Apple Privacy Policy</a></li>
    </ul></section>}
  </main>;
}

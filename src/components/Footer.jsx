import React from 'react';
import './Footer.css';

const WEBSITE_URL = 'https://ajt3.website';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-cta">
        <div>
          <p className="footer-cta__pretitle">Still curious?</p>
          <h3 className="footer-cta__title">Let&apos;s prototype something bold.</h3>
          <p className="footer-cta__body">
            Toss me a line about a collab, review, or late-night tinkering session—
            I&apos;m in the lab and always listening.
          </p>
        </div>
        <a className="footer-cta__button" href={WEBSITE_URL}>
          Contact AJ
        </a>
      </div>
      <div className="footer-meta">
        <span>© {new Date().getFullYear()} AJ Thompson</span>
        <span>AJT3.Me • Software day, everything else night</span>
      </div>
    </footer>
  );
}

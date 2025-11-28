import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

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
        <Link className="footer-cta__button" to="/contactme">
          Contact AJ
        </Link>
      </div>
      <div className="footer-meta">
        <span>© {new Date().getFullYear()} AJ Thompson</span>
        <span>AJT3.Me • Software day, everything else night</span>
      </div>
    </footer>
  );
}

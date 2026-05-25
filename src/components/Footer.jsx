import React from 'react';
import HomeLink from './HomeLink';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-signoff">
        <p className="footer-signoff__name">AJT3.Me</p>
        <p className="footer-signoff__line">Built somewhere between a good playlist and a bad idea.</p>
      </div>

      <div className="footer-fineprint">
        <HomeLink className="home-link--compact">Home</HomeLink>
        <span>© {new Date().getFullYear()} AJ Thompson</span>
      </div>
    </footer>
  );
}

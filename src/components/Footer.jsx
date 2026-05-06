import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const WEBSITE_URL = 'https://ajt3.website';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-signoff">
        <p className="footer-signoff__name">AJT3.Me</p>
        <p className="footer-signoff__line">Built somewhere between a good playlist and a bad idea.</p>
      </div>

      <nav className="footer-links" aria-label="Footer navigation">
        <Link to="/blog">Blog</Link>
        <Link to="/music">Music</Link>
        <Link to="/dogs">Dogs</Link>
        <a href={WEBSITE_URL}>Contact</a>
      </nav>

      <div className="footer-fineprint">
        <span>© {new Date().getFullYear()} AJ Thompson</span>
      </div>
    </footer>
  );
}

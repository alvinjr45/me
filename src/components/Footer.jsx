import React from 'react';
import HomeLink from './HomeLink';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <HomeLink className="site-footer__mark">AJT3</HomeLink>
      <p>Built somewhere between a good playlist and a bad idea.</p>
      <div className="site-footer__status"><span></span>SYSTEM ONLINE / &copy; {new Date().getFullYear()}</div>
    </footer>
  );
}

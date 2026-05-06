// src/components/Navbar.js
import { React, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Optional: For custom styles

const WEBSITE_URL = 'https://ajt3.website';

function Navbar() {
  const [click, setClick] = useState(false);

  const navLinks = [
    { to: '/', label: '.me( )' },
    { to: '/blog', label: '.blog( )' },
    { to: '/dogs', label: '.meetDrakeAndJosh( )' },
    { to: '/music', label: '.music( )' }
  ];

  const handleClick = () => setClick((prev) => !prev);
  const closeMobileMenu = () => setClick(false);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 960 && click) {
        setClick(false);
      }
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [click]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <span className="brand-icon brand-icon--opening">&lt;&gt;</span>
          <span>AJT3.Me</span>
          <span className="brand-icon brand-icon--closing">&lt;/&gt;</span>
        </Link>
        <button
          className="navbar-toggle"
          onClick={handleClick}
          aria-label="Toggle navigation"
          aria-expanded={click}
          aria-controls="primary-navigation"
        >
          <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
        </button>
        <div id="primary-navigation" className={`nav-menu ${click ? 'nav-menu--open' : ''}`}>
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="nav-links" onClick={closeMobileMenu}>
              {link.label}
            </Link>
          ))}
          <a href={WEBSITE_URL} className="nav-links nav-links-contact" onClick={closeMobileMenu}>
            .contactMe( )
          </a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

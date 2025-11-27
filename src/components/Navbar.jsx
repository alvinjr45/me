// src/components/Navbar.js
import { React, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Optional: For custom styles

function Navbar() {
  const [click, setClick] = useState(false);

  const navLinks = [
    { to: '/', label: '.home( )' },
    { to: '/aboutme', label: '.aboutMe( )' },
    { to: '/dogs', label: '.meetDrakeAndJosh( )' },
    { to: '/techstuff', label: '.techStuff( )' },
    { to: '/music', label: '.music( )' },
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
          <i className="fa-solid fa-code brand-icon" />
          <span>AJT3.Me</span>
          <i className="fa-solid fa-code brand-icon" />
        </Link>
        <button className="navbar-toggle" onClick={handleClick} aria-label="Toggle navigation">
          <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
        </button>
        <div className={`nav-menu ${click ? 'nav-menu--open' : ''}`}>
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="nav-links" onClick={closeMobileMenu}>
              {link.label}
            </Link>
          ))}
          <Link to="/contactme" className="nav-links nav-links-contact" onClick={closeMobileMenu}>
            .contactMe( )
          </Link>
        </div>
      </div>
    </nav>
  );
}
export default Navbar;

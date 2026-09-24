import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import CommandTerminal from './CommandTerminal';
import './SiteHeader.css';

const navigation = [
  { label: 'Tech', to: '/tech' },
  { label: 'Music', to: '/music' },
  { label: 'Dogs', to: '/dogs' },
  { label: 'Blog', to: '/blog' }
];

function SiteHeader() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsTerminalOpen(false);
        setIsMenuOpen(false);
      }

      if (event.key === '`' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const tagName = document.activeElement?.tagName;

        if (tagName !== 'INPUT' && tagName !== 'TEXTAREA') {
          event.preventDefault();
          setIsTerminalOpen((current) => !current);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="site-header">
        <NavLink className="site-header__brand" to="/" aria-label="AJT3 home">
          <span className="site-header__brand-mark" aria-hidden="true">A/3</span>
          <span className="site-header__brand-copy">
            <strong>AJT3</strong>
            <small>personal.system</small>
          </span>
        </NavLink>

        <nav id="primary-navigation" className={`site-header__nav${isMenuOpen ? ' site-header__nav--open' : ''}`} aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) => (isActive ? 'site-header__link site-header__link--active' : 'site-header__link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header__actions">
          <button className="site-header__terminal-button" type="button" onClick={() => setIsTerminalOpen(true)}>
            <span aria-hidden="true">&gt;_</span>
            Terminal
            <kbd>`</kbd>
          </button>
          <button
            className="site-header__menu-button"
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {isTerminalOpen ? (
        <div className="terminal-modal" role="presentation" onClick={() => setIsTerminalOpen(false)}>
          <div className="terminal-modal__panel" role="dialog" aria-modal="true" aria-label="Site terminal" onClick={(event) => event.stopPropagation()}>
            <button className="terminal-modal__close" type="button" onClick={() => setIsTerminalOpen(false)} aria-label="Close terminal">
              Close <span aria-hidden="true">Esc</span>
            </button>
            <CommandTerminal autoFocus onNavigate={() => setIsTerminalOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}

export default SiteHeader;

import React, { useContext, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeviceSettingsContext } from './deviceSettings';
import './CommandTerminal.css';

const routes = {
  home: '/',
  tech: '/tech',
  music: '/music',
  dogs: '/dogs',
  blog: '/blog',
  photos: '/photos',
  calendar: '/calendar',
  terminal: '/terminal',
  settings: '/settings',
  admin: '/admin'
};

const introLines = [
  { kind: 'system', text: 'AJT3 personal.system v2.0' },
  { kind: 'muted', text: 'Type "help" to see available commands.' }
];

function CommandTerminal({ autoFocus = false, onNavigate, showIntro = true, variant = 'default' }) {
  const navigate = useNavigate();
  const deviceSettings = useContext(DeviceSettingsContext);
  const inputId = useId();
  const hintId = useId();
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState(() => showIntro ? introLines : []);
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  const addLine = (text, kind = 'output') => {
    setHistory((current) => [...current, { kind, text }]);
  };

  const openRoute = (destination) => {
    const normalized = destination.replace(/^\//, '').toLowerCase() || 'home';
    const route = routes[normalized];

    if (!route) {
      addLine(`No route named "${destination}". Try: tech, music, dogs, blog, photos, calendar, terminal, admin, or settings.`, 'error');
      return;
    }

    addLine(`Opening /${normalized === 'home' ? '' : normalized}...`, 'accent');
    window.setTimeout(() => {
      navigate(route);
      onNavigate?.();
    }, 140);
  };

  const runCommand = (rawCommand) => {
    const cleanCommand = rawCommand.trim();

    if (!cleanCommand) {
      return;
    }

    setHistory((current) => [...current, { kind: 'command', text: cleanCommand }]);
    const [verb, ...args] = cleanCommand.toLowerCase().split(/\s+/);

    switch (verb) {
      case 'help':
        addLine('Commands: ls, open <page>, cd <page>, whoami, pwd, date, clear, logout, restart, shutdown');
        break;
      case 'ls':
        addLine('tech/   music/   dogs/   blog/   photos/   calendar/   admin/   terminal/   settings/');
        break;
      case 'open':
      case 'cd':
        if (!args[0]) {
          addLine(`Usage: ${verb} <tech|music|dogs|blog|photos|calendar|admin|terminal|settings>`, 'error');
        } else {
          openRoute(args[0]);
        }
        break;
      case 'whoami':
        addLine('AJ Thompson - builder, musician, and dog person.');
        break;
      case 'pwd':
        addLine('/home/ajt3');
        break;
      case 'date':
        addLine(new Date().toLocaleString());
        break;
      case 'clear':
        setHistory([]);
        break;
      case 'logout':
      case 'restart':
      case 'shutdown':
        if (!deviceSettings?.runSystemAction) {
          addLine('System controls are unavailable in this terminal.', 'error');
          break;
        }
        addLine(verb === 'logout' ? 'Logging out...' : verb === 'restart' ? 'Restarting system...' : 'Shutting down...', 'accent');
        window.setTimeout(() => deviceSettings.runSystemAction(verb), 220);
        break;
      default:
        if (routes[verb]) {
          openRoute(verb);
        } else {
          addLine(`Command not found: ${verb}. Type "help".`, 'error');
        }
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    runCommand(command);
    setCommand('');
  };

  return (
    <section className={`command-terminal command-terminal--${variant}`} aria-label="Interactive site terminal" onClick={() => inputRef.current?.focus()}>
      <div className="command-terminal__bar">
        <span className="command-terminal__lights" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>visitor@ajt3:~</span>
      </div>
      <div className="command-terminal__body" ref={outputRef} aria-live="polite">
        {history.map((line, index) => (
          <div key={`${line.text}-${index}`} className={`command-terminal__line command-terminal__line--${line.kind}`}>
            {line.kind === 'command' ? <span aria-hidden="true">visitor@ajt3:~$ </span> : null}
            {line.text}
          </div>
        ))}
        <form className="command-terminal__form" onSubmit={handleSubmit}>
          <label htmlFor={inputId} className="sr-only">Enter a site navigation command</label>
          <span aria-hidden="true">visitor@ajt3:~$</span>
          <input
            id={inputId}
            ref={inputRef}
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck="false"
            aria-describedby={hintId}
          />
          <span className="command-terminal__cursor" aria-hidden="true"></span>
        </form>
        <span id={hintId} className="sr-only">Try help, logout, restart, shutdown, or open followed by an app name.</span>
      </div>
    </section>
  );
}

export default CommandTerminal;

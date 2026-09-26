import React, { useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DeviceSettingsContext } from './deviceSettings';
import { getBlogPosts } from '../data/blogPosts';
import { getCalendarEvents, dateKey, eventDate, eventRange, eventsOnDay } from '../data/calendar';
import { getPhotoLibrary } from '../data/photos';
import musicPlaylists from '../data/musicPlaylists';
import { terminalPages, terminalAliases, terminalSettings, settingOptions, terminalHelp } from '../data/terminalCommands';
import './CommandTerminal.css';

const introLines = [
  { kind: 'system', text: 'AJT3 personal.system v2.0' },
  { kind: 'muted', text: 'Explore the site: try --help, ls, or open guestbook.' }
];

function CommandTerminal({ autoFocus = false, onNavigate, showIntro = true, variant = 'default' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const deviceSettings = useContext(DeviceSettingsContext);
  const inputId = useId();
  const hintId = useId();
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState(() => showIntro ? introLines : []);
  const inputRef = useRef(null);
  const cursorRef = useRef(null);
  const cursorMeasureRef = useRef(null);
  const outputRef = useRef(null);
  const commandsRef = useRef([]);
  const recallRef = useRef(null);
  const draftRef = useRef('');
  const requestRef = useRef(0);

  const syncCursor = useCallback(() => {
    const input = inputRef.current;
    const cursor = cursorRef.current;
    const measure = cursorMeasureRef.current;
    if (!input || !cursor || !measure) return;
    measure.textContent = input.value.slice(0, input.selectionStart ?? input.value.length);
    cursor.style.setProperty('--cursor-offset', `${measure.getBoundingClientRect().width - input.scrollLeft}px`);
    cursor.style.visibility = input.selectionStart === input.selectionEnd ? '' : 'hidden';
  }, []);

  useLayoutEffect(() => { syncCursor(); }, [command, syncCursor]);

  useEffect(() => {
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(syncCursor);
    observer?.observe(inputRef.current);
    document.fonts?.addEventListener('loadingdone', syncCursor);
    return () => {
      observer?.disconnect();
      document.fonts?.removeEventListener('loadingdone', syncCursor);
    };
  }, [syncCursor]);

  useEffect(() => () => { requestRef.current += 1; }, []);

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

  const openExternal = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    addLine(`Opening ${url} in a new tab...`, 'accent');
    onNavigate?.();
  };

  const openRoute = (destination) => {
    const normalized = destination.replace(/^\/+|\/+$/g, '').toLowerCase() || 'home';
    const page = terminalPages.find((item) => item.name === (terminalAliases[normalized] || normalized));
    if (!page) {
      addLine(`No public page named "${destination}". Use ls to see pages or help open for examples.`, 'error');
      return;
    }
    if (page.path.startsWith('https://')) {
      openExternal(page.path);
      return;
    }
    addLine(`Opening ${page.path}...`, 'accent');
    navigate(page.path);
    onNavigate?.();
  };

  const showHelp = (topic) => {
    const name = topic === 'cd' ? 'open' : topic === '--help' || topic === '-h' ? 'help' : terminalAliases[topic] || topic;
    if (name) {
      const entry = terminalHelp.find((item) => item.name === name);
      const page = terminalPages.find((item) => item.name === name);
      if (entry) {
        addLine(`${entry.usage}\n${entry.description}`);
        if (name === 'set' || name === 'get') {
          addLine(terminalSettings.map((setting) => `${setting.name}: ${settingOptions(setting).join(' | ') || `${setting.min}-${setting.max}`}`).join('\n'));
        }
      } else if (page) {
        addLine(`${page.name} | open ${page.name}\n${page.description}`);
      } else {
        addLine(`No help for "${topic}". Try --help or ls.`, 'error');
      }
      return;
    }
    addLine('QUICK GUIDE', 'system');
    addLine('Type a page name to open it, or use ls to browse.', 'muted');
    addLine('Try: guestbook | posts dogs | set theme dark', 'accent');
    addLine('EXPLORE', 'system');
    addLine('ls / open        Find or open pages\nposts / read     Find or open blog posts\nplaylists / listen  Find or play music\nalbums / events  Browse photos or events', 'accent');
    addLine('CUSTOMIZE', 'system');
    addLine('get / set        View or change device settings', 'violet');
    addLine('TERMINAL', 'system');
    addLine('whoami | pwd | date | history | clear', 'success');
    addLine('SYSTEM', 'system');
    addLine('logout | restart | shutdown', 'warning');
    addLine('Details: help <command> | Complete: Tab | History: Up/Down', 'muted');
  };

  const readContent = async (verb, query) => {
    const request = requestRef.current;
    addLine(`Loading ${verb === 'read' ? 'post' : verb}...`, 'muted');
    try {
      let lines;
      if (verb === 'posts' || verb === 'read') {
        const posts = await getBlogPosts();
        if (request !== requestRef.current) return;
        if (verb === 'read') {
          const post = posts.find((item) => item.slug.toLowerCase() === query);
          if (!post) {
            addLine('Post not found. Use posts to find a published slug.', 'error');
            return;
          }
          navigate(`/blog/${encodeURIComponent(post.slug)}`);
          onNavigate?.();
          return;
        }
        lines = posts.filter((post) => [post.title, post.excerpt, ...post.tags].join(' ').toLowerCase().includes(query))
          .map((post) => `${post.title} - ${post.date}\n  read ${post.slug}`);
      } else if (verb === 'albums') {
        const library = await getPhotoLibrary();
        lines = library.albums.map((album) => {
          const count = library.photos.filter((photo) => photo.album === album.id).length;
          return `${album.title} (${album.id}) - ${count} ${count === 1 ? 'photo' : 'photos'}`;
        });
      } else {
        const events = await getCalendarEvents();
        const now = new Date();
        const matches = query === 'today' ? eventsOnDay(events, now) : events.filter((event) => (
          event.all_day ? event.end_date >= dateKey(now) : new Date(event.end_at) > now
        ));
        lines = matches.sort((a, b) => eventDate(a) - eventDate(b)).map((event) => `${event.title}\n  ${eventRange(event)}`);
      }
      if (request === requestRef.current) addLine(lines.length ? lines.join('\n') : 'No matching results.');
    } catch {
      if (request === requestRef.current) addLine('Could not load this content. Please try again shortly.', 'error');
    }
  };

  const updatePreference = (verb, args) => {
    const setting = terminalSettings.find((item) => item.name === args[0]);
    if ((args.length && !setting) || (verb === 'set' && args.length !== 2) || (verb === 'get' && args.length > 1)) {
      addLine(`Usage: ${verb === 'set' ? 'set <setting> <value>' : 'get [setting]'}. Try help ${verb} for options.`, 'error');
      return;
    }
    if (!deviceSettings || (verb === 'set' && typeof deviceSettings[setting.setter] !== 'function')) {
      addLine('Device preferences are unavailable in this terminal.', 'error');
      return;
    }
    if (verb === 'get') {
      addLine((setting ? [setting] : terminalSettings).map((item) => {
        const value = deviceSettings[item.key];
        const display = item.name === 'brightness' ? 100 - value : item.name === 'motion' ? (value ? 'on' : 'off') : item.name === 'clock' ? (value ? '24' : '12') : value;
        return `${item.name}: ${display}`;
      }).join('\n'));
      return;
    }
    const value = args[1];
    const options = settingOptions(setting);
    const valid = options.length ? options.includes(value) : /^\d+$/.test(value) && Number(value) >= setting.min && Number(value) <= setting.max;
    if (!valid) {
      addLine(`Choose ${setting.name}: ${options.join(' | ') || `a whole number from ${setting.min} to ${setting.max}`}.`, 'error');
      return;
    }
    const next = setting.name === 'brightness' ? 100 - Number(value) : setting.name === 'intensity' ? Number(value) : setting.name === 'motion' ? value === 'on' : setting.name === 'clock' ? value === '24' : value;
    deviceSettings[setting.setter](next);
    addLine(`${setting.name} set to ${value}.`, 'accent');
  };

  const runCommand = (rawCommand) => {
    const cleanCommand = rawCommand.trim();

    if (!cleanCommand) {
      return;
    }

    setHistory((current) => [...current, { kind: 'command', text: cleanCommand }]);
    commandsRef.current.push(cleanCommand);
    recallRef.current = null;
    draftRef.current = '';
    const [rawVerb, ...args] = cleanCommand.toLowerCase().split(/\s+/);
    const verb = terminalAliases[rawVerb] || rawVerb;
    const query = args.join(' ');
    if (args.includes('--help') || args.includes('-h')) {
      showHelp(verb);
      return;
    }
    if (args.length && ['whoami', 'pwd', 'date', 'history', 'clear', 'logout', 'restart', 'shutdown'].includes(verb)) {
      addLine(`${verb} does not take arguments. Try help ${verb}.`, 'error');
      return;
    }

    switch (verb) {
      case 'help':
      case '--help':
      case '-h':
        showHelp(args[0]);
        break;
      case 'ls': {
        const pages = terminalPages.filter((page) => `${page.name} ${page.description}`.toLowerCase().includes(query));
        addLine(pages.length ? pages.map((page) => `${page.name} - ${page.description}`).join('\n') : 'No matching pages. Try ls without a search.');
        break;
      }
      case 'open':
      case 'cd':
        if (args.length !== 1) {
          addLine(`Usage: ${verb} <page>. Try ${verb} guestbook, or ls to list public pages.`, 'error');
        } else {
          openRoute(args[0]);
        }
        break;
      case 'posts':
      case 'read':
      case 'albums':
      case 'events':
        if ((verb === 'read' && args.length !== 1) || (verb === 'albums' && args.length) || (verb === 'events' && query && !['today', 'upcoming'].includes(query))) {
          showHelp(verb);
        } else {
          readContent(verb, query);
        }
        break;
      case 'playlists': {
        const matches = musicPlaylists.filter((playlist) => `${playlist.key} ${playlist.title}`.toLowerCase().includes(query));
        addLine(matches.length ? matches.map((playlist) => `${playlist.title} - listen ${playlist.key}`).join('\n') : 'No matching playlists. Try playlists without a search.');
        break;
      }
      case 'listen': {
        const playlist = musicPlaylists.find((item) => item.key.toLowerCase() === query || item.title.toLowerCase() === query);
        if (playlist) openExternal(playlist.src.replace('embed.music.apple.com', 'music.apple.com'));
        else addLine('Usage: listen <playlist key or title>. Run playlists to see the collection.', 'error');
        break;
      }
      case 'get':
      case 'set':
        updatePreference(verb, args);
        break;
      case 'whoami':
        addLine('AJ Thompson - builder, musician, and dog person.');
        break;
      case 'pwd':
        addLine(location.pathname);
        break;
      case 'date':
        addLine(new Date().toLocaleString());
        break;
      case 'clear':
        requestRef.current += 1;
        setHistory([]);
        break;
      case 'history':
        addLine(commandsRef.current.map((entry, index) => `${index + 1}  ${entry}`).join('\n'));
        break;
      case 'logout':
      case 'restart':
      case 'shutdown':
        if (!deviceSettings?.runSystemAction) {
          addLine('System controls are unavailable in this terminal.', 'error');
          break;
        }
        addLine(verb === 'logout' ? 'Logging out...' : verb === 'restart' ? 'Restarting system...' : 'Shutting down...', 'accent');
        deviceSettings.runSystemAction(verb);
        break;
      default:
        if (terminalPages.some((page) => page.name === verb) && !args.length) {
          openRoute(verb);
        } else {
          addLine(`Command not found: ${cleanCommand}. Try --help for commands or ls for public pages.`, 'error');
        }
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      if (!commandsRef.current.length) return;
      if (recallRef.current === null) {
        if (event.key === 'ArrowDown') return;
        draftRef.current = command;
        recallRef.current = commandsRef.current.length;
      }
      const next = Math.max(0, Math.min(commandsRef.current.length, recallRef.current + (event.key === 'ArrowUp' ? -1 : 1)));
      recallRef.current = next === commandsRef.current.length ? null : next;
      setCommand(recallRef.current === null ? draftRef.current : commandsRef.current[next]);
    } else if (event.key === 'Tab' && !event.shiftKey && command.trim()) {
      const parts = command.toLowerCase().trimStart().split(/\s+/);
      const prefix = parts.pop();
      let choices = [];
      if (!parts.length) choices = [...terminalHelp.map((entry) => entry.name), ...terminalPages.map((page) => page.name), ...Object.keys(terminalAliases), 'cd', '--help'];
      else if (parts.length === 1 && ['open', 'cd'].includes(parts[0])) choices = terminalPages.map((page) => page.name);
      else if (parts.length === 1 && ['get', 'set'].includes(parts[0])) choices = terminalSettings.map((setting) => setting.name);
      else if (parts.length === 1 && parts[0] === 'help') choices = [...terminalHelp.map((entry) => entry.name), ...terminalPages.map((page) => page.name)];
      else if (parts.length === 1 && parts[0] === 'listen') choices = musicPlaylists.map((playlist) => playlist.key);
      else if (parts.length === 1 && parts[0] === 'events') choices = ['today', 'upcoming'];
      else if (parts.length === 2 && parts[0] === 'set') {
        const setting = terminalSettings.find((item) => item.name === parts[1]);
        if (setting) choices = settingOptions(setting);
      }
      const matches = [...new Set(choices)].filter((choice) => choice.startsWith(prefix));
      if (!matches.length) return;
      event.preventDefault();
      if (matches.length === 1) {
        setCommand([...parts, matches[0]].join(' '));
        recallRef.current = null;
      } else addLine(matches.join('  '), 'muted');
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
        <form className="command-terminal__form" aria-label="Site command" onSubmit={handleSubmit}>
          <label htmlFor={inputId} className="sr-only">Enter a site command</label>
          <span className="command-terminal__prompt command-terminal__prompt--full" aria-hidden="true">visitor@ajt3:~$</span>
          <span className="command-terminal__prompt command-terminal__prompt--compact" aria-hidden="true">~$</span>
          <div className="command-terminal__input">
            <input
              id={inputId}
              ref={inputRef}
              value={command}
              onChange={(event) => { setCommand(event.target.value); recallRef.current = null; }}
              onKeyDown={handleKeyDown}
              onKeyUp={syncCursor}
              onSelect={syncCursor}
              onScroll={syncCursor}
              onFocus={syncCursor}
              placeholder="--help"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck="false"
              aria-describedby={hintId}
            />
            <span ref={cursorMeasureRef} className="command-terminal__cursor-measure" aria-hidden="true" />
            <span ref={cursorRef} className="command-terminal__cursor" aria-hidden="true" />
          </div>
        </form>
        <span id={hintId} className="sr-only">Type --help for commands and examples. Use Up and Down for command history, Tab to complete, and Shift+Tab to move focus back.</span>
      </div>
    </section>
  );
}

export default CommandTerminal;

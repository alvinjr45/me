import React, { useContext, useEffect, useRef, useState } from 'react';
import PolicyLinks from '../components/PolicyLinks';
import {
  DeviceSettingsContext,
  accentChoices,
  appearanceChoices,
  backgroundChoices,
  wallpaperChoices,
  wallpaperSpeedChoices
} from '../components/deviceSettings';
import { SceneWindow } from '../components/SceneBackground';
import './Settings.css';

const settingsCategories = [
  { key: 'system', label: 'General', keywords: 'clock time format account logout restart shutdown power', icon: 'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6' },
  { key: 'appearance', label: 'Appearance', keywords: 'theme light dark auto accent color motion animation speed brightness intensity', icon: 'M12 3a9 9 0 1 0 0 18V3Zm0 0a9 9 0 0 1 0 18' },
  { key: 'wallpaper', label: 'Wallpaper', keywords: 'desktop aurora nebula tide ember synth sunset graphite', icon: 'M3 4h18v16H3zM3 16l5-5 4 4 3-3 6 6M16 8h.01' },
  { key: 'background', label: 'Background', keywords: 'scene alpine lake coastal retreat desert forest cabin city winter snowbound northern lights garden', icon: 'M2 19 9 5l5 9 3-5 5 10H2ZM6 11l3 2 3-2' }
];

function SettingsIcon({ category }) {
  return <span className={`settings-page__icon settings-page__icon--${category.key}`} aria-hidden="true"><svg viewBox="0 0 24 24"><path d={category.icon} /></svg></span>;
}

function Settings() {
  const [activeCategory, setActiveCategory] = useState('appearance');
  const [panelOpen, setPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const headingRef = useRef(null);
  const selectedCategoryRef = useRef(null);
  const category = settingsCategories.find((item) => item.key === activeCategory);
  const visibleCategories = settingsCategories.filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(search.trim().toLowerCase()));

  useEffect(() => {
    if (panelOpen) headingRef.current?.focus();
  }, [activeCategory, panelOpen]);

  const {
    wallpaper,
    setWallpaper,
    background,
    setBackground,
    appearance,
    setAppearance,
    accent,
    setAccent,
    wallpaperSpeed,
    setWallpaperSpeed,
    wallpaperDim,
    setWallpaperDim,
    wallpaperIntensity,
    setWallpaperIntensity,
    clock24,
    setClock24,
    motion,
    setMotion,
    runSystemAction,
    accountName,
    accountImage
  } = useContext(DeviceSettingsContext);

  return (
    <main className={`settings-page app-view${panelOpen ? ' settings-page--detail' : ''}`} aria-label="Settings">
      <aside className="settings-page__sidebar">
        <h1 className="settings-page__title">Settings</h1>
        <label className="settings-page__search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg>
          <input type="search" aria-label="Search settings" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <div className="settings-page__account">
          <span className="settings-page__avatar" aria-hidden="true">{accountImage ? <img src={accountImage} alt="" /> : accountName?.trim().slice(0, 1).toUpperCase() || 'A'}</span>
          <div><strong>{accountName}</strong><span>Local account</span></div>
        </div>
        <nav className="settings-page__navigation" aria-label="Settings categories">
          {visibleCategories.map((item) => (
            <button key={item.key} ref={activeCategory === item.key ? selectedCategoryRef : null} type="button" aria-current={activeCategory === item.key ? 'page' : undefined} onClick={() => { setActiveCategory(item.key); setPanelOpen(true); }}>
              <SettingsIcon category={item} /><span>{item.label}</span><span className="settings-page__chevron" aria-hidden="true" />
            </button>
          ))}
          {visibleCategories.length === 0 && <p className="settings-page__empty" role="status">No matching settings.</p>}
        </nav>
      </aside>
      <div className="settings-page__detail">
        <header className="settings-page__toolbar">
          <button className="settings-page__back" type="button" onClick={() => { setPanelOpen(false); requestAnimationFrame(() => selectedCategoryRef.current?.focus()); }}><span aria-hidden="true">&#8249;</span> Settings</button>
          <h2 ref={headingRef} tabIndex={-1}>{category.label}</h2>
        </header>
        <div className="settings-page__content" key={activeCategory}>
      <section className="settings-page__section" aria-labelledby="appearance-title" hidden={activeCategory !== 'appearance'}>
        <div className="settings-page__section-heading">
          <h2 id="appearance-title">Display &amp; Color</h2>
        </div>

        <div className="settings-page__preference settings-page__preference--theme">
          <div><strong>Theme</strong><p>Choose a light, dark, or automatic appearance.</p></div>
          <div className="settings-page__themes" role="group" aria-label="Interface theme">
            {[...appearanceChoices].reverse().map((choice) => (
              <button key={choice.key} className={`settings-page__theme settings-page__theme--${choice.key}`} type="button" aria-pressed={appearance === choice.key} onClick={() => setAppearance(choice.key)}>
                <span className="settings-page__theme-preview" aria-hidden="true"><span /></span>
                {choice.key === 'system' ? 'Auto' : choice.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-page__preference settings-page__preference--accent">
          <div><strong>Accent color</strong><p>Change highlights and active controls across the system.</p></div>
          <div className="settings-page__accents" role="group" aria-label="Accent color">
            {accentChoices.map((choice) => (
              <button
                key={choice.key}
                type="button"
                aria-label={choice.label}
                aria-pressed={accent === choice.key}
                onClick={() => setAccent(choice.key)}
                style={{ '--accent-main': choice.main, '--accent-secondary': choice.accent }}
              />
            ))}
          </div>
        </div>

        <div className="settings-page__preference">
          <div><strong>Wallpaper speed</strong><p>Set the pace of animated wallpaper movement.</p></div>
          <div className="settings-page__segments" role="group" aria-label="Wallpaper animation speed">
            {wallpaperSpeedChoices.map((choice) => (
              <button key={choice.key} type="button" aria-pressed={wallpaperSpeed === choice.key} onClick={() => setWallpaperSpeed(choice.key)}>{choice.label}</button>
            ))}
          </div>
        </div>

        <label className="settings-page__range">
          <span><strong>Wallpaper brightness</strong><small>{100 - wallpaperDim}%</small></span>
          <input type="range" min="35" max="100" value={100 - wallpaperDim} aria-valuetext={`${100 - wallpaperDim}%`} onChange={(event) => setWallpaperDim(100 - Number(event.target.value))} />
        </label>

        <label className="settings-page__range">
          <span><strong>Color intensity</strong><small>{wallpaperIntensity}%</small></span>
          <input type="range" min="60" max="140" value={wallpaperIntensity} aria-valuetext={`${wallpaperIntensity}%`} onChange={(event) => setWallpaperIntensity(Number(event.target.value))} />
        </label>

        <div className="settings-page__preference">
          <div><strong>Interface motion</strong><p>Turn window and wallpaper animations on or off.</p></div>
          <button className="settings-page__switch" type="button" role="switch" aria-label="Enable interface motion" aria-checked={motion} onClick={() => setMotion((current) => !current)}><span /></button>
        </div>
      </section>

      <section className="settings-page__section" aria-labelledby="background-title" hidden={activeCategory !== 'background'}>
        <div className="settings-page__section-heading">
          <h2 id="background-title">Background</h2>
          <p className="settings-page__background-note">Each page load starts with a random scene. Choose a different background for this visit, on desktop or mobile.</p>
        </div>
        <div className="settings-page__wallpapers" aria-label="Background choices">
          {backgroundChoices.map((choice) => (
            <button
              key={choice.key}
              type="button"
              className="settings-page__wallpaper"
              aria-pressed={background === choice.key}
              onClick={() => setBackground(choice.key)}
            >
              <span className={`settings-page__background-preview scene-theme scene-theme--${choice.key}`} aria-hidden="true">
                <SceneWindow background={choice.key} />
                {background === choice.key && <span className="settings-page__background-selected">Selected</span>}
              </span>
              <strong>{choice.label}</strong>
              <small>{choice.description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-page__section" aria-labelledby="wallpaper-title" hidden={activeCategory !== 'wallpaper'}>
        <div className="settings-page__section-heading">
          <h2 id="wallpaper-title">Choose your wallpaper</h2>
          <p className="settings-page__background-note">Give your desktop a new look.</p>
        </div>
        <div className="settings-page__wallpapers" aria-label="Wallpaper choices">
          {wallpaperChoices.map((choice) => (
            <button
              key={choice.key}
              type="button"
              className={`settings-page__wallpaper settings-page__wallpaper--${choice.key}`}
              aria-pressed={wallpaper === choice.key}
              onClick={() => setWallpaper(choice.key)}
            >
              <span className="settings-page__wallpaper-preview" aria-hidden="true" />
              <strong>{choice.label}</strong>
              <small>{choice.description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-page__section" aria-labelledby="preferences-title" hidden={activeCategory !== 'system'}>
        <div className="settings-page__section-heading">
          <h2 id="preferences-title">Date &amp; Time</h2>
          <p className="settings-page__background-note">Signed in as {accountName}</p>
        </div>
        <div className="settings-page__preference">
          <div><strong>24-hour time</strong><p>Use a 24-hour clock in the menu bar.</p></div>
          <button className="settings-page__switch" type="button" role="switch" aria-label="Use 24-hour clock" aria-checked={clock24} onClick={() => setClock24((current) => !current)}><span /></button>
        </div>
        <div className="settings-page__system-actions" aria-label="Power options">
          <button type="button" onClick={() => runSystemAction('logout')}><strong>Log out</strong><span>Close the current session</span></button>
          <button type="button" onClick={() => runSystemAction('restart')}><strong>Restart</strong><span>Close apps and reboot</span></button>
          <button type="button" className="settings-page__system-action--danger" onClick={() => runSystemAction('shutdown')}><strong>Shut down</strong><span>Power off the device</span></button>
        </div>
        <h2>Site policies</h2>
        <PolicyLinks />
      </section>
        </div>
      </div>
    </main>
  );
}

export default Settings;

import React, { useEffect, useRef, useState } from 'react';
import './AppStore.css';

const catalog = [
  { id: 'orbit', name: 'Orbit', subtitle: 'A little space to focus.', category: 'Productivity', rating: '4.9', reviews: '2.4K', color: 'orange', glyph: 'orbit', description: 'Find your flow with thoughtful focus sessions, a calmer task list, and a daily rhythm that leaves room to breathe.', features: ['Focus on one thing at a time', 'Build a rhythm that works for you', 'See the progress behind your projects'] },
  { id: 'form', name: 'Form', subtitle: 'Big ideas start here.', category: 'Creativity', rating: '4.8', reviews: '1.8K', color: 'purple', glyph: 'form', description: 'A playful canvas for your next big idea. Bring sketches, colors, and inspiration together in one beautifully simple workspace.', features: ['An open canvas for every idea', 'Collect your favorite colors', 'Turn rough sketches into something new'] },
  { id: 'wave', name: 'Wave', subtitle: 'Soundtrack your day.', category: 'Music', rating: '4.9', reviews: '3.1K', color: 'pink', glyph: 'wave', description: 'Set the mood for whatever comes next. Explore a world of ambient sound, build your own mix, and give every moment its own soundtrack.', features: ['Find a sound for every mood', 'Mix your own atmosphere', 'Keep your favorite sessions close'] },
  { id: 'stack', name: 'Stack', subtitle: 'Your snippets, sorted.', category: 'Developer Tools', rating: '4.7', reviews: '986', color: 'blue', glyph: 'code', description: 'A home for the little pieces of code you reach for every day. Organize your snippets, capture a useful command, and get back to building.', features: ['Keep useful snippets together', 'Find the right command faster', 'Organize by project or language'] },
  { id: 'moss', name: 'Moss', subtitle: 'Grow at your own pace.', category: 'Lifestyle', rating: '4.8', reviews: '1.2K', color: 'green', glyph: 'leaf', description: 'Make space for small, good habits. Tend to a personal garden as you build routines that make everyday life feel a little better.', features: ['Start with one small habit', 'Watch your personal garden grow', 'Make time for a daily reflection'] },
  { id: 'lumina', name: 'Lumina', subtitle: 'Every photo, a new perspective.', category: 'Creativity', rating: '4.6', reviews: '754', color: 'gold', glyph: 'lens', description: 'Rediscover the pictures you love. Explore light, color, and composition with a collection of intuitive tools made for everyday creativity.', features: ['Explore light and color', 'Give your favorites a fresh look', 'Build a collection worth keeping'] },
  { id: 'drift', name: 'Drift', subtitle: 'Take the scenic route.', category: 'Games', rating: '4.9', reviews: '2.7K', color: 'teal', glyph: 'mountain', description: 'Take a quiet journey through an ever-changing landscape. Follow winding paths, discover hidden places, and enjoy the view along the way.', features: ['Explore a peaceful little world', 'Discover a different path each day', 'Play at your own pace'] },
  { id: 'blocks', name: 'Blocks', subtitle: 'A fresh angle on puzzles.', category: 'Games', rating: '4.7', reviews: '1.6K', color: 'red', glyph: 'blocks', description: 'Simple shapes. Satisfying solutions. Make a little time for a colorful puzzle collection that starts easy and keeps you thinking.', features: ['Find the perfect fit', 'Explore colorful puzzle collections', 'Try a new challenge every day'] }
];

const sections = [
  { id: 'discover', label: 'Discover', icon: 'discover' },
  { id: 'apps', label: 'Apps', icon: 'apps' },
  { id: 'games', label: 'Games', icon: 'games' },
  { id: 'library', label: 'Library', icon: 'library' }
];
const categories = ['All', 'Productivity', 'Creativity', 'Music', 'Developer Tools', 'Lifestyle'];
const storageKey = 'ajt3-store-library';

function StoreIcon({ name }) {
  const shapes = {
    discover: <><circle cx="12" cy="12" r="9" /><path d="m16 8-2 6-6 2 2-6Z" /></>,
    apps: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    games: <><path d="M7 7h10c3 0 4 3 4 8s-3 3-5 0H8c-2 3-5 5-5 0s1-8 4-8Z" /><path d="M8 9v5m-2-2h4m6-1h.1m2 2h.1" /></>,
    library: <path d="M4 4h16v16H4ZM4 9h16m-8 3v5m-2-2 2 2 2-2" />,
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></>,
    orbit: <><circle cx="12" cy="12" r="4" /><ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-40 12 12)" /></>,
    form: <><path d="m12 2 10 17H2Z" /><circle cx="12" cy="14" r="5" /></>,
    wave: <path d="M3 10v4m4-8v12m5-16v20m5-16v12m4-8v4" />,
    code: <path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18" />,
    leaf: <><path d="M20 3C5 1 1 12 7 17S23 16 20 3Z" /><path d="M4 22 16 8" /></>,
    lens: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="5" /><path d="m12 2 4 7m5 7h-8m-8 3 4-7" /></>,
    mountain: <><path d="m1 20 8-14 5 8 3-5 6 11ZM6 11h6" /><circle cx="18" cy="4" r="2" /></>,
    blocks: <><rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="8" y="14" width="8" height="8" rx="1" /></>
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{shapes[name]}</svg>;
}

function ProductIcon({ app }) {
  return <span className={`store-product-icon store-product-icon--${app.color}`}><StoreIcon name={app.glyph} /></span>;
}

function readLibrary() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey));
    return Array.isArray(saved) ? catalog.filter((app) => saved.includes(app.id)).map((app) => app.id) : [];
  } catch {
    return [];
  }
}

export default function AppStore() {
  const [section, setSection] = useState('discover');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);
  const [library, setLibrary] = useState(readLibrary);
  const [notice, setNotice] = useState('');
  const scrollRef = useRef(null);
  const detailTitleRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
    if (selected) detailTitleRef.current?.focus();
  }, [selected, section]);

  function changeSection(next) {
    setSection(next);
    setCategory('All');
    setQuery('');
    setSelected(null);
  }

  function toggleLibrary(app) {
    const removing = library.includes(app.id);
    const next = removing ? library.filter((id) => id !== app.id) : [...library, app.id];
    setLibrary(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setNotice(`${app.name} ${removing ? 'removed from' : 'added to'} your library.`);
    } catch {
      setNotice(`${app.name} ${removing ? 'removed' : 'added'} for this visit. Browser storage is unavailable.`);
    }
  }

  function openDetails(app, event) {
    openerRef.current = event.currentTarget.dataset.appId;
    setSelected(app);
  }

  function closeDetails() {
    const openerId = openerRef.current;
    setSelected(null);
    window.requestAnimationFrame(() => {
      const target = scrollRef.current?.querySelector(`[data-app-id="${openerId}"]`);
      (target || detailTitleRef.current)?.focus();
    });
  }

  const filtered = catalog.filter((app) => {
    const matchesSection = section === 'library' ? library.includes(app.id) : section === 'games' ? app.category === 'Games' : section === 'apps' ? app.category !== 'Games' : true;
    return matchesSection && (category === 'All' || category === app.category)
      && `${app.name} ${app.subtitle} ${app.category}`.toLowerCase().includes(query.trim().toLowerCase());
  });
  const showFeatures = section === 'discover' && !query.trim() && category === 'All';
  const heading = sections.find((item) => item.id === section).label;

  return (
    <main className="store-page app-view" aria-label="App Store">
      <div className="store-layout">
        <aside className="store-sidebar">
          <div className="store-brand"><StoreIcon name="apps" /><span>App Store</span></div>
          <label className="store-search">
            <StoreIcon name="search" />
            <input type="search" placeholder="Search" aria-label="Search apps" value={query} onChange={(event) => { setQuery(event.target.value); setSelected(null); }} />
          </label>
          <nav className="store-nav" aria-label="App Store sections">
            {sections.map((item) => (
              <button type="button" key={item.id} aria-current={section === item.id ? 'page' : undefined} onClick={() => changeSection(item.id)}>
                <StoreIcon name={item.icon} /><span>{item.label}</span>
                {item.id === 'library' && library.length > 0 && <small>{library.length}</small>}
              </button>
            ))}
          </nav>
          <div className="store-account"><span>A/3</span><div><strong>Your collection</strong><small>Made for the curious.</small></div></div>
        </aside>

        <div className="store-content app-scroll" ref={scrollRef}>
          {selected ? <>
            <button className="store-back" type="button" aria-label={`Back to ${heading}`} onClick={closeDetails}><span aria-hidden="true">&lsaquo;</span> {heading}</button>
            <div className="store-detail-header">
              <ProductIcon app={selected} />
              <div>
                <h1 ref={detailTitleRef} tabIndex={-1}>{selected.name}</h1><p>{selected.subtitle}</p>
                <button type="button" className="store-get" onClick={() => toggleLibrary(selected)}>{library.includes(selected.id) ? 'Remove from library' : 'Get'}</button>
              </div>
            </div>
            <dl className="store-stats">
              <div><dt>{selected.reviews} sample ratings</dt><dd>{selected.rating} <span aria-hidden="true">&#9733;</span></dd></div>
              <div><dt>Category</dt><dd>{selected.category}</dd></div>
              <div><dt>Price</dt><dd>Free demo</dd></div>
            </dl>
            <h2 className="store-section-title">A closer look</h2>
            <div className="store-previews">
              {selected.features.map((feature, index) => (
                <div className={`store-preview store-preview--${selected.color}`} key={feature}><span>0{index + 1}</span><h3>{feature}</h3><ProductIcon app={selected} /></div>
              ))}
            </div>
            <section className="store-about"><h2>About {selected.name}</h2><p>{selected.description}</p></section>
          </> : <>
            <header className="store-heading">
              <div><p>FIND YOUR NEXT FAVORITE</p><h1 ref={detailTitleRef} tabIndex={-1}>{query.trim() ? 'Search results' : heading}</h1></div>
              <span className="store-edition">THE A/3 EDIT</span>
            </header>
            {showFeatures && <div className="store-editorial">
              <button type="button" className="store-feature store-feature--hero" data-app-id="orbit" onClick={(event) => openDetails(catalog[0], event)}>
                <span className="store-feature-copy"><span className="store-eyebrow">APP OF THE DAY</span><strong>A little focus.<br />A world of possibility.</strong><span>Find your flow with Orbit.</span></span>
                <span className="store-orbit-art" aria-hidden="true"><i /><i /><i /><b /></span>
                <span className="store-feature-footer"><ProductIcon app={catalog[0]} /><span><b>Orbit</b><small>Make space for what matters.</small></span><span className="store-feature-arrow" aria-hidden="true">&nearr;</span></span>
              </button>
              <div className="store-stories">
                <button type="button" className="store-feature store-feature--create" data-app-id="form" onClick={(event) => openDetails(catalog[1], event)}>
                  <span className="store-eyebrow">LET YOUR IDEAS PLAY</span><strong>Your next blank<br />canvas awaits.</strong><ProductIcon app={catalog[1]} /><span className="store-story-link">Meet Form <span aria-hidden="true">&nearr;</span></span>
                </button>
                <button type="button" className="store-feature store-feature--play" data-app-id="drift" onClick={(event) => openDetails(catalog[6], event)}>
                  <span className="store-eyebrow">TAKE A LITTLE BREAK</span><strong>Less rush.<br />More adventure.</strong><ProductIcon app={catalog[6]} /><span className="store-story-link">Explore Drift <span aria-hidden="true">&nearr;</span></span>
                </button>
              </div>
            </div>}

            {(section === 'apps' || section === 'discover') && <nav className="store-categories" aria-label="App categories">
              {categories.map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
            </nav>}
            <div className="store-list-heading">
              <h2>{query.trim() ? `Results for "${query.trim()}"` : section === 'library' ? 'Your apps' : section === 'games' ? 'Find your next adventure' : category !== 'All' ? category : 'Apps we love'}</h2>
              <span>{filtered.length} {filtered.length === 1 ? 'app' : 'apps'}</span>
            </div>
            {filtered.length > 0 ? <ul className="store-app-list">
              {filtered.map((app) => <li key={app.id}>
                <button type="button" className="store-app-summary" data-app-id={app.id} onClick={(event) => openDetails(app, event)}>
                  <ProductIcon app={app} /><span><strong>{app.name}</strong><span>{app.subtitle}</span><small><span aria-hidden="true">&#9733;</span> {app.rating} <span className="store-app-category">&middot; {app.category}</span></small></span>
                </button>
                <button type="button" className={`store-get${library.includes(app.id) ? ' store-get--added' : ''}`} data-app-id={app.id} aria-label={library.includes(app.id) ? `Added ${app.name}. View app details` : `Get ${app.name}`} onClick={(event) => library.includes(app.id) ? openDetails(app, event) : toggleLibrary(app)}>{library.includes(app.id) ? 'Added' : 'Get'}</button>
              </li>)}
            </ul> : <div className="store-empty">
              <StoreIcon name={section === 'library' ? 'library' : 'search'} />
              <h3>{section === 'library' && !query.trim() ? 'Your next favorite is out there.' : 'No apps found.'}</h3>
              <p>{section === 'library' && !query.trim() ? 'Tap Get on an app to add it to your collection.' : 'Try another name or explore a different category.'}</p>
              <button type="button" className="store-get" onClick={() => changeSection('discover')}>Explore apps</button>
            </div>}
          </>}
          <footer className="store-footnote">Sample catalog. Get saves apps to this browser; no software is downloaded. Ratings and previews are illustrative.</footer>
        </div>
      </div>
      <div className="store-notice" role="status">{notice}</div>
    </main>
  );
}

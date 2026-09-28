import React, { useContext, useEffect, useRef, useState } from 'react';
import { DeviceSettingsContext } from '../components/deviceSettings';
import './AppStore.css';

const catalog = [
  { id: 'tech', name: 'Build', subtitle: 'Projects, experiments, and ideas.', category: 'Developer Tools', rating: '5.0', reviews: '1', color: 'blue', glyph: 'code', icon: '/images/app-store/build-logo.png', description: 'AJT3 brings website discovery, client access, project briefs, update requests, and day-to-day delivery into one focused workspace.', features: [
    { title: 'A bold first impression', view: 'home' },
    { title: 'Secure client access', view: 'login' },
    { title: 'The work, organized', view: 'dashboard' }
  ] },
  { id: 'newtrinity', name: 'New Trinity Missionary Baptist Church', subtitle: 'Faith, community, and connection.', category: 'Community', rating: 'New', reviews: 'No', color: 'plum', glyph: 'church', icon: '/images/app-store/new-trinity-logo.png', description: 'A welcoming home for New Trinity Missionary Baptist Church in Clayton, with worship information, church resources, ministry news, and ways to connect.', features: [
    { title: 'Find worship times and events', image: '/images/app-store/new-trinity-worship.webp', alt: 'New Trinity worship service' },
    { title: 'Meet the church family', image: '/images/app-store/new-trinity-community.webp', alt: 'Members of the New Trinity community' },
    { title: 'Connect, serve, and grow', image: '/images/app-store/new-trinity-family.webp', alt: 'New Trinity community gathering' }
  ] },
  { id: 'lattaco', name: 'Lattaco Welding', subtitle: 'Creative metalwork, built to last.', category: 'Business', rating: 'New', reviews: 'No', color: 'steel', glyph: 'weld', icon: '/images/app-store/lattaco-logo.png', description: 'Explore more than 30 years of welding experience across the Research Triangle, from structural systems and access solutions to artistic metalwork.', features: [
    { title: 'Built for heavy work', image: '/images/app-store/lattaco-construction.jpg', alt: 'Custom welded construction equipment' },
    { title: 'Security with craft', image: '/images/app-store/lattaco-gates.jpg', alt: 'Custom industrial security gates' },
    { title: 'Made for the details', image: '/images/app-store/lattaco-grill.jpg', alt: 'Custom welded grill beside a kitchen' }
  ] },
  { id: 'jazzed', name: 'Jazzed To Be Jones', subtitle: 'Jazmine & Tyler are tying the knot.', category: 'Lifestyle', rating: 'New', reviews: 'No', color: 'sage', glyph: 'monogram', icon: '/images/app-store/jazzed-logo.png', description: 'A private wedding destination created for Jazmine and Tyler, bringing their celebration and guest experience together in one elegant place.', features: [
    { title: 'Celebrate Jazmine and Tyler', image: '/images/app-store/jazzed-home.jpg', alt: 'Jazmine and Tyler holding hands beneath a conservatory ceiling' },
    { title: 'Their story, beautifully told', image: '/images/app-store/jazzed-conservatory.jpg', alt: 'Jazmine and Tyler together in a glass conservatory' },
    { title: 'Raise a glass to forever', image: '/images/app-store/jazzed-toast.jpg', alt: 'Jazmine and Tyler toasting with green champagne glasses' }
  ] }
];

const sections = [
  { id: 'discover', label: 'Discover', icon: 'discover' },
  { id: 'apps', label: 'Apps', icon: 'apps' },
  { id: 'library', label: 'Library', icon: 'library' }
];
const categories = ['All', 'Developer Tools', 'Community', 'Business', 'Lifestyle'];

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
    church: <><path d="M12 3v18M7 8h10" /><path d="M10 7C6 4 3 5 2 8c3-1 6 1 8 4m4-5c4-3 7-2 8 1-3-1-6 1-8 4M9 15c-3-3-6-3-8-1 3 1 5 3 7 6m7-5c3-3 6-3 8-1-3 1-5 3-7 6" /></>,
    weld: <><path d="M7 4h10l2 11-4 4H9l-4-4Z" /><path d="M8 8h8l-1 5H9Zm11-3 3-3m-2 7h3m-4 4 3 2" /></>,
    monogram: <><text x="8" y="17" fill="currentColor" stroke="none" fontFamily="Georgia, serif" fontSize="16">J</text><text x="13" y="20" fill="currentColor" stroke="none" fontFamily="Georgia, serif" fontSize="16">T</text><text x="12" y="17" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="Georgia, serif" fontSize="10">&amp;</text></>,
    leaf: <><path d="M20 3C5 1 1 12 7 17S23 16 20 3Z" /><path d="M4 22 16 8" /></>,
    lens: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="5" /><path d="m12 2 4 7m5 7h-8m-8 3 4-7" /></>,
    mountain: <><path d="m1 20 8-14 5 8 3-5 6 11ZM6 11h6" /><circle cx="18" cy="4" r="2" /></>,
    blocks: <><rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="8" y="14" width="8" height="8" rx="1" /></>
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{shapes[name]}</svg>;
}

function ProductIcon({ app }) {
  return (
    <span className={`store-product-icon store-product-icon--${app.color}${app.icon ? ' store-product-icon--branded' : ''}`}>
      {app.icon ? <img src={app.icon} alt="" /> : <StoreIcon name={app.glyph} />}
    </span>
  );
}

function BuildPreviewArtwork({ view }) {
  if (view === 'home') {
    return (
      <div className="store-product-screen store-product-screen--home" role="img" aria-label="AJT3 marketing homepage preview">
        <img src="/images/app-store/build-logo.png" alt="" />
        <strong>WE BUILD<br />WEBSITES</strong>
        <span>Fast, striking sites with a sharp product feel.</span>
        <i>SEE OUR WORK</i>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="store-product-screen store-product-screen--login" role="img" aria-label="AJT3 client login preview">
        <div>
          <span>CLIENT ACCESS</span>
          <strong>Login</strong>
          <small>Access your dashboard.</small>
          <i>Email</i><i>Password</i><b>LOGIN</b>
        </div>
        <em>Ready to build?</em>
      </div>
    );
  }

  return (
    <div className="store-product-screen store-product-screen--dashboard" role="img" aria-label="AJT3 project dashboard preview">
      <div>
        <span>TODAY</span>
        <strong>Work queue</strong>
        <small>0 REQUESTS</small>
        <i>STATUS&nbsp;&nbsp;&nbsp; Active</i>
        <i>SEARCH&nbsp;&nbsp;&nbsp; Owner, page, or request</i>
      </div>
      <div><span>PROJECT BRIEF REVIEW</span><strong>Review submitted briefs</strong></div>
    </div>
  );
}

export default function AppStore() {
  const { installedApps = [], installProgress = {}, installApp, openExternalApp } = useContext(DeviceSettingsContext) || {};
  const [section, setSection] = useState('discover');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState(null);
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
    setSelected(null);
  }

  function handleAppAction(event, app) {
    if (installedApps.includes(app.id)) {
      openExternalApp?.(app.id, event);
      return;
    }
    installApp?.(app.id);
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
    const matchesSection = section === 'library' ? installedApps.includes(app.id) : true;
    return matchesSection && (category === 'All' || category === app.category);
  });
  const showFeatures = section === 'discover' && category === 'All';
  const heading = sections.find((item) => item.id === section).label;
  const isDownloading = (app) => Object.prototype.hasOwnProperty.call(installProgress, app.id);
  const actionLabel = (app) => installedApps.includes(app.id) ? 'Open' : isDownloading(app) ? `${installProgress[app.id]}%` : 'Get';

  function AppAction({ app, className = '' }) {
    const downloading = isDownloading(app);
    return (
      <button
        type="button"
        className={`store-get${installedApps.includes(app.id) ? ' store-get--added' : ''}${downloading ? ' store-get--downloading' : ''}${className ? ` ${className}` : ''}`}
        aria-label={downloading ? `Downloading ${app.name}, ${installProgress[app.id]}%` : `${actionLabel(app)} ${app.name}`}
        disabled={downloading}
        onClick={(event) => handleAppAction(event, app)}
      >
        {downloading ? <svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.5" pathLength="100" style={{ '--download-progress': installProgress[app.id] }} /><rect x="14" y="14" width="8" height="8" rx="1.5" /></svg> : actionLabel(app)}
      </button>
    );
  }

  return (
    <main className="store-page app-view" aria-label="App Store">
      <div className="store-layout">
        <aside className="store-sidebar">
          <div className="store-brand"><StoreIcon name="apps" /><span>App Store</span></div>
          <nav className="store-nav" aria-label="App Store sections">
            {sections.map((item) => (
              <button type="button" key={item.id} aria-current={section === item.id ? 'page' : undefined} onClick={() => changeSection(item.id)}>
                <StoreIcon name={item.icon} /><span>{item.label}</span>
                {item.id === 'library' && installedApps.length > 0 && <small>{installedApps.length}</small>}
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
                <AppAction app={selected} />
              </div>
            </div>
            <dl className="store-stats">
              <div><dt>Ratings</dt><dd>{selected.rating} <span aria-hidden="true">&#9733;</span></dd></div>
              <div><dt>Category</dt><dd>{selected.category}</dd></div>
              <div><dt>Price</dt><dd>Free</dd></div>
            </dl>
            <h2 className="store-section-title">A closer look</h2>
            <div className="store-previews">
              {selected.features.map((feature, index) => {
                const preview = typeof feature === 'string' ? { title: feature } : feature;
                return (
                  <div className={`store-preview store-preview--${selected.color}${preview.image ? ' store-preview--photo' : ''}${preview.view ? ' store-preview--product' : ''}`} key={preview.title}>
                    {preview.image && <img className="store-preview__image" src={preview.image} alt={preview.alt} loading="lazy" />}
                    {preview.view && <BuildPreviewArtwork view={preview.view} />}
                    <span>0{index + 1}</span>
                    <h3>{preview.title}</h3>
                    {!preview.image && !preview.view && <ProductIcon app={selected} />}
                  </div>
                );
              })}
            </div>
            <section className="store-about"><h2>About {selected.name}</h2><p>{selected.description}</p></section>
          </> : <>
            <header className="store-heading">
              <div><p>FIND YOUR NEXT FAVORITE</p><h1 ref={detailTitleRef} tabIndex={-1}>{heading}</h1></div>
              <span className="store-edition">THE A/3 EDIT</span>
            </header>
            {showFeatures && <div className="store-editorial">
              <button type="button" className="store-feature store-feature--hero" data-app-id="newtrinity" onClick={(event) => openDetails(catalog[1], event)}>
                <span className="store-feature-copy"><span className="store-eyebrow">FEATURED</span><strong>A place to belong.</strong><span>Faith, family, and fellowship in Clayton.</span></span>
                <span className="store-feature-image" aria-hidden="true">
                  <img src="/images/app-store/new-trinity-worship.webp" alt="" />
                </span>
                <span className="store-feature-footer"><ProductIcon app={catalog[1]} /><span><b>New Trinity</b><small>Community</small></span><span className="store-feature-cta">View</span></span>
              </button>
            </div>}

            {(section === 'apps' || section === 'discover') && <nav className="store-categories" aria-label="App categories">
              {categories.map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
            </nav>}
            <div className="store-list-heading">
              <h2>{section === 'library' ? 'Your apps' : category !== 'All' ? category : 'Apps we built'}</h2>
              <span>{filtered.length} {filtered.length === 1 ? 'app' : 'apps'}</span>
            </div>
            {filtered.length > 0 ? <ul className="store-app-list">
              {filtered.map((app) => <li key={app.id}>
                <button type="button" className="store-app-summary" data-app-id={app.id} onClick={(event) => openDetails(app, event)}>
                  <ProductIcon app={app} /><span><strong>{app.name}</strong><span>{app.subtitle}</span><small><span aria-hidden="true">&#9733;</span> {app.rating} <span className="store-app-category">&middot; {app.category}</span></small></span>
                </button>
                <AppAction app={app} />
              </li>)}
            </ul> : <div className="store-empty">
              <StoreIcon name={section === 'library' ? 'library' : 'search'} />
              <h3>{section === 'library' ? 'Your next favorite is out there.' : 'No apps found.'}</h3>
              <p>{section === 'library' ? 'Tap Get on an app to add it to your collection.' : 'Explore a different category.'}</p>
              <button type="button" className="store-get" onClick={() => changeSection('discover')}>Explore apps</button>
            </div>}
          </>}
        </div>
      </div>
    </main>
  );
}

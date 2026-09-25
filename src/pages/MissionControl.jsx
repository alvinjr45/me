import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Admin from './Admin';
import NewPost from './NewPost';
import AdminPhotos from './AdminPhotos';
import AdminCalendar from './AdminCalendar';
import AdminGuestbook from './AdminGuestbook';
import AdminProfile from './AdminProfile';
import { DeviceSettingsContext } from '../components/deviceSettings';
import { requestPhotoLibrary } from '../lib/adminPhotoLibrary';
import './MissionControl.css';

const sections = [
  { path: '/admin', title: 'Overview', mark: '01' },
  { path: '/admin/posts', title: 'Blog posts', mark: '02' },
  { path: '/admin/photos', title: 'Photos', mark: '03' },
  { path: '/admin/dogs', title: 'Dog incident', mark: '04' },
  { path: '/admin/guestbook', title: 'Guestbook', mark: '05' },
  { path: '/admin/calendar', title: 'Calendar', mark: '06' }
];

function MissionControl() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { adminAccess: access, adminProfile } = useContext(DeviceSettingsContext);
  const secret = access.session?.secret;
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const [lastRoute, setLastRoute] = useState({ pathname: '/admin', search: '' });
  const [editorSlug, setEditorSlug] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [library, setLibrary] = useState({ photos: [], albums: [] });
  const [photoStatus, setPhotoStatus] = useState('loading');
  const [photoError, setPhotoError] = useState('');
  const [photoReload, setPhotoReload] = useState(0);
  const [calendarOpened, setCalendarOpened] = useState(false);

  useEffect(() => {
    if (isAdminRoute) setLastRoute({ pathname, search });
  }, [isAdminRoute, pathname, search]);

  // Keep an open editor intact when another desktop app has the active route.
  const route = isAdminRoute ? { pathname, search } : lastRoute;
  const slug = new URLSearchParams(route.search).get('slug');
  const isEditor = route.pathname === '/admin/new';
  const activePath = isEditor ? '/admin/posts' : route.pathname;
  const activeSection = sections.find((item) => item.path === activePath) || sections[0];
  const posts = access.session?.posts || [];

  useEffect(() => {
    if (!secret) setCalendarOpened(false);
    else if (activePath === '/admin/calendar') setCalendarOpened(true);
  }, [secret, activePath]);

  useEffect(() => {
    if (!secret) setEditorSlug(undefined);
    else if (isEditor) setEditorSlug(slug);
  }, [secret, isEditor, slug]);

  useEffect(() => {
    if (!secret) { setLibrary({ photos: [], albums: [] }); return; }
    const controller = new AbortController();
    setPhotoStatus('loading');
    setPhotoError('');
    requestPhotoLibrary(secret, { action: 'list' }, { signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return;
      if (!Array.isArray(result.photos) || !Array.isArray(result.albums)) throw new Error('The photo service returned an invalid library.');
      setLibrary({ photos: result.photos, albums: result.albums });
      setPhotoStatus('ready');
    }).catch((error) => {
      if (!controller.signal.aborted) { setPhotoStatus('error'); setPhotoError(error.message); }
    });
    return () => controller.abort();
  }, [secret, photoReload]);

  function updateLibrary(kind, row) {
    setLibrary((current) => ({ ...current, [kind]: [...current[kind].filter((item) => item.id !== row.id), row]
      .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id)) }));
  }

  if (!access.session) return null;

  const currentEditorSlug = isEditor ? slug : editorSlug;
  return (
    <div className="mission-control">
      <aside className="mission-control__sidebar">
        <div className="mission-control__brand"><span aria-hidden="true">M/C</span><strong>Mission<br />Control</strong></div>
        <p className="mission-control__nav-label">WORKSPACE</p>
        <nav aria-label="Mission Control sections">{sections.map((section) => (
          <button type="button" key={section.path} disabled={busy} aria-current={activeSection.path === section.path ? 'page' : undefined} onClick={() => navigate(section.path)}><span>{section.mark}</span>{section.title}</button>
        ))}</nav>
        <p className="mission-control__sidebar-note">AJT3 / SITE MANAGEMENT</p>
      </aside>
      <div className="mission-control__workspace">
        <header className="mission-control__toolbar"><div><span>YOUR PERSONAL SYSTEM</span><strong>{isEditor ? 'Post editor' : activeSection.title}</strong></div><button type="button" disabled={busy} onClick={access.logout}>Sign out</button></header>
        <div className="mission-control__content">
          {activeSection.path === '/admin' && !isEditor && (
            <main className="mission-control__overview">
              <AdminProfile secret={secret} imageUrl={adminProfile?.imageUrl} onChange={(url) => adminProfile?.updateImage(url)} onBusy={setBusy} />
              <div className="mission-control__destinations">
                <button type="button" disabled={busy} onClick={() => navigate('/admin/calendar')}><span>WHAT'S NEXT</span><h2>Calendar</h2><p>Add events and make room for what matters.</p><strong>Manage events &rarr;</strong></button>
                <button type="button" disabled={busy} onClick={() => navigate('/admin/posts')}><span>PUBLISHING</span><h2>Blog posts</h2><p>Write, edit, and choose what goes live.</p><strong>Manage posts &rarr;</strong></button>
                <button type="button" disabled={busy} onClick={() => navigate('/admin/photos')}><span>YOUR CAMERA ROLL</span><h2>Photos</h2><p>Upload moments and curate your albums.</p><strong>Manage photos &rarr;</strong></button>
                <button type="button" disabled={busy} onClick={() => navigate('/admin/guestbook')}><span>COMMUNITY</span><h2>Guestbook</h2><p>Manage messages and keep the board welcoming.</p><strong>Manage guestbook &rarr;</strong></button>
              </div>
              <section className="mission-control__recent"><header><h2>Recent posts</h2><button type="button" disabled={busy} onClick={() => navigate('/admin/new')}>New post</button></header>{posts.slice(0, 4).map((post) => <button className="mission-control__recent-post" type="button" disabled={busy} key={post.slug} onClick={() => navigate(`/admin/new?slug=${encodeURIComponent(post.slug)}`)}><strong>{post.title}</strong><span>{post.is_published ? 'Published' : 'Draft'}</span></button>)}{!posts.length && <p>Your first post starts here.</p>}</section>
              {photoStatus === 'error' && <p className="mission-control__notice">Photos needs attention. Open Photos for details; publishing is still available.</p>}
            </main>
          )}
          <div hidden={isEditor || !['/admin/posts', '/admin/dogs'].includes(activeSection.path)}><Admin access={access} section={activeSection.path === '/admin/dogs' ? 'dogs' : 'posts'} onBusy={setBusy} /></div>
          {activeSection.path === '/admin/guestbook' && <AdminGuestbook secret={secret} onBusy={setBusy} />}
          {calendarOpened && <div hidden={activeSection.path !== '/admin/calendar'}><AdminCalendar secret={secret} onBusy={setBusy} /></div>}
          {(isEditor || editorSlug !== undefined) && <div hidden={!isEditor}><NewPost key={currentEditorSlug || 'new'} slug={currentEditorSlug} access={access} onBusy={setBusy} /></div>}
          <div hidden={activeSection.path !== '/admin/photos'}>
            {photoStatus === 'loading' && <p className="mission-control__notice" role="status">Loading your photo library...</p>}
            {photoStatus === 'error' && <section className="mission-control__notice" role="alert"><h2>Photos is not available yet</h2><p>{photoError}</p><button type="button" onClick={() => setPhotoReload((value) => value + 1)}>Retry photo library</button></section>}
            {photoStatus === 'ready' && <AdminPhotos secret={secret} library={library} onChange={updateLibrary} onBusy={setBusy} />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MissionControl;

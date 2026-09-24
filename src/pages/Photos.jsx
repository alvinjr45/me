import React, { useEffect, useRef, useState } from 'react';
import { getPhotoLibrary } from '../data/photos';
import './Photos.css';

function PhotoIcon({ name }) {
  const paths = {
    library: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    heart: <path d="M20.5 5.5a5 5 0 0 0-8.5 3 5 5 0 0 0-8.5-3C-.5 10 6 15.5 12 20c6-4.5 12.5-10 8.5-14.5Z" />,
    album: <><rect x="5" y="5" width="16" height="16" rx="3" /><path d="M16 2H5a3 3 0 0 0-3 3v11M5 17l5-5 4 4 3-3 4 4" /><circle cx="15" cy="10" r="1" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    back: <path d="m14 5-7 7 7 7" />,
    next: <path d="m10 5 7 7-7 7" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function readFavorites() {
  try {
    const saved = JSON.parse(window.localStorage.getItem('ajt3-photo-favorites'));
    return Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function Photos() {
  const [library, setLibrary] = useState({ photos: [], albums: [] });
  const { photos, albums: photoAlbums } = library;
  const [libraryStatus, setLibraryStatus] = useState('loading');
  const [libraryError, setLibraryError] = useState('');
  const [reload, setReload] = useState(0);
  const [collection, setCollection] = useState('library');
  const [view, setView] = useState('library');
  const [query, setQuery] = useState('');
  const [size, setSize] = useState('comfortable');
  const [favorites, setFavorites] = useState(readFavorites);
  const [selectedId, setSelectedId] = useState(null);
  const [viewerIds, setViewerIds] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const viewerRef = useRef(null);
  const libraryRef = useRef(null);
  const scrollRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const photoButtons = useRef({});
  const returnPhotoRef = useRef(null);
  const touchRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let request = 0;
    const refresh = async () => {
      const current = ++request;
      try {
        const next = await getPhotoLibrary();
        if (!mounted || current !== request) return;
        setLibrary(next);
        setLibraryStatus('ready');
        setLibraryError('');
        setSelectedId((id) => next.photos.some((photo) => photo.id === id) ? id : null);
        setViewerIds((ids) => ids.filter((id) => next.photos.some((photo) => photo.id === id)));
        setCollection((id) => ['library', 'favorites'].includes(id) || next.albums.some((album) => album.id === id) ? id : 'library');
      } catch (error) {
        if (mounted && current === request) { setLibraryStatus('error'); setLibraryError(error.message); }
      }
    };
    const onStorage = (event) => { if (event.key === 'ajt3-photos-updated') refresh(); };
    refresh();
    window.addEventListener('ajt3-photos-updated', refresh);
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      mounted = false;
      window.removeEventListener('ajt3-photos-updated', refresh);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [reload]);

  useEffect(() => {
    try {
      window.localStorage.setItem('ajt3-photo-favorites', JSON.stringify(favorites));
    } catch {
      // Favorites remain usable for this visit when storage is unavailable.
    }
  }, [favorites]);

  const isViewing = selectedId !== null;
  useEffect(() => {
    if (isViewing) {
      viewerRef.current?.focus();
    } else if (returnPhotoRef.current) {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollPositionRef.current;
      (photoButtons.current[returnPhotoRef.current] || libraryRef.current)?.focus({ preventScroll: true });
      returnPhotoRef.current = null;
    }
  }, [isViewing]);

  const album = photoAlbums.find((item) => item.id === collection);
  const title = collection === 'favorites' ? 'Favorites' : album?.title || 'Library';
  const search = query.trim().toLowerCase();
  const visiblePhotos = photos.filter((photo) => {
    const inCollection = collection === 'library' || (collection === 'favorites' ? favorites.includes(photo.id) : photo.album === collection);
    const albumTitle = photoAlbums.find((item) => item.id === photo.album)?.title || '';
    return inCollection && `${photo.title} ${photo.alt} ${albumTitle}`.toLowerCase().includes(search);
  });
  const selectedPhoto = photos.find((photo) => photo.id === selectedId);
  const selectedIndex = viewerIds.indexOf(selectedId);
  const selectedAlbum = photoAlbums.find((item) => item.id === selectedPhoto?.album);
  const albumsView = view === 'albums' && collection === 'library';

  const chooseCollection = (id) => {
    setCollection(id);
    setView('library');
    setQuery('');
  };
  const openPhoto = (photo) => {
    returnPhotoRef.current = photo.id;
    scrollPositionRef.current = scrollRef.current?.scrollTop || 0;
    setViewerIds(visiblePhotos.map((item) => item.id));
    setShowInfo(false);
    setSelectedId(photo.id);
  };
  const movePhoto = (direction) => {
    const next = selectedIndex + direction;
    if (next >= 0 && next < viewerIds.length) setSelectedId(viewerIds[next]);
  };
  const toggleFavorite = () => setFavorites((current) => current.includes(selectedId)
    ? current.filter((id) => id !== selectedId)
    : [...current, selectedId]);

  return (
    <main className="photos-app">
      {selectedPhoto ? (
        <section
          className="photos-viewer"
          aria-label="Photo viewer"
          ref={viewerRef}
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === 'Escape') { event.stopPropagation(); setSelectedId(null); }
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              movePhoto(event.key === 'ArrowLeft' ? -1 : 1);
            }
          }}
        >
          <header className="photos-viewer__toolbar">
            <button type="button" className="photos-app__back" onClick={() => setSelectedId(null)}><PhotoIcon name="back" /><span>Back</span></button>
            <div className="photos-viewer__title" aria-live="polite"><strong>{selectedPhoto.title}</strong><span>{selectedAlbum?.title || 'Photos'}</span></div>
            <button type="button" className="photos-app__icon-button" aria-label="Show photo information" aria-pressed={showInfo} onClick={() => setShowInfo((current) => !current)}><PhotoIcon name="info" /></button>
          </header>
          <div
            className="photos-viewer__stage"
            onTouchStart={(event) => { touchRef.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; }}
            onTouchCancel={() => { touchRef.current = null; }}
            onTouchEnd={(event) => {
              const start = touchRef.current;
              touchRef.current = null;
              if (!start || !event.changedTouches.length) return;
              const dx = event.changedTouches[0].clientX - start.x;
              const dy = event.changedTouches[0].clientY - start.y;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) movePhoto(dx < 0 ? 1 : -1);
            }}
          >
            <img key={selectedPhoto.id} src={selectedPhoto.src} alt={selectedPhoto.alt} />
            <button type="button" className="photos-viewer__previous photos-app__icon-button" aria-label="Previous photo" disabled={selectedIndex === 0} onClick={() => movePhoto(-1)}><PhotoIcon name="back" /></button>
            <button type="button" className="photos-viewer__next photos-app__icon-button" aria-label="Next photo" disabled={selectedIndex === viewerIds.length - 1} onClick={() => movePhoto(1)}><PhotoIcon name="next" /></button>
          </div>
          {selectedPhoto.caption && <p className="photos-viewer__caption">{selectedPhoto.caption}</p>}
          {showInfo && <dl className="photos-viewer__info"><div><dt>Album</dt><dd>{selectedAlbum?.title || 'Photos'}</dd></div><div><dt>Dimensions</dt><dd>{selectedPhoto.width && selectedPhoto.height ? `${selectedPhoto.width} x ${selectedPhoto.height}` : 'Not provided'}</dd></div><div><dt>File</dt><dd>{selectedPhoto.src.split('/').pop()}</dd></div></dl>}
          <div className="photos-viewer__filmstrip" aria-label="Browse photos">
            {viewerIds.map((id) => {
              const photo = photos.find((item) => item.id === id);
              return <button type="button" key={id} aria-label={`View ${photo.title}`} aria-pressed={id === selectedId} onClick={() => setSelectedId(id)}><img src={photo.src} alt="" /></button>;
            })}
          </div>
          <footer className="photos-viewer__footer">
            <span>{selectedIndex + 1} of {viewerIds.length}</span>
            <button type="button" className="photos-app__favorite" aria-label={favorites.includes(selectedId) ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={favorites.includes(selectedId)} onClick={toggleFavorite}><PhotoIcon name="heart" /></button>
            <span className="photos-viewer__hint">Swipe or use arrow keys</span>
          </footer>
        </section>
      ) : (
        <>
          <aside className="photos-app__sidebar">
            <div className="photos-app__identity"><span className="photos-app__monogram">AJ</span><div><strong>Photos</strong><span>A little of my world.</span></div></div>
            <nav className="photos-app__navigation" aria-label="Photo collections">
              <p>Library</p>
              <button type="button" aria-current={collection === 'library' ? 'page' : undefined} onClick={() => chooseCollection('library')}><PhotoIcon name="library" /><span>All Photos</span><small>{photos.length}</small></button>
              <button type="button" aria-current={collection === 'favorites' ? 'page' : undefined} onClick={() => chooseCollection('favorites')}><PhotoIcon name="heart" /><span>Favorites</span><small>{favorites.length}</small></button>
              <p>My Albums</p>
              {photoAlbums.map((item) => <button type="button" key={item.id} aria-current={collection === item.id ? 'page' : undefined} onClick={() => chooseCollection(item.id)}><PhotoIcon name="album" /><span>{item.title}</span></button>)}
            </nav>
            <p className="photos-app__sidebar-note">THE PERSONAL COLLECTION<br /><span>AJ Thompson</span></p>
          </aside>
          <div className="photos-app__library" ref={libraryRef} tabIndex={-1} aria-label="Photo library">
            <header className="photos-app__toolbar">
              <div className="photos-app__segments" aria-label="Library view">
                <button type="button" aria-pressed={!albumsView} onClick={() => setView('library')}>Library</button>
                <button type="button" aria-pressed={albumsView} onClick={() => { setCollection('library'); setView('albums'); }}>Albums</button>
              </div>
              <label className="photos-app__search"><PhotoIcon name="search" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search photos" aria-label="Search photos" /></label>
            </header>
            <div className="photos-app__scroll" ref={scrollRef}>
              {libraryStatus === 'loading' && <p className="photos-app__library-message" role="status">Loading photos...</p>}
              {libraryStatus === 'error' && <div className="photos-app__library-message" role="alert"><p>{libraryError}</p><button type="button" onClick={() => setReload((value) => value + 1)}>Retry</button></div>}
              <header className="photos-app__heading">
                <div><p>AJ'S CAMERA ROLL</p><h1>{albumsView ? 'My Albums' : title}</h1><span>{albumsView ? 'A few collections. A lot of good memories.' : album?.description || 'Little moments. All in one place.'}</span></div>
                {!albumsView && <div className="photos-app__density" aria-label="Photo size"><button type="button" aria-label="Smaller thumbnails" aria-pressed={size === 'compact'} onClick={() => setSize('compact')}>-</button><PhotoIcon name="library" /><button type="button" aria-label="Larger thumbnails" aria-pressed={size === 'comfortable'} onClick={() => setSize('comfortable')}>+</button></div>}
              </header>
              {visiblePhotos.length === 0 ? (libraryStatus === 'ready' &&
                <div className="photos-app__empty"><PhotoIcon name={collection === 'favorites' && !search ? 'heart' : 'search'} /><h2>{search ? 'No photos found' : collection === 'favorites' ? 'Your favorites live here' : 'No photos yet'}</h2><p>{search ? 'Try a different name or collection.' : collection === 'favorites' ? 'Open a photo and tap the heart to save it here. Favorites stay in this browser.' : 'New moments will appear here when they are published.'}</p><button type="button" onClick={() => chooseCollection('library')}>View all photos</button></div>
              ) : albumsView ? (
                <div className="photos-app__albums">{photoAlbums.map((item) => {
                  const items = visiblePhotos.filter((photo) => photo.album === item.id);
                  return items.length ? <button type="button" className="photos-app__album" key={item.id} onClick={() => { setCollection(item.id); setView('library'); }}><img src={items[0].src} alt="" loading="lazy" /><strong>{item.title}</strong><span>{items.length} {items.length === 1 ? 'photo' : 'photos'}</span></button> : null;
                })}</div>
              ) : (
                <div className={`photos-app__grid photos-app__grid--${size}`}>
                  {visiblePhotos.map((photo) => <button type="button" className="photos-app__tile" key={photo.id} ref={(element) => { photoButtons.current[photo.id] = element; }} aria-label={`Open ${photo.title}${favorites.includes(photo.id) ? ', favorite' : ''}`} onClick={() => openPhoto(photo)}><img src={photo.src} alt={photo.alt} loading="lazy" width={photo.width} height={photo.height} /><span className="photos-app__tile-title">{photo.title}</span>{favorites.includes(photo.id) && <span className="photos-app__tile-heart"><PhotoIcon name="heart" /></span>}</button>)}
                </div>
              )}
              <footer className="photos-app__count" aria-live="polite">{visiblePhotos.length} {visiblePhotos.length === 1 ? 'photo' : 'photos'}<span>{collection === 'favorites' ? 'Saved in this browser' : 'A collection by AJ Thompson'}</span></footer>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default Photos;

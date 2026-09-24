import React, { useEffect, useState } from 'react';
import { normalizeUploadFile } from '../lib/adminPostEditor';
import { notifyPhotoLibraryChanged, requestPhotoLibrary } from '../lib/adminPhotoLibrary';

const emptyPhoto = { id: '', title: '', album_id: '', image_url: '', alt_text: '', caption: '', sort_order: 0, width: '', height: '', is_published: true };
const emptyAlbum = { id: '', title: '', description: '', sort_order: 0 };

function AdminPhotos({ secret, library, onChange, onBusy }) {
  const [mode, setMode] = useState('photos');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [photo, setPhoto] = useState(null);
  const [album, setAlbum] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [dirty, setDirty] = useState(false);
  const [albumDirty, setAlbumDirty] = useState(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const working = status === 'saving' || status === 'preparing';

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectPhoto(item) {
    if (dirty && !window.confirm('Discard your unsaved photo changes?')) return;
    setPhoto(item ? { ...emptyPhoto, ...item, width: item.width || '', height: item.height || '' } : {
      ...emptyPhoto, album_id: library.albums[0]?.id || '',
      sort_order: library.photos.length ? Math.max(...library.photos.map((entry) => entry.sort_order)) + 1 : 0
    });
    setFile(null);
    setDirty(false);
    setStatus('idle');
    setMessage('');
  }

  function selectAlbum(item) {
    if (albumDirty && !window.confirm('Discard your unsaved album changes?')) return;
    setAlbum(item ? { ...item } : { ...emptyAlbum, sort_order: library.albums.length });
    setAlbumDirty(false);
    setStatus('idle');
    setMessage('');
  }

  function updatePhoto(name, value) {
    setPhoto((current) => ({ ...current, [name]: value }));
    setDirty(true);
  }

  async function chooseFile(event) {
    const selected = event.target.files[0];
    event.target.value = '';
    if (!selected) return;
    setStatus('preparing');
    setMessage('Preparing your image...');
    onBusy(true);
    try {
      const image = await normalizeUploadFile(selected);
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(image.type)) throw new Error('Choose a JPG, PNG, WebP, GIF, or HEIC photo.');
      setFile(image);
      setPhoto((current) => ({ ...current, width: '', height: '' }));
      setDirty(true);
      setStatus('idle');
      setMessage('Image ready. Save the photo to upload it.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    } finally {
      onBusy(false);
    }
  }

  async function savePhoto(event) {
    event.preventDefault();
    setStatus('saving');
    setMessage('');
    onBusy(true);
    try {
      const body = new FormData();
      body.append('action', 'save_photo');
      for (const key of Object.keys(emptyPhoto)) body.append(key, String(photo[key] ?? ''));
      if (file) body.append('file', file);
      const result = await requestPhotoLibrary(secret, body);
      if (!result.photo?.id) throw new Error('The photo service did not confirm the save. Please refresh before retrying.');
      onChange('photos', result.photo);
      setPhoto({ ...emptyPhoto, ...result.photo, width: result.photo.width || '', height: result.photo.height || '' });
      setFile(null);
      setDirty(false);
      setStatus('saved');
      setMessage(result.photo.is_published ? 'Photo saved and published to your camera roll.' : 'Photo saved. It is hidden from the camera roll.');
      notifyPhotoLibraryChanged();
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    } finally {
      onBusy(false);
    }
  }

  async function saveAlbum(event) {
    event.preventDefault();
    setStatus('saving');
    setMessage('');
    onBusy(true);
    try {
      const result = await requestPhotoLibrary(secret, { ...album, action: 'save_album' });
      if (!result.album?.id) throw new Error('The photo service did not confirm the album save. Please refresh before retrying.');
      onChange('albums', result.album);
      setAlbum(result.album);
      setAlbumDirty(false);
      setStatus('saved');
      setMessage('Album saved. Albums appear publicly when they contain published photos.');
      notifyPhotoLibraryChanged();
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    } finally {
      onBusy(false);
    }
  }

  const matching = library.photos.filter((item) => `${item.title} ${item.alt_text} ${item.caption}`.toLowerCase().includes(query.toLowerCase()) &&
    (filter === 'all' || (filter === 'published' ? item.is_published : !item.is_published)));

  return (
    <main className="admin-page admin-page--mission-control admin-photos">
      <header className="admin-photos__toolbar"><div><h1>Photo library</h1><p>Make room for the moments worth keeping.</p></div><div className="admin-page__button-group"><button type="button" disabled={working} onClick={() => { setMode('photos'); selectPhoto(null); }}>Add photo</button><button type="button" disabled={working} onClick={() => { setMode('albums'); selectAlbum(null); }}>New album</button></div></header>
      <div className="admin-photos__tabs" aria-label="Photo management view"><button type="button" disabled={working} aria-pressed={mode === 'photos'} onClick={() => setMode('photos')}>Photos ({library.photos.length})</button><button type="button" disabled={working} aria-pressed={mode === 'albums'} onClick={() => setMode('albums')}>Albums ({library.albums.length})</button></div>
      {message && <p className={`admin-page__message admin-page__message--${status}`} role={status === 'error' ? 'alert' : 'status'}>{message}</p>}
      {mode === 'photos' ? (
        <div className="admin-photos__layout">
          <section className="admin-photos__collection" aria-label="Manage photos">
            <label>Search photos<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
            <label>Visibility<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All photos</option><option value="published">Published</option><option value="hidden">Hidden</option></select></label>
            <div className="admin-photos__items">{matching.map((item) => <button type="button" key={item.id} disabled={working} aria-pressed={photo?.id === item.id} onClick={() => selectPhoto(item)}><img src={item.image_url} alt="" loading="lazy" /><span><strong>{item.title}</strong><small>{item.is_published ? 'Published' : 'Hidden'} / {library.albums.find((entry) => entry.id === item.album_id)?.title || 'Album'}</small></span></button>)}</div>
            {!matching.length && <p className="admin-page__hint">{library.photos.length ? 'No matching photos.' : 'Start your library with a photo.'}</p>}
          </section>
          {photo ? (
            <form className="admin-photos__editor" onSubmit={savePhoto}>
              <fieldset disabled={working}>
                <legend>{photo.id ? 'Edit photo' : 'New photo'}</legend>
                {(preview || photo.image_url) && <img className="admin-photos__preview" src={preview || photo.image_url} alt={photo.alt_text || 'Photo preview'} onLoad={(event) => {
                  if (file) { const { naturalWidth, naturalHeight } = event.currentTarget; setPhoto((current) => ({ ...current, width: naturalWidth, height: naturalHeight })); }
                }} />}
                <label>Upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif" onChange={chooseFile} /></label>
                <p className="admin-page__hint">JPG, PNG, WebP, GIF, or HEIC. Up to 20 MB per photo.</p>
                {file ? <div className="admin-photos__file"><span>{file.name}</span><button type="button" onClick={() => { setFile(null); updatePhoto('width', ''); updatePhoto('height', ''); }}>Cancel replacement</button></div> : <label>Image URL<input required value={photo.image_url} inputMode="url" placeholder="https://... or /images/..." maxLength={2048} onChange={(event) => { updatePhoto('image_url', event.target.value); updatePhoto('width', ''); updatePhoto('height', ''); }} /></label>}
                <label>Photo title<input required maxLength={160} value={photo.title} onChange={(event) => updatePhoto('title', event.target.value)} /></label>
                <label>Album<select required value={photo.album_id} onChange={(event) => updatePhoto('album_id', event.target.value)}><option value="" disabled>Choose an album</option>{library.albums.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
                {!library.albums.length && <p className="admin-page__hint">Create an album before saving your first photo.</p>}
                <label>Alt text<input required maxLength={500} value={photo.alt_text} onChange={(event) => updatePhoto('alt_text', event.target.value)} /></label>
                <p className="admin-page__hint">Describe the image for visitors using screen readers.</p>
                <label>Caption<textarea maxLength={2000} value={photo.caption} onChange={(event) => updatePhoto('caption', event.target.value)} /></label>
                <details><summary>Display order and dimensions</summary><label>Display order<input type="number" min="0" max="1000000" step="1" required value={photo.sort_order} onChange={(event) => updatePhoto('sort_order', event.target.value)} /></label><p className="admin-page__hint">Lower numbers appear first.</p><div className="admin-page__row"><label>Width (px)<input type="number" min="1" max="1000000" step="1" value={photo.width} onChange={(event) => updatePhoto('width', event.target.value)} /></label><label>Height (px)<input type="number" min="1" max="1000000" step="1" value={photo.height} onChange={(event) => updatePhoto('height', event.target.value)} /></label></div></details>
                <label className="admin-page__toggle"><input type="checkbox" checked={photo.is_published} onChange={(event) => updatePhoto('is_published', event.target.checked)} />Publish in Photos</label>
                <p className="admin-page__hint">Hidden photos leave the library, but their image links remain accessible.</p>
                <button type="submit" disabled={!library.albums.length}>{status === 'saving' ? 'Saving photo...' : 'Save photo'}</button>
              </fieldset>
            </form>
          ) : <div className="admin-photos__placeholder"><h2>Every photo has a story.</h2><p>Select a photo to edit its details, or add something new to the roll.</p></div>}
        </div>
      ) : (
        <div className="admin-photos__layout">
          <section className="admin-photos__collection" aria-label="Manage albums"><div className="admin-photos__items">{library.albums.map((item) => <button type="button" key={item.id} disabled={working} aria-pressed={album?.id === item.id} onClick={() => selectAlbum(item)}><span><strong>{item.title}</strong><small>{library.photos.filter((entry) => entry.album_id === item.id).length} photos</small></span></button>)}</div>{!library.albums.length && <p>No albums yet.</p>}</section>
          {album ? <form className="admin-photos__editor" onSubmit={saveAlbum}><fieldset disabled={working}><legend>{album.id ? 'Edit album' : 'New album'}</legend><label>Album title<input required maxLength={120} value={album.title} onChange={(event) => { setAlbum({ ...album, title: event.target.value }); setAlbumDirty(true); }} /></label><label>Description<textarea maxLength={1000} value={album.description} onChange={(event) => { setAlbum({ ...album, description: event.target.value }); setAlbumDirty(true); }} /></label><label>Display order<input type="number" min="0" max="1000000" step="1" required value={album.sort_order} onChange={(event) => { setAlbum({ ...album, sort_order: event.target.value }); setAlbumDirty(true); }} /></label><p className="admin-page__hint">Lower numbers appear first. Add published photos to make this album visible.</p><button type="submit">{status === 'saving' ? 'Saving album...' : 'Save album'}</button></fieldset></form> : <div className="admin-photos__placeholder"><h2>Put a collection together.</h2><p>Create an album, then assign photos to it.</p></div>}
        </div>
      )}
    </main>
  );
}

export default AdminPhotos;

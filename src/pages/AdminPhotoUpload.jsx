import React, { useRef, useState } from 'react';
import { normalizeUploadFile } from '../lib/adminPostEditor';
import { notifyPhotoLibraryChanged, requestPhotoLibrary } from '../lib/adminPhotoLibrary';

export default function AdminPhotoUpload({ secret, library, onChange, onBusy, onClose }) {
  const [queue, setQueue] = useState([]);
  const [albumId, setAlbumId] = useState(library.albums[0]?.id || '');
  const [published, setPublished] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const uploading = useRef(false);
  const remaining = queue.filter((item) => item.status !== 'saved');

  function updateItem(id, changes) {
    setQueue((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  }

  function chooseFiles(event) {
    const files = Array.from(event.target.files);
    event.target.value = '';
    setQueue((current) => [...current, ...files.map((file) => ({
      id: crypto.randomUUID(), file, name: file.name,
      title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 160),
      status: 'ready', error: '', sortOrder: null
    }))]);
    setMessage('');
  }

  async function upload(event) {
    event.preventDefault();
    if (uploading.current || !remaining.length) return;
    if (!library.albums.some((album) => album.id === albumId)) {
      setMessage('Choose an album before uploading.');
      return;
    }
    if (remaining.some((item) => !item.title.trim())) {
      setMessage('Add a title for each photo before uploading.');
      return;
    }
    uploading.current = true;
    setWorking(true);
    onBusy(true);
    let saved = 0;
    let failed = 0;
    let nextOrder = Math.max(-1, ...library.photos.map((item) => Number(item.sort_order)), ...queue.map((item) => item.sortOrder ?? -1)) + 1;
    try {
      for (const [index, item] of remaining.entries()) {
        const sortOrder = item.sortOrder ?? nextOrder++;
        updateItem(item.id, { status: 'uploading', error: '', sortOrder });
        setMessage(`Uploading ${index + 1} of ${remaining.length}: ${item.name}`);
        try {
          const file = await normalizeUploadFile(item.file);
          if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || !file.size) {
            throw new Error('Choose a non-empty JPG, PNG, WebP, GIF, or HEIC photo.');
          }
          const body = new FormData();
          const fields = {
            action: 'save_photo', id: item.id, title: item.title.trim(),
            album_id: albumId, is_published: published, sort_order: sortOrder, caption: '', width: '', height: ''
          };
          for (const [key, value] of Object.entries(fields)) body.append(key, String(value));
          body.append('file', file);
          const result = await requestPhotoLibrary(secret, body);
          if (result.photo?.id !== item.id) throw new Error('The save could not be confirmed. Retry to confirm this photo.');
          onChange('photos', result.photo);
          updateItem(item.id, { status: 'saved', file: null });
          saved += 1;
        } catch (error) {
          updateItem(item.id, { status: 'error', error: error.message });
          failed += 1;
        }
      }
      if (saved) notifyPhotoLibraryChanged();
      setMessage(`${saved} ${saved === 1 ? 'photo' : 'photos'} uploaded.${failed ? ` ${failed} failed. Review the errors and retry the remaining photos.` : ' All selected photos are saved.'}`);
    } finally {
      uploading.current = false;
      setWorking(false);
      onBusy(false);
    }
  }

  function close() {
    if (remaining.length && !window.confirm('Discard the photos that have not uploaded? Saved photos will stay in your library.')) return;
    onClose();
  }

  return (
    <form className="admin-photos__upload admin-photos__editor" onSubmit={upload} aria-label="Upload multiple photos">
      <fieldset disabled={working}>
        <legend>Upload photos</legend>
        <div className="admin-page__row">
          <label>Upload to album<select required value={albumId} onChange={(event) => setAlbumId(event.target.value)}><option value="" disabled>Choose an album</option>{library.albums.map((album) => <option key={album.id} value={album.id}>{album.title}</option>)}</select></label>
          <label>Choose photos<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif" onChange={chooseFiles} /></label>
        </div>
        <p className="admin-page__hint">Select several photos at once. Up to 20 MB each, including HEIC. Review titles before uploading.</p>
        <label className="admin-page__toggle"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} />Publish uploaded photos</label>
        <ul className="admin-photos__queue">
          {queue.map((item) => <li key={item.id}>
            <div className="admin-photos__queue-heading"><span>{item.name}</span><span>{item.status === 'saved' ? 'Saved' : item.status === 'uploading' ? 'Uploading...' : item.status === 'error' ? 'Failed' : 'Ready'}</span></div>
            {item.status !== 'saved' && <>
              <div className="admin-page__row">
                <label>Title<input required aria-label={`Title for ${item.name}`} maxLength={160} value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} /></label>
              </div>
              {item.error && <p className="admin-photos__upload-error" role="alert">{item.error}</p>}
              <button type="button" aria-label={`Remove ${item.name}`} onClick={() => setQueue((current) => current.filter((entry) => entry.id !== item.id))}>Remove</button>
            </>}
          </li>)}
        </ul>
        <div className="admin-page__button-group">
          <button type="submit" disabled={!remaining.length || !library.albums.length}>{working ? 'Uploading...' : queue.some((item) => item.status === 'error') ? 'Retry remaining photos' : `Upload ${remaining.length || ''} ${remaining.length === 1 ? 'photo' : 'photos'}`}</button>
          <button type="button" onClick={close}>{remaining.length ? 'Cancel' : 'Done'}</button>
        </div>
      </fieldset>
      {message && <p className="admin-page__message" role="status">{message}</p>}
    </form>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { normalizeUploadFile } from '../lib/adminPostEditor';
import { requestPhotoLibrary } from '../lib/adminPhotoLibrary';

export default function AdminProfile({ secret, imageUrl, onChange, onBusy }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const working = status === 'preparing' || status === 'saving';

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function choosePhoto(event) {
    const selected = event.target.files[0];
    event.target.value = '';
    if (!selected) return;
    setStatus('preparing');
    setMessage('Preparing photo...');
    onBusy(true);
    try {
      const image = await normalizeUploadFile(selected);
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(image.type) || !image.size) {
        throw new Error('Choose a JPG, PNG, WebP, GIF, or HEIC photo.');
      }
      setFile(image);
      setStatus('idle');
      setMessage('');
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    } finally {
      onBusy(false);
    }
  }

  async function savePhoto() {
    if (!file || working) return;
    setStatus('saving');
    setMessage('Saving photo...');
    onBusy(true);
    try {
      const body = new FormData();
      body.append('action', 'save_profile');
      body.append('file', file);
      const { profile } = await requestPhotoLibrary(secret, body);
      if (profile?.id !== 'admin' || !profile.image_url) throw new Error('The profile update could not be confirmed. Please retry.');
      onChange(profile.image_url);
      setFile(null);
      setStatus('saved');
      setMessage('Profile photo updated.');
    } catch (error) {
      setStatus('error');
      setMessage(error.message);
    } finally {
      onBusy(false);
    }
  }

  return (
    <section className="mission-control__profile" aria-label="Admin profile photo">
      <div className="mission-control__profile-row">
        <span className="mission-control__profile-avatar">{preview || imageUrl ? <img src={preview || imageUrl} alt="Administrator" /> : <span aria-hidden="true">A/3</span>}</span>
        <div className="mission-control__profile-label"><strong>Profile photo</strong><span>Administrator</span></div>
        <input ref={inputRef} type="file" hidden aria-label="Choose admin profile photo" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif" disabled={working} onChange={choosePhoto} />
        <div className="mission-control__profile-actions">
          <button type="button" disabled={working} onClick={() => inputRef.current?.click()}>Change photo</button>
          {file && <><button type="button" className="mission-control__profile-save" disabled={working} onClick={savePhoto}>Save</button><button type="button" disabled={working} onClick={() => { setFile(null); setStatus('idle'); setMessage(''); }}>Cancel</button></>}
        </div>
      </div>
      {message && <p role={status === 'error' ? 'alert' : 'status'}>{message}</p>}
    </section>
  );
}

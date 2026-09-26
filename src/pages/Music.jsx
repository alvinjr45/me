import React, { useEffect, useRef, useState } from 'react';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import FastRewindRounded from '@mui/icons-material/FastRewindRounded';
import PlayArrowRounded from '@mui/icons-material/PlayArrowRounded';
import SkipNextRounded from '@mui/icons-material/SkipNextRounded';
import MusicSolarSystem from '../components/MusicSolarSystem';
import { usePhoneBack } from '../components/deviceSettings';
import musicPlaylists from '../data/musicPlaylists';
import './Music.css';

function MusicPlaylistPlayer({ playlist, id, titleId, titleRef, showMore = false }) {
  const playlistUrl = playlist.src.replace('embed.music.apple.com', 'music.apple.com');

  return (
    <aside id={id} className="music-player" aria-label="Apple Music playlist preview"
      style={{ '--playlist-color': playlist.color }}>
      <a className="music-player__link" href={playlistUrl} target="_blank" rel="noopener noreferrer"
        aria-label={`Open ${playlist.title} playlist in Apple Music (opens in a new tab)`}>
        <div key={playlist.key} className="music-player__preview">
          <img className="music-player__artwork" src={playlist.artwork} alt={`${playlist.title} cover`}
            onError={(event) => { event.currentTarget.hidden = true; }} />
          <h2 id={titleId} ref={titleRef} tabIndex={titleRef ? -1 : undefined}
            className="music-player__title" aria-live="polite">{playlist.title}</h2>
          <div className="music-player__controls" aria-hidden="true">
            <span className="music-player__control"><FastRewindRounded /></span>
            <span className="music-player__control music-player__control--play"><PlayArrowRounded /></span>
            <span className="music-player__control"><SkipNextRounded /></span>
          </div>
          <ol className="music-player__tracks" aria-label={`${playlist.title} song preview`}>
            {playlist.tracks.map((track, index) => (
              <li key={`${track.id}-${index}`}>
                <span className="music-player__track-number" aria-hidden="true">{index + 1}</span>
                <span className="music-player__track-info">
                  <span>{track.title}</span><small>{track.artist}</small>
                </span>
                <span className="music-player__duration">{track.duration}</span>
              </li>
            ))}
          </ol>
          {showMore && playlist.tracks.length === 15 && (
            <span className="music-player__more">+ more on Apple Music &rarr;</span>
          )}
        </div>
      </a>
    </aside>
  );
}

function Music() {
  const [selectedKey, setSelectedKey] = useState(musicPlaylists[0].key);
  const [mobilePlaylistOpen, setMobilePlaylistOpen] = useState(false);
  const mobileTitleRef = useRef(null);
  const mobileSelectionRef = useRef(null);
  const mobileLibraryRef = useRef(null);
  const mobileScrollRef = useRef(0);
  const current = musicPlaylists.find((playlist) => playlist.key === selectedKey) || musicPlaylists[0];

  useEffect(() => {
    if (mobilePlaylistOpen) {
      mobileTitleRef.current?.focus({ preventScroll: true });
    } else if (mobileSelectionRef.current) {
      mobileLibraryRef.current.scrollTop = mobileScrollRef.current;
      mobileSelectionRef.current.focus({ preventScroll: true });
    }
  }, [mobilePlaylistOpen]);

  usePhoneBack(() => setMobilePlaylistOpen(false), mobilePlaylistOpen, 'Music');

  return (
    <main className="music-page app-view" aria-label="Music">
      <section className="music-mobile" aria-label="Music library">
        <div className="music-mobile__library" ref={mobileLibraryRef} hidden={mobilePlaylistOpen}>
          <header className="music-mobile__header">
            <p className="music-mobile__eyebrow">THE COLLECTION / {musicPlaylists.length} PLAYLISTS</p>
            <h1>Your next listen.</h1>
            <p>Pick a playlist. Find your mood.</p>
          </header>
          <ul className="music-mobile__grid">
            {musicPlaylists.map((playlist) => (
              <li key={playlist.key}>
                <button type="button" className="music-mobile__playlist"
                  aria-label={`Browse ${playlist.title} playlist`}
                  onClick={(event) => {
                    mobileSelectionRef.current = event.currentTarget;
                    mobileScrollRef.current = mobileLibraryRef.current.scrollTop;
                    setSelectedKey(playlist.key);
                    setMobilePlaylistOpen(true);
                  }}>
                  <span className="music-mobile__cover" style={{ '--playlist-color': playlist.color }}>
                    <span aria-hidden="true">{playlist.title.slice(0, 1)}</span>
                    <img src={playlist.artwork} alt="" loading="lazy" decoding="async"
                      onError={(event) => { event.currentTarget.hidden = true; }} />
                  </span>
                  <strong>{playlist.title}</strong>
                  <span className="music-mobile__playlist-label">View playlist <span aria-hidden="true">&rarr;</span></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {mobilePlaylistOpen && (
          <section className="music-mobile__detail" aria-labelledby="music-mobile-title">
            <div className="music-mobile__navigation">
              <button type="button" className="music-mobile__back" onClick={() => setMobilePlaylistOpen(false)}>
                <ArrowBackRounded aria-hidden="true" /> All playlists
              </button>
            </div>
            <MusicPlaylistPlayer playlist={current} titleId="music-mobile-title" titleRef={mobileTitleRef}
              showMore />
          </section>
        )}
      </section>
      <section className="music-experience" aria-label="Music library">
        <MusicSolarSystem playlists={musicPlaylists} selectedKey={selectedKey} onSelect={setSelectedKey} />
        <MusicPlaylistPlayer id="music-playlist-player" playlist={current} />
      </section>
    </main>
  );
}

export default Music;

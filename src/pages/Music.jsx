import React, { useState } from 'react';
import MusicSolarSystem from '../components/MusicSolarSystem';
import musicPlaylists from '../data/musicPlaylists';
import './Music.css';

function Music() {
  const [selectedKey, setSelectedKey] = useState(musicPlaylists[0].key);
  const [showSongs, setShowSongs] = useState(false);
  const current = musicPlaylists.find((playlist) => playlist.key === selectedKey) || musicPlaylists[0];

  return (
    <main className="music-page app-view" aria-label="Music">
      <section className="music-experience" aria-label="Music library">
        <MusicSolarSystem playlists={musicPlaylists} selectedKey={selectedKey} onSelect={setSelectedKey} />
        <aside id="music-playlist-player" className="music-player" aria-label="Apple Music playlist player"
          style={{ '--playlist-color': current.color }}>
          <header className="music-player__header">
            <div><h2 aria-live="polite">{current.title}</h2></div>
            <a href={current.src.replace('embed.music.apple.com', 'music.apple.com')}
              target="_blank" rel="noopener noreferrer" aria-label={`Open ${current.title} in Apple Music`}>
              Apple Music <span aria-hidden="true">&#8599;</span>
            </a>
          </header>
          <div className="music-player__views" role="group" aria-label="Playlist view">
            <button type="button" aria-pressed={!showSongs} onClick={() => setShowSongs(false)}>Player</button>
            <button type="button" aria-pressed={showSongs} onClick={() => setShowSongs(true)}>
              {current.tracks.length === 15 ? 'First 15 songs' : `${current.tracks.length} songs`}
            </button>
          </div>
          {showSongs ? (
            <div key={current.key} className="music-player__preview">
              <img className="music-player__artwork" src={current.artwork} alt={`${current.title} cover`}
                onError={(event) => { event.currentTarget.hidden = true; }} />
              <ol className="music-player__tracks" aria-label={`${current.title} song preview`}>
                {current.tracks.map((track, index) => (
                  <li key={`${track.id}-${index}`}>
                    <span className="music-player__track-number" aria-hidden="true">{index + 1}</span>
                    <a href={track.url} target="_blank" rel="noopener noreferrer"
                      aria-label={`${track.title} by ${track.artist}, open in Apple Music`}>
                      <span>{track.title}</span><small>{track.artist}</small>
                    </a>
                    <span className="music-player__duration">{track.duration}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : <div className="music-player__embed">
            <iframe
              key={current.key}
              allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
              src={current.src}
              sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
              title={`${current.title} on Apple Music`}
              loading="eager"
            />
          </div>}
        </aside>
      </section>
    </main>
  );
}

export default Music;

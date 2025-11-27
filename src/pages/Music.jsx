import React, { useState } from 'react';
import './Music.css';

const playlists = {
  funk: {
    title: 'Funk',
    embed: 'https://embed.music.apple.com/us/playlist/funk/pl.u-bxEGs39yJv8',
  },
  hm: {
    title: 'H&M',
    embed: 'https://embed.music.apple.com/us/playlist/h-m/pl.u-PPKVuyKL02E',
  },
  gospel: {
    title: 'Gospel',
    embed: 'https://embed.music.apple.com/us/playlist/gospel/pl.u-b6y8t39yJv8',
  },
};
function Music() {
  const [active, setActive] = useState('hm');

  const current = playlists[active];

  return (
    <main className="music-page">
      <section className="music-page__copy">
        <p>Favorite tracks</p>
        <h1>.music()</h1>
        <p>
          A rotating playlist where I celebrate the beats that fuel late-night keyboard sessions.
        </p>
        <p>
          Piano improvisations keep me grounded.
        </p>
      </section>
      <section className="music-page__embed-layout">
        <div className="music-page__playlist-nav">
          {Object.entries(playlists).map(([key, playlist]) => (
            <button
              key={key}
              className={`music-page__page-button ${
                active === key ? 'music-page__page-button--active' : ''
              }`}
              onClick={() => setActive(key)}
              type="button"
            >
              {playlist.title}
            </button>
          ))}
        </div>
        <div className="music-page__embed">
          <iframe
            key={`${active}-${current.title}`}
            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
            frameBorder="0"
            width="100%"
            height="820"
            className="music-page__iframe"
            src={current.embed}
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            title={`${current.title} Playlist`}
            loading="eager"
          />
        </div>
      </section>
    </main>
  );
}

export default Music;

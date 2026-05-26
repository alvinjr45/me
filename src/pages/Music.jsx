import React, { useState, useEffect, useRef } from 'react';
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
const artistPages = [
  { key: 'weeknd', title: 'The Weeknd', src: 'https://embed.music.apple.com/us/playlist/the-weeknd/pl.u-BpJesRv1kPN' },
  { key: 'drizzy', title: 'Drizzy', src: 'https://embed.music.apple.com/us/playlist/drake/pl.u-lx4JTP2ja3D' },
  { key: 'cole', title: 'Cole', src: 'https://embed.music.apple.com/us/playlist/carolinas-finest/pl.u-vvdMt8YzK6p' },
];

const songsPages = [
  { key: 'top10', title: 'Top 10', src: 'https://embed.music.apple.com/us/playlist/top-10-songs-of-all-time/pl.u-AZ5aTlm28oZ' },
  {
    key: 'favorites',
    title: 'Favorites',
    src: 'https://embed.music.apple.com/us/playlist/favorite-songs/pl.u-XzUgPDVM8'
  },
];

const navOrder = {
  hm: 1,
  funk: 2,
  gospel: 3,
  weeknd: 1,
  drizzy: 2,
  cole: 3,
};

function Music() {
  const [activePlaylist, setActivePlaylist] = useState('funk');
  const [activeArtist, setActiveArtist] = useState('drizzy');
  const [activeSongs, setActiveSongs] = useState('top10');
  const [isReady, setIsReady] = useState(false);
  const [artistVisible, setArtistVisible] = useState(false);
  const [framesInitial, setFramesInitial] = useState(false);
  const artistRef = useRef(null);
  const songsRef = useRef(null);
  const artistDelay = useRef(null);
  const artistVisibleRef = useRef(artistVisible);
  const activePlaylistFrame = playlists[activePlaylist];
  const activeArtistFrame = artistPages.find((page) => page.key === activeArtist);
  const activeSongsFrame = songsPages.find((page) => page.key === activeSongs);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 1450);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return undefined;
    }
    setFramesInitial(true);
    const timer = setTimeout(() => setFramesInitial(false), 1200);
    return () => clearTimeout(timer);
  }, [isReady]);

  useEffect(() => {
    if (!artistRef.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        if (inView && !artistVisibleRef.current) {
          if (artistDelay.current) {
            clearTimeout(artistDelay.current);
          }
            artistDelay.current = setTimeout(() => {
              setArtistVisible(true);
              artistVisibleRef.current = true;
              artistDelay.current = null;
            }, 500);
        }
      },
      { rootMargin: '-20% 0px 0px 0px', threshold: 0 }
    );

    observer.observe(artistRef.current);
    return () => {
      observer.disconnect();
      if (artistDelay.current) {
        clearTimeout(artistDelay.current);
      }
    };
  }, []);

  return (
    <main className={`music-page${isReady ? ' music-page--ready' : ''}`}>
      <div className="music-page__primary">
        <section className={`music-page__copy${isReady ? ' music-page__copy--visible' : ''}`}>
          <p>Favorite sounds</p>
          <h1>.playlists( )</h1>
          <p>
            Rotating playlists where I highlight my favorite sounds and moods.
            <br />
            Enjoy the flows that fuel late-night keyboard sessions.
          </p>
        </section>
        <section className="music-page__embed-layout">
          <div className={`music-page__playlist-nav ${isReady ? 'music-page__playlist-nav--visible' : 'music-page__playlist-nav--hidden'}`}>
            {Object.entries(playlists).map(([key, playlist]) => (
              <button
                key={key}
                className={`music-page__page-button ${
                  activePlaylist === key ? 'music-page__page-button--active' : ''
                }`}
                onClick={() => setActivePlaylist(key)}
                type="button"
                style={{ order: navOrder[key] ?? 0 }}
              >
                {playlist.title}
              </button>
            ))}
          </div>
          <div className="music-page__embed">
            {activePlaylistFrame ? (
              <iframe
                key={activePlaylist}
                allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                frameBorder="0"
                width="100%"
                height="820"
                className={`music-page__iframe ${isReady ? 'music-page__iframe--active' : ''} ${
                  isReady && framesInitial ? 'music-page__iframe--initial' : ''
                }`}
                src={activePlaylistFrame.embed}
                sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                title={`${activePlaylistFrame.title} Playlist`}
                loading="eager"
              />
            ) : null}
          </div>
        </section>
      </div>
      <section
        className={`music-page__artist-section music-page__section-fade ${
          artistVisible ? 'music-page__section-fade--visible' : ''
        }`}
        ref={artistRef}
      >
        <div className="music-page__artist-frames">
          <div className={`music-page__playlist-nav ${isReady ? 'music-page__playlist-nav--visible' : 'music-page__playlist-nav--hidden'}`}>
            {artistPages.map((page) => (
              <button
                key={`${page.key}-dup`}
                className={`music-page__page-button ${
                  activeArtist === page.key ? 'music-page__page-button--active' : ''
                }`}
                onClick={() => setActiveArtist(page.key)}
                type="button"
                style={{ order: navOrder[page.key] }}
              >
                {page.title}
              </button>
            ))}
          </div>
          <div className="music-page__embed">
            {activeArtistFrame ? (
              <iframe
                key={activeArtist}
                allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                frameBorder="0"
                width="100%"
                height="820"
                className={`music-page__iframe ${isReady ? 'music-page__iframe--active' : ''} ${
                  isReady && framesInitial ? 'music-page__iframe--initial' : ''
                }`}
                src={activeArtistFrame.src}
                sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                title={`${activeArtistFrame.title} Playlist`}
                loading="eager"
              />
            ) : null}
          </div>
        </div>
        <div className="music-page__artist-copy">
          <p>Favorite players</p>
          <h1>.artists( )</h1>
          <p>
            These are the creatives whose work I keep on repeat—<br />
            the artists who can kick start any day.
          </p>
        </div>
      </section>

      <section
        className={`music-page__songs-section music-page__section-fade ${
          artistVisible ? 'music-page__section-fade--visible' : ''
        }`}
        ref={songsRef}
      >
        <div className={`music-page__copy music-page__songs-copy${isReady ? ' music-page__copy--visible' : ''}`}>
          <p>Curated cuts</p>
          <h1>.songs( )</h1>
          <p>These are tracks that played through the late-night lab sessions.</p>
        </div>
        <section className="music-page__songs-embed">
          <div className={`music-page__playlist-nav ${isReady ? 'music-page__playlist-nav--visible' : 'music-page__playlist-nav--hidden'}`}>
            {songsPages.map((page) => (
              <button
                key={`${page.key}-songs`}
                className={`music-page__page-button ${
                  activeSongs === page.key ? 'music-page__page-button--active' : ''
                }`}
                type="button"
                onClick={() => setActiveSongs(page.key)}
              >
                {page.title}
              </button>
            ))}
          </div>
          <div className="music-page__embed">
            {activeSongsFrame ? (
              <iframe
                key={activeSongs}
                allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                frameBorder="0"
                width="100%"
                height="820"
                className={`music-page__iframe ${isReady ? 'music-page__iframe--active' : ''} ${
                  isReady && framesInitial ? 'music-page__iframe--initial' : ''
                }`}
                src={activeSongsFrame.src}
                sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                title={`${activeSongsFrame.title} songs playlist`}
                loading="eager"
              />
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}

export default Music;

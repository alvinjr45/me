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
  { key: 'drizzy', title: 'Drizzy', src: 'https://embed.music.apple.com/us/playlist/drake/pl.u-lx4JTP2ja3D' },
  { key: 'wunna', title: 'Wunna', src: 'https://embed.music.apple.com/us/playlist/gunna/pl.u-RgV5TeP3q1a' },
  { key: 'pluto', title: 'Pluto', src: 'https://embed.music.apple.com/us/playlist/pluto/pl.u-le6AcP2ja3D' },
  { key: 'weeknd', title: 'The Weeknd', src: 'https://embed.music.apple.com/us/playlist/the-weeknd/pl.u-BpJesRv1kPN' },
  { key: 'cole', title: 'Cole', src: 'https://embed.music.apple.com/us/playlist/carolinas-finest/pl.u-vvdMt8YzK6p' },
];

const songsPages = [
  { key: 'top10', title: 'Top 10', src: 'https://embed.music.apple.com/us/playlist/top-10-songs-of-all-time/pl.u-AZ5aTlm28oZ' },
  { key: 'songofday', title: 'Song of the day', src: 'https://embed.music.apple.com/us/album/cpr/1438765128?i=1438765140' },
];

const navOrder = {
  wunna: 1,
  pluto: 2,
  drizzy: 3,
  weeknd: 4,
  cole: 5,
};

function Music() {
  const [activePlaylist, setActivePlaylist] = useState('hm');
  const [activeArtist, setActiveArtist] = useState('drizzy');
  const [activeSongs, setActiveSongs] = useState('top10');
  const [isReady, setIsReady] = useState(false);
  const [copyVisible, setCopyVisible] = useState(false);
  const [artistVisible, setArtistVisible] = useState(false);
  const [showFirstCue, setShowFirstCue] = useState(true);
  const [framesInitial, setFramesInitial] = useState(false);
  const artistRef = useRef(null);
  const songsRef = useRef(null);
  const artistDelay = useRef(null);
  const artistVisibleRef = useRef(artistVisible);
  const songsVisibleRef = useRef(false);
  const [showSecondCue, setShowSecondCue] = useState(false);

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
    const timer = setTimeout(() => setCopyVisible(true), 450);
    return () => clearTimeout(timer);
  }, []);

  const evaluateSongsCue = () => {
    if (!songsRef.current) {
      return false;
    }
    const songsTop = songsRef.current.getBoundingClientRect().top + window.scrollY;
    return artistVisibleRef.current && window.scrollY + window.innerHeight < songsTop - 50;
  };

  const scrollToArtistButtons = () => {
    if (!artistRef.current) {
      return;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const nav = artistRef.current.querySelector('.music-page__playlist-nav');
    if (!nav) {
      return;
    }

    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const desiredGap = 9 * rootFontSize;
    const navTop = nav.getBoundingClientRect().top + window.scrollY;
    const scrollLimit = document.documentElement.scrollHeight - window.innerHeight;

    window.scrollTo({
      top: Math.min(Math.max(navTop - desiredGap, 0), scrollLimit),
      behavior: 'smooth',
    });
  };

  const scrollToSongsButtons = () => {
    if (!songsRef.current) {
      return;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const nav = songsRef.current?.querySelector('.music-page__playlist-nav');
    if (!nav) {
      return;
    }

    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const desiredGap = 9 * rootFontSize;
    const navTop = nav.getBoundingClientRect().top + window.scrollY;
    const scrollLimit = document.documentElement.scrollHeight - window.innerHeight;

    window.scrollTo({
      top: Math.min(Math.max(navTop - desiredGap, 0), scrollLimit),
      behavior: 'smooth',
    });
  };

  const handleCueClick = () => {
    scrollToArtistButtons();
    setShowSecondCue(true);
  };

  const handleSecondCueClick = () => {
    scrollToSongsButtons();
  };

  useEffect(() => {
    if (!artistRef.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        setShowFirstCue(!inView);
        if (inView && !artistVisibleRef.current) {
          if (artistDelay.current) {
            clearTimeout(artistDelay.current);
          }
            artistDelay.current = setTimeout(() => {
              setArtistVisible(true);
              artistVisibleRef.current = true;
              artistDelay.current = null;
              setShowSecondCue(evaluateSongsCue());
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

  useEffect(() => {
    if (!songsRef.current) {
      return undefined;
    }

    const handleScroll = () => {
      setShowSecondCue(evaluateSongsCue());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="music-page">
      <div className="music-page__primary">
        <section className={`music-page__copy${copyVisible ? ' music-page__copy--visible' : ''}`}>
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
            {Object.entries(playlists).map(([key, playlist]) => {
              const shouldShow = isReady && activePlaylist === key;
              return (
                <iframe
                  key={key}
                  allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                  frameBorder="0"
                  width="100%"
                  height="820"
                className={`music-page__iframe ${shouldShow ? 'music-page__iframe--active' : ''} ${framesInitial ? 'music-page__iframe--initial' : ''}`}
                  src={playlist.embed}
                  sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                  title={`${playlist.title} Playlist`}
                  loading="eager"
                />
              );
            })}
          </div>
        </section>
      </div>
      <div
        className={`music-page__fold-cue ${
          showFirstCue ? 'music-page__fold-cue--visible' : 'music-page__fold-cue--hidden'
        }`}
        onClick={handleCueClick}
      >
        <span>Scroll for more</span>
        <span aria-hidden="true">⌄</span>
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
            {artistPages.map((page) => {
              const shouldShow = isReady && activeArtist === page.key;
              return (
                <iframe
                  key={`${page.key}-dup`}
                  allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                  frameBorder="0"
                  width="100%"
                  height="820"
                  className={`music-page__iframe ${shouldShow ? 'music-page__iframe--active' : ''} ${framesInitial ? 'music-page__iframe--initial' : ''}`}
                  src={page.src}
                  sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                  title={`${page.title} Playlist`}
                  loading="eager"
                />
              );
            })}
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

      <div
        className={`music-page__fold-cue music-page__fold-cue--secondary ${
          showSecondCue ? 'music-page__fold-cue--visible' : 'music-page__fold-cue--hidden'
        }`}
        onClick={handleSecondCueClick}
      >
        <span>Scroll for more</span>
        <span aria-hidden="true">⌄</span>
      </div>

      <section
        className={`music-page__songs-section music-page__section-fade ${
          artistVisible ? 'music-page__section-fade--visible' : ''
        }`}
        ref={songsRef}
      >
        <div className={`music-page__copy music-page__songs-copy${copyVisible ? ' music-page__copy--visible' : ''}`}>
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
            {songsPages.map((page) => {
              const shouldShow = isReady && activeSongs === page.key;
              return (
                <iframe
                  key={`${page.key}-songs-frame`}
                  allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
                  frameBorder="0"
                  width="100%"
                  height="820"
                  className={`music-page__iframe ${shouldShow ? 'music-page__iframe--active' : ''} ${
                    framesInitial ? 'music-page__iframe--initial' : ''
                  }`}
                  src={page.src}
                  sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                  title={`${page.title} songs playlist`}
                  loading="eager"
                />
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

export default Music;

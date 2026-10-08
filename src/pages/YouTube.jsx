import React, { useEffect, useRef, useState } from 'react';
import { loadYouTubeChannel, youtubeChannelUrl } from '../lib/youtube';
import { usePhoneBack } from '../components/deviceSettings';
import './YouTube.css';

function count(value) {
  return value == null ? '' : new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value));
}

function YouTubeIcon({ name }) {
  const paths = {
    play: <><rect x="2" y="5" width="20" height="14" rx="5" fill="currentColor" stroke="none" /><path d="m10 9 6 3-6 3Z" fill="#fff" stroke="none" /></>,
    videos: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M7 3h10M5 5h14m-9 6 5 3-5 3Z" /></>,
    about: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v1" /></>,
    external: <><path d="M14 3h7v7m0-7L10 14" /><path d="M10 3H3v18h18v-7" /></>
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

function YouTube() {
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [nextPage, setNextPage] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [section, setSection] = useState('videos');
  const requestRef = useRef(null);
  const watchTitleRef = useRef(null);
  usePhoneBack(() => setSelected(null), Boolean(selected), 'Back to channel');

  useEffect(() => {
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError('');
    loadYouTubeChannel('', controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      setChannel(data.channel);
      setVideos(data.videos);
      setNextPage(data.nextPageToken);
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => requestRef.current?.abort();
  }, [retry]);

  async function loadMore() {
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError('');
    try {
      const data = await loadYouTubeChannel(nextPage, controller.signal);
      if (controller.signal.aborted) return;
      setVideos((current) => [...current, ...data.videos.filter((video) => !current.some((existing) => existing.id === video.id))]);
      setNextPage(data.nextPageToken);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    if (selected) watchTitleRef.current?.focus({ preventScroll: true });
  }, [selected]);

  function showSection(value) {
    setSection(value);
    setSelected(null);
  }

  if (loading && !channel) {
    return (
      <main className="youtube-page app-view" aria-label="YouTube channel" aria-busy="true">
        <div className="youtube-scroll app-scroll">
          <header className="youtube-banner"><span className="youtube-brand"><YouTubeIcon name="play" /><span>YouTube</span></span><span className="youtube-banner__label">AJT3 / TECH</span></header>
          <p className="youtube-meta" role="status">Loading channel from YouTube...</p>
          <div className="youtube-loading" aria-hidden="true">
            <div className="youtube-channel__identity">
              <span className="youtube-avatar youtube-loading__block" />
              <div className="youtube-loading__profile">
                <div className="youtube-loading__line youtube-loading__block" />
                <div className="youtube-loading__line youtube-loading__line--short youtube-loading__block" />
              </div>
            </div>
            <div className="youtube-grid">
              {[0, 1, 2].map((item) => <div key={item} className="youtube-video__image youtube-loading__block" />)}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (selected) {
    return (
      <main className="youtube-page app-view" aria-label={`Watch ${selected.title}`}>
        <nav className="app-toolbar" aria-label="Video navigation">
          <button className="app-control" onClick={() => setSelected(null)}>Back to channel</button>
        </nav>
        <div className="youtube-scroll app-scroll" key={selected.id}>
          <article className="youtube-watch youtube-watch--page">
            {selected.embeddable ? <iframe
              src={`https://www.youtube-nocookie.com/embed/${selected.id}`}
              title={selected.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            /> : <p>This video is available to watch on YouTube.</p>}
            <h1 ref={watchTitleRef} tabIndex={-1}>{selected.title}</h1>
            <p className="youtube-meta">{channel?.title}{selected.viewCount != null && ` / ${count(selected.viewCount)} views`} / <time dateTime={selected.publishedAt}>{new Date(selected.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time></p>
            <a className="youtube-watch__external" href={`https://www.youtube.com/watch?v=${selected.id}`} target="_blank" rel="noopener noreferrer">Watch on YouTube</a>
            <section className="youtube-watch__description" aria-labelledby="youtube-description-heading">
              <h2 id="youtube-description-heading">Description</h2>
              <p>{selected.description || 'No description provided.'}</p>
            </section>
          </article>
        </div>
      </main>
    );
  }

  return (
    <main className="youtube-page app-view" aria-label="AJT3 Tech YouTube channel">
      <div className="youtube-workspace">
      <nav className="youtube-sidebar" aria-label="Channel navigation">
        <button aria-pressed={section === 'videos'} onClick={() => showSection('videos')}><YouTubeIcon name="videos" /><span>Videos</span></button>
        <button aria-pressed={section === 'about'} onClick={() => showSection('about')}><YouTubeIcon name="about" /><span>About</span></button>
        <a href={youtubeChannelUrl} target="_blank" rel="noopener noreferrer"><YouTubeIcon name="external" /><span>Open YouTube</span></a>
        <div className="youtube-sidebar__channel"><span>YOUR CHANNEL</span><p>@ajt3-tech</p></div>
      </nav>
      <div className="youtube-scroll app-scroll" aria-busy={loading}>
        <header className="youtube-banner"><span className="youtube-brand"><YouTubeIcon name="play" /><span>YouTube</span></span><span className="youtube-banner__label">AJT3 / TECH</span></header>
        <section className="youtube-channel">
          <div className="youtube-channel__identity">
            {channel?.thumbnail ? <img src={channel.thumbnail} alt="" className="youtube-avatar" /> : <span className="youtube-avatar youtube-avatar--fallback" aria-hidden="true">AJ</span>}
            <div>
              <p className="youtube-channel__eyebrow">THE CHANNEL</p>
              <h1>{channel?.title || 'AJT3 Tech'}</h1>
              <div className="youtube-channel__stats">
                <span className="youtube-channel__handle">@ajt3-tech</span>
                {channel?.subscriberCount != null && <span><strong>{count(channel.subscriberCount)}</strong> subscribers</span>}
                {channel?.videoCount != null && <span><strong>{count(channel.videoCount)}</strong> videos</span>}
              </div>
              {channel?.description && <p className="youtube-channel__summary">{channel.description}</p>}
            </div>
          </div>
          <a className="youtube-channel__link" href={`${youtubeChannelUrl}?sub_confirmation=1`} target="_blank" rel="noopener noreferrer" aria-label="Subscribe to this channel on YouTube">Subscribe<YouTubeIcon name="external" /></a>
        </section>
        <nav className="youtube-channel-tabs" aria-label="Channel sections">
          <button aria-pressed={section === 'videos'} onClick={() => showSection('videos')}>Videos</button>
          <button aria-pressed={section === 'about'} onClick={() => showSection('about')}>About</button>
        </nav>

        {section === 'about' && <section className="youtube-about" aria-labelledby="youtube-about-heading">
          <h2 id="youtube-about-heading">About the channel</h2>
          <p className="youtube-description">{channel?.description || 'Visit AJT3 Tech on YouTube for channel details.'}</p>
          <a href={youtubeChannelUrl} target="_blank" rel="noopener noreferrer">youtube.com/@ajt3-tech</a>
          {channel?.videoCount != null && <p className="youtube-meta">{count(channel.videoCount)} public videos</p>}
        </section>}

        {section === 'videos' && <section className="youtube-feed" aria-labelledby="youtube-videos-heading">
          <div className="youtube-feed__heading">
            <h2 id="youtube-videos-heading">Latest uploads</h2>
            <span className="youtube-feed__chip">Newest first</span>
          </div>
          {error && <div className="youtube-notice" role="alert"><p>{error}</p><button className="app-control" disabled={loading} onClick={() => nextPage && videos.length ? loadMore() : setRetry((value) => value + 1)}>Try again</button></div>}
          {loading && <p className="youtube-meta" role="status">Loading videos from YouTube...</p>}
          {!loading && !error && !videos.length && <p className="youtube-meta">No public uploads yet.</p>}
          <div className="youtube-grid">
            {videos.map((video) => <button className="youtube-video" key={video.id} onClick={() => setSelected(video)} aria-label={`Watch ${video.title}`}>
              <div className="youtube-video__image"><img src={video.thumbnail} alt="" loading="lazy" /></div>
              <div className="youtube-video__details">
                {channel?.thumbnail && <img className="youtube-video__avatar" src={channel.thumbnail} alt="" loading="lazy" />}
                <div>
                  <h3>{video.title}</h3>
                  <span className="youtube-video__channel">{channel?.title || 'AJT3 Tech'}</span>
                  <p>{video.viewCount != null && `${count(video.viewCount)} views / `}<time dateTime={video.publishedAt}>{new Date(video.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time></p>
                </div>
              </div>
            </button>)}
          </div>
          {nextPage && <button className="app-control youtube-more" disabled={loading} onClick={loadMore}>Load older videos</button>}
        </section>}
      </div>
      </div>
    </main>
  );
}

export default YouTube;

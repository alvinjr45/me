import React, { useEffect, useRef, useState } from 'react';

const TAU = Math.PI * 2;
const ECCENTRICITY = 0.035;

function orbitalPoint(radius, meanAnomaly) {
  let angle = meanAnomaly;
  for (let step = 0; step < 5; step += 1) {
    angle -= (angle - ECCENTRICITY * Math.sin(angle) - meanAnomaly)
      / (1 - ECCENTRICITY * Math.cos(angle));
  }
  const x = radius * (Math.cos(angle) - ECCENTRICITY);
  const y = radius * Math.sqrt(1 - ECCENTRICITY ** 2) * Math.sin(angle);
  return { x: x * 0.97 - y * 0.22, y: x * 0.22 + y * 0.87, depth: Math.sin(angle) };
}

function createOrbits(count) {
  const laneCount = count <= 8 ? Math.ceil(count / 2) : Math.ceil(Math.sqrt(count / 1.2));
  let start = 0;
  return Array.from({ length: laneCount }, (_, lane) => {
    const remaining = count - start;
    const size = lane === laneCount - 1 ? remaining : Math.min(count <= 8 ? 2 : lane + 3, remaining);
    const orbit = { start, size, radius: 100 + lane * (220 / Math.max(1, laneCount - 1)) };
    start += size;
    return orbit;
  }).filter((orbit) => orbit.size > 0);
}

function initialAnomaly(index, orbit) {
  return ((index - orbit.start) / orbit.size * TAU + orbit.start * 0.7 + 0.5) % TAU;
}

const stars = Array.from({ length: 65 }, (_, index) => ({
  left: `${(index * 73.37 + 9) % 100}%`,
  top: `${(index * 41.71 + 3) % 100}%`,
  '--star-opacity': 0.15 + (index % 5) * 0.1,
  animationDelay: `${-index * 0.73}s`,
  animationDuration: `${5 + index % 7}s`,
  width: index % 7 === 0 ? 2 : 1
}));

function overlap(a, b) {
  return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
    * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
}

// Keep labels clear of every planet, then reserve space for each placed label.
function positionLabels(points, widths, viewport, previous, selectedIndex) {
  const clearance = Math.max(12, Math.min(18, Math.min(viewport.width, viewport.height) * 0.025 + 4));
  const occupied = points.map(({ x, y }) => ({ left: x - clearance, right: x + clearance,
    top: y - clearance, bottom: y + clearance }));
  occupied.push({ left: viewport.width / 2 - 25, right: viewport.width / 2 + 25,
    top: viewport.height / 2 - 25, bottom: viewport.height / 2 + 25 });
  const result = [];
  const order = points.map((_, index) => index).sort((a, b) => (a === selectedIndex ? -1 : b === selectedIndex ? 1 : a - b));
  order.forEach((index) => {
    const point = points[index];
    const width = widths[index];
    const candidates = previous[index] ? [previous[index]] : [];
    [24, 38, 54, 72].forEach((distance) => {
      [[0, 1], [0, -1], [1, 0], [-1, 0], [0.8, 0.8], [-0.8, 0.8], [0.8, -0.8], [-0.8, -0.8]].forEach(([x, y]) => {
        candidates.push({ x: x * (distance + width / 2), y: y * distance });
      });
    });
    let best;
    let bestScore = Infinity;
    for (const candidate of candidates) {
      const x = Math.max(width / 2 + 6, Math.min(viewport.width - width / 2 - 6, point.x + candidate.x));
      const y = Math.max(12, Math.min(viewport.height - 12, point.y + candidate.y));
      const rect = { left: x - width / 2 - 3, right: x + width / 2 + 3, top: y - 10, bottom: y + 10 };
      const score = occupied.reduce((sum, item) => sum + overlap(rect, item), 0);
      if (score < bestScore) {
        best = { x: x - point.x, y: y - point.y, rect };
        bestScore = score;
      }
      if (score === 0) break;
    }
    if (bestScore > 0) {
      let closest = Infinity;
      for (let y = 12; y <= viewport.height - 12; y += 4) {
        for (let x = width / 2 + 6; x <= viewport.width - width / 2 - 6; x += 8) {
          const rect = { left: x - width / 2 - 3, right: x + width / 2 + 3, top: y - 10, bottom: y + 10 };
          const distance = Math.hypot(x - point.x, y - point.y);
          if (distance < closest && occupied.every((item) => overlap(rect, item) === 0)) {
            best = { x: x - point.x, y: y - point.y, rect };
            closest = distance;
          }
        }
      }
    }
    result[index] = best;
    occupied.push(best.rect);
  });
  return result;
}

function MusicSolarSystem({ playlists, selectedKey, onSelect }) {
  const orbits = createOrbits(playlists.length);
  const stageRef = useRef(null);
  const planetRefs = useRef([]);
  const pausedRef = useRef(false);
  const syncAnimationRef = useRef(() => {});
  const selectedRef = useRef(selectedKey);
  selectedRef.current = selectedKey;
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animationOrbits = createOrbits(playlists.length);
    const orbitFor = (index) => animationOrbits.find((orbit) => index < orbit.start + orbit.size);
    const anomalies = playlists.map((_, index) => initialAnomaly(index, orbitFor(index)));
    let frameId;
    let previousTime = null;
    let visible = true;
    let disposed = false;
    let viewport = { width: stage.clientWidth, height: stage.clientHeight };
    let labelPositions = [];
    const labelWidths = playlists.map((playlist) => Math.min(96, Math.max(42, playlist.title.length * 5.6 + 10)));

    const paint = (delta) => {
      if (!viewport.width || !viewport.height) return;
      const scale = Math.min(viewport.width, viewport.height) / 800;
      const previewSize = Math.min(144, Math.max(104, Math.min(viewport.width, viewport.height) * 0.3));
      stage.style.setProperty('--preview-size', `${previewSize}px`);
      const points = [];
      playlists.forEach((_, index) => {
        const button = planetRefs.current[index];
        if (!button) return;
        const { radius } = orbitFor(index);
        // Kepler's third law: outer playlists take longer to circle the star.
        const period = 85 * (radius / 100) ** 1.5;
        anomalies[index] = (anomalies[index] + delta * TAU / period) % TAU;
        const point = orbitalPoint(radius, anomalies[index]);
        const x = viewport.width / 2 + point.x * scale;
        const y = viewport.height / 2 + point.y * scale;
        points.push({ x, y });
        button.style.left = `${x}px`;
        button.style.top = `${y}px`;
        button.style.setProperty('--preview-x', `${Math.max(previewSize / 2 + 8,
          Math.min(viewport.width - previewSize / 2 - 8, x)) - x}px`);
        button.style.setProperty('--preview-y', `${Math.max(previewSize / 2 + 8,
          Math.min(viewport.height - previewSize / 2 - 32, y)) - y}px`);
        button.style.setProperty('--planet-depth', 1 + point.depth * 0.025);
        button.style.setProperty('--light-x', `${50 - point.x / radius * 36}%`);
        button.style.setProperty('--light-y', `${50 - point.y / radius * 36}%`);
        button.style.zIndex = point.depth > 0 ? 4 : 2;
      });
      labelPositions = positionLabels(points, labelWidths, viewport, labelPositions,
        playlists.findIndex((playlist) => playlist.key === selectedRef.current));
      labelPositions.forEach((label, index) => {
        const button = planetRefs.current[index];
        button.style.setProperty('--label-x', `${label.x}px`);
        button.style.setProperty('--label-y', `${label.y}px`);
        button.style.setProperty('--label-width', `${labelWidths[index]}px`);
        button.style.setProperty('--label-distance', `${Math.hypot(label.x, label.y)}px`);
        button.style.setProperty('--label-angle', `${Math.atan2(label.y, label.x)}rad`);
      });
    };

    const tick = (time) => {
      frameId = null;
      if (disposed || !visible || document.hidden || media.matches || pausedRef.current) return;
      const delta = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      // Hold the entire system still while a moving target is being inspected.
      const inspecting = stage.matches(':hover') && stage.querySelector('button:hover');
      const focused = stage.querySelector('button:focus-visible');
      if (!inspecting && !focused) paint(delta);
      frameId = window.requestAnimationFrame(tick);
    };

    const syncAnimation = () => {
      window.cancelAnimationFrame(frameId);
      frameId = null;
      previousTime = null;
      setReducedMotion(media.matches);
      stage.dataset.motion = !visible || document.hidden || media.matches || pausedRef.current ? 'paused' : 'running';
      if (!disposed && visible && !document.hidden && !media.matches && !pausedRef.current) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    }, { threshold: 0.05 });
    observer.observe(stage);
    const resizeObserver = new ResizeObserver(([entry]) => {
      viewport = { width: entry.contentRect.width, height: entry.contentRect.height };
      stage.style.setProperty('--system-size', `${Math.min(viewport.width, viewport.height)}px`);
      labelPositions = [];
      paint(0);
    });
    resizeObserver.observe(stage);
    media.addEventListener('change', syncAnimation);
    document.addEventListener('visibilitychange', syncAnimation);
    syncAnimationRef.current = syncAnimation;
    paint(0);
    syncAnimation();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      resizeObserver.disconnect();
      media.removeEventListener('change', syncAnimation);
      document.removeEventListener('visibilitychange', syncAnimation);
      syncAnimationRef.current = () => {};
    };
  }, [playlists]);

  const toggleMotion = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    syncAnimationRef.current();
  };

  return (
    <section className="music-system" aria-label="Orbiting playlist library">
      <header className="music-system__header">
        <span>{playlists.length} playlists</span>
        <button type="button" className="music-system__motion" onClick={toggleMotion}
          aria-pressed={paused || reducedMotion} disabled={reducedMotion}>
          {reducedMotion ? 'Reduced motion' : paused ? 'Resume orbits' : 'Pause orbits'}
        </button>
      </header>

      <div className={`music-system__stage${paused || reducedMotion ? ' music-system__stage--still' : ''}`} ref={stageRef}>
        <div className="music-system__stars" aria-hidden="true">
          {stars.map((star, index) => <i key={index} style={star} />)}
        </div>
        <svg className="music-system__orbits" viewBox="0 0 800 800" aria-hidden="true">
          <circle className="music-system__dust" cx="400" cy="400" r="350" />
          {orbits.map(({ radius, start, size }) => {
            const path = Array.from({ length: 121 }, (_, index) => {
              const point = orbitalPoint(radius, index / 120 * TAU);
              return `${index === 0 ? 'M' : 'L'}${400 + point.x},${400 + point.y}`;
            }).join(' ');
            const active = playlists.slice(start, start + size).some((item) => item.key === selectedKey);
            return <path key={start} d={`${path} Z`} className={active ? 'music-system__orbit--active' : undefined} />;
          })}
        </svg>
        <div className="music-system__sun" aria-hidden="true" />

        {playlists.map((playlist, index) => {
          const orbit = orbits.find((item) => index < item.start + item.size);
          const point = orbitalPoint(orbit.radius, initialAnomaly(index, orbit));
          return (
            <button key={playlist.key} type="button" className="music-planet"
              ref={(element) => { planetRefs.current[index] = element; }}
              aria-label={`Open ${playlist.title} playlist`} aria-pressed={selectedKey === playlist.key}
              aria-controls="music-playlist-player" onClick={() => onSelect(playlist.key)}
              title={playlist.title}
              style={{ '--planet-color': playlist.color, '--planet-size': `${Math.round(playlist.size * 0.4)}px`,
                '--surface-period': `${24 + index * 2}s`, '--surface-delay': `${-index * 3}s`,
                left: `${50 + point.x / 8}%`, top: `${50 + point.y / 8}%` }}>
              <span className="music-planet__leader" aria-hidden="true" />
              <span className="music-planet__sphere">
                <span className="music-planet__surface" />
                <span className="music-planet__cover">
                  <span>{playlist.title}</span>
                  <img src={playlist.artwork} alt="" decoding="async"
                    onError={(event) => { event.currentTarget.hidden = true; }} />
                </span>
              </span>
              <span className="music-planet__label">{playlist.title}</span>
            </button>
          );
        })}
      </div>

    </section>
  );
}

export default MusicSolarSystem;

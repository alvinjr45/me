import { useEffect, useRef } from 'react';

function parseColor(value) {
  const rgbMatch = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i.exec(value);

  if (rgbMatch) {
    return {
      r: Number.parseInt(rgbMatch[1], 10),
      g: Number.parseInt(rgbMatch[2], 10),
      b: Number.parseInt(rgbMatch[3], 10)
    };
  }

  const shorthandHex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const normalized = value.replace(shorthandHex, (_, r, g, b) => `${r}${r}${g}${g}${b}${b}`);
  const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);

  if (!hexMatch) {
    return null;
  }

  return {
    r: Number.parseInt(hexMatch[1], 16),
    g: Number.parseInt(hexMatch[2], 16),
    b: Number.parseInt(hexMatch[3], 16)
  };
}

function interpolateColor(start, end, factor) {
  const result = {
    r: Math.round(start.r + (end.r - start.r) * factor),
    g: Math.round(start.g + (end.g - start.g) * factor),
    b: Math.round(start.b + (end.b - start.b) * factor)
  };

  return `rgb(${result.r}, ${result.g}, ${result.b})`;
}

function LetterGlitch({
  glitchColors = ['#2b4539', '#61dca3', '#61b3dc'],
  className = '',
  glitchSpeed = 50,
  centerVignette = false,
  outerVignette = true,
  smooth = true,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789'
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lettersRef = useRef([]);
  const gridRef = useRef({ columns: 0, rows: 0 });
  const contextRef = useRef(null);
  const lastGlitchTimeRef = useRef(Date.now());

  const lettersAndSymbols = Array.from(characters);
  const fontSize = 16;
  const charWidth = 10;
  const charHeight = 20;

  const getRandomChar = () => lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];
  const getRandomColor = () => glitchColors[Math.floor(Math.random() * glitchColors.length)];

  const calculateGrid = (width, height) => ({
    columns: Math.ceil(width / charWidth),
    rows: Math.ceil(height / charHeight)
  });

  const drawLetters = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;

    if (!canvas || !ctx || lettersRef.current.length === 0) {
      return;
    }

    const { width, height } = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';

    lettersRef.current.forEach((letter, index) => {
      const x = (index % gridRef.current.columns) * charWidth;
      const y = Math.floor(index / gridRef.current.columns) * charHeight;

      ctx.fillStyle = letter.color;
      ctx.fillText(letter.char, x, y);
    });
  };

  const initializeLetters = (columns, rows) => {
    gridRef.current = { columns, rows };

    lettersRef.current = Array.from({ length: columns * rows }, () => ({
      char: getRandomChar(),
      color: getRandomColor(),
      targetColor: getRandomColor(),
      colorProgress: 1
    }));
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;

    if (!canvas || !canvas.parentElement) {
      return;
    }

    const parent = canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    if (contextRef.current) {
      contextRef.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const { columns, rows } = calculateGrid(rect.width, rect.height);
    initializeLetters(columns, rows);
    drawLetters();
  };

  const updateLetters = () => {
    if (lettersRef.current.length === 0) {
      return;
    }

    const updateCount = Math.max(1, Math.floor(lettersRef.current.length * 0.05));

    for (let index = 0; index < updateCount; index += 1) {
      const letterIndex = Math.floor(Math.random() * lettersRef.current.length);
      const letter = lettersRef.current[letterIndex];

      if (!letter) {
        continue;
      }

      letter.char = getRandomChar();
      letter.targetColor = getRandomColor();

      if (!smooth) {
        letter.color = letter.targetColor;
        letter.colorProgress = 1;
      } else {
        letter.colorProgress = 0;
      }
    }
  };

  const handleSmoothTransitions = () => {
    let needsRedraw = false;

    lettersRef.current.forEach((letter) => {
      if (letter.colorProgress >= 1) {
        return;
      }

      letter.colorProgress += 0.05;

      if (letter.colorProgress > 1) {
        letter.colorProgress = 1;
      }

      const startColor = parseColor(letter.color);
      const endColor = parseColor(letter.targetColor);

      if (!startColor || !endColor) {
        letter.color = letter.targetColor;
        letter.colorProgress = 1;
        needsRedraw = true;
        return;
      }

      letter.color = interpolateColor(startColor, endColor, letter.colorProgress);
      needsRedraw = true;
    });

    if (needsRedraw) {
      drawLetters();
    }
  };

  const animate = () => {
    const now = Date.now();

    if (now - lastGlitchTimeRef.current >= glitchSpeed) {
      updateLetters();
      drawLetters();
      lastGlitchTimeRef.current = now;
    }

    if (smooth) {
      handleSmoothTransitions();
    }

    animationRef.current = window.requestAnimationFrame(animate);
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    contextRef.current = canvas.getContext('2d');
    resizeCanvas();
    animate();

    let resizeTimeout;

    const handleResize = () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        window.cancelAnimationFrame(animationRef.current);
        resizeCanvas();
        lastGlitchTimeRef.current = Date.now();
        animate();
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(animationRef.current);
      window.clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characters, glitchColors, glitchSpeed, smooth]);

  const containerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    overflow: 'hidden'
  };

  const canvasStyle = {
    display: 'block',
    width: '100%',
    height: '100%'
  };

  const outerVignetteStyle = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(0, 0, 0, 0) 58%, rgba(0, 0, 0, 0.92) 100%)'
  };

  const centerVignetteStyle = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0) 62%)'
  };

  return (
    <div style={containerStyle} className={className}>
      <canvas ref={canvasRef} style={canvasStyle} />
      {outerVignette ? <div style={outerVignetteStyle}></div> : null}
      {centerVignette ? <div style={centerVignetteStyle}></div> : null}
    </div>
  );
}

export default LetterGlitch;

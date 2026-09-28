import React, { useEffect, useRef, useState } from 'react';
import { getPhotoImageUrl } from '../lib/photoImages';

export default function PhotoImage({ src, size = 320, initiallyVisible = false, loading = 'lazy', decoding = 'async', ...props }) {
  const imageRef = useRef(null);
  const [visible, setVisible] = useState(() => initiallyVisible || typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !imageRef.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    });
    observer.observe(imageRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <img
      {...props}
      ref={imageRef}
      src={visible && src ? getPhotoImageUrl(src, size) : undefined}
      loading={loading}
      decoding={decoding}
    />
  );
}

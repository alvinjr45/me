import React, { useRef, useState } from 'react';
import './VideoPlayer.css'

const VideoPlayer = ({ videoSrc, description }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    const videoElement = videoRef.current;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleFullScreen = () => {
    const containerElement = containerRef.current;
    if (containerElement) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerElement.requestFullscreen();
      }
    }
  };

  return (
    <div ref={containerRef} className='container' >
      <video
        ref={videoRef}
        className='video'
        controls={false}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className='controls'>
        <button className="button" onClick={handlePlayPause}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button className='button' onClick={handleFullScreen}>
          Full Screen
        </button>
      </div>
      {description && <p className='description'>{description}</p>}
    </div>
  );
};


export default VideoPlayer;

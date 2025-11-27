// src/pages/Dogs.js
import React from 'react';
import VideoSection from '../components/VideoSection';

function Dogs() {
  return <VideoSection
    src={"video-dog.mov"}
    type={'type/mov'}
    header={"Drake and Josh"}
    message={"Meet the pups!"}

  />;
}

export default Dogs;
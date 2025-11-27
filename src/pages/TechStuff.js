// src/pages/Contact.js
import React from 'react';
import VideoSection from '../components/VideoSection';
import Cards from '../components/Cards';

function TechStuff() {
  return <>
    <VideoSection
      src={"video-tech.mov"}
      type={'type/mov'}
      header={"DJI Mini SE 2"}
      message={"Check It Out!"}

    />

    <Cards />
  </>
}

export default TechStuff;

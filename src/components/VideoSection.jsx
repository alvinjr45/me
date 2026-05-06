import React, { useEffect, useRef, useState } from 'react';
import '../App.css';
import './VideoSection.css';

function VideoSection({ src, header, message, type }) {
    const sectionRef = useRef(null);
    const [showScrollCue, setShowScrollCue] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            const section = sectionRef.current;

            if (!section) {
                return;
            }

            const sectionTop = section.getBoundingClientRect().top + window.scrollY;
            const scrollDistance = Math.max(window.scrollY - sectionTop, 0);

            setShowScrollCue(scrollDistance < 80);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleScrollCueClick = () => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return;
        }

        const nextSection = sectionRef.current?.nextElementSibling;
        const scrollTarget = nextSection
            ? nextSection.getBoundingClientRect().top + window.scrollY
            : window.innerHeight;

        window.scrollTo({
            top: scrollTarget,
            behavior: 'smooth',
        });
    };

    return (
        <div className='video-container' ref={sectionRef}>
            <video src={`/videos/${src}`} type={type} autoPlay loop muted />
            <h1>{`${header}`}</h1>
            <p>{`${message}`}</p>
            <div
                className={`music-page__fold-cue ${
                    showScrollCue ? 'music-page__fold-cue--visible' : 'music-page__fold-cue--hidden'
                } video-scroll-cue`}
                onClick={handleScrollCueClick}
            >
                <span>Scroll for more</span>
                <span aria-hidden='true'>⌄</span>
            </div>
        </div>
    );
}

export default VideoSection;

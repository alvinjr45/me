import React from 'react';
import '../App.css';
import { Button } from './Button';
import './VideoSection.css';

function VideoSection({ src, header, message, type }) {


    return (
        <div className='video-container'>
            <video src={`/videos/${src}`} type={type} autoPlay loop muted />
            <h1>{`${header}`}</h1>
            <p>{`${message}`}</p>
            <div className='video-btns'>
                <Button
                    className='btns'
                    buttonStyle='btn--outline'
                    buttonSize='btn--large'
                >
                    { }See More
                </Button>
                <Button
                    className='btns'
                    buttonStyle='btn--primary'
                    buttonSize='btn--large'
                    onClick={console.log('hey')}
                >
                    WATCH Video <i className='far fa-play-circle' />
                </Button>
            </div>
        </div>
    );
}

export default VideoSection;
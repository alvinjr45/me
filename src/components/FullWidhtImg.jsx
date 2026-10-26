import React from 'react'
import './FullWidhtImg.css'



function FullWidhtImg() {
    const heroImage = `${process.env.PUBLIC_URL}/images/brand/ajt3-logo.png`;

    return (
        <div
            className="img-container"
            id="Home"
            style={{ backgroundImage: `url(${heroImage})` }}
        />
    );
}

export default FullWidhtImg;

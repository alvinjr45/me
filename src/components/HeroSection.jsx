import React from 'react'
import Button from '.Button'

function HeroSection() {
  return (
    <div className="hero-container">
        <video src="/video/somevid.mp4" autoPlay loop muted />
        <h1>ADVENTURE AWAITS</h1>
        <p>What are you waiting for</p>
        <div className="her-btns">
            <Button
                className='btns'
                buttonStyle='btn--outline'
                buttonSize='btn--large'
            >
                Get Started            
            </Button>

        </div>

    </div>
  )
}

export default HeroSection
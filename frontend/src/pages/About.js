import React from 'react'
import aboutus from '../assets/aboutus.png';
import './About.css'
function About() {
  return (
    <div>
      <div className='about-container'>
        <img src={aboutus} alt='About Us' className='about-image' />
    </div>
    <div className='about-content'>

        <h2>Who are we ?</h2>
        <p>VN DAIRY is a forward-thinking dairy brand committed to delivering fresh, pure, and high-quality dairy products straight from farm to home. Rooted in tradition and driven by innovation, we aim to provide hygienic and nutritious milk and dairy items that promote health and well-being. We work closely with local farmers and maintain the highest standards to ensure every drop meets our promise of quality.</p>
        </div>
        <div className='vision'>
        <h2>Our Vision</h2>   
        <p>To become a trusted leader in the dairy industry by delivering pure, nutritious, and sustainable dairy products that enrich lives, empower farmers, and set new standards of quality and integrity in every home we serve.</p>     
        </div>
        <div className='mission'>
        <h2>Our Mission</h2>
        <p>At VN DAIRY, our mission is to provide fresh, hygienic, and high-quality dairy products through ethical sourcing, advanced processing, and customer-centric service. We aim to support rural livelihoods, promote health and wellness, and foster long-term trust with every drop we deliver.</p>
    </div>
    </div>
  )
}

export default About

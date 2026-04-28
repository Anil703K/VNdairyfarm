import React from 'react'
 import body_1 from '../assets/body_1.png';
import './Mainbody.css'
import AiChatBot from './AiChatBot';
function Mainbody() {
  return (
    <>
      <div className='mainbody-container'>
  <img src={body_1} alt='VN DAIRY' className='mainbody' />
  <div className='overlay-text'>
    <h2>Welcome to VN DAIRY</h2>
    <p>Fresh Milk Delivered to Your Doorstep</p>
    <p>100% Natural</p>
    <p>Affordable Pricing</p>
  </div>
</div>

         <h1>All Farm Fresh Products At One Place...</h1>
         <AiChatBot />
        
    </>
  )
}

export default Mainbody

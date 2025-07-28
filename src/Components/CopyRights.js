import React from 'react'
import './copyright.css';
function CopyRights() {
    const currentYear = new Date().getFullYear();
  return (
    <div>
      <div className='copyright'>
         &copy; {currentYear} VN Dairy. All rights reserved.
      </div>
    </div>
  )
}
export default CopyRights;

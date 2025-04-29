// Loader.jsx  
import React from 'react';  

const Loader = ({ size = 'medium' }) => {  
  const loaderClass = `loader loader-${size}`;  
  
  return (  
    <div className={loaderClass}>  
      <div className="spinner"></div>  
    </div>  
  );  
};  

export default Loader;  
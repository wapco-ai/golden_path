// Button.jsx  
import React from 'react';  

const Button = ({ children, type = 'button', className = '', onClick, disabled = false }) => {  
  const buttonClassName = `btn ${className}`;  
  
  return (  
    <button   
      type={type}   
      className={buttonClassName}  
      onClick={onClick}  
      disabled={disabled}  
    >  
      {children}  
    </button>  
  );  
};  

export default Button;  
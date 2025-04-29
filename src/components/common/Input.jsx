
// Input.jsx  
import React from 'react';  

const Input = ({   
  type = 'text',   
  name,   
  value,   
  onChange,   
  placeholder = '',   
  label,   
  error,   
  className = ''   
}) => {  
  return (  
    <div className={`form-group ${className}`}>  
      {label && <label htmlFor={name}>{label}</label>}  
      <input  
        type={type}  
        id={name}  
        name={name}  
        value={value}  
        onChange={onChange}  
        placeholder={placeholder}  
        className={error ? 'error' : ''}  
      />  
      {error && <small className="error-text">{error}</small>}  
    </div>  
  );  
};  

export default I
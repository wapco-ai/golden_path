import React from 'react';  

export const Footer = () => {  
  return (  
    <footer className="app-footer">  
      <div className="footer-content">  
        <p>© {new Date().getFullYear()} GPS Validity - تمامی حقوق محفوظ است</p>  
        <div className="footer-links">  
          <a href="#" target="_blank" rel="noopener noreferrer">درباره ما</a>  
          <a href="#" target="_blank" rel="noopener noreferrer">تماس با ما</a>  
          <a href="#" target="_blank" rel="noopener noreferrer">حریم خصوصی</a>  
        </div>  
      </div>  
    </footer>  
  );  
};  

// سطر زیر اضافه نشود - به جای آن از { Footer } در import استفاده شود  
// export default Footer;  
import React from 'react';
import { FormattedMessage } from 'react-intl';

export const Footer = () => {  
  return (  
    <footer className="app-footer">  
      <div className="footer-content">  
        <p>
          <FormattedMessage id="copyright" values={{ year: new Date().getFullYear() }} />
        </p>
        <div className="footer-links">
          <a href="#" target="_blank" rel="noopener noreferrer">
            <FormattedMessage id="aboutUs" />
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer">
            <FormattedMessage id="contactUs" />
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer">
            <FormattedMessage id="privacy" />
          </a>
        </div>
      </div>  
    </footer>  
  );  
};  

// سطر زیر اضافه نشود - به جای آن از { Footer } در import استفاده شود  
// export default Footer;  
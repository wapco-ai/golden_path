import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

export const Header = () => {  
  return (  
    <header className="app-header">   
      <nav className="main-nav">  
        <ul>  
          <li><Link to="/"><FormattedMessage id="home" /></Link></li>
          <li><Link to="/map"><FormattedMessage id="map" /></Link></li>
          <li><Link to="/qr-scan"><FormattedMessage id="qrScan" /></Link></li>
          <li><Link to="/settings"><FormattedMessage id="settings" /></Link></li>
          <li><Link to="/Profile"><FormattedMessage id="profile" /></Link></li>

        </ul>  
      </nav>  
    </header>  
  );  
};  

// سطر زیر اضافه نشود - به جای آن از { Header } در import استفاده شود  
// export default Header;  
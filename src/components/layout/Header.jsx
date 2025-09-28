import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

export const Header = () => {  
  return (  
    <header className="app-header">   
      <nav className="main-nav">  
        <ul>  
          <li><Link to="/">خانه</Link></li>  
          <li><Link to="/map">نقشه</Link></li>  
          <li><Link to="/qr-scan">اسکن QR</Link></li>  
          <li><Link to="/settings">تنظیمات</Link></li> 
          <li><Link to="/Profile">پروفایل</Link></li> 

        </ul>  
      </nav>  
    </header>  
  );  
};  
 

// سطر زیر اضافه نشود - به جای آن از { Header } در import استفاده شود  
// export default Header;  
import React from 'react';  
import { Link } from 'react-router-dom';  

export const Header = () => {  
  return (  
    <header className="app-header">  
      <div className="logo">  
        <Link to="/">GPS Validity</Link>  
      </div>  
      <nav className="main-nav">  
        <ul>  
          <li><Link to="/">خانه</Link></li>  
          <li><Link to="/map">نقشه</Link></li>  
          <li><Link to="/qr-scan">اسکن QR</Link></li>  
          <li><Link to="/settings">تنظیمات</Link></li>  
        </ul>  
      </nav>  
    </header>  
  );  
};  

// سطر زیر اضافه نشود - به جای آن از { Header } در import استفاده شود  
// export default Header;  
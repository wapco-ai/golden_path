import React from 'react';  
import { Link } from 'react-router-dom';  

export const NotFoundPage = () => {  
  return (  
    <div className="not-found-page">  
      <h1>404</h1>  
      <h2>صفحه مورد نظر یافت نشد</h2>  
      <p>متاسفانه صفحه‌ای که به دنبال آن هستید وجود ندارد.</p>  
      <Link to="/" className="btn btn-primary">  
        بازگشت به صفحه اصلی  
      </Link>  
    </div>  
  );  
};  

// سطر زیر اضافه نشود - به جای آن از { NotFoundPage } در import استفاده شود  
// export default NotFoundPage;  
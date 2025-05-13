import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Routing.css';

const Routing = () => {
  const navigate = useNavigate();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [activeTab, setActiveTab] = useState('mostVisited');

  // Initial 9 categories with SVG icons
  const initialCategories = [
    { 
      name: 'باب‌های حرم', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-door"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 12v.01" /><path d="M3 21h18" /><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16" /></svg>
    },
    { 
      name: 'صحن‌ها', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-door"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 12v.01" /><path d="M3 21h18" /><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16" /></svg>
    },
    { 
      name: 'رواق‌ها', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-door"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 12v.01" /><path d="M3 21h18" /><path d="M6 21v-16a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v16" /></svg>
    },
    { 
      name: 'کفشداری‌ها', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-flip-flops"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 4c2.21 0 4 1.682 4 3.758c0 .078 0 .156 -.008 .234l-.6 9.014c-.11 1.683 -1.596 3 -3.392 3s-3.28 -1.311 -3.392 -3l-.6 -9.014c-.138 -2.071 1.538 -3.855 3.743 -3.985a4.15 4.15 0 0 1 .25 -.007z" /><path d="M14.5 14c1 -3.333 2.167 -5 3.5 -5c1.333 0 2.5 1.667 3.5 5" /><path d="M18 16v1" /><path d="M6 4c2.21 0 4 1.682 4 3.758c0 .078 0 .156 -.008 .234l-.6 9.014c-.11 1.683 -1.596 3 -3.392 3s-3.28 -1.311 -3.392 -3l-.6 -9.014c-.138 -2.071 1.538 -3.855 3.742 -3.985c.084 0 .167 -.007 .25 -.007z" /><path d="M2.5 14c1 -3.333 2.167 -5 3.5 -5c1.333 0 2.5 1.667 3.5 5" /><path d="M6 16v1" /></svg>
    },
    { 
      name: 'محل اسکن‌کد', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-object-scan"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /><path d="M8 8m0 2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v4a2 2 0 0 1 -2 2h-4a2 2 0 0 1 -2 -2z" /></svg>
    },
    { 
      name: 'چاپخانه‌ها', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-mug"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4.083 5h10.834a1.08 1.08 0 0 1 1.083 1.077v8.615c0 2.38 -1.94 4.308 -4.333 4.308h-4.334c-2.393 0 -4.333 -1.929 -4.333 -4.308v-8.615a1.08 1.08 0 0 1 1.083 -1.077" /><path d="M16 8h2.5c1.38 0 2.5 1.045 2.5 2.333v2.334c0 1.288 -1.12 2.333 -2.5 2.333h-2.5" /></svg>
    },
    { 
      name: 'دفاتر نذورات', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-notebook"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-11a1 1 0 0 1 -1 -1v-14a1 1 0 0 1 1 -1m3 0v18" /><path d="M13 8l2 0" /><path d="M13 12l2 0" /></svg>
    },
    { 
      name: 'دریافت ویلچر', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-wheelchair"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 16m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" /><path d="M19 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M19 17a3 3 0 0 0 -3 -3h-3.4" /><path d="M3 3h1a2 2 0 0 1 2 2v6" /><path d="M6 8h11" /><path d="M15 8v6" /></svg>
    },
    { 
      name: 'سرویس بهداشتی', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-friends"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M5 22v-5l-1 -1v-4a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4l-1 1v5" /><path d="M17 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M15 22v-4h-2l2 -6a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1l2 6h-2v4" /></svg>
    }
  ];

  // Additional categories
  const additionalCategories = [
    { 
      name: 'پارکینگ‌ها', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-parking-circle"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 16v-8h3.334c.92 0 1.666 .895 1.666 2s-.746 2 -1.666 2h-3.334" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /></svg>
    },
    { 
      name: 'هتل‌ها', 
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-building-skyscraper"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21l18 0" /><path d="M5 21v-14l8 -4v18" /><path d="M19 21v-10l-6 -4" /><path d="M9 9l0 .01" /><path d="M9 12l0 .01" /><path d="M9 15l0 .01" /><path d="M9 18l0 .01" /></svg>
    },
    { 
      name: 'رستوران‌ها', 
      icon: <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-tools-kitchen-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 3v12h-5c-.023 -3.681 .184 -7.406 5 -12zm0 12v6h-1v-3m-10 -14v17m-3 -17v3a3 3 0 1 0 6 0v-3" /></svg>
    }
  ];

  // Places data
  const mostVisitedPlaces = [
    {
      title: 'روضه منوره',
      distance: '780 متر',
      time: '16 دقیقه پیاده روی',
      rating: '79/5',
      description: 'ضریح امام رضا(ع) سازه شکستگی از چوب یا فلز با ترکیبی از هر دو که بر دو، قب امام رضا(ع) قرار گرفته است... بیشتر بخوانید.'
    },
    {
      title: 'روابط معاونة',
      distance: '7/50 متر',
      time: '1 دقیقه پیاده روی',
      rating: '2/30 (د)',
      description: 'خبری مظهر امام رضا 4'
    },
    {
      title: 'ساختارات صحت انتقال حجم مطهر',
      distance: '3/40 متر',
      time: '1 دقیقه پیاده روی',
      rating: '1/5 (متر)',
      description: 'صحت انتقال استاندارد'
    }
  ];

  const closestPlaces = [
    {
      title: 'ساختات صحن انتظار حرم خطر',
      distance: '440 متر',
      time: '5 دقیقه پیاده روی',
      description: 'معروف آدرس ساختات در حرم امام رضا'
    },
    {
      title: 'مسیر امام خمینی',
      distance: '210 متر',
      time: '3 دقیقه پیاده روی',
      description: 'روش اصلی، سطوح چهارم'
    },
    {
      title: 'صحن قدس',
      distance: '350 متر',
      time: '4 دقیقه پیاده روی',
      description: 'صحن زیبا و قدیمی حرم مطهر'
    }
  ];

  const handlePlaceClick = (placeTitle) => {
    console.log('Place clicked:', placeTitle);
  };

  return (
    <div className="routing-page">
      {/* Categories Section */}
      <div className="routing-categories-section">
        <h2 className="routing-section-title">پیشنهاد‌های جستجو</h2>
        <div className={`routing-categories-grid ${showAllCategories ? 'expanded' : ''}`}>
          {initialCategories.map((category, index) => (
            <div 
              key={index} 
              className="routing-category-item"
              onClick={() => handlePlaceClick(category.name)}
            >
              <div className="category-icon">{category.icon}</div>
              <span>{category.name}</span>
            </div>
          ))}
          {showAllCategories && additionalCategories.map((category, index) => (
            <div 
              key={index + initialCategories.length} 
              className="routing-category-item"
              onClick={() => handlePlaceClick(category.name)}
            >
              <div className="category-icon">{category.icon}</div>
              <span>{category.name}</span>
            </div>
          ))}
        </div>
        <button 
          className="routing-show-more-btn"
          onClick={() => setShowAllCategories(!showAllCategories)}
        >
          {showAllCategories ? 'نمایش کمتر' : 'مشاهده بیشتر'}
          <svg 
            className={`show-more-icon ${showAllCategories ? 'expanded' : ''}`} 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M15 6l-6 6l6 6" />
          </svg>
        </button>
      </div>

      {/* Places Section with Tabs */}
      <div className="routing-places-section">
        <div className="routing-tabs">
          <button 
            className={`routing-tab ${activeTab === 'mostVisited' ? 'active' : ''}`}
            onClick={() => setActiveTab('mostVisited')}
          >
            پربازدیدترین‌های حرم مطهر
          </button>
          <button 
            className={`routing-tab ${activeTab === 'closest' ? 'active' : ''}`}
            onClick={() => setActiveTab('closest')}
          >
            مکان‌های نزدیک من
          </button>
        </div>

        <div className="routing-places-content">
          {activeTab === 'mostVisited' && (
            <div className="routing-places-grid">
              {mostVisitedPlaces.map((place, index) => (
                <div key={index} className="routing-place-card">
                  <div 
                    className="place-image-placeholder"
                    onClick={() => handlePlaceClick(place.title)}
                  ></div>
                  <div className="place-info">
                    <h4>{place.title}</h4>
                    <p>{place.description}</p>
                    <div className="place-meta">
                      <span>{place.distance}</span>
                      <span>|</span>
                      <span>{place.time}</span>
                      {place.rating && (
                        <>
                          <span>|</span>
                          <span className="place-rating">نظر ({place.rating}) ✅</span>
                        </>
                      )}
                    </div>
                    <div className="place-actions">
                      <button className="place-action-btn">
                        <svg 
                          className="action-icon" 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M12 18.5l7.265 2.463c.196 .077 .42 .032 .57 -.116a.548 .548 0 0 0 .134 -.572l-7.969 -17.275l-7.97 17.275c-.07 .2 -.017 .424 .135 .572c.15 .148 .374 .193 .57 .116l7.265 -2.463" />
                        </svg>
                        مسیریابی
                      </button>
                      <button className="place-action-btn">
                        <svg 
                          className="action-icon" 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
                          <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-10" />
                          <path d="M10 12l4 0" />
                        </svg>
                        ذخیره
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'closest' && (
            <div className="routing-places-grid">
              {closestPlaces.map((place, index) => (
                <div key={index} className="routing-place-card">
                  <div 
                    className="place-image-placeholder"
                    onClick={() => handlePlaceClick(place.title)}
                  ></div>
                  <div className="place-info">
                    <h4>{place.title}</h4>
                    <p>{place.description}</p>
                    <div className="place-meta">
                      <span>{place.distance}</span>
                      <span>|</span>
                      <span>{place.time}</span>
                    </div>
                    <div className="place-actions">
                      <button className="place-action-btn">
                        <svg 
                          className="action-icon" 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M12 18.5l7.265 2.463c.196 .077 .42 .032 .57 -.116a.548 .548 0 0 0 .134 -.572l-7.969 -17.275l-7.97 17.275c-.07 .2 -.017 .424 .135 .572c.15 .148 .374 .193 .57 .116l7.265 -2.463" />
                        </svg>
                        مسیریابی
                      </button>
                      <button className="place-action-btn">
                        <svg 
                          className="action-icon" 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                          <path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
                          <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-10" />
                          <path d="M10 12l4 0" />
                        </svg>
                        ذخیره
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Routing;
import { useState } from 'react';

const LocationSearchBox = ({ 
  userLocation, 
  destination, 
  onDestinationSelect, 
  recentSearches,
  expanded,
  toggleExpanded 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showRecent, setShowRecent] = useState(true);

  // Mock places data - replace with your actual shrine locations
  const places = [
    { name: "صحن انقلاب", type: "صحن", lat: 36.2885, lng: 59.6160 },
    { name: "صحن قدس", type: "صحن", lat: 36.2875, lng: 59.6155 },
    { name: "صحن آزادی", type: "صحن", lat: 36.2890, lng: 59.6165 },
    { name: "ایوان طلا", type: "رواق", lat: 36.2882, lng: 59.6158 },
    { name: "رواق امام خمینی", type: "رواق", lat: 36.2878, lng: 59.6152 },
    { name: "مسجد گوهرشاد", type: "مسجد", lat: 36.2887, lng: 59.6159 },
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      setShowRecent(true);
      return;
    }
    
    const results = places.filter(place => 
      place.name.includes(query) || place.type.includes(query)
    );
    setSearchResults(results);
    setShowRecent(false);
  };

  const handlePlaceSelect = (place) => {
    onDestinationSelect(place);
    toggleExpanded();
  };

  return (
    <div className={`location-search-box ${expanded ? 'expanded' : ''}`}>
      <div className="search-box-header">
        <div className="origin-display">
          <div className="location-marker">
            <div className="outer-circle">
              <div className="inner-circle"></div>
            </div>
          </div>
          <div className="origin-info">
            <span className="origin-label">مبدا فعلی شما</span>
            <span className="origin-name">{userLocation?.name || "در حال دریافت موقعیت..."}</span>
          </div>
          <button className="gps-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
              <path d="M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0 -16 0" />
              <path d="M12 2l0 2" />
              <path d="M12 20l0 2" />
              <path d="M20 12l2 0" />
              <path d="M2 12l2 0" />
            </svg>
          </button>
        </div>
        
        <div className="destination-input">
          <div className="swap-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-arrows-sort">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M3 9l4 -4l4 4m-4 -4v14" />
              <path d="M21 15l-4 4l-4 -4m4 4v-14" />
            </svg>
          </div>
          <div className="destination-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
              <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="مقصد را انتخاب کنید"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={toggleExpanded}
          />
        </div>
      </div>
      
      <div className="search-results">
        {showRecent ? (
          <>
            <h4 className="recent-searches-title">جستجوهای اخیر شما</h4>
            <div className="recent-searches-list">
              {recentSearches.map((search, index) => (
                <div key={index} className="recent-search-item" onClick={() => handlePlaceSelect(search)}>
                  <div className="search-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M11 18h-2a1 1 0 0 1 -1 -1v-11a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v11a1 1 0 0 1 -1 1z" />
                      <path d="M5 6l14 0" />
                      <path d="M8 9l4 0" />
                      <path d="M8 12l4 0" />
                      <path d="M8 15l4 0" />
                    </svg>
                  </div>
                  <div className="search-details">
                    <span className="search-name">{search.name}</span>
                    <span className="search-type">{search.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="search-results-list">
            {searchResults.map((result, index) => (
              <div key={index} className="search-result-item" onClick={() => handlePlaceSelect(result)}>
                <div className="result-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                    <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
                  </svg>
                </div>
                <div className="result-details">
                  <span className="result-name">{result.name}</span>
                  <span className="result-type">{result.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSearchBox;
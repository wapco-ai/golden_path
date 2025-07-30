// Culture.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useIntl, FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/culture.css';

const Culture = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locationData, setLocationData] = useState([]);
  const searchInputRef = useRef(null);

  // Translation messages
  const messages = {
    searchPlaceholder: {
      fa: " کجارو می‌خوای ببینی؟",
      en: "Where do you want to see?",
      ar: "  أين تريد أن ترى؟ ",
      ur: "آپ کہاں دیکھنا چاہتے ہیں۔؟"
    },
    noResultsFound: {
      fa: "نتیجه‌ای برای \"{query}\" یافت نشد",
      en: "No results found for \"{query}\"",
      ar: "لم يتم العثور على نتائج لـ \"{query}\"",
      ur: "\"{query}\" کے لیے کوئی نتائج نہیں ملے"
    },
    searchPrompt: {
      fa: "برای جستجو عبارت مورد نظر را وارد کنید",
      en: "Enter your search term to begin",
      ar: "أدخل مصطلح البحث للبدء",
      ur: "تلاش شروع کرنے کے لیے اپنا سرچ ٹرم درج کریں"
    },
    clearSearch: {
      fa: "پاک کردن جستجو",
      en: "Clear search",
      ar: "مسح البحث",
      ur: "تلاش صاف کریں"
    },
    closeSearch: {
      fa: "بستن جستجو",
      en: "Close search",
      ar: "إغلاق البحث",
      ur: "تلاش بند کریں"
    }
  };

  // Fetch location data
  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const response = await axios.get('./data/locationData.json');
        setLocationData(response.data);
      } catch (err) {
        console.error('Failed to load location data', err);
        toast.error(intl.formatMessage({ id: 'fetchError' }));
      }
    };
    fetchLocationData();
  }, [intl]);

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.length > 0) {
      setIsSearching(true);
      const results = locationData.filter(item => {
        const title = item.title.fa.toLowerCase();
        const location = item.location.fa.toLowerCase();
        return title.includes(query) || location.includes(query);
      });
      setSearchResults(results);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const handleClearSearch = () => {
    if (searchQuery) {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
    } else {
      navigate(-1); // Go back if search is empty
    }
  };

  const handlePlaceClick = (place) => {
    console.log('Place clicked:', place.title.fa);
    // You can add navigation or other actions here
  };

  return (
    <div className="culture-page">
      {/* Search Header */}
      <div className="culture-search-header">
        <form className="culture-search-bar" onSubmit={(e) => e.preventDefault()}>
          <button type="submit" className="culture-search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 0 0 -14 0" />
              <path d="M21 21l-6 -6" />
            </svg>
          </button>

          <input
            type="text"
            placeholder={messages.searchPlaceholder[intl.locale] || messages.searchPlaceholder.fa}
            value={searchQuery}
            onChange={handleSearchChange}
            autoFocus
            ref={searchInputRef}
            className="culture-search-input"
          />

          <button
            type="button"
            className="culture-clear-button"
            onClick={handleClearSearch}
            aria-label={searchQuery ? messages.clearSearch[intl.locale] : messages.closeSearch[intl.locale]}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </form>
      </div>

      {/* Search Results */}
      <div className="culture-results-container">
        {isSearching ? (
          searchResults.length > 0 ? (
            <div className="culture-results-grid">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className="culture-result-item"
                  onClick={() => handlePlaceClick(item)}
                >
                  <div
                    className="culture-result-image"
                    style={{ backgroundImage: `url(${item.images[0]})` }}
                  ></div>
                  <div className="culture-result-info">
                    <h4>{item.title[intl.locale] || item.title.fa}</h4>
                    <button
                      type="button"
                      className="view-button"
                      onClick={() => navigate(`/location?id=${item.id}`)}
                    >
                      <span><FormattedMessage id="viewbutton" /></span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="culture-no-results">
              <p>
                {intl.formatMessage(
                  { id: 'noResultsFound' },
                  { query: searchQuery }
                )}
              </p>
            </div>
          )
        ) : (
          <div className="culture-empty-state">
            <p>{messages.searchPrompt[intl.locale] || messages.searchPrompt.fa}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Culture;
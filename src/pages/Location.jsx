import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation as useReactLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/Location.css';
import { groups, subGroups } from '../components/groupData';
import { FormattedMessage, useIntl } from 'react-intl';
import localizeLocationData from '../utils/localizeLocationData.js';
import { useRouteStore } from '../store/routeStore';
import { useLangStore } from '../store/langStore';
import { useSearchStore } from '../store/searchStore';
import useLocaleDigits from '../utils/useLocaleDigits';
import { buildGeoJsonPath } from '../utils/geojsonPath.js';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Map subgroup labels to their values for easier lookup
const labelToValueMap = Object.values(subGroups).flat().reduce((acc, sg) => {
  acc[sg.label] = sg.value;
  return acc;
}, {});

// Get subgroup label based on currently loaded geoData
const getLocalizedSubgroupLabel = (geoData, value, fallback) => {
  if (geoData) {
    const feature = geoData.features.find(
      f => f.properties?.subGroupValue === value
    );
    if (feature?.properties?.subGroup) return feature.properties.subGroup;
  }
  return fallback;
};

// Get subgroup description based on currently loaded geoData
const getLocalizedSubgroupDescription = (geoData, value, fallback) => {
  if (geoData) {
    const feature = geoData.features.find(
      f => f.properties?.subGroupValue === value
    );
    if (feature?.properties?.description) return feature.properties.description;
  }
  return fallback;
};

const Location = () => {
  const navigate = useNavigate();
  const currentLocation = useReactLocation();

  const getSearchParams = () => {
    let search = currentLocation.search || window.location.search;
    if (!search && window.location.hash.includes('?')) {
      search = window.location.hash.split('?')[1];
      if (search) search = '?' + search;
    }
    if (search && search.includes('&amp;')) {
      search = search.replace(/&amp;/g, '&');
    }
    return new URLSearchParams(search);
  };

  const locationId = getSearchParams().get('id');
  const intl = useIntl();
  const formatDigits = useLocaleDigits();
  const [activeSlide, setActiveSlide] = useState(0);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchClose, setSearchClose] = useState(false);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [views, setViews] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [locationData, setLocationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRouting, setShowRouting] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [activeTab, setActiveTab] = useState('mostVisited');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchModalClosing, setIsSearchModalClosing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filteredSubGroups, setFilteredSubGroups] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const carouselRef = useRef(null);
  const aboutContentRef = useRef(null);
  const commentsListRef = useRef(null);
  const searchInputRef = useRef(null);
  const [routingData, setRoutingData] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const setDestinationStore = useRouteStore(state => state.setDestination);
  const language = useLangStore(state => state.language);
  const recentSearches = useSearchStore(state => state.recentSearches);
  const addSearch = useSearchStore(state => state.addSearch);

  // Split groups into initial (first 9) and additional (rest)
  const initialCategories = groups.slice(0, 9);
  const additionalCategories = groups.slice(9);

  // Fetch routingData.json from public folder
  useEffect(() => {
    fetch(`./data/routing-data.json`)
      .then(res => res.json())
      .then(data => setRoutingData(data))
      .catch(err => console.error('Failed to load routing-data.json', err));
  }, []);

  // Load geojson data for searching place coordinates
  useEffect(() => {
    const file = buildGeoJsonPath(language);
    fetch(file)
      .then(res => res.json())
      .then(setGeoData)
      .catch(err => console.error('failed to load geojson', err));
  }, [language]);

  const getPolygonCenter = (coords) => {
    const pts = [];
    const collect = (c) => {
      if (typeof c[0] === 'number') {
        pts.push(c);
      } else {
        c.forEach(collect);
      }
    };
    collect(coords);
    const lats = pts.map((p) => p[1]);
    const lngs = pts.map((p) => p[0]);
    return [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ];
  };

  const getFeatureCenter = (feature) => {
    if (!feature) return null;
    const { geometry } = feature;
    if (geometry.type === 'Point') return geometry.coordinates;
    if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      return getPolygonCenter(geometry.coordinates);
    }
    return null;
  };

  const handleSaveDestination = () => {
    setMenuOpen(false);
    // Implement save destination logic
    toast.success(intl.formatMessage({ id: 'destinationSaved' }));
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    const isRTL = document.documentElement.dir === 'rtl';

    if (touchStart - touchEnd > 50) {
      // Swipe left (or right in RTL)
      if (isRTL) {
        handleSlideChange((activeSlide - 1 + locationData.images.length) % locationData.images.length);
      } else {
        handleSlideChange((activeSlide + 1) % locationData.images.length);
      }
    }

    if (touchStart - touchEnd < -50) {
      // Swipe right (or left in RTL)
      if (isRTL) {
        handleSlideChange((activeSlide + 1) % locationData.images.length);
      } else {
        handleSlideChange((activeSlide - 1 + locationData.images.length) % locationData.images.length);
      }
    }
  };

  // Initialize carousel position
  useEffect(() => {
    if (carouselRef.current && locationData) {
      const isRTL = document.documentElement.dir === 'rtl';
      const translateValue = isRTL ? `${activeSlide * 100}%` : `-${activeSlide * 100}%`;
      carouselRef.current.style.transform = `translateX(${translateValue})`;
    }
  }, [locationData, activeSlide]);

  const handleSlideChange = (index) => {
    if (isTransitioning || index === activeSlide) return;

    setIsTransitioning(true);
    setActiveSlide(index);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

  const [currentSearchIcon, setCurrentSearchIcon] = useState(
    `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.4168 2.29169C14.4439 2.29169 17.7085 5.55628 17.7085 9.58335C17.7085 13.6104 14.4439 16.875 10.4168 16.875C6.38975 16.875 3.12516 13.6104 3.12516 9.58335C3.12516 5.55628 6.38975 2.29169 10.4168 2.29169ZM18.9585 9.58335C18.9585 4.86592 15.1343 1.04169 10.4168 1.04169C5.6994 1.04169 1.87516 4.86592 1.87516 9.58335C1.87516 11.7171 2.65755 13.6681 3.95111 15.1652L1.22489 17.8914C0.98081 18.1355 0.98081 18.5312 1.22489 18.7753C1.46897 19.0194 1.86469 19.0194 2.10877 18.7753L4.83499 16.0491C6.33204 17.3426 8.28307 18.125 10.4168 18.125C15.1343 18.125 18.9585 14.3008 18.9585 9.58335Z" fill="#1E2023"/>
      </svg>`
  );

  // Auto-advance carousel (optional)
  useEffect(() => {
    if (!locationData?.images) return;

    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % locationData.images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [locationData]);

  const toggleAbout = () => {
    if (!showFullAbout && aboutContentRef.current) {
      aboutContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
    setShowFullAbout(!showFullAbout);
  };

  const handleCommentClick = () => {
    setShowCommentModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeCommentModal = () => {
    setShowCommentModal(false);
    document.body.style.overflow = 'auto';
  };

  const handleRatingClick = (ratingValue) => {
    setRating(ratingValue);
  };

  const handleRatingHover = (ratingValue) => {
    setHoverRating(ratingValue);
  };

  const handleRatingLeave = () => {
    setHoverRating(0);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      const newComment = {
        author: intl.formatMessage({ id: 'defaultCommentAuthor' }),
        text: comment,
        date: ['fa', 'ur', 'ar'].includes(language)
          ? new Date().toLocaleDateString('fa-IR')
          : new Date().toLocaleDateString(),
        rating: rating || 0
      };

      setComments(prev => [newComment, ...prev]);
      setComment('');
      setViews(prev => prev + 1);
      setRating(0);
      setHoverRating(0);
      setShowCommentModal(false);
      document.body.style.overflow = 'auto';
      calculateAverageRating();
    }
  };

  const calculateAverageRating = () => {
    if (comments.length === 0) {
      setOverallRating(0);
      return;
    }
    const average = comments.reduce((sum, comment) => sum + (comment.rating || 0), 0) / comments.length;
    setOverallRating(average);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  const handleSearchToggle = () => {
    setShowRouting(!showRouting);
    setSearchClose(!searchClose);
    setShowRouting(!showRouting);
  };

  const handlePlaceClick = (placeTitle, groupValue, subGroupValue) => {
    console.log('Place clicked:', placeTitle);
    if (!geoData) return;
    let feature = geoData.features.find(
      f =>
        f.properties?.name === placeTitle ||
        f.properties?.subGroup === placeTitle ||
        (subGroupValue && f.properties?.subGroupValue === subGroupValue) ||
        f.properties?.subGroupValue === labelToValueMap[placeTitle]
    );
    if (!feature && groupValue) {
      feature = geoData.features.find(f => f.properties?.group === groupValue);
    }
    if (feature) {
      const center = getFeatureCenter(feature);
      if (center) {
        setDestinationStore({ name: placeTitle, coordinates: [center[1], center[0]] });
        setShowSearchModal(false);
        document.body.style.overflow = 'auto';
        navigate('/fs');
        return;
      }
    }

    toast.error(intl.formatMessage({ id: 'noDataFound' }));
  };

  const handleRecentPlaceClick = (item) => {
    if (!item?.coordinates) return;
    setDestinationStore({ name: item.name, coordinates: item.coordinates });
    addSearch(item);
    setShowSearchModal(false);
    document.body.style.overflow = 'auto';
    navigate('/fs');
  };

  const handleSearchFocus = (e) => {
    if (!showRouting) {
      e.preventDefault();
      handleSearchToggle();
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
    } else {
      setIsSearchFocused(true);
      setShowSearchModal(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };

  const closeSearchModal = (e) => {
    if (e) {
      e.stopPropagation();
    }

    if (searchQuery.trim() !== '') {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      setSelectedCategory(null);
      setFilteredSubGroups([]);

      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 0);
    } else {
      setIsSearchModalClosing(true);
      setTimeout(() => {
        setShowSearchModal(false);
        setIsSearchModalClosing(false);
        document.body.style.overflow = 'auto';
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
        setSelectedCategory(null);
        setFilteredSubGroups([]);
        // Reset the search icon to default
        setCurrentSearchIcon(
          `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M10.4168 2.29169C14.4439 2.29169 17.7085 5.55628 17.7085 9.58335C17.7085 13.6104 14.4439 16.875 10.4168 16.875C6.38975 16.875 3.12516 13.6104 3.12516 9.58335C3.12516 5.55628 6.38975 2.29169 10.4168 2.29169ZM18.9585 9.58335C18.9585 4.86592 15.1343 1.04169 10.4168 1.04169C5.6994 1.04169 1.87516 4.86592 1.87516 9.58335C1.87516 11.7171 2.65755 13.6681 3.95111 15.1652L1.22489 17.8914C0.98081 18.1355 0.98081 18.5312 1.22489 18.7753C1.46897 19.0194 1.86469 19.0194 2.10877 18.7753L4.83499 16.0491C6.33204 17.3426 8.28307 18.125 10.4168 18.125C15.1343 18.125 18.9585 14.3008 18.9585 9.58335Z" fill="#1E2023"/>
          </svg>`
        );
      }, 100);
    }
  };
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.length > 0) {
      setIsSearching(true);
      // Reset to search icon when typing
      setCurrentSearchIcon(
        `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M10.4168 2.29169C14.4439 2.29169 17.7085 5.55628 17.7085 9.58335C17.7085 13.6104 14.4439 16.875 10.4168 16.875C6.38975 16.875 3.12516 13.6104 3.12516 9.58335C3.12516 5.55628 6.38975 2.29169 10.4168 2.29169ZM18.9585 9.58335C18.9585 4.86592 15.1343 1.04169 10.4168 1.04169C5.6994 1.04169 1.87516 4.86592 1.87516 9.58335C1.87516 11.7171 2.65755 13.6681 3.95111 15.1652L1.22489 17.8914C0.98081 18.1355 0.98081 18.5312 1.22489 18.7753C1.46897 19.0194 1.86469 19.0194 2.10877 18.7753L4.83499 16.0491C6.33204 17.3426 8.28307 18.125 10.4168 18.125C15.1343 18.125 18.9585 14.3008 18.9585 9.58335Z" fill="#1E2023"/>
         </svg>`
      );

      let results = [];
      if (geoData) {
        const matched = geoData.features.filter(f => {
          const name = (f.properties?.name || '').toLowerCase();
          const subGroup = (f.properties?.subGroup || '').toLowerCase();
          return name.includes(query) || subGroup.includes(query);
        });

        const seen = new Set();
        matched.forEach(f => {
          const label = f.properties?.name || '';
          const key = `${label}-${f.properties?.subGroupValue}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({
              type: 'subgroup',
              label,
              description: getLocalizedSubgroupDescription(
                geoData,
                f.properties?.subGroupValue,
                intl.formatMessage({ id: 'subgroupDefaultDesc' })
              ),
              groupValue: f.properties?.group,
              subGroupValue: f.properties?.subGroupValue
            });
          }
        });
      }

      setSearchResults(results);
      setSelectedCategory(null);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    const localized = (subGroups[category.value] || []).map(sg => ({
      ...sg,
      label: getLocalizedSubgroupLabel(geoData, sg.value, sg.label),
      description: getLocalizedSubgroupDescription(
        geoData,
        sg.value,
        intl.formatMessage({ id: sg.description })
      )
    }));
    setFilteredSubGroups(localized);
    setShowSearchModal(true);
    setSearchQuery('');
    setCurrentSearchIcon(category.svg); // Set the icon to the category's icon
    document.body.style.overflow = 'hidden';
  };

  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const response = await axios.get(`./data/locationData.json`);
        let data = response.data;
        if (Array.isArray(data)) {
          data = data.find(loc => loc.id === locationId) || data[0];
        }
        data = localizeLocationData(data, language);
        setLocationData(data);
        setComments(data.comments || []);
        setViews(data.views || 0);
        setOverallRating(data.averageRating || 0);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchLocationData();
  }, [locationId, language]);

  useEffect(() => {
    calculateAverageRating();
  }, [comments]);

  if (loading)
    return <div className="loading">{intl.formatMessage({ id: 'loading' })}</div>;
  if (error)
    return (
      <div className="error">
        {intl.formatMessage({ id: 'fetchError' }, { error })}
      </div>
    );
  if (!locationData)
    return <div className="no-data">{intl.formatMessage({ id: 'noDataFound' })}</div>;

  return (
    <div className="location-page">
      {/* Updated Carousel */}
      <div className="carousel-wrapper">
        <div className="fixed-header-icons">
          <div className="menu-container2">
            <button className={`menu-icon2 ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                <path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
              </svg>
            </button>

            <div className={`menu-dropdown2 ${menuOpen ? 'open' : ''}`}>
              <button className="menu-item2" onClick={handleSaveDestination}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M17.286 21.09q -1.69 .001 -5.288 -2.615q -3.596 2.617 -5.288 2.616q -2.726 0 -.495 -6.8q -9.389 -6.775 2.135 -6.775h.076q 1.785 -5.516 3.574 -5.516q 1.785 0 3.574 5.516h.076q 11.525 0 2.133 6.774q 2.23 6.802 -.497 6.8" />
                </svg>
                <FormattedMessage id="savePlace" />
              </button>
              <button className="menu-item2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M6 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                  <path d="M18 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                  <path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                  <path d="M8.7 10.7l6.6 -3.4" />
                  <path d="M8.7 13.3l6.6 3.4" />
                </svg>
                <FormattedMessage id="shareRoute" />
              </button>
            </div>
          </div>
          <button className="profile-icon" onClick={() => navigate('/Profile')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9.99984" cy="5" r="3.33333" fill="#1E2023" />
              <ellipse cx="9.99984" cy="14.1667" rx="5.83333" ry="3.33333" fill="#1E2023" />
            </svg>

          </button>
        </div>
        <div className="carousel-container">
          <div
            className="carousel"
            ref={carouselRef}
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {locationData.images?.map((image, index) => (
              <div key={index} className="carousel-slide">
                <img
                  src={image}
                  alt={intl.formatMessage(
                    { id: 'imageAlt' },
                    { title: locationData.title, n: index + 1 }
                  )}
                  loading={index > 0 ? "lazy" : "eager"}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
          <div className="carousel-fade"></div>
        </div>
        <div className="carousel-dots">
          {locationData.images?.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === activeSlide ? 'active' : ''}`}
              onClick={() => handleSlideChange(index)}
              aria-label={intl.formatMessage({ id: 'goToSlide' }, { n: index + 1 })}
            ></button>
          ))}
        </div>
      </div>

      {/* Location Info Section */}
      <section className="location-info2">
        <div className="you-are-here">
          <div className="line left-line"></div>
          <div className="circle"></div>
          <span>
            <FormattedMessage id="youAreHere" />
          </span>
          <div className="line right-line"></div>
        </div>
        <h1>{locationData.title}</h1>
        <h2>{locationData.location}</h2>

        <div className="location-meta">
          <div className="opening-hours-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-clock"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 7v5l3 3" /></svg>
            <span>{locationData.openingHours}</span>
          </div>
          <div className="views-rating">
            <span className="rating">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
              </svg>
              {formatDigits(overallRating.toFixed(1))}
            </span>
            <span className="views">({formatDigits(views)} {intl.formatMessage({ id: 'commentsLabel' })})</span>
          </div>
        </div>

        <div className="about-location" ref={aboutContentRef}>
          <h3>
            <FormattedMessage id="aboutLocation" values={{ title: locationData.title }} />
          </h3>
          <div className={`about-content ${showFullAbout ? 'expanded' : ''}`}>
            <p>
              {showFullAbout ? locationData.about.full : locationData.about.short}
              {!showFullAbout && (
                <button className="read-more" onClick={toggleAbout}>
                  <FormattedMessage id="readMore" />
                </button>
              )}
            </p>
            {showFullAbout && (
              <div className="close-button-container">
                <button className="read-more close-button" onClick={toggleAbout}>
                  <FormattedMessage id="close" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Audio/Video/Text Content Section */}
      {locationData.contents && locationData.contents.length > 0 && (
        <section className="content-section">
          <h3>
            <FormattedMessage id="audioTextContent" values={{ title: locationData.title }} />
          </h3>
          <div className="content-list">
            {locationData.contents.map((content) => (
              <div key={content.id} className="content-item">
                <div className="content-media">
                  {content.type === 'audio' && (
                    <div className="audio-thumbnail" style={{ backgroundImage: `url(${content.thumbnail})` }}>
                      <div className="play-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polygon points="10 8 16 12 10 16 10 8"></polygon>
                        </svg>
                      </div>
                    </div>
                  )}
                  {content.type === 'video' && (
                    <div className="video-thumbnail" style={{ backgroundImage: `url(${content.thumbnail})` }}>
                      <div className="play-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polygon points="10 8 16 12 10 16 10 8"></polygon>
                        </svg>
                      </div>
                    </div>
                  )}
                  {content.type === 'pdf' && (
                    <div className="pdf-thumbnail">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <path d="M10 11H8v2h2v-2z"></path>
                        <path d="M16 11h-2v2h2v-2z"></path>
                        <path d="M14 11h-2v2h2v-2z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="content-info">
                  <h4>{content.title[language]}</h4>
                  <p>{content.description[language]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments Section */}
      <section className="comments-section">
        <div className="comments-header">
          <h3>
            <FormattedMessage id="commentsTitle" values={{ count: comments.length }} />
          </h3>
          <button className="view-all-btn">
            <FormattedMessage id="viewAll" />
            <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M15 6l-6 6l6 6" />
            </svg>
          </button>
        </div>

        <div className="comment-input-wrapper" onClick={handleCommentClick}>
          <div className="comment-input-header">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M7.99992 1.83337C4.59416 1.83337 1.83325 4.59428 1.83325 8.00004C1.83325 8.98741 2.06494 9.91924 2.47645 10.7454C2.64161 11.077 2.70521 11.4736 2.60101 11.863L2.20394 13.347C2.13101 13.6196 2.38036 13.8689 2.65291 13.796L4.13694 13.399C4.5264 13.2947 4.92292 13.3583 5.25452 13.5235C6.08072 13.935 7.01255 14.1667 7.99992 14.1667C11.4057 14.1667 14.1666 11.4058 14.1666 8.00004C14.1666 4.59428 11.4057 1.83337 7.99992 1.83337ZM0.833252 8.00004C0.833252 4.042 4.04188 0.833374 7.99992 0.833374C11.958 0.833374 15.1666 4.042 15.1666 8.00004C15.1666 11.9581 11.958 15.1667 7.99992 15.1667C6.85438 15.1667 5.77027 14.8976 4.80868 14.4186C4.66519 14.3472 4.51868 14.332 4.39541 14.365L2.91139 14.762C1.8955 15.0339 0.966101 14.1045 1.23792 13.0886L1.63499 11.6045C1.66797 11.4813 1.65281 11.3348 1.58134 11.1913C1.10239 10.2297 0.833252 9.14558 0.833252 8.00004ZM4.83325 7.00004C4.83325 6.7239 5.05711 6.50004 5.33325 6.50004H10.6666C10.9427 6.50004 11.1666 6.7239 11.1666 7.00004C11.1666 7.27618 10.9427 7.50004 10.6666 7.50004H5.33325C5.05711 7.50004 4.83325 7.27618 4.83325 7.00004ZM4.83325 9.33337C4.83325 9.05723 5.05711 8.83337 5.33325 8.83337H8.99992C9.27606 8.83337 9.49992 9.05723 9.49992 9.33337C9.49992 9.60952 9.27606 9.83337 8.99992 9.83337H5.33325C5.05711 9.83337 4.83325 9.60952 4.83325 9.33337Z" fill="#1E2023" />
            </svg>

            <h4>
              <FormattedMessage id="commentPromptTitle" />
            </h4>
          </div>
          <p className="comment-instruction">
            <FormattedMessage id="commentPromptInstruction" />
          </p>
          <div className="comment-input-container">
            <input
              type="text"
              placeholder={intl.formatMessage({ id: 'commentPlaceholder' })}
              readOnly
            />
            <button type="button" className="send-comment">
              <svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.39464 15.0728L5.34893 13.05C1.81466 11.2829 0.0475295 10.3993 0.0475289 9.00008C0.047529 7.60087 1.81466 6.7173 5.34892 4.95017L9.39463 2.92732C12.2471 1.50107 13.6734 0.787951 14.5002 1.00685C15.2868 1.21509 15.9011 1.82943 16.1094 2.61602C16.3283 3.44287 15.6152 4.86911 14.1889 7.72161C14.0122 8.07512 13.6508 8.31029 13.2555 8.31213L6.79714 8.34219C6.4338 8.34388 6.14063 8.6398 6.14232 9.00314C6.14401 9.36648 6.43993 9.65966 6.80327 9.65797L13.1574 9.62839C13.593 9.62637 13.9941 9.88892 14.1889 10.2786C15.6152 13.131 16.3283 14.5573 16.1094 15.3841C15.9011 16.1707 15.2868 16.7851 14.5002 16.9933C13.6734 17.2122 12.2471 16.4991 9.39464 15.0728Z" fill="#1E2023" />
              </svg>

            </button>
          </div>
        </div>

        <div className="comment-list-horizontal">
          {comments.map((item, index) => (
            <div key={index} className="comment-item">
              <div className="comment-header">
                <div className="comment-author-section">
                  <div className="profile-avatar2" />
                  <span className="comment-author">{item.author}</span>
                </div>
                <span className="comment-date">{item.date}</span>
              </div>
              <div className="comment-text">{item.text}</div>
              <div className="comment-rating-section">
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={star <= item.rating ? 'filled' : ''}
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comment Modal */}
      {showCommentModal && (
        <>
          <div className="modal-overlay" onClick={closeCommentModal}></div>
          <div className="comment-modal">
            <div className="modal-header">
              <h3>
                <FormattedMessage id="commentModalTitle" />
              </h3>
              <button className="close-modal" onClick={closeCommentModal}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M18 6l-12 12" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-content">
              <p className="modal-instruction">
                <FormattedMessage id="commentModalInstruction" />
              </p>

              <div className="rating-section">
                <p>
                  <FormattedMessage id="ratingPrompt" />
                </p>
                <div className="stars">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <span
                      key={star}
                      onMouseEnter={() => handleRatingHover(star)}
                      onMouseLeave={handleRatingLeave}
                      onClick={() => handleRatingClick(star)}
                    >
                      <svg
                        className={`star-icon ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
                      </svg>
                    </span>
                  ))}
                </div>
              </div>

              <div className="modal-comment-input">
                <textarea
                  placeholder={intl.formatMessage({ id: 'commentPlaceholder' })}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>

              <button className="submit-comment" onClick={handleCommentSubmit}>
                <FormattedMessage id="submitComment" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Search Bar with Integrated Routing */}
      <div className={`search-bar-container ${showRouting ? 'expanded' : ''}`}>
        <div className="search-bar-toggle" onClick={handleSearchToggle}>
          <div className="toggle-handle"></div>
        </div>

        <form className="search-bar" onSubmit={handleSearchSubmit}>
          <button type="submit" className="search-icon">
            <div dangerouslySetInnerHTML={{ __html: currentSearchIcon }} />
          </button>

          <input
            type="text"
            placeholder={intl.formatMessage({ id: 'searchPlaceholder' })}
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onMouseDown={(e) => {
              if (!showRouting) {
                e.preventDefault();
                handleSearchToggle();
              }
            }}
            onBlur={handleSearchBlur}
            ref={searchInputRef}
          />

          {!isSearchFocused ? (
            <button type="button" className="map-button" onClick={() => navigate('/mpr')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="icon icon-tabler icons-tabler-map-pin">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z" />
              </svg>
              <span><FormattedMessage id="map" /></span>
            </button>
          ) : (
            <button
              type="button"
              className="close-search-button"
              onClick={(e) => {
                e.stopPropagation();
                closeSearchModal(e);
              }}
              aria-label={
                searchQuery.trim() === ''
                  ? intl.formatMessage({ id: 'closeSearch' })
                  : intl.formatMessage({ id: 'clearSearch' })
              }
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-x">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M18 6l-12 12" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          )}
        </form>

        {/* Integrated Routing Content */}
        {showRouting && routingData && (
          <div className="integrated-routing-content">
            {/* Categories Section */}
            <div className="routing-categories-section">
              <h2 className="routing-section-title">
                <FormattedMessage id="searchSuggestions" />
              </h2>
              <div className={`routing-categories-grid ${showAllCategories ? 'expanded' : ''}`}>
                {initialCategories.map((category, index) => (
                  <div
                    key={index}
                    className="routing-category-item"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="category-icon" dangerouslySetInnerHTML={{ __html: category.svg }} />
                    <span>{intl.formatMessage({ id: category.label })}</span>
                  </div>
                ))}
                {showAllCategories && additionalCategories.map((category, index) => (
                  <div
                    key={index + initialCategories.length}
                    className="routing-category-item"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <div className="category-icon" dangerouslySetInnerHTML={{ __html: category.svg }} />
                    <span>{intl.formatMessage({ id: category.label })}</span>
                  </div>
                ))}
              </div>
              <button
                className="routing-show-more-btn"
                onClick={() => setShowAllCategories(!showAllCategories)}
              >
                {showAllCategories
                  ? intl.formatMessage({ id: 'showLess' })
                  : intl.formatMessage({ id: 'showMore' })}
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
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M15 6l-6 6l6 6" />
                </svg>
              </button>
            </div>

            {/* Shrine Events Section - Horizontal Scroll */}
            <div className="shrine-events-section">
              <div className="shrine-events-header">
                <h2 className="shrine-events-title">
                  <FormattedMessage id="shrineEventsTitle" />
                </h2>
                <button className="view-all-events">
                  <FormattedMessage id="viewAll" />
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M15 6l-6 6l6 6" />
                  </svg>
                </button>
              </div>
              <div className="shrine-events-list">
                {routingData.places.shrineEvents?.map((event, index) => (
                  <div key={index} className="shrine-event-item">
                    <div
                      className="place-image-placeholder"
                      style={{ backgroundImage: `url(${event.image})` }}
                    ></div>
                    <div className="place-info">
                      <h3 className="place-title">{event.title}</h3>
                      <p className="place-description">{event.description}</p>
                      <div className="place-info2">
                        <span className="place-address">
                          <svg width="24" height="24" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M10.2073 2.9087C9.5 3.53569 9.5 4.68259 9.5 6.9764V18.0236C9.5 20.3174 9.5 21.4643 10.2073 22.0913C10.9145 22.7183 11.9955 22.5297 14.1576 22.1526L16.4864 21.7465C18.8809 21.3288 20.0781 21.12 20.7891 20.2417C21.5 19.3635 21.5 18.0933 21.5 15.5529V9.44711C21.5 6.90671 21.5 5.63652 20.7891 4.75826C20.0781 3.87999 18.8809 3.67118 16.4864 3.25354L14.1576 2.84736C11.9955 2.47026 10.9145 2.28171 10.2073 2.9087ZM12.5 10.6686C12.9142 10.6686 13.25 11.02 13.25 11.4535V13.5465C13.25 13.98 12.9142 14.3314 12.5 14.3314C12.0858 14.3314 11.75 13.98 11.75 13.5465V11.4535C11.75 11.02 12.0858 10.6686 12.5 10.6686Z" fill="#1E2023" />
                            <path d="M8.04717 5C5.98889 5.003 4.91599 5.04826 4.23223 5.73202C3.5 6.46425 3.5 7.64276 3.5 9.99979V14.9998C3.5 17.3568 3.5 18.5353 4.23223 19.2676C4.91599 19.9513 5.98889 19.9966 8.04717 19.9996C7.99985 19.3763 7.99992 18.6557 8.00001 17.8768V7.1227C7.99992 6.34388 7.99985 5.6233 8.04717 5Z" fill="#1E2023" />
                          </svg>

                          {event.location}
                        </span>
                        <div className="place-meta">
                          <span className="shrine-event-time">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="black">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                              <path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-5 2.66a1 1 0 0 0 -.993 .883l-.007 .117v5l.009 .131a1 1 0 0 0 .197 .477l.087 .1l3 3l.094 .082a1 1 0 0 0 1.226 0l.094 -.083l.083 -.094a1 1 0 0 0 0 -1.226l-.083 -.094l-2.707 -2.708v-4.585l-.007 -.117a1 1 0 0 0 -.993 -.883z" />
                            </svg>
                            {event.time}
                          </span>
                        </div>
                      </div>

                      <div className="place-actions">
                        <button className="place-action-btn" onClick={() => navigate('/fs')}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M11.092 2.581a1 1 0 0 1 1.754 -.116l.062 .116l8.005 17.365c.198 .566 .05 1.196 -.378 1.615a1.53 1.53 0 0 1 -1.459 .393l-7.077 -2.398l-6.899 2.338a1.535 1.535 0 0 1 -1.52 -.231l-.112 -.1c-.398 -.386 -.556 -.954 -.393 -1.556l.047 -.15l7.97 -17.276z" />
                          </svg>
                          <FormattedMessage id="navigate" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Places Section with Tabs */}
            <div className="routing-places-section">
              <div className="routing-tabs">
                <button
                  className={`routing-tab ${activeTab === 'mostVisited' ? 'active' : ''}`}
                  onClick={() => setActiveTab('mostVisited')}
                >
                  <FormattedMessage id="mostVisited" />
                </button>
                <button
                  className={`routing-tab ${activeTab === 'closest' ? 'active' : ''}`}
                  onClick={() => setActiveTab('closest')}
                >
                  <FormattedMessage id="nearMe" />
                </button>
              </div>

              <div className="routing-places-content">
                {activeTab === 'mostVisited' && (
                  <>
                    {routingData.places.mostVisited.map((place, index) => (
                      <div key={index} className="routing-place-card">
                        <div
                          className="place-image-placeholder"
                          style={{ backgroundImage: `url(${place.image})` }}
                          onClick={() => handlePlaceClick(place.title)}
                        ></div>
                        <div className="place-info">
                          <h4 className="place-title">{place.title}</h4>
                          <div className="place-meta">
                            <div className="place-address">{place.address}</div>
                            <span className="place-meta-separator">|</span>
                            <span>{place.distance}</span>
                            <span className="place-meta-separator">|</span>
                            <span>{place.time}</span>
                          </div>
                          <div className="place-rating-section">
                            <div className="place-rating-stars">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                  key={star}
                                  className={star <= Math.round(place.rating) ? 'filled' : ''}
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                  <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
                                </svg>
                              ))}
                            </div>
                            <span className="place-views">({formatDigits(place.views)} {intl.formatMessage({ id: 'commentsLabel' })})</span>
                          </div>
                          <p className="place-description">{place.description}</p>
                          <button className="read-more-btn">
                            <FormattedMessage id="readMore" />
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                              <path d="M15 6l-6 6l6 6" />
                            </svg>
                          </button>
                          <div className="place-actions">
                            <button className="place-action-btn2" onClick={() => navigate('/fs')}>
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
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M12 18.5l7.265 2.463c.196 .077 .42 .032 .57 -.116a.548 .548 0 0 0 .134 -.572l-7.969 -17.275l-7.97 17.275c-.07 .2 -.017 .424 .135 .572c.15 .148 .374 .193 .57 .116l7.265 -2.463" />
                              </svg>
                              <FormattedMessage id="navigate" />
                            </button>
                            <button className="place-action-btn2">
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
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
                                <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-10" />
                                <path d="M10 12l4 0" />
                              </svg>
                              <FormattedMessage id="save" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {activeTab === 'closest' && (
                  <>
                    {routingData.places.nearest.map((place, index) => (
                      <div key={index} className="routing-place-card">
                        <div
                          className="place-image-placeholder"
                          style={{ backgroundImage: `url(${place.image})` }}
                          onClick={() => handlePlaceClick(place.title)}
                        ></div>
                        <div className="place-info">
                          <h4 className="place-title">{place.title}</h4>
                          <div className="place-address">{place.address}</div>
                          <div className="place-meta">
                            <span>{place.distance}</span>
                            <span className="place-meta-separator">|</span>
                            <span>{place.time}</span>
                          </div>
                          <p className="place-description">{place.description}</p>
                          <button className="read-more-btn">
                            <FormattedMessage id="readMore" />
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                              <path d="M15 6l-6 6l6 6" />
                            </svg>
                          </button>
                          <div className="place-actions">
                            <button className="place-action-btn" onClick={() => navigate('/fs')}>
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
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M12 18.5l7.265 2.463c.196 .077 .42 .032 .57 -.116a.548 .548 0 0 0 .134 -.572l-7.969 -17.275l-7.97 17.275c-.07 .2 -.017 .424 .135 .572c.15 .148 .374 .193 .57 .116l7.265 -2.463" />
                              </svg>
                              <FormattedMessage id="navigate" />
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
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M3 4m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
                                <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-10" />
                                <path d="M10 12l4 0" />
                              </svg>
                              <FormattedMessage id="save" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <>
          <div
            className={`search-modal-overlay ${isSearchModalClosing ? 'fade-out' : 'fade-in'}`}
            onClick={closeSearchModal}
          ></div>
          <div className={`search-modal ${isSearchModalClosing ? 'fade-out' : 'fade-in'}`}>
            <div className="search-modal-header">
              <form className="search-bar expanded-search" onSubmit={handleSearchSubmit}>
                <button type="submit" className="search-icon">
                  <div dangerouslySetInnerHTML={{ __html: currentSearchIcon }} />
                </button>

                <input
                  type="text"
                  placeholder={intl.formatMessage({ id: 'searchPlaceholder' })}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoFocus
                  ref={searchInputRef}
                  className="expanded-search-input"
                />

                <button
                  type="button"
                  className="close-search-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSearchModal(e);
                  }}
                  aria-label={
                    searchQuery.trim() === ''
                      ? intl.formatMessage({ id: 'closeSearch' })
                      : intl.formatMessage({ id: 'clearSearch' })
                  }
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-x">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M18 6l-12 12" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </form>
            </div>
            <div className="search-modal-content">
              {isSearching ? (
                <div className="search-results-container">
                  {searchResults.length > 0 ? (
                    <div className="subgroups-without-images">
                      {searchResults.map((item, index) => {
                        const group = groups.find(g => g.value === item.groupValue);
                        return (
                          <div
                            key={index}
                            className="subgroup-item-no-image"
                            onClick={() => handlePlaceClick(item.label, item.groupValue, item.subGroupValue)}
                          >
                            <div className="subgroup-icon" dangerouslySetInnerHTML={{ __html: group?.svg || '' }} />
                            <div className="subgroup-text">
                              <h4>{item.label}</h4>
                              {item.description && <p>{item.description}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="no-results">
                      <p>
                        <FormattedMessage
                          id="noResultsFound"
                          values={{ query: searchQuery }}
                        />
                      </p>
                    </div>
                  )}
                </div>
              ) : selectedCategory ? (
                <div className="subgroups-container">
                  {/* Split subgroups into those with images and without */}
                  <div className="subgroups-with-images">
                    <div className="subgroups-grid">
                      {(filteredSubGroups.length > 0 ? filteredSubGroups : subGroups[selectedCategory.value])
                        .filter(subgroup => subgroup.img)
                        .map((subgroup, index) => (
                          <div
                            key={index}
                            className="subgroup-item with-image"
                            onClick={() => handlePlaceClick(subgroup.label, selectedCategory.value, subgroup.value)}
                            style={{
                              backgroundImage: subgroup.img ? `url(${subgroup.img})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundColor: 'rgba(255,255,255,0.7)',
                              backgroundBlendMode: 'lighten'
                            }}
                          >
                            <div className="subgroup-info">
                              <h4>{subgroup.label}</h4>
                              {subgroup.description && <p>{subgroup.description}</p>}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="subgroups-without-images">
                    {(filteredSubGroups.length > 0 ? filteredSubGroups : subGroups[selectedCategory.value])
                      .filter(subgroup => !subgroup.img)
                      .map((subgroup, index) => (
                        <div
                          key={index}
                          className="subgroup-item-no-image"
                          onClick={() => handlePlaceClick(subgroup.label, selectedCategory.value, subgroup.value)}
                        >
                          <div className="subgroup-icon" dangerouslySetInnerHTML={{ __html: subgroup.svg }} />
                          <div className="subgroup-text">
                            <h4>{subgroup.label}</h4>
                            {subgroup.description && <p>{subgroup.description}</p>}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <>
                  {recentSearches.length > 0 ? (
                    <>
                      <h2 className="location-recent-title">
                        {intl.formatMessage({ id: 'mapRecentSearches' })}
                      </h2>
                      <ul className="location-destination-list">
                        {recentSearches.map((item) => (
                          <li key={item.id} onClick={() => handleRecentPlaceClick(item)}>
                            <div className="location-recent-icon">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="15"
                                height="15"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="icon icon-tabler icons-tabler-outline icon-tabler-clock-down"
                              >
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M20.984 12.535a9 9 0 1 0 -8.431 8.448" />
                                <path d="M12 7v5l3 3" />
                                <path d="M19 16v6" />
                                <path d="M22 19l-3 3l-3 -3" />
                              </svg>
                            </div>
                            <div className="location-destination-info">
                              <span className="location-destination-name">{item.name}</span>
                              <span className="location-destination-location">{item.location}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="location-no-recent">
                      {intl.formatMessage({ id: 'mapNoRecentSearches' })}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Location;
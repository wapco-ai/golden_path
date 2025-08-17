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
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showRouteInfoModal, setShowRouteInfoModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

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

  const handleSubgroupSelect = (place) => {
    setSelectedPlace(place);
    setShowRouteInfoModal(true);
    setSelectedOption(null); // Reset selection when modal opens
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
        handleSubgroupSelect({
          name: placeTitle,
          coordinates: [center[1], center[0]]
        });
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
                    <div className="video-thumbnail-container">
                      <a
                        href={content.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="video-thumbnail-link"
                      >
                        <div
                          className="video-thumbnail"
                          style={{ backgroundImage: `url(${content.thumbnail})` }}
                        >
                          <div className="play-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polygon points="10 8 16 12 10 16 10 8"></polygon>
                            </svg>
                          </div>
                        </div>
                      </a>
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.5 4.37508C7.15482 4.37508 6.875 4.6549 6.875 5.00008C6.875 5.34526 7.15482 5.62508 7.5 5.62508H12.5C12.8452 5.62508 13.125 5.34526 13.125 5.00008C13.125 4.6549 12.8452 4.37508 12.5 4.37508H7.5Z" fill="#0F71EF" />
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M9.95209 1.04175C8.22495 1.04174 6.8643 1.04173 5.80107 1.18622C4.70935 1.33459 3.83841 1.64565 3.15403 2.33745C2.47058 3.02831 2.1641 3.90593 2.01775 5.00626C1.87498 6.07967 1.87499 7.45393 1.875 9.20097V13.4493C1.87499 14.7056 1.87498 15.7002 1.95501 16.4491C2.03409 17.1891 2.20373 17.8568 2.6882 18.3033C3.07688 18.6615 3.56842 18.8873 4.09304 18.9473C4.74927 19.0224 5.36199 18.7091 5.96557 18.2815C6.57636 17.8489 7.3173 17.1935 8.25212 16.3667L8.28254 16.3398C8.71593 15.9564 9.00935 15.6978 9.25416 15.5187C9.49076 15.3457 9.63522 15.2832 9.75698 15.2587C9.91743 15.2263 10.0826 15.2263 10.243 15.2587C10.3648 15.2832 10.5092 15.3457 10.7458 15.5187C10.9906 15.6978 11.2841 15.9564 11.7175 16.3398L11.7479 16.3667C12.6827 17.1935 13.4237 17.8489 14.0344 18.2815C14.638 18.7091 15.2507 19.0224 15.907 18.9473C16.4316 18.8873 16.9231 18.6615 17.3118 18.3033C17.7963 17.8568 17.9659 17.1891 18.045 16.4491C18.125 15.7002 18.125 14.7056 18.125 13.4493V9.20095C18.125 7.45393 18.125 6.07966 17.9823 5.00626C17.8359 3.90593 17.5294 3.02831 16.846 2.33745C16.1616 1.64565 15.2907 1.33459 14.1989 1.18622C13.1357 1.04173 11.7751 1.04174 10.0479 1.04175H9.95209ZM4.04267 3.21655C4.45664 2.7981 5.01876 2.55403 5.9694 2.42484C6.93871 2.2931 8.21438 2.29175 10 2.29175C11.7856 2.29175 13.0613 2.2931 14.0306 2.42484C14.9812 2.55403 15.5434 2.7981 15.9573 3.21655C16.3722 3.63594 16.6149 4.20691 16.7432 5.17106C16.8737 6.15251 16.875 7.44361 16.875 9.24801V13.4092C16.875 14.7144 16.8741 15.6419 16.8021 16.3163C16.7282 17.0074 16.592 17.2668 16.4647 17.3841C16.2699 17.5636 16.0248 17.6757 15.7649 17.7054C15.5985 17.7245 15.3196 17.66 14.757 17.2615C14.2081 16.8727 13.5176 16.2632 12.5456 15.4035L12.5238 15.3842C12.1177 15.025 11.781 14.7271 11.4837 14.5097C11.1728 14.2824 10.8594 14.1077 10.4899 14.0333C10.1665 13.9681 9.83352 13.9681 9.51015 14.0333C9.14064 14.1077 8.82715 14.2824 8.51633 14.5097C8.21902 14.7271 7.88226 15.025 7.47621 15.3842L7.45439 15.4035C6.48239 16.2632 5.79189 16.8727 5.24304 17.2615C4.68038 17.66 4.40151 17.7245 4.23515 17.7054C3.97516 17.6757 3.73014 17.5636 3.53531 17.3841C3.40803 17.2668 3.27179 17.0074 3.19793 16.3163C3.12587 15.6419 3.125 14.7144 3.125 13.4092V9.24801C3.125 7.44361 3.1263 6.15251 3.25684 5.17106C3.38508 4.20691 3.62777 3.63594 4.04267 3.21655Z" fill="#0F71EF" />
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
                                width="22"
                                height="22"
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
                              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.5 4.37496C7.15482 4.37496 6.875 4.65478 6.875 4.99996C6.875 5.34514 7.15482 5.62496 7.5 5.62496H12.5C12.8452 5.62496 13.125 5.34514 13.125 4.99996C13.125 4.65478 12.8452 4.37496 12.5 4.37496H7.5Z" fill="#FFFFFF" />
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M9.95209 1.04163C8.22495 1.04161 6.8643 1.0416 5.80107 1.1861C4.70935 1.33447 3.83841 1.64553 3.15403 2.33732C2.47058 3.02818 2.1641 3.90581 2.01775 5.00614C1.87498 6.07955 1.87499 7.45381 1.875 9.20085V13.4491C1.87499 14.7054 1.87498 15.7001 1.95501 16.449C2.03409 17.189 2.20373 17.8567 2.6882 18.3031C3.07688 18.6613 3.56842 18.8872 4.09304 18.9472C4.74927 19.0223 5.36199 18.7089 5.96557 18.2814C6.57636 17.8487 7.3173 17.1934 8.25212 16.3665L8.28254 16.3396C8.71593 15.9563 9.00935 15.6976 9.25416 15.5186C9.49076 15.3456 9.63522 15.2831 9.75698 15.2585C9.91743 15.2262 10.0826 15.2262 10.243 15.2585C10.3648 15.2831 10.5092 15.3456 10.7458 15.5186C10.9906 15.6976 11.2841 15.9563 11.7175 16.3396L11.7479 16.3666C12.6827 17.1934 13.4237 17.8488 14.0344 18.2814C14.638 18.7089 15.2507 19.0223 15.907 18.9472C16.4316 18.8872 16.9231 18.6613 17.3118 18.3031C17.7963 17.8567 17.9659 17.189 18.045 16.449C18.125 15.7001 18.125 14.7054 18.125 13.4492V9.20083C18.125 7.45381 18.125 6.07954 17.9823 5.00614C17.8359 3.90581 17.5294 3.02818 16.846 2.33732C16.1616 1.64553 15.2907 1.33447 14.1989 1.1861C13.1357 1.0416 11.7751 1.04161 10.0479 1.04163H9.95209ZM4.04267 3.21643C4.45664 2.79797 5.01876 2.55391 5.9694 2.42471C6.93871 2.29298 8.21438 2.29163 10 2.29163C11.7856 2.29163 13.0613 2.29298 14.0306 2.42471C14.9812 2.55391 15.5434 2.79797 15.9573 3.21643C16.3722 3.63582 16.6149 4.20678 16.7432 5.17094C16.8737 6.15239 16.875 7.44349 16.875 9.24789V13.409C16.875 14.7143 16.8741 15.6418 16.8021 16.3161C16.7282 17.0073 16.592 17.2667 16.4647 17.384C16.2699 17.5635 16.0248 17.6755 15.7649 17.7053C15.5985 17.7243 15.3196 17.6599 14.757 17.2614C14.2081 16.8726 13.5176 16.263 12.5456 15.4033L12.5238 15.384C12.1177 15.0249 11.781 14.727 11.4837 14.5096C11.1728 14.2823 10.8594 14.1076 10.4899 14.0332C10.1665 13.968 9.83352 13.968 9.51015 14.0332C9.14064 14.1076 8.82715 14.2823 8.51633 14.5096C8.21902 14.727 7.88226 15.0249 7.47621 15.384L7.45439 15.4033C6.48239 16.263 5.79189 16.8726 5.24304 17.2614C4.68038 17.6599 4.40151 17.7243 4.23515 17.7053C3.97516 17.6755 3.73014 17.5635 3.53531 17.384C3.40803 17.2667 3.27179 17.0073 3.19793 16.3161C3.12587 15.6418 3.125 14.7143 3.125 13.409V9.24789C3.125 7.44349 3.1263 6.15239 3.25684 5.17094C3.38508 4.20678 3.62777 3.63582 4.04267 3.21643Z" fill="#FFFFFF" />
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

              {/* Route or Info Modal */}
              {showRouteInfoModal && selectedPlace && (
                <>
                  <div className="modal-overlay" onClick={() => setShowRouteInfoModal(false)}></div>
                  <div className="route-info-modal">
                    <div className="route-info-toggle" onClick={() => setShowRouteInfoModal(false)}>
                      <div className="toggle-handle"></div>
                    </div>
                    <div className="modal-header">
                      <span className="place-name-title3">{selectedPlace.name}</span>
                      <h3>
                        <FormattedMessage
                          id="routeOrInfoTitle"
                          values={{ placeName: selectedPlace.name }}
                        />
                      </h3>
                    </div>

                    <div className="route-info-options">
                      <button
                        className={`route-info-option ${selectedOption === 'route' ? 'selected' : ''}`}
                        onClick={() => setSelectedOption('route')}
                      >
                        <div className="option-icon">
                          <svg width="60" height="60" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M29.227 5.37733C27.0604 5.08603 24.2134 5.08337 20.2497 5.08337C16.286 5.08337 13.4389 5.08603 11.2723 5.37733C9.14163 5.66379 7.8571 6.20861 6.90767 7.15804C5.95824 8.10746 5.41342 9.392 5.12696 11.5227C4.83566 13.6893 4.83301 16.5363 4.83301 20.5C4.83301 24.4637 4.83566 27.3108 5.12696 29.4774C5.41342 31.6081 5.95824 32.8926 6.90767 33.842C7.68705 34.6214 8.69224 35.1282 10.2059 35.4431L35.1928 10.4563C34.8778 8.94261 34.3711 7.93741 33.5917 7.15803C32.6423 6.20861 31.3577 5.66379 29.227 5.37733ZM35.5618 13.6228L25.3515 23.8331L34.3636 32.8451C34.8546 32.0131 35.1749 30.9463 35.3724 29.4774C35.6637 27.3108 35.6663 24.4637 35.6663 20.5C35.6663 17.7025 35.665 15.4612 35.5618 13.6228ZM32.5961 34.6132L23.5838 25.6008L13.3724 35.8122C15.2108 35.9154 17.4521 35.9167 20.2497 35.9167C24.2134 35.9167 27.0604 35.9141 29.227 35.6228C30.6967 35.4252 31.7639 35.1046 32.5961 34.6132ZM29.5602 2.89962C31.9681 3.22335 33.8681 3.89892 35.3594 5.39027C36.8508 6.88162 37.5264 8.78166 37.8501 11.1895C38.1664 13.542 38.1664 16.5571 38.1663 20.4044V20.5957C38.1664 24.443 38.1664 27.4581 37.8501 29.8105C37.5264 32.2184 36.8508 34.1185 35.3594 35.6098C33.8681 37.1012 31.9681 37.7767 29.5602 38.1005C27.2077 38.4167 24.1926 38.4167 20.3453 38.4167H20.1541C16.3067 38.4167 13.2917 38.4167 10.9392 38.1005C8.53129 37.7767 6.63125 37.1012 5.1399 35.6098C3.64855 34.1185 2.97299 32.2184 2.64925 29.8105C2.33297 27.4581 2.33299 24.443 2.33301 20.5957V20.4044C2.33299 16.5571 2.33297 13.542 2.64925 11.1896C2.97298 8.78166 3.64855 6.88162 5.1399 5.39027C6.63125 3.89892 8.53129 3.22335 10.9392 2.89962C13.2917 2.58334 16.3067 2.58335 20.154 2.58337H20.3453C24.1926 2.58335 27.2077 2.58334 29.5602 2.89962ZM8.16634 15.0954C8.16634 11.3237 11.4238 8.41654 15.2497 8.41654C19.0756 8.41654 22.333 11.3237 22.333 15.0954C22.333 18.4725 20.2567 22.4583 16.8076 23.9323C15.8167 24.3557 14.6827 24.3557 13.6917 23.9323C10.2427 22.4583 8.16634 18.4725 8.16634 15.0954ZM15.2497 10.9165C12.6323 10.9165 10.6663 12.8706 10.6663 15.0954C10.6663 17.6678 12.3136 20.6246 14.6742 21.6334C15.0376 21.7887 15.4618 21.7887 15.8252 21.6334C18.1858 20.6246 19.833 17.6678 19.833 15.0954C19.833 12.8706 17.8671 10.9165 15.2497 10.9165Z" fill={selectedOption === 'route' ? "#1E90FF" : "#1E2023"} />
                            <path d="M16.9163 15.5C16.9163 16.4205 16.1701 17.1667 15.2497 17.1667C14.3292 17.1667 13.583 16.4205 13.583 15.5C13.583 14.5796 14.3292 13.8334 15.2497 13.8334C16.1701 13.8334 16.9163 14.5796 16.9163 15.5Z" fill={selectedOption === 'route' ? "#1E90FF" : "#1E2023"} />
                          </svg>
                        </div>
                        <span><FormattedMessage id="routeOption" /></span>
                      </button>

                      <button
                        className={`route-info-option ${selectedOption === 'info' ? 'selected' : ''}`}
                        onClick={() => setSelectedOption('info')}
                      >
                        <div className="option-icon">
                          <svg width="60" height="60" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M18.9916 2.58337H22.5078C24.7871 2.58334 26.6243 2.58331 28.0693 2.77758C29.5694 2.97927 30.8326 3.41076 31.8358 4.41396C32.3332 4.91141 32.6901 5.47276 32.9481 6.09525C34.5015 6.28984 35.8057 6.71727 36.8358 7.74738C37.839 8.75057 38.2704 10.0137 38.4721 11.5139C38.6664 12.9588 38.6664 14.796 38.6663 17.0753V23.9249C38.6664 26.2042 38.6664 28.0414 38.4721 29.4864C38.2704 30.9866 37.839 32.2497 36.8358 33.2529C35.8056 34.283 34.5014 34.7104 32.948 34.905C32.69 35.5274 32.3332 36.0887 31.8358 36.5861C30.8326 37.5893 29.5694 38.0208 28.0693 38.2225C26.6243 38.4168 24.7871 38.4167 22.5078 38.4167H18.9916C16.7122 38.4167 14.875 38.4168 13.4301 38.2225C11.9299 38.0208 10.6668 37.5893 9.66359 36.5861C9.16619 36.0887 8.80934 35.5274 8.55135 34.905C6.99792 34.7104 5.69372 34.283 4.66359 33.2529C3.6604 32.2497 3.22891 30.9866 3.02721 29.4864C2.83295 28.0414 2.83297 26.2042 2.83301 23.9249V17.0753C2.83297 14.796 2.83295 12.9588 3.02721 11.5139C3.22891 10.0137 3.6604 8.75057 4.66359 7.74738C5.6937 6.71727 6.99788 6.28984 8.55128 6.09524C8.80927 5.47276 9.16615 4.9114 9.66359 4.41396C10.6668 3.41076 11.9299 2.97927 13.4301 2.77758C14.875 2.58331 16.7122 2.58334 18.9916 2.58337ZM7.96373 8.73416C7.23438 8.90993 6.77968 9.16682 6.43136 9.51515C5.97009 9.97642 5.66934 10.624 5.50492 11.847C5.33566 13.1059 5.33301 14.7744 5.33301 17.1668V23.8335C5.33301 26.2258 5.33566 27.8943 5.50492 29.1533C5.66934 30.3762 5.97009 31.0238 6.43136 31.4851C6.77969 31.8334 7.23439 32.0903 7.96375 32.2661C7.83295 30.914 7.83298 29.2559 7.83301 27.2582V13.7419C7.83298 11.7442 7.83295 10.0862 7.96373 8.73416ZM33.5356 32.2661C34.265 32.0903 34.7197 31.8334 35.068 31.4851C35.5293 31.0238 35.83 30.3762 35.9944 29.1533C36.1637 27.8943 36.1663 26.2258 36.1663 23.8335V17.1668C36.1663 14.7744 36.1637 13.1059 35.9944 11.847C35.83 10.624 35.5293 9.97642 35.068 9.51515C34.7197 9.16682 34.265 8.90993 33.5356 8.73416C33.6664 10.0862 33.6664 11.7443 33.6663 13.7419V27.2582C33.6664 29.2559 33.6664 30.914 33.5356 32.2661ZM13.7632 5.25529C12.5403 5.41971 11.8926 5.72045 11.4314 6.18173C10.9701 6.643 10.6693 7.29062 10.5049 8.51358C10.3357 9.77249 10.333 11.441 10.333 13.8334V27.1667C10.333 29.5591 10.3357 31.2276 10.5049 32.4865C10.6693 33.7095 10.9701 34.3571 11.4314 34.8184C11.8926 35.2796 12.5402 35.5804 13.7632 35.7448C15.0221 35.9141 16.6906 35.9167 19.083 35.9167H22.4163C24.8087 35.9167 26.4772 35.9141 27.7361 35.7448C28.9591 35.5804 29.6067 35.2796 30.068 34.8184C30.5293 34.3571 30.83 33.7095 30.9944 32.4865C31.1637 31.2276 31.1663 29.5591 31.1663 27.1667V13.8334C31.1663 11.441 31.1637 9.77249 30.9944 8.51358C30.83 7.29062 30.5293 6.643 30.068 6.18173C29.6067 5.72045 28.9591 5.41971 27.7361 5.25529C26.4772 5.08603 24.8087 5.08338 22.4163 5.08338H19.083C16.6906 5.08338 15.0221 5.08603 13.7632 5.25529ZM14.4997 15.5C14.4997 14.8097 15.0593 14.25 15.7497 14.25H25.7497C26.44 14.25 26.9997 14.8097 26.9997 15.5C26.9997 16.1904 26.44 16.75 25.7497 16.75H15.7497C15.0593 16.75 14.4997 16.1904 14.4997 15.5ZM14.4997 22.1667C14.4997 21.4764 15.0593 20.9167 15.7497 20.9167H25.7497C26.44 20.9167 26.9997 21.4764 26.9997 22.1667C26.9997 22.8571 26.44 23.4167 25.7497 23.4167H15.7497C15.0593 23.4167 14.4997 22.8571 14.4997 22.1667ZM14.4997 28.8334C14.4997 28.143 15.0593 27.5834 15.7497 27.5834H20.7497C21.44 27.5834 21.9997 28.143 21.9997 28.8334C21.9997 29.5237 21.44 30.0834 20.7497 30.0834H15.7497C15.0593 30.0834 14.4997 29.5237 14.4997 28.8334Z" fill={selectedOption === 'info' ? "#1E90FF" : "#1E2023"} />
                          </svg>
                        </div>
                        <span><FormattedMessage id="culturalInfoOption" /></span>
                      </button>
                    </div>

                    <button
                      className="confirm-button"
                      disabled={!selectedOption}
                      onClick={() => {
                        if (selectedOption === 'route') {
                          setDestinationStore({
                            name: selectedPlace.name,
                            coordinates: selectedPlace.coordinates
                          });
                          navigate('/fs');
                        } else if (selectedOption === 'info') {
                          navigate('/culture', { state: { place: selectedPlace } });
                        }
                        setShowRouteInfoModal(false);
                      }}
                    >
                      <FormattedMessage id="confirmContinue" />
                    </button>
                  </div>
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
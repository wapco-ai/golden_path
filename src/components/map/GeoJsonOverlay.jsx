import React, { useEffect, useState } from 'react';
import { Marker, Source, Layer } from 'react-map-gl';
import { useLangStore } from '../../store/langStore';

// Reuse the same color and icon mapping used in MapComponent
const groupColors = {
  sahn: '#4caf50',
  eyvan: '#2196f3',
  ravaq: '#9c27b0',
  masjed: '#ff9800',
  madrese: '#3f51b5',
  khadamat: '#607d8b',
  elmi: '#00bcd4',
  cemetery: '#795548',
  other: '#757575'
};

const functionIcons = {
  door: '🚪',
  connection: '🔗',
  elevator: '🛗',
  escalator: '↕️',
  ramp: '♿',
  stairs: '🪜',
  service: '🚾',
  other: '📍'
};

const getCompositeIcon = (group, nodeFunction, size = 35, opacity = 1) => {
  const color = groupColors[group] || '#999';
  const icon = functionIcons[nodeFunction] || '📌';
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        opacity,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
      }}
    >
      {icon}
    </div>
  );
};

const GeoJsonOverlay = ({ selectedCategory }) => {
  const [features, setFeatures] = useState(null);
  const language = useLangStore((state) => state.language);

  useEffect(() => {
    const file =
      language === 'fa'
        ? '/data14040404.geojson'
        : `/data14040404_${language}.geojson`;
    fetch(file)
      .then(res => res.json())
      .then(data => setFeatures(data.features || []))
      .catch(err => console.error('failed to load geojson', err));
  }, [language]);

  if (!features) return null;

  const pointFeatures = features.filter(f => f.geometry.type === 'Point');
  const polygonFeatures = features.filter(
    f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
  );

  return (
    <>
      {polygonFeatures.length > 0 && (
        <Source
          id="overlay-polygons"
          type="geojson"
          data={{ type: 'FeatureCollection', features: polygonFeatures }}
        >
          <Layer
            id="overlay-lines"
            type="line"
            paint={{ 'line-color': '#333', 'line-width': 2 }}
          />
        </Source>
      )}
      {pointFeatures.map((feature, idx) => {
        const [lng, lat] = feature.geometry.coordinates;
        const { group, nodeFunction } = feature.properties || {};
        const highlight =
          selectedCategory &&
          feature.properties &&
          feature.properties[selectedCategory.property] === selectedCategory.value;
        const hasFilter = !!selectedCategory;
        const iconSize = hasFilter ? (highlight ? 40 : 25) : 35;
        const iconOpacity = hasFilter ? (highlight ? 1 : 0.4) : 1;
        const key = feature.properties?.uniqueId || idx;
        return (
          <Marker key={key} longitude={lng} latitude={lat} anchor="center">
            {getCompositeIcon(group, nodeFunction, iconSize, iconOpacity)}
          </Marker>
        );
      })}
    </>
  );
};

export default GeoJsonOverlay;

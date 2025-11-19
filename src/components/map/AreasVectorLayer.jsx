import React, { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl';

const DEFAULT_TILE_BASE_URL = 'http://localhost:8080';
const VECTOR_SOURCE_LAYER = 'areas';
const SOURCE_ID = 'areas-boundaries-source';
const FILL_LAYER_ID = 'areas-boundaries-fill';
const OUTLINE_LAYER_ID = 'areas-boundaries-outline';

const normalizeBaseUrl = (url) => {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const AreasVectorLayer = ({ floor = 0, minzoom = 14, maxzoom = 22 }) => {
  const tileBaseUrl = normalizeBaseUrl(import.meta.env.VITE_TILE_SERVER_BASE_URL) || DEFAULT_TILE_BASE_URL;

  const tiles = useMemo(() => [
    `${tileBaseUrl}/tiles/public.fn_areas_mvt/{z}/{x}/{y}.pbf?p_floor=${floor}`
  ], [tileBaseUrl, floor]);

  const sourceLayerProp = { 'source-layer': VECTOR_SOURCE_LAYER };

  return (
    <Source id={SOURCE_ID} type="vector" tiles={tiles} minzoom={minzoom} maxzoom={maxzoom}>
      <Layer
        {...sourceLayerProp}
        id={FILL_LAYER_ID}
        type="fill"
        paint={{
          'fill-color': '#0F71EF',
          'fill-opacity': 0.08
        }}
      />
      <Layer
        {...sourceLayerProp}
        id={OUTLINE_LAYER_ID}
        type="line"
        paint={{
          'line-color': '#0F71EF',
          'line-width': 1.2,
          'line-opacity': 0.5
        }}
      />
    </Source>
  );
};

export default AreasVectorLayer;

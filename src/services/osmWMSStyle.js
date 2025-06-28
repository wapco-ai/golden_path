export default {
  version: 8,
  sources: {
    'osm-wms': {
      type: 'raster',
      tiles: [
        'https://ows.terrestris.de/osm/service?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&LAYERS=OSM-WMS&SRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256'
      ],
      tileSize: 256
    }
  },
  layers: [
    {
      id: 'osm-wms',
      type: 'raster',
      source: 'osm-wms'
    }
  ]
};

const esriImageryStyle = {
  version: 8,
  sources: {
    'esri-imagery': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution:
        'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
    },
    'osm-overlay': {
      type: 'raster',
      tiles: [
        'https://ows.terrestris.de/osm/service?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&LAYERS=OSM-WMS&SRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256'
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  },
  layers: [
    {
      id: 'esri-imagery',
      type: 'raster',
      source: 'esri-imagery',
      minzoom: 0,
      maxzoom: 19
    },
    {
      id: 'osm-overlay',
      type: 'raster',
      source: 'osm-overlay',
      minzoom: 0,
      maxzoom: 19,
      paint: {
        'raster-opacity': 1
      }
    }
  ]
};

export default esriImageryStyle;

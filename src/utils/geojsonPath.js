export function buildGeoJsonPath(language = 'fa') {
  const base = import.meta.env.BASE_URL;
  return language === 'fa'
    ? `${base}data/data14040411.geojson`
    : `${base}data/data14040411_${language}.geojson`;
}

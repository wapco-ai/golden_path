export function buildGeoJsonPath(language = 'fa') {
  const base = import.meta.env.BASE_URL;
  return language === 'fa'
    ? `${base}data14040404.geojson`
    : `${base}data14040404_${language}.geojson`;
}

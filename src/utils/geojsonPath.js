export function buildGeoJsonPath(language = 'fa') {
  const base = import.meta.env.BASE_URL || '/';
  const suffix = language && language !== 'fa' ? `_${language}` : '';
  return `${base}data/data14040411${suffix}.geojson`;
}

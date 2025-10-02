export function buildGeoJsonPath(language = 'fa') {
  let baseFromVite;
  try {
    baseFromVite = import.meta.env.BASE_URL;
  } catch (error) {
    baseFromVite = undefined;
  }

  const runtimeOverride =
    typeof globalThis !== 'undefined' ? globalThis.__GEOJSON_BASE_URL__ : undefined;

  const base = baseFromVite ?? runtimeOverride ?? '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const suffix = language && language !== 'fa' ? `_${language}` : '';
  return `${normalizedBase}data/data14040411${suffix}.geojson`;
}

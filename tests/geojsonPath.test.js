import assert from 'assert';
import { buildGeoJsonPath } from '../src/utils/geojsonPath.js';

delete globalThis.__GEOJSON_BASE_URL__;
assert.strictEqual(
  buildGeoJsonPath('fa'),
  '/data/data14040411.geojson',
  'should build default fa path when BASE_URL is absent'
);
assert.strictEqual(
  buildGeoJsonPath('en'),
  '/data/data14040411_en.geojson',
  'should build english path when BASE_URL is absent'
);

globalThis.__GEOJSON_BASE_URL__ = '/custom-base/';
assert.strictEqual(
  buildGeoJsonPath('fa'),
  '/custom-base/data/data14040411.geojson',
  'should prepend custom BASE_URL that already includes trailing slash'
);

globalThis.__GEOJSON_BASE_URL__ = '/custom-base';
assert.strictEqual(
  buildGeoJsonPath('ar'),
  '/custom-base/data/data14040411_ar.geojson',
  'should normalize custom BASE_URL without trailing slash'
);

delete globalThis.__GEOJSON_BASE_URL__;
console.log('geojsonPath tests passed');

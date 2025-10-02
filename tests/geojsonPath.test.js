import assert from 'assert';
import { buildGeoJsonPath } from '../src/utils/geojsonPath.js';

assert.strictEqual(
  buildGeoJsonPath('fa'),
  '/data/data14040411.geojson',
  'should build default fa path'
);
assert.strictEqual(
  buildGeoJsonPath('en'),
  '/data/data14040411_en.geojson',
  'should build english path'
);
assert.strictEqual(
  buildGeoJsonPath('ar'),
  '/data/data14040411_ar.geojson',
  'should build arabic path'
);
console.log('geojsonPath tests passed');

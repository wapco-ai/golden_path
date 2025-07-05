import assert from 'assert';
import fs from 'fs';
import { computeShortestPath, analyzeRoute } from '../src/utils/routeAnalysis.js';

const geo = JSON.parse(fs.readFileSync(new URL('./sample.geojson', import.meta.url)));

const origin = { coordinates: [-0.00005, 0] };
const destination = { coordinates: [0.00025, 0] };

const { path } = computeShortestPath(origin, destination, geo.features);

assert.strictEqual(path[0][0], origin.coordinates[0]);
assert.strictEqual(path[path.length - 1][0], destination.coordinates[0]);
assert.ok(path.length >= 3, 'path should include intermediate nodes');

console.log('computeShortestPath test passed');

// Tests for analyzeRoute service filtering
const origin2 = { coordinates: [0, -0.00005] };
const destination2 = { coordinates: [0, 0.00025] };

const walking = analyzeRoute(origin2, destination2, geo, 'walking', 'family');
const car = analyzeRoute(origin2, destination2, geo, 'electric-car', 'family');
const wheelchair = analyzeRoute(origin2, destination2, geo, 'wheelchair', 'family');

const containsConnection = route =>
  route.alternatives.some(a =>
    a.steps.some(s => s.type === 'stepPassConnection')
  );

assert.strictEqual(
  containsConnection(walking),
  false,
  'walking alternatives should not include connection'
);
assert.ok(
  containsConnection(car),
  'electric-car alternatives should include connection'
);
assert.strictEqual(
  containsConnection(wheelchair),
  false,
  'wheelchair alternatives should not include connection'
);

// Same dataset but using "electricVan" service key
const geoVan = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { nodeFunction: 'door', name: 'A', services: { walking: true, electricVan: true, wheelchair: true } } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [0.0001, 0] }, properties: { nodeFunction: 'connection', name: 'X', services: { walking: false, electricVan: true, wheelchair: false } } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [0.0002, 0] }, properties: { nodeFunction: 'door', name: 'D', services: { walking: true, electricVan: true, wheelchair: true } } }
  ]
};

const carVan = analyzeRoute(origin2, destination2, geoVan, 'electric-car');

assert.ok(
  containsConnection(carVan),
  'electric-car with electricVan key should include connection'
);

// Gender filtering test using sample geojson connection (male only)
const female = analyzeRoute(origin2, destination2, geo, 'walking', 'female');

assert.strictEqual(
  containsConnection(female),
  false,
  'female routes should not include male-only connection'
);

console.log('analyzeRoute service filtering tests passed');

import assert from 'assert';
import fs from 'fs';
import { computeShortestPath } from '../src/utils/routeAnalysis.js';

const geo = JSON.parse(fs.readFileSync(new URL('./sample.geojson', import.meta.url)));

const origin = { coordinates: [-0.5, 0] };
const destination = { coordinates: [2.5, 0] };

const { path } = computeShortestPath(origin, destination, geo.features);

assert.strictEqual(path[0][0], origin.coordinates[0]);
assert.strictEqual(path[path.length - 1][0], destination.coordinates[0]);
assert.ok(path.length >= 3, 'path should include intermediate nodes');

console.log('computeShortestPath test passed');

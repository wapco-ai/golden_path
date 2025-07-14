import assert from 'assert';
import drService from '../src/services/AdvancedDeadReckoningService.js';

// Start the service with an initial reference position
if (!drService.isActive) {
    drService.toggle({ lat: 0, lng: 0 });
}

const initialPosition = { ...drService.currentPosition };
const initialPathLength = drService.path.length;

// Send GPS data with poor accuracy (>20 meters)
drService.processGpsData({ lat: 0.0001, lng: 0.0001 }, 30);

// Position and path should not change
assert.strictEqual(drService.currentPosition.x, initialPosition.x);
assert.strictEqual(drService.currentPosition.y, initialPosition.y);
assert.strictEqual(drService.path.length, initialPathLength);
assert.ok(drService.isActive, 'service should remain active');

// Stop the service to clean up
if (drService.isActive) {
    drService.toggle();
}

console.log('gps accuracy handling test passed');

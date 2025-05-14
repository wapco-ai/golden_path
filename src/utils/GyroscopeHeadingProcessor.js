// Replace the entire GyroscopeHeadingProcessor.js file with this implementation
class GyroscopeHeadingProcessor {
  constructor() {
    this.currentHeading = 0; // in radians, 0 = North
    this.lastTimestamp = null;
    this.isInitialized = false;
    
    // Device orientation - will be set from sensor data
    this.deviceOrientation = 'portrait';
    
    // Calibration and sensitivity settings
    this.coefficients = {
      portrait: {
        alpha: -1.0,  // Reduced sensitivity for stability
        beta: 0.1,
        gamma: 0.1
      },
      landscape: {
        alpha: -0.1,
        beta: -1.0,   // Reduced sensitivity for stability
        gamma: 0.1
      }
    };
    
    this.debugCounter = 0;
  }

  setDeviceOrientation(orientation) {
    this.deviceOrientation = orientation;
    console.log(`Device orientation set to: ${orientation}`);
  }

  processGyroscope(gyroData, timestamp) {
    // Initialize timestamp on first call
    if (!this.isInitialized) {
      this.lastTimestamp = timestamp;
      this.isInitialized = true;
      return 0;
    }

    // Calculate time delta in seconds
    const dt = (timestamp - this.lastTimestamp) / 1000;
    if (dt <= 0 || dt > 1) {
      // Skip invalid time deltas or very large gaps
      this.lastTimestamp = timestamp;
      return 0;
    }

    // Ensure gyroData has all required properties
    if (!gyroData || typeof gyroData.alpha !== 'number' || 
        typeof gyroData.beta !== 'number' || 
        typeof gyroData.gamma !== 'number') {
      console.warn('Invalid gyroscope data', gyroData);
      return 0;
    }

    // Use appropriate coefficients based on device orientation
    const coeff = this.coefficients[this.deviceOrientation];
    
    // Calculate angular velocity components (degrees/s)
    const rotationRateAlpha = gyroData.alpha * coeff.alpha;
    const rotationRateBeta = gyroData.beta * coeff.beta;
    const rotationRateGamma = gyroData.gamma * coeff.gamma;
    
    // Calculate effective angular velocity for heading
    let angularVelocity;
    
    if (this.deviceOrientation === 'portrait') {
      // In portrait mode, alpha represents rotation around vertical axis
      angularVelocity = rotationRateAlpha;
    } else {
      // In landscape, beta becomes the primary rotation axis for heading
      angularVelocity = rotationRateBeta;
    }
    
    // Convert to radians/s and calculate heading change
    const headingChangeRad = (angularVelocity * Math.PI / 180.0) * dt;
    
    // Apply heading change
    this.currentHeading += headingChangeRad;
    
    // Normalize heading to [0, 2π)
    while (this.currentHeading < 0) this.currentHeading += 2 * Math.PI;
    while (this.currentHeading >= 2 * Math.PI) this.currentHeading -= 2 * Math.PI;
    
    // Log heading periodically (every ~20 updates to avoid console flood)
    this.debugCounter++;
    if (this.debugCounter % 20 === 0) {
      console.log(`Heading: ${(this.currentHeading * 180 / Math.PI).toFixed(1)}°, ` +
                  `Angular velocity: ${angularVelocity.toFixed(2)}°/s`);
    }
    
    // Store timestamp for next calculation
    this.lastTimestamp = timestamp;
    
    // Return angular velocity in radians/s for Kalman filter
    return headingChangeRad / dt; // Return instantaneous angular velocity
  }

  getCurrentHeading() {
    return this.currentHeading;
  }

  reset() {
    // Reset heading to North (0 radians)
    this.currentHeading = 0;
    this.lastTimestamp = null;
    this.isInitialized = false;
    console.log('Gyroscope heading processor reset');
  }
}

export default GyroscopeHeadingProcessor;
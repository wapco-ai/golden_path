export function distanceMeters(a, b) {
  const toRad = deg => (deg * Math.PI) / 180;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const R = 6371000; // meters
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function findNearest(coord, features) {
  if (!features || features.length === 0) return null;
  let best = null;
  let min = Infinity;
  features.forEach(f => {
    const [lng, lat] = f.geometry.coordinates;
    const d = distanceMeters(coord, [lat, lng]);
    if (d < min) {
      min = d;
      best = [lat, lng, f.properties];
    }
  });
  return best;
}

export function analyzeRoute(origin, destination, geoData) {
  if (!geoData) {
    return { path: [origin.coordinates, destination.coordinates], steps: [] };
  }
  const doors = geoData.features.filter(
    f => f.geometry.type === 'Point' && f.properties?.nodeFunction === 'door'
  );
  const connections = geoData.features.filter(
    f => f.geometry.type === 'Point' && f.properties?.nodeFunction === 'connection'
  );

  // Determine area of origin from nearest door
  const nearestToOrigin = findNearest(origin.coordinates, doors);
  const originArea = nearestToOrigin?.[2]?.subGroupValue || null;

  // Select exit door from the same area but closest to destination
  let exitDoor = null;
  if (originArea) {
    const areaDoors = doors.filter(
      d => d.properties?.subGroupValue === originArea
    );
    exitDoor = findNearest(destination.coordinates, areaDoors);
  } else {
    exitDoor = nearestToOrigin;
  }

  const endDoor = findNearest(destination.coordinates, doors);

  // Look for entry door in next area within 50 meters of exit
  let entryDoor = null;
  if (exitDoor) {
    const otherDoors = doors.filter(
      d => d.properties?.subGroupValue !== originArea
    );
    const candidate = findNearest(exitDoor, otherDoors);
    if (
      candidate &&
      distanceMeters(exitDoor.slice(0, 2), candidate.slice(0, 2)) <= 50
    ) {
      entryDoor = candidate;
    }
  }

  const startConn = !entryDoor && exitDoor ? findNearest(exitDoor, connections) : null;
  const endConn = endDoor ? findNearest(endDoor, connections) : null;

  const path = [origin.coordinates];
  const steps = [];

  if (exitDoor) {
    path.push(exitDoor.slice(0, 2));
    steps.push({
      coordinates: exitDoor.slice(0, 2),
      type: 'stepMoveToDoor',
      name: exitDoor[2]?.name || ''
    });
  }

  if (entryDoor) {
    path.push(entryDoor.slice(0, 2));
    steps.push({
      coordinates: entryDoor.slice(0, 2),
      type: 'stepEnterNextSahn',
      name: entryDoor[2]?.name || ''
    });
  } else if (startConn) {
    path.push(startConn.slice(0, 2));
    steps.push({
      coordinates: startConn.slice(0, 2),
      type: 'stepPassConnection',
      title: startConn[2]?.subGroup || startConn[2]?.name || ''
    });
  }

  if (endConn && (!startConn || endConn[0] !== startConn[0] || endConn[1] !== startConn[1])) {
    path.push(endConn.slice(0, 2));
    steps.push({
      coordinates: endConn.slice(0, 2),
      type: 'stepPassConnection',
      title: endConn[2]?.subGroup || endConn[2]?.name || ''
    });
  }

  if (endDoor) {
    path.push(endDoor.slice(0, 2));
    steps.push({
      coordinates: endDoor.slice(0, 2),
      type: 'stepPassDoor',
      name: endDoor[2]?.name || ''
    });
  }

  path.push(destination.coordinates);
  steps.push({
    coordinates: destination.coordinates,
    type: 'stepArriveDestination',
    name: destination.name || ''
  });

  const geo = {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: path.map(p => [p[1], p[0]]) }
  };

  return { path, geo, steps };
}

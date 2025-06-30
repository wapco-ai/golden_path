export function findNearest(coord, features) {
  if (!features || features.length === 0) return null;
  let best = null;
  let min = Infinity;
  features.forEach(f => {
    const [lng, lat] = f.geometry.coordinates;
    const d = Math.hypot(lng - coord[1], lat - coord[0]);
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

  const startDoor = findNearest(origin.coordinates, doors);
  const endDoor = findNearest(destination.coordinates, doors);

  const startConn = startDoor ? findNearest(startDoor, connections) : null;
  const endConn = endDoor ? findNearest(endDoor, connections) : null;
  
  const path = [origin.coordinates];
  const steps = [];

  if (startDoor) {
    path.push(startDoor.slice(0, 2));
    steps.push({
      coordinates: startDoor.slice(0, 2),
      type: 'stepMoveToDoor',
      name: startDoor[2]?.name || ''

    });
  }
   if (startConn) {
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
      type: 'stepEnterNextSahn',
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

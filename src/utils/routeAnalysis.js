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
  const startDoor = findNearest(origin.coordinates, doors);
  const endDoor = findNearest(destination.coordinates, doors);

  const path = [origin.coordinates];
  const steps = [];

  if (startDoor) {
    path.push(startDoor.slice(0, 2));
    const name = startDoor[2]?.name ? ` (${startDoor[2].name})` : '';
    steps.push({
      coordinates: startDoor.slice(0, 2),
      instruction: `حرکت به سمت درب${name}`
    });
  }
  if (endDoor) {
    path.push(endDoor.slice(0, 2));
    const name = endDoor[2]?.name ? ` (${endDoor[2].name})` : '';
    steps.push({
      coordinates: endDoor.slice(0, 2),
      instruction: `عبور از درب${name}`
    });
  }
  path.push(destination.coordinates);
  const destName = destination.name ? ` (${destination.name})` : '';
  steps.push({
    coordinates: destination.coordinates,
    instruction: `رسیدن به مقصد${destName}`
  });

  const geo = {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: path.map(p => [p[1], p[0]]) }
  };

  return { path, geo, steps };
}

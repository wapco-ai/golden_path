export function findNearest(coord, features) {
  if (!features || features.length === 0) return null;
  let best = null;
  let min = Infinity;
  features.forEach(f => {
    const [lng, lat] = f.geometry.coordinates;
    const d = Math.hypot(lng - coord[1], lat - coord[0]);
    if (d < min) {
      min = d;
      best = [lat, lng, f.properties, d];
    }
  });
  return best;
}

function findNearestList(coord, features, count = 2) {
  if (!features || features.length === 0) return [];
  return features
    .map(f => {
      const [lng, lat] = f.geometry.coordinates;
      const d = Math.hypot(lng - coord[1], lat - coord[0]);
      return { lat, lng, props: f.properties, distance: d };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map(r => [r.lat, r.lng, r.props, r.distance]);
}

function pointInPolygon(point, polygons) {
  const x = point[1];
  const y = point[0];
  const polyList = Array.isArray(polygons[0][0]) && typeof polygons[0][0][0] === 'number' ? [polygons] : polygons;
  for (const poly of polyList) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0];
      const yi = poly[i][1];
      const xj = poly[j][0];
      const yj = poly[j][1];
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
}

function angleBetween(p1, p2, p3) {
  const a1 = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
  const a2 = Math.atan2(p3[0] - p2[0], p3[1] - p2[1]);
  let deg = ((a2 - a1) * 180) / Math.PI;
  if (deg > 180) deg -= 360;
  if (deg < -180) deg += 360;
  return Math.round(deg);
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
  const sahnPolygons = geoData.features.filter(
    f => f.geometry.type === 'Polygon' && f.properties?.subGroupValue?.startsWith('sahn-')
  );

  const DOOR_THRESHOLD = 0.0008; // ~80m
  const DOOR_CONN_THRESHOLD = 0.0004; // ~40m to ensure adjacency

  function isPointInSahn(coord) {
    return sahnPolygons.some(p => pointInPolygon(coord, p.geometry.coordinates));
  }

  function pickAccess(coord) {
    const nearestDoor = findNearest(coord, doors);
    if (nearestDoor && (nearestDoor[3] < DOOR_THRESHOLD || isPointInSahn(coord))) {
      const conn = findNearest(nearestDoor, connections);
      if (
        conn &&
        conn[3] < DOOR_CONN_THRESHOLD &&
        (conn[2]?.subGroupValue === 'saایر' || conn[2]?.subGroupValue === nearestDoor[2]?.subGroupValue)
      ) {
        return { door: nearestDoor, conn };
      }
    }
    const conn = findNearest(coord, connections);
    return { door: null, conn };
  }

  const startAccess = pickAccess(origin.coordinates);
  const endAccess = pickAccess(destination.coordinates);

  const startDoor = startAccess.door;
  const endDoor = endAccess.door;
  const startConn = startAccess.conn;
  const endConn = endAccess.conn;

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

  // compute approximate turn angles
  for (let i = 1; i < path.length - 1; i++) {
    const angle = angleBetween(path[i - 1], path[i], path[i + 1]);
    if (steps[i - 1]) {
      steps[i - 1].turnAngle = angle;
    }
  }

  const geo = {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: path.map(p => [p[1], p[0]]) }
  };

  const alternatives = [];
  const altStartDoor = findNearestList(origin.coordinates, doors, 2)[1];
  const altEndDoor = findNearestList(destination.coordinates, doors, 2)[1];

  if (altStartDoor || altEndDoor) {
    const startConnCandidate = altStartDoor ? findNearest(altStartDoor, connections) : null;
    const altStartConn =
      startConnCandidate &&
      startConnCandidate[3] < DOOR_CONN_THRESHOLD &&
      (startConnCandidate[2]?.subGroupValue === 'saایر' ||
        startConnCandidate[2]?.subGroupValue === altStartDoor[2]?.subGroupValue)
        ? startConnCandidate
        : findNearest(origin.coordinates, connections);
    const endConnCandidate = altEndDoor ? findNearest(altEndDoor, connections) : null;
    const altEndConn =
      endConnCandidate &&
      endConnCandidate[3] < DOOR_CONN_THRESHOLD &&
      (endConnCandidate[2]?.subGroupValue === 'saایر' ||
        endConnCandidate[2]?.subGroupValue === altEndDoor[2]?.subGroupValue)
        ? endConnCandidate
        : findNearest(destination.coordinates, connections);
    const altPath = [origin.coordinates];
    const altSteps = [];
    if (altStartDoor) {
      altPath.push(altStartDoor.slice(0, 2));
      altSteps.push({ coordinates: altStartDoor.slice(0, 2), type: 'stepMoveToDoor', name: altStartDoor[2]?.name || '' });
    }
    if (altStartConn) {
      altPath.push(altStartConn.slice(0, 2));
      altSteps.push({ coordinates: altStartConn.slice(0, 2), type: 'stepPassConnection', title: altStartConn[2]?.subGroup || altStartConn[2]?.name || '' });
    }
    if (altEndConn && (!altStartConn || altEndConn[0] !== altStartConn[0] || altEndConn[1] !== altStartConn[1])) {
      altPath.push(altEndConn.slice(0, 2));
      altSteps.push({ coordinates: altEndConn.slice(0, 2), type: 'stepEnterNextSahn', title: altEndConn[2]?.subGroup || altEndConn[2]?.name || '' });
    }
    if (altEndDoor) {
      altPath.push(altEndDoor.slice(0, 2));
      altSteps.push({ coordinates: altEndDoor.slice(0, 2), type: 'stepPassDoor', name: altEndDoor[2]?.name || '' });
    }
    altPath.push(destination.coordinates);
    altSteps.push({ coordinates: destination.coordinates, type: 'stepArriveDestination', name: destination.name || '' });
    for (let i = 1; i < altPath.length - 1; i++) {
      const angle = angleBetween(altPath[i - 1], altPath[i], altPath[i + 1]);
      if (altSteps[i - 1]) altSteps[i - 1].turnAngle = angle;
    }
    const altGeo = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: altPath.map(p => [p[1], p[0]]) }
    };
    const via = altSteps
      .slice(1, -1)
      .map(s => s.title || s.name)
      .filter(Boolean);
    alternatives.push({
      path: altPath,
      geo: altGeo,
      steps: altSteps,
      from: origin.name,
      to: destination.name,
      via
    });

  }

  return { path, geo, steps, alternatives };
}

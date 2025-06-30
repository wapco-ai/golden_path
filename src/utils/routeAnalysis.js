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

function findNearestByArea(coord, features, area) {
  const filtered = features.filter(
    f => (area === 'saایر' && f.properties?.subGroupValue === 'saایر') ||
         f.properties?.subGroupValue === area
  );
  return findNearest(coord, filtered);
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

function getArea(coord, sahns) {
  const match = sahns.find(p => pointInPolygon(coord, p.geometry.coordinates));
  return match ? match.properties?.subGroupValue : 'saایر';
}

function angleBetween(p1, p2, p3) {
  const a1 = Math.atan2(p2[0] - p1[0], p2[1] - p1[1]);
  const a2 = Math.atan2(p3[0] - p2[0], p3[1] - p2[1]);
  let deg = ((a2 - a1) * 180) / Math.PI;
  if (deg > 180) deg -= 360;
  if (deg < -180) deg += 360;
  return Math.round(deg);
}

function segmentsIntersect(a, b, c, d) {
  const cross = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  if (cross(a, b, c) * cross(a, b, d) > 0) return false;
  if (cross(c, d, a) * cross(c, d, b) > 0) return false;
  return true;
}

function lineIntersectsPolygon(p1, p2, polygons) {
  const rings = Array.isArray(polygons[0][0]) && typeof polygons[0][0][0] === 'number' ? [polygons] : polygons;
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i++) {
      const p3 = ring[i - 1];
      const p4 = ring[i];
      if (segmentsIntersect([p1[1], p1[0]], [p2[1], p2[0]], p3, p4)) return true;
    }
  }
  const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
  return pointInPolygon(mid, polygons);
}

function unobstructed(p1, p2, sahns) {
  for (const p of sahns) {
    const poly = p.geometry.coordinates;
    const insideBoth =
      pointInPolygon(p1, poly) && pointInPolygon(p2, poly);
    if (lineIntersectsPolygon(p1, p2, poly) && !insideBoth) return false;
  }
  return true;
}

function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function runDijkstra(graph, start, end) {
  const dist = {};
  const prev = {};
  const q = new Set(Object.keys(graph));
  for (const v of q) dist[v] = Infinity;
  dist[start] = 0;
  while (q.size) {
    let u = null;
    for (const v of q) {
      if (u === null || dist[v] < dist[u]) u = v;
    }
    if (u === end || dist[u] === Infinity) break;
    q.delete(u);
    for (const [v, w] of Object.entries(graph[u])) {
      const alt = dist[u] + w;
      if (alt < (dist[v] ?? Infinity)) {
        dist[v] = alt;
        prev[v] = u;
      }
    }
  }
  const path = [];
  let u = end;
  if (!(u in prev) && u !== start) return [];
  while (u) {
    path.unshift(u);
    if (u === start) break;
    u = prev[u];
  }
  return path;
}

export function computeShortestPath(origin, destination, features) {
  const nodes = features.filter(
    f =>
      f.geometry.type === 'Point' &&
      (f.properties?.nodeFunction === 'door' || f.properties?.nodeFunction === 'connection')
  );
  const sahns = features.filter(
    f => f.geometry.type === 'Polygon' && f.properties?.subGroupValue?.startsWith('sahn-')
  );

  const nodeData = nodes.map((n, i) => {
    const [lng, lat] = n.geometry.coordinates;
    return { id: `n${i}`, coord: [lat, lng], props: n.properties };
  });

  const idMap = {};
  nodeData.forEach(n => {
    idMap[n.id] = n;
  });

  const graph = {};
  nodeData.forEach(n => {
    graph[n.id] = {};
  });

  for (let i = 0; i < nodeData.length; i++) {
    for (let j = i + 1; j < nodeData.length; j++) {
      const a = nodeData[i];
      const b = nodeData[j];
      if (unobstructed(a.coord, b.coord, sahns)) {
        const d = distance(a.coord, b.coord);
        graph[a.id][b.id] = d;
        graph[b.id][a.id] = d;
      }
    }
  }

  const start = { id: 'start', coord: origin.coordinates, props: {} };
  const end = { id: 'end', coord: destination.coordinates, props: {} };
  idMap[start.id] = start;
  idMap[end.id] = end;
  graph[start.id] = {};
  graph[end.id] = {};

  function linkPoint(p) {
    let best = null;
    let min = Infinity;
    for (const n of nodeData) {
      if (unobstructed(p.coord, n.coord, sahns)) {
        const d = distance(p.coord, n.coord);
        if (d < min) {
          min = d;
          best = n;
        }
      }
    }
    if (best) {
      graph[p.id][best.id] = min;
      graph[best.id][p.id] = min;
    }
  }

  linkPoint(start);
  linkPoint(end);

  const pathIds = runDijkstra(graph, start.id, end.id);
  const coords = pathIds.map(id => idMap[id].coord);
  const nodesInPath = pathIds.map(id => idMap[id]);

  return { path: coords, nodes: nodesInPath };
}

export function analyzeRoute(origin, destination, geoData) {
  if (!geoData) {
    return { path: [origin.coordinates, destination.coordinates], steps: [] };
  }

  const { path, nodes } = computeShortestPath(origin, destination, geoData.features);

  const steps = [];
  for (let i = 1; i < nodes.length - 1; i++) {
    const n = nodes[i];
    if (n.props?.nodeFunction === 'door') {
      steps.push({
        coordinates: n.coord,
        type: i === 1 ? 'stepMoveToDoor' : 'stepPassDoor',
        name: n.props?.name || ''
      });
    } else if (n.props?.nodeFunction === 'connection') {
      steps.push({
        coordinates: n.coord,
        type: 'stepPassConnection',
        title: n.props?.subGroup || n.props?.name || ''
      });
    }
  }

  steps.push({
    coordinates: destination.coordinates,
    type: 'stepArriveDestination',
    name: destination.name || ''
  });

  for (let i = 1; i < path.length - 1; i++) {
    const angle = angleBetween(path[i - 1], path[i], path[i + 1]);
    if (steps[i - 1]) steps[i - 1].turnAngle = angle;
  }

  const geo = {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: path.map(p => [p[1], p[0]]) }
  };

  return { path, geo, steps, alternatives: [] };
}

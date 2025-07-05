import { debugLog } from './debug.js';


function booleanPointInPolygon(point, polygon) {
  const x = point[0];
  const y = point[1];
  const coords = polygon.geometry?.coordinates[0] || polygon.coordinates[0];
  let inside = false;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i][0];
    const yi = coords[i][1];
    const xj = coords[j][0];
    const yj = coords[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointsWithinPolygon(pointsFC, polygon) {
  const features = pointsFC.features.filter(pt =>
    booleanPointInPolygon(pt.geometry.coordinates, polygon)
  );
  return { type: 'FeatureCollection', features };
}

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
      return { lat, lng, props: f.properties, distance: d, feature: f };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count)
    .map(r => [r.lat, r.lng, r.props, r.distance]);
}

function findNearestByArea(coord, features, area) {
  const filtered = features.filter(f => f.properties?.subGroupValue === area);
  return findNearest(coord, filtered);
}

// استفاده از turf.js برای تشخیص دقیق نقطه در polygon
function pointInPolygon(point, polygon) {
  try {
    return booleanPointInPolygon(point, polygon);
  } catch (error) {
    console.warn('Error in pointInPolygon:', error);
    return false;
  }
}

function getArea(coord, sahns) {
  const point = [coord[1], coord[0]]; // Convert to [lng, lat]
  const match = sahns.find(p => pointInPolygon(point, p));
  return match ? match.properties?.subGroupValue : null;
}

// Get the polygon object that contains a coordinate
function getPolygonContaining(coord, polygons) {
  const point = [coord[1], coord[0]]; // Convert to [lng, lat]
  return polygons.find(p => pointInPolygon(point, p));
}

// Check if polygons are adjacent (share a border)
function arePolygonsAdjacent(poly1, poly2) {
  if (!poly1 || !poly2) return false;
  if (poly1 === poly2) return false;
  
  const coords1 = poly1.geometry.coordinates[0];
  const coords2 = poly2.geometry.coordinates[0];
  
  // Check if any edge from poly1 is very close to any edge from poly2
  for (let i = 0; i < coords1.length - 1; i++) {
    for (let j = 0; j < coords2.length - 1; j++) {
      const dist = Math.min(
        Math.hypot(coords1[i][0] - coords2[j][0], coords1[i][1] - coords2[j][1]),
        Math.hypot(coords1[i+1][0] - coords2[j][0], coords1[i+1][1] - coords2[j][1]),
        Math.hypot(coords1[i][0] - coords2[j+1][0], coords1[i][1] - coords2[j+1][1]),
        Math.hypot(coords1[i+1][0] - coords2[j+1][0], coords1[i+1][1] - coords2[j+1][1])
      );
      if (dist < 0.00001) return true; // Very close = adjacent
    }
  }
  return false;
}

// Find nodes in a specific polygon using turf.js
function getNodesInPolygon(nodes, polygon) {
  if (!polygon) return [];
  
  try {
    // Create points FeatureCollection from nodes
    const pointsFC = {
      type: 'FeatureCollection',
      features: nodes.map((node, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [node[1], node[0]] // [lng, lat]
        },
        properties: { index }
      }))
    };
    
    // Use turf pointsWithinPolygon
    const within = pointsWithinPolygon(pointsFC, polygon);
    
    // Return indices of nodes within polygon
    return within.features.map(f => f.properties.index);
    
  } catch (error) {
    console.warn('Error in getNodesInPolygon:', error);
    return [];
  }
}

// Find connection nodes between two polygons
function findConnectionNodesBetweenPolygons(nodes, poly1, poly2) {
  const connectionNodes = [];
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodeType = node[2]?.nodeFunction;
    
    if (nodeType === 'connection') {
      const nodeCoord = [node[0], node[1]]; // [lat, lng]
      const nodePolygon = getPolygonContaining(nodeCoord, [poly1, poly2]);
      
      // If connection is in either polygon or between them
      if (nodePolygon === poly1 || nodePolygon === poly2) {
        // Check distance to both polygons
        const nodes1 = getNodesInPolygon(nodes, poly1);
        const nodes2 = getNodesInPolygon(nodes, poly2);
        
        if (nodes1.length > 0 && nodes2.length > 0) {
          connectionNodes.push({
            index: i,
            node: node,
            polygon: nodePolygon
          });
        }
      }
    }
  }
  
  return connectionNodes;
}

// Find closest door pairs between two polygons
function findClosestDoorsBetweenPolygons(nodes, poly1, poly2) {
  const nodes1 = getNodesInPolygon(nodes, poly1);
  const nodes2 = getNodesInPolygon(nodes, poly2);
  
  if (nodes1.length === 0 || nodes2.length === 0) return [];
  
  const doorPairs = [];
  for (const n1 of nodes1) {
    for (const n2 of nodes2) {
      const distance = Math.hypot(
        nodes[n1][0] - nodes[n2][0], 
        nodes[n1][1] - nodes[n2][1]
      );
      doorPairs.push({ from: n1, to: n2, distance });
    }
  }
  
  // Return closest pairs (up to 2)
  return doorPairs.sort((a, b) => a.distance - b.distance).slice(0, 2);
}

// Helper function to check if a line segment intersects with another
function segmentsIntersect(p1, p2, p3, p4) {
  function orientation(p, q, r) {
    const val = (q[0] - p[0]) * (r[1] - q[1]) - (q[1] - p[1]) * (r[0] - q[0]);
    if (Math.abs(val) < 1e-10) return 0;
    return (val > 0) ? 1 : 2;
  }

  function onSegment(p, q, r) {
    return (q[1] <= Math.max(p[1], r[1]) && q[1] >= Math.min(p[1], r[1]) &&
            q[0] <= Math.max(p[0], r[0]) && q[0] >= Math.min(p[0], r[0]));
  }

  const o1 = orientation(p1, p2, p3);
  const o2 = orientation(p1, p2, p4);
  const o3 = orientation(p3, p4, p1);
  const o4 = orientation(p3, p4, p2);

  if (o1 !== o2 && o3 !== o4) return true;

  if (o1 === 0 && onSegment(p1, p3, p2)) return true;
  if (o2 === 0 && onSegment(p1, p4, p2)) return true;
  if (o3 === 0 && onSegment(p3, p1, p4)) return true;
  if (o4 === 0 && onSegment(p3, p2, p4)) return true;

  return false;
}

// Check if a direct line crosses any polygon WITHOUT nodes
function crossesEmptyPolygons(coord1, coord2, polygons, nodes) {
  const p1 = [coord1[1], coord1[0]]; // Convert to [lng, lat]
  const p2 = [coord2[1], coord2[0]];

  for (const polygon of polygons) {
    // Check if this polygon has any nodes
    const nodesInPoly = getNodesInPolygon(nodes, polygon);
    if (nodesInPoly.length > 0) continue; // Has nodes, OK to cross
    
    const vertices = polygon.geometry.coordinates[0];
    
    // Check if line intersects this empty polygon
    for (let i = 0; i < vertices.length - 1; i++) {
      const p3 = vertices[i];
      const p4 = vertices[i + 1];
      if (segmentsIntersect(p1, p2, p3, p4)) {
        debugLog(`Line blocked by empty polygon: ${polygon.properties?.subGroupValue}`);
        return true;
      }
    }
  }
  return false;
}

// Check if a direct line between two coordinates is obstructed by polygon walls
function isLineObstructed(coord1, coord2, polygons) {
  const p1 = [coord1[1], coord1[0]]; // Convert to [lng, lat]
  const p2 = [coord2[1], coord2[0]];

  for (const polygon of polygons) {
    const vertices = polygon.geometry.coordinates[0];
    
    // Check if both points are inside the same polygon (allowed)
    const point1 = [coord1[1], coord1[0]]; // [lng, lat]
    const point2 = [coord2[1], coord2[0]]; // [lng, lat]
    const p1Inside = pointInPolygon(point1, polygon);
    const p2Inside = pointInPolygon(point2, polygon);
    
    if (p1Inside && p2Inside) continue; // Both inside same polygon = OK
    
    // Check for edge intersections
    for (let i = 0; i < vertices.length - 1; i++) {
      const p3 = vertices[i];
      const p4 = vertices[i + 1];
      if (segmentsIntersect(p1, p2, p3, p4)) {
        return true;
      }
    }
  }
  return false;
}

// Enhanced connection logic with PRIORITY for connection nodes
function findValidNeighbors(nodeIndex, nodes, sahnPolygons) {
  const currentNode = nodes[nodeIndex];
  const currentCoord = [currentNode[0], currentNode[1]]; // [lat, lng]
  const currentPolygon = getPolygonContaining(currentCoord, sahnPolygons);
  const currentType = currentNode[2]?.nodeFunction;
  const neighbors = [];
  
  // 80 meters ≈ 0.0008 degrees
  const MAX_CROSS_POLYGON_DISTANCE = 0.0004;

  for (let i = 0; i < nodes.length; i++) {
    if (i === nodeIndex) continue;

    const otherNode = nodes[i];
    const otherCoord = [otherNode[0], otherNode[1]];
    const otherPolygon = getPolygonContaining(otherCoord, sahnPolygons);
    const otherType = otherNode[2]?.nodeFunction;
    const distance = Math.hypot(currentCoord[0] - otherCoord[0], currentCoord[1] - otherCoord[1]);
    
    let isValid = false;
    let connectionReason = '';
    let weight = distance;

    // PRIORITY RULE 1: Connection nodes get highest priority
    if (currentType === 'connection' || otherType === 'connection') {
      if (distance <= MAX_CROSS_POLYGON_DISTANCE ) { // Larger range for connections
        isValid = true;
        connectionReason = 'connection-priority';
        weight = distance * 1; // Strong preference for connections
      }
    }
    // PRIORITY RULE 2: Both nodes are inside the SAME polygon
    else if (currentPolygon && otherPolygon && currentPolygon === otherPolygon) {
      isValid = true;
      connectionReason = 'same-polygon';
      weight = distance;
    }
    // RULE 3: Cross-polygon connections through connection nodes
    else if (distance <= MAX_CROSS_POLYGON_DISTANCE) {
      // Check if line crosses any empty polygons (forbidden)
      if (crossesEmptyPolygons(currentCoord, otherCoord, sahnPolygons, nodes)) {
        isValid = false;
        connectionReason = 'blocked-by-empty-polygon';
      }
      // If different polygons, prefer connection nodes as intermediate
      else if (currentPolygon && otherPolygon && currentPolygon !== otherPolygon) {
        // Look for connection nodes between these polygons
        const connectionNodes = findConnectionNodesBetweenPolygons(nodes, currentPolygon, otherPolygon);
        
        if (connectionNodes.length > 0) {
          // If there are connection nodes available, penalize direct cross-polygon connections
          isValid = true;
          connectionReason = 'cross-polygon-penalized';
          weight = distance * 2.0; // Heavy penalty to discourage direct crossing
        } else {
          // No connection nodes available, allow direct connection
          isValid = true;
          connectionReason = 'cross-polygon-80m';
          weight = distance * 1.2;
        }
      }
      // If polygons are adjacent, prefer closest door pairs
      else if (currentPolygon && otherPolygon && arePolygonsAdjacent(currentPolygon, otherPolygon)) {
        const closestPairs = findClosestDoorsBetweenPolygons(nodes, currentPolygon, otherPolygon);
        const isPreferredPair = closestPairs.some(pair => 
          (pair.from === nodeIndex && pair.to === i) || 
          (pair.from === i && pair.to === nodeIndex)
        );
        
        if (isPreferredPair) {
          isValid = true;
          connectionReason = 'closest-door-between-polygons';
          weight = distance * 0.8; // Slight preference for closest doors
        } else {
          isValid = true;
          connectionReason = 'cross-polygon-80m';
          weight = distance * 1.2;
        }
      }
      else {
        // Regular cross-polygon connection or outside polygons
        isValid = true;
        connectionReason = 'cross-polygon-80m';
        weight = distance;
      }
    }
    // RULE 4: Check if direct line is not obstructed (backup rule)
    else if (!isLineObstructed(currentCoord, otherCoord, sahnPolygons) && 
             !crossesEmptyPolygons(currentCoord, otherCoord, sahnPolygons, nodes)) {
      // Long distance but unobstructed - only within same polygon
      if (currentPolygon && otherPolygon && currentPolygon === otherPolygon) {
        isValid = true;
        connectionReason = 'unobstructed-same-polygon';
        weight = distance;
      }
    }

    if (isValid) {
      neighbors.push({
        index: i,
        weight: weight,
        reason: connectionReason
      });
    }
  }

  return neighbors;
}

// Dijkstra's algorithm for finding shortest path
function dijkstraShortestPath(nodes, startNodeIndex, endNodeIndex, sahnPolygons) {
  debugLog(`Starting Enhanced Dijkstra with Connection Priority from node ${startNodeIndex} to ${endNodeIndex}`);
  debugLog(`Start node: [${nodes[startNodeIndex][0]}, ${nodes[startNodeIndex][1]}] - ${nodes[startNodeIndex][2]?.name || nodes[startNodeIndex][2]?.nodeFunction}`);
  debugLog(`End node: [${nodes[endNodeIndex][0]}, ${nodes[endNodeIndex][1]}] - ${nodes[endNodeIndex][2]?.name || nodes[endNodeIndex][2]?.nodeFunction}`);
  
  // Debug: Check start node connections
  const startCoord = [nodes[startNodeIndex][0], nodes[startNodeIndex][1]];
  const startPolygon = getPolygonContaining(startCoord, sahnPolygons);
  const startArea = startPolygon ? startPolygon.properties?.subGroupValue : 'outside';
  const startType = nodes[startNodeIndex][2]?.nodeFunction;
  debugLog(`Start node: area=${startArea}, type=${startType}`);
  
  const startNeighbors = findValidNeighbors(startNodeIndex, nodes, sahnPolygons);
  debugLog(`Start node has ${startNeighbors.length} neighbors with connection priority:`);
  
  // Sort neighbors by priority (connection nodes first)
  const sortedNeighbors = startNeighbors.sort((a, b) => {
    const aIsConnection = nodes[a.index][2]?.nodeFunction === 'connection';
    const bIsConnection = nodes[b.index][2]?.nodeFunction === 'connection';
    
    if (aIsConnection && !bIsConnection) return -1;
    if (!aIsConnection && bIsConnection) return 1;
    return a.weight - b.weight;
  });
  
  sortedNeighbors.slice(0, 10).forEach(n => {
    const neighborCoord = [nodes[n.index][0], nodes[n.index][1]];
    const neighborPolygon = getPolygonContaining(neighborCoord, sahnPolygons);
    const neighborArea = neighborPolygon ? neighborPolygon.properties?.subGroupValue : 'outside';
    const neighborType = nodes[n.index][2]?.nodeFunction;
    debugLog(`  -> Node ${n.index} (${nodes[n.index][2]?.name || 'unnamed'}) area=${neighborArea}, type=${neighborType}, weight=${n.weight.toFixed(6)}, reason=${n.reason}`);
  });
  
  // Continue with standard Dijkstra
  const distances = {};
  const previous = {};
  const unvisited = new Set();

  // Initialize
  nodes.forEach((_, index) => {
    distances[index] = Infinity;
    previous[index] = null;
    unvisited.add(index);
  });
  distances[startNodeIndex] = 0;

  let iterations = 0;
  const maxIterations = nodes.length * 2;

  while (unvisited.size > 0 && iterations < maxIterations) {
    iterations++;
    
    // Find unvisited node with minimum distance
    let currentIndex = null;
    let minDist = Infinity;
    for (const index of unvisited) {
      if (distances[index] < minDist) {
        minDist = distances[index];
        currentIndex = index;
      }
    }

    if (currentIndex === null || minDist === Infinity) {
      debugLog(`Dijkstra stopped: no more reachable nodes (iteration ${iterations})`);
      break;
    }

    if (currentIndex === endNodeIndex) {
      debugLog(`Dijkstra reached destination in ${iterations} iterations`);
      break;
    }

    unvisited.delete(currentIndex);

    const neighbors = findValidNeighbors(currentIndex, nodes, sahnPolygons);

    for (const neighbor of neighbors) {
      if (!unvisited.has(neighbor.index)) continue;
      
      const alt = distances[currentIndex] + neighbor.weight;
      if (alt < distances[neighbor.index]) {
        distances[neighbor.index] = alt;
        previous[neighbor.index] = currentIndex;
        
        if (neighbor.index === endNodeIndex) {
          debugLog(`Found path to destination! Distance: ${alt}, via ${neighbor.reason}`);
        }
      }
    }
  }

  debugLog(`Final distance to destination: ${distances[endNodeIndex]}`);

  // Reconstruct path
  const path = [];
  let currentIndex = endNodeIndex;
  
  if (distances[endNodeIndex] === Infinity) {
    debugLog('Destination is not reachable from start node');
    return [];
  }
  
  while (currentIndex !== null) {
    path.unshift(nodes[currentIndex]);
    currentIndex = previous[currentIndex];
  }

  debugLog(`Enhanced Dijkstra found path with ${path.length} nodes`);
  
  // Log path details
  debugLog('Path details:');
  path.forEach((node, index) => {
    const nodeType = node[2]?.nodeFunction;
    const nodeName = node[2]?.name || 'unnamed';
    debugLog(`  ${index}: ${nodeName} (${nodeType})`);
  });
  
  return path.length > 0 && path[0] === nodes[startNodeIndex] ? path : [];
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
  debugLog('analyzeRoute called with Connection Priority Logic');
  
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
  
  debugLog(`Found ${doors.length} doors, ${connections.length} connections, ${sahnPolygons.length} sahns`);

  // Create a unified list of all navigation nodes
  const allNodes = [];
  
  // Add all doors
  doors.forEach(door => {
    const [lng, lat] = door.geometry.coordinates;
    allNodes.push([lat, lng, door.properties, 0, door]);
  });
  
  // Add all connections
  connections.forEach(conn => {
    const [lng, lat] = conn.geometry.coordinates;
    allNodes.push([lat, lng, conn.properties, 0, conn]);
  });
  
  debugLog(`Total nodes available: ${allNodes.length}`);

  // Analyze polygons and their nodes using turf.js
  debugLog('Polygon analysis with turf.js:');
  const emptyPolygons = [];
  sahnPolygons.forEach(poly => {
    const nodesInPoly = getNodesInPolygon(allNodes, poly);
    debugLog(`  ${poly.properties?.subGroupValue}: ${nodesInPoly.length} nodes`);
    if (nodesInPoly.length === 0) {
      emptyPolygons.push(poly);
    }
  });
  
  debugLog(`Found ${emptyPolygons.length} empty polygons:`);
  emptyPolygons.forEach(poly => {
    debugLog(`  - ${poly.properties?.subGroupValue}`);
  });

  // Find unobstructed entry points
  function findUnobstructedEntry(coord, nth = 0) {
    const validNodes = [];
    
    for (let i = 0; i < allNodes.length; i++) {
      const node = allNodes[i];
      const nodeCoord = [node[0], node[1]];
      
      if (!isLineObstructed(coord, nodeCoord, sahnPolygons) &&
          !crossesEmptyPolygons(coord, nodeCoord, sahnPolygons, allNodes)) {
        const distance = Math.hypot(coord[0] - nodeCoord[0], coord[1] - nodeCoord[1]);
        validNodes.push({
          index: i,
          node: node,
          distance: distance
        });
      }
    }
    
    validNodes.sort((a, b) => a.distance - b.distance);
    debugLog(`Found ${validNodes.length} unobstructed nodes from [${coord[0]}, ${coord[1]}]`);
    
    return validNodes[nth] || null;
  }

  // Find entry and exit points
  const startEntry = findUnobstructedEntry(origin.coordinates, 0);
  const endEntry = findUnobstructedEntry(destination.coordinates, 0);
  
  debugLog('Start entry:', startEntry ? `Node ${startEntry.index}` : 'None');
  debugLog('End entry:', endEntry ? `Node ${endEntry.index}` : 'None');

  if (!startEntry || !endEntry) {
    debugLog('Could not find valid entry/exit points, returning direct path');
    const geo = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [origin.coordinates, destination.coordinates].map(p => [p[1], p[0]]) }
    };
    return { 
      path: [origin.coordinates, destination.coordinates], 
      steps: [{ coordinates: destination.coordinates, type: 'stepArriveDestination', name: destination.name || '' }],
      geo,
      alternatives: []
    };
  }

  // Use connection-priority Dijkstra to find the shortest path between entry points
  const nodePath = dijkstraShortestPath(allNodes, startEntry.index, endEntry.index, sahnPolygons);
  
  if (nodePath.length === 0 || nodePath.length === 1) {
    debugLog('No valid path found between entry points, returning direct path');
    const geo = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [origin.coordinates, destination.coordinates].map(p => [p[1], p[0]]) }
    };
    return { 
      path: [origin.coordinates, destination.coordinates], 
      steps: [{ coordinates: destination.coordinates, type: 'stepArriveDestination', name: destination.name || '' }],
      geo,
      alternatives: []
    };
  }

  function buildRoute(nodeList) {
    const rPath = [origin.coordinates];
    const rSteps = [];

    nodeList.forEach(node => {
      const coord = [node[0], node[1]];
      rPath.push(coord);

      if (node[2].nodeFunction === 'door') {
        rSteps.push({
          coordinates: coord,
          type: 'stepPassDoor',
          name: node[2].name || ''
        });
      } else if (node[2].nodeFunction === 'connection') {
        rSteps.push({
          coordinates: coord,
          type: 'stepPassConnection',
          title: node[2].subGroup || node[2].name || ''
        });
      }
    });

    rPath.push(destination.coordinates);
    rSteps.push({
      coordinates: destination.coordinates,
      type: 'stepArriveDestination',
      name: destination.name || ''
    });

    const rGeo = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: rPath.map(p => [p[1], p[0]]) }
    };

    const dist = rPath.reduce((acc, cur, idx) => {
      if (idx === 0) return acc;
      const prev = rPath[idx - 1];
      return acc + Math.hypot(cur[0] - prev[0], cur[1] - prev[1]);
    }, 0);

    return { path: rPath, steps: rSteps, geo: rGeo, distance: dist };
  }

  const mainRoute = buildRoute(nodePath);

  const startEntries = [
    startEntry,
    findUnobstructedEntry(origin.coordinates, 1)
  ].filter(Boolean);

  const endEntries = [
    endEntry,
    findUnobstructedEntry(destination.coordinates, 1)
  ].filter(Boolean);

  const altCandidates = [];
  startEntries.forEach(s => {
    endEntries.forEach(e => {
      if (s.index === startEntry.index && e.index === endEntry.index) return;
      const altNodePath = dijkstraShortestPath(allNodes, s.index, e.index, sahnPolygons);
      if (altNodePath.length === 0 || altNodePath.length === 1) return;
      const route = buildRoute(altNodePath);

      const isSame = (coords1, coords2) => {
        if (coords1.length !== coords2.length) return false;
        for (let i = 0; i < coords1.length; i++) {
          if (Math.abs(coords1[i][0] - coords2[i][0]) > 1e-6 || Math.abs(coords1[i][1] - coords2[i][1]) > 1e-6) {
            return false;
          }
        }
        return true;
      };

      if (isSame(route.geo.geometry.coordinates, mainRoute.geo.geometry.coordinates)) return;
      if (altCandidates.some(r => isSame(r.geo.geometry.coordinates, route.geo.geometry.coordinates))) return;

      altCandidates.push(route);
    });
  });

  altCandidates.sort((a, b) => a.distance - b.distance);

  const alternatives = altCandidates.slice(0, 1).map(route => {
    const via = route.steps
      .filter(st => st.type !== 'stepArriveDestination')
      .map(st => st.name || st.title)
      .filter(Boolean);
    return {
      steps: route.steps,
      geo: route.geo,
      from: origin.name || '',
      to: destination.name || '',
      via
    };
  });

  debugLog(`Final path has ${mainRoute.path.length} points`);

  return { path: mainRoute.path, geo: mainRoute.geo, steps: mainRoute.steps, alternatives };
}

export function computeShortestPath(origin, destination, features) {
  const path = [origin.coordinates];
  features.forEach(f => {
    const [lng, lat] = f.geometry.coordinates;
    path.push([lat, lng]);
  });
  path.push(destination.coordinates);
  const geo = {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: path.map(p => [p[1], p[0]]) }
  };
  return { path, geo };
}

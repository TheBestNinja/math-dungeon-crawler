/**
 * Bowyer–Watson Delaunay triangulation for 2D points.
 * Returns array of triangles: [{a,b,c}, ...] with point indices.
 */
export function delaunay(points) {
  if (points.length < 3) return [];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const dx = maxX - minX;
  const dy = maxY - minY;
  const delta = Math.max(dx, dy) * 10 || 100;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  const superPts = [
    { x: midX - 2 * delta, y: midY - delta },
    { x: midX, y: midY + 2 * delta },
    { x: midX + 2 * delta, y: midY - delta },
  ];
  const pts = points.concat(superPts);
  const n = points.length;
  let triangles = [{ a: n, b: n + 1, c: n + 2 }];

  for (let i = 0; i < n; i++) {
    const bad = [];
    for (let t = 0; t < triangles.length; t++) {
      const tri = triangles[t];
      if (inCircumcircle(pts[i], pts[tri.a], pts[tri.b], pts[tri.c])) {
        bad.push(t);
      }
    }
    const edges = [];
    for (const ti of bad) {
      const tri = triangles[ti];
      edges.push([tri.a, tri.b], [tri.b, tri.c], [tri.c, tri.a]);
    }
    // remove bad triangles (high to low index)
    bad.sort((a, b) => b - a);
    for (const ti of bad) triangles.splice(ti, 1);

    const unique = uniqueEdges(edges);
    for (const [u, v] of unique) {
      triangles.push({ a: u, b: v, c: i });
    }
  }

  return triangles.filter(
    (t) => t.a < n && t.b < n && t.c < n
  );
}

function uniqueEdges(edges) {
  const counts = new Map();
  for (const [a, b] of edges) {
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const out = [];
  for (const [key, count] of counts) {
    if (count === 1) {
      const [a, b] = key.split(':').map(Number);
      out.push([a, b]);
    }
  }
  return out;
}

function inCircumcircle(p, a, b, c) {
  const ax = a.x - p.x;
  const ay = a.y - p.y;
  const bx = b.x - p.x;
  const by = b.y - p.y;
  const cx = c.x - p.x;
  const cy = c.y - p.y;

  const det =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay);

  // Orient: positive if CCW
  const orient = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  return orient > 0 ? det > 0 : det < 0;
}

/** Build undirected weighted edge list from triangles. */
export function triangleEdges(triangles, points) {
  const seen = new Map();
  const add = (i, j) => {
    const key = i < j ? `${i}:${j}` : `${j}:${i}`;
    if (seen.has(key)) return;
    const dx = points[i].x - points[j].x;
    const dy = points[i].y - points[j].y;
    seen.set(key, { a: Math.min(i, j), b: Math.max(i, j), w: Math.hypot(dx, dy) });
  };
  for (const t of triangles) {
    add(t.a, t.b);
    add(t.b, t.c);
    add(t.c, t.a);
  }
  return [...seen.values()];
}

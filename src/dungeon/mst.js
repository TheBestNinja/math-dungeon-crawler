/** Kruskal MST. edges: {a,b,w}[], n = vertex count. Returns MST edges. */
export function minimumSpanningTree(edges, n) {
  const sorted = [...edges].sort((e1, e2) => e1.w - e2.w);
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return false;
    parent[rb] = ra;
    return true;
  };
  const mst = [];
  for (const e of sorted) {
    if (union(e.a, e.b)) {
      mst.push(e);
      if (mst.length === n - 1) break;
    }
  }
  return mst;
}

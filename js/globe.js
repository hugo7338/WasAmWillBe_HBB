// The map, drawn in the same ink as every chapter.
//
// An orthographic projection computed here, in about a hundred lines, rather
// than a tile engine: the earlier branches vendored 1 032 KB of MapLibre to
// render 916 bytes of hand-drawn coastline, because the site has no runtime
// network and therefore no tiles. In a site where everything else is line
// work, a WebGL map would have been the only thing not drawn.
//
// One scale, never zoomed — so the three flights are strictly comparable and
// the reader learns to read the instrument on the cheapest one.

const NS = 'http://www.w3.org/2000/svg';
const RAD = Math.PI / 180;
const R = 104;
const C = 120;

const vec = ({ lat, lng }) => {
  const φ = lat * RAD, λ = lng * RAD;
  return [Math.cos(φ) * Math.cos(λ), Math.cos(φ) * Math.sin(λ), Math.sin(φ)];
};

const ll = ([x, y, z]) => ({
  lat: Math.asin(Math.max(-1, Math.min(1, z))) / RAD,
  lng: Math.atan2(y, x) / RAD,
});

// Great-circle interpolation. The view centre travels along the very arc the
// map is drawing, so the globe turns the way the journey went.
function slerp(a, b, t) {
  const va = vec(a), vb = vec(b);
  const dot = Math.max(-1, Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  const ω = Math.acos(dot);
  if (ω < 1e-6) return a;
  const s = Math.sin(ω);
  const k1 = Math.sin((1 - t) * ω) / s, k2 = Math.sin(t * ω) / s;
  return ll(va.map((v, i) => v * k1 + vb[i] * k2));
}

// Cosine of the angular distance from the point to the centre of the view.
// Negative means the far side of the earth.
function cosC(lng, lat, view) {
  const φ = lat * RAD, λ = (lng - view.lng) * RAD, φ0 = view.lat * RAD;
  return Math.sin(φ0) * Math.sin(φ) + Math.cos(φ0) * Math.cos(φ) * Math.cos(λ);
}

function project(lng, lat, view) {
  const φ = lat * RAD, λ = (lng - view.lng) * RAD, φ0 = view.lat * RAD;
  return [
    C + R * Math.cos(φ) * Math.sin(λ),
    C - R * (Math.cos(φ0) * Math.sin(φ) - Math.sin(φ0) * Math.cos(φ) * Math.cos(λ)),
  ];
}

// Where a segment leaves the visible hemisphere. Without this the land is
// chewed off at the limb instead of running cleanly into it.
function horizon(vis, hid, view) {
  let a = vis, b = hid;
  for (let i = 0; i < 12; i++) {
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (cosC(m[0], m[1], view) >= 0) a = m; else b = m;
  }
  return a;
}

const xy = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;

// One path for many polylines: subpaths break wherever the line goes round
// the back of the earth.
function trace(lines, view) {
  let d = '';
  for (const points of lines) {
    let pen = false, previous = null;
    for (const p of points) {
      const visible = cosC(p[0], p[1], view) >= 0;
      if (visible) {
        if (!pen && previous) d += ` M ${xy(project(...horizon(p, previous, view), view))}`;
        d += `${pen ? ' L ' : (previous ? ' L ' : ' M ')}${xy(project(p[0], p[1], view))}`;
        pen = true;
      } else if (pen) {
        d += ` L ${xy(project(...horizon(previous, p, view), view))}`;
        pen = false;
      }
      previous = p;
    }
  }
  return d.trim();
}

// Meridians and parallels: the only way an empty ocean shows that it turned.
const GRATICULE = [];
for (let lng = -180; lng < 180; lng += 30) {
  const m = [];
  for (let lat = -90; lat <= 90; lat += 6) m.push([lng, lat]);
  GRATICULE.push(m);
}
for (let lat = -60; lat <= 60; lat += 30) {
  const p = [];
  for (let lng = -180; lng <= 180; lng += 6) p.push([lng, lat]);
  GRATICULE.push(p);
}

function path(cls) {
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('class', cls);
  return p;
}

// `rings` is tools/coastline.json: flat [lng, lat, lng, lat, …] per ring.
export function create(rings, from, to) {
  const land = rings.map((r) => {
    const points = [];
    for (let i = 0; i < r.length; i += 2) points.push([r[i], r[i + 1]]);
    points.push(points[0]);              // close the outline
    return points;
  });

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${C * 2} ${C * 2}`);
  svg.setAttribute('class', 'globe');
  svg.setAttribute('aria-hidden', 'true');

  const limb = document.createElementNS(NS, 'circle');
  limb.setAttribute('class', 'globe__limb');
  limb.setAttribute('cx', C); limb.setAttribute('cy', C); limb.setAttribute('r', R);

  const grid = path('globe__grid');
  const coast = path('globe__coast');
  const arc = path('globe__arc');

  const dot = (cls) => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('class', `globe__mark ${cls}`);
    c.setAttribute('r', '2.6');
    return c;
  };
  const a = dot('is-from'), b = dot('is-to');

  svg.append(limb, grid, coast, arc, a, b);

  const mark = (node, point, view) => {
    const on = cosC(point.lng, point.lat, view) >= 0;
    node.style.opacity = on ? '' : '0';
    if (!on) return;
    const [x, y] = project(point.lng, point.lat, view);
    node.setAttribute('cx', x.toFixed(1));
    node.setAttribute('cy', y.toFixed(1));
  };

  // t is the progress of the flight, 0 … 1.
  function update(t) {
    const view = slerp(from, to, t);
    grid.setAttribute('d', trace(GRATICULE, view));
    coast.setAttribute('d', trace(land, view));

    // The arc is drawn only as far as the flight has got: it grows behind the
    // view rather than announcing where it is going.
    const flown = [];
    const steps = Math.max(2, Math.round(160 * t));
    for (let i = 0; i <= steps; i++) {
      const p = slerp(from, to, (i / steps) * t);
      flown.push([p.lng, p.lat]);
    }
    arc.setAttribute('d', trace([flown], view));

    mark(a, from, view);
    mark(b, to, view);
  }

  update(0);
  return { svg, update };
}

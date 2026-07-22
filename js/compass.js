// The Values Compass. Away (−5) → Toward (+5), read as an arc.
// It never snaps between chapters: the needle is always mid-journey.

const SWEEP = 118; // degrees of arc used by the full −5 … +5 range
const NS = 'http://www.w3.org/2000/svg';

let needle = null;
let trace = null;
let labels = null;
let current = 0;
let target = 0;
let animating = false;

// The span of the dial this life has actually covered. It only ever grows,
// so scrolling back up does not un-live anything.
let seen = null;

export const angleFor = (v) => (v / 5) * (SWEEP / 2);

export const PIVOT = { x: 29, y: 40 };
export const R = 22;

// A point on the dial at `v`, `out` units beyond the arc.
export const on = (v, out = 0) => {
  const a = angleFor(v) * Math.PI / 180;
  return [PIVOT.x + (R + out) * Math.sin(a), PIVOT.y - (R + out) * Math.cos(a)];
};

export function mount(host) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 58 58');
  svg.setAttribute('class', 'compass');

  const [ax, ay] = on(-5), [bx, by] = on(5);
  const arc = document.createElementNS(NS, 'path');
  arc.setAttribute('class', 'arc');
  arc.setAttribute('d', `M ${ax.toFixed(1)} ${ay.toFixed(1)} A ${R} ${R} 0 0 1 ${bx.toFixed(1)} ${by.toFixed(1)}`);
  svg.append(arc);

  // Three ticks: the two limits and the middle. A scale, not a legend —
  // the reader gets something to read the needle against, and no words.
  for (const v of [-5, 0, 5]) {
    const [x1, y1] = on(v, 1), [x2, y2] = on(v, v === 0 ? 5 : 4);
    const tick = document.createElementNS(NS, 'line');
    tick.setAttribute('class', 'tick');
    tick.setAttribute('x1', x1.toFixed(1)); tick.setAttribute('y1', y1.toFixed(1));
    tick.setAttribute('x2', x2.toFixed(1)); tick.setAttribute('y2', y2.toFixed(1));
    svg.append(tick);
  }

  trace = document.createElementNS(NS, 'path');
  trace.setAttribute('class', 'trace');
  svg.append(trace);

  needle = document.createElementNS(NS, 'line');
  needle.setAttribute('class', 'needle');
  needle.setAttribute('x1', PIVOT.x); needle.setAttribute('y1', PIVOT.y);
  needle.setAttribute('x2', PIVOT.x); needle.setAttribute('y2', PIVOT.y - R + 4);
  svg.append(needle);

  // The two limits, written once. They exist from the start so nothing has to
  // be laid out at the last moment, and they are invisible until named.
  labels = document.createElementNS(NS, 'g');
  labels.setAttribute('class', 'names');
  // Below the dial, hard left and hard right — the two ends of the scale,
  // clear of the arc and of the needle's whole sweep.
  for (const [x, text, anchor] of [[1, 'Away', 'start'], [57, 'Toward', 'end']]) {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', String(x));
    t.setAttribute('y', '53');
    t.setAttribute('text-anchor', anchor);
    t.textContent = text;
    labels.append(t);
  }
  svg.append(labels);

  const pivot = document.createElementNS(NS, 'circle');
  pivot.setAttribute('class', 'pivot');
  pivot.setAttribute('cx', PIVOT.x); pivot.setAttribute('cy', PIVOT.y); pivot.setAttribute('r', '2');
  svg.append(pivot);

  host.replaceChildren(svg);
  apply();
}

function apply() {
  needle.style.transform = `rotate(${angleFor(current)}deg)`;
}

export function value() { return current; }

// Called once per chapter with that chapter's own reading, not the
// interpolated one. By the apex the trace has drawn the whole migration, and
// the two limits can finally be named — the only two words in the site.
export function record(v) {
  seen = seen === null ? { min: v, max: v } : { min: Math.min(seen.min, v), max: Math.max(seen.max, v) };
  if (seen.min === seen.max) { trace.removeAttribute('d'); return; }
  const [x1, y1] = on(seen.min), [x2, y2] = on(seen.max);
  trace.setAttribute('d', `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`);
}

export function span() { return seen; }

// The dénouement, and the only two words the instrument ever says. Called at
// the apex — where the needle reads +5 and the altitude finally agrees with it
// — on a trace that is by then already complete. It never un-names.
export function name() { labels.classList.add('is-named'); }
export function named() { return labels.classList.contains('is-named'); }

function tick() {
  current += (target - current) * 0.12;
  apply();
  if (Math.abs(target - current) > 0.002) requestAnimationFrame(tick);
  else { current = target; apply(); animating = false; }
}

export function setValue(v) {
  target = v;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    current = v; apply(); return;
  }
  if (!animating) { animating = true; requestAnimationFrame(tick); }
}

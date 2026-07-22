// The finale.
//
// The Key was found at chapter 24 and the apex has been flown. Past the last
// chapter there is a short blank page, and on it — once there is nothing left
// to read — the Key is offered. Using it takes the reader back: a fast reverse
// traversal through every chapter already read, stopping at `the-locked-room`,
// where the door opens. No text. The return is the gesture.
//
// It used to start by itself, after a pause at the bottom. It did not work:
// trackpad momentum keeps firing `wheel` for a second after the fingers lift,
// so the return began and was immediately cancelled by its own safety catch.
// Asking is better than guessing anyway — this is the one place the site moves
// the page itself, and now it only does so when told to.
//
// And having been told, it is sealed: from the click to the restart, no mouse
// or touch input reaches the page at all. It was asked for, once, and a
// twenty-five second sequence that any stray trackpad twitch can break is not
// a sequence. **Escape** still ends it — an animation with no way out is a
// trap, however deliberate.

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');

const RETURN = 7000;   // ms to travel back through the whole book

// ── the seal ────────────────────────────────────────────────────────────

let abandon = null;

const swallow = (e) => e.preventDefault();
const onKey = (e) => { if (e.key === 'Escape') release(true); };

function seal(onEscape) {
  abandon = onEscape;
  document.body.classList.add('is-sealed');
  addEventListener('wheel', swallow, { passive: false });
  addEventListener('touchmove', swallow, { passive: false });
  addEventListener('keydown', onKey);
}

const sealed = () => abandon !== null;

function release(escaped = false) {
  if (!abandon) return;
  const give = abandon;
  abandon = null;
  document.body.classList.remove('is-sealed');
  removeEventListener('wheel', swallow, { passive: false });
  removeEventListener('touchmove', swallow, { passive: false });
  removeEventListener('keydown', onKey);
  if (escaped) give();
}

let armed = false;
let done = false;
let running = false;
let host = null;
let page = null;

export function isDone() { return done; }

// Armed by the apex: there is no return from a journey that was not made.
export function arm() { armed = true; }

export function mount(section, { landing, open, abort }) {
  page = section;

  host = document.createElement('button');
  host.type = 'button';
  host.className = 'use-key';
  // Disabled, not merely invisible. `pointer-events: none` takes a button away
  // from the mouse and from nobody else — this one sat in the tab order from
  // the title page, and Tab then Enter fired the entire finale on a reader who
  // had not read a word.
  host.disabled = true;
  host.setAttribute('aria-label', 'Use the key');
  host.innerHTML = `
<svg viewBox="0 0 48 48" aria-hidden="true">
  <circle class="ring" cx="24" cy="24" r="21"/>
  <circle class="ln" cx="15" cy="24" r="6.4"/>
  <circle class="bit" cx="15" cy="24" r="2.1"/>
  <path class="ln" d="M 21.4 24 L 39 24"/>
  <path class="ln" d="M 33 24 L 33 28.8"/>
  <path class="ln" d="M 37 24 L 37 27.8"/>
</svg>`;

  host.addEventListener('click', () => {
    if (!armed || running || done) return;
    host.classList.remove('is-offered');
    seal(abort);
    run(landing(), open);
  });

  section.append(host);
}

// Called from the scroll loop. The Key is offered once the reader is actually
// on the blank page — measured off that page's own position, not off
// scrollHeight arithmetic, which subpixel rounding and elastic scrolling both
// get wrong at exactly the moment it matters.
export function consider({ y, vh }) {
  if (!host || done || running) return;
  const offered = armed && y + vh > page.offsetTop + 48;
  host.classList.toggle('is-offered', offered);
  host.disabled = !offered;
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function run(to, open) {
  running = true;

  if (REDUCED.matches) { scrollTo(0, to); land(open); return; }

  const from = window.scrollY;
  const t0 = performance.now();
  const frame = (now) => {
    if (!sealed()) { running = false; return; }   // Escape, mid-flight
    const t = Math.min(1, (now - t0) / RETURN);
    scrollTo(0, Math.round(from + (to - from) * ease(t)));
    if (t < 1) requestAnimationFrame(frame);
    else land(open);
  };
  requestAnimationFrame(frame);
}

function land(open) {
  running = false;
  done = true;
  host.remove();
  open();
}

// The opening in the-locked-room--inner.svg, in its own viewBox (480 × 300):
// between the swung leaf and the right jamb, floor to lintel. Everything the
// camera does is derived from this one rectangle.
const OPENING = { x0: 160, x1: 332, y0: 62, y1: 268, w: 480, h: 300 };

// The camera goes through the doorway.
export function enter(section) {
  const inner = section.querySelector('.chapter__inner');
  const art = section.querySelector('.drawing-pair .is-inner .drawing');
  if (!inner || !art) return;

  const box = art.getBoundingClientRect();
  const b = inner.getBoundingClientRect();

  // The drawing letterboxes inside its element. `.drawing` is `width: 100%`
  // with a `max-height`, and once that max-height bites — which it does on
  // every screen shorter than 940 px — the element stays 26 rem wide while the
  // artwork inside shrinks and centres. Measuring the element instead of the
  // artwork put the origin in the middle of the swung leaf and under-computed
  // how far in to go, which is why the frame stayed in shot. Work out where
  // the viewBox actually lands (preserveAspectRatio, xMidYMid meet).
  const fit = Math.min(box.width / OPENING.w, box.height / OPENING.h);
  const a = {
    left: box.left + (box.width - OPENING.w * fit) / 2,
    top: box.top + (box.height - OPENING.h * fit) / 2,
    width: OPENING.w * fit,
    height: OPENING.h * fit,
  };

  // The middle of the opening, on screen.
  const x = a.left + a.width * (OPENING.x0 + OPENING.x1) / 2 / OPENING.w;
  const y = a.top + a.height * (OPENING.y0 + OPENING.y1) / 2 / OPENING.h;

  // And how far in the camera must go for the doorway to be larger than the
  // screen. Computed, because no constant can be right on every screen: the
  // drawing is capped at 26 rem, so the wider the window the further in.
  const openW = a.width * (OPENING.x1 - OPENING.x0) / OPENING.w;
  const openH = a.height * (OPENING.y1 - OPENING.y0) / OPENING.h;
  const through = Math.max(window.innerWidth / openW, window.innerHeight / openH) * 1.4;
  inner.style.setProperty('--through', Math.max(12, through).toFixed(1));

  // Scale about it, so it is the one thing that does not move…
  inner.style.transformOrigin = `${(x - b.left).toFixed(1)}px ${(y - b.top).toFixed(1)}px`;
  // …and bring it to the middle of the screen on the way, so the door comes to
  // the camera rather than drifting off the side of it. The drawing sits in
  // the left column; without this the reader watches the doorway leave.
  inner.style.setProperty('--go-x', `${(window.innerWidth / 2 - x).toFixed(1)}px`);
  inner.style.setProperty('--go-y', `${(window.innerHeight / 2 - y).toFixed(1)}px`);

  section.classList.add('is-entering');
}

export function leave(section) {
  const inner = section.querySelector('.chapter__inner');
  section.classList.remove('is-entering');
  if (inner) { inner.style.transformOrigin = ''; inner.style.cssText = ''; }
}

// ── the last frame ──────────────────────────────────────────────────────
//
// The room is empty, because it was never drawn. Then the one instrument the
// reader has been watching without explanation since chapter 1 comes back,
// alone and large: the arc, the complete trace, the two words — and the needle
// at −5, which is where this room reads, travelling the whole way to +5, which
// is where the apex read. The journey as a single movement, in the room it
// started in.
//
// Nothing is written. It is built from compass.js's own geometry rather than
// from a copy of the numbers, so it is that dial and not a picture of it.

import { angleFor, on, PIVOT, R } from './compass.js?v=1784752826';

const NS = 'http://www.w3.org/2000/svg';
const make = (tag, attrs) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

let dial = null;
let closing = [];

export function lastFrame() {
  if (dial) return;

  const svg = make('svg', { viewBox: '0 0 58 58', class: 'compass' });

  const [ax, ay] = on(-5), [bx, by] = on(5);
  svg.append(make('path', {
    class: 'arc',
    d: `M ${ax.toFixed(1)} ${ay.toFixed(1)} A ${R} ${R} 0 0 1 ${bx.toFixed(1)} ${by.toFixed(1)}`,
  }));

  for (const v of [-5, 0, 5]) {
    const [x1, y1] = on(v, 1), [x2, y2] = on(v, v === 0 ? 5 : 4);
    svg.append(make('line', {
      class: 'tick', x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1),
    }));
  }

  // The whole span, already covered. Nothing is being measured here any more.
  svg.append(make('path', {
    class: 'trace',
    d: `M ${ax.toFixed(1)} ${ay.toFixed(1)} A ${R} ${R} 0 0 1 ${bx.toFixed(1)} ${by.toFixed(1)}`,
  }));

  const names = make('g', { class: 'names is-named' });
  for (const [x, text, anchor] of [[1, 'Away', 'start'], [57, 'Toward', 'end']]) {
    const t = make('text', { x, y: 53, 'text-anchor': anchor });
    t.textContent = text;
    names.append(t);
  }
  svg.append(names);

  const needle = make('line', {
    class: 'needle', x1: PIVOT.x, y1: PIVOT.y, x2: PIVOT.x, y2: PIVOT.y - R + 4,
  });
  needle.style.transform = `rotate(${angleFor(-5)}deg)`;
  svg.append(needle);
  svg.append(make('circle', { class: 'pivot', cx: PIVOT.x, cy: PIVOT.y, r: 2 }));

  dial = document.createElement('div');
  dial.className = 'last-frame';

  // Named at last. It is the only instrument in the site that is ever titled,
  // and it is titled on the page where it stops being an instrument.
  const name = document.createElement('p');
  name.className = 'last-frame__name';
  name.textContent = 'Values Compass';

  dial.append(name, svg);
  document.body.append(dial);

  requestAnimationFrame(() => dial.classList.add('is-lit'));

  const travel = REDUCED.matches ? 300 : 2000;
  closing = [
    setTimeout(() => { needle.style.transform = `rotate(${angleFor(5)}deg)`; }, travel),
    // Then it rests a moment, and the page empties — all of it, the dial
    // included. There is nothing after this.
    setTimeout(() => document.body.classList.add('is-over'), travel + 5000 + 2800),
    // And the site starts over, from the title. Nothing is kept: no storage,
    // no scroll position, so a reload is a genuinely clean first reading.
    setTimeout(() => {
      history.scrollRestoration = 'manual';
      scrollTo(0, 0);
      location.reload();
    }, travel + 5000 + 2800 + 3000),
  ];
}

export function clearLastFrame() {
  for (const t of closing) clearTimeout(t);
  closing = [];
  document.body.classList.remove('is-over');
  if (!dial) return;
  dial.remove();
  dial = null;
}

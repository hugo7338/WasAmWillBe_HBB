// Renders one location into its two beats.
//
// Three voices, receding in person as you scroll: the essay (I), the scene
// (he), the concept link (the analysis). `emotion`, `design_notes` and
// `status` never reach the DOM — they are ours, not the visitor's.

// Inherited from the entry script when published — see site/js/app.js.
const V = new URL(import.meta.url).search;

const NBSP = ' ';

function coordLine(c) {
  if (!c) return null;
  const fmt = (v, pos, neg) => `${Math.abs(v).toFixed(4)}${NBSP}${v >= 0 ? pos : neg}`;
  return `${fmt(c.lat, 'N', 'S')}${NBSP}${NBSP}${fmt(c.lng, 'E', 'W')}`;
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text) n.textContent = text;
  return n;
}

// A split chapter carries two: the Visible outside and the Non-Visible
// behind it, stacked, cross-faded by the scroll. `compass_inner` is the field
// that means "this chapter has two readings", so it is also what means
// "this chapter has two drawings" — nothing new had to be invented.
async function artwork(loc, available) {
  if (!available.includes(loc.id)) return null;
  const outer = await drawing(loc.id);
  if (!outer) return null;

  const second = `${loc.id}--inner`;
  if (!available.includes(second)) return outer;
  const inner = await drawing(second);

  const pair = el('div', 'drawing-holder drawing-pair');
  outer.classList.add('is-outer');
  inner.classList.add('is-inner');
  pair.append(outer, inner);
  return pair;
}

export async function drawing(id) {
  const res = await fetch(`assets/chapters/${id}.svg${V}`);
  if (!res.ok) return null;
  const holder = el('div', 'drawing-holder');
  holder.innerHTML = await res.text();
  // Stagger the stroke-draw so the drawing builds rather than blinks — but
  // cap the whole build at 1.2 s. A fixed per-path delay is fine at twenty
  // strokes and absurd at eighty: the control panel took nearly four seconds
  // to finish drawing, which is longer than a reader waits.
  const strokes = [...holder.querySelectorAll('.drawing path')];
  const step = Math.min(0.045, 1.2 / Math.max(1, strokes.length));
  strokes.forEach((p, i) => { p.style.transitionDelay = `${(i * step).toFixed(3)}s`; });
  return holder;
}

// The drawing takes what the text leaves.
//
// A single CSS cap has to be sized for the densest chapter in the site, and
// then every other chapter pays it: at 1280×900 that meant 162 px of drawing
// with 460 px of the column standing empty, and — because an SVG keeps its
// proportions — a third off the width as well. Measured per chapter instead,
// and again whenever the window changes.
export function fit(section) {
  const inner = section.querySelector('.chapter__inner');
  const art = section.querySelector('.col--narrative > .drawing-holder');
  if (!inner || !art) return;

  const box = getComputedStyle(inner);
  const padding = parseFloat(box.paddingTop) + parseFloat(box.paddingBottom);

  let text = parseFloat(getComputedStyle(art).marginBottom) || 0;
  for (const e of section.querySelectorAll('.col--narrative > *')) {
    if (e === art) continue;
    text += e.getBoundingClientRect().height
          + (parseFloat(getComputedStyle(e).marginBottom) || 0);
  }

  const free = window.innerHeight - padding - text - 8;
  section.style.setProperty('--art', `${Math.max(96, Math.round(free))}px`);
}

export async function render(loc, available) {
  const refused = loc.abstract;
  const section = el('section', refused ? 'chapter chapter--refused' : 'chapter');
  section.dataset.chapter = loc.id;
  // AS IF: drawn first, real after. A blueprint chapter arrives as a drawing
  // on drafting paper and solidifies once it has actually been read — and
  // stays solid, because nothing this site records is ever un-lived.
  if (loc.palette === 'blueprint') section.classList.add('chapter--blueprint');

  section.style.setProperty('--resist', Math.abs(loc.compass));
  const inner = el('div', 'chapter__inner');

  // ── left: the narrative ───────────────────────────────────────────────
  const left = el('div', 'col col--narrative');

  // an abstract chapter refuses the whole apparatus, drawing included (§2)
  const art = refused ? null : await artwork(loc, available);
  if (art) left.append(art);

  if (loc.quote) left.append(el('p', 'quote', `“${loc.quote}”`));
  left.append(el('h2', 'title', loc.title));
  left.append(el('p', 'place', loc.place));
  const coords = coordLine(loc.coordinates);
  if (coords) left.append(el('p', 'coords', coords));
  left.append(el('p', 'scene', loc.scene));

  // ── right: the course. Same page, but it still arrives second — the
  // column only resolves once the chapter has been scrolled into. ────────
  const right = el('div', 'col col--concept');
  right.append(el('p', 'concept-link', loc.concept_link));
  const list = el('ul', 'concepts');
  for (const c of loc.concepts) list.append(el('li', null, c));
  right.append(list);

  inner.append(left, right);
  section.append(inner);
  return { section };
}

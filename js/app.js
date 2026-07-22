import { render, fit } from './chapter.js?v=1784752826';
import { render as interlude } from './interlude.js?v=1784752826';
import { render as passage } from './passage.js?v=1784752826';
import { onScroll, start, progressOf } from './scroll.js?v=1784752826';
import * as compass from './compass.js?v=1784752826';
import * as gauge from './gauge.js?v=1784752826';
import * as threads from './threads.js?v=1784752826';
import * as venus from './venus.js?v=1784752826';
import * as beast from './beast.js?v=1784752826';
import * as key from './key.js?v=1784752826';
import * as finale from './finale.js?v=1784752826';

// Published builds carry a version query on the entry script, and every
// import and fetch inherits it, so a redeploy is never served half-stale
// against a ten-minute GitHub Pages cache. Locally this is the empty string.
const V = new URL(import.meta.url).search;

const $ = (role) => document.querySelector(`[data-role="${role}"]`);
const json = (p) => fetch(p + V).then((r) => r.json());

const [locations, threadList, elevations, flights, coastline, traversal, drawings, passages] = await Promise.all([
  json('data/locations.json'),
  json('data/threads.json'),
  json('data/elevations.json'),
  json('data/interludes.json'),
  json('data/coastline.json'),
  json('data/traversal.json'),
  json('data/drawings.json'),
  json('data/passages.json'),
]);

// design/scroll-structure.md steps 4–6. Zone A holds every hard case at once
// — the companion, the first Beast, and the-corner refusing the apparatus.
// Zone B is a single chapter sitting inside zone A's run: the afternoon at
// the grandmother's, 1 100 m, the one chapter of the childhood Venus is not
// in. Zone E adds the map. Zone C adds the second palette, the Split chapter
// and three of the four Beast states.
//
// A chapter is built when the compiler shipped its text. tools/compile.js
// decides — by era, not by zone letter, since the zones are geography and do
// not partition the traversal: chapter 19 is in Lyon like the rest of zone C
// but it is `will-be`, and the blueprint mechanic arrives in one piece. The
// rest arrive as structure only, so the gutter can still be a miniature of the
// whole book without the browser holding sentences the page has not written.
const chapters = locations.filter((l) => l.scene);

history.scrollRestoration = 'manual';   // the finale restarts at the title

compass.mount($('compass'));
gauge.mount($('gauge'));
threads.mount($('threads'), threadList, locations);
venus.mount($('venus'));
key.mount($('key'));
beast.mount($('beast'));

const main = document.getElementById('chapters');
const intro = main.querySelector('.intro');

// Three kinds of station share the scroll: chapters, the passages between
// them, and the flights. A station that is not a chapter is mounted only when
// the chapter it hands over to is itself built, so a partial build never runs
// off into nothing. Order matters: the passage comes before the flight, since
// the years pass before the leaving does.
const stations = [];
let previous = null;

for (const loc of chapters) {
  const { section } = await render(loc, drawings);
  main.append(section);
  stations.push({ kind: 'chapter', el: section, loc, previous });
  previous = loc;

  const next = chapters.find((c) => c.order === loc.order + 1);

  const pause = passages.find((p) => p.after === loc.id);
  if (pause && next) {
    const { section: el } = await passage(pause, drawings);
    main.append(el);
    stations.push({ kind: 'passage', el, spec: pause, from: loc, next });
  }

  const spec = flights.find((f) => f.after === loc.id);
  if (spec && next) {
    const { section: el, update } = interlude(spec, coastline.rings);
    main.append(el);
    stations.push({ kind: 'interlude', el, spec, update, from: loc, next });
  }
}

// Past the last chapter, a short blank page. Nothing is on it but the Key —
// the site has to be over before it can offer the way back.
const afterward = document.createElement('section');
afterward.className = 'afterward';
main.append(afterward);

const door = () => document.querySelector(`[data-chapter="${traversal.key_opens}"]`);
const middleOf = (el) => el.offsetTop + (el.offsetHeight - innerHeight) * 0.45;

// CLAUDE.md §5: the Key opens the locked room, and that is the last gesture.
// No text arrives with it. The gutter — a miniature of the whole book since
// chapter 1 — becomes the way back into it, and that is the only interface
// element in the site, unlocked only once there is nothing left to spoil.
const rail = () => threads.unlock((order) => {
  const at = chapters.find((c) => c.order === order);
  const el = document.querySelector(`[data-chapter="${at.id}"]`);
  scrollTo({ top: middleOf(el), behavior: 'smooth' });
});

// Set while the ending runs, so Escape can unpick it.
let ending = 0;
let last = 0;

// Escape, and only Escape. From the click on the Key to the restart, no mouse
// or touch input reaches the page at all — see the seal in site/js/finale.js.
const abort = () => {
  clearTimeout(ending);
  clearTimeout(last);
  document.body.removeAttribute('data-ending');
  finale.leave(door());
  finale.clearLastFrame();
  rail();
};

const open = () => {
  const section = door();
  section.classList.add('is-open');

  // The Beast has pressed on this page since chapter 4, and it is not slain
  // here — it turns. The author's own last sentence, three chapters ago: "a
  // Beast trained rather than feared". Nothing on screen says so.
  beast.setState('trained', 1);

  // Then everything that measures withdraws — the same gesture the-corner
  // used to refuse to be measured, meaning the opposite thing — and the page
  // goes through the doorway. What is behind it was never drawn, in twenty-one
  // chapters of not naming it, and it is not drawn now: the site ends inside
  // the room it always refused to depict.
  ending = setTimeout(() => {
    document.body.setAttribute('data-ending', '');
    finale.enter(section);
  }, 2400);

  // …and then, in the empty room, the dial. Everything that measured withdrew;
  // this one thing comes back, alone and large, and makes the whole journey in
  // one movement — −5, which is what this room reads, to +5, which is what the
  // apex read. Nothing is written on it. See site/js/finale.js.
  last = setTimeout(finale.lastFrame, 8200);

};

finale.mount(afterward, { landing: () => middleOf(door()), open, abort });

// Each drawing gets whatever height its own chapter's text has not used —
// see fit() in chapter.js. Re-measured on resize, because the text reflows.
const fitAll = () => { for (const s of stations) if (s.kind === 'chapter') fit(s.el); };
fitAll();
addEventListener('resize', fitAll);

// Reveal on entry: the text arrives, and the drawing draws itself.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('is-shown', 'is-drawn');
    io.unobserve(e.target);
  }
}, { threshold: 0.1 });

for (const { el } of stations) io.observe(el);

// The apparatus follows whichever chapter currently owns the viewport.
// A chapter marked `abstract` is the exception: everything that measures
// withdraws, and only the Beast stays. Nothing says so. Read from the content
// rather than from an id, so lifting it is an edit to a file, not to code.
//
// The refusal belongs to that page and ends with it — an interlude that
// follows it passes `refused: false`, so the instruments are back the moment
// the chapter is behind you.
function adopt(loc, refused = loc.abstract) {
  document.body.toggleAttribute('data-refused', refused);
  document.body.dataset.palette = loc.palette;

  $('order').textContent = refused ? '' : String(loc.order).padStart(2, '0');
  $('zone').textContent = refused ? '' : `zone ${loc.zone}`;
  gauge.setValue(refused ? null : elevations.metres[loc.id] ?? null);
  threads.setState({ order: loc.order, active: refused ? [] : loc.threads });

  compass.record(loc.compass);
  // The page warms with the needle, and only Toward of centre: the ground is
  // the reading, not the era. Zone C's cold chapters — the wardrobe, the
  // bench — stay grey while the ones around them do not.
  document.body.style.setProperty('--warm', (Math.max(0, loc.compass) / 5).toFixed(3));

  venus.setState({ present: loc.companion === 'venus' });
  // CLAUDE.md §5: the Key is found at `the-future-team` and opens
  // `the-locked-room`. Read from the compiled traversal, not from an id here.
  key.setState({ at: loc.id === traversal.key_found_at });

  // The apex is the one place the compass and the gauge finally agree, and the
  // one place the dial is allowed to say what it has been measuring. It is
  // also what arms the return: there is none from a journey not made.
  if (loc.compass === 5) { compass.name(); finale.arm(); }
  // Within a state, the weight still varies: the Beast at the-corner (−5) is
  // not the Beast at the-grey-wardrobe (−2), though both are `feared`.
  // Derived from |compass|, so no field has to be invented to say it.
  //
  // One exception, and it is the last thing the site does: once the door has
  // been opened, the Beast in that room stays turned. Everything else this
  // site records only ever grows — the trace, the blueprints, the two words on
  // the dial — and this is no different. Re-reading chapter 4 afterwards does
  // not put it back the way it was.
  const opened = finale.isDone() && loc.id === traversal.key_opens;
  beast.setState(opened ? 'trained' : loc.beast_state, Math.abs(loc.compass) / 5);
}

let adopted = null;

onScroll((s) => {
  let i = 0;
  for (let k = 0; k < stations.length; k++) {
    if (stations[k].el.offsetTop <= s.y + s.vh * 0.5) i = k;
  }

  // The instruments arrive with the first chapter, not with the title page:
  // there is nothing to measure yet, and an apparatus over a title is furniture.
  document.body.toggleAttribute('data-intro', s.y < intro.offsetHeight * 0.55);

  const station = stations[i];
  const { el, kind } = station;

  // How far through this station's own hold window we are — 0 when it
  // arrives, 1 when it starts to leave.
  const window_ = Math.max(1, el.offsetHeight - s.vh);
  const held = (s.y - el.offsetTop) / window_;

  if (kind === 'chapter') {
    const { loc } = station;
    if (adopted !== loc.id) { adopt(loc); adopted = loc.id; }

    // The needle is always mid-journey: it travels from the previous
    // chapter's reading to this one as the chapter comes in.
    const from = station.previous ? station.previous.compass : 0;
    let value = from + (loc.compass - from) * progressOf(el, s);

    // The Split chapter, and the only place in the site where the needle moves
    // twice on one page: having arrived at the Visible reading it goes on,
    // during the chapter's own hold, to the Non-Visible one. The wall is
    // crossed by scrolling. Nothing says so — CLAUDE.md §5, the Profiling
    // Matrix performed rather than explained.
    if (loc.compass_inner !== null) {
      const cross = Math.min(1, Math.max(0, (held - 0.20) / 0.45));
      value += (loc.compass_inner - loc.compass) * cross;
      el.style.setProperty('--inner', cross.toFixed(3));
      document.body.style.setProperty('--warm', (Math.max(0, value) / 5).toFixed(3));
      // Recorded only once the inside has actually been reached: the trace is
      // a record of where this life has been, not of what it contains.
      if (cross > 0.98) compass.record(loc.compass_inner);
    }

    compass.setValue(value);

    // The course voice shares the page but not the moment. Read at 0.25 and
    // dissolving from 0.90, the analysis stays fully lit for roughly two
    // thirds of the hold — long enough to be read well before the page starts
    // leaving. Earlier still would make it arrive with the chapter.
    if (held > 0.25) el.classList.add('is-second');

    // AS IF, and the only mechanic in the site that is one-way: a blueprint
    // solidifies once the chapter has actually been read, and never goes back
    // to being a drawing. Drawn first, real after.
    if (held > 0.30) el.classList.add('is-real');
  } else {
    if (adopted !== station.spec.id) {
      // The apparatus keeps the reading of the chapter being left: nothing is
      // measured between chapters, and no number appears that is true of no
      // place. Re-adopted rather than merely left alone, so a reader who
      // arrives by any route — a jump, a reload, scrolling back up — sees the
      // same thing.
      adopt(station.from, false);
      compass.setValue(station.from.compass);
      // The Beast is the exception: it belongs to where you are going. Which
      // means it lets go on the passage rather than over the ocean — what
      // loosens it is the years, not the distance.
      beast.setState(station.next.beast_state, Math.abs(station.next.compass) / 5);
      adopted = station.spec.id;
    }
    if (station.update) station.update(held);
  }

  // …and every station dissolves at the end of its hold. The last does not:
  // there is nothing after it to arrive at, only blank page.
  const last = i === stations.length - 1;
  const leave = last ? 0 : Math.min(1, Math.max(0, (held - 0.90) / 0.10));
  el.style.setProperty('--leave', leave.toFixed(3));

  finale.consider(s);
});

start();

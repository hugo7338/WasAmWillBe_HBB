// One rAF loop for the whole site. Everything that moves reads from here;
// nothing installs its own scroll listener. No scroll-jacking: the browser
// keeps its native momentum, we only observe it.

const subscribers = new Set();
let queued = false;

function emit() {
  queued = false;
  const y = window.scrollY;
  const vh = window.innerHeight;
  for (const fn of subscribers) fn({ y, vh });
}

function request() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(emit);
}

export function onScroll(fn) {
  subscribers.add(fn);
  request();
  return () => subscribers.delete(fn);
}

export function start() {
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  request();
}

// Progress of an element through the viewport, 0 before it arrives,
// 1 once its top has travelled a full viewport height.
export function progressOf(el, { y, vh }) {
  const top = el.offsetTop;
  return Math.max(0, Math.min(1, (y + vh - top) / vh));
}

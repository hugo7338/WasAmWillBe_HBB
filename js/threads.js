// The three threads, drawn as a miniature of the whole book: chapter 1 at the
// top of the gutter, chapter 25 at the bottom, on a shared axis. A thread is a
// segment running from its first member to its last, so the shapes say what no
// caption is allowed to:
//
//   far-island-line   a short segment, low, going nowhere
//   inherited-line    two distant points in the first half, joined
//   play-learn-line   almost the whole height of the book
//
// The traversed part of each segment is lit, and only grows — the same logic
// as the compass trace. A node marks every member chapter; the node for the
// chapter being read is the bright one.

let total = 25;
const rendered = new Map();

const pct = (order) => ((order - 1) / (total - 1)) * 100;

export function mount(host, threadList, locations) {
  total = Math.max(...locations.map((l) => l.order));
  const orderOf = Object.fromEntries(locations.map((l) => [l.id, l.order]));

  const wrap = document.createElement('div');
  wrap.className = 'threads';

  const axis = document.createElement('div');
  axis.className = 'threads__axis';
  wrap.append(axis);

  for (const t of threadList) {
    const orders = t.members.map((id) => orderOf[id]).sort((a, b) => a - b);
    const first = orders[0];
    const last = orders.at(-1);

    const el = document.createElement('div');
    el.className = 'thread';
    el.dataset.thread = t.id;

    const span = document.createElement('div');
    span.className = 'thread__span';
    span.style.top = `${pct(first)}%`;
    span.style.height = `${pct(last) - pct(first)}%`;

    const lit = document.createElement('div');
    lit.className = 'thread__lit';
    lit.style.top = `${pct(first)}%`;
    lit.style.height = '0%';

    el.append(span, lit);

    const nodes = orders.map((order) => {
      const node = document.createElement('div');
      node.className = 'thread__node';
      node.style.top = `${pct(order)}%`;
      el.append(node);
      return { order, el: node };
    });

    wrap.append(el);
    rendered.set(t.id, { el, lit, first, last, nodes });
  }

  host.replaceChildren(wrap);
}

// Free re-reading, on the instrument the reader already knows how to read.
// Nothing new appears on screen until the door has been opened.
export function unlock(onPick) {
  const wrap = document.querySelector('.threads');
  if (!wrap || wrap.querySelector('.rail')) return;

  const rail = document.createElement('div');
  rail.className = 'rail';
  for (let order = 1; order <= total; order++) {
    const stop = document.createElement('button');
    stop.type = 'button';
    stop.className = 'rail__stop';
    stop.style.top = `${pct(order)}%`;
    stop.setAttribute('aria-label', `Chapter ${order}`);
    stop.addEventListener('click', () => onPick(order));
    rail.append(stop);
  }
  wrap.append(rail);
  wrap.classList.add('is-unlocked');
}

export function setState({ order, active }) {
  for (const [id, t] of rendered) {
    t.el.classList.toggle('is-active', active.includes(id));
    const reached = Math.min(Math.max(order, t.first), t.last);
    t.lit.style.height = `${(pct(reached) - pct(t.first)).toFixed(2)}%`;
    for (const n of t.nodes) n.el.classList.toggle('is-here', n.order === order);
  }
}

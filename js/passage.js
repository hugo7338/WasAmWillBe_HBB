// A passage: a station that is not a chapter.
//
// One drawing and one line, centred, with no number, no zone, no coordinates
// and no analysis. There is one, between `the-corner` and the departure for
// New Zealand — sixteen years old and beaten, then the other side of the
// world, is not a transition but a cut, and the years in between are the
// author's own rather than the essay's. So the site holds them for a moment
// and does not examine them.

import { drawing } from './chapter.js?v=1784752826';

export async function render(spec, available) {
  const section = document.createElement('section');
  section.className = 'passage';
  section.dataset.passage = spec.id;
  section.style.setProperty('--hold', spec.hold);

  const inner = document.createElement('div');
  inner.className = 'passage__inner';

  if (available.includes(spec.id)) {
    const art = await drawing(spec.id);
    if (art) inner.append(art);
  }

  const line = document.createElement('p');
  line.className = 'passage__line';
  line.textContent = spec.line;
  inner.append(line);

  section.append(inner);
  return { section };
}

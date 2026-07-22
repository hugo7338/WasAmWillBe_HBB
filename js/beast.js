// The Beast. Not a shape and not a place — a condition of the whole page.
// It is limbic, not zoological, so it is never drawn: it presses in from the
// edges and it is felt rather than looked at. There is deliberately no SVG in
// this file, which is also why it can never be tempted into being a creature.
//
//   feared    — heaviest, and perfectly still. The freeze is the point.
//   discussed — light, and breathing: negotiable.
//   trained   — still there, still breathing, but the weight has turned warm.
//
// There is no fourth state. The Beast is never slain (CLAUDE.md §5).

let host = null;

export function mount(el) { host = el; }

// `depth` is 0…1, taken from |compass|: how far Away this chapter sits. It
// scales the weight inside a state, so the four `feared` chapters are not
// four identical pages.
export function setState(state, depth = 1) {
  for (const s of ['feared', 'discussed', 'distracted', 'trained']) {
    host.classList.toggle(`is-${s}`, state === s);
  }
  host.classList.toggle('is-present', state !== 'absent');
  host.style.setProperty('--depth', depth.toFixed(2));
}

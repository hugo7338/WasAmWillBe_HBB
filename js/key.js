// The Key. It appears in the margin at `the-future-team` — the chapter whose
// quote says one cannot move people through emotions one struggles to name in
// oneself — and it opens `the-locked-room`, twenty chapters back.
//
// Nothing here says any of that. It simply arrives, and stays: once found, it
// is never put down, including on a re-read of an earlier chapter.

let host = null;
let found = false;

export function mount(el) {
  host = el;
  host.innerHTML = `
<svg viewBox="0 0 40 18" aria-hidden="true">
  <circle class="ln" cx="9" cy="9" r="6.4"/>
  <circle class="bit" cx="9" cy="9" r="2.1"/>
  <path class="ln" d="M 15.4 9 L 36 9"/>
  <path class="ln" d="M 30 9 L 30 14"/>
  <path class="ln" d="M 34.5 9 L 34.5 13"/>
</svg>`;
}

export function setState({ at }) {
  if (at) found = true;
  host.classList.toggle('is-found', found);
}

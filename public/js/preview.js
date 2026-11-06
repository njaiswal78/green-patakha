import { Sound } from "./audio.js";
import { Show } from "./show.js";

// Silent, self-running preview for the landing page hero. Sound stays off:
// the AudioContext is never unlocked here.
const canvas = document.getElementById("preview");
if (canvas) {
  const show = new Show(canvas, new Sound(), { demo: true });
  const pool = ["rocket", "anar", "chakri", "skyshot", "rocket", "phuljhadi", "sutli", "ladi", "pencil", "bijli", "rocket"];
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  const tick = () => {
    if (visible && !document.hidden && show.items.length < 8) {
      const id = pool[(Math.random() * pool.length) | 0];
      show.fire(id, 40 + Math.random() * (show.W - 80));
    }
    setTimeout(tick, 700 + Math.random() * 1100);
  };
  show.fire("anar", show.W * 0.2);
  show.fire("skyshot", show.W * 0.7);
  setTimeout(tick, 600);
}

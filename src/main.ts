import { HEIGHT, WIDTH } from './constants';
import { button, canvas } from './ui';
import { render } from './render';
import { prewarm } from './prewarm';
import { audio } from './audio';
import { FULLSCREEN, USE_PREWARM } from './config';

canvas.width = WIDTH;
canvas.height = HEIGHT;

/**
 * The main update loop.
 */
function update(): void {
  requestAnimationFrame(update);
  render();
}

button.onclick = () => {
  if (FULLSCREEN) {
    canvas.requestFullscreen();
  } else {
    canvas.style = 'position:fixed;inset:0;width:100%;height:100%;object-fit:contain;background:#000';
    document.body.appendChild(canvas);
  }

  if (USE_PREWARM) {
    prewarm();
  }

  audio.resume();
  update();
};

import { HEIGHT, WIDTH } from './constants';

document.body.innerHTML = `<p>CLICK HERE (CW: FLASHING LIGHTS + LOUD AUDIO)</p><canvas width=${WIDTH} height=${HEIGHT} style=width:0;cursor:none></canvas><canvas width=${WIDTH} height=${HEIGHT} style=width:0>`;

export const [button, canvas, canvasText] = document.body.childNodes as unknown as [HTMLParagraphElement, HTMLCanvasElement, HTMLCanvasElement];

document.body.innerHTML = '<p>CLICK HERE (CW: FLASHING LIGHTS + LOUD AUDIO)</p><canvas style=cursor:none;width:0>';

export const [button, canvas] = document.body.childNodes as unknown as [HTMLParagraphElement, HTMLCanvasElement];

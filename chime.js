// The three rising chimes (C6, E6, G6) from the promo video, synthesized so no audio file is needed.
const NOTES = [84, 88, 91];
const HARMONICS = [[1, 1], [2.01, 0.3], [3.99, 0.1]];
const LENGTH = 1.2;
let ctx = null;

const hz = midi => 440 * 2 ** ((midi - 69) / 12);

async function running() {
  ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'running') return true;
  // Without a tap the browser may leave resume() pending forever; give up instead of chiming late.
  return Promise.race([ctx.resume().then(() => true), new Promise(resolve => setTimeout(() => resolve(false), 150))]);
}

// Silent when the browser blocks audio before the first tap (for example iOS Safari).
export async function playChime(step) {
  try {
    if (document.hidden || !(await running())) return;
    const start = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, start);
    master.gain.linearRampToValueAtTime(0.14, start + 0.002);
    master.gain.exponentialRampToValueAtTime(0.14 * Math.exp(-3.2 * 0.8), start + 0.8);
    master.gain.linearRampToValueAtTime(0, start + LENGTH);
    let out = master;
    if (ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = 0.2;
      master.connect(panner);
      out = panner;
    }
    out.connect(ctx.destination);
    for (const [multiple, level] of HARMONICS) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = hz(NOTES[step]) * multiple;
      gain.gain.value = level;
      osc.connect(gain).connect(master);
      osc.start(start);
      osc.stop(start + LENGTH);
    }
    if (step === NOTES.length - 1) {
      const done = ctx;
      setTimeout(() => { done.close().catch(() => {}); if (ctx === done) ctx = null; }, (LENGTH + 0.3) * 1000);
    }
  } catch { /* sound is optional */ }
}

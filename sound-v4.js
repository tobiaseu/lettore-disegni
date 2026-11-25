/* Lettore di disegni · v4 · motore del suono e mixer
   Ogni strumento e ogni percussione ha un canale come in un mixer vero:
     sorgente (patch) -> drive -> passa-alto -> EQ 3 bande -> compressore -> volume -> pompa -> muto -> pan -> bus
                                                                                     \-> mandata riverbero / delay
   Il bus master ha EQ, compressore "colla", limitatore e volume. Kit pronti (Studio, Hip hop, Reggaeton, House, Rap),
   preset personali salvati nel browser ed esportabili. Interfaccia: cassetto in basso (window.SOUND4.buildUI). */
(function () {
'use strict';
var INST = ['flute', 'violin', 'piano', 'guitar', 'bass'], DRUM = ['kick', 'clap', 'hat', 'snare'], CH = INST.concat(DRUM, ['sono']);
var NAMES = { flute: 'Flauto', violin: 'Violino', piano: 'Piano', guitar: 'Chitarra', bass: 'Basso', kick: 'Cassa', clap: 'Battimani', hat: 'Charleston', snare: 'Rullante', sono: 'Sonograf' };
var COLORS = { flute: '#16975A', violin: '#E8B90C', piano: '#1D4ED8', guitar: '#E0322A', bass: '#111111', kick: '#141414', clap: '#141414', hat: '#141414', snare: '#141414', sono: '#7a5cff' };
var WAVES = [
  ['flute', 'Flauto (soffio)'], ['sine', 'Sinusoide'], ['triangle', 'Triangolo'], ['sawtooth', 'Dente di sega'], ['square', 'Quadra'],
  ['piano', 'Piano morbido'], ['epiano', 'Piano elettrico (FM)'], ['bell', 'Campana (FM)'], ['organ', 'Organo'], ['pluck', 'Corda pizzicata'], ['strings', 'Archi (ensemble)'], ['sub808', '808 (sub con coda)']
];

/* ---------------- valori di partenza (kit Studio = i suoni di prima, puliti) ---------------- */
function mixDef(o) { var d = { vol: .8, pan: 0, hp: 20, low: 0, mid: 0, midF: 900, midQ: 1, high: 0, drive: 0, comp: 0, rev: .12, dly: 0, pump: 0, mute: false, solo: false }; for (var k in o) d[k] = o[k]; return d; }
function instDef(o) { var d = { wave: 'sine', oct: 0, uni: 1, det: 0, sub: 0, noise: 0, a: .01, d: .3, s: 1, r: .15, cut: 12000, res: .7, fenv: 0, fdec: .3, vib: 0, vibR: 5, glide: 0, lvl: .3 }; for (var k in o) d[k] = o[k]; return d; }
function drumDef(o) { var d = { tune: 0, decay: 1, tone: 0, punch: .3, noise: .5, lvl: 1, e808: false }; for (var k in o) d[k] = o[k]; return d; }
function studio() {
  return {
    name: 'Studio', bpm: null, div: null, swing: 0,
    master: { vol: .85, low: 0, high: 0, glue: .25, revSize: .45, revTone: .6, dlyTime: '1/8.', dlyFb: .3, dlyTone: .6 },
    mix: {
      flute: mixDef({ pan: -.25, rev: .2 }), violin: mixDef({ pan: .3, rev: .22 }), piano: mixDef({ pan: -.1, rev: .15 }), guitar: mixDef({ pan: .2, rev: .12 }), bass: mixDef({ rev: 0, vol: .85 }),
      kick: mixDef({ rev: 0, vol: .85 }), clap: mixDef({ pan: .1, rev: .15 }), hat: mixDef({ pan: -.2, rev: .05, vol: .7 }), snare: mixDef({ rev: .12 }), sono: mixDef({ rev: .25, vol: .7 })
    },
    patch: {
      flute: instDef({ wave: 'flute', a: .06, d: .3, s: 1, r: .12, vib: 9, vibR: 5, lvl: .22, noise: .25 }),
      violin: instDef({ wave: 'sawtooth', uni: 2, det: 5, a: .09, s: 1, r: .18, cut: 2800, vib: 12, vibR: 5.6, lvl: .16 }),
      piano: instDef({ wave: 'piano', a: .006, d: 1.4, s: 0, r: .12, lvl: .32 }),
      guitar: instDef({ wave: 'pluck', a: .002, d: .8, s: .9, r: .15, cut: 9000, lvl: .55 }),
      bass: instDef({ wave: 'sawtooth', sub: 1, a: .01, d: .3, s: 1, r: .1, cut: 900, res: 3, lvl: .3 }),
      kick: drumDef({ punch: .3 }), clap: drumDef({}), hat: drumDef({ decay: 1 }), snare: drumDef({}),
      sono: { wave: 'sine', lvl: .5, smooth: .5 }
    },
    pattern: null
  };
}
function merge(a, b) { if (!b) return a; for (var k in b) { if (b[k] && typeof b[k] == 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] == 'object') merge(a[k], b[k]); else a[k] = b[k]; } return a; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* Kit di genere: tanto diversi dallo Studio quanto serve per somigliare alle basi vere.
   Tempo = bpm musicali + quanto vale una casella della matrice (1/4, 1/8, 1/16). Il ritmo d'esempio si può caricare nella matrice. */
var KITS = {
  studio: { bpm: 90, div: 1, swing: 0 },
  hiphop: {
    name: 'Hip hop', bpm: 90, div: 2, swing: .16,
    master: { low: 2, high: -1.5, glue: .45, revSize: .35, revTone: .45, dlyTime: '1/8', dlyFb: .22, dlyTone: .4 },
    mix: {
      kick: { vol: .95, low: 3, drive: .25, comp: .35 }, snare: { vol: .85, low: 2, mid: -2, midF: 600, rev: .18, comp: .3 }, clap: { vol: .6, rev: .2 }, hat: { vol: .5, high: -3, pan: .25 },
      piano: { low: -2, high: -4, drive: .15, rev: .22, vol: .75 }, bass: { low: 2, high: -6, drive: .2, comp: .4 }, guitar: { high: -5, rev: .15, vol: .6 }, violin: { rev: .3, vol: .55, high: -3 }, flute: { rev: .25, high: -3, vol: .6 }
    },
    patch: {
      kick: { tune: -1, decay: 1.25, punch: .55, tone: -.3 }, snare: { tune: -2, decay: 1.2, tone: -.35, noise: .6 }, hat: { decay: .8, tone: -.4 }, clap: { tone: -.3, decay: 1.1 },
      piano: { wave: 'epiano', a: .004, d: 1.6, s: .15, r: .3, cut: 3200, vib: 5, vibR: 4.5, lvl: .3 },
      bass: { wave: 'sine', sub: .4, cut: 700, res: 1, a: .01, s: .9, r: .12, glide: .05, lvl: .45 },
      guitar: { cut: 2500, lvl: .45 }, violin: { wave: 'strings', a: .25, r: .5, cut: 2200, lvl: .14 }, flute: { cut: 4000, lvl: .18 }
    },
    pattern: ['1000000100100000', '0000000000000000', '1010101010101010', '0000100000001000']
  },
  reggaeton: {
    name: 'Reggaeton', bpm: 95, div: 4, swing: 0,
    master: { low: 2.5, high: 1.5, glue: .5, revSize: .3, revTone: .7, dlyTime: '1/8.', dlyFb: .3, dlyTone: .7 },
    mix: {
      kick: { vol: .95, low: 2, drive: .3, comp: .3 }, snare: { vol: .8, high: 3, mid: 2, midF: 2500, rev: .1 }, clap: { vol: .7, rev: .12 }, hat: { vol: .55, high: 2 },
      bass: { drive: .35, comp: .5, pump: .25 }, piano: { rev: .15, dly: .18, pump: .3, high: 2 }, guitar: { dly: .22, pump: .3, high: 2 }, violin: { dly: .25, pump: .35, rev: .2 }, flute: { dly: .25, pump: .3 }
    },
    patch: {
      kick: { e808: true, tune: -2, decay: 1.1, punch: .65 }, snare: { tune: 5, decay: .55, tone: .5, noise: .45 }, hat: { decay: .6, tone: .4 }, clap: { tone: .3, decay: .8 },
      bass: { wave: 'sub808', sub: 0, a: .005, d: .9, s: .4, r: .25, glide: .07, lvl: .55 },
      piano: { wave: 'bell', a: .002, d: .5, s: .1, r: .2, cut: 9000, lvl: .25 },
      guitar: { cut: 6000, lvl: .5 }, violin: { wave: 'sawtooth', uni: 3, det: 14, a: .01, d: .25, s: .55, r: .15, cut: 3800, fenv: 1.5, fdec: .2, vib: 0, lvl: .12 },
      flute: { wave: 'square', a: .02, cut: 2600, res: 2, vib: 14, vibR: 5.5, lvl: .12 }
    },
    pattern: ['1000100010001000', '0000000000000000', '0010001000100010', '0001001000010010']
  },
  house: {
    name: 'House', bpm: 124, div: 4, swing: .08,
    master: { low: 1.5, high: 2, glue: .55, revSize: .55, revTone: .7, dlyTime: '1/8.', dlyFb: .38, dlyTone: .65 },
    mix: {
      kick: { vol: 1, low: 2, comp: .35, drive: .1 }, clap: { vol: .8, rev: .35 }, hat: { vol: .6, high: 3, pan: .3 }, snare: { vol: .6, rev: .25 },
      bass: { pump: .55, comp: .35, drive: .15 }, piano: { pump: .6, rev: .25, dly: .15 }, guitar: { pump: .5, dly: .25 }, violin: { pump: .7, rev: .35 }, flute: { pump: .5, dly: .3 }, sono: { pump: .5 }
    },
    patch: {
      kick: { tune: 0, decay: 1.05, punch: .7, tone: .2 }, clap: { decay: 1.4, tone: .2 }, hat: { decay: 1.8, tone: .5, noise: .7 }, snare: { tone: .3 },
      bass: { wave: 'square', sub: .5, a: .005, d: .22, s: .25, r: .08, cut: 500, res: 7, fenv: 2.5, fdec: .18, lvl: .26 },
      piano: { wave: 'organ', a: .004, d: .35, s: .3, r: .12, cut: 4500, fenv: 1.2, fdec: .25, lvl: .17 },
      guitar: { cut: 7000, lvl: .45 }, violin: { wave: 'strings', a: .35, d: .5, s: .9, r: .6, cut: 3500, lvl: .13 }, flute: { wave: 'triangle', a: .003, d: .2, s: .2, r: .1, lvl: .25 }
    },
    pattern: ['1000100010001000', '0000100000001000', '0010001000100010', '0000000000000001']
  },
  rap: {
    name: 'Rap', bpm: 100, div: 2, swing: .04,
    master: { low: 3, high: 0, glue: .45, revSize: .65, revTone: .4, dlyTime: '1/4', dlyFb: .3, dlyTone: .35 },
    mix: {
      kick: { vol: 1, drive: .45, comp: .4, low: 2 }, snare: { vol: .85, high: 2, rev: .2 }, clap: { vol: .75, rev: .25 }, hat: { vol: .55, high: 2, pan: -.25 },
      bass: { drive: .4, comp: .5, low: 2 }, piano: { rev: .35, dly: .15, low: -3 }, guitar: { rev: .25, high: -4 }, violin: { rev: .4, low: -2 }, flute: { rev: .35, dly: .2, vol: .7 }
    },
    patch: {
      kick: { e808: true, tune: -3, decay: 1.8, punch: .5 }, snare: { tune: 3, decay: .8, tone: .4, noise: .55 }, hat: { decay: .45, tone: .6 }, clap: { tone: .1, decay: 1 },
      bass: { wave: 'sub808', a: .004, d: 1.6, s: .5, r: .4, glide: .09, lvl: .6 },
      piano: { wave: 'bell', a: .002, d: 1.2, s: .05, r: .5, cut: 5000, lvl: .22 },
      guitar: { cut: 2200, lvl: .45 }, violin: { wave: 'strings', a: .3, r: .7, cut: 1800, lvl: .14 }, flute: { wave: 'flute', a: .05, noise: .55, vib: 16, vibR: 5.2, lvl: .2 }
    },
    pattern: ['1000000010000010', '0000100000001000', '0010001000100010', '0000100000001000']
  }
};
var KIT_ORDER = ['studio', 'hiphop', 'reggaeton', 'house', 'rap'];
function kitState(id) { var k = KITS[id] || {}, s = studio(); merge(s, clone(k)); s.kit = id; s.name = k.name || 'Studio'; return s; }

/* ---------------- stato ---------------- */
var ST = kitState('studio'), STORE = 'lettore-v4-mix', PSTORE = 'lettore-v4-presets';
try { var sv = JSON.parse(localStorage.getItem(STORE) || 'null'); if (sv && sv.mix && sv.patch) { ST = merge(kitState(sv.kit || 'studio'), sv); } } catch (e) {}
function save() { try { localStorage.setItem(STORE, JSON.stringify(ST)); } catch (e) {} }
var saveT = 0; function saveSoon() { clearTimeout(saveT); saveT = setTimeout(save, 400); }
function userPresets() { try { return JSON.parse(localStorage.getItem(PSTORE) || '[]'); } catch (e) { return []; } }
function setUserPresets(a) { try { localStorage.setItem(PSTORE, JSON.stringify(a)); } catch (e) {} }

/* ---------------- grafo audio ---------------- */
var AC = null, bus, out, glue, lim, mLow, mHigh, revIn, conv, revOut, dlyIn, dly, dlyFb, dlyF, dlyOut, strips = {}, noiseBuf = null, ksCache = {}, ext = { c: [], d: [] }, hooks = {}, lastMidi = {}, curves = {};
function bq(type, f, q, g) { var b = AC.createBiquadFilter(); b.type = type; if (f) b.frequency.value = f; if (q != null) b.Q.value = q; if (g != null) b.gain.value = g; return b; }
function gn(v) { var g = AC.createGain(); g.gain.value = v == null ? 1 : v; return g; }
function chain() { for (var i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]); }
function init(ac, dests) {
  if (AC) return;
  AC = ac;
  bus = gn(1); mLow = bq('lowshelf', 110, null, 0); mHigh = bq('highshelf', 7500, null, 0);
  glue = AC.createDynamicsCompressor(); glue.knee.value = 8; glue.attack.value = .012; glue.release.value = .18;
  lim = AC.createDynamicsCompressor(); lim.threshold.value = -1.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .002; lim.release.value = .09;
  out = gn(ST.master.vol);
  chain(bus, mLow, mHigh, glue, lim, out);
  dests.forEach(function (d) { if (d) out.connect(d); });
  revIn = gn(1); conv = AC.createConvolver(); revOut = gn(.9); chain(revIn, conv, revOut, bus);
  dlyIn = gn(1); dly = AC.createDelay(2.5); dlyF = bq('lowpass', 4500, .5); dlyFb = gn(.3); dlyOut = gn(.8);
  chain(dlyIn, dly, dlyF, dlyFb, dly); dlyF.connect(dlyOut); dlyOut.connect(bus);
  noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); var nd = noiseBuf.getChannelData(0); for (var k = 0; k < nd.length; k++) nd[k] = Math.random() * 2 - 1;
  CH.forEach(function (key) { strips[key] = makeStrip(key); });
  applyAll();
}
function makeStrip(key) {
  var s = { key: key };
  s.in = gn(1); s.drive = AC.createWaveShaper(); s.drive.oversample = '2x';
  s.hp = bq('highpass', 20, .7); s.lo = bq('lowshelf', 160, null, 0); s.mid = bq('peaking', 900, 1, 0); s.hi = bq('highshelf', 6000, null, 0);
  s.comp = AC.createDynamicsCompressor(); s.comp.knee.value = 6; s.comp.attack.value = .006; s.comp.release.value = .12;
  s.make = gn(1); s.fader = gn(.8); s.duck = gn(1); s.mute = gn(1);
  s.pan = AC.createStereoPanner ? AC.createStereoPanner() : gn(1);
  s.sr = gn(0); s.sd = gn(0); s.an = AC.createAnalyser(); s.an.fftSize = 512; s.buf = new Float32Array(512); s.peak = 0;
  chain(s.in, s.drive, s.hp, s.lo, s.mid, s.hi, s.comp, s.make, s.fader, s.duck, s.mute, s.pan, bus);
  s.pan.connect(s.sr); s.sr.connect(revIn); s.pan.connect(s.sd); s.sd.connect(dlyIn); s.pan.connect(s.an);
  return s;
}
function driveCurve(a) {
  var k = Math.round(a * 20) / 20; if (k < .02) return null; if (curves[k]) return curves[k];
  var n = 1024, c = new Float32Array(n), d = 1 + k * 24, t = Math.tanh(d); for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(d * x) / t; }
  return (curves[k] = c);
}
function tc(p, v) { if (!AC) return; p.setTargetAtTime(v, AC.currentTime, .03); }
function soloOn() { return CH.some(function (k) { return ST.mix[k].solo; }); }
function extMuted(key) { var i = INST.indexOf(key); if (i >= 0) return !!ext.c[i]; i = DRUM.indexOf(key); return i >= 0 ? !!ext.d[i] : false; }
function audible(key) { var m = ST.mix[key]; return !(m.mute || extMuted(key) || (soloOn() && !m.solo)); }
function applyStrip(key) {
  var s = strips[key], m = ST.mix[key]; if (!s) return;
  s.drive.curve = driveCurve(m.drive);
  tc(s.hp.frequency, m.hp); tc(s.lo.gain, m.low); tc(s.mid.gain, m.mid); tc(s.mid.frequency, m.midF); tc(s.mid.Q, m.midQ); tc(s.hi.gain, m.high);
  s.comp.threshold.value = -m.comp * 32; s.comp.ratio.value = 1 + m.comp * 7; tc(s.make.gain, 1 + m.comp * .9);
  tc(s.fader.gain, m.vol * m.vol * 1.3 * (1 - m.drive * .35)); tc(s.mute.gain, audible(key) ? 1 : 0);
  if (s.pan.pan) tc(s.pan.pan, m.pan);
  tc(s.sr.gain, m.rev * .9); tc(s.sd.gain, m.dly * .8);
}
function applyMutes() { CH.forEach(function (k) { if (strips[k]) tc(strips[k].mute.gain, audible(k) ? 1 : 0); }); }
var revKey = '';
function applyMaster() {
  if (!AC) return; var M = ST.master;
  tc(out.gain, M.vol); tc(mLow.gain, M.low); tc(mHigh.gain, M.high);
  glue.threshold.value = -6 - M.glue * 20; glue.ratio.value = 1.5 + M.glue * 3;
  var rk = M.revSize.toFixed(2) + ':' + M.revTone.toFixed(2); if (rk != revKey) { revKey = rk; conv.buffer = impulse(M.revSize, M.revTone); }
  tc(dlyFb.gain, Math.min(.85, M.dlyFb)); tc(dlyF.frequency, 900 + M.dlyTone * 7000); tc(dly.delayTime, dlyTime());
}
function dlyTime() { var t = hooks.tempo ? hooks.tempo() : { bpm: 100 }, beat = 60 / Math.max(30, t.bpm || 100); return Math.min(2.4, { '1/16': beat / 4, '1/8': beat / 2, '1/8.': beat * .75, '1/4': beat, '1/4.': beat * 1.5 }[ST.master.dlyTime] || beat * .75); }
function applyAll() { if (!AC) return; CH.forEach(applyStrip); applyMaster(); }
function impulse(size, tone) {
  var sr = AC.sampleRate, len = Math.round(sr * (.5 + size * 4)), b = AC.createBuffer(2, len, sr), pw = 2 + (1 - size) * 3, lp = .15 + tone * .8;
  for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch), y = 0; for (var i = 0; i < len; i++) { var x = Math.random() * 2 - 1; y += lp * (x - y); d[i] = y * Math.pow(1 - i / len, pw) * (i < sr * .008 ? i / (sr * .008) : 1); } }
  return b;
}

/* ---------------- voci degli strumenti ---------------- */
function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function ks(m, bright) {
  var key = m + ':' + bright; if (ksCache[key]) return ksCache[key];
  var sr = AC.sampleRate, N = Math.max(2, Math.round(sr / mtof(m))), len = Math.round(sr * 2), buf = AC.createBuffer(1, len, sr), d = buf.getChannelData(0), i;
  var decay = .996 - Math.max(0, m - 60) * .0004, mix = .5 - bright * .3;
  for (i = 0; i < N; i++) d[i] = (Math.random() * 2 - 1) * .8;
  for (i = 1; i < N; i++) d[i] = d[i] * (1 - mix) + d[i - 1] * mix;
  for (i = N; i < len; i++) d[i] = decay * .5 * (d[i - N] + d[i - N + 1 < i ? i - N + 1 : i - N]);
  return (ksCache[key] = buf);
}
function oscAt(type, f, t, end) { var o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(end); return o; }
/* inst: 0..4, m: midi, t: inizio, dur: durata tenuta. opt.path = [[tempo, midi]...] (glissando), opt.amp = [[tempo, 0..1]...] (volume che segue il tratto), opt.vel */
function playNote(inst, m, t, dur, opt) {
  if (!AC) return; opt = opt || {};
  var key = INST[inst], P = ST.patch[key], s = strips[key]; if (!s) return;
  var vel = opt.vel == null ? 1 : opt.vel, mm = m + 12 * P.oct, f = mtof(mm), peak = P.lvl * vel, A = Math.max(.002, P.a), hold = t + Math.max(dur, A + .01), R = Math.max(.02, P.r), end = hold + R * 4 + .05;
  if (P.wave == 'pluck') end = Math.max(end, t + Math.min(2, dur + 1.2));
  if (P.wave == 'piano' || P.wave == 'epiano' || P.wave == 'bell') end = hold + Math.max(R * 4, .3) + .05;
  var env = gn(0), ag = gn(1), filt = bq('lowpass', Math.min(18000, P.cut), P.res);
  env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(peak, t + A);
  env.gain.setTargetAtTime(peak * P.s, t + A, Math.max(.01, P.d) / 3);
  env.gain.setTargetAtTime(0, hold, R / 3);
  if (P.fenv > 0) { filt.frequency.setValueAtTime(Math.min(18000, P.cut * Math.pow(2, P.fenv)), t); filt.frequency.setTargetAtTime(P.cut, t + .003, Math.max(.01, P.fdec) / 3); }
  if (opt.amp && opt.amp.length) { ag.gain.setValueAtTime(opt.amp[0][1], t); opt.amp.forEach(function (p) { ag.gain.linearRampToValueAtTime(p[1], Math.max(t + .001, p[0])); }); }
  chain(filt, env, ag, s.in);
  var fp = [], srcs = [];
  function add(type, ratio, level, det) { var o = oscAt(type, f * ratio, t, end); if (det) o.detune.value = det; var g = gn(level); o.connect(g); g.connect(filt); fp.push([o.frequency, ratio]); srcs.push(o); return o; }
  var w = P.wave;
  if (w == 'pluck') {
    var b = AC.createBufferSource(); b.buffer = ks(Math.round(mm), Math.max(0, Math.min(1, (P.cut - 2000) / 8000))); b.playbackRate.setValueAtTime(f / mtof(Math.round(mm)), t);
    b.connect(filt); b.start(t); b.stop(end); fp.push([b.playbackRate, 1 / mtof(Math.round(mm))]);
  } else if (w == 'piano') { add('triangle', 1, 1); add('sine', 2, .25); }
  else if (w == 'flute') { add('sine', 1, 1); add('triangle', 1, .12); }
  else if (w == 'organ') { add('sine', 1, .8); add('sine', 2, .5); add('sine', 3, .32); add('sine', 4, .2); add('sine', .5, .25); }
  else if (w == 'strings') { [-1, 0, 1].forEach(function (k) { add('sawtooth', 1, .45, k * (P.det || 9)); }); add('sawtooth', 2, .12, 4); }
  else if (w == 'epiano' || w == 'bell') {
    var ratio = w == 'bell' ? 3.5 : 1, car = add('sine', 1, 1), mod = oscAt('sine', f * ratio, t, end), mg = gn(0);
    var idx = w == 'bell' ? 4 : 2.4; mg.gain.setValueAtTime(f * idx, t); mg.gain.setTargetAtTime(f * (w == 'bell' ? .6 : .35), t, w == 'bell' ? .35 : .25);
    mod.connect(mg); mg.connect(car.frequency); fp.push([mod.frequency, ratio]);
    if (w == 'epiano') { var tine = oscAt('sine', f * 14, t, t + .2), tg = gn(0); tg.gain.setValueAtTime(.06, t); tg.gain.setTargetAtTime(0, t, .03); tine.connect(tg); tg.connect(filt); }
  } else if (w == 'sub808') {
    var o8 = add('sine', 1, 1); add('triangle', 2, .08);
  } else {
    var n = Math.max(1, Math.min(4, P.uni | 0)); for (var u = 0; u < n; u++) add(w, 1, 1 / Math.sqrt(n), n > 1 ? (u / (n - 1) - .5) * 2 * P.det : 0);
  }
  if (P.sub > 0 && w != 'pluck') add('sine', .5, P.sub * .8);
  if (P.noise > 0) { var nb = AC.createBufferSource(); nb.buffer = noiseBuf; nb.loop = true; var bp = bq('bandpass', Math.min(12000, f * 2), 1.5), ng = gn(P.noise * .2); chain(nb, bp, ng, filt); nb.start(t); nb.stop(end); }
  /* vibrato con attacco lento */
  if (P.vib > 0 && w != 'pluck') { var l = oscAt('sine', P.vibR, t, end), lg = gn(0), dep = Math.pow(2, P.vib / 1200) - 1; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(1, t + .3);
    l.connect(lg); fp.forEach(function (q) { if (q[1] > 0 && q[0] !== undefined && q[0].value !== undefined && q[1] < 50) { var d2 = gn(f * q[1] * dep); lg.connect(d2); d2.connect(q[0]); } }); }
  /* glide (portamento) dalla nota di prima dello stesso strumento */
  var from = lastMidi[key]; lastMidi[key] = m;
  var path = opt.path ? opt.path.slice() : null;
  if (!path && P.glide > 0 && from != null && from != m && Math.abs(from - m) < 13) {
    fp.forEach(function (q) { var base = q[1] < 1e-3 ? q[1] * mtof(from + 12 * P.oct) : mtof(from + 12 * P.oct) * q[1]; q[0].setValueAtTime(base, t); q[0].exponentialRampToValueAtTime(q[1] < 1e-3 ? q[1] * f : f * q[1], t + P.glide); });
  }
  if (path) fp.forEach(function (q) { path.forEach(function (pt) { var fm = mtof(pt[1] + 12 * P.oct); q[0].linearRampToValueAtTime(q[1] < 1e-3 ? q[1] * fm : fm * q[1], Math.max(t + .001, pt[0])); }); });
  if (P.wave == 'sub808') { /* coda dell'808: la voce si spegne da sola */ }
}
/* ---------------- percussioni ---------------- */
function noiseHit(t, dur, type, freq, q, peak, decay, dest) {
  var n = AC.createBufferSource(); n.buffer = noiseBuf; var fl = bq(type, freq, q || .7), g = gn(0);
  g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(.001, t + decay); chain(n, fl, g, dest); n.start(t); n.stop(t + dur);
}
function playDrum(i, t, vel) {
  if (!AC) return; var key = DRUM[i], P = ST.patch[key], s = strips[key]; if (!s) return;
  var v = (vel == null ? 1 : vel) * P.lvl, pm = Math.pow(2, P.tune / 12), dc = Math.max(.2, P.decay), dest = s.in, o, g;
  if (key == 'kick') {
    var e8 = P.e808, dk = (e8 ? 1.1 : .38) * dc, f1 = (e8 ? 52 : 46) * pm, f0 = f1 * (2.6 + P.punch * 1.6);
    o = oscAt('sine', f0, t, t + dk + .1); o.frequency.exponentialRampToValueAtTime(f1, t + .05 + (e8 ? .07 : .06));
    g = gn(0); g.gain.setValueAtTime(.001, t); g.gain.exponentialRampToValueAtTime(.95 * v, t + .003); g.gain.exponentialRampToValueAtTime(.001, t + dk); chain(o, g, dest);
    if (P.punch > 0) { noiseHit(t, .02, 'highpass', 2500 + P.tone * 2000, .7, .35 * P.punch * v, .012, dest); var cl = oscAt('square', 1100 * pm, t, t + .012), cg = gn(.12 * P.punch * v); cg.gain.setTargetAtTime(0, t, .003); chain(cl, cg, dest); }
    pump(t);
  } else if (key == 'snare') {
    noiseHit(t, .4 * dc, 'highpass', 1200 + P.tone * 1500, .7, .45 * v * (.5 + P.noise), .18 * dc, dest);
    noiseHit(t, .1, 'bandpass', 5000 + P.tone * 2000, 1, .12 * v, .05, dest);
    o = oscAt('triangle', 190 * pm, t, t + .2); o.frequency.exponentialRampToValueAtTime(150 * pm, t + .08); g = gn(0); g.gain.setValueAtTime(.4 * v, t); g.gain.exponentialRampToValueAtTime(.001, t + .1 * dc); chain(o, g, dest);
  } else if (key == 'hat') {
    var hd = .05 * dc * (dc > 1.5 ? 2.2 : 1);
    noiseHit(t, hd + .05, 'highpass', 7000 + P.tone * 2500, .7, .22 * v * (.6 + P.noise * .8), hd, dest);
    [2, 3, 4.16, 5.43, 6.79, 8.21].forEach(function (r) { var mo = oscAt('square', 40 * r * 1.5 * pm, t, t + hd + .02), mg = gn(0); mg.gain.setValueAtTime(.012 * v, t); mg.gain.exponentialRampToValueAtTime(.0005, t + hd); var hp = bq('highpass', 7500); chain(mo, hp, mg, dest); });
  } else if (key == 'clap') {
    var cf = 1400 * pm + P.tone * 600;
    [0, .011, .023].forEach(function (d) { noiseHit(t + d, .04, 'bandpass', cf, .8, .35 * v, .03, dest); });
    noiseHit(t + .03, .3 * dc, 'bandpass', cf, .8, .3 * v, .16 * dc, dest);
  }
}
/* pompa: il kick abbassa per un attimo gli strumenti (sidechain) */
function pump(t) {
  CH.forEach(function (k) { var m = ST.mix[k], s = strips[k]; if (!s || !m.pump || DRUM.indexOf(k) >= 0) return;
    var p = s.duck.gain; p.cancelScheduledValues(t); p.setValueAtTime(1 - m.pump * .85, t); p.setTargetAtTime(1, t + .015, .06 + m.pump * .08); });
}
/* ---------------- banco Sonograf: un oscillatore per ogni nota, il volume lo decide quanto è scuro il disegno ---------------- */
function sonoBank(midis) {
  if (!AC) return null; var P = ST.patch.sono, s = strips.sono, sum = gn(1), oscs = [], gains = [];
  sum.connect(s.in);
  midis.forEach(function (m) {
    var g = gn(0), f = mtof(m), t = AC.currentTime;
    if (P.wave == 'organ') { [[1, .7], [2, .3], [3, .15]].forEach(function (h) { var o = oscAt('sine', f * h[0], t, t + 36000), hg = gn(h[1]); chain(o, hg, g); oscs.push(o); }); }
    else if (P.wave == 'glass') { var o2 = oscAt('triangle', f, t, t + 36000), o3 = oscAt('sine', f * 2.01, t, t + 36000), g3 = gn(.25); o2.connect(g); chain(o3, g3, g); oscs.push(o2, o3); }
    else { var o1 = oscAt('sine', f, t, t + 36000); o1.connect(g); oscs.push(o1); }
    g.connect(sum); gains.push(g);
  });
  return {
    n: midis.length,
    set: function (t, lv) { var tot = 0; lv.forEach(function (x) { tot += x; }); var k = P.lvl * .35 / Math.max(1, Math.sqrt(tot)), tau = .008 + P.smooth * .05;
      gains.forEach(function (g, i) { g.gain.setTargetAtTime((lv[i] || 0) * k, t, tau); }); },
    stop: function () { var t = AC.currentTime; gains.forEach(function (g) { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, .03); }); oscs.forEach(function (o) { try { o.stop(t + .3); } catch (e) {} }); setTimeout(function () { try { sum.disconnect(); } catch (e) {} }, 600); }
  };
}
/* ---------------- livelli per i meter ---------------- */
function levels() {
  var o = {}; CH.forEach(function (k) { var s = strips[k]; if (!s) { o[k] = 0; return; } s.an.getFloatTimeDomainData(s.buf); var p = 0; for (var i = 0; i < s.buf.length; i++) { var a = Math.abs(s.buf[i]); if (a > p) p = a; } s.peak = Math.max(p, s.peak * .86); o[k] = s.peak; });
  return o;
}

/* ---------------- kit e preset ---------------- */
function loadKit(id, opt) {
  var keepExt = ext; ST = kitState(id); ext = keepExt; applyAll(); save();
  if (hooks.kitLoaded) hooks.kitLoaded(ST, opt || {});
}
function loadPreset(data) { ST = merge(kitState(data.kit || 'studio'), clone(data)); applyAll(); save(); if (hooks.kitLoaded) hooks.kitLoaded(ST, { preset: true }); }
function resetChannel(key) { var base = kitState(ST.kit || 'studio'); ST.mix[key] = base.mix[key]; ST.patch[key] = base.patch[key]; applyStrip(key); save(); }

/* =====================================================================
   INTERFACCIA · cassetto del mixer (in basso, si apre a metà o a tutto schermo)
   ===================================================================== */
var UI = {}, sel = 'piano', uiOpen = false, tab = 'mix';
function h(tag, attrs, kids) { var e = document.createElement(tag); if (attrs) for (var k in attrs) { if (k == 'class') e.className = attrs[k]; else if (k == 'text') e.textContent = attrs[k]; else if (k == 'html') e.innerHTML = attrs[k]; else if (k.slice(0, 2) == 'on') e[k] = attrs[k]; else e.setAttribute(k, attrs[k]); } (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c == 'string' ? document.createTextNode(c) : c); }); return e; }
function fmt(v, unit) {
  if (unit == 'Hz') return v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + ' kHz' : Math.round(v) + ' Hz';
  if (unit == 'dB') return (v > 0 ? '+' : '') + v.toFixed(1) + ' dB';
  if (unit == 's') return v < 1 ? Math.round(v * 1000) + ' ms' : v.toFixed(2) + ' s';
  if (unit == '%') return Math.round(v * 100) + '%';
  if (unit == 'pan') return Math.abs(v) < .03 ? 'C' : (v < 0 ? 'S ' : 'D ') + Math.round(Math.abs(v) * 100);
  if (unit == 'st') return (v > 0 ? '+' : '') + v + ' st';
  if (unit == 'ct') return Math.round(v) + ' ct';
  if (unit == 'x') return '×' + v.toFixed(2);
  if (unit == 'oct') return (v > 0 ? '+' : '') + v;
  return String(Math.round(v * 100) / 100);
}
/* slider con etichetta e valore; log per le frequenze */
function slider(label, get, set, min, max, step, unit, opt) {
  opt = opt || {}; var log = opt.log, val = h('output', { class: 'mxv' }), inp = h('input', { type: 'range', min: 0, max: 1000, step: 1, 'aria-label': label });
  function toPos(v) { return log ? Math.log(v / min) / Math.log(max / min) * 1000 : (v - min) / (max - min) * 1000; }
  function fromPos(p) { var v = log ? min * Math.pow(max / min, p / 1000) : min + (max - min) * p / 1000; if (step) v = Math.round(v / step) * step; return +v.toFixed(4); }
  function sync() { var v = get(); inp.value = toPos(v); val.textContent = fmt(v, unit); }
  inp.oninput = function () { var v = fromPos(+inp.value); set(v); val.textContent = fmt(v, unit); saveSoon(); if (opt.after) opt.after(); };
  inp.ondblclick = function () { if (opt.def != null) { set(opt.def); sync(); saveSoon(); if (opt.after) opt.after(); } };
  var row = h('label', { class: 'mxs' + (opt.cls ? ' ' + opt.cls : ''), title: opt.tip || '' }, [h('span', { class: 'mxl', text: label }), inp, val]);
  row.sync = sync; sync(); return row;
}
function select(label, opts, get, set, tip) {
  var s = h('select', { class: 'mxsel', 'aria-label': label }); opts.forEach(function (o) { s.appendChild(h('option', { value: o[0], text: o[1] })); });
  s.onchange = function () { set(s.value); saveSoon(); }; var row = h('label', { class: 'mxs sel', title: tip || '' }, [h('span', { class: 'mxl', text: label }), s]);
  row.sync = function () { s.value = get(); }; row.sync(); return row;
}
function seg(opts, get, set, cls) {
  var wrap = h('div', { class: 'mxseg ' + (cls || ''), role: 'radiogroup' });
  opts.forEach(function (o) { var b = h('button', { type: 'button', role: 'radio', text: o[1], title: o[2] || '' }); b.dataset.v = o[0]; b.onclick = function () { set(o[0]); wrap.sync(); saveSoon(); }; wrap.appendChild(b); });
  wrap.sync = function () { var v = String(get()); Array.prototype.forEach.call(wrap.children, function (b) { var on = b.dataset.v == v; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); }); };
  wrap.sync(); return wrap;
}
var syncers = [];
function reg(el) { syncers.push(el); return el; }
function syncAll() { syncers.forEach(function (e) { if (e.sync) e.sync(); }); drawStrips(); drawMain(); }

function buildUI(hk) {
  hooks = hk || {};
  if (UI.root) return;
  var css = document.createElement('style'); css.textContent = CSS; document.head.appendChild(css);
  var root = UI.root = h('section', { class: 'mx', id: 'mixer', 'aria-label': 'Mixer', 'data-open': 'false' });
  var grab = h('button', { class: 'mxgrab', type: 'button', 'aria-expanded': 'false', title: 'Apri o chiudi il mixer' }, [h('span', { class: 'mxgbar' }), h('span', { class: 'mxgt', text: 'Mixer' }), UI.kitName = h('span', { class: 'mxgk' }), UI.miniMeter = h('span', { class: 'mxmini' })]);
  grab.onclick = function () { toggle(); };
  var head = h('div', { class: 'mxhead' });
  /* kit */
  UI.kits = h('div', { class: 'mxkits', role: 'radiogroup', 'aria-label': 'Kit' });
  KIT_ORDER.forEach(function (id) { var b = h('button', { type: 'button', role: 'radio', class: 'mxkit' }, [h('b', { text: (KITS[id].name || 'Studio') }), h('small', { text: id == 'studio' ? 'neutro · 90 bpm · 1/4' : KITS[id].bpm + ' bpm · ' + ({ 1: '1/4', 2: '1/8', 4: '1/16' })[KITS[id].div] })]);
    b.dataset.id = id; b.onclick = function () { loadKit(id, { tempo: UI.kitTempo.checked }); syncAll(); }; UI.kits.appendChild(b); });
  UI.kitTempo = h('input', { type: 'checkbox', checked: '' });
  var kitOpts = h('div', { class: 'mxkitopt' }, [h('label', { class: 'mxchk', title: 'Con il kit cambiano anche bpm, valore della casella e swing' }, [UI.kitTempo, ' tempo del kit']),
    h('button', { type: 'button', class: 'mxbtn', text: 'Carica il ritmo d\'esempio', title: 'Mette nella matrice il ritmo tipico del kit (finché la camera non legge la tua)', onclick: function () { if (ST.pattern && hooks.loadPattern) hooks.loadPattern(ST.pattern); } })]);
  /* preset personali */
  UI.pre = h('select', { class: 'mxsel', 'aria-label': 'I miei preset' });
  var preRow = h('div', { class: 'mxpre' }, [UI.pre,
    h('button', { type: 'button', class: 'mxbtn', text: 'Salva', title: 'Salva tutto il mixer come preset personale', onclick: savePreset }),
    h('button', { type: 'button', class: 'mxbtn', text: 'Elimina', onclick: delPreset }),
    h('button', { type: 'button', class: 'mxbtn', text: 'Esporta', title: 'Scarica il preset come file .json', onclick: exportPreset }),
    h('label', { class: 'mxbtn', title: 'Carica un preset .json' }, ['Importa', h('input', { type: 'file', accept: '.json,application/json', hidden: '', onchange: importPreset })])]);
  UI.pre.onchange = function () { var a = userPresets(), p = a[+UI.pre.value]; if (p) { loadPreset(p.data); syncAll(); } };
  head.appendChild(h('div', { class: 'mxblock' }, [h('div', { class: 'mxcap', text: 'Kit' }), UI.kits, kitOpts]));
  head.appendChild(h('div', { class: 'mxblock' }, [h('div', { class: 'mxcap', text: 'I miei preset' }), preRow]));
  /* schede */
  var tabs = seg([['mix', 'Canali'], ['tune', 'Accordatura e lettura'], ['master', 'Master ed effetti']], function () { return tab; }, function (v) { tab = v; showTab(); }, 'mxtabs');
  UI.tabs = tabs;
  var body = UI.body = h('div', { class: 'mxbody' });
  UI.pMix = h('div', { class: 'mxpane' }); UI.pTune = h('div', { class: 'mxpane' }); UI.pMaster = h('div', { class: 'mxpane' });
  body.appendChild(UI.pMix); body.appendChild(UI.pTune); body.appendChild(UI.pMaster);
  var inner = h('div', { class: 'mxin' }, [head, tabs, body]);
  root.appendChild(grab); root.appendChild(inner);
  document.body.appendChild(root);
  buildMix(); buildTune(); buildMaster(); refreshPresets(); showTab(); syncKit();
  requestAnimationFrame(meterLoop);
}
function toggle(force) {
  uiOpen = force == null ? !uiOpen : force; UI.root.dataset.open = uiOpen ? 'true' : 'false'; UI.root.querySelector('.mxgrab').setAttribute('aria-expanded', uiOpen);
  document.documentElement.classList.toggle('mx-open', uiOpen); if (hooks.opened) hooks.opened(uiOpen);
}
function showTab() { UI.pMix.hidden = tab != 'mix'; UI.pTune.hidden = tab != 'tune'; UI.pMaster.hidden = tab != 'master'; UI.tabs.sync(); }
function syncKit() { Array.prototype.forEach.call(UI.kits.children, function (b) { var on = b.dataset.id == ST.kit && !ST.custom; b.classList.toggle('on', b.dataset.id == ST.kit); b.setAttribute('aria-checked', b.dataset.id == ST.kit); }); UI.kitName.textContent = (ST.presetName ? ST.presetName + ' · ' : '') + (ST.name || 'Studio'); }
function refreshPresets() { var a = userPresets(); UI.pre.innerHTML = ''; UI.pre.appendChild(h('option', { value: '', text: a.length ? 'Scegli un preset…' : 'Nessun preset salvato' })); a.forEach(function (p, i) { UI.pre.appendChild(h('option', { value: i, text: p.name })); }); }
function savePreset() {
  var name = (window.prompt('Nome del preset', (ST.name || 'Kit') + ' · mio') || '').trim(); if (!name) return;
  var a = userPresets(), d = clone(ST); d.presetName = name; var i = a.findIndex ? a.findIndex(function (p) { return p.name == name; }) : -1;
  if (i >= 0) a[i] = { name: name, data: d }; else a.push({ name: name, data: d }); setUserPresets(a); ST.presetName = name; save(); refreshPresets(); syncKit(); if (hooks.toast) hooks.toast('Preset "' + name + '" salvato in questo browser');
}
function delPreset() { var a = userPresets(), i = +UI.pre.value; if (UI.pre.value === '' || !a[i]) { if (hooks.toast) hooks.toast('Scegli prima un preset dalla lista'); return; } var n = a[i].name; a.splice(i, 1); setUserPresets(a); refreshPresets(); if (hooks.toast) hooks.toast('Preset "' + n + '" eliminato'); }
function exportPreset() { var d = clone(ST), blob = new Blob([JSON.stringify({ app: 'lettore-disegni-v4', name: ST.presetName || ST.name, data: d }, null, 1)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'preset-' + String(ST.presetName || ST.name || 'kit').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json'; a.click(); }
function importPreset(e) { var f = e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = function () { try { var j = JSON.parse(r.result), d = j.data || j; if (!d.mix || !d.patch) throw 0; d.presetName = j.name || d.presetName || f.name.replace(/\.json$/, ''); var a = userPresets(); a.push({ name: d.presetName, data: d }); setUserPresets(a); loadPreset(d); refreshPresets(); syncAll(); if (hooks.toast) hooks.toast('Preset importato'); } catch (x) { if (hooks.toast) hooks.toast('Questo file non è un preset del lettore'); } }; r.readAsText(f); e.target.value = ''; }

/* ---------- scheda Canali: strisce semplici + slot main ---------- */
function buildMix() {
  var P = UI.pMix;
  P.appendChild(h('p', { class: 'mxhint', html: 'Ogni colore e ogni forma ha il suo canale. <b>Volume</b>, <b>Tono</b> (scuro ↔ brillante), <b>Spazio</b> (riverbero) e <b>Eco</b> (delay) bastano per mettere d\'accordo i suoni. Tocca <b>Apri</b> per lo slot main con tutti i dettagli. Doppio clic su un cursore = valore del kit.' }));
  UI.strips = h('div', { class: 'mxstrips' }); P.appendChild(UI.strips);
  UI.main = h('div', { class: 'mxmain' }); P.appendChild(UI.main);
  CH.forEach(function (k) { UI.strips.appendChild(stripEl(k)); });
  buildMain();
}
function toneOf(k) { return ST.mix[k].high - Math.min(0, ST.mix[k].low) * 0; }
function stripEl(k) {
  var m = function () { return ST.mix[k]; }, el = h('div', { class: 'mxstrip', 'data-k': k });
  var nm = h('div', { class: 'mxsn' }, [h('i', DRUM.indexOf(k) >= 0 ? {} : { style: 'background:' + COLORS[k] }), h('b', { text: NAMES[k] })]);
  if (DRUM.indexOf(k) >= 0) nm.firstChild.className = 'sh sh-' + ['circle', 'tri', 'diamond', 'rect'][DRUM.indexOf(k)];
  var meter = h('div', { class: 'mxmeter' }, [h('span')]);
  var fader = slider('Volume', function () { return m().vol; }, function (v) { m().vol = v; applyStrip(k); }, 0, 1.2, .01, '%', { def: .8, cls: 'vfader' });
  var tone = slider('Tono', function () { return m().high; }, function (v) { m().high = v; m().low = -v * .5; applyStrip(k); }, -12, 12, .5, 'dB', { def: 0, tip: 'Scuro ↔ brillante (alti su, bassi giù)' });
  var space = slider('Spazio', function () { return m().rev; }, function (v) { m().rev = v; applyStrip(k); }, 0, 1, .01, '%', { def: .12, tip: 'Riverbero' });
  var echo = slider('Eco', function () { return m().dly; }, function (v) { m().dly = v; applyStrip(k); }, 0, 1, .01, '%', { def: 0, tip: 'Delay a tempo' });
  var pan = slider('Pan', function () { return m().pan; }, function (v) { m().pan = v; applyStrip(k); }, -1, 1, .05, 'pan', { def: 0, tip: 'Sinistra ↔ destra' });
  var ms = h('div', { class: 'mxms' }, [
    h('button', { type: 'button', class: 'mxm', text: 'M', title: 'Muto', onclick: function () { m().mute = !m().mute; applyMutes(); drawStrips(); saveSoon(); } }),
    h('button', { type: 'button', class: 'mxso', text: 'S', title: 'Solo', onclick: function () { m().solo = !m().solo; applyMutes(); drawStrips(); saveSoon(); } }),
    h('button', { type: 'button', class: 'mxopen', text: 'Apri', title: 'Apri nello slot main', onclick: function () { sel = k; buildMain(); drawStrips(); UI.main.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } })]);
  [fader, tone, space, echo, pan].forEach(reg);
  el.appendChild(nm); el.appendChild(meter); el.appendChild(fader); el.appendChild(tone); el.appendChild(space); el.appendChild(echo); el.appendChild(pan); el.appendChild(ms);
  el.meter = meter.firstChild; return el;
}
function drawStrips() {
  if (!UI.strips) return; var so = soloOn();
  Array.prototype.forEach.call(UI.strips.children, function (el) { var k = el.dataset.k, m = ST.mix[k];
    el.classList.toggle('sel', k == sel); el.querySelector('.mxm').classList.toggle('on', m.mute || extMuted(k)); el.querySelector('.mxm').title = extMuted(k) ? 'Muto dal tappetino/gemello' : 'Muto';
    el.querySelector('.mxso').classList.toggle('on', m.solo); el.classList.toggle('dim', !audible(k)); });
  syncKit();
}
/* slot main: tutti i parametri del canale scelto, divisi per sezioni come su un synth */
function buildMain() {
  var k = sel, M = UI.main, m = ST.mix[k], isD = DRUM.indexOf(k) >= 0, isS = k == 'sono';
  M.innerHTML = '';
  var P = function () { return ST.patch[k]; }, X = function () { return ST.mix[k]; };
  function ap() { applyStrip(k); drawMain(); }
  var head = h('div', { class: 'mxmh' }, [h('i', { class: 'mxdot', style: 'background:' + COLORS[k] }), h('h4', { text: 'Slot main · ' + NAMES[k] }),
    h('span', { class: 'mxsub', text: isD ? 'percussione' : isS ? 'lettura Sonograf' : 'strumento · colore ' + ({ flute: 'verde', violin: 'giallo', piano: 'blu', guitar: 'rosso', bass: 'nero' })[k] }),
    h('button', { type: 'button', class: 'mxbtn acc', text: '▶ Ascolta', onclick: function () { audition(k); } }),
    h('button', { type: 'button', class: 'mxbtn', text: 'Valori del kit', title: 'Riporta questo canale ai valori del kit', onclick: function () { resetChannel(k); buildMain(); syncAll(); } })]);
  M.appendChild(head);
  var grid = h('div', { class: 'mxgrid' }); M.appendChild(grid);
  function sec(title, kids, cls) { var c = h('div', { class: 'mxsec ' + (cls || '') }, [h('div', { class: 'mxcap', text: title })].concat(kids)); grid.appendChild(c); kids.forEach(reg); return c; }
  if (!isD && !isS) {
    sec('Sorgente', [
      select('Forma d\'onda', WAVES, function () { return P().wave; }, function (v) { P().wave = v; }),
      slider('Ottava', function () { return P().oct; }, function (v) { P().oct = v; }, -2, 2, 1, 'oct', { def: 0 }),
      slider('Voci', function () { return P().uni; }, function (v) { P().uni = v; }, 1, 4, 1, '', { def: 1, tip: 'Unisono: più oscillatori leggermente stonati = suono più largo' }),
      slider('Stonatura', function () { return P().det; }, function (v) { P().det = v; }, 0, 40, 1, 'ct', { def: 0 }),
      slider('Sub', function () { return P().sub; }, function (v) { P().sub = v; }, 0, 1, .01, '%', { def: 0, tip: 'Oscillatore un\'ottava sotto' }),
      slider('Soffio', function () { return P().noise; }, function (v) { P().noise = v; }, 0, 1, .01, '%', { def: 0, tip: 'Rumore intonato (fiato, archetto)' }),
      slider('Livello', function () { return P().lvl; }, function (v) { P().lvl = v; }, 0, .8, .01, '%', { def: .3 })
    ]);
    UI.adsr = h('canvas', { class: 'mxcv', width: 320, height: 90 });
    sec('Inviluppo', [UI.adsr,
      slider('Attacco', function () { return P().a; }, function (v) { P().a = v; drawMain(); }, .001, 2, 0, 's', { log: true, def: .01 }),
      slider('Decadimento', function () { return P().d; }, function (v) { P().d = v; drawMain(); }, .02, 3, 0, 's', { log: true, def: .3 }),
      slider('Sostegno', function () { return P().s; }, function (v) { P().s = v; drawMain(); }, 0, 1, .01, '%', { def: 1 }),
      slider('Rilascio', function () { return P().r; }, function (v) { P().r = v; drawMain(); }, .01, 3, 0, 's', { log: true, def: .15 })
    ]);
    sec('Filtro', [
      slider('Taglio', function () { return P().cut; }, function (v) { P().cut = v; }, 120, 18000, 0, 'Hz', { log: true, def: 12000 }),
      slider('Risonanza', function () { return P().res; }, function (v) { P().res = v; }, .3, 14, .1, '', { def: .7 }),
      slider('Inviluppo filtro', function () { return P().fenv; }, function (v) { P().fenv = v; }, 0, 5, .1, 'oct', { def: 0, tip: 'Quanto si apre il filtro all\'attacco (ottave)' }),
      slider('Chiusura', function () { return P().fdec; }, function (v) { P().fdec = v; }, .02, 2, 0, 's', { log: true, def: .3 })
    ]);
    sec('Movimento', [
      slider('Vibrato', function () { return P().vib; }, function (v) { P().vib = v; }, 0, 50, 1, 'ct', { def: 0 }),
      slider('Velocità vibrato', function () { return P().vibR; }, function (v) { P().vibR = v; }, 1, 9, .1, '', { def: 5 }),
      slider('Glide', function () { return P().glide; }, function (v) { P().glide = v; }, 0, .4, .005, 's', { def: 0, tip: 'Portamento: la nota scivola dalla precedente' }),
      slider('Pompa (sidechain)', function () { return X().pump; }, function (v) { X().pump = v; }, 0, 1, .01, '%', { def: 0, tip: 'Il volume si abbassa a ogni colpo di cassa' })
    ]);
  } else if (isD) {
    sec('Suono', [
      slider('Intonazione', function () { return P().tune; }, function (v) { P().tune = v; }, -12, 12, 1, 'st', { def: 0 }),
      slider('Durata', function () { return P().decay; }, function (v) { P().decay = v; }, .3, 3, .05, 'x', { def: 1 }),
      slider('Colore', function () { return P().tone; }, function (v) { P().tone = v; }, -1, 1, .05, '', { def: 0, tip: 'Scuro ↔ brillante' }),
      slider(k == 'kick' ? 'Attacco (click)' : 'Corpo', function () { return P().punch; }, function (v) { P().punch = v; }, 0, 1, .01, '%', { def: .3 }),
      slider('Rumore', function () { return P().noise; }, function (v) { P().noise = v; }, 0, 1, .01, '%', { def: .5 }),
      slider('Livello', function () { return P().lvl; }, function (v) { P().lvl = v; }, 0, 1.5, .01, '%', { def: 1 })
    ].concat(k == 'kick' ? [h('label', { class: 'mxchk' }, [(function () { var c = h('input', { type: 'checkbox' }); c.checked = !!P().e808; c.onchange = function () { P().e808 = c.checked; saveSoon(); }; return c; })(), ' 808 (coda lunga e grave)'])] : []));
  } else {
    sec('Banco di oscillatori', [
      select('Timbro', [['sine', 'Sinusoidi (puro)'], ['organ', 'Organo'], ['glass', 'Vetro']], function () { return P().wave; }, function (v) { P().wave = v; if (hooks.sonoRebuild) hooks.sonoRebuild(); }),
      slider('Livello', function () { return P().lvl; }, function (v) { P().lvl = v; }, 0, 1.2, .01, '%', { def: .5 }),
      slider('Morbidezza', function () { return P().smooth; }, function (v) { P().smooth = v; }, 0, 1, .01, '%', { def: .5, tip: 'Quanto lentamente il volume segue il disegno' })
    ]);
  }
  UI.eq = h('canvas', { class: 'mxcv', width: 320, height: 90 });
  sec('EQ e dinamica', [UI.eq,
    slider('Passa-alto', function () { return X().hp; }, function (v) { X().hp = v; ap(); }, 20, 1200, 0, 'Hz', { log: true, def: 20, tip: 'Toglie i bassi inutili' }),
    slider('Bassi', function () { return X().low; }, function (v) { X().low = v; ap(); }, -15, 15, .5, 'dB', { def: 0 }),
    slider('Medi', function () { return X().mid; }, function (v) { X().mid = v; ap(); }, -15, 15, .5, 'dB', { def: 0 }),
    slider('Frequenza medi', function () { return X().midF; }, function (v) { X().midF = v; ap(); }, 200, 6000, 0, 'Hz', { log: true, def: 900 }),
    slider('Alti', function () { return X().high; }, function (v) { X().high = v; ap(); }, -15, 15, .5, 'dB', { def: 0 }),
    slider('Drive', function () { return X().drive; }, function (v) { X().drive = v; ap(); }, 0, 1, .01, '%', { def: 0, tip: 'Saturazione calda' }),
    slider('Compressione', function () { return X().comp; }, function (v) { X().comp = v; ap(); }, 0, 1, .01, '%', { def: 0 })
  ], 'wide');
  sec('Uscita', [
    slider('Volume', function () { return X().vol; }, function (v) { X().vol = v; ap(); }, 0, 1.2, .01, '%', { def: .8 }),
    slider('Pan', function () { return X().pan; }, function (v) { X().pan = v; ap(); }, -1, 1, .05, 'pan', { def: 0 }),
    slider('Riverbero', function () { return X().rev; }, function (v) { X().rev = v; ap(); }, 0, 1, .01, '%', { def: .12 }),
    slider('Delay', function () { return X().dly; }, function (v) { X().dly = v; ap(); }, 0, 1, .01, '%', { def: 0 })
  ]);
  drawMain();
}
function audition(k) {
  if (hooks.ensureAudio) hooks.ensureAudio(); if (!AC) return; var t = AC.currentTime + .03, i = INST.indexOf(k);
  if (i >= 0) { var base = { flute: 72, violin: 69, piano: 60, guitar: 55, bass: 36 }[k]; [0, 4, 7].forEach(function (d, q) { playNote(i, base + d, t + q * .28, .25); }); playNote(i, base + 12, t + .9, .7); }
  else if (DRUM.indexOf(k) >= 0) { var di = DRUM.indexOf(k); [0, .25, .5, .62].forEach(function (d, q) { playDrum(di, t + d, q == 3 ? .6 : 1); }); }
  else if (hooks.sonoDemo) hooks.sonoDemo();
}
function drawMain() {
  if (UI.adsr && document.contains(UI.adsr) && INST.indexOf(sel) >= 0) {
    var c = UI.adsr, x = c.getContext('2d'), P = ST.patch[sel], W = c.width, H = c.height, tot = P.a + P.d + .6 + P.r, sx = function (t) { return 8 + t / tot * (W - 16); }, sy = function (v) { return H - 8 - v * (H - 18); };
    x.clearRect(0, 0, W, H); x.strokeStyle = '#d8d5cc'; x.lineWidth = 1; x.beginPath(); x.moveTo(8, H - 8); x.lineTo(W - 8, H - 8); x.stroke();
    x.strokeStyle = '#ff5a1f'; x.lineWidth = 2; x.beginPath(); x.moveTo(sx(0), sy(0)); x.lineTo(sx(P.a), sy(1)); x.lineTo(sx(P.a + P.d), sy(P.s)); x.lineTo(sx(P.a + P.d + .6), sy(P.s)); x.lineTo(sx(tot), sy(0)); x.stroke();
    x.fillStyle = '#6a6862'; x.font = '10px ui-monospace,Menlo,monospace'; ['A', 'D', 'S', 'R'].forEach(function (l, q) { x.fillText(l, sx([P.a / 2, P.a + P.d / 2, P.a + P.d + .3, P.a + P.d + .6 + P.r / 2][q]) - 3, 12); });
  }
  if (UI.eq && document.contains(UI.eq) && AC && strips[sel]) {
    var c2 = UI.eq, y = c2.getContext('2d'), W2 = c2.width, H2 = c2.height, n = 160, fr = new Float32Array(n), mag = new Float32Array(n), ph = new Float32Array(n), tot2 = new Float32Array(n).fill(0), s = strips[sel];
    for (var i = 0; i < n; i++) fr[i] = 20 * Math.pow(1000, i / (n - 1));
    var X = ST.mix[sel];
    /* uso i valori del pannello (i nodi si muovono con un piccolo ritardo) */
    [['highpass', X.hp, .7, 0], ['lowshelf', 160, 0, X.low], ['peaking', X.midF, X.midQ, X.mid], ['highshelf', 6000, 0, X.high]].forEach(function (b) {
      var f = AC.createBiquadFilter(); f.type = b[0]; f.frequency.value = b[1]; if (b[0] == 'highpass' || b[0] == 'peaking') f.Q.value = b[2]; f.gain.value = b[3]; f.getFrequencyResponse(fr, mag, ph); for (var q = 0; q < n; q++) tot2[q] += 20 * Math.log10(Math.max(1e-4, mag[q])); });
    y.clearRect(0, 0, W2, H2); y.strokeStyle = '#e4e1d9'; y.lineWidth = 1; [100, 1000, 10000].forEach(function (f) { var xx = Math.log(f / 20) / Math.log(1000) * W2; y.beginPath(); y.moveTo(xx, 0); y.lineTo(xx, H2); y.stroke(); });
    y.beginPath(); y.moveTo(0, H2 / 2); y.lineTo(W2, H2 / 2); y.stroke();
    y.strokeStyle = '#161616'; y.lineWidth = 2; y.beginPath(); for (var q2 = 0; q2 < n; q2++) { var xx2 = q2 / (n - 1) * W2, yy = H2 / 2 - Math.max(-18, Math.min(18, tot2[q2])) / 18 * (H2 / 2 - 6); if (q2) y.lineTo(xx2, yy); else y.moveTo(xx2, yy); } y.stroke();
    y.fillStyle = '#6a6862'; y.font = '10px ui-monospace,Menlo,monospace'; y.fillText('100', Math.log(5) / Math.log(1000) * W2 + 3, H2 - 4); y.fillText('1k', Math.log(50) / Math.log(1000) * W2 + 3, H2 - 4); y.fillText('10k', Math.log(500) / Math.log(1000) * W2 + 3, H2 - 4);
  }
}
/* ---------- scheda Accordatura e lettura ---------- */
function buildTune() {
  var P = UI.pTune, T = function () { return hooks.tuning ? hooks.tuning() : {}; }, set = function (k, v) { if (hooks.setTuning) hooks.setTuning(k, v); syncTune(); };
  var g = h('div', { class: 'mxgrid' }); P.appendChild(g);
  function sec(title, kids, cls, note) { var c = h('div', { class: 'mxsec ' + (cls || '') }, [h('div', { class: 'mxcap', text: title })].concat(kids, note ? [h('p', { class: 'mxhint', html: note })] : [])); g.appendChild(c); kids.forEach(function (k) { if (k.sync) UI.tuneSync.push(k); }); return c; }
  UI.tuneSync = [];
  var KEYS = ['Do', 'Do#', 'Re', 'Mib', 'Mi', 'Fa', 'Fa#', 'Sol', 'Lab', 'La', 'Sib', 'Si'];
  sec('Lettura del foglio', [seg([['note', 'Note', 'Pallini e linee: ogni segno è una nota della scala'], ['tratto', 'Tratto', 'Il suono segue il tratto: continuo, spessore = volume, le forme si dividono'], ['sonograf', 'Sonograf', 'Ogni riga è un oscillatore: più è scuro, più suona']], function () { return T().read; }, function (v) { set('read', v); }, 'big')], 'wide',
    '<b>Note</b>: come prima, ogni segno è una nota. <b>Tratto</b>: il suono dura quanto il segno, un segno piccolo suona piano e uno grande forte, un rombo in piedi si divide in due voci e si richiude. <b>Sonograf</b>: come lo strumento dei Playmodes, ogni altezza è un oscillatore e il nero decide il volume (il colore non conta).');
  sec('Tonalità', [seg(KEYS.map(function (n, i) { return [i, n]; }), function () { return T().key; }, function (v) { set('key', +v); }, 'keys')]);
  var scales = hooks.scales ? hooks.scales() : [];
  sec('Scala', [select('Scala', scales.map(function (s, i) { return [i, s.name + (s.hint ? ' · ' + s.hint : '')]; }), function () { return T().scale; }, function (v) { set('scale', +v); }),
    select('Altezza sul foglio', [['bands', 'Fasce uguali: una per ogni nota della scala'], ['keys', 'Tasti: cromatico, poi la nota più vicina della scala']], function () { return T().map; }, function (v) { set('map', v); }),
    select('Tratto: intonazione', [['auto', 'Autotune: ogni tratto sulle note giuste dell\'armonia (consigliato)'], ['scale', 'Agganciata alla scala (scivola tra le note)'], ['free', 'Libera (glissando continuo, come il tratto)']], function () { return T().trattoPitch; }, function (v) { set('trattoPitch', v); })], '',
    'Con le <b>fasce uguali</b> ogni nota della scala ha la stessa altezza sul foglio: è più facile centrare le note e tutto resta intonato.');
  var progs = hooks.progs ? hooks.progs() : [];
  sec('Armonia', [select('Giro di accordi', progs.map(function (p, i) { return [i, p.name]; }), function () { return T().prog; }, function (v) { set('prog', +v); }),
    select('Le note seguono gli accordi', [['off', 'No: tutte le note della scala'], ['melody', 'Sì, morbido: le note scivolano sulla nota dell\'accordo più vicina'], ['strict', 'Sì, sempre: solo note dell\'accordo']], function () { return T().follow; }, function (v) { set('follow', v); }),
    h('label', { class: 'mxchk' }, [(function () { var c = h('input', { type: 'checkbox' }); c.onchange = function () { set('bassRoot', c.checked); }; c.sync = function () { c.checked = !!T().bassRoot; }; UI.tuneSync.push(c); return c; })(), ' il basso (nero) suona la fondamentale dell\'accordo'])], '',
    'Un accordo per battuta (16 colonne del foglio). Con il giro attivo, anche disegnando a caso tutto suona bene insieme.');
  sec('Tempo e groove', [
    slider('BPM', function () { return T().bpm; }, function (v) { set('bpm', v); }, 50, 480, 1, '', { def: 90 }),
    select('Una casella della matrice vale', [[1, '1/4 · un battito (come prima)'], [2, '1/8 · mezzo battito'], [4, '1/16 · un quarto di battito']], function () { return String(T().div); }, function (v) { set('div', +v); }),
    slider('Swing', function () { return T().swing; }, function (v) { set('swing', v); }, 0, .5, .01, '%', { def: 0, tip: 'Ritarda le caselle pari: groove hip hop / house' })
  ], '', 'Il foglio dura sempre quanto la matrice (16 caselle). Con 1/16 a 120 bpm il giro dura una battuta: più veloce, come le basi vere.');
  syncTune();
}
function syncTune() { (UI.tuneSync || []).forEach(function (e) { if (e.sync) e.sync(); }); }
/* ---------- scheda Master ---------- */
function buildMaster() {
  var P = UI.pMaster, M = function () { return ST.master; };
  var g = h('div', { class: 'mxgrid' }); P.appendChild(g);
  function sec(title, kids, note) { g.appendChild(h('div', { class: 'mxsec' }, [h('div', { class: 'mxcap', text: title })].concat(kids, note ? [h('p', { class: 'mxhint', html: note })] : []))); kids.forEach(reg); }
  sec('Uscita', [
    slider('Volume generale', function () { return M().vol; }, function (v) { M().vol = v; applyMaster(); if (hooks.volume) hooks.volume(v); }, 0, 1.2, .01, '%', { def: .85 }),
    slider('Bassi master', function () { return M().low; }, function (v) { M().low = v; applyMaster(); }, -10, 10, .5, 'dB', { def: 0 }),
    slider('Alti master', function () { return M().high; }, function (v) { M().high = v; applyMaster(); }, -10, 10, .5, 'dB', { def: 0 }),
    slider('Colla (compressore)', function () { return M().glue; }, function (v) { M().glue = v; applyMaster(); }, 0, 1, .01, '%', { def: .25, tip: 'Tiene insieme il mix' })
  ], 'Dopo la colla c\'è un limitatore: il volume non va mai in distorsione.');
  sec('Riverbero', [
    slider('Grandezza', function () { return M().revSize; }, function (v) { M().revSize = v; applyMaster(); }, 0, 1, .01, '%', { def: .45 }),
    slider('Colore', function () { return M().revTone; }, function (v) { M().revTone = v; applyMaster(); }, 0, 1, .01, '%', { def: .6 })
  ]);
  sec('Delay a tempo', [
    select('Tempo', [['1/16', '1/16'], ['1/8', '1/8'], ['1/8.', '1/8 puntato'], ['1/4', '1/4'], ['1/4.', '1/4 puntato']], function () { return M().dlyTime; }, function (v) { M().dlyTime = v; applyMaster(); }),
    slider('Ripetizioni', function () { return M().dlyFb; }, function (v) { M().dlyFb = v; applyMaster(); }, 0, .85, .01, '%', { def: .3 }),
    slider('Colore', function () { return M().dlyTone; }, function (v) { M().dlyTone = v; applyMaster(); }, 0, 1, .01, '%', { def: .6 })
  ]);
  UI.mMeter = h('div', { class: 'mxbig' }, [h('span')]);
  g.appendChild(h('div', { class: 'mxsec' }, [h('div', { class: 'mxcap', text: 'Livello in uscita' }), UI.mMeter, h('p', { class: 'mxhint', text: 'Verde: bene. Arancio: forte. Se resta rosso abbassa i canali, non il master.' })]));
}
function meterLoop() {
  requestAnimationFrame(meterLoop);
  if (!AC || !UI.root) return;
  var lv = levels(), mx = 0;
  if (uiOpen && UI.strips) Array.prototype.forEach.call(UI.strips.children, function (el) { var v = lv[el.dataset.k], db = v > 0 ? 20 * Math.log10(v) : -60, p = Math.max(0, Math.min(1, (db + 48) / 48)); el.meter.style.height = (p * 100).toFixed(1) + '%'; el.meter.className = db > -3 ? 'hot' : db > -10 ? 'warm' : ''; });
  CH.forEach(function (k) { mx = Math.max(mx, lv[k]); });
  var db2 = mx > 0 ? 20 * Math.log10(mx) : -60, p2 = Math.max(0, Math.min(1, (db2 + 48) / 48));
  UI.miniMeter.style.setProperty('--l', p2.toFixed(3));
  if (UI.mMeter && uiOpen) { UI.mMeter.firstChild.style.width = (p2 * 100).toFixed(1) + '%'; UI.mMeter.firstChild.className = db2 > -3 ? 'hot' : db2 > -10 ? 'warm' : ''; }
}

var CSS = '' +
'.mx{position:fixed;left:0;right:0;bottom:0;z-index:40;background:rgba(247,246,243,.96);-webkit-backdrop-filter:saturate(1.4) blur(18px);backdrop-filter:saturate(1.4) blur(18px);border-top:1px solid var(--line,#d6d4cd);box-shadow:0 -12px 40px rgba(0,0,0,.08);transform:translateY(calc(100% - 44px));transition:transform .35s cubic-bezier(.2,.8,.2,1);max-height:88vh;display:flex;flex-direction:column;border-radius:18px 18px 0 0}' +
'.mx[data-open=true]{transform:none}' +
'.mxgrab{all:unset;cursor:pointer;display:flex;align-items:center;gap:12px;height:44px;padding:0 20px;flex:none;position:relative}' +
'.mxgrab:focus-visible{outline:2px solid #ff5a1f;outline-offset:-2px;border-radius:18px 18px 0 0}' +
'.mxgbar{position:absolute;left:50%;top:6px;width:38px;height:4px;margin-left:-19px;border-radius:2px;background:#c9c5bb}' +
'.mxgt{font:700 13px/1 var(--f);letter-spacing:.14em;text-transform:uppercase}' +
'.mxgk{font:12px var(--mono);color:var(--muted,#6a6862)}' +
'.mxmini{margin-left:auto;width:90px;height:6px;border-radius:3px;background:#e2dfd7;position:relative;overflow:hidden}' +
'.mxmini::after{content:"";position:absolute;inset:0;transform-origin:left;transform:scaleX(var(--l,0));background:linear-gradient(90deg,#1f9d55 0 70%,#d08a00 70% 88%,#d23a2a 88%)}' +
'.mxin{overflow:auto;padding:4px 20px 28px;display:flex;flex-direction:column;gap:14px;overscroll-behavior:contain}' +
'.mxin>*,.mxpane,.mxmain,.mxbody,.mxhead>*{min-width:0;max-width:100%}.mxin{overflow-x:hidden}' +
'@media (max-width:560px){.mxgrid{grid-template-columns:minmax(0,1fr)}.mxsec.wide{grid-column:auto}}' +
'.mxhead{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:14px}' +
'@media (max-width:900px){.mxhead{grid-template-columns:minmax(0,1fr)}}' +
'.mxblock{background:#fff;border:1px solid var(--line,#d6d4cd);border-radius:14px;padding:12px;min-width:0}' +
'.mxcap{font:700 11px/1 var(--f);letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#6a6862);margin-bottom:10px}' +
'.mxkits{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}' +
'@media (max-width:560px){.mxkits{grid-template-columns:repeat(3,minmax(0,1fr))}}' +
'.mxkit{border:1px solid var(--line,#d6d4cd);background:#faf9f6;border-radius:12px;padding:10px 8px;cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:2px;min-width:0}' +
'.mxkit b{font-size:14px}.mxkit small{font:11px var(--mono);color:var(--muted,#6a6862);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
'.mxkit.on{background:#161616;color:#fff;border-color:#161616}.mxkit.on small{color:#bdb8ad}' +
'.mxkitopt,.mxpre{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}.mxpre{margin-top:0}.mxpre .mxsel{flex:1 1 160px;min-width:0}' +
'.mxbtn{border:1px solid var(--line,#d6d4cd);background:#fff;border-radius:10px;padding:7px 11px;min-height:36px;cursor:pointer;font-size:13px;font-weight:600;display:inline-flex;align-items:center}' +
'.mxbtn.acc{background:#ff5a1f;border-color:#ff5a1f;color:#fff}' +
'.mxchk{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--ink,#161616)}' +
'.mxseg{display:flex;flex-wrap:wrap;gap:4px;background:#fff;border:1px solid var(--line,#d6d4cd);border-radius:12px;padding:3px}' +
'.mxseg button{border:0;background:transparent;border-radius:9px;padding:7px 12px;font-size:13px;font-weight:600;color:var(--muted,#6a6862);cursor:pointer;flex:1 0 auto}' +
'.mxseg button.on{background:#161616;color:#fff}' +
'.mxseg.mxtabs{align-self:flex-start;max-width:100%}' +
'.mxseg.keys button{flex:1 0 40px;padding:7px 4px;font-family:var(--mono)}' +
'.mxseg.big button{padding:10px 14px;font-size:14px}' +
'.mxhint{font-size:12.5px;color:var(--muted,#6a6862);margin:8px 0 0;line-height:1.45}' +
'.mxstrips{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(124px,1fr);gap:8px;overflow-x:auto;padding-bottom:6px}' +
'.mxstrip{background:#fff;border:1px solid var(--line,#d6d4cd);border-radius:14px;padding:10px 10px 8px;display:flex;flex-direction:column;gap:4px;position:relative;min-width:0}' +
'.mxstrip.sel{border-color:#161616;box-shadow:0 0 0 1px #161616}.mxstrip.dim{opacity:.55}' +
'.mxsn{display:flex;align-items:center;gap:7px;font-size:13px;min-width:0}.mxsn b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
'.mxsn i{width:11px;height:11px;border-radius:50%;flex:none;display:inline-block}' +
'.mxsn i.sh{background:#141414}.mxsn i.sh-rect{border-radius:1px;width:8px;height:12px}.mxsn i.sh-diamond{border-radius:1px;width:9px;height:9px;transform:rotate(45deg)}.mxsn i.sh-tri{border-radius:0;background:none;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:11px solid #141414}' +
'.mxmeter{position:absolute;right:6px;top:34px;bottom:46px;width:4px;border-radius:2px;background:#ecebe6;overflow:hidden;display:flex;align-items:flex-end}' +
'.mxmeter span{display:block;width:100%;height:0;background:#1f9d55;transition:height .05s}.mxmeter span.warm{background:#d08a00}.mxmeter span.hot{background:#d23a2a}' +
'.mxs{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:6px;font-size:12px;min-width:0}' +
'.mxstrip .mxs{grid-template-columns:minmax(0,1fr) auto;padding-right:8px}.mxstrip .mxs input{grid-column:1/-1;grid-row:2}.mxstrip .mxs{row-gap:0}' +
'.mxl{color:var(--muted,#6a6862);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
'.mxv{font:11.5px var(--mono);color:var(--ink,#161616);text-align:right;white-space:nowrap}' +
'.mxs input[type=range]{width:100%;min-width:0;accent-color:#ff5a1f;height:22px;margin:0}' +
'.mxs.vfader .mxl{font-weight:700;color:var(--ink,#161616)}' +
'.mxsel{border:1px solid var(--line,#d6d4cd);background:#fff;border-radius:10px;padding:6px 8px;min-height:34px;font-size:13px;min-width:0;max-width:100%}' +
'.mxsec .mxs{grid-template-columns:minmax(5.5em,7.5em) minmax(0,1fr) 4.4em}.mxsec .mxs .mxl{white-space:normal;line-height:1.2}' +
'.mxsec .mxs.sel,.mxs.sel{grid-template-columns:minmax(0,1fr);gap:4px}.mxs.sel .mxsel{width:100%}' +
'.mxs input[type=range]{-webkit-appearance:none;appearance:none;background:transparent;cursor:pointer}' +
'.mxs input[type=range]::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:#dedad1}' +
'.mxs input[type=range]::-moz-range-track{height:4px;border-radius:2px;background:#dedad1}' +
'.mxs input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:1.5px solid #161616;margin-top:-6px;box-shadow:0 1px 2px rgba(0,0,0,.15)}' +
'.mxs input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#fff;border:1.5px solid #161616}' +
'.mxs input[type=range]:focus-visible::-webkit-slider-thumb{outline:2px solid #ff5a1f;outline-offset:2px}' +
'.mxs.vfader input[type=range]::-webkit-slider-thumb{background:#ff5a1f;border-color:#ff5a1f}.mxs.vfader input[type=range]::-moz-range-thumb{background:#ff5a1f;border-color:#ff5a1f}' +
'.mxseg.keys{display:grid;grid-template-columns:repeat(6,minmax(0,1fr))}' +
'.mxms{display:grid;grid-template-columns:1fr 1fr 1.6fr;gap:4px;margin-top:4px;padding-right:8px}' +
'.mxms button{border:1px solid var(--line,#d6d4cd);background:#faf9f6;border-radius:8px;min-height:30px;font:700 12px var(--f);cursor:pointer}' +
'.mxms .mxm.on{background:#d23a2a;color:#fff;border-color:#d23a2a}.mxms .mxso.on{background:#e8b90c;border-color:#e8b90c}.mxms .mxopen{background:#161616;color:#fff;border-color:#161616}' +
'.mxmain{background:#fff;border:1px solid var(--line,#d6d4cd);border-radius:16px;padding:14px;margin-top:10px}' +
'.mxmh{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}.mxmh h4{margin:0;font-size:16px;letter-spacing:-.01em}.mxsub{color:var(--muted,#6a6862);font-size:12.5px;margin-right:auto}' +
'.mxdot{width:14px;height:14px;border-radius:50%;display:inline-block}' +
'.mxgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}' +
'.mxsec{background:#faf9f6;border:1px solid #e6e3db;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:6px;min-width:0}' +
'.mxpane>.mxgrid>.mxsec{background:#fff;border-color:var(--line,#d6d4cd)}' +
'.mxsec.wide{grid-column:span 2}@media (max-width:620px){.mxsec.wide{grid-column:auto}}' +
'.mxcv{width:100%;height:auto;background:#fff;border:1px solid #e6e3db;border-radius:8px}' +
'.mxbig{height:12px;border-radius:6px;background:#ecebe6;overflow:hidden}.mxbig span{display:block;height:100%;width:0;background:#1f9d55}.mxbig span.warm{background:#d08a00}.mxbig span.hot{background:#d23a2a}' +
'@media (max-width:560px){.mxin{padding:4px 16px 24px}.mxgrab{padding:0 16px}}';

window.SOUND4 = {
  init: init, playNote: playNote, playDrum: playDrum, sonoBank: sonoBank, buildUI: buildUI, open: function () { toggle(true); }, toggle: toggle,
  setExtMute: function (kind, i, v) { ext[kind][i] = v; applyMutes(); drawStrips(); },
  setVolume: function (v) { ST.master.vol = v; applyMaster(); syncAll(); saveSoon(); }, tempoChanged: function () { applyMaster(); }, syncTune: syncTune,
  get state() { return ST; }, get ctx() { return AC; }, kits: KITS, loadKit: loadKit, mtof: mtof, levels: levels, get open_() { return uiOpen; }
};
})();

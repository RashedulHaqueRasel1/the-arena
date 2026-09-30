// Varispeed "vinyl" scrub resampler. Reads a decoded score buffer at a position
// that tracks a normalized master playhead. Pitch bends with scrub speed and a
// negative velocity plays the buffer in reverse — the turntable effect. Runs on
// the audio thread so the WebGL rAF loop can't glitch it. Channel PCM arrives
// once via port message (transferred, zero-copy).
//
// Motion model: VELOCITY FEEDFORWARD. The main thread reports both the target
// position (targetU) and its velocity (targetVel, in u/sec). The read head
// advances by the *smoothed velocity* every sample — so a sustained tone gets a
// rock-steady pitch instead of wobbling as it chases a once-per-frame position
// staircase. Position is only used for a gentle, heavily-smoothed drift
// correction, so sync holds without injecting frame-rate vibrato. Resampling is
// 4-point Catmull-Rom cubic to avoid the harmonic distortion linear interp adds
// to sustained tones, followed by a rate-tracking lowpass that suppresses the
// aliasing the read head would otherwise fold in when scrubbing faster than 1×.
class ScrubProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: "targetU", defaultValue: 0, minValue: 0, maxValue: 1, automationRate: "k-rate" },
      { name: "targetVel", defaultValue: 0, minValue: -50, maxValue: 50, automationRate: "k-rate" },
    ];
  }

  constructor(options) {
    super();
    const o = (options && options.processorOptions) || {};
    // Hard pitch ceiling (samples advanced per output sample). Caps how extreme
    // the vinyl bend can get regardless of how hard the user scrubs.
    this.maxRate = o.maxRate || 4;
    this.channels = null; // Float32Array[]
    this.length = 0;       // source frames
    this.readPos = 0;      // fractional read head
    this.velSmoothed = 0;  // smoothed playback rate (samples / output sample)
    this.errSmoothed = 0;  // smoothed position error (samples) for drift correction
    this.ready = false;

    // Anti-alias lowpass: when |rate| > 1 the read head undersamples the source
    // and folds aliases. A per-channel biquad LPF (Q≈0.707) whose cutoff tracks
    // ~Nyquist/rate tames that the way tape head bandwidth would. Floor keeps it
    // audible at extreme scrub. The filter is bypassed near 1× (rate ≤ ~1.05) so
    // natural-pitch playback stays bit-transparent.
    this.aaFloorHz = o.aaFloorHz || 500;
    this.lpZ1 = null; // biquad state z1 per channel (transposed DF-II)
    this.lpZ2 = null; // biquad state z2 per channel

    // Time constants (s): pitch smoothing, error smoothing (must filter out the
    // ~frame-rate position staircase), and drift correction. corrAlpha is a
    // per-sample one-pole coefficient (≈ 1/(corrTau·sampleRate)) applied to the
    // smoothed position error — a gentle pull, not a literal gain.
    this.velAlpha = this._a(o.velTau ?? 0.02);
    this.errAlpha = this._a(o.errTau ?? 0.25);
    this.corrAlpha = this._a(o.corrTau ?? 0.30);

    // Resync firmness. The base corrAlpha pull is gentle (no wobble on slow
    // scrubs). When the position error grows past corrKneeLo it ramps the pull
    // up to (1 + corrMaxK)× by corrKneeHi, so the audio snaps back fast after a
    // hard scrub outran the pitch ceiling. Knees are in source frames.
    this.corrMaxK = o.corrMaxK ?? 8;
    this.corrKneeLo = (o.corrKneeLoSec ?? 0.05) * sampleRate;
    this.corrKneeHi = (o.corrKneeHiSec ?? 0.40) * sampleRate;
    // Resync rate ceiling (samples/output-sample). The live feedforward pitch is
    // capped at maxRate, but once the user stops scrubbing the read head may
    // catch up this fast — needed for part 2, where a boosted scrub races through
    // a time-dense region and the audio falls tens of seconds behind. The
    // anti-alias filter muffles the catch-up into a soft whoosh.
    this.resyncMaxRate = o.resyncMaxRate ?? 32;

    this.port.onmessage = (e) => {
      const d = e.data;
      if (d.type === "load") {
        this.channels = d.channels.map((buf) => new Float32Array(buf));
        this.length = d.length;
        this.readPos = d.startU != null ? d.startU * (this.length - 1) : 0;
        this.velSmoothed = 0;
        this.errSmoothed = 0;
        this.lpZ1 = null;
        this.lpZ2 = null;
        this.ready = true;
      } else if (d.type === "seek") {
        // Hard-jump the read head to a normalized position with no resync ramp.
        // Used when audio is unmuted mid-scroll: the head sat frozen at its
        // load-time position while the context was suspended, so without this it
        // would "vinyl start up" and race to catch the live playhead. Snap there
        // instead, seeding the smoothed rate from the live velocity (zero pitch
        // ramp) and clearing the error + filter state for a clean entry.
        if (this.length > 0) this.readPos = d.u * (this.length - 1);
        this.velSmoothed = d.vel != null ? (d.vel * (this.length - 1)) / sampleRate : 0;
        this.errSmoothed = 0;
        this.lpZ1 = null;
        this.lpZ2 = null;
      } else if (d.type === "maxRate") {
        this.maxRate = d.value;
      } else if (d.type === "velTau") {
        this.velAlpha = this._a(d.value);
      } else if (d.type === "errTau") {
        this.errAlpha = this._a(d.value);
      } else if (d.type === "corrTau") {
        this.corrAlpha = this._a(d.value);
      } else if (d.type === "corrMaxK") {
        this.corrMaxK = d.value;
      } else if (d.type === "resyncMaxRate") {
        this.resyncMaxRate = d.value;
      } else if (d.type === "aaFloorHz") {
        this.aaFloorHz = d.value;
      }
    };
  }

  // Per-sample one-pole coefficient for a time constant in seconds.
  _a(tau) {
    return tau > 0 ? 1 - Math.exp(-1 / (tau * sampleRate)) : 1;
  }

  process(_inputs, outputs, params) {
    const out = outputs[0];
    const n = out[0].length; // typically 128
    if (!this.ready || this.length < 4) {
      for (let c = 0; c < out.length; c++) out[c].fill(0);
      return true;
    }

    const uArr = params.targetU;
    const vArr = params.targetVel;
    const uK = uArr.length === 1;
    const vK = vArr.length === 1;
    const len = this.length;
    const nCh = out.length;
    const velAlpha = this.velAlpha;
    const errAlpha = this.errAlpha;
    const corrAlpha = this.corrAlpha;
    const corrMaxK = this.corrMaxK;
    const corrKneeLo = this.corrKneeLo;
    const corrKneeSpan = (this.corrKneeHi - this.corrKneeLo) || 1;
    const maxStep = this.maxRate;
    const resyncMaxStep = this.resyncMaxRate;

    // Idle-gated rate cap: maxStep while actively scrubbing (live pitch ceiling,
    // unchanged), rising toward resyncMaxStep as the feedforward goes quiet so a
    // large residual error resyncs fast after the user stops.
    const rateCap = (v) => {
      const sp = (v < 0 ? -v : v) / maxStep;
      const idle = sp < 1 ? 1 - sp : 0;
      return maxStep + (resyncMaxStep - maxStep) * idle;
    };
    // Error-scaled correction coefficient for a given |error| (samples).
    const corrK = (ae) => {
      let kb = (ae - corrKneeLo) / corrKneeSpan;
      kb = kb < 0 ? 0 : kb > 1 ? 1 : kb;
      return corrAlpha * (1 + corrMaxK * kb * kb * (3 - 2 * kb));
    };
    const velScale = (len - 1) / sampleRate; // u/sec -> samples/output-sample

    let pos = this.readPos;
    let velS = this.velSmoothed;
    let errS = this.errSmoothed;

    // Anti-alias biquad: coeffs recomputed once per quantum from the (slowly
    // varying) smoothed rate, applied per sample. Cutoff = ~Nyquist/rate; near
    // 1× we bypass so natural playback is untouched. State persists across
    // quanta even while bypassed so engaging the filter is click-free.
    if (!this.lpZ1 || this.lpZ1.length !== nCh) {
      this.lpZ1 = new Float32Array(nCh);
      this.lpZ2 = new Float32Array(nCh);
    }
    const lpZ1 = this.lpZ1, lpZ2 = this.lpZ2;
    // Estimate this quantum's actual read rate (incl. the resync catch-up) so the
    // cutoff tracks it — otherwise a fast resync whoosh would alias unfiltered.
    let rEst = velS + errS * corrK(errS < 0 ? -errS : errS);
    const capEst = rateCap(velS);
    if (rEst > capEst) rEst = capEst; else if (rEst < -capEst) rEst = -capEst;
    const aaRate = (rEst < 0 ? -rEst : rEst) < 1 ? 1 : rEst < 0 ? -rEst : rEst;
    const lpActive = aaRate > 1.05;
    const nyq = 0.49 * sampleRate;
    let fc = nyq / aaRate;
    if (fc < this.aaFloorHz) fc = this.aaFloorHz;
    if (fc > nyq) fc = nyq;
    // RBJ lowpass, Q = 1/sqrt(2).
    const w0 = (2 * Math.PI * fc) / sampleRate;
    const cw = Math.cos(w0), sw = Math.sin(w0);
    const alpha = sw / Math.SQRT2;
    const a0i = 1 / (1 + alpha);
    const b0 = ((1 - cw) * 0.5) * a0i;
    const b1 = (1 - cw) * a0i;
    const b2 = b0;
    const a1 = (-2 * cw) * a0i;
    const a2 = (1 - alpha) * a0i;

    const FADE = 256;
    const fadeEnd = len - 1;

    for (let i = 0; i < n; i++) {
      const targetPos = (uK ? uArr[0] : uArr[i]) * (len - 1);
      const velFF = (vK ? vArr[0] : vArr[i]) * velScale;

      // Feedforward velocity gives the pitch; smoothed so per-frame velocity
      // steps don't click. Position error is smoothed hard to strip the
      // frame-rate staircase before it can modulate the rate (no wobble).
      velS += (velFF - velS) * velAlpha;
      errS += (targetPos - pos - errS) * errAlpha;
      // Error-scaled drift correction (gentle near zero, firmer past the knees)
      // with an idle-gated cap: capped at the pitch ceiling while scrubbing, but
      // free to resync fast once the user stops.
      let rate = velS + errS * corrK(errS < 0 ? -errS : errS);
      const cap = rateCap(velS);
      if (rate > cap) rate = cap;
      else if (rate < -cap) rate = -cap;

      pos += rate;
      if (pos < 0) pos = 0;
      else if (pos > fadeEnd) pos = fadeEnd;

      // Fade to silence within FADE samples of either edge so a parked read
      // head outputs silence instead of a held DC level (which would click).
      const dEdge = pos < fadeEnd - pos ? pos : fadeEnd - pos;
      let eg = dEdge >= FADE ? 1 : dEdge / FADE;
      eg = eg * eg * (3 - 2 * eg); // smoothstep

      // 4-point Catmull-Rom cubic interpolation.
      const i1 = pos | 0;
      const t = pos - i1;
      const i0 = i1 > 0 ? i1 - 1 : 0;
      const i2 = i1 + 1 < len ? i1 + 1 : i1;
      const i3 = i1 + 2 < len ? i1 + 2 : i2;
      for (let c = 0; c < nCh; c++) {
        const s = this.channels[c] || this.channels[0];
        const a0 = s[i0], a1c = s[i1], a2c = s[i2], a3 = s[i3];
        const x = a1c + 0.5 * t * (a2c - a0 + t * (2 * a0 - 5 * a1c + 4 * a2c - a3 + t * (3 * (a1c - a2c) + a3 - a0)));
        // Biquad runs every sample (state stays coherent); output picks the
        // filtered sample only when the rate is high enough to alias.
        const y = b0 * x + lpZ1[c];
        lpZ1[c] = b1 * x - a1 * y + lpZ2[c];
        lpZ2[c] = b2 * x - a2 * y;
        out[c][i] = (lpActive ? y : x) * eg;
      }
    }

    // Flush biquad state out of the denormal range during trailing silence.
    for (let c = 0; c < nCh; c++) {
      if (lpZ1[c] < 1e-25 && lpZ1[c] > -1e-25) lpZ1[c] = 0;
      if (lpZ2[c] < 1e-25 && lpZ2[c] > -1e-25) lpZ2[c] = 0;
    }

    this.readPos = pos;
    this.velSmoothed = velS;
    this.errSmoothed = errS;
    return true;
  }
}

registerProcessor("scrub-processor", ScrubProcessor);

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import Lenis from "lenis";

// Default texture buckets
const DEFAULT_BG_IMAGES = [
  "/buckets/m/it-01.webp",
  "/buckets/m/it-02.webp",
  "/buckets/m/it-03.webp",
  "/buckets/m/it-04.webp",
  "/buckets/m/it-05.webp",
];

const DEFAULT_SLATE_IMAGES = [
  "/buckets/m/slate-01.webp",
  "/buckets/m/slate-02.webp",
  "/buckets/m/slate-03.webp",
  "/buckets/m/slate-04.webp",
  "/buckets/m/slate-05.webp",
];

// Rich Lore & Franchise Content for each sector before the final modal
const SECTORS = [
  {
    id: "00",
    name: "GATE 00 : ORIGIN",
    badge: "INITIALIZING HYPER-GATE",
    title: "THE VOIDLINE PRIME",
    subtitle: "Transmedia Action Universe",
    desc: "A transmedia universe built on 35 years of iconic gaming lineage. Step through the gate into a world where prestige animation, fighting esports, and cinematic storytelling collide.",
    highlights: ["UNREAL ENGINE 5", "35-YEAR LINEAGE", "PRESTIGE ANIMATION"],
    telemetry: { status: "ONLINE", velocity: "WARP READY", fighters: "SYNCED" },
    progressRange: [0.0, 0.16],
  },
  {
    id: "01",
    name: "SECTOR 01 : FATAL WOLVES",
    badge: "KINETIC COMBAT LINEAGE",
    title: "CITY OF WOLVES",
    subtitle: "South Town Underground Circuit",
    desc: "Legendary fighters return with the all-new REV combat system. Crisp anime art style, hyper-responsive rollback netcode, and blistering martial combos forged in the streets.",
    highlights: ["REV COMBAT SYSTEM", "ROLLBACK NETCODE", "ICONIC FIGHTERS"],
    telemetry: { status: "ACTIVE", velocity: "1.4 MACH", fighters: "24 EN ROUTE" },
    progressRange: [0.16, 0.33],
  },
  {
    id: "02",
    name: "SECTOR 02 : NEURAL MATRIX",
    badge: "GLOBAL TRANSMEDIA",
    title: "ANIME & CINEMA FRONTIER",
    subtitle: "Hollywood & Tokyo Creators",
    desc: "Financed and crafted alongside legendary Japanese anime studios and Hollywood breakout directors. Blockbuster series, feature animation, and graphic novels expanding the universe.",
    highlights: ["4K HDR ANIME", "MULTI-SEASON ARCS", "GLOBAL STREAMING"],
    telemetry: { status: "STREAMING", velocity: "2.8 MACH", fighters: "12 ARCS LIVE" },
    progressRange: [0.33, 0.50],
  },
  {
    id: "03",
    name: "SECTOR 03 : HEAVY IRON",
    badge: "DIESELPUNK RESISTANCE",
    title: "METAL SLUG TACTICAL",
    desc: "Heavy armored walkers, laser artillery, and adrenaline-pumping bullet storms. Form alliances with global squadrons in chaotic, tactical cooperative battlegrounds.",
    subtitle: "Artillery & Mecha Strike",
    highlights: ["CO-OP WARFARE", "DIESELPUNK ARMOR", "DESTRUCTIBLE ARENAS"],
    telemetry: { status: "DEPLOYED", velocity: "4.2 MACH", fighters: "ARMED SQUADS" },
    progressRange: [0.50, 0.67],
  },
  {
    id: "04",
    name: "SECTOR 04 : BLADE DOJO",
    badge: "ONE-STRIKE LETHALITY",
    title: "THE SAMURAI CODE // APEX ARENA",
    subtitle: "1/60-Sec Parry Precision & FGC World Championship",
    desc: "The hyper-tension dueling grounds where razor steel and nerve collide. 1/60th-second frame-perfect parries, cinematic clash counters, and global ranking tournaments powered by next-gen rollback netcode. Legendary masters clash in high-stakes honor duels.",
    highlights: ["ONE-HIT LETHALITY", "120 FPS ROLLBACK", "GLOBAL FGC TOUR", "FRAME-PERFECT PARRY", "BLADE TENSION GAUGE"],
    telemetry: { status: "TOURNAMENT LIVE", velocity: "5.8 MACH", fighters: "32 MASTERS ACTIVE" },
    progressRange: [0.67, 0.84],
  },
  {
    id: "05",
    name: "SECTOR 05 : CITADEL TERMINAL",
    badge: "FOUNDER SANCTUARY",
    title: "NEXUS CITADEL // TERMINAL PRIME",
    subtitle: "Founder Syndicate Governance & Alpha Chamber",
    desc: "Hyper-tunnel terminus reached. Register your callsign to secure Tier-1 Founder credentials, anime premiere streaming passes, and universal DAO council voting rights.",
    highlights: ["FOUNDER KEY", "ALPHA TEST", "ANIME PREMIERE", "COUNCIL VOTE", "MYTHIC SKINS"],
    telemetry: { status: "DOCKED", velocity: "TERMINUS REACHED", fighters: "CITADEL SECURE" },
    progressRange: [0.84, 1.0],
  },
];


// Mathematical helpers
const sg = (min: number, max: number, val: number) =>
  Math.min(1, Math.max(0, (val - min) / (max - min)));

const sm = (min: number, max: number, val: number) =>
  (val - min) / (max - min);

// Non-linear scroll velocity profile
const e2 = (val: number) =>
  2 *
  (0.4 + 1.8 * sg(0, 0.139394, val)) *
  (1 - -0.0284 * sg(0, 0.05, sg(0.139394, 1, val)));

const e4 = e2(0.139394);
const e5 = (val: number) => (val > 0.139394 ? (e4 / e2(val)) * 4 : 1);

// Integral table for arc-length parameterization
const e6 = new Float64Array(4097);
const e9 = new Float64Array(4097);
for (let e = 1; e <= 4096; e++) {
  const t = e / 4096;
  const n = (e - 1) / 4096;
  e6[e] = t;
  const i = 0.5 * (1 / e2(n) + 1 / e2(t));
  e9[e] = e9[e - 1] + 403.5337 * i * (t - n);
}
const e8 = e9[4096]; // Max scroll distance (~403.53)

// Binary-search scroll-to-progress inversion
const e7 = (dist: number) => {
  if (dist <= 0) return 0;
  if (dist >= e8) return 1;
  let t = 0;
  let n = 4096;
  while (n - t > 1) {
    const i = (t + n) >> 1;
    e9[i] <= dist ? (t = i) : (n = i);
  }
  const i = e9[n] - e9[t] || 1;
  return e6[t] + (e6[n] - e6[t]) * ((dist - e9[t]) / i);
};

// Shaders
const QUAD_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SCREEN_QUAD_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy * 2.0, 0.999, 1.0);
  }
`;

const BG_FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D overlayTex;
  uniform float overlayActive;
  uniform float overlayLeft;
  uniform float overlayAspect;
  uniform sampler2D overlayTex2;
  uniform float overlayActive2;
  uniform float overlayLeft2;
  uniform float overlayAspect2;
  uniform vec2  screen;
  uniform float time;
  uniform float noiseAmount;
  uniform float noiseScale;
  uniform float noiseSpeed;
  uniform float bgScaleStartY;
  uniform float bgScaleEndY;

  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  vec3 sampleOverlay(vec2 wUv, sampler2D tex, float enabled, float leftEdge, float aspect) {
    if (enabled < 0.5) return vec3(0.0);
    float mx = wUv.x < 0.5 ? 1.0 - wUv.x : wUv.x;
    float screenAspect = screen.x / screen.y;
    float imgW_uv  = aspect / screenAspect;
    float u = (mx - leftEdge) / imgW_uv;
    if (u < 0.0 || u > 1.0) return vec3(0.0);
    return texture2D(tex, vec2(u, wUv.y)).rgb;
  }

  void main() {
    float mirrorX  = 0.5 + abs(vUv.x - 0.5);
    vec2  nP       = vec2(mirrorX, vUv.y) * noiseScale + time * noiseSpeed;
    vec2  nDisp    = vec2(vnoise(nP) - 0.5, vnoise(nP + 17.3) - 0.5);
    float seamSide = smoothstep(0.0, 0.02, abs(vUv.x - 0.5));
    float sideSign = vUv.x < 0.5 ? -1.0 : 1.0;
    nDisp.x       *= sideSign * seamSide;
    vec2  nUv      = vUv + nDisp * noiseAmount;

    float edgeX   = clamp(abs(nUv.x - 0.5) * 2.0, 0.0, 1.0);
    float yFactor = mix(bgScaleStartY, bgScaleEndY, edgeX);
    vec2  sUv     = vec2(nUv.x, 0.5 + (nUv.y - 0.5) / yFactor);

    vec3 a = sampleOverlay(sUv, overlayTex,  overlayActive,  overlayLeft,  overlayAspect);
    vec3 b = sampleOverlay(sUv, overlayTex2, overlayActive2, overlayLeft2, overlayAspect2);
    vec3 overlayColor = a + b;

    gl_FragColor = vec4(overlayColor, 1.0);
  }
`;


const SLATE_FRAGMENT_SHADER = `
  uniform sampler2D map;
  uniform float uOpacity;
  uniform float uFx;
  uniform float uTime;
  varying vec2 vUv;

  const float CURVE      = 0.05;
  const float ABERRATION = 0.004;
  const float DISPLACE   = 0.025;
  const float SCANLINES  = 2000.0;
  const float SCAN_DEPTH = 0.9;
  const float VIGNETTE   = 1.15;
  const float STATIC_AMT = 0.10;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 cc = vUv * 2.0 - 1.0;
    float r2 = dot(cc, cc);
    vec2 uv = vUv + cc * r2 * (CURVE * uFx);
    float wave = sin(uv.y * SCANLINES * 3.14159);
    uv.x += wave * cc.y * (DISPLACE * uFx);

    float amt   = ABERRATION * uFx * (0.6 + 0.4 * wave);
    float aWarm = texture2D(map, uv + vec2(amt * 0.5, 0.0)).a;
    float aTip  = texture2D(map, uv + vec2(amt * 2.7, 0.0)).a;
    float aCool = texture2D(map, uv + vec2(-amt,      0.0)).a;
    float rCov  = max(aWarm, aTip);
    vec3  rgb   = vec3(rCov, aWarm, aCool);
    float alpha = max(rCov, aCool);

    float scan = 0.5 + 0.5 * wave;
    rgb *= mix(1.0, 1.0 - SCAN_DEPTH * (1.0 - scan), uFx);

    float vig = clamp(1.0 - r2 * VIGNETTE, 0.0, 1.0);
    rgb *= mix(1.0, vig, uFx);

    float n = hash(floor(uv * 220.0) + floor(uTime * 18.0));
    rgb += (n - 0.5) * (STATIC_AMT * uFx);

    vec2 edge = step(0.0, uv) * step(uv, vec2(1.0));
    alpha *= edge.x * edge.y;

    gl_FragColor = vec4(rgb, alpha * uOpacity);
    #include <colorspace_fragment>
  }
`;

const ENDSTATION_FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D part2Tex;
  uniform vec2  screen;
  uniform vec2  imageSize;
  uniform float scrollY;
  uniform float scrollVel;
  uniform float part2Alpha;
  uniform float startAnchor;
  uniform float endAnchor;
  uniform float zoom;

  void main() {
    float imgAspect = imageSize.x / imageSize.y;
    float scrAspect = screen.x / screen.y;
    float imgH_uv   = scrAspect / imgAspect;
    float visibleH  = (1.0 / imgH_uv) / zoom;
    float scrollTop  = 1.0 - startAnchor * visibleH;
    float scrollBot  =     - endAnchor   * visibleH;
    float yOff       = mix(scrollTop, scrollBot, scrollY);

    float xz = (vUv.x - 0.5) / zoom + 0.5;
    float xIn = step(0.0, xz) * step(xz, 1.0);
    float cxz = clamp(xz, 0.0, 1.0);
    float baseY = vUv.y * visibleH + yOff;
    float travel = clamp((scrollBot - scrollTop) * scrollVel, -0.04, 0.04);

    const int MB_TAPS = 5;
    vec3 acc = vec3(0.0);
    for (int i = 0; i < MB_TAPS; i++) {
      float t = float(i) / float(MB_TAPS - 1) - 0.5;
      float y = baseY + travel * t;
      float inRange = xIn * step(0.0, y) * step(y, 1.0);
      acc += texture2D(part2Tex, vec2(cxz, clamp(y, 0.0, 1.0))).rgb * inRange;
    }
    vec3 col = acc / float(MB_TAPS);
    gl_FragColor = vec4(col * part2Alpha, 1.0);
  }
`;



const BLOOM_FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D tex1;
  uniform vec2  bloomTexel;
  uniform float leakThreshold;
  uniform float leakKnee;
  uniform float leakBlur;

  void main() {
    vec2 o = bloomTexel * leakBlur;
    vec3 c = texture2D(tex1, vUv).rgb * 4.0;
    c += texture2D(tex1, vUv + vec2( o.x, 0.0)).rgb;
    c += texture2D(tex1, vUv + vec2(-o.x, 0.0)).rgb;
    c += texture2D(tex1, vUv + vec2(0.0,  o.y)).rgb;
    c += texture2D(tex1, vUv + vec2(0.0, -o.y)).rgb;
    c /= 8.0;

    float lum = max(max(c.r, c.g), c.b);
    float w = smoothstep(leakThreshold, leakThreshold + leakKnee, lum);
    gl_FragColor = vec4(c * w, 1.0);
  }
`;

const POST_FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D tex1;
  uniform sampler2D bloomTex;
  uniform float opacity;
  uniform float saturation;
  uniform float displacement;
  uniform float textureScale;
  uniform float yScale;
  uniform float grain;
  uniform float grainScale;
  uniform float chromaAmount;
  uniform float leakAmount;
  uniform float leakSpread;
  uniform float leakColorCast;
  uniform float maskInner;
  uniform float maskFeather;
  uniform float dither;

  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  void main() {
    vec2 cVuv = vUv - 0.5;
    vec2 cMask = vec2(cVuv.x, cVuv.y * pow(2.0, -yScale));
    float outCircle = (0.5 - distance(cMask, vec2(0.0))) * (textureScale * 10.0);

    vec2 ad = abs(vUv - 0.5);
    vec2 maskAxes = smoothstep(vec2(maskInner), vec2(maskInner + maskFeather), ad);
    float effectMask = max(maskAxes.x, maskAxes.y);
    float chromaAmountM = chromaAmount * effectMask;
    float leakAmountM   = leakAmount   * effectMask;

    vec2 dir = vUv - 0.5;
    float dispR = displacement * (1.0 + chromaAmountM);
    float dispG = displacement;
    float dispB = displacement * (1.0 - chromaAmountM);
    vec2 uvR = dir * (1.0 + 0.5 * dispR - (1.0 - outCircle) * dispR * 0.5) + 0.5;
    vec2 uvG = dir * (1.0 + 0.5 * dispG - (1.0 - outCircle) * dispG * 0.5) + 0.5;
    vec2 uvB = dir * (1.0 + 0.5 * dispB - (1.0 - outCircle) * dispB * 0.5) + 0.5;

    vec4 outColor;
    outColor.r = texture2D(tex1, uvR).r;
    outColor.g = texture2D(tex1, uvG).g;
    outColor.b = texture2D(tex1, uvB).b;
    outColor.a = 1.0;

    const int LEAK_TAPS = 12;
    const vec3 LEAK_COL_SUM = vec3(5.435, 6.664, 3.727);

    vec3 orig[LEAK_TAPS];
    orig[0]  = vec3(0.000, 0.300, 1.000);
    orig[1]  = vec3(0.000, 0.555, 0.982);
    orig[2]  = vec3(0.000, 0.723, 0.841);
    orig[3]  = vec3(0.000, 0.855, 0.577);
    orig[4]  = vec3(0.045, 0.900, 0.259);
    orig[5]  = vec3(0.264, 0.900, 0.068);
    orig[6]  = vec3(0.592, 0.865, 0.000);
    orig[7]  = vec3(0.856, 0.691, 0.000);
    orig[8]  = vec3(0.947, 0.464, 0.000);
    orig[9]  = vec3(0.950, 0.287, 0.000);
    orig[10] = vec3(0.931, 0.124, 0.000);
    orig[11] = vec3(0.850, 0.000, 0.000);

    vec3 weightScale = mix(
      1.0 / LEAK_COL_SUM,
      vec3(1.0 / float(LEAK_TAPS)),
      leakColorCast
    );

    float jitterStep = 2.0 / float(LEAK_TAPS - 1);
    float jitter = (hash21(gl_FragCoord.xy + 17.0) - 0.5) * jitterStep;

    vec3 bloomAcc = vec3(0.0);
    for (int i = 0; i < LEAK_TAPS; i++) {
      float t = (float(i) / float(LEAK_TAPS - 1) - 0.5) * 2.0 + jitter;
      vec2 sUv = uvG + dir * leakSpread * t;
      bloomAcc += texture2D(bloomTex, sUv).rgb * (orig[i] * weightScale);
    }
    outColor.rgb += bloomAcc * leakAmountM;

    float avg = (outColor.r + outColor.g + outColor.b) / 3.0;
    outColor.rgb = outColor.rgb * saturation + (1.0 - avg) * 0.4 * (1.0 - saturation);

    float g = (hash21(gl_FragCoord.xy) - 0.5) * 2.0 * grain * grainScale;
    outColor.rgb += g;
    outColor.a = opacity;
    gl_FragColor = outColor;

    #include <colorspace_fragment>

    if (dither > 0.0001) {
      float n1 = hash21(gl_FragCoord.xy + 31.0);
      float n2 = hash21(gl_FragCoord.xy + 71.0);
      float d  = (n1 + n2 - 1.0) * (dither / 255.0);
      gl_FragColor.rgb += vec3(d);
    }
  }
`;

export function ArenaScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const warpToProgressRef = useRef<((prog: number) => void) | null>(null);

  // UI state
  const [loadingText, setLoadingText] = useState("LOADING 00/11");
  const [loadPercent, setLoadPercent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSectorIdx, setActiveSectorIdx] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Modal / Terminal State
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"access" | "fighters" | "saga" | "factions">("access");
  const [emailInput, setEmailInput] = useState("");
  const [registeredCallsign, setRegisteredCallsign] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [verifiedPass, setVerifiedPass] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState<"terry" | "rock" | "haohmaru" | "marco">("terry");
  const [selectedFaction, setSelectedFaction] = useState<"wolves" | "iron" | "shinobi" | null>(null);
  const [factionPledges, setFactionPledges] = useState({ wolves: 10482, iron: 9840, shinobi: 8920 });
  const [showDuelClash, setShowDuelClash] = useState(false);
  const [isPlayingOst, setIsPlayingOst] = useState(false);

  // Advanced Hard Audio Synthesizer Engine (Cinema Sub-Bass & Physical Sound Design)
  // Inspired by briizz-lanuch.vercel.app & digitaldropouts.net
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const droneGainRef = useRef<GainNode | null>(null);
  const droneFilterRef = useRef<BiquadFilterNode | null>(null);
  const whooshGainRef = useRef<GainNode | null>(null);
  const whooshFilterRef = useRef<BiquadFilterNode | null>(null);
  const soundEnabledRef = useRef(false);
  const hasFirstInteractedRef = useRef(false);
  const prevSectorIdxRef = useRef(0);
  const ostTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef(0);

  // Sync soundEnabledRef with soundEnabled state
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const initAudio = useCallback(() => {
    if (audioContextRef.current) {
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
      return audioContextRef.current;
    }
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // 1. Master Dynamics Compressor / Cinema Limiter (heavy sub-bass punch without distortion)
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-16, ctx.currentTime);
      compressor.knee.setValueAtTime(24, ctx.currentTime);
      compressor.ratio.setValueAtTime(10, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);
      compressor.connect(ctx.destination);
      masterNodeRef.current = compressor;

      // 2. Continuous Hyperspace Ambient Sub-Bass Bus
      const droneMasterGain = ctx.createGain();
      droneMasterGain.gain.setValueAtTime(soundEnabledRef.current ? 0.16 : 0.0, ctx.currentTime);
      droneMasterGain.connect(compressor);
      droneGainRef.current = droneMasterGain;

      // Resonant Lowpass Filter for Drone
      const droneFilter = ctx.createBiquadFilter();
      droneFilter.type = "lowpass";
      droneFilter.frequency.setValueAtTime(95, ctx.currentTime);
      droneFilter.Q.setValueAtTime(4.8, ctx.currentTime);
      droneFilter.connect(droneMasterGain);
      droneFilterRef.current = droneFilter;

      // LFO (Cosmic breathing pulse at 0.08 Hz)
      const droneLfo = ctx.createOscillator();
      droneLfo.type = "sine";
      droneLfo.frequency.setValueAtTime(0.08, ctx.currentTime);
      const droneLfoGain = ctx.createGain();
      droneLfoGain.gain.setValueAtTime(35, ctx.currentTime); // Sweeps cutoff between 60Hz and 130Hz
      droneLfo.connect(droneLfoGain);
      droneLfoGain.connect(droneFilter.frequency);
      droneLfo.start();

      // Sub Oscillator 1: Pure sub-bass sine at 27.5 Hz (A0) - physical floor-vibrating air
      const subOsc1 = ctx.createOscillator();
      subOsc1.type = "sine";
      subOsc1.frequency.setValueAtTime(27.5, ctx.currentTime);
      const sub1Gain = ctx.createGain();
      sub1Gain.gain.setValueAtTime(0.9, ctx.currentTime);
      subOsc1.connect(sub1Gain);
      sub1Gain.connect(droneFilter);
      subOsc1.start();

      // Sub Oscillator 2: Analog Sawtooth at 55.0 Hz (A1) - dark cyber grit
      const subOsc2 = ctx.createOscillator();
      subOsc2.type = "sawtooth";
      subOsc2.frequency.setValueAtTime(55.0, ctx.currentTime);
      const sub2Gain = ctx.createGain();
      sub2Gain.gain.setValueAtTime(0.45, ctx.currentTime);
      subOsc2.connect(sub2Gain);
      sub2Gain.connect(droneFilter);
      subOsc2.start();

      // 3. Space-Storm Wind Bed (digitaldropouts style atmospheric rumble)
      const stormBufferSize = Math.floor(ctx.sampleRate * 2);
      const stormBuffer = ctx.createBuffer(1, stormBufferSize, ctx.sampleRate);
      const stormData = stormBuffer.getChannelData(0);
      for (let i = 0; i < stormBufferSize; i++) {
        stormData[i] = Math.random() * 2 - 1;
      }
      const stormNoise = ctx.createBufferSource();
      stormNoise.buffer = stormBuffer;
      stormNoise.loop = true;

      const stormFilter = ctx.createBiquadFilter();
      stormFilter.type = "bandpass";
      stormFilter.frequency.setValueAtTime(220, ctx.currentTime);
      stormFilter.Q.setValueAtTime(1.8, ctx.currentTime);

      const stormGain = ctx.createGain();
      stormGain.gain.setValueAtTime(0.04, ctx.currentTime);

      stormNoise.connect(stormFilter);
      stormFilter.connect(stormGain);
      stormGain.connect(droneMasterGain);
      stormNoise.start();

      // 4. Dynamic Warp Scroll Whoosh Buffer
      const whooshBufferSize = Math.floor(ctx.sampleRate * 2);
      const whooshBuffer = ctx.createBuffer(1, whooshBufferSize, ctx.sampleRate);
      const whooshData = whooshBuffer.getChannelData(0);
      for (let i = 0; i < whooshBufferSize; i++) {
        whooshData[i] = Math.random() * 2 - 1;
      }

      const whooshNoise = ctx.createBufferSource();
      whooshNoise.buffer = whooshBuffer;
      whooshNoise.loop = true;

      const whooshFilter = ctx.createBiquadFilter();
      whooshFilter.type = "bandpass";
      whooshFilter.frequency.setValueAtTime(260, ctx.currentTime);
      whooshFilter.Q.setValueAtTime(3.6, ctx.currentTime);

      const whooshGain = ctx.createGain();
      whooshGain.gain.setValueAtTime(0.0, ctx.currentTime);

      whooshNoise.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(compressor);
      whooshNoise.start();

      whooshGainRef.current = whooshGain;
      whooshFilterRef.current = whooshFilter;

      return ctx;
    } catch (e) {
      console.warn("Web Audio initialization skipped:", e);
      return null;
    }
  }, []);

  // Heavy Cinematic Sub-Bass Drop (briizz-lanuch style)
  const playSubDrop = useCallback(() => {
    if (!audioContextRef.current || !soundEnabledRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const dest = masterNodeRef.current || ctx.destination;

      // Sub-bass sweep: 105 Hz down to 22 Hz
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(105, now);
      sub.frequency.exponentialRampToValueAtTime(22, now + 1.4);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.55, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);

      sub.connect(subGain);
      subGain.connect(dest);
      sub.start(now);
      sub.stop(now + 1.5);

      // Punchy tactile kick attack
      const punch = ctx.createOscillator();
      punch.type = "triangle";
      punch.frequency.setValueAtTime(200, now);
      punch.frequency.exponentialRampToValueAtTime(35, now + 0.28);

      const punchGain = ctx.createGain();
      punchGain.gain.setValueAtTime(0.38, now);
      punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      punch.connect(punchGain);
      punchGain.connect(dest);
      punch.start(now);
      punch.stop(now + 0.32);
    } catch {}
  }, []);

  // Seismic Hyper-Gate Thunder Impact (digitaldropouts style)
  const playThunderImpact = useCallback(() => {
    if (!audioContextRef.current || !soundEnabledRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const dest = masterNodeRef.current || ctx.destination;

      // Initial crack (high-energy noise burst)
      const bufferSize = Math.floor(ctx.sampleRate * 0.4);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.setValueAtTime(1500, now);

      const crackGain = ctx.createGain();
      crackGain.gain.setValueAtTime(0.42, now);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      noise.connect(hp);
      hp.connect(crackGain);
      crackGain.connect(dest);
      noise.start(now);
      noise.stop(now + 0.25);

      // Thunder rolling sub rumble
      const rumble = ctx.createOscillator();
      rumble.type = "sawtooth";
      rumble.frequency.setValueAtTime(80, now);
      rumble.frequency.exponentialRampToValueAtTime(24, now + 2.2);

      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = "lowpass";
      rumbleFilter.frequency.setValueAtTime(240, now);
      rumbleFilter.frequency.exponentialRampToValueAtTime(50, now + 2.2);
      rumbleFilter.Q.setValueAtTime(3.5, now);

      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.4, now);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 2.3);

      rumble.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(dest);
      rumble.start(now);
      rumble.stop(now + 2.35);
    } catch {}
  }, []);

  // Swept Resonant Warp Transition Whoosh
  const playTransitionWhoosh = useCallback(() => {
    if (!audioContextRef.current || !soundEnabledRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const dest = masterNodeRef.current || ctx.destination;

      const bufferSize = Math.floor(ctx.sampleRate * 0.7);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.setValueAtTime(4.0, now);
      bp.frequency.setValueAtTime(140, now);
      bp.frequency.exponentialRampToValueAtTime(2200, now + 0.3);
      bp.frequency.exponentialRampToValueAtTime(120, now + 0.7);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.26, now + 0.22);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      noise.connect(bp);
      bp.connect(gain);
      gain.connect(dest);
      noise.start(now);
      noise.stop(now + 0.75);
    } catch {}
  }, []);

  // Crisp High-Tech UI Chirp
  const playHover = useCallback(() => {
    if (!audioContextRef.current || !soundEnabledRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const dest = masterNodeRef.current || ctx.destination;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1600, now);
      osc.frequency.exponentialRampToValueAtTime(2400, now + 0.025);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch {}
  }, []);

  // Heavy "Dam Dam" Double Sub-Bass Punch Impact (Plays on every click)
  const playDamDamClick = useCallback(() => {
    const nowMs = performance.now();
    if (nowMs - lastClickTimeRef.current < 65) return;
    lastClickTimeRef.current = nowMs;

    if (!audioContextRef.current) {
      initAudio();
    }
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    try {
      const now = ctx.currentTime;
      const dest = masterNodeRef.current || ctx.destination;

      // ==========================================
      // HIT 1: FIRST HEAVY PUNCH ("DAM 1")
      // ==========================================
      // Punchy transient kick (155 Hz -> 36 Hz)
      const kick1 = ctx.createOscillator();
      kick1.type = "sine";
      kick1.frequency.setValueAtTime(155, now);
      kick1.frequency.exponentialRampToValueAtTime(36, now + 0.14);

      const gain1 = ctx.createGain();
      gain1.gain.setValueAtTime(0.55, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      kick1.connect(gain1);
      gain1.connect(dest);
      kick1.start(now);
      kick1.stop(now + 0.2);

      // Deep sub-bass resonance body
      const sub1 = ctx.createOscillator();
      sub1.type = "triangle";
      sub1.frequency.setValueAtTime(82, now);
      sub1.frequency.exponentialRampToValueAtTime(26, now + 0.35);

      const subGain1 = ctx.createGain();
      subGain1.gain.setValueAtTime(0.45, now);
      subGain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      sub1.connect(subGain1);
      subGain1.connect(dest);
      sub1.start(now);
      sub1.stop(now + 0.4);

      // Crisp cyber click transient
      const click = ctx.createOscillator();
      click.type = "sine";
      click.frequency.setValueAtTime(1800, now);
      click.frequency.exponentialRampToValueAtTime(500, now + 0.025);

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.12, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      click.connect(clickGain);
      clickGain.connect(dest);
      click.start(now);
      click.stop(now + 0.035);

      // ==========================================
      // HIT 2: SECOND MICRO PUNCH ("DAM 2") AT +80ms
      // ==========================================
      const delay = 0.08;
      const kick2 = ctx.createOscillator();
      kick2.type = "sine";
      kick2.frequency.setValueAtTime(125, now + delay);
      kick2.frequency.exponentialRampToValueAtTime(30, now + delay + 0.18);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.45, now + delay);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.22);

      kick2.connect(gain2);
      gain2.connect(dest);
      kick2.start(now + delay);
      kick2.stop(now + delay + 0.24);

      // Rolling sub rumble after second hit
      const sub2 = ctx.createOscillator();
      sub2.type = "sine";
      sub2.frequency.setValueAtTime(62, now + delay);
      sub2.frequency.exponentialRampToValueAtTime(22, now + delay + 0.45);

      const subGain2 = ctx.createGain();
      subGain2.gain.setValueAtTime(0.001, now);
      subGain2.gain.setValueAtTime(0.38, now + delay);
      subGain2.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.5);

      sub2.connect(subGain2);
      subGain2.connect(dest);
      sub2.start(now + delay);
      sub2.stop(now + delay + 0.52);

    } catch (e) {
      console.warn("DamDam click error:", e);
    }
  }, [initAudio]);

  // Metallic Cyber Lock Tone + Heavy Dam Dam Impact
  const playClick = useCallback((freq = 880) => {
    playDamDamClick();
  }, [playDamDamClick]);

  // Clean Sine Chime
  const playChime = useCallback((freq = 520) => {
    if (!audioContextRef.current || !soundEnabledRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const dest = masterNodeRef.current || ctx.destination;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.6, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {}
  }, []);

  // Polyphonic Fanfare Chord
  const playChord = useCallback((freqs: number[]) => {
    if (!audioContextRef.current || !soundEnabledRef.current) return;
    try {
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const dest = masterNodeRef.current || ctx.destination;

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.08 / freqs.length, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + idx * 0.1);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.7 + idx * 0.1);
      });
    } catch {}
  }, []);

  // Sound Toggle with Sub-Bass Awakening
  const toggleSound = useCallback(() => {
    const ctx = initAudio();
    setSoundEnabled((prev) => {
      const next = !prev;
      soundEnabledRef.current = next;
      if (droneGainRef.current && ctx) {
        droneGainRef.current.gain.setTargetAtTime(next ? 0.16 : 0.0, ctx.currentTime, 0.15);
      }
      if (next) {
        setTimeout(() => {
          playSubDrop();
        }, 30);
      }
      return next;
    });
  }, [initAudio, playSubDrop]);

  const togglePlayOst = useCallback(() => {
    initAudio();
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    if (isPlayingOst) {
      if (ostTimerRef.current) clearInterval(ostTimerRef.current);
      setIsPlayingOst(false);
      return;
    }

    setIsPlayingOst(true);
    // Cyberpunk synth arpeggiator notes: D3, F3, A3, C4, D4, F4, A4, G4
    const notes = [146.83, 174.61, 220.0, 261.63, 293.66, 349.23, 440.0, 392.0];
    let noteIdx = 0;

    const playSynthNote = () => {
      if (!ctx || ctx.state === "closed") return;
      try {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(notes[noteIdx % notes.length], ctx.currentTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(700 + Math.sin(noteIdx * 0.5) * 450, ctx.currentTime);
        filter.Q.value = 5;

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.25);
        noteIdx++;
      } catch {}
    };

    playSynthNote();
    const interval = setInterval(playSynthNote, 240);
    ostTimerRef.current = interval;
  }, [initAudio, isPlayingOst]);

  const handleRegisterCallsign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    playChord([440, 554.37, 659.25, 880]); // A Major chord fanfare!
    setRegisteredCallsign(emailInput.trim());
    setEmailInput("");
  };

  const copyVanguardKey = () => {
    navigator.clipboard.writeText("VOID-VANGUARD-FOUNDER-PASS-8042");
    setCopiedKey(true);
    playChime(640);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const downloadFounderCredentials = () => {
    playChime(580);
    const passText = `================================================
THE VOIDLINE // ARENA PRIME
NEXUS CITADEL FOUNDER CREDENTIAL CERTIFICATE
================================================
CALLSIGN: ${registeredCallsign || "VANGUARD-PIONEER"}
FOUNDER PASS ID: VOID-VANGUARD-FOUNDER-PASS-8042
CLEARANCE LEVEL: TIER 01 ARCHITECT // PROTOCOL ARENA
STATUS: CONFIRMED & REGISTERED
HASH: SHA256-8F92A140B513C0789E

UNLOCKED PERKS:
[✓] CLOSED ALPHA TEST FLIGHT (Q1 2027)
[✓] ANIME PREMIERE GLOBAL SCREENING TICKET
[✓] EXCLUSIVE FOUNDER MYTHIC FIGHTER SKINS
[✓] FOUNDER COUNCIL GOVERNANCE VOTING TOKEN
[✓] VERIFIED DISCORD VIP ARCHITECT CHANNEL

CITADEL TERMINUS // TRANSMEDIA FRONTIER
================================================`;
    const blob = new Blob([passText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VOIDLINE-FOUNDER-${(registeredCallsign || "PASS").replace(/[^a-zA-Z0-9]/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pledgeFaction = (faction: "wolves" | "iron" | "shinobi") => {
    playChord(faction === "wolves" ? [330, 440, 550] : faction === "iron" ? [260, 390, 520] : [370, 490, 740]);
    setSelectedFaction(faction);
    setFactionPledges((prev) => ({
      ...prev,
      [faction]: prev[faction] + 1,
    }));
  };


  // Auto-activate audio on first scroll/touch gesture if user scrolls before clicking
  useEffect(() => {
    const handleFirstScroll = () => {
      if (hasFirstInteractedRef.current) return;
      hasFirstInteractedRef.current = true;
      const ctx = initAudio();
      if (ctx) {
        setSoundEnabled(true);
        soundEnabledRef.current = true;
        if (droneGainRef.current) {
          droneGainRef.current.gain.setTargetAtTime(0.16, ctx.currentTime, 0.4);
        }
        playSubDrop();
      }
      window.removeEventListener("wheel", handleFirstScroll);
      window.removeEventListener("touchstart", handleFirstScroll);
      window.removeEventListener("keydown", handleFirstScroll);
    };

    window.addEventListener("wheel", handleFirstScroll, { passive: true });
    window.addEventListener("touchstart", handleFirstScroll, { passive: true });
    window.addEventListener("keydown", handleFirstScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleFirstScroll);
      window.removeEventListener("touchstart", handleFirstScroll);
      window.removeEventListener("keydown", handleFirstScroll);
    };
  }, [initAudio, playSubDrop]);

  // Global Click / Tap listener: Plays the heavy "Dam Dam" double sub-bass punch on EVERY click
  useEffect(() => {
    const handleGlobalClick = () => {
      // If audio is muted by user after initial interaction, don't force sound
      if (!soundEnabledRef.current && hasFirstInteractedRef.current) return;

      if (!hasFirstInteractedRef.current) {
        hasFirstInteractedRef.current = true;
        const ctx = initAudio();
        if (ctx) {
          setSoundEnabled(true);
          soundEnabledRef.current = true;
          if (droneGainRef.current) {
            droneGainRef.current.gain.setTargetAtTime(0.16, ctx.currentTime, 0.4);
          }
        }
      } else if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
      playDamDamClick();
    };

    window.addEventListener("pointerdown", handleGlobalClick, { capture: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", handleGlobalClick, { capture: true });
    };
  }, [initAudio, playDamDamClick]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.className = "block w-full h-full";
    container.appendChild(canvas);

    let isDisposed = false;
    let animFrameId = 0;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 1);

    let width = window.innerWidth;
    let height = window.innerHeight;
    renderer.setSize(width, height, false);

    // Scenes & Cameras
    const tunnelScene = new THREE.Scene();
    const fog = new THREE.Fog(0x000000, 9.8, 33.2);
    tunnelScene.fog = fog;

    const calcFov = (w: number, h: number) =>
      THREE.MathUtils.lerp(65, 50, THREE.MathUtils.clamp((w / h - 9 / 16) / (1 - 9 / 16), 0, 1));

    const camera = new THREE.PerspectiveCamera(calcFov(width, height), width / height, 0.05, 80);
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -1);

    // 3D Warp Star Dust Field inside Tunnel so it's ALWAYS active and lively
    const starCount = 400;
    const starPositions = new Float32Array(starCount * 3);
    const starSpeeds = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3 + 0] = (Math.random() - 0.5) * 36;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 36;
      starPositions[i * 3 + 2] = -Math.random() * 70;
      starSpeeds[i] = 0.5 + Math.random() * 1.5;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.16,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    tunnelScene.add(starField);

    // Render Targets
    const rtMain = new THREE.WebGLRenderTarget(Math.floor(width * dpr), Math.floor(height * dpr), {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
    });

    const rtBloom = new THREE.WebGLRenderTarget(
      Math.max(1, Math.floor((width * dpr) / 4)),
      Math.max(1, Math.floor((height * dpr) / 4)),
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.ClampToEdgeWrapping,
        wrapT: THREE.ClampToEdgeWrapping,
      }
    );

    const orthoCamera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      -1,
      100
    );
    orthoCamera.position.z = 10;

    const dummyTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, THREE.RGBAFormat);
    dummyTex.needsUpdate = true;

    // Background quad & shader
    const bgUniforms = {
      overlayTex: { value: dummyTex as THREE.Texture },
      overlayActive: { value: 0 },
      overlayLeft: { value: 0 },
      overlayAspect: { value: 1 },
      overlayTex2: { value: dummyTex as THREE.Texture },
      overlayActive2: { value: 0 },
      overlayLeft2: { value: 0 },
      overlayAspect2: { value: 1 },
      screen: { value: [width, height] },
      time: { value: 0 },
      noiseAmount: { value: 0.004 },
      noiseScale: { value: 4.5 },
      noiseSpeed: { value: 1.3 },
      bgScaleStartY: { value: 0.62 },
      bgScaleEndY: { value: 3.5 },
      scrollProgress: { value: 0 },
    };

    const bgMaterial = new THREE.ShaderMaterial({
      vertexShader: SCREEN_QUAD_VERTEX_SHADER,
      fragmentShader: BG_FRAGMENT_SHADER,
      uniforms: bgUniforms,
      depthTest: false,
      depthWrite: false,
    });
    const bgQuad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bgMaterial);
    bgQuad.frustumCulled = false;
    bgQuad.renderOrder = -1e6;
    tunnelScene.add(bgQuad);

    // End station plane & shader
    const endStationUniforms = {
      part2Tex: { value: dummyTex as THREE.Texture },
      screen: { value: [width, height] },
      imageSize: { value: [1, 1] },
      scrollY: { value: 0 },
      scrollVel: { value: 0 },
      part2Alpha: { value: 0 },
      startAnchor: { value: 0.5 },
      endAnchor: { value: 0.48 },
      zoom: { value: width < height ? 1.25 : 1 },
    };

    const endStationMaterial = new THREE.ShaderMaterial({
      vertexShader: SCREEN_QUAD_VERTEX_SHADER,
      fragmentShader: ENDSTATION_FRAGMENT_SHADER,
      uniforms: endStationUniforms,
      depthTest: false,
      depthWrite: false,
    });

    const endStationMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), endStationMaterial);
    endStationMesh.frustumCulled = false;
    endStationMesh.renderOrder = -1e6 + 1;
    endStationMesh.visible = false;
    tunnelScene.add(endStationMesh);

    // Bloom Scene
    const bloomScene = new THREE.Scene();
    const bloomUniforms = {
      tex1: { value: rtMain.texture },
      bloomTexel: { value: [1 / (width * dpr), 1 / (height * dpr)] },
      leakThreshold: { value: 0.86 },
      leakKnee: { value: 0.36 },
      leakBlur: { value: 8.0 },
    };
    const bloomMaterial = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERTEX_SHADER,
      fragmentShader: BLOOM_FRAGMENT_SHADER,
      uniforms: bloomUniforms,
    });
    const bloomQuad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), bloomMaterial);
    bloomQuad.scale.set(width, height, 1);
    bloomQuad.position.z = -10;
    bloomScene.add(bloomQuad);

    // Composite Post Scene
    const compositeScene = new THREE.Scene();
    const postUniforms = {
      tex1: { value: rtMain.texture },
      bloomTex: { value: rtBloom.texture },
      opacity: { value: 1 },
      saturation: { value: 1 },
      displacement: { value: 1.68 },
      textureScale: { value: 0.07 },
      yScale: { value: -0.03 },
      grain: { value: 0.007 },
      grainScale: { value: 0.5 + 0.5 * Math.min(Math.max(dpr - 1, 0), 1) },
      chromaAmount: { value: 0.041 },
      leakAmount: { value: 3.0 },
      leakSpread: { value: 0.064 },
      leakColorCast: { value: 0.57 },
      maskInner: { value: 0.12 },
      maskFeather: { value: 0.08 },
      dither: { value: 1.0 },
    };
    const postMaterial = new THREE.ShaderMaterial({
      vertexShader: QUAD_VERTEX_SHADER,
      fragmentShader: POST_FRAGMENT_SHADER,
      uniforms: postUniforms,
      transparent: true,
    });
    const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), postMaterial);
    postQuad.scale.set(width, height, 1);
    postQuad.position.z = -10;
    compositeScene.add(postQuad);

    // Environment map for metallic rings
    const pmremGen = new THREE.PMREMGenerator(renderer);
    pmremGen.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    const envTexture = pmremGen.fromScene(roomEnv, 0.04).texture;

    const portalMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 1.0,
      roughness: 0.1,
      envMap: envTexture,
      envMapIntensity: 0.03,
    });
    portalMaterial.envMapRotation.set(-0.04, 0.25, 0);

    const portalCount = 33;
    const startZ = -55.06;
    const portalZPositions = new Float32Array(portalCount);
    for (let i = 0; i < portalCount; i++) {
      portalZPositions[i] = -3.4 - 1.6 * i;
    }

    let pointerTargetRoll = 0;
    let pointerRoll = 0;
    let lastClientX = -1;
    const maxRoll = 0.1;

    const handlePointerMove = (e: PointerEvent) => {
      const xNorm = e.clientX / window.innerWidth;
      if (lastClientX >= 0) {
        pointerTargetRoll += (xNorm - lastClientX) * 8;
      }
      lastClientX = xNorm;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    const dummyObj = new THREE.Object3D();
    let instancedPortalMesh: THREE.InstancedMesh | null = null;
    let slateInnerGeometry: THREE.ShapeGeometry | null = null;
    const slatePortalIndices: number[] = [];
    for (let e = 4; e < portalCount; e += 6) {
      slatePortalIndices.push(e);
    }

    const slateMeshes: THREE.Mesh[] = [];
    const slateMaterials: THREE.Material[] = [];
    const bgTextures: THREE.Texture[] = [];
    const bgAspects: number[] = [];
    const slateTextures: THREE.Texture[] = [];
    let endStationTex: THREE.Texture | null = null;

    const totalAssets = DEFAULT_BG_IMAGES.length + DEFAULT_SLATE_IMAGES.length + 1;
    let loadedAssetsCount = 0;

    const updateLoadingState = () => {
      if (isDisposed) return;
      const str = `LOADING ${String(loadedAssetsCount).padStart(2, "0")}/${String(totalAssets).padStart(2, "0")}`;
      setLoadingText(str);
      setLoadPercent(Math.round((loadedAssetsCount / totalAssets) * 100));
      if (loadingRef.current) {
        loadingRef.current.textContent = str;
      }
    };
    updateLoadingState();

    const texLoader = new THREE.TextureLoader();

    const loadTex = (url: string) =>
      texLoader.loadAsync(url).then((tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        loadedAssetsCount++;
        updateLoadingState();
        return tex;
      });

    const loadEndStation = () =>
      texLoader.loadAsync("/end-station.png").then((tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        loadedAssetsCount++;
        updateLoadingState();
        return tex;
      });

    const createSlateMaterial = (mapTexture: THREE.Texture | null) =>
      new THREE.ShaderMaterial({
        uniforms: {
          map: { value: mapTexture },
          uOpacity: { value: 1.0 },
          uFx: { value: 0.0 },
          uTime: { value: 0.0 },
        },
        vertexShader: QUAD_VERTEX_SHADER,
        fragmentShader: SLATE_FRAGMENT_SHADER,
        side: THREE.BackSide,
        transparent: true,
      });

    const slateTimings: Record<number, { inStart?: number; inDur?: number; outStart?: number; outEnd?: number }> = {
      2: { inStart: 0.6945, inDur: 0.003 },
      4: { inStart: 0.696 },
    };

    const calcSlateOpacity = (progress: number, slateIndex: number, expansion: number) => {
      const timing = slateTimings[slateIndex];
      const r = timing?.inStart ?? 0.695;
      const a = timing?.inDur ?? 0.004;
      const s = timing?.outStart ?? 0.827;
      const o = timing?.outEnd ?? 0.829;
      const l = r + a * expansion;
      if (progress < r || progress > o) return 0;
      if (progress >= l && progress <= s) return 1;
      if (progress < l) {
        const t = sm(r, l, progress);
        return +(0.5 + 0.5 * Math.sin(20 * t) > 1 - t);
      }
      return Math.max(0, 1 - sm(s, o, progress));
    };

    const calcSlateGlitch = (progress: number, slateIndex: number, lVal: number) => {
      const timing = slateTimings[slateIndex];
      const s = timing?.inStart ?? 0.695;
      const o = timing?.outEnd ?? 0.829;
      const p1 = sg(s, s + lVal, progress);
      const ease1 = 1 - (1 - p1) * (1 - p1) * (1 - p1);
      const p2 = sg(o - lVal, o, progress);
      const ease2 = p2 * p2 * p2;
      return Math.max(1 - ease1, ease2);
    };

    let isSVGReady = false;
    let isTexturesReady = false;

    const setupSlates = () => {
      if (!isSVGReady || !isTexturesReady || !slateInnerGeometry) return;

      for (let i = 0; i < slatePortalIndices.length; i++) {
        const tex = i < slateTextures.length ? slateTextures[i] : null;
        const mat = createSlateMaterial(tex);
        const mesh = new THREE.Mesh(slateInnerGeometry, mat);
        mesh.frustumCulled = false;
        mesh.visible = false;
        tunnelScene.add(mesh);
        slateMaterials.push(mat);
        slateMeshes.push(mesh);
      }
    };

    // Load SVG Portal Geometry
    new SVGLoader().load("/portal-single.svg", (svgData) => {
      if (isDisposed || svgData.paths.length === 0) return;
      const subPaths = svgData.paths[0].subPaths;
      if (subPaths.length === 0) return;

      const pathAreas = subPaths.map((sp) => {
        const pts = sp.getPoints(8);
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        for (const p of pts) {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        }
        return { sp, area: (maxX - minX) * (maxY - minY) };
      });
      pathAreas.sort((a, b) => b.area - a.area);

      const shape = new THREE.Shape();
      shape.curves = pathAreas[0].sp.curves;
      for (let i = 1; i < pathAreas.length; i++) {
        const hole = new THREE.Path();
        hole.curves = pathAreas[i].sp.curves;
        shape.holes.push(hole);
      }

      const extrudeGeom = new THREE.ExtrudeGeometry([shape], {
        depth: 2,
        bevelEnabled: true,
        bevelThickness: 14,
        bevelSize: 14,
        bevelOffset: 0,
        bevelSegments: 2,
        curveSegments: 32,
        steps: 1,
      });
      extrudeGeom.rotateX(Math.PI);
      extrudeGeom.computeVertexNormals();

      extrudeGeom.computeBoundingBox();
      const bbox = extrudeGeom.boundingBox!;
      const scaleFactor = 1 / (bbox.max.y - bbox.min.y);
      extrudeGeom.scale(scaleFactor, scaleFactor, scaleFactor);
      extrudeGeom.computeBoundingBox();

      const center = extrudeGeom.boundingBox!.getCenter(new THREE.Vector3()).negate();
      extrudeGeom.translate(center.x, center.y, center.z);

      instancedPortalMesh = new THREE.InstancedMesh(extrudeGeom, portalMaterial, portalCount);
      instancedPortalMesh.frustumCulled = false;
      tunnelScene.add(instancedPortalMesh);

      if (pathAreas.length > 1) {
        const innerShape = new THREE.Shape();
        innerShape.curves = pathAreas[1].sp.curves;
        slateInnerGeometry = new THREE.ShapeGeometry(innerShape, 32);
        slateInnerGeometry.rotateX(Math.PI);
        slateInnerGeometry.scale(scaleFactor, scaleFactor, scaleFactor);
        slateInnerGeometry.translate(center.x, center.y, center.z);

        const posAttr = slateInnerGeometry.attributes.position;
        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity;
        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const y = posAttr.getY(i);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
        const spanX = maxX - minX || 1;
        const spanY = maxY - minY || 1;
        const uvs = new Float32Array(posAttr.count * 2);
        for (let i = 0; i < posAttr.count; i++) {
          uvs[i * 2] = (posAttr.getX(i) - minX) / spanX;
          uvs[i * 2 + 1] = (posAttr.getY(i) - minY) / spanY;
        }
        slateInnerGeometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      }

      isSVGReady = true;
      setupSlates();
      updateSceneStep();
    });

    // Load textures
    Promise.all([
      Promise.all(DEFAULT_BG_IMAGES.map(loadTex)),
      Promise.all(DEFAULT_SLATE_IMAGES.map(loadTex)),
      loadEndStation(),
    ])
      .then(([bgList, slateList, endTex]) => {
        if (isDisposed) return;

        bgTextures.push(...bgList);
        for (const t of bgList) {
          const img = t.image;
          const w = img?.width ?? 1;
          const h = img?.height ?? 1;
          bgAspects.push(h > 0 ? w / h : 1);
        }

        slateTextures.push(...slateList);
        endStationTex = endTex;
        endStationUniforms.part2Tex.value = endTex;
        const img = endTex.image;
        endStationUniforms.imageSize.value = [img.width, img.height];

        isTexturesReady = true;
        setLoaded(true);

        if (curtainRef.current) {
          curtainRef.current.style.opacity = "0";
          setTimeout(() => {
            if (curtainRef.current) {
              curtainRef.current.style.display = "none";
            }
          }, 1000);
        }
        if (loadingRef.current) {
          loadingRef.current.style.display = "none";
        }

        setupSlates();
        updateSceneStep();
      })
      .catch((err) => {
        console.error("Asset loading error:", err);
      });

    // Scroll physics & state variables
    let targetScroll = 0;
    let currentScroll = 0;
    let progressNormal = 0;
    let scrollExpansion = 0.4;
    let resetAnimState: { from: number; elapsed: number } | null = null;
    let warpAnimState: { from: number; to: number; elapsed: number; duration: number } | null = null;
    let lastProgressNormal = 0;

    warpToProgressRef.current = (targetProg: number) => {
      const clampedProg = Math.max(0, Math.min(1, targetProg));
      const targetDist = e9[Math.round(clampedProg * 4096)] || clampedProg * e8;
      warpAnimState = {
        from: currentScroll,
        to: targetDist,
        elapsed: 0,
        duration: 1.6,
      };
      setHasScrolled(true);
    };

    const updateSceneStep = () => {
      const rollAngle = pointerRoll * maxRoll;
      const progressT = sg(0, 403.5337, currentScroll);
      const stage1 = sg(0, 0.139394, progressT);
      const stage2 = sg(0.139394, 1, progressT);
      const rFactor = sg(0, 0.6, stage1);

      postUniforms.textureScale.value = 0 + 0.07 * rFactor;
      bgUniforms.scrollProgress.value = progressNormal;

      // End-station visibility & motion blur
      if (stage2 > 0 && endStationTex) {
        endStationMesh.visible = true;
        endStationUniforms.scrollY.value = stage2;
        endStationUniforms.scrollVel.value = (stage2 - lastProgressNormal) * 1;
        endStationUniforms.part2Alpha.value = sg(0, 0.001, stage2);
      } else {
        endStationMesh.visible = false;
      }
      lastProgressNormal = stage2;

      const bgCount = bgTextures.length;
      if (bgCount > 0 && progressNormal < 0.139394) {
        const bgWipe = sg(0.002, 0.139394, progressNormal);
        const screenAspect = width / height;
        let totalW = 0;
        for (let i = 0; i < bgCount; i++) {
          totalW += bgAspects[i] / screenAspect;
        }
        const cursorW = bgWipe * (totalW + 0.5);
        let activeIdx = 0;
        let activeLeft = 0;
        let runningW = 0;
        for (let i = 0; i < bgCount; i++) {
          if (runningW <= cursorW) {
            activeIdx = i;
            activeLeft = runningW;
          }
          runningW += bgAspects[i] / screenAspect;
        }

        const slotW = bgAspects[activeIdx] / screenAspect;
        bgUniforms.overlayTex.value = bgTextures[activeIdx];
        bgUniforms.overlayAspect.value = bgAspects[activeIdx];
        bgUniforms.overlayLeft.value = 0.5 - slotW + (cursorW - activeLeft);
        bgUniforms.overlayActive.value = 1;

        if (activeIdx > 0) {
          const prevW = bgAspects[activeIdx - 1] / screenAspect;
          const prevLeft = activeLeft - prevW;
          bgUniforms.overlayTex2.value = bgTextures[activeIdx - 1];
          bgUniforms.overlayAspect2.value = bgAspects[activeIdx - 1];
          bgUniforms.overlayLeft2.value = 0.5 - prevW + (cursorW - prevLeft);
          bgUniforms.overlayActive2.value = 1;
        } else {
          bgUniforms.overlayActive2.value = 0;
        }
      } else {
        bgUniforms.overlayActive.value = 0;
        bgUniforms.overlayActive2.value = 0;
      }

      if (!instancedPortalMesh) return;

      const expansionRatio = scrollExpansion / 0.4;
      const lVal = 0.01 * expansionRatio;

      for (let t = 0; t < portalCount; t++) {
        const nNorm = (portalZPositions[t] - startZ) / 66;
        dummyObj.position.set(0, 0, portalZPositions[t]);
        dummyObj.rotation.set(0, 0, nNorm * rollAngle);
        dummyObj.updateMatrix();
        instancedPortalMesh.setMatrixAt(t, dummyObj.matrix);
      }

      const instanceClip = sg(0, 0.005, progressNormal);
      const activeInstances = Math.max(1, Math.min(portalCount, 1 + Math.round(instanceClip * (portalCount - 1))));
      instancedPortalMesh.count = activeInstances;
      instancedPortalMesh.instanceMatrix.needsUpdate = true;

      const curTime = 0.001 * performance.now();
      for (let t = 0; t < slateMeshes.length; t++) {
        const portalIdx = slatePortalIndices[t];
        if (portalIdx >= portalCount || t >= slateTextures.length) {
          slateMeshes[t].visible = false;
          continue;
        }

        const zNorm = (portalZPositions[portalIdx] - startZ) / 66;
        const opacity = calcSlateOpacity(zNorm, t + 1, expansionRatio);
        slateMeshes[t].visible = opacity > 0;

        const mat = slateMaterials[t] as THREE.ShaderMaterial;
        if (mat.uniforms) {
          mat.uniforms.uOpacity.value = opacity;
          mat.uniforms.uFx.value = calcSlateGlitch(zNorm, t + 1, lVal);
          mat.uniforms.uTime.value = curTime;
        }
        slateMeshes[t].position.set(0, 0, portalZPositions[portalIdx]);
        slateMeshes[t].rotation.set(0, 0, zNorm * rollAngle);
      }
    };

    // Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 2.0,
    });

    lenis.on("scroll", (e: { velocity: number }) => {
      if (resetAnimState || warpAnimState) return;
      setHasScrolled(true);
      const speedScale = e5(e7(targetScroll));
      targetScroll = Math.max(0, Math.min(e8, targetScroll + e.velocity * 0.45 * speedScale));
    });

    const handleWheel = (e: WheelEvent) => {
      if (resetAnimState || warpAnimState) return;
      setHasScrolled(true);
      const speedScale = e5(e7(targetScroll));
      targetScroll = Math.max(0, Math.min(e8, targetScroll + 0.008 * e.deltaY * speedScale));
    };

    let touchStartY: number | null = null;
    let touchStartX: number | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (resetAnimState || warpAnimState || touchStartY === null) return;
      setHasScrolled(true);
      const dy = touchStartY - e.touches[0].clientY;
      const speedScale = e5(e7(targetScroll));
      targetScroll = Math.max(0, Math.min(e8, targetScroll + 2 * dy * 0.008 * speedScale));
      touchStartY = e.touches[0].clientY;

      if (touchStartX !== null) {
        const dx = (e.touches[0].clientX - touchStartX) / window.innerWidth;
        pointerTargetRoll += 8 * dx;
      }
      touchStartX = e.touches[0].clientX;
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const newDpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(newDpr);
      renderer.setSize(width, height, false);
      rtMain.setSize(Math.floor(width * newDpr), Math.floor(height * newDpr));
      rtBloom.setSize(
        Math.max(1, Math.floor((width * newDpr) / 4)),
        Math.max(1, Math.floor((height * newDpr) / 4))
      );

      camera.aspect = width / height;
      camera.fov = calcFov(width, height);
      camera.updateProjectionMatrix();

      orthoCamera.left = -width / 2;
      orthoCamera.right = width / 2;
      orthoCamera.top = height / 2;
      orthoCamera.bottom = -height / 2;
      orthoCamera.updateProjectionMatrix();

      bloomQuad.scale.set(width, height, 1);
      postQuad.scale.set(width, height, 1);

      bgUniforms.screen.value = [width, height];
      endStationUniforms.screen.value = [width, height];
      endStationUniforms.zoom.value = width < height ? 1.25 : 1;
      bloomUniforms.bloomTexel.value = [1 / (width * newDpr), 1 / (height * newDpr)];
    };
    window.addEventListener("resize", handleResize);

    let lastTime = performance.now();
    let prevScrollOffset = 0;
    let bgNoiseAmp = 0;

    const renderLoop = (time: number) => {
      lenis.raf(time);
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      // Handle Warp / Reset Animation
      if (warpAnimState) {
        warpAnimState.elapsed += dt;
        const norm = Math.min(1, warpAnimState.elapsed / warpAnimState.duration);
        const ease = norm < 0.5 ? 4 * norm * norm * norm : 1 - Math.pow(-2 * norm + 2, 3) / 2;
        currentScroll = targetScroll = warpAnimState.from + (warpAnimState.to - warpAnimState.from) * ease;
        if (norm >= 1) {
          warpAnimState = null;
        }
      } else if (resetAnimState) {
        resetAnimState.elapsed += dt;
        const norm = Math.min(1, resetAnimState.elapsed / 3);
        currentScroll = targetScroll = resetAnimState.from * (1 - norm * norm * (3 - 2 * norm));
        if (norm >= 1) {
          currentScroll = 0;
          targetScroll = 0;
          resetAnimState = null;
        }
      } else {
        const maxDelta = 1.7 * e5(e7(currentScroll));
        targetScroll = Math.max(currentScroll - maxDelta, Math.min(currentScroll + maxDelta, targetScroll));
        currentScroll += (targetScroll - currentScroll) * (1 - Math.exp(-dt / 0.41));
        if (currentScroll > e8) currentScroll = e8;
        if (currentScroll < 0) currentScroll = 0;
      }

      const currentProgress = e7(currentScroll);
      progressNormal = currentProgress;
      setScrollProgress(currentProgress);

      // Determine active sector index
      const secIdx = SECTORS.findIndex(
        (s) => currentProgress >= s.progressRange[0] && currentProgress <= s.progressRange[1]
      );
      if (secIdx !== -1) {
        if (secIdx !== prevSectorIdxRef.current && currentProgress > 0.04) {
          prevSectorIdxRef.current = secIdx;
          playTransitionWhoosh();
        }
        setActiveSectorIdx(secIdx);
      }

      const activeStage = sg(0.004, 1, currentProgress);
      scrollExpansion = 0.4 + 1.8 * sg(0, 0.139394, activeStage);

      const targetZOffset = 403.5337 * activeStage;
      const deltaZ = targetZOffset - prevScrollOffset;
      prevScrollOffset = targetZOffset;

      const rollActive = sg(0, 0.005, targetZOffset / 403.5337);
      pointerTargetRoll *= 0.985 * rollActive;
      pointerRoll += (pointerTargetRoll - pointerRoll) * 0.03;

      for (let i = 0; i < portalCount; i++) {
        portalZPositions[i] += deltaZ;
      }

      // Animate 3D Warp Stars
      const velocity = Math.abs(deltaZ) / Math.max(dt, 1e-4);
      const starPos = starGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < starCount; i++) {
        starPos[i * 3 + 2] += (0.15 + velocity * 0.08) * starSpeeds[i];
        if (starPos[i * 3 + 2] > 2.0) {
          starPos[i * 3 + 2] = -70.0;
        }
      }
      starGeometry.attributes.position.needsUpdate = true;

      updateSceneStep();

      // Audio whoosh synthesis tied to warp scroll velocity
      if (whooshGainRef.current && whooshFilterRef.current && audioContextRef.current) {
        const normalizedVel = Math.min(1.5, velocity / 65);
        whooshGainRef.current.gain.setTargetAtTime(
          soundEnabledRef.current ? normalizedVel * 0.28 : 0.0,
          audioContextRef.current.currentTime,
          0.04
        );
        whooshFilterRef.current.frequency.setTargetAtTime(
          220 + normalizedVel * 2200,
          audioContextRef.current.currentTime,
          0.04
        );
      }

      bgUniforms.time.value = time / 1000;
      bgNoiseAmp += (velocity - bgNoiseAmp) * 0.15;
      bgUniforms.noiseAmount.value = 0.004 * (1 + 9.9 * bgNoiseAmp);

      // 3 Render Passes
      renderer.setRenderTarget(rtMain);
      renderer.render(tunnelScene, camera);

      renderer.setRenderTarget(rtBloom);
      renderer.render(bloomScene, orthoCamera);

      renderer.setRenderTarget(null);
      renderer.render(compositeScene, orthoCamera);

      animFrameId = requestAnimationFrame(renderLoop);
    };

    animFrameId = requestAnimationFrame(renderLoop);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animFrameId);
      lenis.destroy();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("resize", handleResize);

      rtMain.dispose();
      rtBloom.dispose();
      bgMaterial.dispose();
      endStationMaterial.dispose();
      bloomMaterial.dispose();
      postMaterial.dispose();
      portalMaterial.dispose();
      envTexture.dispose();
      pmremGen.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  const activeSector = SECTORS[activeSectorIdx] || SECTORS[0];

  return (
    <>
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="block fixed inset-0 z-10 w-screen h-screen" />

      {/* Top Laser Progress Line */}
      <div className="fixed top-0 left-0 right-0 z-40 h-[2px] bg-white/10 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 via-white to-pink-500 laser-glow transition-all duration-75"
          style={{ width: `${(scrollProgress * 100).toFixed(1)}%` }}
        />
      </div>

      {/* Black Loading Curtain */}
      <div
        ref={curtainRef}
        className="fixed inset-0 z-[50] bg-black flex flex-col items-center justify-center p-6 pointer-events-none transition-opacity duration-1000"
        style={{ opacity: 1 }}
      >
        <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
          <div className="relative w-16 h-16 rounded-full border border-white/20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
            <span className="font-mono text-xs text-white/90 font-bold">{loadPercent}%</span>
          </div>
          <div>
            <div className="text-[11px] font-mono tracking-[0.25em] text-cyan-400 uppercase">
              // NEURAL LINK PROTOCOL
            </div>
            <div className="text-xl font-mono font-bold tracking-wider text-white mt-1">
              THE VOIDLINE // ARENA PRIME
            </div>
            <p className="text-[11px] font-mono text-white/50 mt-1">
              Calibrating hyperspace telemetry & volumetric shaders...
            </p>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-400 to-pink-500 h-full transition-all duration-300"
              style={{ width: `${loadPercent}%` }}
            />
          </div>
          <div
            ref={loadingRef}
            className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/50"
          >
            {loadingText}
          </div>
        </div>
      </div>

      {/* Intro "SCROLL TO DIVE" Guidance Pulse */}
      {!hasScrolled && loaded && (
        <div className="pointer-events-none fixed inset-0 z-20 flex flex-col items-center justify-center transition-opacity duration-700">
          <div className="relative flex flex-col items-center mt-32 space-y-3">
            <div className="hud-badge laser-glow">
              <span className="hud-badge-dot" />
              <span>HYPER-TUNNEL ENGAGED</span>
            </div>
            <div className="font-mono text-sm tracking-[0.25em] text-white/90 uppercase font-semibold">
              SCROLL DOWN TO DIVE
            </div>
            <div className="w-6 h-10 border border-white/30 rounded-full flex justify-center p-1">
              <div className="w-1.5 h-2 bg-cyan-400 rounded-full animate-bounce mt-1" />
            </div>
          </div>
        </div>
      )}

      {/* Sleek Minimalist Hyper-Warp Telemetry HUD (Replaces bulky card for pure cinematic viewport) */}
      {hasScrolled && scrollProgress < 0.76 && (
        <div className="pointer-events-none fixed bottom-7 left-8 z-20 hidden md:flex items-center gap-3.5 font-mono text-[11px] text-white/50 tracking-[0.2em] uppercase select-none transition-opacity duration-500">
          <div className="flex items-center gap-2 text-cyan-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
            <span className="font-bold tracking-widest text-cyan-300">SEC 0{activeSectorIdx + 1}</span>
          </div>
          <span className="text-white/20">//</span>
          <span className="text-white/90 font-medium tracking-wider">{activeSector.title}</span>
          <span className="text-white/20">//</span>
          <span className="text-white/50 text-[10px]">WARP DEPTH {(scrollProgress * 100).toFixed(0)}%</span>
        </div>
      )}

      {/* Pre-Modal Terminal Approach & Docking HUD (Progress 0.76 to 0.85) */}
      {/* Ensures the user NEVER sees an empty screen or gets confused before the finale! */}
      {hasScrolled && scrollProgress >= 0.76 && scrollProgress < 0.86 && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-16 z-30 max-w-lg w-full px-4 pointer-events-auto transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          <div className="approach-hud p-6 rounded-2xl relative overflow-hidden text-white">
            <div className="laser-sweep-line" />
            <div className="flex items-center justify-between mb-2">
              <span className="hud-badge border-amber-400/50 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping mr-1.5" />
                // ORBITAL DESCENT // CITADEL DOCKING
              </span>
              <span className="font-mono text-[10px] text-cyan-300 font-bold">
                ALIGNMENT: {Math.min(100, Math.round(((scrollProgress - 0.76) / 0.1) * 100))}%
              </span>
            </div>

            <h3 className="font-mono text-base md:text-lg font-bold tracking-wider uppercase mb-1">
              APPROACHING NEXUS CITADEL TERMINUS
            </h3>
            <p className="font-mono text-xs text-white/80 leading-relaxed mb-3">
              Deceleration sequence active. Disengaging warp stabilizers to prepare for Founder Command Terminal link.
            </p>

            {/* Live Telemetry Gauges */}
            <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-lg bg-black/60 border border-white/10 mb-4 font-mono text-[10px]">
              <div>
                <span className="text-white/50 block">VELOCITY:</span>
                <span className="text-cyan-400 font-bold">
                  {(Math.max(0.4, 5.8 * (1 - (scrollProgress - 0.76) / 0.1))).toFixed(1)} MACH ↓
                </span>
              </div>
              <div>
                <span className="text-white/50 block">SHIELDS:</span>
                <span className="text-emerald-400 font-bold">100% NOMINAL</span>
              </div>
              <div>
                <span className="text-white/50 block">AIRLOCK:</span>
                <span className="text-pink-400 font-bold">AUTHORIZED</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onMouseEnter={playHover}
                onClick={() => {
                  playThunderImpact();
                  warpToProgressRef.current?.(0.86);
                  setIsModalOpen(true);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-cyan-400 text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-cyan-300 hover:scale-105 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                ⚡ INSTANT DOCK AT CITADEL
              </button>
              <span className="font-mono text-[10px] text-white/60 text-center">
                Or scroll down to enter terminus
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Right-side Vertical Sector Navigation Scrubber */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-end gap-3 pointer-events-auto">
        {SECTORS.map((sec, idx) => {
          const isActive = idx === activeSectorIdx;
          return (
            <button
              key={sec.id}
              type="button"
              onMouseEnter={playHover}
              onClick={() => {
                playClick(440 + idx * 75);
                playSubDrop();
                warpToProgressRef.current?.(sec.progressRange[0] + 0.02);
              }}
              className="group flex items-center gap-2.5 transition-all text-right cursor-pointer"
              aria-label={`Jump to ${sec.name}`}
            >
              <span
                className={`font-mono text-[10px] tracking-wider uppercase transition-all duration-300 hidden md:block ${
                  isActive
                    ? "text-cyan-400 opacity-100 translate-x-0"
                    : "text-white/40 opacity-0 group-hover:opacity-80 translate-x-2 group-hover:translate-x-0"
                }`}
              >
                {sec.name}
              </span>
              <div
                className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                  isActive
                    ? "bg-cyan-400 border-white scale-125 laser-glow"
                    : "bg-black/60 border-white/30 group-hover:border-white/80"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Floating Re-Open Terminal Button if modal is minimized */}
      {scrollProgress >= 0.84 && !isModalOpen && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 pointer-events-auto animate-bounce">
          <button
            type="button"
            onClick={() => {
              playChime(600);
              setIsModalOpen(true);
            }}
            className="hud-glass px-6 py-3 rounded-full flex items-center gap-3 border border-cyan-400/60 text-white font-mono text-xs tracking-wider uppercase laser-glow hover:bg-cyan-950/40 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>OPEN NEXUS CITADEL TERMINAL [⚡]</span>
          </button>
        </div>
      )}

      {/* State-of-the-art Nexus Citadel Command Terminal Modal (Sector 05 >= 84%) */}
      {scrollProgress >= 0.84 && isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 md:p-8 pointer-events-auto transition-all duration-500 animate-in fade-in zoom-in-95">
          <div className="terminal-window max-w-3xl w-full max-h-[92vh] flex flex-col rounded-2xl overflow-hidden relative text-white">
            {/* Terminal Header Bar */}
            <div className="terminal-header px-6 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono text-xs font-bold tracking-wider text-cyan-300 uppercase">
                  NEXUS CITADEL // TERMINAL PRIME [v4.5]
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[10px] text-white/50 hidden sm:inline">
                  SECURITY: MAXIMUM (ALPHA CLEARANCE)
                </span>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center font-mono text-xs text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Minimize terminal to view 3D scene"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Interactive Tab Navigation */}
            <div className="flex border-b border-white/10 bg-black/50 px-4 md:px-6 overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onMouseEnter={playHover}
                onClick={() => {
                  playClick(500);
                  setActiveTab("access");
                }}
                className={`tab-btn whitespace-nowrap ${activeTab === "access" ? "active" : ""}`}
              >
                [01] FOUNDER PASS
              </button>
              <button
                type="button"
                onMouseEnter={playHover}
                onClick={() => {
                  playClick(560);
                  setActiveTab("fighters");
                }}
                className={`tab-btn whitespace-nowrap ${activeTab === "fighters" ? "active" : ""}`}
              >
                [02] FIGHTER ROSTER
              </button>
              <button
                type="button"
                onMouseEnter={playHover}
                onClick={() => {
                  playClick(620);
                  setActiveTab("saga");
                }}
                className={`tab-btn whitespace-nowrap ${activeTab === "saga" ? "active" : ""}`}
              >
                [03] TRANSMEDIA & OST
              </button>
              <button
                type="button"
                onMouseEnter={playHover}
                onClick={() => {
                  playClick(680);
                  setActiveTab("factions");
                }}
                className={`tab-btn whitespace-nowrap ${activeTab === "factions" ? "active" : ""}`}
              >
                [04] FACTION WAR
              </button>
            </div>

            {/* Terminal Body Content (Scrollable) */}
            <div className="overflow-y-auto p-5 md:p-7 space-y-6">
              {/* Tab 1: VIP Access & Holographic Key Card */}
              {activeTab === "access" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-mono text-xl md:text-2xl font-bold tracking-wider uppercase mb-1.5">
                      CLAIM FOUNDER CITADEL PASS
                    </h3>
                    <p className="font-mono text-xs leading-relaxed text-white/75">
                      Register your callsign to generate an authentic holographic Founder credential pass. Grants priority closed alpha flight slots, global anime premiere tickets, and direct council voting rights.
                    </p>
                  </div>

                  {registeredCallsign ? (
                    <div className="space-y-4">
                      {/* Holographic Credential Card */}
                      <div className="holo-card p-6 rounded-2xl relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="font-mono text-xs font-bold text-white tracking-wider">
                              THE VOIDLINE // CITADEL ARCHITECT PASS
                            </span>
                          </div>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                            {verifiedPass ? "ON-CHAIN VERIFIED ✓" : "ACTIVE PROTOCOL"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 font-mono text-xs">
                          <div>
                            <span className="text-white/40 text-[10px] block">CALLSIGN:</span>
                            <span className="text-white font-bold text-base tracking-wider">
                              {registeredCallsign.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="text-white/40 text-[10px] block">CLEARANCE RANK:</span>
                            <span className="text-cyan-400 font-bold text-sm">
                              TIER 01 ARCHITECT // PROTOCOL ARENA
                            </span>
                          </div>
                        </div>

                        <div className="font-mono text-[11px] text-cyan-300 break-all bg-black/70 p-3 rounded-lg border border-cyan-400/30 flex items-center justify-between my-3">
                          <span>VOID-VANGUARD-FOUNDER-PASS-8042</span>
                          <span className="text-white/40 text-[9px] ml-2 shrink-0">SHA256: 0x8F9...A3E</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={copyVanguardKey}
                            className="px-4 py-2 rounded-lg bg-cyan-400 text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-cyan-300 transition-colors cursor-pointer"
                          >
                            {copiedKey ? "COPIED TO CLIPBOARD ✓" : "COPY PASS KEY"}
                          </button>
                          <button
                            type="button"
                            onClick={downloadFounderCredentials}
                            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold uppercase tracking-wider border border-white/20 transition-colors cursor-pointer"
                          >
                            DOWNLOAD CERTIFICATE (.TXT)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              playChime(700);
                              setVerifiedPass(!verifiedPass);
                            }}
                            className="px-3 py-2 rounded-lg text-white/70 hover:text-white font-mono text-[10px] uppercase underline cursor-pointer"
                          >
                            {verifiedPass ? "RESET BADGE" : "VERIFY ON-CHAIN"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleRegisterCallsign} className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          required
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="ENTER YOUR CALLSIGN (E.G. VOID-WALKER)..."
                          className="grow px-4 py-3 rounded-lg bg-black/70 border border-white/20 font-mono text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors"
                        />
                        <button
                          type="submit"
                          className="px-6 py-3 rounded-lg bg-cyan-400 text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-cyan-300 hover:scale-105 active:scale-95 transition-all whitespace-nowrap cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.4)]"
                        >
                          CLAIM FOUNDER PASS →
                        </button>
                      </div>
                      <div className="text-[10px] font-mono text-white/50 flex items-center gap-2">
                        <span>SUGGESTIONS:</span>
                        {["VOID-RONIN", "CYBER-WOLF", "STEEL-VANGUARD"].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setEmailInput(s)}
                            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-cyan-300 cursor-pointer"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </form>
                  )}

                  {/* Vanguard Perks Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center hover:border-cyan-400/40 transition-colors">
                      <div className="text-cyan-400 text-lg mb-1">⚡</div>
                      <div className="font-mono text-[11px] font-bold">CLOSED ALPHA</div>
                      <div className="font-mono text-[9px] text-white/50 mt-0.5">Priority test flights</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center hover:border-cyan-400/40 transition-colors">
                      <div className="text-cyan-400 text-lg mb-1">🎬</div>
                      <div className="font-mono text-[11px] font-bold">ANIME PREMIERE</div>
                      <div className="font-mono text-[9px] text-white/50 mt-0.5">VIP stream tickets</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center hover:border-cyan-400/40 transition-colors">
                      <div className="text-cyan-400 text-lg mb-1">🥋</div>
                      <div className="font-mono text-[11px] font-bold">MYTHIC SKINS</div>
                      <div className="font-mono text-[9px] text-white/50 mt-0.5">Exclusive founder gear</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-center hover:border-cyan-400/40 transition-colors">
                      <div className="text-cyan-400 text-lg mb-1">🏛️</div>
                      <div className="font-mono text-[11px] font-bold">COUNCIL VOTE</div>
                      <div className="font-mono text-[9px] text-white/50 mt-0.5">Universe DAO token</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Fighter Roster & Combat Stats */}
              {activeTab === "fighters" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-mono text-xl font-bold tracking-wider uppercase mb-1">
                      CHAMPION ROSTER ARCHIVE
                    </h3>
                    <p className="font-mono text-xs text-white/70">
                      Select a champion to inspect their combat stats, fighting archetype, and signature special move.
                    </p>
                  </div>

                  {/* Fighter Selection Tabs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: "terry", name: "TERRY BOGARD", title: "THE HUNGRY WOLF" },
                      { id: "rock", name: "ROCK HOWARD", title: "FALLEN ANGEL" },
                      { id: "haohmaru", name: "HAOHMARU", title: "THE WANDERING BLADE" },
                      { id: "marco", name: "MARCO ROSSI", title: "HEAVY COMMANDER" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          playChime(520 + (f.id === "terry" ? 0 : f.id === "rock" ? 50 : f.id === "haohmaru" ? 100 : 150));
                          setSelectedFighter(f.id as typeof selectedFighter);
                        }}
                        className={`fighter-pill p-3 rounded-xl text-left cursor-pointer ${
                          selectedFighter === f.id ? "selected" : ""
                        }`}
                      >
                        <div className="font-mono text-xs font-bold text-white">{f.name}</div>
                        <div className="font-mono text-[9px] text-cyan-400/80">{f.title}</div>
                      </button>
                    ))}
                  </div>

                  {/* Selected Fighter Detailed Card */}
                  {selectedFighter === "terry" && (
                    <div className="p-5 rounded-xl bg-black/60 border border-cyan-400/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-lg font-bold text-white">TERRY BOGARD</div>
                          <div className="font-mono text-xs text-cyan-400">CLASS: KINETIC STRIKER // SOUTH TOWN ICON</div>
                        </div>
                        <span className="font-mono text-xs px-2.5 py-1 rounded bg-cyan-400/20 text-cyan-300 font-bold border border-cyan-400/40">
                          DIFFICULTY: ★★☆☆☆
                        </span>
                      </div>
                      <p className="font-mono text-xs text-white/80 leading-relaxed italic">
                        &quot;Hey, c&apos;mon c&apos;mon! The streets of South Town never sleep, and neither does a true fighting spirit.&quot;
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 font-mono text-[10px]">
                        <div>
                          <span className="text-white/50 block">ATTACK: 92%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-cyan-400 h-full w-[92%]" />
                          </div>
                        </div>
                        <div>
                          <span className="text-white/50 block">SPEED: 88%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-cyan-400 h-full w-[88%]" />
                          </div>
                        </div>
                        <div>
                          <span className="text-white/50 block">RANGE: 75%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-cyan-400 h-full w-[75%]" />
                          </div>
                        </div>
                        <div>
                          <span className="text-white/50 block">DEFENSE: 82%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-cyan-400 h-full w-[82%]" />
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/10 text-[10px] font-mono text-white/60">
                        SIGNATURE MOVES: <span className="text-white font-bold">POWER GEYSER • BUSTER WOLF • BURN KNUCKLE</span>
                      </div>
                    </div>
                  )}

                  {selectedFighter === "rock" && (
                    <div className="p-5 rounded-xl bg-black/60 border border-pink-400/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-lg font-bold text-white">ROCK HOWARD</div>
                          <div className="font-mono text-xs text-pink-400">CLASS: HYBRID RUSHDOWN // NEO-GEESE MARTIAL ARTS</div>
                        </div>
                        <span className="font-mono text-xs px-2.5 py-1 rounded bg-pink-400/20 text-pink-300 font-bold border border-pink-400/40">
                          DIFFICULTY: ★★★☆☆
                        </span>
                      </div>
                      <p className="font-mono text-xs text-white/80 leading-relaxed italic">
                        &quot;I will carve my own destiny away from the shadow of my bloodline. My wings belong to me.&quot;
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 font-mono text-[10px]">
                        <div>
                          <span className="text-white/50 block">ATTACK: 89%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-pink-400 h-full w-[89%]" />
                          </div>
                        </div>
                        <div>
                          <span className="text-white/50 block">SPEED: 96%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-pink-400 h-full w-[96%]" />
                          </div>
                        </div>
                        <div>
                          <span className="text-white/50 block">RANGE: 70%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-pink-400 h-full w-[70%]" />
                          </div>
                        </div>
                        <div>
                          <span className="text-white/50 block">DEFENSE: 78%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-pink-400 h-full w-[78%]" />
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/10 text-[10px] font-mono text-white/60">
                        SIGNATURE MOVES: <span className="text-white font-bold">RAGING STORM • SHINE KNUCKLE • CRACK COUNTER</span>
                      </div>
                    </div>
                  )}

                  {selectedFighter === "haohmaru" && (
                    <div className="p-5 rounded-xl bg-black/60 border border-amber-400/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-lg font-bold text-white">HAOHMARU</div>
                          <div className="font-mono text-xs text-amber-400">CLASS: ONE-HIT PRECISION // TENHA SHIN KEN</div>
                        </div>
                        <span className="font-mono text-xs px-2.5 py-1 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40">
                          DIFFICULTY: ★★★★☆
                        </span>
                      </div>
                      <p className="font-mono text-xs text-white/80 leading-relaxed italic">
                        &quot;A single stroke of the blade decides honor or ruin. Draw your weapon with absolute resolve.&quot;
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 font-mono text-[10px]">
                        <div>
                          <span className="text-white/50 block">ATTACK: 98%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-amber-400 h-full w-[98%]" />
                          </div>
                        </div>
                        <div>
                          <span className="text-white/50 block">SPEED: 76%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-amber-400 h-full w-[76%]" />
                          </div>
                        </div>
                        <div>
                          <span className="text-white/50 block">RANGE: 92%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-amber-400 h-full w-[92%]" />
                          </div>
                        </div>
                        <div>
                          <span className="text-white/50 block">DEFENSE: 86%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-amber-400 h-full w-[86%]" />
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/10 text-[10px] font-mono text-white/60">
                        SIGNATURE MOVES: <span className="text-white font-bold">TENHA SEIOU ZAN • KOGETSUZAN • SENPUURETSUZAN</span>
                      </div>
                    </div>
                  )}

                  {selectedFighter === "marco" && (
                    <div className="p-5 rounded-xl bg-black/60 border border-emerald-400/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-lg font-bold text-white">MARCO ROSSI</div>
                          <div className="font-mono text-xs text-emerald-400">CLASS: TACTICAL HEAVY // METAL SLUG COMMAND</div>
                        </div>
                        <span className="font-mono text-xs px-2.5 py-1 rounded bg-emerald-400/20 text-emerald-300 font-bold border border-emerald-400/40">
                          DIFFICULTY: ★★☆☆☆
                        </span>
                      </div>
                      <p className="font-mono text-xs text-white/80 leading-relaxed italic">
                        &quot;Heavy artillery incoming! Lock down the perimeter and unleash the bullet storm!&quot;
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 font-mono text-[10px]">
                        <div>
                          <span className="text-white/50 block">ATTACK: 95%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-emerald-400 h-full w-[95%]" />
                          </div>
                        </div>
                        <div>
                          <span className="text-white/50 block">SPEED: 68%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-emerald-400 h-full w-[68%]" />
                          </div>
                        </div>
                        <div>
                          <span className="text-white/50 block">RANGE: 96%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-emerald-400 h-full w-[96%]" />
                          </div>
                        </div>
                        <div>
                          <span className="text-white/50 block">DEFENSE: 92%</span>
                          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                            <div className="bg-emerald-400 h-full w-[92%]" />
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-white/10 text-[10px] font-mono text-white/60">
                        SIGNATURE MOVES: <span className="text-white font-bold">SLUG LASER BARRAGE • HEAVY ARMORED MECHA • VULCAN CANNON</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Transmedia Saga & OST Synthesizer Player */}
              {activeTab === "saga" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-mono text-xl font-bold tracking-wider uppercase mb-1">
                      TRANSMEDIA SAGA & OST VAULT
                    </h3>
                    <p className="font-mono text-xs text-white/70">
                      Explore the prestige anime adaptation and audition the original cyberpunk synth soundtrack.
                    </p>
                  </div>

                  {/* Interactive Cyberpunk OST Player */}
                  <div className="p-5 rounded-xl bg-cyan-950/40 border border-cyan-400/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-black/70 border border-cyan-400/50 flex items-center justify-center text-cyan-400 text-xl font-bold">
                        ⚡
                      </div>
                      <div>
                        <div className="font-mono text-sm font-bold text-white">VOID DRIFT // NEON DYNASTY</div>
                        <div className="font-mono text-[10px] text-cyan-300">ORIGINAL CYBERPUNK SYNTH SCORE</div>
                        {isPlayingOst && (
                          <div className="flex items-center gap-1 mt-1.5 h-3">
                            <span className="w-1 bg-cyan-400 h-full animate-bounce" />
                            <span className="w-1 bg-cyan-400 h-full animate-bounce delay-75" />
                            <span className="w-1 bg-cyan-400 h-full animate-bounce delay-150" />
                            <span className="w-1 bg-cyan-400 h-full animate-bounce delay-300" />
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={togglePlayOst}
                      className="px-5 py-2.5 rounded-lg bg-cyan-400 text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-cyan-300 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      {isPlayingOst ? "⏸ PAUSE TRACK" : "▶ PLAY OST PREVIEW"}
                    </button>
                  </div>

                  {/* Transmedia Release Timeline */}
                  <div className="space-y-4 pt-2">
                    <div className="roadmap-step">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">PHASE 01 // Q1 2027</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                          ACTIVE TEST
                        </span>
                      </div>
                      <div className="font-mono text-sm font-semibold text-white mt-0.5">
                        Closed Alpha Test Flight & FGC Invitational
                      </div>
                      <p className="font-mono text-[11px] text-white/60 mt-0.5">
                        Rollback netcode validation, South Town arenas, and initial 12 combatants playable.
                      </p>
                    </div>

                    <div className="roadmap-step">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white/90">PHASE 02 // Q2 2027</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">
                          SCHEDULED
                        </span>
                      </div>
                      <div className="font-mono text-sm font-semibold text-white mt-0.5">
                        Anime Series Global Premiere & Digital Manga
                      </div>
                      <p className="font-mono text-[11px] text-white/60 mt-0.5">
                        12-episode prestige anime directed by top Tokyo visionary animators.
                      </p>
                    </div>

                    <div className="roadmap-step">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white/90">PHASE 03 // Q3 2027</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">
                          UPCOMING
                        </span>
                      </div>
                      <div className="font-mono text-sm font-semibold text-white mt-0.5">
                        Worldwide FGC World Championship & OST Drop
                      </div>
                      <p className="font-mono text-[11px] text-white/60 mt-0.5">
                        $1,000,000 prize pool world tour across Tokyo, Las Vegas, Paris, and Seoul.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Factions & Community */}
              {activeTab === "factions" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-mono text-xl font-bold tracking-wider uppercase mb-1">
                      GLOBAL FACTION ALLEGIANCE WAR
                    </h3>
                    <p className="font-mono text-xs text-white/70">
                      Pledge allegiance to a faction. Territory influence dictates universe storylines and seasonal anime battle outcomes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Wolves Syndicate */}
                    <div
                      onClick={() => pledgeFaction("wolves")}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedFaction === "wolves"
                          ? "bg-cyan-950/60 border-cyan-400 laser-glow"
                          : "bg-white/5 border-white/15 hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-cyan-400">🐺 WOLVES</span>
                        <span className="font-mono text-xs font-bold text-white">
                          {(
                            (factionPledges.wolves /
                              (factionPledges.wolves + factionPledges.iron + factionPledges.shinobi)) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-cyan-300 font-bold mb-1">PERK: +15% COMBO SPEED</div>
                      <p className="font-mono text-[11px] text-white/70 leading-relaxed mb-3">
                        Underground martial masters fighting for street supremacy and personal freedom.
                      </p>
                      <button
                        type="button"
                        className="w-full py-1.5 rounded font-mono text-[10px] uppercase font-bold tracking-wider bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-400 hover:text-black transition-colors"
                      >
                        {selectedFaction === "wolves" ? "PLEDGED ✓" : "PLEDGE"}
                      </button>
                    </div>

                    {/* Iron Vanguard */}
                    <div
                      onClick={() => pledgeFaction("iron")}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedFaction === "iron"
                          ? "bg-pink-950/60 border-pink-400 laser-glow"
                          : "bg-white/5 border-white/15 hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-pink-400">🛡️ IRON</span>
                        <span className="font-mono text-xs font-bold text-white">
                          {(
                            (factionPledges.iron /
                              (factionPledges.wolves + factionPledges.iron + factionPledges.shinobi)) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-pink-300 font-bold mb-1">PERK: +20% GUARD ARMOR</div>
                      <p className="font-mono text-[11px] text-white/70 leading-relaxed mb-3">
                        Heavy armored tacticians enforcing cybernetic order and laser artillery lines.
                      </p>
                      <button
                        type="button"
                        className="w-full py-1.5 rounded font-mono text-[10px] uppercase font-bold tracking-wider bg-pink-400/20 text-pink-300 border border-pink-400/40 hover:bg-pink-400 hover:text-black transition-colors"
                      >
                        {selectedFaction === "iron" ? "PLEDGED ✓" : "PLEDGE"}
                      </button>
                    </div>

                    {/* Shinobi Clan */}
                    <div
                      onClick={() => pledgeFaction("shinobi")}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedFaction === "shinobi"
                          ? "bg-amber-950/60 border-amber-400 laser-glow"
                          : "bg-white/5 border-white/15 hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-amber-400">🗡️ SHINOBI</span>
                        <span className="font-mono text-xs font-bold text-white">
                          {(
                            (factionPledges.shinobi /
                              (factionPledges.wolves + factionPledges.iron + factionPledges.shinobi)) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-amber-300 font-bold mb-1">PERK: +25% COUNTER CRIT</div>
                      <p className="font-mono text-[11px] text-white/70 leading-relaxed mb-3">
                        Silent blade shadows striking with single-hit lethal precision from darkness.
                      </p>
                      <button
                        type="button"
                        className="w-full py-1.5 rounded font-mono text-[10px] uppercase font-bold tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400 hover:text-black transition-colors"
                      >
                        {selectedFaction === "shinobi" ? "PLEDGED ✓" : "PLEDGE"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-white/50 border-t border-white/10">
                    <div>
                      TOTAL PLEDGES:{" "}
                      <span className="text-white font-bold">
                        {(factionPledges.wolves + factionPledges.iron + factionPledges.shinobi).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      CITADEL NETWORK: <span className="text-cyan-400 font-bold">16 NODES ONLINE</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Terminal Footer with Links and Actions */}
            <div className="p-4 px-6 md:px-8 border-t border-white/10 bg-black/60 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono shrink-0">
              <div className="flex items-center gap-3">
                <a
                  href="https://discord.gg/thearena"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 transition-colors"
                >
                  [ DISCORD GUILD ]
                </a>
                <span className="text-white/20">•</span>
                <a
                  href="https://www.thearenarising.com/h/s/5erjaJURvdd6LDEXDScPD"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-400 transition-colors"
                >
                  [ FAN SURVEY ]
                </a>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  [ EXPLORE 3D SCENE ]
                </button>
                <span className="text-white/20">•</span>
                <button
                  type="button"
                  onClick={() => {
                    playChime(350);
                    warpToProgressRef.current?.(0);
                  }}
                  className="text-cyan-400 hover:text-white transition-colors cursor-pointer font-bold"
                >
                  [ WARP TO START ↑ ]
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Main Interface Overlay */}
      <div className="pointer-events-none fixed inset-0 z-[15] font-mono text-white">
        {/* Top Center Logo & Title */}
        <div className="absolute top-6 left-0 right-0 flex flex-col items-center">
          <button
            type="button"
            onClick={() => {
              playChime(440);
              warpToProgressRef.current?.(0);
            }}
            className="pointer-events-auto cursor-pointer flex items-center gap-3 transition-transform hover:scale-105"
            title="Click to reset to beginning"
          >
            <img
              alt="The Voidline"
              src="/poc-overlay/logo.svg"
              className="h-7 portrait:h-5 w-auto drop-shadow-[1px_1px_0px_rgba(0,0,0,0.1)]"
            />
          </button>
        </div>

        {/* Top Right Sound & Audio Visualizer */}
        <div className="pointer-events-auto absolute top-5 right-6 flex select-none items-center gap-3 text-[11px] leading-none tracking-[0em] text-white/80">
          <button
            type="button"
            onClick={toggleSound}
            onMouseEnter={playHover}
            className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/20 bg-black/70 backdrop-blur-md hover:border-cyan-400/60 hover:bg-cyan-950/40 transition-all cursor-pointer font-mono text-[10px] tracking-widest text-white shadow-[0_0_15px_rgba(0,0,0,0.6)]"
            title={soundEnabled ? "Click to Mute Audio" : "Click to Enable Cinema Sound"}
          >
            <div className="flex items-end gap-[3px] h-3.5">
              <div className={`w-[2.5px] rounded-full transition-all ${soundEnabled ? "bg-cyan-400 eq-bar-1" : "bg-white/30 h-1"}`} />
              <div className={`w-[2.5px] rounded-full transition-all ${soundEnabled ? "bg-cyan-400 eq-bar-2" : "bg-white/30 h-1.5"}`} />
              <div className={`w-[2.5px] rounded-full transition-all ${soundEnabled ? "bg-cyan-400 eq-bar-3" : "bg-white/30 h-1"}`} />
              <div className={`w-[2.5px] rounded-full transition-all ${soundEnabled ? "bg-cyan-400 eq-bar-4" : "bg-white/30 h-2"}`} />
            </div>
            <span>CINEMA AUDIO // {soundEnabled ? "LIVE [ACT]" : "MUTED"}</span>
          </button>
        </div>

        {/* Bottom Social Icons */}
        <div className="pointer-events-auto absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4 text-white/75 portrait:bottom-14 portrait:left-auto portrait:right-6 portrait:translate-x-0">
          <a
            href="https://www.instagram.com/thearena/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="hover:text-cyan-400 transition-colors"
          >
            <svg viewBox="32 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-auto" aria-hidden="true">
              <path
                d="M40.0007 1.44402C42.1381 1.44402 42.3888 1.45083 43.2334 1.48761C44.014 1.52576 44.4363 1.65653 44.7196 1.76415C45.067 1.89357 45.3817 2.09791 45.6405 2.36356C45.9062 2.62239 46.1105 2.93844 46.2372 3.28582C46.3462 3.56509 46.4756 3.9874 46.5138 4.76935C46.5519 5.61396 46.5587 5.86462 46.5587 8.00204C46.5587 10.1395 46.5519 10.3901 46.5138 11.2347C46.5074 11.7423 46.4139 12.2451 46.2372 12.721C46.1041 13.0658 45.9003 13.379 45.6389 13.6403C45.3776 13.9017 45.0644 14.1055 44.7196 14.2386C44.4363 14.3476 44.014 14.477 43.2334 14.5151C42.3888 14.5533 42.1381 14.5601 40.0007 14.5601C37.8619 14.5601 37.6126 14.5533 36.768 14.5151C36.2604 14.5089 35.7576 14.4154 35.2817 14.2386C34.9338 14.1102 34.619 13.9054 34.3608 13.6392C34.0951 13.3808 33.8907 13.0661 33.7628 12.7183C33.6552 12.439 33.5244 12.0153 33.4862 11.2347C33.4481 10.3901 33.4427 10.1395 33.4427 8.00204C33.4427 5.86326 33.4481 5.61396 33.4862 4.76935C33.5244 3.9874 33.6552 3.56509 33.7628 3.2831C33.8922 2.93435 34.0966 2.61967 34.3622 2.3622C34.621 2.09655 34.9371 1.89221 35.2845 1.76415C35.5637 1.65653 35.986 1.52576 36.768 1.48761C37.6126 1.45083 37.8633 1.44402 40.0007 1.44402ZM40.0007 0C37.8278 0 37.5554 0.0081737 36.7012 0.0463176C36.0375 0.0610033 35.3812 0.188136 34.76 0.422307C34.2264 0.622725 33.743 0.93698 33.3432 1.34321C32.9359 1.74372 32.6212 2.22869 32.4196 2.76271C32.188 3.38391 32.0627 4.0378 32.0477 4.69987C32.0095 5.55811 32 5.83057 32 8.00341C32 10.1749 32.0095 10.4487 32.0477 11.3029C32.0858 12.1543 32.2234 12.7319 32.4196 13.2427C32.6198 13.7768 32.9345 14.2604 33.3405 14.6595C33.741 15.0655 34.226 15.3815 34.76 15.5804C35.3812 15.8134 36.0378 15.9414 36.7012 15.955C37.5595 15.9932 37.8278 16.0027 40.0007 16.0027C42.1722 16.0027 42.446 15.9932 43.3001 15.955C44.1516 15.9169 44.7319 15.7807 45.24 15.5831C45.7717 15.3777 46.2546 15.0634 46.6577 14.6604C47.0607 14.2573 47.375 13.7744 47.5804 13.2427C47.8134 12.6215 47.9387 11.9663 47.9523 11.3029C47.9905 10.4487 48 10.1749 48 8.00341C48 5.83057 47.9905 5.55811 47.9523 4.70396C47.9389 4.04051 47.8132 3.38413 47.5804 2.76271C47.38 2.22917 47.0657 1.7457 46.6595 1.34593C46.2604 0.938612 45.774 0.623925 45.24 0.422307C44.6199 0.189595 43.965 0.0633942 43.3029 0.0490421C42.4446 0.0108982 42.1722 0 40.0007 0Z"
                fill="currentColor"
              />
              <path
                d="M39.9997 3.51081C38.9096 3.51081 37.8642 3.94382 37.0934 4.7146C36.3227 5.48537 35.8896 6.53077 35.8896 7.62081C35.8896 8.71085 36.3227 9.75625 37.0934 10.527C37.8642 11.2978 38.9096 11.7308 39.9997 11.7308C41.0897 11.7308 42.1351 11.2978 42.9059 10.527C43.6766 9.75625 44.1097 8.71085 44.1097 7.62081C44.1097 6.53077 43.6766 5.48537 42.9059 4.7146C42.1351 3.94382 41.0897 3.51081 39.9997 3.51081ZM39.9997 10.2882C39.2922 10.2882 38.6138 10.0071 38.1136 9.50691C37.6133 9.00669 37.3323 8.32824 37.3323 7.62081C37.3323 6.91339 37.6133 6.23494 38.1136 5.73471C38.6138 5.23449 39.2922 4.95346 39.9997 4.95346C40.7071 4.95346 41.3855 5.23449 41.8858 5.73471C42.386 6.23494 42.667 6.91339 42.667 7.62081C42.667 8.32824 42.386 9.00669 41.8858 9.50691C41.3855 10.0071 40.7071 10.2882 39.9997 10.2882ZM44.2704 4.3091C44.5249 4.3091 44.7691 4.20799 44.949 4.02801C45.129 3.84802 45.2301 3.60391 45.2301 3.34938C45.2301 3.09484 45.129 2.85073 44.949 2.67075C44.7691 2.49076 44.5249 2.38965 44.2704 2.38965C44.0159 2.38965 43.7718 2.49076 43.5918 2.67075C43.4118 2.85073 43.3107 3.09484 43.3107 3.34938C43.3107 3.60391 43.4118 3.84802 43.5918 4.02801C43.7718 4.20799 44.0159 4.3091 44.2704 4.3091Z"
                fill="currentColor"
              />
            </svg>
          </a>
          <a
            href="https://www.tiktok.com/@thearenahq"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="hover:text-cyan-400 transition-colors"
          >
            <svg viewBox="64 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-auto" aria-hidden="true">
              <path
                d="M71.3025 0.0143162C72.176 0.000976613 73.043 0.00791313 73.9096 0.000976562C73.9384 1.08468 74.3781 2.06007 75.0776 2.78254L75.0765 2.78147C75.8294 3.45966 76.8091 3.89933 77.889 3.97403L77.904 3.9751V6.66222C76.8838 6.63661 75.9244 6.4013 75.0594 5.99684L75.1032 6.01498C74.6849 5.81382 74.3311 5.60733 73.995 5.37682L74.0227 5.39496C74.0163 7.342 74.0291 9.28905 74.0094 11.2292C73.9544 12.2179 73.6257 13.1196 73.0985 13.8725L73.1092 13.856C72.2277 15.1184 70.7999 15.9471 69.1762 15.9962H69.1687C69.1031 15.9994 69.0257 16.001 68.9478 16.001C68.0247 16.001 67.1619 15.7438 66.4266 15.2972L66.448 15.3095C65.1097 14.5043 64.1866 13.1266 64.0159 11.5242L64.0138 11.5023C64.0004 11.1689 63.994 10.8354 64.0074 10.5088C64.2688 7.95882 66.4053 5.98617 69.0022 5.98617C69.2941 5.98617 69.5801 6.01125 69.8581 6.05874L69.8282 6.05447C69.8415 7.04106 69.8015 8.02819 69.8015 9.01478C69.5758 8.93314 69.3154 8.88566 69.0438 8.88566C68.0471 8.88566 67.1992 9.52275 66.8855 10.4122L66.8807 10.4282C66.8097 10.6561 66.7686 10.9181 66.7686 11.1891C66.7686 11.299 66.7756 11.4079 66.7884 11.5146L66.7873 11.5018C66.9645 12.5935 67.9004 13.4174 69.0289 13.4174C69.0615 13.4174 69.0935 13.4168 69.1255 13.4152H69.1207C69.9013 13.3918 70.579 12.9718 70.9621 12.3513L70.9674 12.3417C71.1099 12.1432 71.2075 11.9031 71.2401 11.6421L71.2406 11.6347C71.3073 10.441 71.2806 9.25436 71.287 8.06074C71.2934 5.37362 71.2806 2.6929 71.3004 0.0127154L71.3025 0.0143162Z"
                fill="currentColor"
              />
            </svg>
          </a>
        </div>

        {/* Bottom Left Privacy / Terms */}
        <div className="pointer-events-auto absolute bottom-6 left-6 flex gap-3 text-[11px] leading-tight tracking-[0em] text-white/75">
          <a href="/privacy-policy" className="hover:text-cyan-400 transition-colors">
            [PRIVACY]
          </a>
          <a href="/terms" className="hover:text-cyan-400 transition-colors">
            [TERMS]
          </a>
        </div>

        {/* Bottom Right Copyright & Status */}
        <div className="absolute bottom-6 right-6 text-[11px] tracking-[0.05em] text-white/75 flex items-center gap-3">
          <span className="hidden sm:inline-block text-white/40">// TRANSMEDIA UNIVERSE</span>
          <span>© 2026 THE VOIDLINE // ARENA PRIME</span>
        </div>
      </div>
    </>
  );
}

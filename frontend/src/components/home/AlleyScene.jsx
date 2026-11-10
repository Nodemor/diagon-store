import { memo } from "react";

// Illustrated night street drawn in SVG: two rows of crooked buildings, lit windows,
// hanging shop signs and street lamps. Deterministic (seeded) so it never "jumps" between renders.
// Classes used by the hero animation: .alley-back, .alley-win, .alley-lamp, .alley-halo

function seeded(seed) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const WIDTH = 3000; // wide drawing: its height follows the screen width, so nothing is cropped
const HEIGHT = 440;
const GROUND = 392;

function buildRow(rand, { minW, maxW, minH, maxH }) {
  const buildings = [];
  let x = -20;
  while (x < WIDTH + 20) {
    const w = minW + rand() * (maxW - minW);
    const h = minH + rand() * (maxH - minH);
    const roof = rand() < 0.55 ? "gable" : rand() < 0.5 ? "step" : "flat";
    const lean = (rand() - 0.5) * 10; // crooked tops
    buildings.push({ x, w, h, roof, lean, chimney: rand() < 0.45 });
    x += w - 2;
  }
  return buildings;
}

function facadePath({ x, w, h, roof, lean }) {
  const top = GROUND - h;
  const l = x;
  const r = x + w;
  if (roof === "gable") {
    const peak = top - w * 0.42;
    return `M${l},${GROUND} L${l},${top} L${l + w / 2 + lean},${peak} L${r},${top + lean * 0.4} L${r},${GROUND} Z`;
  }
  if (roof === "step") {
    const step = w * 0.22;
    return `M${l},${GROUND} L${l},${top + 18} L${l + step},${top + 18} L${l + step},${top} L${r - step},${top + lean} L${r - step},${top + 18} L${r},${top + 18} L${r},${GROUND} Z`;
  }
  return `M${l},${GROUND} L${l},${top} L${r},${top + lean} L${r},${GROUND} Z`;
}

function windowsFor(building, rand) {
  const wins = [];
  const cols = Math.max(1, Math.floor((building.w - 24) / 30));
  const rows = Math.max(1, Math.floor((building.h - 70) / 44));
  const gap = (building.w - cols * 14) / (cols + 1);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const lit = rand();
      wins.push({
        x: building.x + gap + col * (14 + gap),
        y: GROUND - building.h + 30 + row * 44,
        lit: lit > 0.42 ? 0.35 + lit * 0.65 : 0.08,
      });
    }
  }
  return wins;
}

const LAMPS = Array.from({ length: 9 }, (_, i) => 160 + i * 335);

function AlleySceneBase({ className = "" }) {
  const rand = seeded(7);
  const back = buildRow(rand, { minW: 70, maxW: 130, minH: 200, maxH: 330 });
  const front = buildRow(rand, { minW: 110, maxW: 200, minH: 130, maxH: 250 });

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="xMidYMax slice"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#f7d38a" stopOpacity="0.9" />
          <stop offset="0.25" stopColor="#f2b544" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f2b544" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="streetFog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9b3c4" stopOpacity="0" />
          <stop offset="0.6" stopColor="#a9b3c4" stopOpacity="0.08" />
          <stop offset="1" stopColor="#a9b3c4" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#151a26" />
          <stop offset="1" stopColor="#1c2230" />
        </linearGradient>
      </defs>

      {/* far row */}
      <g className="alley-back" fill="#252d3f">
        {back.map((b, i) => (
          <g key={`b${i}`}>
            <path d={facadePath(b)} />
            {b.chimney && <rect x={b.x + b.w * 0.7} y={GROUND - b.h - 26} width="12" height="30" />}
          </g>
        ))}
        {back.flatMap((b, i) =>
          windowsFor(b, rand)
            .filter((_, j) => j % 2 === 0)
            .map((w, j) => (
              <rect key={`bw${i}-${j}`} className="alley-win" x={w.x} y={w.y} width="10" height="16" rx="1" fill="#f2b544" opacity={w.lit * 0.55} />
            )),
        )}
      </g>

      {/* near row */}
      <g fill="#171c28">
        {front.map((b, i) => (
          <g key={`f${i}`}>
            <path d={facadePath(b)} />
            {b.chimney && <rect x={b.x + b.w * 0.25} y={GROUND - b.h - 40} width="14" height="40" />}
            {/* shop door + hanging sign on every other building */}
            {i % 2 === 0 && (
              <>
                <path d={`M${b.x + b.w / 2 - 15},${GROUND} v-38 a15,15 0 0 1 30,0 v38 Z`} fill="#f2b544" opacity="0.18" className="alley-win" />
                <line x1={b.x + b.w - 8} y1={GROUND - 96} x2={b.x + b.w + 22} y2={GROUND - 96} stroke="#3a4357" strokeWidth="3" />
                <rect x={b.x + b.w + 2} y={GROUND - 92} width="26" height="20" rx="2" fill="#2f6f68" />
              </>
            )}
          </g>
        ))}
        {front.flatMap((b, i) =>
          windowsFor(b, rand).map((w, j) => (
            <rect key={`fw${i}-${j}`} className="alley-win" x={w.x} y={w.y} width="14" height="22" rx="2" fill="#f2b544" opacity={w.lit} />
          )),
        )}
      </g>

      {/* cobbled ground */}
      <rect x="0" y={GROUND} width={WIDTH} height={HEIGHT - GROUND} fill="url(#ground)" />
      {Array.from({ length: 98 }, (_, i) => (
        <ellipse key={`c${i}`} cx={i * 31 + (i % 2) * 14} cy={GROUND + 18 + (i % 3) * 9} rx="12" ry="3" fill="#232a3a" />
      ))}

      {/* low fog along the street */}
      <rect x="0" y={GROUND - 26} width={WIDTH} height="40" fill="url(#streetFog)" />

      {/* street lamps */}
      {LAMPS.map((x, i) => (
        <g key={`l${i}`} className="alley-lamp">
          <circle className="alley-halo animate-flicker" cx={x} cy={GROUND - 128} r="70" fill="url(#halo)" style={{ animationDelay: `${i * 0.7}s` }} />
          <rect x={x - 2} y={GROUND - 120} width="4" height="120" fill="#0f131b" />
          <path d={`M${x - 10},${GROUND - 140} h20 l-4,18 h-12 Z`} fill="#f7d38a" />
          <path d={`M${x - 13},${GROUND - 141} h26`} stroke="#0f131b" strokeWidth="3" />
        </g>
      ))}
    </svg>
  );
}

export const AlleyScene = memo(AlleySceneBase);

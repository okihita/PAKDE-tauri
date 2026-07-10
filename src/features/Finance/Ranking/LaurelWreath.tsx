interface LaurelWreathProps {
  className?: string;
  /** Leaf fill — defaults to `currentColor` so the wrapper's text color drives it. */
  leafColor?: string;
  /** Berry accent fill. */
  berryColor?: string;
}

const CX = 60;
const CY = 74;
const RX = 49;
const RY = 62;
const N = 26;
const GAP_HALF = 20; // degrees of open space at the top

interface Leaf {
  x: number;
  y: number;
  rot: number;
  rx: number;
  ry: number;
}

function buildLeaves(): Leaf[] {
  const out: Leaf[] = [];
  for (let i = 0; i < N; i++) {
    const frac = i / (N - 1);
    // Sweep clockwise from just-right-of-top, around the bottom, to just-left-of-top,
    // leaving a GAP_HALF window open at the crown.
    const deg = 90 + GAP_HALF + frac * (360 - 2 * GAP_HALF);
    const rad = (deg * Math.PI) / 180;
    const x = CX + RX * Math.cos(rad);
    const y = CY - RY * Math.sin(rad);
    const len = i % 2 === 0 ? 9 : 7;
    out.push({ x, y, rot: -deg, rx: len, ry: 3.2 });
  }
  return out;
}

const LEAVES = buildLeaves();
// Berries sit where the branches cross at the base and at the crown tips.
const BERRIES: Array<{ x: number; y: number }> = [
  { x: CX, y: CY + RY - 1 },
  { x: CX - 6, y: CY + RY - 4 },
  { x: CX + 6, y: CY + RY - 4 },
  { x: CX - RX + 4, y: CY - RY + 8 },
  { x: CX + RX - 4, y: CY - RY + 8 },
];

/**
 * Pure-SVG laurel wreath. Renders as an open-ring of leaves (gold/green by
 * default) with berry accents. Frame a container by positioning it absolutely
 * with a negative inset; it is `pointer-events-none` and inherits color via
 * `currentColor`, so set the wrapper's text color to theme the leaves.
 */
export default function LaurelWreath({ className = "", leafColor, berryColor = "#f59e0b" }: LaurelWreathProps) {
  const leafFill = leafColor ?? "currentColor";
  return (
    <svg
      viewBox="0 0 120 148"
      className={`laurel-wreath pointer-events-none absolute inset-0 -m-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] ${className}`}
      aria-hidden="true"
    >
      {/* faint base ring for cohesion */}
      <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke={leafFill} strokeOpacity={0.22} strokeWidth={1.5} />
      {LEAVES.map((l, i) => (
        <ellipse
          key={i}
          cx={l.x}
          cy={l.y}
          rx={l.rx}
          ry={l.ry}
          fill={leafFill}
          fillOpacity={0.85}
          transform={`rotate(${l.rot} ${l.x} ${l.y})`}
        />
      ))}
      {BERRIES.map((b, i) => (
        <circle key={`b${i}`} cx={b.x} cy={b.y} r={2.1} fill={berryColor} />
      ))}
    </svg>
  );
}

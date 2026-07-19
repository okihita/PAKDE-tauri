// Enhanced geometric koperasi desa building for the campaign scene.
// Features SVG linear gradients, warm window illumination, porch lantern glow,
// and celebratory win banner while maintaining low vector complexity.

interface KopdesBuildingProps {
  /** Current coop tier (1–10). */
  tier: number;
  /** Tier at which the campaign goal is met (startTier + 2). */
  goalTier: number;
  className?: string;
}

const SIGN_LABEL = "KOPERASI";
const ARIA_LABEL = "Koperasi desa";
const WIN_LABEL = "🎉 KAMPANYE SELESAI";

export default function KopdesBuilding({ tier, goalTier, className }: KopdesBuildingProps) {
  const won = tier >= goalTier;

  return (
    <svg viewBox="0 0 200 120" className={className ?? "h-28 w-44 drop-shadow-xl"} role="img" aria-label={ARIA_LABEL}>
      <defs>
        {/* Wall Shading */}
        <linearGradient id="kb-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        {/* Roof Gradient */}
        <linearGradient id="kb-roof" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="60%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Wing Roof */}
        <linearGradient id="kb-wing-roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>

        {/* Window Glow */}
        <linearGradient id="kb-win" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Warm Doorway Gradient */}
        <linearGradient id="kb-door" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>

        {/* Signboard Metallic Gradient */}
        <linearGradient id="kb-sign" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Victory Gold Banner */}
        <linearGradient id="kb-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Lantern Glow Filter */}
        <filter id="kb-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ground shadows & cobblestone line */}
      <ellipse cx="98" cy="112" rx="75" ry="5" fill="#000000" fillOpacity="0.3" />
      <line x1="6" y1="112" x2="194" y2="112" stroke="#475569" strokeWidth="2" strokeLinecap="round" />

      {/* Side Wing (unlocked on victory / goal reached) */}
      {won && (
        <g stroke="#334155" strokeWidth="1.5">
          <rect x="150" y="70" width="38" height="42" fill="url(#kb-wall)" rx="1" />
          <polygon points="150,70 169,54 188,70" fill="url(#kb-wing-roof)" />
          {/* Wing Window */}
          <rect x="160" y="78" width="18" height="14" fill="url(#kb-win)" stroke="#7dd3fc" strokeWidth="0.8" rx="1" />
          <line x1="169" y1="78" x2="169" y2="92" stroke="#0284c7" strokeWidth="0.8" />
        </g>
      )}

      {/* Main Building Walls */}
      <rect x="46" y="58" width="104" height="54" fill="url(#kb-wall)" stroke="#475569" strokeWidth="1.5" rx="2" />

      {/* Decorative Wall Trim Lines */}
      <line x1="46" y1="62" x2="150" y2="62" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

      {/* Roof */}
      <polygon
        points="38,58 98,24 158,58"
        fill="url(#kb-roof)"
        stroke="#34d399"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Roof Eaves Overhang Highlight */}
      <polygon points="40,58 98,26 156,58" fill="none" stroke="#6ee7b7" strokeWidth="1" opacity="0.6" />

      {/* Signboard */}
      <rect
        x="68"
        y="38"
        width="60"
        height="16"
        fill="url(#kb-sign)"
        stroke="#10b981"
        strokeWidth="1.2"
        rx="3"
        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
      />
      <text
        x="98"
        y="49"
        textAnchor="middle"
        fill="#6ee7b7"
        fontSize="7.5"
        fontWeight="bold"
        fontFamily="monospace"
        letterSpacing="1"
      >
        {SIGN_LABEL}
      </text>

      {/* Windows with Warm Glow & Grids */}
      <g filter="drop-shadow(0 0 5px rgba(56,189,248,0.5))">
        <rect x="58" y="70" width="20" height="20" fill="url(#kb-win)" stroke="#bae6fd" strokeWidth="1" rx="2" />
        <line x1="68" y1="70" x2="68" y2="90" stroke="#0284c7" strokeWidth="1" />
        <line x1="58" y1="80" x2="78" y2="80" stroke="#0284c7" strokeWidth="1" />

        <rect x="120" y="70" width="20" height="20" fill="url(#kb-win)" stroke="#bae6fd" strokeWidth="1" rx="2" />
        <line x1="130" y1="70" x2="130" y2="90" stroke="#0284c7" strokeWidth="1" />
        <line x1="120" y1="80" x2="140" y2="80" stroke="#0284c7" strokeWidth="1" />
      </g>

      {/* Porch Lantern Light */}
      <circle cx="98" cy="78" r="4" fill="#fbbf24" opacity="0.3" filter="url(#kb-glow)" />
      <circle cx="98" cy="78" r="1.5" fill="#fef08a" />

      {/* Doorway */}
      <rect x="87" y="82" width="22" height="30" fill="url(#kb-door)" stroke="#b45309" strokeWidth="1.2" rx="1.5" />
      {/* Door Handle */}
      <circle cx="104" cy="97" r="1.2" fill="#fbbf24" />

      {/* Victory Celebration Banner (if campaign tier goal met) */}
      {won && (
        <g filter="drop-shadow(0 2px 6px rgba(0,0,0,0.6))">
          {/* Ribbon */}
          <rect x="50" y="2" width="96" height="14" fill="url(#kb-gold)" rx="3" stroke="#fef08a" strokeWidth="1" />
          <text x="98" y="11" textAnchor="middle" fill="#78350f" fontSize="6.5" fontWeight="bold">
            {WIN_LABEL}
          </text>
          {/* Confetti Sparkles */}
          <circle cx="42" cy="6" r="1.5" fill="#38bdf8" />
          <circle cx="154" cy="6" r="1.5" fill="#f43f5e" />
          <circle cx="150" cy="14" r="1" fill="#fbbf24" />
        </g>
      )}
    </svg>
  );
}

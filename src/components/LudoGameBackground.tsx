import React from 'react';

interface LudoGameBackgroundProps {
  boardSkin?: string;
}

// Exactly 6 lightweight snowflakes falling slowly with pure CSS translate
const SNOWFLAKES = [
  { id: 0, left: '12%', delay: '0s', duration: '7.5s', size: 'text-xs' },
  { id: 1, left: '28%', delay: '2.5s', duration: '9s', size: 'text-[10px]' },
  { id: 2, left: '46%', delay: '1.2s', duration: '7s', size: 'text-xs' },
  { id: 3, left: '64%', delay: '3.8s', duration: '9.5s', size: 'text-[10px]' },
  { id: 4, left: '82%', delay: '0.8s', duration: '8s', size: 'text-xs' },
  { id: 5, left: '94%', delay: '4.2s', duration: '8.5s', size: 'text-[10px]' },
];

export const LudoGameBackground: React.FC<LudoGameBackgroundProps> = React.memo(({ boardSkin = 'classic' }) => {
  const isGlacier = boardSkin === 'glacier_eternal';

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${isGlacier ? 'bg-[#020b1c]' : 'bg-[#130d24]'}`}>
      {/* 1. Static Base Gradient (100% lightweight CSS) */}
      <div
        className="absolute inset-0"
        style={{
          background: isGlacier
            ? 'radial-gradient(ellipse at 50% 35%, #072f5f 0%, #041d3d 45%, #021024 78%, #010814 100%)'
            : 'radial-gradient(ellipse at 50% 50%, #241447 0%, #190d35 45%, #110725 75%, #0a0418 100%)',
        }}
      />

      {/* 2. GLACIER ETERNAL: Lightweight Static Aurora Glow + 6 Gentle Snowflakes */}
      {isGlacier && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {/* Static lightweight Aurora Gradient (Zero GPU lag) */}
          <div
            className="absolute -top-10 left-0 right-0 h-72 opacity-60"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.38) 0%, rgba(16,185,129,0.22) 35%, rgba(168,85,247,0.18) 65%, transparent 85%)',
            }}
          />
          {/* Subtle Blue Underglow */}
          <div
            className="absolute inset-0 m-auto w-[85vw] h-[85vw] max-w-[620px] max-h-[620px] rounded-full opacity-40 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(56,189,248,0.35) 0%, rgba(2,132,199,0.1) 60%, transparent 80%)',
            }}
          />
          {/* Exactly 6 Gentle Falling Snowflakes */}
          {SNOWFLAKES.map((flake) => (
            <div
              key={flake.id}
              className={`absolute -top-6 text-cyan-200/75 glacier-snow-fall ${flake.size} will-change-transform`}
              style={{
                left: flake.left,
                animationDelay: flake.delay,
                animationDuration: flake.duration,
              }}
            >
              ❄️
            </div>
          ))}
        </div>
      )}

      {/* 3. Seamless Attached Tiled Ludo Board Wallpaper Pattern (Vector SVG) */}
      <svg
        className="absolute -top-[35%] -left-[35%] w-[170%] h-[170%] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="fullColorLudoBoardPattern"
            width="300"
            height="300"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-15 150 150)"
          >
            <g transform="scale(0.5)">
              <rect x="0" y="0" width="600" height="600" fill="#ffffff" stroke="#1e1b4b" strokeWidth="4" />

              {/* Red Base */}
              <rect x="8" y="8" width="232" height="232" rx="16" fill="#e11d48" stroke="#be123c" strokeWidth="3" />
              <rect x="40" y="40" width="168" height="168" rx="12" fill="#ffffff" stroke="#f43f5e" strokeWidth="3" />
              <circle cx="84" cy="84" r="24" fill="#e11d48" stroke="#fda4af" strokeWidth="3" />
              <circle cx="164" cy="84" r="24" fill="#e11d48" stroke="#fda4af" strokeWidth="3" />
              <circle cx="84" cy="164" r="24" fill="#e11d48" stroke="#fda4af" strokeWidth="3" />
              <circle cx="164" cy="164" r="24" fill="#e11d48" stroke="#fda4af" strokeWidth="3" />

              {/* Green Base */}
              <rect x="360" y="8" width="232" height="232" rx="16" fill="#16a34a" stroke="#15803d" strokeWidth="3" />
              <rect x="392" y="40" width="168" height="168" rx="12" fill="#ffffff" stroke="#22c55e" strokeWidth="3" />
              <circle cx="436" cy="84" r="24" fill="#16a34a" stroke="#86efac" strokeWidth="3" />
              <circle cx="516" cy="84" r="24" fill="#16a34a" stroke="#86efac" strokeWidth="3" />
              <circle cx="436" cy="164" r="24" fill="#16a34a" stroke="#86efac" strokeWidth="3" />
              <circle cx="516" cy="164" r="24" fill="#16a34a" stroke="#86efac" strokeWidth="3" />

              {/* Blue Base */}
              <rect x="8" y="360" width="232" height="232" rx="16" fill="#0284c7" stroke="#0369a1" strokeWidth="3" />
              <rect x="40" y="392" width="168" height="168" rx="12" fill="#ffffff" stroke="#38bdf8" strokeWidth="3" />
              <circle cx="84" cy="436" r="24" fill="#0284c7" stroke="#7dd3fc" strokeWidth="3" />
              <circle cx="164" cy="436" r="24" fill="#0284c7" stroke="#7dd3fc" strokeWidth="3" />
              <circle cx="84" cy="516" r="24" fill="#0284c7" stroke="#7dd3fc" strokeWidth="3" />
              <circle cx="164" cy="516" r="24" fill="#0284c7" stroke="#7dd3fc" strokeWidth="3" />

              {/* Yellow Base */}
              <rect x="360" y="360" width="232" height="232" rx="16" fill="#ffd000" stroke="#eab308" strokeWidth="3" />
              <rect x="392" y="392" width="168" height="168" rx="12" fill="#ffffff" stroke="#facc15" strokeWidth="3" />
              <circle cx="436" cy="436" r="24" fill="#ffd000" stroke="#fef08a" strokeWidth="3" />
              <circle cx="516" cy="436" r="24" fill="#ffd000" stroke="#fef08a" strokeWidth="3" />
              <circle cx="436" cy="516" r="24" fill="#ffd000" stroke="#fef08a" strokeWidth="3" />
              <circle cx="516" cy="516" r="24" fill="#ffd000" stroke="#fef08a" strokeWidth="3" />

              {/* Center Triangles */}
              <polygon points="240,240 300,300 240,360" fill="#e11d48" />
              <polygon points="240,240 300,300 360,240" fill="#16a34a" />
              <polygon points="360,240 300,300 360,360" fill="#ffd000" />
              <polygon points="240,360 300,300 360,360" fill="#0284c7" />

              {/* Lanes */}
              {Array.from({ length: 6 }).map((_, r) => (
                <g key={`tile-top-${r}`}>
                  <rect x="240" y={r * 40} width="40" height="40" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                  <rect x="280" y={r * 40} width="40" height="40" fill={r > 0 ? '#16a34a' : '#ffffff'} stroke="#94a3b8" strokeWidth="1" />
                  <rect x="320" y={r * 40} width="40" height="40" fill={r === 1 ? '#16a34a' : '#ffffff'} stroke="#94a3b8" strokeWidth="1" />
                </g>
              ))}
              {Array.from({ length: 6 }).map((_, r) => (
                <g key={`tile-bot-${r}`}>
                  <rect x="240" y={360 + r * 40} width="40" height="40" fill={r === 4 ? '#0284c7' : '#ffffff'} stroke="#94a3b8" strokeWidth="1" />
                  <rect x="280" y={360 + r * 40} width="40" height="40" fill={r < 5 ? '#0284c7' : '#ffffff'} stroke="#94a3b8" strokeWidth="1" />
                  <rect x="320" y={360 + r * 40} width="40" height="40" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                </g>
              ))}
              {Array.from({ length: 6 }).map((_, c) => (
                <g key={`tile-left-${c}`}>
                  <rect x={c * 40} y="240" width="40" height="40" fill={c === 1 ? '#e11d48' : '#ffffff'} stroke="#94a3b8" strokeWidth="1" />
                  <rect x={c * 40} y="280" width="40" height="40" fill={c > 0 ? '#e11d48' : '#ffffff'} stroke="#94a3b8" strokeWidth="1" />
                  <rect x={c * 40} y="320" width="40" height="40" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                </g>
              ))}
              {Array.from({ length: 6 }).map((_, c) => (
                <g key={`tile-right-${c}`}>
                  <rect x={360 + c * 40} y="240" width="40" height="40" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                  <rect x={360 + c * 40} y="280" width="40" height="40" fill={c < 5 ? '#ffd000' : '#ffffff'} stroke="#94a3b8" strokeWidth="1" />
                  <rect x={360 + c * 40} y="320" width="40" height="40" fill={c === 4 ? '#ffd000' : '#ffffff'} stroke="#94a3b8" strokeWidth="1" />
                </g>
              ))}

              {/* Star Safe Symbols */}
              <polygon points="100,326 103,334 112,334 105,339 108,347 100,342 92,347 95,339 88,334 97,334" fill="none" stroke="#1e293b" strokeWidth="2.5" />
              <polygon points="260,86 263,94 272,94 265,99 268,107 260,102 252,107 255,99 248,94 257,94" fill="none" stroke="#1e293b" strokeWidth="2.5" />
              <polygon points="500,246 503,254 512,254 505,259 508,267 500,262 492,267 495,259 488,254 497,254" fill="none" stroke="#1e293b" strokeWidth="2.5" />
              <polygon points="340,486 343,494 352,494 345,499 348,507 340,502 332,507 335,499 328,494 337,494" fill="none" stroke="#1e293b" strokeWidth="2.5" />
            </g>
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#fullColorLudoBoardPattern)" opacity="0.45" />
      </svg>

      {/* 4. Lightweight Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(2, 6, 16, 0.6) 100%)',
        }}
      />
    </div>
  );
});

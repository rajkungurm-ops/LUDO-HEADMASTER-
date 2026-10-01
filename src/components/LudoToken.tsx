import React from 'react';
import { PlayerColor } from '../types/ludo';

interface LudoTokenProps {
  color: PlayerColor;
  tokenId: number;
  isMovable: boolean;
  isMoving?: boolean;
  isAnimated?: boolean;
  scale?: number;
  showRing?: boolean;
  tokenSkin?: string;
  onClick?: () => void;
}

const LudoTokenComponent: React.FC<LudoTokenProps> = ({
  color,
  tokenId: _tokenId,
  isMovable,
  isMoving: _isMoving = false,
  scale = 1,
  showRing = true,
  tokenSkin = 'normal',
  onClick,
}) => {
  const ringBorderColor =
    color === 'red'
      ? '#881337'
      : color === 'green'
      ? '#14532d'
      : color === 'yellow'
      ? '#854d0e'
      : '#082f49';

  const baseHue =
    color === 'red'
      ? '#e11d48'
      : color === 'green'
      ? '#16a34a'
      : color === 'yellow'
      ? '#eab308'
      : '#0284c7';

  // Render VIP Token Models
  const isVipSkin = tokenSkin && tokenSkin !== 'normal';

  const renderTokenGraphic = () => {
    switch (tokenSkin) {
      case 'fire':
        // 1. Flame King Crown - VIP Fiery Royale
        return (
          <svg viewBox="0 0 36 48" className="w-full h-full drop-shadow-[0_4px_8px_rgba(249,115,22,0.6)] overflow-visible">
            <defs>
              <linearGradient id={`gold-crown-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="30%" stopColor="#fde047" />
                <stop offset="70%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <radialGradient id={`fire-aura-${color}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </radialGradient>
            </defs>
            {/* VIP Royal Under-Glow */}
            <circle cx="18" cy="27" r="13" fill={`url(#fire-aura-${color})`} opacity="0.35" filter="blur(2px)" />
            {/* Crown Base */}
            <path d="M 5 36 L 31 36 L 34 14 L 26 23 L 18 8 L 10 23 L 2 14 Z" fill={`url(#gold-crown-${color})`} stroke="#78350f" strokeWidth="1.2" />
            {/* Inner filigree arch */}
            <path d="M 8 34 L 28 34 L 25 25 L 18 14 L 11 25 Z" fill="#9a3412" opacity="0.75" />
            {/* Central Fiery Gem */}
            <circle cx="18" cy="27" r="6" fill={baseHue} stroke="#fef08a" strokeWidth="1.5" />
            <circle cx="16" cy="25" r="2.2" fill="#ffffff" opacity="0.9" />
            {/* Crown Jewels on Spikes */}
            <circle cx="2" cy="13" r="2.5" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="18" cy="7" r="3.2" fill="#facc15" stroke="#ffffff" strokeWidth="1" />
            <circle cx="34" cy="13" r="2.5" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
            {/* Bottom Plinth with Gold Engraving */}
            <rect x="5" y="36" width="26" height="7" rx="2.5" fill="#78350f" stroke="#fde047" strokeWidth="0.8" />
            <rect x="8" y="38" width="20" height="2" rx="1" fill="#fde047" />
          </svg>
        );

      case 'ice':
        // 2. Frost Ice Monarch Crystal - VIP Glacier Diamond
        return (
          <svg viewBox="0 0 36 48" className="w-full h-full drop-shadow-[0_4px_8px_rgba(56,189,248,0.6)] overflow-visible">
            <defs>
              <linearGradient id={`ice-gem-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#bae6fd" />
                <stop offset="70%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            {/* Hexagonal Glacier Diamond Body */}
            <polygon points="18,2 34,13 34,33 18,45 2,33 2,13" fill={`url(#ice-gem-${color})`} stroke="#ffffff" strokeWidth="1.5" />
            {/* Inner Frozen Facet */}
            <polygon points="18,8 29,16 29,30 18,39 7,30 7,16" fill={baseHue} opacity="0.9" stroke="#e0f2fe" strokeWidth="1" />
            {/* Diamond Center Star */}
            <polygon points="18,14 22,23 31,23 23,28 26,37 18,31 10,37 13,28 5,23 14,23" fill="#ffffff" opacity="0.85" />
            {/* Ice facet light beams */}
            <line x1="18" y1="2" x2="18" y2="45" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
            <line x1="2" y1="13" x2="34" y2="33" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
            <line x1="2" y1="33" x2="34" y2="13" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
            {/* Monarch Crown Tip */}
            <circle cx="18" cy="4" r="2" fill="#ffffff" />
          </svg>
        );

      case 'electric':
        // 3. Storm Lightning Totem - VIP Thunder Core
        return (
          <svg viewBox="0 0 36 48" className="w-full h-full drop-shadow-[0_4px_8px_rgba(234,179,8,0.6)] overflow-visible">
            <defs>
              <linearGradient id={`volt-grad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="40%" stopColor="#fde047" />
                <stop offset="80%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#713f12" />
              </linearGradient>
            </defs>
            {/* Power Core Capsule Frame */}
            <rect x="5" y="6" width="26" height="37" rx="13" fill="#0f172a" stroke="#facc15" strokeWidth="2" />
            {/* Inner Core Tube */}
            <rect x="8" y="9" width="20" height="31" rx="10" fill={baseHue} stroke="#fef08a" strokeWidth="1" />
            {/* Lightning Plasma Bolt */}
            <polygon points="20,11 10,25 18,25 15,37 27,21 19,21" fill="url(#volt-grad-electric)" stroke="#ffffff" strokeWidth="1" />
            {/* Volt Spark Nodes */}
            <circle cx="18" cy="6" r="2.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
            <circle cx="18" cy="43" r="2.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
          </svg>
        );

      case 'golden_shield':
        // 4. Royal Gold Aegis Shield - VIP 24K Heraldic Shield
        return (
          <svg viewBox="0 0 36 48" className="w-full h-full drop-shadow-[0_4px_8px_rgba(250,204,21,0.6)] overflow-visible">
            <defs>
              <linearGradient id="shield-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="30%" stopColor="#fde047" />
                <stop offset="70%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#854d0e" />
              </linearGradient>
            </defs>
            {/* Medieval Shield Body */}
            <path d="M 4 4 L 32 4 C 32 25, 27 40, 18 47 C 9 40, 4 25, 4 4 Z" fill="url(#shield-gold)" stroke="#78350f" strokeWidth="1.8" />
            {/* Inner Crest Field */}
            <path d="M 8 7 L 28 7 C 28 23, 24 35, 18 41 C 12 35, 8 23, 8 7 Z" fill={baseHue} stroke="#fef08a" strokeWidth="1.2" />
            {/* Royal Gold Cross with Gem */}
            <rect x="16" y="12" width="4" height="22" fill="#fef08a" rx="1.5" stroke="#ca8a04" strokeWidth="0.6" />
            <rect x="10" y="19" width="16" height="4" fill="#fef08a" rx="1.5" stroke="#ca8a04" strokeWidth="0.6" />
            <circle cx="18" cy="21" r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
            <circle cx="17" cy="19.5" r="1.2" fill="#ffffff" />
          </svg>
        );

      case 'cyber_core':
        // 5. Neon Cyber Mech Core - VIP High-Tech Matrix
        return (
          <svg viewBox="0 0 36 48" className="w-full h-full drop-shadow-[0_4px_8px_rgba(34,197,94,0.6)] overflow-visible">
            <defs>
              <linearGradient id="cyber-core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#86efac" />
                <stop offset="60%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#052e16" />
              </linearGradient>
            </defs>
            {/* Cyber Outer Ring */}
            <circle cx="18" cy="21" r="16" fill="#022c22" stroke="#4ade80" strokeWidth="2.2" />
            {/* Inner Holographic Disc */}
            <circle cx="18" cy="21" r="11" fill={baseHue} stroke="#86efac" strokeWidth="1.2" />
            {/* Quantum Core Diamond */}
            <polygon points="18,12 25,21 18,30 11,21" fill="#ffffff" stroke="#22c55e" strokeWidth="0.8" />
            <circle cx="18" cy="21" r="3" fill="#22c55e" />
            {/* High-tech Pedestal Base */}
            <rect x="10" y="38" width="16" height="7" rx="2.5" fill="#065f46" stroke="#4ade80" strokeWidth="1" />
            <line x1="12" y1="41" x2="24" y2="41" stroke="#86efac" strokeWidth="1" />
          </svg>
        );

      case 'shadow_void':
        // 6. Obsidian Phantom Void - VIP Amethyst Eclipse
        return (
          <svg viewBox="0 0 36 48" className="w-full h-full drop-shadow-[0_4px_8px_rgba(168,85,247,0.6)] overflow-visible">
            {/* Dark Diamond Frame */}
            <polygon points="18,2 35,22 18,46 1,22" fill="#09090b" stroke="#c084fc" strokeWidth="2" />
            {/* Inner Dark Void Crystal */}
            <polygon points="18,8 28,22 18,38 8,22" fill={baseHue} stroke="#e9d5ff" strokeWidth="1" />
            {/* Mystic Orb Core */}
            <circle cx="18" cy="22" r="5.5" fill="#a855f7" stroke="#ffffff" strokeWidth="1.2" />
            <circle cx="16.5" cy="20.5" r="2" fill="#ffffff" />
          </svg>
        );

      case 'emerald_lotus':
        // 7. Imperial Jade Lotus - VIP Oriental Blossom
        return (
          <svg viewBox="0 0 36 48" className="w-full h-full drop-shadow-[0_4px_8px_rgba(16,185,129,0.6)] overflow-visible">
            {/* Lotus Petal Layers */}
            <ellipse cx="18" cy="22" rx="15" ry="10" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
            <ellipse cx="18" cy="22" rx="10" ry="15" fill="#047857" stroke="#6ee7b7" strokeWidth="1.5" />
            {/* Center Jade Gem */}
            <circle cx="18" cy="22" r="8.5" fill={baseHue} stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="18" cy="22" r="4.5" fill="#a7f3d0" />
            <circle cx="16.5" cy="20.5" r="1.8" fill="#ffffff" />
            {/* Golden Stalk Base */}
            <path d="M 14 36 L 22 36 L 20 45 L 16 45 Z" fill="#065f46" stroke="#fde047" strokeWidth="1" />
          </svg>
        );

      case 'ruby_knight':
        // 8. Crimson Knight Helmet - VIP Crusader Crest
        return (
          <svg viewBox="0 0 36 48" className="w-full h-full drop-shadow-[0_4px_8px_rgba(239,68,68,0.6)] overflow-visible">
            {/* Crusader Plume */}
            <path d="M 14 2 C 25 2, 32 9, 25 16 L 11 16 Z" fill="#dc2626" stroke="#fca5a5" strokeWidth="0.8" />
            {/* Helmet Body */}
            <path d="M 5 14 C 5 7, 31 7, 31 14 L 32 37 C 32 44, 4 44, 4 37 Z" fill="#1e293b" stroke="#e2e8f0" strokeWidth="1.8" />
            {/* Helmet Faceplate */}
            <rect x="8" y="17" width="20" height="19" rx="3.5" fill={baseHue} stroke="#fde047" strokeWidth="1.2" />
            {/* Visor Slit */}
            <rect x="10" y="24" width="16" height="4" rx="2" fill="#020617" stroke="#f87171" strokeWidth="0.6" />
          </svg>
        );

      case 'celestial_star':
        // 9. Celestial Galaxy Star - VIP Starlight Monarch
        return (
          <svg viewBox="0 0 36 48" className="w-full h-full drop-shadow-[0_4px_8px_rgba(236,72,153,0.6)] overflow-visible">
            <defs>
              <linearGradient id="star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff1f2" />
                <stop offset="40%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#9333ea" />
              </linearGradient>
            </defs>
            {/* 8-Point Diamond Star */}
            <polygon
              points="18,2 23,15 35,17 25,24 29,37 18,30 7,37 11,24 1,17 13,15"
              fill="url(#star-grad)"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            {/* Star Gem Center */}
            <circle cx="18" cy="22" r="6.5" fill={baseHue} stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="16.5" cy="20.5" r="2.2" fill="#ffffff" opacity="0.95" />
          </svg>
        );

      case 'glacier_eternal': {
        // 10. GLACIER ETERNAL - Diamond Shape Heera Goti (Blue, Green, Red, Yellow) - Clean Solid Vector
        const gemLight =
          color === 'red'
            ? '#ffe4e6'
            : color === 'green'
            ? '#dcfce7'
            : color === 'yellow'
            ? '#fef9c3'
            : '#e0f2fe';
        const gemMid =
          color === 'red'
            ? '#fb7185'
            : color === 'green'
            ? '#4ade80'
            : color === 'yellow'
            ? '#facc15'
            : '#38bdf8';
        const gemDeep =
          color === 'red'
            ? '#be123c'
            : color === 'green'
            ? '#15803d'
            : color === 'yellow'
            ? '#a16207'
            : '#0369a1';

        return (
          <svg viewBox="0 0 36 48" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id={`heera-top-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor={gemLight} />
                <stop offset="100%" stopColor={gemMid} />
              </linearGradient>
              <linearGradient id={`heera-body-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gemMid} />
                <stop offset="55%" stopColor={baseHue} />
                <stop offset="100%" stopColor={gemDeep} />
              </linearGradient>
            </defs>
            {/* Crown Table (Top of Brilliant Cut Diamond Heera) */}
            <polygon
              points="9,6 27,6 34,17 2,17"
              fill={`url(#heera-top-${color})`}
              stroke="#ffffff"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            {/* Pavilion (Lower Pointed Cone of Diamond Heera) */}
            <polygon
              points="2,17 34,17 18,45"
              fill={`url(#heera-body-${color})`}
              stroke="#e0f2fe"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            {/* Brilliant Cut Internal Diamond Facets */}
            <polygon points="18,6 25,17 11,17" fill="#ffffff" opacity="0.65" />
            <polygon points="11,17 25,17 18,45" fill={gemMid} opacity="0.75" />
            <polygon points="2,17 11,17 18,45" fill={gemDeep} opacity="0.55" />
            <polygon points="25,17 34,17 18,45" fill="#ffffff" opacity="0.38" />
            <line x1="9" y1="6" x2="11" y2="17" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
            <line x1="27" y1="6" x2="25" y2="17" stroke="#ffffff" strokeWidth="1" opacity="0.9" />
            <line x1="2" y1="17" x2="34" y2="17" stroke="#ffffff" strokeWidth="1.2" opacity="0.95" />
            {/* Center Twinkling Diamond Glint Star */}
            <polygon
              points="18,9 19.5,14.5 25,16 19.5,17.5 18,23 16.5,17.5 11,16 16.5,14.5"
              fill="#ffffff"
            />
            <circle cx="18" cy="16" r="2.2" fill="#ffffff" />
            <circle cx="7" cy="13" r="1.4" fill="#ffffff" />
            <circle cx="29" cy="12" r="1.3" fill="#ffffff" />
          </svg>
        );
      }

      case 'normal':
      default:
        // Classic Pin Model (Clean, authentic tournament goti without flares)
        return (
          <svg viewBox="0 0 36 48" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)] overflow-visible">
            <defs>
              <linearGradient id="token-chrome-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="30%" stopColor="#f1f5f9" />
                <stop offset="70%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
              <radialGradient id={`token-grad-${color}`} cx="35%" cy="35%" r="65%">
                {color === 'red' && (
                  <>
                    <stop offset="0%" stopColor="#ff7675" />
                    <stop offset="60%" stopColor="#e11d48" />
                    <stop offset="100%" stopColor="#881337" />
                  </>
                )}
                {color === 'green' && (
                  <>
                    <stop offset="0%" stopColor="#86efac" />
                    <stop offset="60%" stopColor="#16a34a" />
                    <stop offset="100%" stopColor="#14532d" />
                  </>
                )}
                {color === 'yellow' && (
                  <>
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="60%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#854d0e" />
                  </>
                )}
                {color === 'blue' && (
                  <>
                    <stop offset="0%" stopColor="#7dd3fc" />
                    <stop offset="60%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#082f49" />
                  </>
                )}
              </radialGradient>
            </defs>

            <path
              d="M 18 2 C 8.6 2 1 9.6 1 19 C 1 29 16 45 18 47 C 20 45 35 29 35 19 C 35 9.6 27.4 2 18 2 Z"
              fill="url(#token-chrome-grad)"
              stroke="#cbd5e1"
              strokeWidth="0.8"
            />
            <path
              d="M 18 4 C 10 4 3.5 10.5 3.5 18.5 C 3.5 27 16.5 42 18 44 C 19.5 42 32.5 27 32.5 18.5 C 32.5 10.5 26 4 18 4 Z"
              fill="#334155"
              opacity="0.18"
            />
            <circle cx="18" cy="18" r="11" fill={`url(#token-grad-${color})`} stroke="#ffffff" strokeWidth="1.2" />
            <ellipse cx="14.5" cy="13.5" rx="4.5" ry="2.5" transform="rotate(-25 14.5 13.5)" fill="#ffffff" opacity="0.65" />
            <circle cx="18" cy="42" r="1.5" fill="#475569" />
          </svg>
        );
    }
  };

  return (
    <div
      onClick={isMovable ? onClick : undefined}
      className={`relative flex items-center justify-center select-none w-full h-full ${
        isMovable ? 'cursor-pointer z-30' : 'cursor-default z-10'
      }`}
      style={{
        transform: `scale(${scale}) translateZ(0)`,
        transformOrigin: '50% 87.5%',
        willChange: isMovable ? 'transform' : 'auto',
      }}
    >
      {/* Ground Contact Shadow */}
      <div
        className="absolute bottom-0 w-3/4 h-[12%] max-h-[4px] rounded-full bg-black/40 blur-[1px] transition-transform duration-200 pointer-events-none"
        style={{
          transform: isMovable ? 'scale(0.85)' : 'scale(1)',
        }}
      />

      {/* Small Round Ring under Pin Point (only shown when outside house) */}
      {showRing && (
        <div
          className="absolute -bottom-0.5 rounded-full pointer-events-none"
          style={{
            width: '40%',
            height: '40%',
            maxWidth: '14px',
            maxHeight: '14px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: `2px solid ${ringBorderColor}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
            zIndex: 1,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      )}

      {/* Pulsing ring indicator when token is movable */}
      {isMovable && (
        <div className="absolute inset-0 m-auto w-full h-full rounded-full border-2 border-yellow-300 shadow-[0_0_8px_#facc15] pointer-events-none animate-ring-pulse z-0" />
      )}

      {/* 3D VIP Token Graphic */}
      <div
        className={`w-full h-full flex items-center justify-center transition-transform relative z-10 ${
          isMovable ? 'animate-token-bob cursor-pointer' : ''
        }`}
      >
        {isVipSkin && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            <span className="text-[9px] select-none">👑</span>
          </div>
        )}
        {renderTokenGraphic()}
      </div>
    </div>
  );
};

export const LudoToken = React.memo(LudoTokenComponent, (prev, next) => {
  return (
    prev.color === next.color &&
    prev.tokenId === next.tokenId &&
    prev.isMovable === next.isMovable &&
    prev.scale === next.scale &&
    prev.showRing === next.showRing &&
    prev.tokenSkin === next.tokenSkin &&
    prev.isMoving === next.isMoving
  );
});

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEffects } from '../utils/audioSynthesizer';
import { DiceSkinId } from '../types/shop';
import { PlayerColor } from '../types/ludo';

interface Dice3DProps {
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  hasRolled: boolean;
  isCurrentTurn: boolean;
  size?: number;
  diceSkin?: string;
  consecutiveSixes?: number;
  color?: PlayerColor;
  onRoll: () => void;
  onDiceClick?: () => void;
}

// Precise 3D Euler angles mapping each face index (1-6) directly toward camera
const FACE_ROTATIONS: Record<number, { x: number; y: number; z: number }> = {
  1: { x: 0, y: 0, z: 0 },
  2: { x: 0, y: 180, z: 0 },
  3: { x: 0, y: -90, z: 0 },
  4: { x: 0, y: 90, z: 0 },
  5: { x: -90, y: 0, z: 0 },
  6: { x: 90, y: 0, z: 0 },
};

const Dice3DComponent: React.FC<Dice3DProps> = ({
  value,
  isRolling,
  canRoll,
  hasRolled,
  isCurrentTurn,
  size = 56,
  diceSkin = 'normal',
  onRoll,
  onDiceClick,
}) => {
  const currentValue = value || 6;
  const hasSpecialSkin = diceSkin && diceSkin !== 'normal';
  const [rotation, setRotation] = useState(() => {
    const base = FACE_ROTATIONS[currentValue] || FACE_ROTATIONS[6];
    return { ...base };
  });

  const rollCycleRef = useRef<number>(0);
  const prevIsRollingRef = useRef<boolean>(false);
  const [showImpactRing, setShowImpactRing] = useState(false);
  const [showSheen, setShowSheen] = useState(false);
  const [showRollFire, setShowRollFire] = useState(false);

  // Dice Fire ONLY when rolling (1 second), then hide. Not always burning!
  useEffect(() => {
    if (isRolling && hasSpecialSkin) {
      setShowRollFire(true);
      const timer = setTimeout(() => setShowRollFire(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isRolling, hasSpecialSkin]);

  // Update rotation: ONLY trigger roll landing impact when an actual roll just concluded!
  useEffect(() => {
    const targetVal = value || 6;
    const base = FACE_ROTATIONS[targetVal] || FACE_ROTATIONS[6];

    if (prevIsRollingRef.current && !isRolling && value) {
      // User tapped dice and roll just landed!
      rollCycleRef.current += 1;
      const extraTurn = rollCycleRef.current * 720;

      setRotation({
        x: base.x + extraTurn,
        y: base.y + extraTurn,
        z: base.z,
      });

      // Special light reflection sheen and impact ring ONLY for bought/special skins!
      if (hasSpecialSkin) {
        // 1. Landing shockwave ripple on table
        setShowImpactRing(true);
        const ringTimer = setTimeout(() => setShowImpactRing(false), 400);

        // 2. Gloss shimmer sheen sweep across the face
        setShowSheen(true);
        const sheenTimer = setTimeout(() => setShowSheen(false), 450);

        return () => {
          clearTimeout(ringTimer);
          clearTimeout(sheenTimer);
        };
      }
    } else if (!isRolling) {
      const currentExtra = rollCycleRef.current * 720;
      setRotation((prev) => {
        const nextX = base.x + currentExtra;
        const nextY = base.y + currentExtra;
        const nextZ = base.z;
        if (prev.x === nextX && prev.y === nextY && prev.z === nextZ) {
          return prev;
        }
        return { x: nextX, y: nextY, z: nextZ };
      });
    }

    prevIsRollingRef.current = isRolling;
  }, [value, isRolling]);

  const handleContainerClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isCurrentTurn) return;

    if (canRoll && !isRolling && !hasRolled) {
      onRoll();
    } else if (hasRolled && !isRolling && onDiceClick) {
      soundEffects.playButtonClick();
      onDiceClick();
    }
  };

  // Render high-contrast dot pips with glossy 3D insets
  const renderFaceDots = (faceNum: number) => {
    const pipCoords: Record<number, [number, number][]> = {
      1: [[50, 50]],
      2: [[26, 26], [74, 74]],
      3: [[26, 26], [50, 50], [74, 74]],
      4: [[26, 26], [26, 74], [74, 26], [74, 74]],
      5: [[26, 26], [26, 74], [50, 50], [74, 26], [74, 74]],
      6: [[26, 24], [26, 50], [26, 76], [74, 24], [74, 50], [74, 76]],
    };

    const dots = pipCoords[faceNum] || pipCoords[6];
    const isSix = faceNum === 6;
    const isOne = faceNum === 1;
    const dotSize = Math.max(7, Math.round(size * (isOne ? 0.26 : isSix ? 0.19 : 0.21)));

    let dotGradient =
      isSix || isOne
        ? 'radial-gradient(circle at 35% 35%, #ff4d6d 0%, #e11d48 50%, #9f1239 100%)'
        : 'radial-gradient(circle at 35% 35%, #475569 0%, #1e293b 55%, #0f172a 100%)';

    switch (diceSkin) {
      case 'fire':
      case 'dragon_blood':
        dotGradient = 'radial-gradient(circle at 35% 35%, #ffffff 0%, #fef08a 40%, #f59e0b 100%)';
        break;
      case 'golden_fire':
        dotGradient = 'radial-gradient(circle at 35% 35%, #ffffff 0%, #ef4444 50%, #991b1b 100%)';
        break;
      case 'diamond_inferno':
        dotGradient = 'radial-gradient(circle at 35% 35%, #ffffff 0%, #f97316 45%, #ea580c 100%)';
        break;
      case 'neon_matrix':
        dotGradient = 'radial-gradient(circle at 35% 35%, #ffffff 0%, #86efac 40%, #15803d 100%)';
        break;
      case 'royal_amethyst':
        dotGradient = 'radial-gradient(circle at 35% 35%, #ffffff 0%, #d8b4fe 40%, #7e22ce 100%)';
        break;
      case 'cosmic_galaxy':
        dotGradient = 'radial-gradient(circle at 35% 35%, #ffffff 0%, #f472b6 40%, #831843 100%)';
        break;
      case 'emerald_king':
        dotGradient = 'radial-gradient(circle at 35% 35%, #ffffff 0%, #6ee7b7 40%, #065f46 100%)';
        break;
      case 'rainbow_prism':
        dotGradient = 'radial-gradient(circle at 35% 35%, #ffffff 0%, #fde047 40%, #e11d48 100%)';
        break;
      case 'glacier_eternal':
        dotGradient = 'radial-gradient(circle at 35% 35%, #ffffff 0%, #7dd3fc 45%, #0284c7 100%)';
        break;
    }

    return (
      <div className="relative w-full h-full select-none pointer-events-none">
        {diceSkin === 'glacier_eternal' && (
          <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full opacity-45 pointer-events-none">
            <path d="M2,8 L14,16 L22,11 M38,30 L25,24 L19,33" stroke="#ffffff" strokeWidth="1" fill="none" />
          </svg>
        )}
        {dots.map(([x, y], idx) => (
          <div
            key={idx}
            className="absolute rounded-full shadow-inner transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              background: dotGradient,
              boxShadow: hasSpecialSkin
                ? 'inset 0 1px 2px rgba(255,255,255,0.8), 0 0 4px rgba(255,255,255,0.5)'
                : 'inset 0 2px 3px rgba(0,0,0,0.75), 0 1px 1px rgba(255,255,255,0.85)',
            }}
          >
            {/* Glossy light reflection on dot */}
            <div className="absolute top-[16%] left-[18%] w-[32%] h-[32%] bg-white/80 rounded-full blur-[0.2px]" />
          </div>
        ))}
      </div>
    );
  };

  const halfSize = Math.round(size / 2);
  const borderRadius = Math.max(9, Math.round(size * 0.22));

  // If not current player's turn, dice is completely blank and hidden with 0 opacity
  if (!isCurrentTurn) {
    return <div className="w-full h-full opacity-0 pointer-events-none" />;
  }

  const faceStyle = (transform: string): React.CSSProperties => {
    let bg = 'linear-gradient(145deg, #ffffff 0%, #fafbfc 45%, #e2e8f0 100%)';
    let border = '2px solid #cbd5e1';
    let shadow =
      'inset 0 1.5px 3px rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.28)';

    switch (diceSkin) {
      case 'fire':
        bg = 'linear-gradient(145deg, #ef4444 0%, #dc2626 45%, #991b1b 100%)';
        border = '2px solid #f97316';
        shadow = 'inset 0 1.5px 3px rgba(254,240,138,0.9), inset 0 -2px 4px rgba(0,0,0,0.5), 0 0 10px #f97316';
        break;
      case 'golden_fire':
        bg = 'linear-gradient(145deg, #fef08a 0%, #eab308 45%, #854d0e 100%)';
        border = '2px solid #facc15';
        shadow = 'inset 0 1.5px 3px rgba(255,255,255,0.95), inset 0 -2px 4px rgba(0,0,0,0.4), 0 0 12px #facc15';
        break;
      case 'diamond_inferno':
        bg = 'linear-gradient(145deg, #a5f3fc 0%, #0284c7 45%, #1e1b4b 100%)';
        border = '2px solid #38bdf8';
        shadow = 'inset 0 1.5px 3px rgba(224,242,254,1), inset 0 -2px 4px rgba(0,0,0,0.6), 0 0 12px #38bdf8';
        break;
      case 'neon_matrix':
        bg = 'linear-gradient(145deg, #4ade80 0%, #16a34a 45%, #052e16 100%)';
        border = '2px solid #22c55e';
        shadow = 'inset 0 1.5px 3px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.6), 0 0 12px #22c55e';
        break;
      case 'royal_amethyst':
        bg = 'linear-gradient(145deg, #c084fc 0%, #7e22ce 45%, #3b0764 100%)';
        border = '2px solid #a855f7';
        shadow = 'inset 0 1.5px 3px rgba(255,255,255,0.85), inset 0 -2px 4px rgba(0,0,0,0.6), 0 0 12px #a855f7';
        break;
      case 'cosmic_galaxy':
        bg = 'linear-gradient(145deg, #f472b6 0%, #9333ea 45%, #1e1b4b 100%)';
        border = '2px solid #ec4899';
        shadow = 'inset 0 1.5px 3px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(0,0,0,0.6), 0 0 14px #ec4899';
        break;
      case 'dragon_blood':
        bg = 'linear-gradient(145deg, #f87171 0%, #b91c1c 45%, #450a0a 100%)';
        border = '2px solid #dc2626';
        shadow = 'inset 0 1.5px 3px rgba(254,202,202,0.9), inset 0 -2px 4px rgba(0,0,0,0.6), 0 0 12px #dc2626';
        break;
      case 'emerald_king':
        bg = 'linear-gradient(145deg, #34d399 0%, #059669 45%, #064e3b 100%)';
        border = '2px solid #10b981';
        shadow = 'inset 0 1.5px 3px rgba(209,250,229,0.9), inset 0 -2px 4px rgba(0,0,0,0.6), 0 0 12px #10b981';
        break;
      case 'rainbow_prism':
        bg = 'linear-gradient(145deg, #fde047 0%, #f43f5e 40%, #6366f1 100%)';
        border = '2px solid #f59e0b';
        shadow = 'inset 0 1.5px 3px rgba(255,255,255,0.95), inset 0 -2px 4px rgba(0,0,0,0.5), 0 0 16px #f59e0b';
        break;
      case 'glacier_eternal':
        bg = 'linear-gradient(135deg, rgba(224,242,254,0.95) 0%, rgba(56,189,248,0.85) 48%, rgba(3,105,161,0.92) 100%)';
        border = '2px solid #ffffff';
        shadow = 'inset 0 0 8px rgba(255,255,255,0.95), inset 0 -2px 6px rgba(2,132,199,0.75), 0 0 16px #38bdf8';
        break;
    }

    return {
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: `${borderRadius}px`,
      background: bg,
      border,
      boxShadow: shadow,
      transform,
      backfaceVisibility: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    };
  };

  const getSkinFlareColor = () => {
    switch (diceSkin) {
      case 'fire':
      case 'dragon_blood':
        return '#f97316';
      case 'golden_fire':
      case 'rainbow_prism':
        return '#facc15';
      case 'diamond_inferno':
      case 'glacier_eternal':
        return '#38bdf8';
      case 'neon_matrix':
      case 'emerald_king':
        return '#22c55e';
      case 'royal_amethyst':
        return '#a855f7';
      case 'cosmic_galaxy':
        return '#ec4899';
      default:
        return '#facc15';
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* 3D Scene Viewport */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: `${size + 24}px`,
          height: `${size + 16}px`,
          perspective: '650px',
        }}
      >
        {/* Landing Impact Ripple Shockwave on Tray */}
        <AnimatePresence>
          {showImpactRing && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0.9 }}
              animate={{ scale: 1.8, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute bottom-1 w-14 h-7 rounded-full border-2 border-yellow-400 shadow-[0_0_10px_#facc15] pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Dynamic Ground Shadow underneath the 3D Cube */}
        <motion.div
          animate={
            isCurrentTurn && isRolling
              ? {
                  scale: [1, 0.4, 0.55, 1.25, 0.95, 1],
                  opacity: [0.55, 0.2, 0.3, 0.8, 0.5, 0.55],
                }
              : { scale: 1, opacity: 0.55 }
          }
          transition={
            isCurrentTurn && isRolling
              ? { duration: 0.35, ease: 'easeOut' }
              : { duration: 0.2 }
          }
          className="absolute bottom-0 rounded-full bg-slate-950/70 blur-[3px] pointer-events-none"
          style={{
            width: `${Math.round(size * 0.9)}px`,
            height: `${Math.max(6, Math.round(size * 0.16))}px`,
          }}
        />

        {/* Dice Flare ONLY when rolling (1 second), then hide. 0 Lag single CSS div */}
        {showRollFire && hasSpecialSkin && (
          <div
            className="absolute -inset-1.5 rounded-2xl pointer-events-none z-30 transition-opacity duration-300"
            style={{
              boxShadow: `0 0 12px ${getSkinFlareColor()}`,
            }}
          />
        )}

        {/* 3D Physical Cube Dice - Calm at rest ("Aramse"), Fast speed on click */}
        <motion.div
          initial={false}
          onClick={handleContainerClick}
          className={`relative ${
            isCurrentTurn && canRoll && !hasRolled
              ? 'cursor-pointer ring-3 ring-yellow-400 ring-offset-2 ring-offset-slate-900 rounded-2xl shadow-[0_0_18px_#facc15]'
              : isCurrentTurn && hasRolled && !isRolling
              ? 'cursor-pointer ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900 rounded-2xl shadow-[0_0_12px_rgba(52,211,153,0.7)]'
              : 'cursor-default opacity-85'
          }`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
          animate={
            isCurrentTurn && isRolling
              ? {
                  y: [0, -24, -16, 2, 0],
                  rotateX: [
                    rotation.x,
                    rotation.x + 360,
                    rotation.x + 720,
                    rotation.x + 1080,
                  ],
                  rotateY: [
                    rotation.y,
                    rotation.y + 360,
                    rotation.y + 720,
                    rotation.y + 1080,
                  ],
                  rotateZ: [rotation.z, rotation.z + 180, rotation.z + 360],
                }
              : {
                  y: 0,
                  rotateX: rotation.x,
                  rotateY: rotation.y,
                  rotateZ: rotation.z,
                }
          }
          transition={
            isCurrentTurn && isRolling
              ? {
                  duration: 0.35,
                  ease: [0.2, 0.8, 0.25, 1],
                  times: [0, 0.3, 0.65, 0.88, 1],
                }
              : {
                  type: 'spring',
                  stiffness: 380,
                  damping: 28,
                  mass: 0.6,
                }
          }
        >
          {/* Face 1: Front (Z = +halfSize) */}
          <div style={faceStyle(`translateZ(${halfSize}px)`)}>
            {renderFaceDots(1)}
          </div>

          {/* Face 2: Back (Z = -halfSize, Rotate Y 180) */}
          <div style={faceStyle(`rotateY(180deg) translateZ(${halfSize}px)`)}>
            {renderFaceDots(2)}
          </div>

          {/* Face 3: Right (X = +halfSize, Rotate Y 90) */}
          <div style={faceStyle(`rotateY(90deg) translateZ(${halfSize}px)`)}>
            {renderFaceDots(3)}
          </div>

          {/* Face 4: Left (X = -halfSize, Rotate Y -90) */}
          <div style={faceStyle(`rotateY(-90deg) translateZ(${halfSize}px)`)}>
            {renderFaceDots(4)}
          </div>

          {/* Face 5: Top (Y = -halfSize, Rotate X 90) */}
          <div style={faceStyle(`rotateX(90deg) translateZ(${halfSize}px)`)}>
            {renderFaceDots(5)}
          </div>

          {/* Face 6: Bottom (Y = +halfSize, Rotate X -90) */}
          <div style={faceStyle(`rotateX(-90deg) translateZ(${halfSize}px)`)}>
            {renderFaceDots(6)}
          </div>

          {/* Subtle 3D Inset Corner Bevel Highlights */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              boxShadow:
                'inset 0 0 4px rgba(255, 255, 255, 0.6), inset 0 0 1px rgba(0, 0, 0, 0.3)',
              transform: 'translateZ(1px)',
            }}
          />

          {/* Diagonal Specular Sheen Shimmer Reflection */}
          <AnimatePresence>
            {showSheen && (
              <motion.div
                initial={{ x: '-150%', y: '-150%', opacity: 0.8 }}
                animate={{ x: '150%', y: '150%', opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.38, ease: 'easeOut' }}
                className="absolute -inset-full bg-gradient-to-br from-transparent via-white/70 to-transparent pointer-events-none transform -rotate-45"
                style={{ transform: 'translateZ(2px)' }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export const Dice3D = React.memo(Dice3DComponent, (prev, next) => {
  return (
    prev.value === next.value &&
    prev.isRolling === next.isRolling &&
    prev.canRoll === next.canRoll &&
    prev.hasRolled === next.hasRolled &&
    prev.isCurrentTurn === next.isCurrentTurn &&
    prev.size === next.size &&
    prev.diceSkin === next.diceSkin &&
    prev.consecutiveSixes === next.consecutiveSixes &&
    prev.color === next.color
  );
});

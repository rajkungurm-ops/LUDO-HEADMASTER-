import React, { useMemo } from 'react';
import { Player, PlayerColor, Token } from '../types/ludo';
import { LudoToken } from './LudoToken';
import { getTokenCoordinate } from '../utils/ludoEngine';

interface LudoBoardProps {
  players: Player[];
  currentTurnColor: PlayerColor;
  validTokenMoves: number[];
  canMoveToken: boolean;
  activeHopToken?: {
    color: PlayerColor;
    tokenId: number;
    currentStep: number;
  } | null;
  onSelectToken: (tokenId: number, color?: PlayerColor) => void;
  myOnlineColor?: PlayerColor;
  isOnlineMode?: boolean;
  rotationDeg?: number;
  boardSkin?: string;
  frozenCapture?: {
    row: number;
    col: number;
    color: PlayerColor;
    tokenId: number;
  } | null;
}

// Helper to check if coordinate is on any safe star
const isStarCell = (r: number, c: number) => {
  return (
    (r === 8 && c === 2) || // Red track star (safe)
    (r === 2 && c === 6) || // Green track star (safe)
    (r === 6 && c === 12) || // Yellow track star (safe)
    (r === 12 && c === 8) || // Blue track star (safe)
    (r === 6 && c === 1) || // Red start square (safe)
    (r === 1 && c === 8) || // Green start square (safe)
    (r === 8 && c === 13) || // Yellow start square (safe)
    (r === 13 && c === 6) // Blue start square (safe)
  );
};

// Memoized Static Pathway Grid (225 cells) - Pre-rendered ONCE for zero JS overhead during gameplay
const StaticBoardTiles = React.memo(({ boardSkin = 'classic' }: { boardSkin?: string }) => {
  const isGlacier = boardSkin === 'glacier_eternal';
  const cells: React.ReactNode[] = [];

  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      // Skip 4 corner base quadrants (6x6 each)
      if (r < 6 && c < 6) continue;
      if (r < 6 && c > 8) continue;
      if (r > 8 && c < 6) continue;
      if (r > 8 && c > 8) continue;

      // Skip Center Triangle (6..8, 6..8)
      if (r >= 6 && r <= 8 && c >= 6 && c <= 8) continue;

      // Colored Home Run Paths
      const isRedHomeRun = r === 7 && c >= 1 && c <= 5;
      const isGreenHomeRun = c === 7 && r >= 1 && r <= 5;
      const isYellowHomeRun = r === 7 && c >= 9 && c <= 13;
      const isBlueHomeRun = c === 7 && r >= 9 && r <= 13;

      // Starting Squares (Safe zones)
      const isRedStart = r === 6 && c === 1;
      const isGreenStart = r === 1 && c === 8;
      const isYellowStart = r === 8 && c === 13;
      const isBlueStart = r === 13 && c === 6;

      // 4 Track Safe Stars
      const isTrackStar =
        (r === 8 && c === 2) ||
        (r === 2 && c === 6) ||
        (r === 6 && c === 12) ||
        (r === 12 && c === 8);

      // Lane Entry Arrows
      const isRedArrow = r === 7 && c === 0;
      const isGreenArrow = r === 0 && c === 7;
      const isYellowArrow = r === 7 && c === 14;
      const isBlueArrow = r === 14 && c === 7;

      let bgClass = isGlacier
        ? 'bg-cyan-100/75 border-cyan-300/80 shadow-[inset_0_0_6px_rgba(255,255,255,0.85)]'
        : 'bg-white border-slate-400';

      if (isRedHomeRun || isRedStart) {
        bgClass = isGlacier
          ? 'bg-gradient-to-br from-rose-500/85 to-red-600/90 border-cyan-200 shadow-[inset_0_0_8px_rgba(255,255,255,0.6)]'
          : 'bg-[#e11d48] border-slate-400';
      } else if (isGreenHomeRun || isGreenStart) {
        bgClass = isGlacier
          ? 'bg-gradient-to-br from-emerald-400/85 to-green-600/90 border-cyan-200 shadow-[inset_0_0_8px_rgba(255,255,255,0.6)]'
          : 'bg-[#16a34a] border-slate-400';
      } else if (isYellowHomeRun || isYellowStart) {
        bgClass = isGlacier
          ? 'bg-gradient-to-br from-amber-300/90 to-yellow-500/90 border-cyan-200 shadow-[inset_0_0_8px_rgba(255,255,255,0.6)]'
          : 'bg-[#ffd000] border-slate-400';
      } else if (isBlueHomeRun || isBlueStart) {
        bgClass = isGlacier
          ? 'bg-gradient-to-br from-sky-400/90 to-blue-600/90 border-cyan-200 shadow-[inset_0_0_8px_rgba(255,255,255,0.6)]'
          : 'bg-[#0284c7] border-slate-400';
      }

      cells.push(
        <div
          key={`cell-${r}-${c}`}
          style={{
            gridRowStart: r + 1,
            gridColumnStart: c + 1,
          }}
          className={`relative w-full h-full border-[0.5px] flex items-center justify-center ${bgClass}`}
        >
          {isTrackStar && (
            <svg
              viewBox="0 0 24 24"
              className="w-4/5 h-4/5 text-slate-800 drop-shadow-sm pointer-events-none"
              fill={isGlacier ? 'rgba(56,189,248,0.25)' : 'none'}
              stroke={isGlacier ? '#0369a1' : '#475569'}
              strokeWidth="1.8"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )}

          {isRedArrow && (
            <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 pointer-events-none drop-shadow-sm">
              <polygon points="6,5 18,12 6,19" fill="#e11d48" />
            </svg>
          )}
          {isGreenArrow && (
            <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 pointer-events-none drop-shadow-sm">
              <polygon points="5,6 12,18 19,6" fill="#16a34a" />
            </svg>
          )}
          {isYellowArrow && (
            <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 pointer-events-none drop-shadow-sm">
              <polygon points="18,5 6,12 18,19" fill="#eab308" />
            </svg>
          )}
          {isBlueArrow && (
            <svg viewBox="0 0 24 24" className="w-3/5 h-3/5 pointer-events-none drop-shadow-sm">
              <polygon points="5,18 12,6 19,18" fill="#0284c7" />
            </svg>
          )}

          {(isRedStart || isGreenStart || isYellowStart || isBlueStart) && (
            <svg
              viewBox="0 0 24 24"
              className="w-3/5 h-3/5 text-white/80 drop-shadow pointer-events-none"
              fill="currentColor"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )}
        </div>
      );
    }
  }

  return <>{cells}</>;
});

const LudoBoardComponent: React.FC<LudoBoardProps> = ({
  players,
  currentTurnColor,
  validTokenMoves,
  canMoveToken,
  activeHopToken,
  onSelectToken,
  myOnlineColor: _myOnlineColor,
  isOnlineMode = false,
  rotationDeg = 0,
  boardSkin = 'classic',
  frozenCapture = null,
}) => {
  const isGlacierBoard = boardSkin === 'glacier_eternal';

  // Find tokens that are actively on the board path (step >= 0 or hopping)
  const activePathTokens = useMemo(() => {
    const list: Array<{
      player: Player;
      token: Token;
      coord: { row: number; col: number };
      effectiveStep: number;
      isOnStar: boolean;
      isInHomeRun: boolean;
      isHomeFinish: boolean;
      isMovable: boolean;
      isHopping: boolean;
    }> = [];

    players.forEach((player) => {
      player.tokens.forEach((token) => {
        const isHopping =
          activeHopToken &&
          activeHopToken.color === player.color &&
          activeHopToken.tokenId === token.id;

        if (!token.inBase || isHopping) {
          const effectiveStep = isHopping ? activeHopToken.currentStep : token.step;
          const coord = getTokenCoordinate(player.color, token.id, effectiveStep);
          const isOnStar = isStarCell(coord.row, coord.col);
          const isHomeFinish = effectiveStep >= 56 || Boolean(token.isHome);
          const isInHomeRun = effectiveStep >= 51 && effectiveStep < 56;
          const isMovable =
            canMoveToken &&
            player.color === currentTurnColor &&
            validTokenMoves.includes(token.id);

          list.push({
            player,
            token,
            coord,
            effectiveStep,
            isOnStar,
            isInHomeRun,
            isHomeFinish,
            isMovable,
            isHopping: Boolean(isHopping),
          });
        }
      });
    });

    return list;
  }, [players, currentTurnColor, validTokenMoves, canMoveToken, activeHopToken]);

  // Group tokens by cell coordinate for neat offset when multiple tokens share a square
  const pathTokenGroups = useMemo(() => {
    const groups: Record<string, typeof activePathTokens> = {};
    activePathTokens.forEach((item) => {
      const key = `${Math.round(item.coord.row * 10) / 10},${Math.round(item.coord.col * 10) / 10}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [activePathTokens]);

  // Render 4 Quadrant Player Base Rooms
  const renderBaseRoom = (
    color: PlayerColor,
    rowStart: number,
    colStart: number,
    bgHex: string,
    socketRingHex: string,
    labelPos: 'top' | 'bottom' | 'left' | 'right',
    defaultLabel: string
  ) => {
    const player = players.find((p) => p.color === color);
    const isActive = Boolean(player);
    const isCurrentTurn = isActive && currentTurnColor === color;
    const displayName = player ? player.name : defaultLabel;

    return (
      <div
        key={`base-${color}`}
        style={{
          gridRow: `${rowStart + 1} / span 6`,
          gridColumn: `${colStart + 1} / span 6`,
          backgroundColor: isGlacierBoard ? undefined : bgHex,
          background: isGlacierBoard
            ? color === 'red'
              ? 'linear-gradient(135deg, rgba(225,29,72,0.82) 0%, rgba(136,19,55,0.88) 100%)'
              : color === 'green'
              ? 'linear-gradient(135deg, rgba(22,163,74,0.82) 0%, rgba(20,83,45,0.88) 100%)'
              : color === 'yellow'
              ? 'linear-gradient(135deg, rgba(234,179,8,0.85) 0%, rgba(161,98,7,0.9) 100%)'
              : 'linear-gradient(135deg, rgba(2,132,199,0.85) 0%, rgba(12,74,110,0.9) 100%)'
            : bgHex,
        }}
        className={`relative p-2.5 sm:p-3.5 flex items-center justify-center border ${
          isGlacierBoard ? 'border-cyan-300/90 shadow-[inset_0_0_18px_rgba(186,230,253,0.45)]' : 'border-slate-500'
        } overflow-visible transition-all duration-200 ${
          isCurrentTurn ? 'ring-2 ring-yellow-400/90 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : ''
        }`}
      >
        {/* Clean Home Base: Text labels hidden via display:none as requested */}
        <div
          className={`hidden home-label-${color} token-label-vertical pointer-events-none select-none`}
          style={{ display: 'none' }}
        >
          <span>{displayName}</span>
        </div>

        {/* Subtle Corner Snowflake Engraving inside Glacier Base */}
        {isGlacierBoard && (
          <div className="absolute top-1 right-1 text-[10px] opacity-65 pointer-events-none select-none">
            ❄️
          </div>
        )}

        {/* Inner White / Frosted Ice Quadrant Box with 4 Sockets */}
        <div
          className={`w-[78%] h-[78%] max-w-[145px] max-h-[145px] rounded-md sm:rounded-xl shadow-md border flex items-center justify-center relative overflow-visible ${
            isGlacierBoard
              ? 'bg-cyan-50/85 backdrop-blur-sm border-cyan-200 shadow-[0_0_15px_rgba(56,189,248,0.5),inset_0_0_12px_rgba(255,255,255,0.9)]'
              : 'bg-white border-slate-300'
          }`}
        >
          <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:gap-2.5 items-center justify-items-center w-full h-full p-1 sm:p-1.5 overflow-visible">
            {[0, 1, 2, 3].map((socketIdx) => {
              const token = player?.tokens[socketIdx];
              const isHopping =
                activeHopToken &&
                activeHopToken.color === color &&
                activeHopToken.tokenId === socketIdx;

              const tokenInSocket = Boolean(token && token.inBase && !isHopping);
              const isMovable = Boolean(
                tokenInSocket &&
                canMoveToken &&
                color === currentTurnColor &&
                validTokenMoves.includes(socketIdx)
              );

              const effectiveTokenSkin = isGlacierBoard
                ? 'glacier_eternal'
                : player?.tokenSkin || 'normal';

              return (
                <div
                  key={socketIdx}
                  className="relative w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 md:w-10 md:h-10 rounded-full flex items-center justify-center overflow-visible"
                  style={{
                    backgroundColor: isGlacierBoard ? 'rgba(224, 242, 254, 0.9)' : '#ffffff',
                    border: `3px solid ${socketRingHex}`,
                    boxShadow: isGlacierBoard
                      ? 'inset 0 2px 6px rgba(2,132,199,0.45), 0 0 8px rgba(56,189,248,0.5)'
                      : 'inset 0 2px 5px rgba(0,0,0,0.35)',
                  }}
                >
                  {tokenInSocket && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 overflow-visible">
                      <div
                        className="relative w-full h-full flex items-center justify-center overflow-visible"
                        style={{
                          transformOrigin: '50% 87.5%',
                          transform: `translateY(-22%) rotate(${-rotationDeg}deg)`,
                        }}
                      >
                        <LudoToken
                          color={color}
                          tokenId={socketIdx}
                          isMovable={isMovable}
                          scale={1.32}
                          showRing={false}
                          tokenSkin={effectiveTokenSkin}
                          onClick={() => onSelectToken(socketIdx, color)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const outerFrameClass =
    boardSkin === 'glacier_eternal'
      ? 'bg-gradient-to-br from-cyan-300/90 via-sky-500/75 to-blue-700/90 border-2 border-cyan-100 shadow-[0_0_24px_rgba(56,189,248,0.55),inset_0_0_12px_rgba(255,255,255,0.8)]'
      : boardSkin === 'emerald_palace'
      ? 'bg-gradient-to-br from-emerald-400 via-teal-600 to-emerald-900 border-2 border-yellow-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
      : boardSkin === 'lava_citadel'
      ? 'bg-gradient-to-br from-orange-500 via-red-600 to-amber-900 border-2 border-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.5)]'
      : boardSkin === 'cyber_neon'
      ? 'bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-900 border-2 border-fuchsia-300 shadow-[0_0_20px_rgba(192,38,211,0.5)]'
      : 'bg-white border-2 border-white shadow-[0_8px_24px_rgba(0,0,0,0.45)]';

  return (
    <div className="relative w-full max-w-[min(96vw,calc(100dvh-135px),640px)] aspect-square select-none p-0.5 sm:p-1 flex items-center justify-center z-20 overflow-visible">
      {/* GLACIER ETERNAL: Snowflake Carved Border & Pure CSS Glow (0 Lag) */}
      {isGlacierBoard && (
        <>
          {/* Ornate Snowflake Carvings on 4 Corners */}
          <div className="absolute -top-2.5 -left-2.5 z-40 text-sm sm:text-base pointer-events-none select-none">❄️</div>
          <div className="absolute -top-2.5 -right-2.5 z-40 text-sm sm:text-base pointer-events-none select-none">❄️</div>
          <div className="absolute -bottom-2.5 -left-2.5 z-40 text-sm sm:text-base pointer-events-none select-none">❄️</div>
          <div className="absolute -bottom-2.5 -right-2.5 z-40 text-sm sm:text-base pointer-events-none select-none">❄️</div>
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-40 px-2.5 py-0.5 rounded-full bg-cyan-950/95 border border-cyan-300 text-[8px] font-black text-cyan-200 tracking-widest uppercase shadow-[0_0_10px_#38bdf8] pointer-events-none whitespace-nowrap">
            ❄️ GLACIER ETERNAL 👑
          </div>
        </>
      )}

      {/* Outer Board Frame */}
      <div className={`relative w-full h-full p-1 sm:p-1.5 rounded-sm overflow-visible gpu-layer ${outerFrameClass}`}>
        {/* Main 15x15 Board Grid */}
        <div
          className={`relative w-full h-full grid grid-cols-15 grid-rows-15 overflow-visible transition-transform duration-500 ease-out ${
            isGlacierBoard
              ? 'bg-cyan-950/40 border border-cyan-200/90 shadow-[inset_0_0_30px_rgba(56,189,248,0.45)]'
              : 'bg-white border border-slate-400'
          }`}
          style={{
            gridTemplateColumns: 'repeat(15, 1fr)',
            gridTemplateRows: 'repeat(15, 1fr)',
            transform: `rotate(${rotationDeg}deg) translateZ(0)`,
          }}
        >
          {/* 1. Red Room (Top-Left) */}
          {renderBaseRoom('red', 0, 0, '#e11d48', '#be123c', 'left', 'Red')}

          {/* 2. Green Room (Top-Right) */}
          {renderBaseRoom('green', 0, 9, '#16a34a', '#15803d', 'top', 'Green')}

          {/* 3. Blue Room (Bottom-Left) */}
          {renderBaseRoom('blue', 9, 0, '#0284c7', '#0369a1', 'bottom', 'Blue')}

          {/* 4. Yellow Room (Bottom-Right) */}
          {renderBaseRoom('yellow', 9, 9, '#ffd000', '#ca8a04', 'right', 'Yellow')}

          {/* 5. Pathway Grid Tiles with all Safe Stars (Memoized Static Component) */}
          <StaticBoardTiles boardSkin={boardSkin} />

          {/* 6. Center Victory Triangles (6..8, 6..8) */}
          <div
            style={{
              gridRow: '7 / span 3',
              gridColumn: '7 / span 3',
            }}
            className={`relative w-full h-full border overflow-hidden ${
              isGlacierBoard ? 'border-cyan-200 shadow-[0_0_16px_rgba(56,189,248,0.7)]' : 'border-slate-400'
            }`}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon points="0,0 0,100 50,50" fill="#e11d48" />
              <polygon points="0,0 100,0 50,50" fill="#16a34a" />
              <polygon points="100,0 100,100 50,50" fill="#ffd000" />
              <polygon points="0,100 100,100 50,50" fill="#0284c7" />
              <line x1="0" y1="0" x2="100" y2="100" stroke="#ffffff" strokeWidth="1.5" />
              <line x1="100" y1="0" x2="0" y2="100" stroke="#ffffff" strokeWidth="1.5" />
              {isGlacierBoard && (
                <circle cx="50" cy="50" r="14" fill="rgba(224,242,254,0.85)" stroke="#38bdf8" strokeWidth="2" />
              )}
            </svg>
            {isGlacierBoard && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[11px] drop-shadow">💎</span>
              </div>
            )}
          </div>

          {/* 7. Active Path Tokens Layer - GPU Hardware-Accelerated 60 FPS Compositing */}
          <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
            {Object.entries(pathTokenGroups).map(([_cellKey, items]) => {
              const count = items.length;

              return items.map((item, index) => {
                const { player, token, coord, isOnStar, isInHomeRun, isHomeFinish, isMovable, isHopping } = item;

                let offsetX = 0;
                let offsetY = 0;

                let scale = 1.08;

                if (isHomeFinish) {
                  if (count === 1) {
                    scale = 0.76;
                  } else if (count === 2) {
                    scale = 0.60;
                  } else if (count === 3) {
                    scale = 0.50;
                  } else {
                    scale = 0.42;
                  }
                  if (count > 1) {
                    const angle = (index / count) * 2 * Math.PI;
                    const radius = count === 2 ? 4 : count === 3 ? 5 : 6;
                    offsetX = Math.cos(angle) * radius;
                    offsetY = Math.sin(angle) * radius;
                  }
                } else if (isOnStar || isInHomeRun) {
                  scale = count > 1 ? (count === 2 ? 0.84 : 0.70) : 1.02;
                  if (count > 1) {
                    const angle = (index / count) * 2 * Math.PI;
                    const radius = count === 2 ? 4.5 : 5.8;
                    offsetX = Math.cos(angle) * radius;
                    offsetY = Math.sin(angle) * radius;
                  }
                } else {
                  scale = count > 1 ? (count === 2 ? 0.86 : 0.72) : 1.08;
                  if (count > 1) {
                    const angle = (index / count) * 2 * Math.PI;
                    const radius = count === 2 ? 5 : 6.2;
                    offsetX = Math.cos(angle) * radius;
                    offsetY = Math.sin(angle) * radius;
                  }
                }

                const leftPos = `${((coord.col + 0.5) / 15) * 100}%`;
                const topPos = `${((coord.row + 0.5) / 15) * 100}%`;

                const effectiveTokenSkin = isGlacierBoard
                  ? 'glacier_eternal'
                  : player.tokenSkin || 'normal';

                return (
                  <div
                    key={`${player.color}-${token.id}`}
                    className="absolute pointer-events-auto gpu-layer flex items-center justify-center"
                    style={{
                      width: '7.2%',
                      height: '9.0%',
                      left: leftPos,
                      top: topPos,
                      transformOrigin: '50% 87.5%',
                      transform: `translate3d(-50%, -78%, 0) rotate(${-rotationDeg}deg) translate3d(${offsetX}px, ${offsetY}px, 0)`,
                      zIndex: isMovable ? 55 : 35 + index,
                      transition: isHopping
                        ? 'left 150ms cubic-bezier(0.25, 0.85, 0.3, 1), top 150ms cubic-bezier(0.25, 0.85, 0.3, 1)'
                        : 'none',
                      willChange: isHopping ? 'left, top, transform' : 'auto',
                    }}
                  >
                    <LudoToken
                      color={player.color}
                      tokenId={token.id}
                      isMovable={isMovable}
                      isMoving={isHopping}
                      scale={scale}
                      showRing={!isHomeFinish}
                      tokenSkin={effectiveTokenSkin}
                      onClick={() => onSelectToken(token.id, player.color)}
                    />
                  </div>
                );
              });
            })}
          </div>

          {/* 8. 1-SECOND FROZEN TOKEN CAPTURE EFFECT (Kisi ko kaatega toh: Token baraf me jam jayega 1 sec ke liye ❄️) */}
          {frozenCapture && (
            <div
              className="absolute pointer-events-none z-50 flex items-center justify-center"
              style={{
                left: `${((frozenCapture.col + 0.5) / 15) * 100}%`,
                top: `${((frozenCapture.row + 0.5) / 15) * 100}%`,
                width: '12%',
                height: '12%',
                transform: `translate3d(-50%, -65%, 0) rotate(${-rotationDeg}deg)`,
              }}
            >
              <div className="relative w-full h-full flex items-center justify-center animate-bounce">
                {/* Translucent 3D Ice Block Encasing the Captured Token */}
                <div className="absolute -inset-1.5 rounded-xl bg-gradient-to-br from-white/90 via-cyan-300/80 to-blue-600/85 border-2 border-white shadow-[0_0_25px_#38bdf8,inset_0_0_12px_#ffffff] backdrop-blur-xs flex items-center justify-center">
                  <div className="w-4/5 h-4/5 opacity-85">
                    <LudoToken
                      color={frozenCapture.color}
                      tokenId={frozenCapture.tokenId}
                      isMovable={false}
                      showRing={false}
                      tokenSkin={isGlacierBoard ? 'glacier_eternal' : 'normal'}
                    />
                  </div>
                  {/* Ice Crack Lines */}
                  <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full pointer-events-none">
                    <path
                      d="M4,6 L18,19 L12,34 M35,8 L18,19 L34,29"
                      stroke="#ffffff"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                </div>
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-cyan-950 border border-cyan-300 text-[8px] font-black text-cyan-200 whitespace-nowrap shadow-[0_0_10px_#38bdf8]">
                  ❄️ FROZEN! ❄️
                </span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export const LudoBoard = React.memo(LudoBoardComponent);

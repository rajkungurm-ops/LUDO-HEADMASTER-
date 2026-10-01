import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, PlayerColor } from '../types/ludo';
import { Dice3D } from './Dice3D';

interface PlayerDicePodProps {
  color: PlayerColor;
  player?: Player;
  isCurrentTurn: boolean;
  canRoll: boolean;
  hasRolled: boolean;
  isRolling: boolean;
  diceValue: number | null;
  consecutiveSixes: number;
  pinSide: 'left' | 'right';
  onRollDice: () => void;
  onDiceClick: () => void;
  latestChatMessage?: { text: string; type: 'text' | 'quick' | 'emoji'; timestamp: number } | null;
  isOnlineMode?: boolean;
  turnTimeRemaining?: number;
  boardSkin?: string;
}

const PIN_CORE_COLORS: Record<PlayerColor, string> = {
  red: '#dc2626',
  green: '#16a34a',
  yellow: '#eab308',
  blue: '#0284c7',
};

const PlayerDicePodComponent: React.FC<PlayerDicePodProps> = ({
  color,
  player,
  isCurrentTurn,
  canRoll,
  hasRolled,
  isRolling,
  diceValue,
  consecutiveSixes,
  pinSide,
  onRollDice,
  onDiceClick,
  latestChatMessage,
  isOnlineMode = false,
  turnTimeRemaining,
  boardSkin = 'classic',
}) => {
  const coreColor = PIN_CORE_COLORS[color];
  const vipRank = player?.vipLevel || 1;
  const effectiveDiceSkin =
    boardSkin === 'glacier_eternal' || player?.boardSkin === 'glacier_eternal'
      ? 'glacier_eternal'
      : player?.diceSkin || 'normal';

  const hasFirePro =
    isOnlineMode &&
    (player?.tokenSkin === 'fire' ||
      player?.diceSkin === 'fire' ||
      player?.diceSkin === 'dragon_blood');

  const hasGoldPro =
    isOnlineMode &&
    (player?.tokenSkin === 'golden_shield' ||
      player?.diceSkin === 'golden_fire');

  const hasDiamondPro =
    isOnlineMode &&
    (player?.tokenSkin === 'ice' ||
      player?.diceSkin === 'diamond_inferno');

  const hasElectricPro =
    isOnlineMode &&
    (player?.tokenSkin === 'electric' ||
      player?.diceSkin === 'neon_matrix');

  const hasCosmicPro =
    isOnlineMode &&
    (player?.tokenSkin === 'celestial_star' ||
      player?.tokenSkin === 'shadow_void' ||
      player?.diceSkin === 'cosmic_galaxy' ||
      player?.diceSkin === 'royal_amethyst');

  const hasVipPro = isOnlineMode && vipRank >= 2;

  if (!player) {
    return (
      <div
        className="invisible pointer-events-none select-none"
        style={{
          width: 'clamp(120px, 36vw, 160px)',
          height: '52px',
        }}
      />
    );
  }

  // 3D Avatar & PRO Badge Icon (VIP 1 to VIP 10)
  const renderAvatarOrPin = () => (
    <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center select-none shrink-0">
      {/* Avatar Image with Fire or Standard Border */}
      <div
        className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-visible border-2 ${
          vipRank >= 8
            ? 'fire-pro-avatar border-orange-400 bg-orange-950'
            : vipRank >= 5
            ? 'electric-pro-avatar border-yellow-400 bg-amber-950'
            : vipRank >= 2
            ? 'ice-pro-avatar border-cyan-400 bg-sky-950'
            : 'border-white/80 bg-slate-800'
        } shadow-md flex items-center justify-center`}
      >
        <img
          src={player.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
          alt={player.name}
          className="w-full h-full object-cover rounded-full"
        />

        {/* Dynamic VIP 1 to VIP 10 Badge on Avatar (Visible to all players) */}
        {isOnlineMode && (
          <div
            className={`absolute -top-2 left-1/2 -translate-x-1/2 text-slate-950 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full border shadow flex items-center gap-0.5 whitespace-nowrap z-20 ${
              vipRank === 10
                ? 'bg-gradient-to-r from-red-500 via-yellow-400 to-indigo-500 text-white border-yellow-200 shadow-[0_0_10px_#f59e0b]'
                : vipRank >= 7
                ? 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 text-slate-950 border-yellow-200 shadow-[0_0_8px_#f97316]'
                : vipRank >= 4
                ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 border-white shadow-[0_0_8px_#eab308]'
                : vipRank >= 2
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 border-white shadow-[0_0_8px_#38bdf8]'
                : 'bg-slate-700 text-slate-200 border-slate-500'
            }`}
          >
            <span>👑</span>
            <span>VIP {vipRank}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative select-none">
      {/* 30-Second Inactivity Turn Timer Indicator in Online Mode */}
      {isOnlineMode && isCurrentTurn && typeof turnTimeRemaining === 'number' && (
        <div
          className={`absolute -top-7 left-1/2 -translate-x-1/2 z-40 px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 shadow-lg whitespace-nowrap ${
            turnTimeRemaining <= 7
              ? 'bg-red-600 text-white border-white animate-pulse shadow-[0_0_12px_#ef4444]'
              : 'bg-slate-950/90 text-amber-300 border-yellow-400/60'
          }`}
        >
          <span>⏳ {turnTimeRemaining}s</span>
          <span className="text-[8px] opacity-85">(30s auto-out)</span>
        </div>
      )}

      {/* Speech / Chat Bubble if active */}
      <AnimatePresence>
        {latestChatMessage && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.7 }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 rounded-xl bg-white text-slate-900 shadow-2xl border-2 border-yellow-400 text-[11px] sm:text-xs font-bold whitespace-nowrap flex items-center gap-1 pointer-events-none"
          >
            {latestChatMessage.type === 'emoji' ? (
              <span className="text-base">{latestChatMessage.text}</span>
            ) : (
              <span>{latestChatMessage.text}</span>
            )}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Capsule Pod matching reference photo */}
      <div
        className={`relative flex items-center justify-between px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border-[2.5px] border-[#facc15] shadow-[0_6px_18px_rgba(0,0,0,0.5)] transition-all ${
          isCurrentTurn ? 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-blue-950' : ''
        }`}
        style={{
          background: 'linear-gradient(180deg, #1b64b8 0%, #0c3e7d 100%)',
          width: 'clamp(120px, 36vw, 160px)',
        }}
      >
        {/* Left item */}
        {pinSide === 'left' ? (
          renderAvatarOrPin()
        ) : (
          /* Dice Tray on Left */
          <div
            className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-[2.5px] ${
              isCurrentTurn
                ? 'border-yellow-400 bg-gradient-to-b from-[#fdedec] to-[#f7d5d5] shadow-inner'
                : 'border-transparent bg-black/20'
            } flex items-center justify-center overflow-visible transition-all ${
              isCurrentTurn && canRoll && !isRolling && !hasRolled ? 'cursor-pointer active:scale-95' : ''
            }`}
            style={{
              boxShadow: isCurrentTurn ? 'inset 0 2px 6px rgba(0,0,0,0.25)' : 'none',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isCurrentTurn && canRoll && !isRolling && !hasRolled) {
                onRollDice();
              } else if (isCurrentTurn && hasRolled && !isRolling) {
                onDiceClick();
              }
            }}
          >
            {isCurrentTurn && (
              <Dice3D
                value={diceValue}
                isRolling={isRolling}
                canRoll={canRoll}
                isCurrentTurn={isCurrentTurn}
                hasRolled={hasRolled}
                consecutiveSixes={consecutiveSixes}
                color={color}
                size={44}
                diceSkin={effectiveDiceSkin}
                onRoll={onRollDice}
                onDiceClick={onDiceClick}
              />
            )}
          </div>
        )}

        {/* Center: Player Name & Tag */}
        {player && (
          <div className="flex-1 flex flex-col items-center justify-center px-1 max-w-[55%] truncate pointer-events-none select-none">
            <div className="flex items-center gap-1 max-w-full">
              <span className={`text-[10px] sm:text-[11px] font-black truncate leading-tight ${player.isOut ? 'text-red-300 line-through' : 'text-white'}`}>
                {player.name}
              </span>
            </div>
            {player.isOut ? (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] font-black text-white bg-red-600 px-1.5 py-0.2 rounded border border-white/40 animate-pulse shadow">
                  OUT ❌
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[8px] sm:text-[9px] font-extrabold text-amber-300 bg-black/40 px-1 py-0.2 rounded-md leading-none border border-amber-500/30">
                  Lv.{player.level || 1}
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold text-yellow-200 leading-none">
                  {player.isBot ? '🤖 Bot' : '🟢 Real'}
                </span>
                {(isOnlineMode || vipRank > 1) && (
                  <span className="text-[8px] font-black text-amber-300 leading-none bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/40">
                    👑 VIP {vipRank}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right item */}
        {pinSide === 'right' ? (
          renderAvatarOrPin()
        ) : (
          /* Dice Tray on Right */
          <div
            className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-[2.5px] ${
              isCurrentTurn
                ? 'border-yellow-400 bg-gradient-to-b from-[#fdedec] to-[#f7d5d5] shadow-inner'
                : 'border-transparent bg-black/20'
            } flex items-center justify-center overflow-visible transition-all ${
              isCurrentTurn && canRoll && !isRolling && !hasRolled ? 'cursor-pointer active:scale-95' : ''
            }`}
            style={{
              boxShadow: isCurrentTurn ? 'inset 0 2px 6px rgba(0,0,0,0.25)' : 'none',
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isCurrentTurn && canRoll && !isRolling && !hasRolled) {
                onRollDice();
              } else if (isCurrentTurn && hasRolled && !isRolling) {
                onDiceClick();
              }
            }}
          >
            {isCurrentTurn && (
              <Dice3D
                value={diceValue}
                isRolling={isRolling}
                canRoll={canRoll}
                isCurrentTurn={isCurrentTurn}
                hasRolled={hasRolled}
                consecutiveSixes={consecutiveSixes}
                color={color}
                size={44}
                diceSkin={effectiveDiceSkin}
                onRoll={onRollDice}
                onDiceClick={onDiceClick}
              />
            )}
          </div>
        )}

        {/* Animated Direction Pointer Arrow pointing directly to Dice Tray */}
        {isCurrentTurn && canRoll && !isRolling && !hasRolled && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 ${
              pinSide === 'left'
                ? '-right-6 sm:-right-7 animate-arrow-left'
                : '-left-6 sm:-left-7 animate-arrow-right'
            } pointer-events-none z-40`}
          >
            {pinSide === 'left' ? (
              <svg viewBox="0 0 24 24" className="w-6 h-7 sm:w-7 sm:h-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                <polygon points="22,3 22,21 3,12" fill="#facc15" stroke="#ea580c" strokeWidth="2.5" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-6 h-7 sm:w-7 sm:h-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                <polygon points="2,3 2,21 21,12" fill="#facc15" stroke="#ea580c" strokeWidth="2.5" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const PlayerDicePod = React.memo(PlayerDicePodComponent, (prev, next) => {
  return (
    prev.color === next.color &&
    prev.isCurrentTurn === next.isCurrentTurn &&
    prev.canRoll === next.canRoll &&
    prev.hasRolled === next.hasRolled &&
    prev.isRolling === next.isRolling &&
    prev.diceValue === next.diceValue &&
    prev.consecutiveSixes === next.consecutiveSixes &&
    (!next.isCurrentTurn || prev.turnTimeRemaining === next.turnTimeRemaining) &&
    prev.isOnlineMode === next.isOnlineMode &&
    prev.boardSkin === next.boardSkin &&
    prev.player?.name === next.player?.name &&
    prev.player?.avatar === next.player?.avatar &&
    prev.player?.isBot === next.player?.isBot &&
    prev.player?.level === next.player?.level &&
    prev.player?.vipLevel === next.player?.vipLevel &&
    prev.player?.isOut === next.player?.isOut &&
    prev.player?.diceSkin === next.player?.diceSkin &&
    prev.player?.tokenSkin === next.player?.tokenSkin &&
    prev.player?.boardSkin === next.player?.boardSkin &&
    prev.latestChatMessage?.timestamp === next.latestChatMessage?.timestamp
  );
});


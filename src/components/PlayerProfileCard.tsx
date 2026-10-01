import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, PlayerColor } from '../types/ludo';
import { Crown, WifiOff } from 'lucide-react';
import { Dice3D } from './Dice3D';

interface PlayerProfileCardProps {
  player: Player;
  isCurrentTurn: boolean;
  isRolling: boolean;
  hasRolled?: boolean;
  diceValue: number | null;
  canRoll: boolean;
  consecutiveSixes?: number;
  latestChatMessage?: { text: string; type: 'text' | 'quick' | 'emoji'; timestamp: number } | null;
  onRollDice?: () => void;
  onDiceClick?: () => void;
  isLocalUser?: boolean;
}

const COLOR_CONFIGS: Record<
  PlayerColor,
  { name: string; bg: string; border: string; glow: string; text: string }
> = {
  red: {
    name: 'Red',
    bg: 'bg-gradient-to-br from-red-600/95 to-rose-900/95',
    border: 'border-red-500',
    glow: 'shadow-[0_0_22px_rgba(239,68,68,0.6)]',
    text: 'text-red-400',
  },
  green: {
    name: 'Green',
    bg: 'bg-gradient-to-br from-emerald-600/95 to-green-900/95',
    border: 'border-emerald-500',
    glow: 'shadow-[0_0_22px_rgba(34,197,94,0.6)]',
    text: 'text-emerald-400',
  },
  yellow: {
    name: 'Yellow',
    bg: 'bg-gradient-to-br from-amber-500/95 to-yellow-800/95',
    border: 'border-amber-400',
    glow: 'shadow-[0_0_22px_rgba(234,179,8,0.6)]',
    text: 'text-amber-300',
  },
  blue: {
    name: 'Blue',
    bg: 'bg-gradient-to-br from-sky-600/95 to-blue-900/95',
    border: 'border-sky-400',
    glow: 'shadow-[0_0_22px_rgba(14,165,233,0.6)]',
    text: 'text-sky-300',
  },
};

export const PlayerProfileCard: React.FC<PlayerProfileCardProps> = ({
  player,
  isCurrentTurn,
  isRolling,
  hasRolled = false,
  diceValue,
  canRoll,
  consecutiveSixes = 0,
  latestChatMessage,
  onRollDice,
  onDiceClick,
  isLocalUser = false,
}) => {
  const config = COLOR_CONFIGS[player.color];
  const homeTokensCount = player.tokens.filter((t) => t.isHome || t.step >= 56).length;

  return (
    <div className="relative flex flex-col items-center">
      {/* Speech Bubble */}
      <AnimatePresence>
        {latestChatMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.7 }}
            className="absolute -top-12 z-50 px-3 py-1.5 rounded-2xl bg-white text-slate-900 shadow-2xl border-2 border-yellow-400 text-xs font-bold max-w-[160px] truncate text-center flex items-center gap-1"
          >
            {latestChatMessage.type === 'emoji' ? (
              <span className="text-xl animate-bounce">{latestChatMessage.text}</span>
            ) : (
              <span>{latestChatMessage.text}</span>
            )}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Player Card */}
      <div
        className={`relative flex items-center gap-2.5 p-2 rounded-2xl border-2 transition-all duration-300 backdrop-blur-md shadow-lg ${
          config.bg
        } ${
          isCurrentTurn
            ? `${config.border} ${config.glow} ring-2 ring-yellow-400 scale-105 z-20`
            : 'border-slate-700/60 opacity-90 scale-100'
        }`}
        style={{ width: '155px', minHeight: '64px' }}
      >
        <div className="relative">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-md flex items-center justify-center bg-slate-800 text-lg">
            {player.avatar ? (
              <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <span>👤</span>
            )}
          </div>

          {!player.isConnected && (
            <div className="absolute -bottom-1 -right-1 bg-rose-900 text-rose-300 rounded-full p-0.5 border border-rose-400 shadow">
              <WifiOff size={11} />
            </div>
          )}

          {player.rank && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-0.5 border border-yellow-200">
              <Crown size={11} className="fill-slate-950" />
              #{player.rank}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-xs font-bold text-white truncate max-w-[70px] leading-tight">
              {player.name}
            </p>
            <span className="text-[8px] bg-amber-400/30 text-amber-200 px-1 rounded font-extrabold shrink-0">
              Lv.{player.level || 1}
            </span>
            {isLocalUser && (
              <span className="text-[9px] bg-yellow-400/30 text-yellow-200 px-1 rounded font-semibold shrink-0">
                YOU
              </span>
            )}
          </div>

          {/* Tokens Home Progress */}
          <div className="flex items-center gap-1 mt-1.5">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border border-white/60 flex items-center justify-center transition-all ${
                  idx < homeTokensCount ? 'bg-yellow-300 shadow-[0_0_6px_#fde047]' : 'bg-black/40'
                }`}
              >
                {idx < homeTokensCount && <span className="text-[8px]">👑</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3D Dice Component - ALWAYS VISIBLE, NEVER HIDDEN */}
      <div className="mt-1 flex flex-col items-center">
        <Dice3D
          value={diceValue}
          isRolling={isCurrentTurn && isRolling}
          canRoll={isCurrentTurn && canRoll}
          isCurrentTurn={isCurrentTurn}
          hasRolled={isCurrentTurn && hasRolled}
          consecutiveSixes={isCurrentTurn ? consecutiveSixes : 0}
          color={player.color}
          onRoll={onRollDice || (() => {})}
          onDiceClick={onDiceClick || onRollDice || (() => {})}
        />
      </div>
    </div>
  );
};

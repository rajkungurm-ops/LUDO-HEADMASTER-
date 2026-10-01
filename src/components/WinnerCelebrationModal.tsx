import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Player, PlayerColor } from '../types/ludo';
import {
  Trophy,
  Crown,
  Sparkles,
  RotateCcw,
  Home,
  Swords,
  Loader2,
  LogOut,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { soundEffects } from '../utils/audioSynthesizer';

export interface RematchState {
  isRequested: boolean;
  readyCount: number;
  totalCount: number;
  requesterName?: string;
  opponentLeft?: boolean;
}

interface WinnerCelebrationModalProps {
  isOpen: boolean;
  winners: PlayerColor[];
  players: Player[];
  isOnlineMatch?: boolean;
  isTimeoutWin?: boolean;
  rematchState?: RematchState;
  onPlayAgain: () => void;
  onGoHome: () => void;
  activeBoardSkin?: string;
  userOwnsGlacier?: boolean;
  onShareForDiamond?: () => void;
  onOpenShop?: () => void;
}

export const WinnerCelebrationModal: React.FC<WinnerCelebrationModalProps> = ({
  isOpen,
  winners,
  players,
  isOnlineMatch = false,
  isTimeoutWin = false,
  rematchState,
  onPlayAgain,
  onGoHome,
  activeBoardSkin = 'classic',
  userOwnsGlacier = false,
  onShareForDiamond,
  onOpenShop,
}) => {
  const [countdown, setCountdown] = useState(15);
  const [leavingCountdown, setLeavingCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      soundEffects.playWinFanfare();
      setCountdown(15);
      setLeavingCountdown(null);

      // Confetti burst cannon
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });

      // Recurring bursts
      const interval = setInterval(() => {
        confetti({ particleCount: 40, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 40, angle: 120, spread: 55, origin: { x: 1 } });
      }, 1600);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // 15-second timer when waiting for online rematch
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isOpen && isOnlineMatch && rematchState?.isRequested && !rematchState.opponentLeft) {
      timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            setLeavingCountdown(3);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isOnlineMatch, rematchState?.isRequested, rematchState?.opponentLeft]);

  // Handle opponent left: 3-second countdown before going home
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isOpen && (rematchState?.opponentLeft || leavingCountdown !== null)) {
      if (leavingCountdown === null) setLeavingCountdown(3);
      timer = setInterval(() => {
        setLeavingCountdown((lc) => {
          if (lc === null || lc <= 1) {
            onGoHome();
            return 0;
          }
          return lc - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, rematchState?.opponentLeft, leavingCountdown, onGoHome]);

  if (!isOpen) return null;

  // Order players by winner first, then tokens home & kills
  const sortedPlayers = [...players].sort((a, b) => {
    const isWinnerA = winners.includes(a.color);
    const isWinnerB = winners.includes(b.color);
    if (isWinnerA && !isWinnerB) return -1;
    if (!isWinnerA && isWinnerB) return 1;
    if (b.stats.tokensHome !== a.stats.tokensHome) {
      return b.stats.tokensHome - a.stats.tokensHome;
    }
    return b.stats.kills - a.stats.kills;
  });

  const winnerPlayer = sortedPlayers[0] || players[0];
  const isGlacierWin =
    isOnlineMatch &&
    (activeBoardSkin === 'glacier_eternal' ||
      winnerPlayer?.boardSkin === 'glacier_eternal' ||
      winnerPlayer?.diceSkin === 'glacier_eternal' ||
      winnerPlayer?.tokenSkin === 'glacier_eternal');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`relative w-full max-w-md border-2 rounded-3xl p-4 sm:p-5 flex flex-col items-center text-center overflow-hidden ${
          isGlacierWin
            ? 'bg-gradient-to-b from-[#041d3d] via-[#062852] to-[#031229] border-cyan-300 shadow-[0_0_90px_rgba(34,211,238,0.65)]'
            : 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-yellow-500/90 shadow-[0_0_80px_rgba(234,179,8,0.4)]'
        }`}
      >
        {/* Background glowing rings */}
        <div
          className={`absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            isGlacierWin ? 'bg-cyan-400/30' : 'bg-amber-500/20'
          }`}
        />

        {/* Grand Crown Icon */}
        <motion.div
          animate={{ rotate: [-4, 4, -4], scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className={`relative w-14 h-14 sm:w-18 sm:h-18 rounded-full p-3 sm:p-3.5 flex items-center justify-center border-2 border-white mb-2 ${
            isGlacierWin
              ? 'bg-gradient-to-tr from-cyan-400 via-sky-300 to-white shadow-[0_0_35px_#22d3ee]'
              : 'bg-gradient-to-tr from-yellow-500 to-amber-300 shadow-[0_0_30px_#facc15]'
          }`}
        >
          <Trophy size={32} className="text-slate-950 fill-slate-950" />
          <Sparkles size={18} className="absolute -top-1 -right-1 text-white animate-spin" />
        </motion.div>

        {/* Winner Title */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1 border ${
            isGlacierWin
              ? 'bg-cyan-500/25 border-cyan-300 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.4)]'
              : 'bg-amber-500/20 border-yellow-400/50 text-yellow-300'
          }`}
        >
          <Crown size={12} className={isGlacierWin ? 'text-cyan-300' : 'text-yellow-400'} />
          <span>{isGlacierWin ? '❄️ GLACIER ETERNAL - DREAM OF KINGS 👑' : 'Ludo Headmaster Champion'}</span>
        </div>
        {isGlacierWin ? (
          <h2 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-sky-300 tracking-wide uppercase drop-shadow-[0_2px_10px_rgba(34,211,238,0.8)] leading-snug">
            ❄️👑 GLACIER EMPEROR WINS! SABKA SAPNA PURA! 👑❄️
          </h2>
        ) : (
          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200 tracking-wider uppercase drop-shadow-md">
            🏆 {winnerPlayer ? `${winnerPlayer.name} - HEADMASTER WINS!` : 'HEADMASTER WINS!'}
          </h2>
        )}
        <p className="text-[11px] sm:text-xs text-yellow-100/90 font-medium mt-0.5 mb-2">
          {winnerPlayer ? `${winnerPlayer.name} • ` : ''}Match Finished • Full Standings &amp; Rematch
        </p>

        {/* Players Standings List (1st, 2nd, 3rd, 4th) */}
        <div className="w-full space-y-2 my-1 max-h-[38vh] overflow-y-auto pr-0.5">
          {sortedPlayers.map((player, idx) => {
            const isFirst = idx === 0;
            const rankBadges = ['🥇 1st', '🥈 2nd', '🥉 3rd', '🏅 4th'];
            const colorRings: Record<string, string> = {
              blue: 'border-sky-400',
              red: 'border-red-400',
              green: 'border-emerald-400',
              yellow: 'border-amber-400',
            };

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border ${
                  isFirst
                    ? 'bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-amber-500/30 border-yellow-400 shadow-md ring-1 ring-yellow-400'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {/* Rank Badge */}
                  <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-xs font-black text-yellow-300 shadow">
                    {rankBadges[idx] || `#${idx + 1}`}
                  </span>

                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 ${colorRings[player.color] || 'border-white'} bg-slate-800 shrink-0`}
                  >
                    {player.avatar ? (
                      <img src={player.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      '👤'
                    )}
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1 leading-tight">
                        <span>{player.name}</span>
                        {player.isBot ? (
                          <span className="text-[10px] text-slate-400">🤖</span>
                        ) : (
                          <span className="text-[10px] text-emerald-400">🟢</span>
                        )}
                      </p>
                      <span className="text-[9px] font-black text-amber-300 bg-amber-950/80 border border-amber-500/40 px-1 py-0.2 rounded">
                        Lv.{player.level || 1}
                      </span>
                      {isFirst && !isTimeoutWin && (
                        <span className="text-[8px] font-black text-emerald-300 bg-emerald-950/90 border border-emerald-400 px-1 py-0.2 rounded animate-pulse">
                          +1 LEVEL UP! ⭐
                        </span>
                      )}
                      {isFirst && isTimeoutWin && (
                        <span className="text-[8px] font-black text-amber-300 bg-amber-950/90 border border-amber-400 px-1 py-0.2 rounded">
                          30s TIMEOUT (NO COINS)
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 capitalize flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 text-rose-400">
                        <Swords size={11} /> {player.stats.kills} kills
                      </span>
                      <span>•</span>
                      <span className="text-amber-300">🎲 {player.stats.sixes} sixes</span>
                    </p>
                  </div>
                </div>

                {/* Score & Coins */}
                <div className="flex items-center gap-1 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-yellow-500/30 text-[11px] font-black text-yellow-300 shadow-inner">
                  <span>🪙</span>
                  <span>+{idx === 0 && !isTimeoutWin ? '50' : '0'}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Rematch Waiting Status Banner (When clicked Play Again online) */}
        {isOnlineMatch && rematchState?.isRequested && !rematchState.opponentLeft && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex flex-col items-center gap-1.5"
          >
            <div className="flex items-center gap-2 text-xs font-black text-emerald-300">
              <Loader2 size={16} className="animate-spin text-emerald-400" />
              <span>
                Waiting for opponent... {rematchState.requesterName || 'Player'} wants rematch (
                {rematchState.readyCount}/{rematchState.totalCount})
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Auto-timeout in {countdown}s
            </div>
          </motion.div>
        )}

        {/* Opponent Left Notification */}
        {isOnlineMatch && (rematchState?.opponentLeft || leavingCountdown !== null) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full mt-3 p-2.5 rounded-2xl bg-rose-950/40 border border-rose-500/60 text-xs text-rose-300 font-bold flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            <span>Opponent left, going home in {leavingCountdown ?? 3}s...</span>
          </motion.div>
        )}

        {/* GLACIER DREAM BOARD FOMO POPUP FOR OTHERS */}
        {!userOwnsGlacier && (
          <div className="w-full mt-2.5 p-2.5 rounded-2xl bg-gradient-to-r from-cyan-950/90 via-blue-950/90 to-slate-900/95 border border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.25)] flex flex-col gap-1.5">
            <p className="text-[11px] font-black text-cyan-200 leading-snug">
              😭 Ye sapno wala board chahiye? 100💎 jama karo! Share karke diamond pao!
            </p>
            <div className="flex items-center gap-2">
              {onShareForDiamond && (
                <button
                  onClick={() => {
                    soundEffects.playButtonClick();
                    onShareForDiamond();
                  }}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow active:scale-95 transition-all cursor-pointer"
                >
                  📲 Share = +1 Free 💎
                </button>
              )}
              {onOpenShop && (
                <button
                  onClick={() => {
                    soundEffects.playButtonClick();
                    onOpenShop();
                  }}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow active:scale-95 transition-all cursor-pointer"
                >
                  ❄️ Dream Shop (100💎)
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2 Main Action Buttons: [Play Again with Same Players] and [Home] */}
        <div className="flex items-center gap-2.5 w-full mt-4">
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onPlayAgain();
            }}
            disabled={rematchState?.isRequested}
            className={`flex-1 py-3 px-3 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              rematchState?.isRequested
                ? 'bg-emerald-600/50 text-emerald-200 cursor-not-allowed border border-emerald-400/30'
                : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 hover:brightness-110 active:scale-95 border border-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
            }`}
          >
            <RotateCcw size={16} className={rematchState?.isRequested ? 'animate-spin' : ''} />
            <span>
              {rematchState?.isRequested ? 'Waiting Rematch...' : 'Play Again (Same Players)'}
            </span>
          </button>

          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onGoHome();
            }}
            className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home size={16} />
            <span>Home</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

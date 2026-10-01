import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  X,
  Play,
  ArrowRight,
  Sparkles,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { soundEffects } from '../utils/audioSynthesizer';
import { MatchRule, PlayerColor } from '../types/ludo';

interface PassAndPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (
    rule: MatchRule,
    playerCount: number,
    playerNames: string[],
    playerColors: PlayerColor[]
  ) => void;
  defaultUserName?: string;
}

export const PassAndPlayModal: React.FC<PassAndPlayModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  defaultUserName = 'Player 1',
}) => {
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [matchRule, setMatchRule] = useState<MatchRule>('classic');
  const [playerNames, setPlayerNames] = useState<string[]>([
    defaultUserName || 'Player 1',
    'Player 2',
    'Player 3',
    'Player 4',
  ]);

  if (!isOpen) return null;

  const handleStart = () => {
    soundEffects.playButtonClick();

    let names: string[] = [];
    let colors: PlayerColor[] = [];

    // Always start with Blue at the bottom of the screen (niche se start)
    if (playerCount === 2) {
      names = [playerNames[0] || 'Player 1', playerNames[1] || 'Player 2'];
      colors = ['blue', 'green'];
    } else if (playerCount === 3) {
      names = [
        playerNames[0] || 'Player 1',
        playerNames[1] || 'Player 2',
        playerNames[2] || 'Player 3',
      ];
      colors = ['blue', 'red', 'yellow'];
    } else {
      names = [
        playerNames[0] || 'Player 1',
        playerNames[1] || 'Player 2',
        playerNames[2] || 'Player 3',
        playerNames[3] || 'Player 4',
      ];
      colors = ['blue', 'red', 'green', 'yellow'];
    }

    onStartGame(matchRule, playerCount, names, colors);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-[#1a1205] to-slate-950 border-2 border-yellow-500/80 rounded-3xl p-4 sm:p-5 shadow-[0_0_50px_rgba(234,179,8,0.3)] flex flex-col gap-3 text-white overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-yellow-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 border border-yellow-400/50 flex items-center justify-center text-yellow-400 shadow-inner">
              <Smartphone size={22} />
            </div>
            <div className="text-left">
              <h3 className="font-black text-base sm:text-lg text-white leading-tight">
                Pass &amp; Play (Offline) 🤝
              </h3>
              <p className="text-[11px] text-yellow-300 font-semibold flex items-center gap-1">
                <span>Same Device • Zero Internet • 8 Safe Stars</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Players Count & Rule */}
        <div className="grid grid-cols-2 gap-2">
          {/* Players */}
          <div>
            <label className="text-[10px] font-black text-yellow-300 uppercase tracking-wider block mb-1 text-left">
              Select Players:
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setPlayerCount(count);
                  }}
                  className={`py-2 rounded-xl font-black text-xs transition-all border cursor-pointer ${
                    playerCount === count
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-white shadow-md'
                      : 'bg-slate-950/80 text-slate-300 border-yellow-500/30 hover:bg-slate-850'
                  }`}
                >
                  {count}P
                </button>
              ))}
            </div>
          </div>

          {/* Match Rule */}
          <div>
            <label className="text-[10px] font-black text-yellow-300 uppercase tracking-wider block mb-1 text-left">
              Game Rule:
            </label>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => {
                  soundEffects.playButtonClick();
                  setMatchRule('classic');
                }}
                className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                  matchRule === 'classic'
                    ? 'bg-yellow-500/30 border-yellow-400 text-yellow-300 font-black shadow-sm'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-[11px] font-black">👑 Classic</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playButtonClick();
                  setMatchRule('quick');
                }}
                className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                  matchRule === 'quick'
                    ? 'bg-yellow-500/30 border-yellow-400 text-yellow-300 font-black shadow-sm'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-[11px] font-black">⚡ Quick</span>
              </button>
            </div>
          </div>
        </div>

        {/* Player Names Input Grid */}
        <div className="space-y-1 text-left">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            Player Names (Niche se Start):
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {playerCount === 2 ? (
              <>
                <div className="flex items-center gap-1.5 bg-slate-950 border border-sky-500/50 px-2 py-1.5 rounded-xl shadow-inner">
                  <span className="w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_6px_#38bdf8] shrink-0" />
                  <input
                    type="text"
                    value={playerNames[0]}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPlayerNames((p) => [val, p[1], p[2], p[3]]);
                    }}
                    className="w-full bg-transparent text-xs text-white outline-none font-bold"
                    placeholder="P1 (Blue - Niche)"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950 border border-emerald-500/50 px-2 py-1.5 rounded-xl shadow-inner">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_6px_#34d399] shrink-0" />
                  <input
                    type="text"
                    value={playerNames[1]}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPlayerNames((p) => [p[0], val, p[2], p[3]]);
                    }}
                    className="w-full bg-transparent text-xs text-white outline-none font-bold"
                    placeholder="P2 (Green - Upper)"
                  />
                </div>
              </>
            ) : playerCount === 3 ? (
              <>
                <div className="flex items-center gap-1.5 bg-slate-950 border border-sky-500/50 px-2 py-1.5 rounded-xl shadow-inner">
                  <span className="w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_6px_#38bdf8] shrink-0" />
                  <input
                    type="text"
                    value={playerNames[0]}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPlayerNames((p) => [val, p[1], p[2], p[3]]);
                    }}
                    className="w-full bg-transparent text-xs text-white outline-none font-bold"
                    placeholder="P1 (Blue - Niche)"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950 border border-rose-500/50 px-2 py-1.5 rounded-xl shadow-inner">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e] shrink-0" />
                  <input
                    type="text"
                    value={playerNames[1]}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPlayerNames((p) => [p[0], val, p[2], p[3]]);
                    }}
                    className="w-full bg-transparent text-xs text-white outline-none font-bold"
                    placeholder="P2 (Red - Upper)"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950 border border-amber-500/50 px-2 py-1.5 rounded-xl shadow-inner col-span-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_6px_#facc15] shrink-0" />
                  <input
                    type="text"
                    value={playerNames[2]}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPlayerNames((p) => [p[0], p[1], val, p[3]]);
                    }}
                    className="w-full bg-transparent text-xs text-white outline-none font-bold"
                    placeholder="P3 (Yellow - Niche Right)"
                  />
                </div>
              </>
            ) : (
              Array.from({ length: 4 }).map((_, idx) => {
                const colors = ['Blue (Niche Left)', 'Red (Upper Left)', 'Green (Upper Right)', 'Yellow (Niche Right)'];
                const colorDots = [
                  'bg-sky-500 shadow-[0_0_6px_#38bdf8]',
                  'bg-rose-500 shadow-[0_0_6px_#f43f5e]',
                  'bg-emerald-500 shadow-[0_0_6px_#34d399]',
                  'bg-yellow-400 shadow-[0_0_6px_#facc15]',
                ];

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 px-2 py-1.5 rounded-xl shadow-inner"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${colorDots[idx]} shrink-0`} />
                    <input
                      type="text"
                      value={playerNames[idx]}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPlayerNames((p) => {
                          const copy = [...p];
                          copy[idx] = val;
                          return copy;
                        });
                      }}
                      className="w-full bg-transparent text-xs text-white outline-none font-bold"
                      placeholder={`P${idx + 1} (${colors[idx]})`}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Start Game Button */}
        <button
          onClick={handleStart}
          className="w-full py-3 sm:py-3.5 mt-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-2xl shadow-[0_4px_20px_rgba(234,179,8,0.5)] flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider active:scale-95 transition-all cursor-pointer border-2 border-white"
        >
          <Play size={16} className="fill-slate-950" />
          <span>START PASS &amp; PLAY ({playerCount}P)</span>
          <ArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  );
};

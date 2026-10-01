import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  Users,
  Search,
  X,
  Sparkles,
  Zap,
  RotateCcw,
  Bot,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { soundEffects } from '../utils/audioSynthesizer';
import { AVATAR_OPTIONS } from './GameLobby';
import { MatchFoundPayload } from '../utils/onlineMatchmaking';

interface OnlineMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentAvatar: string;
  onSaveProfile: (name: string, avatar: string) => void;
  onStartSearch: (name: string, avatar: string, playerCount: 2 | 3 | 4) => void;
  onCancelSearch: () => void;
  searchState: 'idle' | 'searching' | 'matched' | 'timeout';
  matchedData: MatchFoundPayload | null;
  selectedPlayerCount: 2 | 3 | 4;
  onPlayerCountChange: (count: 2 | 3 | 4) => void;
}

export const OnlineMatchModal: React.FC<OnlineMatchModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentAvatar,
  onSaveProfile,
  onStartSearch,
  onCancelSearch,
  searchState,
  matchedData,
  selectedPlayerCount,
  onPlayerCountChange,
}) => {
  const [nameInput, setNameInput] = useState(currentName || 'Player 1');
  const [avatarInput, setAvatarInput] = useState(currentAvatar || AVATAR_OPTIONS[0]);
  const [searchSeconds, setSearchSeconds] = useState(0);

  useEffect(() => {
    setNameInput(currentName || 'Player 1');
    setAvatarInput(currentAvatar || AVATAR_OPTIONS[0]);
  }, [currentName, currentAvatar, isOpen]);

  // Live seconds timer during search
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (searchState === 'searching') {
      setSearchSeconds(0);
      interval = setInterval(() => {
        setSearchSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [searchState]);

  if (!isOpen) return null;

  const handleStartSearching = () => {
    soundEffects.playButtonClick();
    const finalName = nameInput.trim() || 'Player 1';
    onSaveProfile(finalName, avatarInput);
    onStartSearch(finalName, avatarInput, selectedPlayerCount);
  };

  const formatTimer = (secs: number) => {
    const remaining = Math.max(0, 10 - secs);
    const ss = String(remaining).padStart(2, '0');
    return `00:${ss} sec`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200"
      onClick={() => {
        if (searchState === 'searching') {
          onCancelSearch();
        }
        onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-[#0a192f] to-slate-950 border-2 border-emerald-400 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(16,185,129,0.35)] flex flex-col items-center gap-4 text-center text-white relative overflow-hidden"
      >
        {/* Top Header Badge */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-emerald-500/30">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/40">
              <Globe size={20} className="animate-spin-slow" />
            </span>
            <div className="text-left">
              <h3 className="font-black text-base text-emerald-400 leading-tight">
                Online Multiplayer ({selectedPlayerCount} Players)
              </h3>
              <p className="text-[11px] text-slate-300 leading-none">
                Real Match + Auto Bot Fallback
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              if (searchState === 'searching') {
                onCancelSearch();
              }
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: Mode Selector & Name Input */}
        {searchState === 'idle' && (
          <div className="w-full space-y-3.5 py-1">
            {/* Player Count Buttons: [2 Players] [3 Players] [4 Players] */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                Select Online Match Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([2, 3, 4] as (2 | 3 | 4)[]).map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      soundEffects.playButtonClick();
                      onPlayerCountChange(count);
                    }}
                    className={`py-2 px-1 rounded-2xl font-black text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                      selectedPlayerCount === count
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 border-white shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-102'
                        : 'bg-slate-950/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <span>{count} Players</span>
                    <span className="text-[9px] font-bold opacity-80">
                      {count === 2 ? '1v1 Duel' : count === 3 ? '3-Way' : '4-Player'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className="text-left space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Apna Naam Likho
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={16}
                placeholder="Enter your name"
                className="w-full bg-slate-950/90 border-2 border-emerald-500/50 rounded-2xl px-3.5 py-2 text-sm text-white font-bold focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.4)] outline-none"
              />
            </div>

            {/* Avatar Selection */}
            <div className="text-left space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Choose Your Avatar
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {AVATAR_OPTIONS.map((avatar, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setAvatarInput(avatar);
                    }}
                    className={`cursor-pointer rounded-xl overflow-hidden border-2 p-0.5 transition-all ${
                      avatarInput === avatar
                        ? 'border-emerald-400 ring-2 ring-emerald-400 scale-105 shadow-[0_0_10px_#34d399]'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={avatar} alt="" className="w-full aspect-square object-cover rounded-lg" />
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-2.5 text-[11px] text-emerald-200/90 flex items-center gap-2 text-left">
              <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
              <span>
                10 sec me real players search honge, baki slots Tagre Computer Bots se bhar jayenge!
              </span>
            </div>

            {/* Play Online Button */}
            <button
              onClick={handleStartSearching}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95 transition-all cursor-pointer border border-white"
            >
              <Search size={18} />
              <span>Play Online ({selectedPlayerCount}P) 🌐</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: Searching Screen (Radar Animation & 10s Timer) */}
        {searchState === 'searching' && (
          <div className="w-full py-4 flex flex-col items-center space-y-4">
            {/* Animated Radar Pulse */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping opacity-60" />
              <div className="absolute inset-2 rounded-full border-2 border-emerald-400/50 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-400 p-1 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                <img
                  src={avatarInput}
                  alt={nameInput}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>

            {/* Text & Live Timer */}
            <div className="space-y-1">
              <h4 className="font-black text-base text-white">
                Opponent dhundh rahe hai... ({selectedPlayerCount}P Mode)
              </h4>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono font-bold text-xs tracking-wider">
                <Zap size={13} className="text-emerald-400 animate-bounce" />
                <span>Auto-Match in {formatTimer(searchSeconds)}</span>
              </div>
            </div>

            {/* Visual 10-Second Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-emerald-500/40 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, ((searchSeconds + 1) / 10) * 100)}%` }}
              />
            </div>

            <p className="text-xs text-slate-400 max-w-xs">
              Real players joining... 10s baad game start ho jayega!
            </p>

            {/* Cancel Button */}
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onCancelSearch();
              }}
              className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-slate-300 border border-slate-700 transition-all cursor-pointer"
            >
              Cancel Matchmaking
            </button>
          </div>
        )}

        {/* STEP 3: Match Found Celebration */}
        {searchState === 'matched' && matchedData && (
          <div className="w-full py-3 flex flex-col items-center space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400 text-emerald-300 text-xs font-black uppercase tracking-wider"
            >
              <Sparkles size={14} className="text-yellow-400" />
              Match Ready! ({matchedData.players.length} Players) 🎉
            </motion.div>

            {/* Player Roster Grid */}
            <div className={`grid ${matchedData.players.length === 2 ? 'grid-cols-2' : matchedData.players.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} gap-2 w-full`}>
              {matchedData.players.map((p) => {
                const isMe = p.color === matchedData.myColor;
                const colorBorders: Record<string, string> = {
                  blue: 'border-sky-400 bg-sky-500/20',
                  red: 'border-red-400 bg-red-500/20',
                  green: 'border-emerald-400 bg-emerald-500/20',
                  yellow: 'border-amber-400 bg-amber-500/20',
                };
                const colorBadge: Record<string, string> = {
                  blue: 'text-sky-300',
                  red: 'text-red-300',
                  green: 'text-emerald-300',
                  yellow: 'text-amber-300',
                };

                return (
                  <div key={p.id} className="flex flex-col items-center text-center">
                    <div className={`w-14 h-14 rounded-2xl border-2 p-0.5 shadow-lg relative ${colorBorders[p.color] || 'border-slate-500'}`}>
                      <img src={p.avatar} alt="" className="w-full h-full object-cover rounded-xl" />
                      {p.isBot ? (
                        <span className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 text-[10px] rounded-full px-1 py-0.2 shadow">
                          🤖
                        </span>
                      ) : (
                        <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 font-black text-[8px] rounded-full px-1 py-0.2 shadow">
                          REAL
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-white mt-1 max-w-[70px] truncate leading-tight">
                      {isMe ? `${p.name} (You)` : p.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-extrabold text-amber-300 bg-black/50 px-1 rounded border border-amber-500/30">
                        Lv.{p.level || 1}
                      </span>
                      <span className={`text-[8px] font-black uppercase ${colorBadge[p.color]}`}>
                        {p.color}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-xs text-emerald-300 font-bold animate-pulse">
              Starting Game Room #{matchedData.gameId}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

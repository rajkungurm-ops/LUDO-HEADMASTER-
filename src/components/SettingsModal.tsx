import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Settings,
  X,
  Volume2,
  VolumeX,
  Trophy,
  Gift,
  Flame,
  BookOpen,
  Maximize,
  Minimize,
  Share2,
  Crown,
  User,
  Users,
  Sparkles,
  Zap,
} from 'lucide-react';
import { soundEffects } from '../utils/audioSynthesizer';
import { AVATAR_OPTIONS } from './GameLobby';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onOpenLeaderboard: () => void;
  onOpenRules: () => void;
  onOpenDailySpin: () => void;
  onOpenShop: () => void;
  onOpenFriends?: () => void;
  onDailyCollect: () => void;
  isDailyCollectAvailable: boolean;
  onReferEarn: () => void;
  userName: string;
  userAvatar: string;
  userLevel?: number;
  userVipLevel?: number;
  userWins?: number;
  myPlayerId?: string;
  onUpdateProfile: (name: string, avatar: string) => void;
  showToast?: (message: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isSoundMuted,
  onToggleSound,
  isFullscreen = false,
  onToggleFullscreen,
  onOpenLeaderboard,
  onOpenRules,
  onOpenDailySpin,
  onOpenShop,
  onOpenFriends,
  onDailyCollect,
  isDailyCollectAvailable,
  onReferEarn,
  userName,
  userAvatar,
  userLevel = 1,
  userVipLevel = 1,
  userWins = 0,
  myPlayerId = '',
  onUpdateProfile,
  showToast,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(userName || 'Player 1');
  const [avatarInput, setAvatarInput] = useState(userAvatar || AVATAR_OPTIONS[0]);

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    soundEffects.playButtonClick();
    const finalName = nameInput.trim() || 'Player 1';
    onUpdateProfile(finalName, avatarInput);
    setIsEditingProfile(false);
    if (showToast) showToast('✅ Profile updated successfully!');
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
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-[#0a1124] to-slate-950 border-2 border-slate-700/80 rounded-3xl p-4 sm:p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-3 text-white max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-yellow-400 shadow-inner">
              <Settings size={22} />
            </div>
            <div className="text-left">
              <h3 className="font-black text-base sm:text-lg text-white leading-tight">
                Settings &amp; Extra Rewards ⚙️
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                Sound, Rank, Profile &amp; Daily Free Rewards
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

        {/* User Mini Profile Card with Edit Button */}
        <div className="bg-slate-950/80 border border-yellow-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-yellow-400 shadow-sm shrink-0">
              <img src={userAvatar} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-yellow-300 truncate max-w-[120px]">
                  {userName}
                </span>
                <span className="text-[9px] font-black text-slate-950 bg-gradient-to-r from-amber-300 to-yellow-400 px-1.5 py-0.5 rounded-md uppercase">
                  VIP {userVipLevel}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold block">
                Level {userLevel} • {userWins} Matches Won 🏆
              </span>
              {myPlayerId && (
                <span className="text-[9px] font-mono text-cyan-300/90 font-bold block mt-0.5">
                  ID: {myPlayerId}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setNameInput(userName);
              setAvatarInput(userAvatar);
              setIsEditingProfile(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-yellow-300 text-xs font-bold border border-yellow-500/30 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Edit Profile
          </button>
        </div>

        {/* PROFILE EDIT FORM (If editing) */}
        {isEditingProfile && (
          <div className="bg-slate-900 border-2 border-yellow-400/60 rounded-2xl p-3 space-y-2.5 text-left animate-in fade-in">
            <h4 className="text-xs font-black text-yellow-300 uppercase tracking-wider flex items-center gap-1">
              <User size={13} />
              <span>Update Player Details</span>
            </h4>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Your Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={16}
                className="w-full bg-slate-950 border border-slate-700 focus:border-yellow-400 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">
                Choose Avatar
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {AVATAR_OPTIONS.map((avatar, idx) => (
                  <div
                    key={idx}
                    onClick={() => setAvatarInput(avatar)}
                    className={`cursor-pointer rounded-xl overflow-hidden border-2 p-0.5 transition-all ${
                      avatarInput === avatar
                        ? 'border-yellow-400 shadow-[0_0_10px_#facc15]'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={avatar}
                      alt=""
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wide cursor-pointer shadow-md"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* PRIMARY SETTINGS TILES */}
        <div className="grid grid-cols-2 gap-2 text-left">
          {/* 1. SOUND TOGGLE */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onToggleSound();
            }}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              isSoundMuted
                ? 'bg-slate-900/90 border-slate-800 text-slate-400'
                : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {isSoundMuted ? (
                <VolumeX size={18} className="text-rose-400" />
              ) : (
                <Volume2 size={18} className="text-emerald-400" />
              )}
              <div>
                <span className="text-xs font-black block">Audio Sound</span>
                <span className="text-[10px] font-bold opacity-75">
                  {isSoundMuted ? 'Muted (Off)' : 'Enabled (On)'}
                </span>
              </div>
            </div>
            <span
              className={`w-3 h-3 rounded-full ${isSoundMuted ? 'bg-rose-500' : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'}`}
            />
          </button>

          {/* 2. FULLSCREEN */}
          {onToggleFullscreen && (
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onToggleFullscreen();
              }}
              className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 text-slate-200 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {isFullscreen ? (
                  <Minimize size={18} className="text-amber-400" />
                ) : (
                  <Maximize size={18} className="text-amber-400" />
                )}
                <div>
                  <span className="text-xs font-black block">Display</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {isFullscreen ? 'Exit Full' : 'Fullscreen'}
                  </span>
                </div>
              </div>
            </button>
          )}

          {/* 3. RANK / LEADERBOARD */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onClose();
              onOpenLeaderboard();
            }}
            className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-yellow-500/40 text-yellow-300 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-yellow-400" />
              <div>
                <span className="text-xs font-black block">Leaderboard</span>
                <span className="text-[10px] font-bold text-slate-400">Global Rankings</span>
              </div>
            </div>
          </button>

          {/* 4. GAME RULES */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onClose();
              onOpenRules();
            }}
            className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-sky-400/40 text-sky-300 transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-sky-400" />
              <div>
                <span className="text-xs font-black block">Game Rules</span>
                <span className="text-[10px] font-bold text-slate-400">8 Stars &amp; Moves</span>
              </div>
            </div>
          </button>

          {/* 5. RECENT OPPONENTS & FRIENDS */}
          {onOpenFriends && (
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onClose();
                onOpenFriends();
              }}
              className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-emerald-400/40 text-emerald-300 transition-all cursor-pointer flex items-center justify-between col-span-2"
            >
              <div className="flex items-center gap-2">
                <Users size={18} className="text-emerald-400" />
                <div>
                  <span className="text-xs font-black block">Recent Opponents &amp; Friends</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    View opponent match history &amp; send direct invites
                  </span>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          )}
        </div>

        {/* EXTRA REWARDS & SPIN SECTION */}
        <div className="space-y-2 pt-1 text-left">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            Daily Free Rewards &amp; Extra:
          </span>

          {/* 1. DAILY BONUS 100 COINS */}
          <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0">
                <Gift size={16} />
              </div>
              <div>
                <span className="text-xs font-black text-white block leading-tight">
                  🎁 Daily Bonus (+100 Coins)
                </span>
                <span className="text-[10px] text-emerald-300 font-bold">
                  {isDailyCollectAvailable ? 'Claim 100 free coins now!' : '✓ Already collected today'}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onDailyCollect();
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wide cursor-pointer transition-all active:scale-95 ${
                isDailyCollectAvailable
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              {isDailyCollectAvailable ? 'COLLECT' : 'CLAIMED'}
            </button>
          </div>

          {/* 2. DAILY SPIN WHEEL */}
          <div className="bg-slate-950 border border-purple-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-300 shrink-0 text-base">
                🎡
              </div>
              <div>
                <span className="text-xs font-black text-white block leading-tight">
                  🎡 Daily Spin Wheel (+100 Coins)
                </span>
                <span className="text-[10px] text-purple-300 font-bold">
                  Spin the lucky wheel for 100 Coins
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onClose();
                onOpenDailySpin();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 text-white font-black text-xs uppercase tracking-wide shadow-md cursor-pointer transition-all active:scale-95"
            >
              SPIN NOW
            </button>
          </div>

          {/* 3. WHATSAPP INVITE (+1 DIAMOND ON OPEN/INSTALL) */}
          <div className="bg-slate-950 border border-cyan-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0 text-base">
                💎
              </div>
              <div>
                <span className="text-xs font-black text-white block leading-tight">
                  📲 WhatsApp Invite (+1 💎 Diamond)
                </span>
                <span className="text-[10px] text-cyan-300 font-bold">
                  +1 💎 when invited friend opens/installs game
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onReferEarn();
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wide shadow-md cursor-pointer transition-all active:scale-95"
            >
              INVITE
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

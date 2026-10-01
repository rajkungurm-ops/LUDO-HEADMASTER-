import React, { useState, useEffect } from 'react';
import { GameMode, MatchRule, PlayerColor } from '../types/ludo';
import {
  Globe,
  Users,
  Smartphone,
  Flame,
  Settings,
  BookOpen,
  Sparkles,
  ArrowRight,
  Crown,
  Play,
  Share2,
} from 'lucide-react';
import { soundEffects } from '../utils/audioSynthesizer';
import headmasterLogoImg from '../assets/images/ludo_headmaster_logo_1790778552737.jpg';
import { SettingsModal } from './SettingsModal';
import { PassAndPlayModal } from './PassAndPlayModal';
import { PlayWithFriendsModal } from './PlayWithFriendsModal';
import { DailySpinModal } from './DailySpinModal';
import { getTodayDateString } from '../utils/rewardsHelper';
import { RecentPlayer } from '../utils/recentPlayers';

export const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
];

interface GameLobbyProps {
  userName: string;
  userAvatar: string;
  userCoins: number;
  userDiamonds?: number;
  userTrophies: number;
  userLevel?: number;
  userWins?: number;
  userVipLevel?: number;
  onUpdateUserProfile: (name: string, avatar: string) => void;
  onStartGame: (
    mode: GameMode,
    matchRule: MatchRule,
    playerCount: number,
    playerNames: string[],
    playerColors: PlayerColor[]
  ) => void;
  onOpenLeaderboard: () => void;
  onOpenRules: () => void;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onOpenOnlineMatch?: (count?: 2 | 3 | 4) => void;
  onOpenFriends?: () => void;
  onOpenShop?: () => void;
  onAddCoins?: (amount: number, reason: string) => void;
  onAddDiamonds?: (amount: number) => void;
  showToast?: (message: string) => void;
  myPlayerId?: string;
  onCreatePrivateRoom?: (playerCount: 2 | 4, roomCode: string) => void;
  onJoinPrivateRoom?: (roomCode: string) => void;
  onInviteFriend?: (player: RecentPlayer, count: 2 | 3 | 4) => void;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  userName,
  userAvatar,
  userCoins,
  userDiamonds = 0,
  userTrophies,
  userLevel = 1,
  userWins = 0,
  userVipLevel = 1,
  onUpdateUserProfile,
  onStartGame,
  onOpenLeaderboard,
  onOpenRules,
  isSoundMuted,
  onToggleSound,
  isFullscreen = false,
  onToggleFullscreen,
  onOpenOnlineMatch,
  onOpenFriends,
  onOpenShop,
  onAddCoins,
  onAddDiamonds,
  showToast,
  myPlayerId = '',
  onCreatePrivateRoom,
  onJoinPrivateRoom,
  onInviteFriend,
}) => {
  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPassAndPlayOpen, setIsPassAndPlayOpen] = useState(false);
  const [isPlayWithFriendsOpen, setIsPlayWithFriendsOpen] = useState(false);
  const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);

  const cleanUserName =
    userName && !userName.toLowerCase().includes('raj') ? userName : 'Player 1';

  // Daily collect check
  const [lastCollectDate, setLastCollectDate] = useState<string>(() => {
    try {
      return localStorage.getItem('lastCollectDate') || '';
    } catch {
      return '';
    }
  });

  const today = getTodayDateString();
  const isCollectAvailable = lastCollectDate !== today;

  const handleDailyCollection = () => {
    soundEffects.playButtonClick();
    const currentDate = getTodayDateString();
    const storedLastCollect = localStorage.getItem('lastCollectDate');

    if (storedLastCollect === currentDate) {
      soundEffects.playError();
      if (showToast) showToast('❌ Kal aana ji (Already claimed today)');
      return;
    }

    const currentCoins = userCoins || 0;
    const newCoins = currentCoins + 100;
    try {
      localStorage.setItem('lastCollectDate', currentDate);
      localStorage.setItem('userCoins', newCoins.toString());
    } catch {}
    setLastCollectDate(currentDate);

    if (onAddCoins) {
      onAddCoins(100, 'Daily Bonus');
    }
    if (showToast) {
      showToast('🎉 +100 Coins Daily Bonus collected! (Aaj ka reward mil gaya) 🪙');
    }
    soundEffects.playWinFanfare();
  };

  const handleReferNow = () => {
    soundEffects.playButtonClick();
    const referralUrl = `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(myPlayerId || '')}`;
    const shareText = `🎲 Let's play Ludo Headmaster together! 👑 Play Royal Ludo online with me: ${referralUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

    try {
      if (navigator.share) {
        navigator
          .share({
            title: 'Ludo Headmaster',
            text: shareText,
            url: referralUrl,
          })
          .catch(() => {
            window.open(whatsappUrl, '_blank');
          });
      } else {
        window.open(whatsappUrl, '_blank');
      }
    } catch {
      window.open(whatsappUrl, '_blank');
    }

    if (showToast) {
      showToast('📲 WhatsApp Invite Sent! Friend ke open/install karne par +1 💎 milega!');
    }
  };

  const handleSpinSuccess = (_newCoins: number) => {
    try {
      localStorage.setItem('lastSpinDate', getTodayDateString());
    } catch {}
    if (onAddCoins) {
      onAddCoins(100, 'Daily Spin');
    }
    if (showToast) {
      showToast('🎉 Won 100 Coins from Daily Spin! 🪙');
    }
  };

  const handleRewardDiamond = () => {
    soundEffects.playDiamondExchange();
    if (onAddDiamonds) {
      onAddDiamonds(1);
    }
    if (showToast) {
      showToast('🎉 +1 Free Diamond 💎 Credited for Room Sharing!');
    }
  };

  return (
    <div className="relative w-full max-w-md min-h-[100dvh] flex flex-col justify-between py-3 px-3 sm:px-4 select-none font-sans mx-auto text-white">
      {/* Lightweight Dark Background (Zero Lag) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-gradient-to-b from-[#0a0f1d] via-[#05070e] to-[#04060c]">
        {/* Soft Radial Ambient Glow */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* ============================================================ */}
      {/* 1. TOP BAR: USER PROFILE (LEFT) + ONLY 2 PILLS (RIGHT)      */}
      {/* ============================================================ */}
      <header className="relative z-10 w-full flex items-center justify-between gap-2 pt-1">
        {/* Left: User Avatar & Name */}
        <div
          onClick={() => {
            soundEffects.playButtonClick();
            setIsSettingsOpen(true);
          }}
          className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-850 border border-slate-700/80 rounded-2xl py-1 px-2 cursor-pointer transition-all active:scale-95 shadow-md"
        >
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-yellow-400/80 shadow-sm shrink-0">
            <img src={userAvatar} alt="" className="w-full h-full object-cover" />
          </div>
          <span className="font-extrabold text-xs text-yellow-300 truncate max-w-[90px] sm:max-w-[110px]">
            {cleanUserName}
          </span>
        </div>

        {/* Right: ONLY 2 PILLS (🪙 Coins and 💎 Diamonds) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* COINS PILL */}
          <div
            onClick={() => {
              soundEffects.playButtonClick();
              if (onOpenShop) onOpenShop();
            }}
            className="flex items-center gap-1.5 bg-slate-900/95 hover:bg-slate-850 border border-amber-500/50 rounded-full py-1 px-2.5 sm:px-3 shadow-[0_2px_10px_rgba(245,158,11,0.2)] cursor-pointer transition-all active:scale-95"
            title="Your Coins - Click to Open Shop"
          >
            <span className="text-sm leading-none">🪙</span>
            <span className="font-black text-xs text-amber-300 tracking-wide">
              {userCoins.toLocaleString()}
            </span>
          </div>

          {/* DIAMONDS PILL */}
          <div
            onClick={() => {
              soundEffects.playButtonClick();
              if (onOpenShop) onOpenShop();
            }}
            className="flex items-center gap-1.5 bg-slate-900/95 hover:bg-slate-850 border border-cyan-400/60 rounded-full py-1 px-2.5 sm:px-3 shadow-[0_2px_10px_rgba(6,182,212,0.25)] cursor-pointer transition-all active:scale-95"
            title="Your Diamonds - Click to Open Shop"
          >
            <span className="text-sm leading-none">💎</span>
            <span className="font-black text-xs text-cyan-300 tracking-wide">
              {userDiamonds.toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. CENTER: LUDO HEADMASTER LOGO WITH CROWN                   */}
      {/* ============================================================ */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto py-2">
        {/* Official Majestic Logo */}
        <div className="relative mb-2">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-yellow-500/30 via-amber-400/20 to-blue-500/20 blur-xl opacity-80" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-gradient-to-b from-yellow-300 via-amber-500 to-yellow-600 shadow-[0_12px_35px_rgba(0,0,0,0.8)]">
            <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-950 border border-yellow-200/60 shadow-inner flex items-center justify-center">
              <img
                src={headmasterLogoImg}
                alt="Ludo Headmaster Logo"
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-yellow-500 uppercase leading-none drop-shadow-[0_2px_12px_rgba(234,179,8,0.5)]">
          LUDO HEADMASTER
        </h1>
        <div className="inline-flex items-center gap-1.5 text-yellow-300 text-[10px] sm:text-[11px] font-black uppercase tracking-wider mt-1 opacity-90">
          <Sparkles size={11} className="text-yellow-400 shrink-0" />
          <span>ROYAL MULTIPLAYER ARENA • 8 SAFE STARS</span>
          <Sparkles size={11} className="text-yellow-400 shrink-0" />
        </div>

        {/* ============================================================ */}
        {/* 3. MAIN BUTTONS: ONLY 4 BIG BUTTONS (VERTICAL, CENTER)       */}
        {/* ============================================================ */}
        <div className="w-full flex flex-col gap-2.5 sm:gap-3 mt-5 px-1">
          {/* BUTTON 1: [BLUE BIGGEST] 🌐 PLAY ONLINE */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              if (onOpenOnlineMatch) onOpenOnlineMatch(2);
            }}
            className="group relative w-full py-3.5 sm:py-4 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-between shadow-[0_6px_25px_rgba(37,99,235,0.45)] active:scale-98 transition-all cursor-pointer border-2 border-blue-300/80 overflow-hidden"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <div className="flex items-center gap-3 relative z-10 text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-300/40 flex items-center justify-center text-blue-200 shadow-inner shrink-0">
                <Globe size={22} className="animate-spin-slow" />
              </div>
              <div>
                <span className="block text-sm sm:text-base font-black leading-tight text-white drop-shadow">
                  🌐 PLAY ONLINE
                </span>
                <span className="text-[10px] sm:text-[11px] text-blue-100 font-bold opacity-90 block">
                  Quick Match • Real Players • 2P, 3P, 4P
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:translate-x-0.5 transition-transform">
              <ArrowRight size={18} />
            </div>
          </button>

          {/* BUTTON 2: [DARK GREY] 👥 PLAY WITH FRIENDS (Share Link Wala) */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setIsPlayWithFriendsOpen(true);
            }}
            className="group relative w-full py-3.5 sm:py-4 px-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 hover:bg-slate-800 text-white font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.6)] active:scale-98 transition-all cursor-pointer border-2 border-emerald-500/50 hover:border-emerald-400 overflow-hidden"
          >
            <div className="flex items-center gap-3 relative z-10 text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
                <Users size={22} />
              </div>
              <div>
                <span className="block text-sm sm:text-base font-black leading-tight text-white drop-shadow">
                  👥 PLAY WITH FRIENDS
                </span>
                <span className="text-[10px] sm:text-[11px] text-emerald-300 font-bold opacity-90 block">
                  Create Room • Share WhatsApp Link • Free 1💎
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
              <ArrowRight size={18} />
            </div>
          </button>

          {/* BUTTON 3: [DARK GREY] 🤝 PASS AND PLAY (Offline) */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setIsPassAndPlayOpen(true);
            }}
            className="group relative w-full py-3.5 sm:py-4 px-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 hover:bg-slate-800 text-white font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.6)] active:scale-98 transition-all cursor-pointer border-2 border-yellow-500/50 hover:border-yellow-400 overflow-hidden"
          >
            <div className="flex items-center gap-3 relative z-10 text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-yellow-500/40 flex items-center justify-center text-yellow-300 shadow-inner shrink-0">
                <Smartphone size={22} />
              </div>
              <div>
                <span className="block text-sm sm:text-base font-black leading-tight text-white drop-shadow">
                  🤝 PASS AND PLAY
                </span>
                <span className="text-[10px] sm:text-[11px] text-yellow-300/90 font-bold opacity-90 block">
                  Same Mobile • Offline • 2, 3, 4 Players
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-300 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform">
              <ArrowRight size={18} />
            </div>
          </button>

          {/* BUTTON 4: [GOLDEN SHINING - BIGGEST AFTER BLUE] 💎 VIP SHOP - GLACIER DREAM ❄️ */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              if (onOpenShop) onOpenShop();
            }}
            className="group relative w-full py-3.5 sm:py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-between shadow-[0_0_25px_rgba(245,158,11,0.55)] active:scale-98 transition-all cursor-pointer border-2 border-white overflow-hidden animate-pulse"
          >
            {/* Top Right Flame Badge */}
            <span className="absolute -top-0.5 right-3 px-2 py-0.5 rounded-b-lg bg-gradient-to-r from-red-600 to-orange-500 text-white text-[9px] font-black uppercase tracking-wider shadow-md flex items-center gap-0.5">
              <Flame size={10} className="fill-white" />
              <span>NEW GLACIER ETERNAL - 100💎</span>
            </span>

            <div className="flex items-center gap-3 relative z-10 text-left pt-1">
              <div className="w-10 h-10 rounded-xl bg-slate-950/80 border border-yellow-200 flex items-center justify-center text-amber-300 shadow-inner shrink-0 text-lg">
                💎
              </div>
              <div>
                <span className="block text-sm sm:text-base font-black leading-tight text-slate-950 drop-shadow-sm">
                  💎 VIP SHOP - GLACIER DREAM ❄️
                </span>
                <span className="text-[10px] sm:text-[11px] text-amber-950 font-black opacity-95 block">
                  5💎 se start • 100💎 Glacier Dream!
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-xl bg-slate-950/20 text-slate-950 flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform mt-1">
              <ArrowRight size={18} />
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. BOTTOM BAR: SETTINGS (GEAR ICON) & RULES ICON             */}
      {/* ============================================================ */}
      <footer className="relative z-10 w-full flex items-center justify-between pt-2 pb-1 border-t border-slate-800/80 text-[10px] text-slate-400 font-bold">
        {/* Left: Settings Button (Contains Sound, Rank, Spin, Collect 20, Refer, Rules) */}
        <button
          onClick={() => {
            soundEffects.playButtonClick();
            setIsSettingsOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm"
          title="Open Settings & Rewards"
        >
          <Settings size={14} className="text-yellow-400" />
          <span>Settings &amp; Extras</span>
        </button>

        {/* Right: Rules Quick Button */}
        <button
          onClick={() => {
            soundEffects.playButtonClick();
            onOpenRules();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm"
          title="Open Game Rules"
        >
          <BookOpen size={14} className="text-sky-400" />
          <span>Rules</span>
        </button>
      </footer>

      {/* ============================================================ */}
      {/* 5. MODALS                                                    */}
      {/* ============================================================ */}

      {/* PLAY WITH FRIENDS MODAL */}
      <PlayWithFriendsModal
        isOpen={isPlayWithFriendsOpen}
        onClose={() => setIsPlayWithFriendsOpen(false)}
        myPlayerId={myPlayerId}
        userName={cleanUserName}
        userAvatar={userAvatar}
        onCreatePrivateRoom={(count, code) => {
          setIsPlayWithFriendsOpen(false);
          if (onCreatePrivateRoom) {
            onCreatePrivateRoom(count, code);
          } else if (onOpenOnlineMatch) {
            onOpenOnlineMatch(count);
          }
        }}
        onJoinPrivateRoom={(code) => {
          setIsPlayWithFriendsOpen(false);
          if (onJoinPrivateRoom) {
            onJoinPrivateRoom(code);
          }
        }}
        onRewardDiamond={handleRewardDiamond}
        onInviteFriend={(player, count) => {
          setIsPlayWithFriendsOpen(false);
          if (onInviteFriend) {
            onInviteFriend(player, count);
          }
        }}
        showToast={showToast}
      />

      {/* PASS AND PLAY (OFFLINE) MODAL */}
      <PassAndPlayModal
        isOpen={isPassAndPlayOpen}
        onClose={() => setIsPassAndPlayOpen(false)}
        defaultUserName={cleanUserName}
        onStartGame={(rule, count, names, colors) => {
          setIsPassAndPlayOpen(false);
          onStartGame('local', rule, count, names, colors);
        }}
      />

      {/* SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isSoundMuted={isSoundMuted}
        onToggleSound={onToggleSound}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onOpenLeaderboard={onOpenLeaderboard}
        onOpenRules={onOpenRules}
        onOpenDailySpin={() => setIsSpinModalOpen(true)}
        onOpenShop={() => {
          if (onOpenShop) onOpenShop();
        }}
        onOpenFriends={() => {
          setIsSettingsOpen(false);
          if (onOpenFriends) onOpenFriends();
          else setIsPlayWithFriendsOpen(true);
        }}
        onDailyCollect={handleDailyCollection}
        isDailyCollectAvailable={isCollectAvailable}
        onReferEarn={handleReferNow}
        userName={cleanUserName}
        userAvatar={userAvatar}
        userLevel={userLevel}
        userVipLevel={userVipLevel}
        userWins={userWins}
        myPlayerId={myPlayerId}
        onUpdateProfile={onUpdateUserProfile}
        showToast={showToast}
      />

      {/* DAILY SPIN MODAL */}
      <DailySpinModal
        isOpen={isSpinModalOpen}
        onClose={() => setIsSpinModalOpen(false)}
        userCoins={userCoins}
        onSpinSuccess={handleSpinSuccess}
      />
    </div>
  );
};

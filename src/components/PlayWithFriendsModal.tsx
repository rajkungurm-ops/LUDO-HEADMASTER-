import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  X,
  Share2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Plus,
  Crown,
  Gift,
  Swords,
  Search,
  Radio,
  Clock,
  RotateCw,
} from 'lucide-react';
import { soundEffects } from '../utils/audioSynthesizer';
import {
  RecentPlayer,
  getRecentPlayers,
  saveRecentPlayer,
  toggleMockOnlineStatus,
} from '../utils/recentPlayers';
import { listenToRecentOpponents, saveOpponentToFirestore } from '../lib/firebase';

interface PlayWithFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  myPlayerId: string;
  userName: string;
  userAvatar: string;
  onCreatePrivateRoom: (playerCount: 2 | 4, roomCode: string) => void;
  onJoinPrivateRoom: (roomCode: string) => void;
  onRewardDiamond?: () => void;
  onInviteFriend?: (player: RecentPlayer, count: 2 | 3 | 4) => void;
  showToast?: (message: string) => void;
}

export const PlayWithFriendsModal: React.FC<PlayWithFriendsModalProps> = ({
  isOpen,
  onClose,
  myPlayerId,
  userName,
  userAvatar,
  onCreatePrivateRoom,
  onJoinPrivateRoom,
  onRewardDiamond,
  onInviteFriend,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'opponents' | 'create' | 'join'>('opponents');
  const [playerCount, setPlayerCount] = useState<2 | 4>(2);
  const [roomCode, setRoomCode] = useState<string>(() =>
    Math.floor(100000 + Math.random() * 900000).toString()
  );
  const [inputJoinCode, setInputJoinCode] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [hasClaimedShareReward, setHasClaimedShareReward] = useState<boolean>(false);

  // Recent opponents list
  const [players, setPlayers] = useState<RecentPlayer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedInviteCount, setSelectedInviteCount] = useState<2 | 3 | 4>(2);

  // Load recent opponents from local storage and real-time Firebase
  useEffect(() => {
    if (!isOpen) return;

    setPlayers(getRecentPlayers());

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setPlayers([...e.detail]);
      } else {
        setPlayers(getRecentPlayers());
      }
    };

    window.addEventListener('recent-players-updated', handleUpdate);

    // Real-Time Firebase Listener for saved opponents across matches
    let unsubFirestore: (() => void) | null = null;
    if (myPlayerId) {
      unsubFirestore = listenToRecentOpponents(myPlayerId, (firestorePlayers) => {
        if (firestorePlayers && firestorePlayers.length > 0) {
          setPlayers((prev) => {
            const map = new Map<string, RecentPlayer>();
            firestorePlayers.forEach((p) => map.set(p.id, p));
            prev.forEach((p) => {
              if (!map.has(p.id)) map.set(p.id, p);
            });
            return Array.from(map.values());
          });
        }
      });
    }

    // Live status toggle
    const interval = setInterval(() => {
      const updated = toggleMockOnlineStatus();
      setPlayers([...updated]);
    }, 30000);

    return () => {
      window.removeEventListener('recent-players-updated', handleUpdate);
      clearInterval(interval);
      if (unsubFirestore) unsubFirestore();
    };
  }, [isOpen, myPlayerId]);

  // Generate a fresh 6-digit code when modal opens
  useEffect(() => {
    if (isOpen) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setRoomCode(code);
      setIsCopied(false);
      setInputJoinCode('');
      setHasClaimedShareReward(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const joinLink = `${window.location.origin}${window.location.pathname}?code=${roomCode}&ref=${encodeURIComponent(myPlayerId || '')}`;

  const onlineCount = players.filter((p) => p.isOnline).length;
  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleCopyLink = () => {
    soundEffects.playButtonClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(joinLink).catch(() => {});
    }
    setIsCopied(true);
    if (showToast) {
      showToast('📋 Invite Link copied! Jab friend open/install karega tab +1 💎 milega!');
    }
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    soundEffects.playButtonClick();
    const shareMessage = `👑 Mere saath Ludo khelo! 🎲\n\nRoom Code: *${roomCode}*\nJoin Link: ${joinLink}\n\n1-Click me aao aur jeeto! 🏆`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;

    try {
      if (navigator.share) {
        navigator
          .share({
            title: 'Ludo Headmaster - Private Room',
            text: shareMessage,
            url: joinLink,
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

  const handleCreateRoom = () => {
    soundEffects.playButtonClick();
    onCreatePrivateRoom(playerCount, roomCode);
  };

  const handleJoinByCode = () => {
    const clean = inputJoinCode.trim().replace(/\D/g, '');
    if (clean.length < 4) {
      soundEffects.playError();
      if (showToast) showToast('❌ Please enter a valid 6-digit room code!');
      return;
    }
    soundEffects.playButtonClick();
    onJoinPrivateRoom(clean);
  };

  const handleDirectInvitePlayer = (player: RecentPlayer) => {
    soundEffects.playButtonClick();
    if (onInviteFriend) {
      onInviteFriend(player, selectedInviteCount);
    } else {
      onCreatePrivateRoom(selectedInviteCount === 4 ? 4 : 2, roomCode);
    }
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
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-[#0b1329] to-slate-950 border-2 border-emerald-400/80 rounded-3xl p-4 sm:p-5 shadow-[0_0_50px_rgba(16,185,129,0.3)] flex flex-col gap-3 text-white max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shadow-inner">
              <Users size={22} />
            </div>
            <div className="text-left">
              <h3 className="font-black text-base sm:text-lg text-white leading-tight">
                Play With Friends &amp; Opponents 👥
              </h3>
              <p className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{onlineCount} Online Players Ready to Play</span>
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

        {/* 3 TABS: [🟢 RECENT OPPONENTS] [📲 WHATSAPP ROOM] [🚪 JOIN CODE] */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950/90 p-1 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setActiveTab('opponents');
            }}
            className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'opponents'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-[1.01]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">OPPONENTS ({onlineCount})</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setActiveTab('create');
            }}
            className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-[1.01]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 size={13} />
            <span className="truncate">WHATSAPP</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setActiveTab('join');
            }}
            className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'join'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-[1.01]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRight size={13} />
            <span className="truncate">JOIN CODE</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: RECENT OPPONENTS HISTORY & LIVE INVITE                 */}
        {/* ============================================================ */}
        {activeTab === 'opponents' && (
          <div className="flex flex-col gap-2.5 overflow-hidden flex-1">
            {/* Invite Mode Selector: 2P Duel | 3P Match | 4P Royal */}
            <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 px-2.5 py-1.5 rounded-xl shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Invite Match Size:
              </span>
              <div className="flex items-center gap-1">
                {([2, 3, 4] as (2 | 3 | 4)[]).map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setSelectedInviteCount(count);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      selectedInviteCount === count
                        ? 'bg-emerald-400 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {count}P
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative shrink-0">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recent opponents by name..."
                className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-emerald-400 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none placeholder:text-slate-500"
              />
            </div>

            {/* Players List */}
            <div className="space-y-1.5 overflow-y-auto pr-0.5 flex-1 max-h-[42vh]">
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs space-y-1 bg-slate-950/40 rounded-2xl border border-slate-800">
                  <p className="font-bold">No opponents found in history</p>
                  <p className="text-[10px] text-slate-500">
                    Play online matches to automatically build your friends history!
                  </p>
                </div>
              ) : (
                filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 sm:p-2.5 rounded-2xl border transition-all ${
                      player.isOnline
                        ? 'bg-slate-950/90 border-emerald-500/40 hover:border-emerald-400'
                        : 'bg-slate-950/50 border-slate-800 opacity-75'
                    }`}
                  >
                    {/* Player Info */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                        <img
                          src={player.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {/* Live Online Dot */}
                        <span
                          className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-slate-950 ${
                            player.isOnline
                              ? 'bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse'
                              : 'bg-slate-600'
                          }`}
                        />
                      </div>

                      <div className="text-left min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-white truncate max-w-[110px] sm:max-w-[130px]">
                            {player.name}
                          </span>
                          <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                            Lv.{player.level || 15}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                          <span
                            className={
                              player.isOnline ? 'text-emerald-400 font-bold' : 'text-slate-500'
                            }
                          >
                            {player.isOnline ? '🟢 Online Now' : '⚪ Offline'}
                          </span>
                          <span>•</span>
                          <span>{player.gamesPlayedWith || 1} Matches</span>
                        </div>
                      </div>
                    </div>

                    {/* Direct In-Game Challenge/Invite Button */}
                    <button
                      onClick={() => handleDirectInvitePlayer(player)}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer shrink-0 ${
                        player.isOnline
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      <Swords size={13} />
                      <span>INVITE</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Hint */}
            <div className="text-[10px] text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80 text-center shrink-0">
              💡 Online players ko invite bhejne par unhe direct in-game notification jayegi!
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: CREATE PRIVATE ROOM & WHATSAPP SHARE                   */}
        {/* ============================================================ */}
        {activeTab === 'create' && (
          <div className="space-y-3 pt-0.5 overflow-y-auto">
            {/* Free Diamond Reward Callout */}
            <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-emerald-950/80 border border-cyan-400/50 rounded-2xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-inner">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shrink-0 text-base animate-pulse">
                  💎
                </div>
                <div className="text-left">
                  <span className="text-[11px] sm:text-xs font-black text-cyan-300 block leading-tight">
                    WHATSAPP INVITE REWARD 💎
                  </span>
                  <span className="text-[10px] text-slate-300">
                    Get +1 💎 Diamond when friend opens/installs via WhatsApp!
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-400/60 text-cyan-300 text-[10px] font-black uppercase shrink-0">
                +1 💎
              </span>
            </div>

            {/* 2P vs 4P Selector */}
            <div>
              <label className="text-[11px] font-black text-emerald-300 uppercase tracking-wider block mb-1 text-left">
                Select Room Type:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {([2, 4] as (2 | 4)[]).map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setPlayerCount(count);
                    }}
                    className={`py-2.5 px-2 rounded-2xl font-black text-xs sm:text-sm transition-all border cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                      playerCount === count
                        ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-slate-950 border-white shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                        : 'bg-slate-950/90 text-slate-300 border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <span>{count === 2 ? '⚔️ 2 Players (1v1)' : '👑 4 Players (Royal)'}</span>
                    <span className="text-[9px] opacity-80">
                      {count === 2 ? 'Quick Head-to-Head' : 'Full 4-Way Match'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Room Code Display Box */}
            <div className="bg-slate-950/90 border-2 border-dashed border-emerald-400/60 rounded-2xl p-2.5 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Your Auto-Generated 6-Digit Room Code:
              </span>
              <div className="text-2xl sm:text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-yellow-200 to-emerald-400">
                {roomCode}
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[280px] sm:max-w-[340px] mx-auto opacity-75">
                {joinLink}
              </p>
            </div>

            {/* BIG BUTTON: SHARE ON WHATSAPP */}
            <button
              onClick={handleShareWhatsApp}
              className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-[#25D366] via-[#20ba59] to-[#128C7E] hover:brightness-110 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(37,211,102,0.4)] active:scale-95 transition-all cursor-pointer border-2 border-white/80"
            >
              <Share2 size={18} />
              <span>📲 SHARE ON WHATSAPP (+1 💎 FREE)</span>
            </button>

            {/* Secondary Actions: Copy Link & Start Room */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyLink}
                className="py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{isCopied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <button
                onClick={handleCreateRoom}
                className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                <span>ENTER ROOM</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: JOIN ROOM WITH 6-DIGIT CODE                            */}
        {/* ============================================================ */}
        {activeTab === 'join' && (
          <div className="space-y-3.5 pt-1">
            <div className="text-left space-y-1.5">
              <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                Enter 6-Digit Room Code:
              </label>
              <input
                type="text"
                value={inputJoinCode}
                onChange={(e) => setInputJoinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Ex: 847392"
                maxLength={6}
                className="w-full bg-slate-950 border-2 border-emerald-500/50 focus:border-emerald-400 rounded-2xl py-3 px-4 text-center text-2xl font-black text-white tracking-widest outline-none placeholder:text-slate-600 placeholder:text-base placeholder:tracking-normal"
              />
              <p className="text-[10px] text-slate-400">
                Ask your friend for their 6-digit room code to join instantly.
              </p>
            </div>

            <button
              onClick={handleJoinByCode}
              disabled={inputJoinCode.trim().length < 4}
              className={`w-full py-3 sm:py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer border-2 ${
                inputJoinCode.trim().length >= 4
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 border-white shadow-[0_4px_20px_rgba(16,185,129,0.5)]'
                  : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
              }`}
            >
              <span>JOIN PRIVATE ROOM 👥</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

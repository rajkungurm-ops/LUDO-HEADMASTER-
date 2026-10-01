import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  X,
  Search,
  Send,
  UserCheck,
  UserX,
  Sparkles,
  Swords,
  Radio,
  Clock,
  RotateCw,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import {
  RecentPlayer,
  getRecentPlayers,
  saveRecentPlayer,
  toggleMockOnlineStatus,
} from '../utils/recentPlayers';
import { soundEffects } from '../utils/audioSynthesizer';
import { listenToRecentOpponents, saveOpponentToFirestore } from '../lib/firebase';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvitePlayer: (player: RecentPlayer, playerCount: 2 | 3 | 4) => void;
  initialPlayerCount?: 2 | 3 | 4;
  myPlayerId?: string;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  onInvitePlayer,
  initialPlayerCount = 2,
  myPlayerId = '',
}) => {
  const [players, setPlayers] = useState<RecentPlayer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<2 | 3 | 4>(initialPlayerCount);
  const [newFriendName, setNewFriendName] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  useEffect(() => {
    setSelectedPlayerCount(initialPlayerCount);
  }, [initialPlayerCount, isOpen]);

  // Load recent players and set up real-time Firebase + 30-sec live presence toggle
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

    // Live presence toggle interval to keep statuses active
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

  if (!isOpen) return null;

  const onlineCount = players.filter((p) => p.isOnline).length;

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;
    soundEffects.playButtonClick();
    const clean = newFriendName.trim();
    const customId = 'custom_' + Date.now();
    saveRecentPlayer({
      id: customId,
      name: clean,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      isOnline: true,
    });
    if (myPlayerId) {
      saveOpponentToFirestore(myPlayerId, {
        id: customId,
        name: clean,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      });
    }
    setNewFriendName('');
    setShowAddInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-emerald-500/70 rounded-3xl p-4 sm:p-5 shadow-[0_0_60px_rgba(16,185,129,0.35)] flex flex-col max-h-[88vh] overflow-hidden text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
              <Users size={22} />
            </div>
            <div className="text-left">
              <h3 className="text-base font-black text-white leading-tight flex items-center gap-1.5">
                <span>Friends &amp; Recent Players</span>
              </h3>
              <p className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{onlineCount} Online Right Now</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Mode / Slot Selector: [2 Players (Red vs Yellow)] [3 Players] [4 Players] */}
        <div className="my-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider px-1">
            <span>Invite Match Mode:</span>
            <span className="text-emerald-400 font-mono text-[10px]">Direct In-Game (No Link)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([2, 3, 4] as (2 | 3 | 4)[]).map((count) => {
              const isSelected = selectedPlayerCount === count;
              return (
                <button
                  key={count}
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setSelectedPlayerCount(count);
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-black transition-all border flex flex-col items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 border-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-102'
                      : 'bg-slate-950/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <span>{count} Players</span>
                  <span className="text-[9px] font-bold opacity-80">
                    {count === 2 ? 'Red vs Yellow' : count === 3 ? '3-Player' : '4-Player'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Search & Add Bar */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1 flex items-center">
            <Search size={15} className="absolute left-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search recent player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/90 border border-slate-700 focus:border-emerald-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition-all font-semibold"
            />
          </div>

          <button
            onClick={() => setShowAddInput((prev) => !prev)}
            title="Add Friend by Name"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {/* Quick Add Form if opened */}
        {showAddInput && (
          <form onSubmit={handleAddFriend} className="flex gap-2 mb-3 animate-in fade-in">
            <input
              type="text"
              placeholder="Friend's Name..."
              value={newFriendName}
              onChange={(e) => setNewFriendName(e.target.value)}
              maxLength={16}
              className="flex-1 bg-slate-950 border border-emerald-400/60 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
            >
              Save
            </button>
          </form>
        )}

        {/* 3. Player List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 min-h-[220px]">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs space-y-2">
              <Users size={32} className="mx-auto text-slate-600" />
              <p>Koi player nahi mila.</p>
              <p className="text-[10px] text-slate-500">
                Match khelne ke baad opponents automatic yahan save ho jayenge.
              </p>
            </div>
          ) : (
            filteredPlayers.map((player) => {
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                    player.isOnline
                      ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-400/80 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-75'
                  }`}
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800">
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Realtime Status Dot: Green = Online, Grey = Offline */}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                          player.isOnline
                            ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                            : 'bg-slate-500'
                        }`}
                        title={player.isOnline ? 'Online' : 'Offline'}
                      />
                    </div>

                    <div className="text-left">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5 leading-tight">
                        <span>{player.name}</span>
                        {player.level && (
                          <span className="text-[9px] bg-slate-800 text-yellow-300 px-1 py-0.2 rounded font-mono">
                            Lv.{player.level}
                          </span>
                        )}
                      </p>

                      <div className="flex items-center gap-2 text-[10px] mt-0.5">
                        {player.isOnline ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Online
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">Offline</span>
                        )}
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">
                          {player.gamesPlayedWith} {player.gamesPlayedWith === 1 ? 'match' : 'matches'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: INVITE button (Active if Online, Disabled if Offline) */}
                  <div>
                    {player.isOnline ? (
                      <button
                        onClick={() => {
                          soundEffects.playButtonClick();
                          onInvitePlayer(player, selectedPlayerCount);
                        }}
                        className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95 transition-all cursor-pointer border border-white"
                      >
                        <Send size={13} className="rotate-45" />
                        <span>INVITE</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        title="Player is currently offline"
                        className="py-2 px-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-500 font-bold text-xs flex items-center gap-1 cursor-not-allowed opacity-60"
                      >
                        <span>Offline</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info note */}
        <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck size={12} /> Direct in-game invite
          </span>
          <span className="text-slate-500">Live Status updates every 30s</span>
        </div>
      </motion.div>
    </div>
  );
};

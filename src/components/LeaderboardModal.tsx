import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LeaderboardUser } from '../types/ludo';
import { Trophy, Crown, Flame, X, Medal, Search, TrendingUp, ShieldCheck } from 'lucide-react';
import { soundEffects } from '../utils/audioSynthesizer';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    name: string;
    avatar: string;
    coins: number;
    wins: number;
    totalGames: number;
    trophies: number;
  };
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [tab, setTab] = useState<'global' | 'weekly'>('global');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  // Rich mock global players list with realistic stats
  const mockGlobalLeaders: LeaderboardUser[] = [
    {
      id: 'g1',
      name: 'Aarav King 👑',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      level: 48,
      trophies: 4920,
      coins: 245000,
      wins: 382,
      totalGames: 450,
      winRate: 85,
    },
    {
      id: 'g2',
      name: 'Priya Sharma ✨',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      level: 42,
      trophies: 4680,
      coins: 198000,
      wins: 320,
      totalGames: 390,
      winRate: 82,
    },
    {
      id: 'g3',
      name: 'Rohit DiceMaster 🎲',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
      level: 39,
      trophies: 4310,
      coins: 165000,
      wins: 290,
      totalGames: 370,
      winRate: 78,
    },
    {
      id: 'g4',
      name: 'Player Pro ⚡',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      level: 35,
      trophies: 3890,
      coins: 120000,
      wins: 240,
      totalGames: 320,
      winRate: 75,
    },
    {
      id: 'g5',
      name: 'Sneha Ludo Queen 👑',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      level: 31,
      trophies: 3450,
      coins: 98000,
      wins: 195,
      totalGames: 270,
      winRate: 72,
    },
    {
      id: 'g6',
      name: 'Vikram Star 🔥',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      level: 28,
      trophies: 3100,
      coins: 84000,
      wins: 170,
      totalGames: 245,
      winRate: 69,
    },
  ];

  // Insert current user in list
  const userRate =
    currentUser.totalGames > 0
      ? Math.round((currentUser.wins / currentUser.totalGames) * 100)
      : 0;

  const userEntry: LeaderboardUser = {
    id: 'user_current',
    name: `${currentUser.name} (You)`,
    avatar: currentUser.avatar,
    level: 1 + (currentUser.wins || 0),
    trophies: currentUser.trophies || 1200 + currentUser.wins * 35,
    coins: currentUser.coins,
    wins: currentUser.wins,
    totalGames: currentUser.totalGames,
    winRate: userRate,
    isUser: true,
  };

  const allEntries = [...mockGlobalLeaders, userEntry].sort((a, b) => b.trophies - a.trophies);
  const filtered = allEntries.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-slate-900 border-2 border-yellow-500/80 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 p-4 flex items-center justify-between text-slate-950 font-black shadow-md">
          <div className="flex items-center gap-2.5">
            <Trophy size={26} className="fill-slate-950" />
            <h2 className="text-xl tracking-wider uppercase">Ludo King Leaderboard</h2>
          </div>
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onClose();
            }}
            className="p-1 rounded-full bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Tab Switcher & Search */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('global')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'global'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Flame size={15} /> Global Champions
            </button>
            <button
              onClick={() => setTab('weekly')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                tab === 'weekly'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp size={15} /> Weekly League
            </button>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search player name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Leaders List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2 max-h-[360px] bg-slate-950/40">
          {filtered.map((user, idx) => {
            const rank = idx + 1;
            const isTop3 = rank <= 3;

            return (
              <div
                key={user.id}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                  user.isUser
                    ? 'bg-amber-500/20 border-yellow-400 ring-1 ring-yellow-400'
                    : isTop3
                    ? 'bg-slate-800/80 border-slate-700'
                    : 'bg-slate-900/60 border-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank Badge */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                      rank === 1
                        ? 'bg-gradient-to-b from-yellow-300 to-amber-500 text-slate-950'
                        : rank === 2
                        ? 'bg-gradient-to-b from-slate-200 to-slate-400 text-slate-950'
                        : rank === 3
                        ? 'bg-gradient-to-b from-amber-700 to-yellow-900 text-amber-200'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/30 bg-slate-800 shrink-0 flex items-center justify-center text-lg">
                    {user.avatar ? <img src={user.avatar} alt="" /> : '👤'}
                  </div>

                  <div className="text-left">
                    <p className="text-xs font-bold text-white flex items-center gap-1 truncate max-w-[130px]">
                      {user.name}
                      {user.isUser && (
                        <span className="text-[9px] bg-yellow-400 text-slate-950 px-1 rounded font-black">
                          YOU
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span className="text-amber-300 font-semibold">Lvl {user.level}</span>
                      <span>•</span>
                      <span className="text-emerald-400">{user.winRate}% Win</span>
                    </p>
                  </div>
                </div>

                {/* Score Stats */}
                <div className="text-right">
                  <div className="text-xs font-black text-yellow-400 flex items-center justify-end gap-1">
                    <Trophy size={13} />
                    <span>{user.trophies.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                    <span>🪙 {user.coins.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* User Card Fixed Footer */}
        <div className="p-3 bg-gradient-to-r from-amber-950/80 to-slate-950 border-t border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-yellow-400 bg-slate-800 flex items-center justify-center">
              {currentUser.avatar ? <img src={currentUser.avatar} alt="" /> : '👤'}
            </div>
            <div>
              <p className="text-xs font-bold text-white">{currentUser.name}</p>
              <p className="text-[10px] text-yellow-300">
                Wins: {currentUser.wins} / {currentUser.totalGames} ({userRate}%)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-400 text-slate-950 px-3 py-1.5 rounded-xl font-black text-xs shadow-md">
            <span>🪙</span>
            <span>{currentUser.coins.toLocaleString()}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

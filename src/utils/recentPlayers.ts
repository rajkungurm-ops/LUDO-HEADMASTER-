import { saveOpponentToFirestore } from '../lib/firebase';

export interface RecentPlayer {
  id: string;
  name: string;
  avatar: string;
  level?: number;
  lastPlayed: number;
  gamesPlayedWith: number;
  isOnline: boolean;
}

const STORAGE_KEY = 'ludo_recent_players';

const SEED_PLAYERS: RecentPlayer[] = [
  {
    id: 'rec_amit_1',
    name: 'Amit Sharma 🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    level: 42,
    lastPlayed: Date.now() - 1000 * 60 * 12, // 12 mins ago
    gamesPlayedWith: 4,
    isOnline: true,
  },
  {
    id: 'rec_rohit_2',
    name: 'Rohit DiceKing 🎲',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    level: 38,
    lastPlayed: Date.now() - 1000 * 60 * 45, // 45 mins ago
    gamesPlayedWith: 2,
    isOnline: true,
  },
  {
    id: 'rec_priya_3',
    name: 'Priya Singh ✨',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    level: 29,
    lastPlayed: Date.now() - 1000 * 60 * 90, // 1.5 hours ago
    gamesPlayedWith: 3,
    isOnline: true,
  },
  {
    id: 'rec_neha_4',
    name: 'Neha Verma 👑',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    level: 33,
    lastPlayed: Date.now() - 1000 * 60 * 180, // 3 hours ago
    gamesPlayedWith: 1,
    isOnline: false,
  },
  {
    id: 'rec_karan_5',
    name: 'Karan Veer 🔥',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    level: 25,
    lastPlayed: Date.now() - 1000 * 60 * 360, // 6 hours ago
    gamesPlayedWith: 1,
    isOnline: false,
  },
];

export function getRecentPlayers(): RecentPlayer[] {
  if (typeof window === 'undefined') return SEED_PLAYERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PLAYERS));
      return SEED_PLAYERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PLAYERS));
      return SEED_PLAYERS;
    }
    return parsed;
  } catch {
    return SEED_PLAYERS;
  }
}

export function saveRecentPlayer(player: Partial<RecentPlayer> & { id: string; name: string }) {
  if (typeof window === 'undefined') return;
  try {
    const current = getRecentPlayers();
    const existingIndex = current.findIndex((p) => p.id === player.id || p.name.trim().toLowerCase() === player.name.trim().toLowerCase());

    const avatar =
      player.avatar ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';

    if (existingIndex >= 0) {
      const existing = current[existingIndex];
      current[existingIndex] = {
        ...existing,
        name: player.name,
        avatar,
        lastPlayed: Date.now(),
        gamesPlayedWith: (existing.gamesPlayedWith || 1) + 1,
        isOnline: player.isOnline !== undefined ? player.isOnline : existing.isOnline,
      };
    } else {
      current.unshift({
        id: player.id || 'rec_' + Math.random().toString(36).slice(2, 9),
        name: player.name,
        avatar,
        level: Math.floor(Math.random() * 30) + 15,
        lastPlayed: Date.now(),
        gamesPlayedWith: 1,
        isOnline: player.isOnline !== undefined ? player.isOnline : true,
      });
    }

    // Keep at most 20 recent players
    const trimmed = current.slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent('recent-players-updated', { detail: trimmed }));
  } catch (err) {
    console.error('Failed to save recent player:', err);
  }
}

export function saveRecentPlayersFromGame(
  players: Array<{ id: string; name: string; avatar?: string; isBot?: boolean }>,
  currentUserName: string,
  myPlayerId?: string
) {
  players.forEach((p) => {
    if (p.isBot) return;
    if (p.name.trim().toLowerCase() === currentUserName.trim().toLowerCase()) return;
    saveRecentPlayer({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isOnline: true,
    });
    if (myPlayerId) {
      saveOpponentToFirestore(myPlayerId, p);
    }
  });
}

/**
 * Mock Online/Offline Toggle every 30 seconds for live demo as requested
 * (Later seamlessly replaceable with Firebase presence)
 */
export function toggleMockOnlineStatus(): RecentPlayer[] {
  if (typeof window === 'undefined') return SEED_PLAYERS;
  const list = getRecentPlayers();
  if (list.length === 0) return list;

  // Pick 1-2 random players to flip online/offline
  const countToFlip = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < countToFlip; i++) {
    const randIdx = Math.floor(Math.random() * list.length);
    list[randIdx].isOnline = !list[randIdx].isOnline;
  }

  // Ensure at least 1 player is always online for demo usability
  if (!list.some((p) => p.isOnline)) {
    list[0].isOnline = true;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('recent-players-updated', { detail: list }));
  } catch {}

  return list;
}

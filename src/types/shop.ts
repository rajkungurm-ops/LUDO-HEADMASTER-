export type DiceSkinId =
  | 'normal'
  | 'fire'
  | 'golden_fire'
  | 'diamond_inferno'
  | 'neon_matrix'
  | 'royal_amethyst'
  | 'cosmic_galaxy'
  | 'dragon_blood'
  | 'emerald_king'
  | 'rainbow_prism'
  | 'glacier_eternal';

export type TokenSkinId =
  | 'normal'
  | 'fire'
  | 'ice'
  | 'electric'
  | 'golden_shield'
  | 'cyber_core'
  | 'shadow_void'
  | 'emerald_lotus'
  | 'ruby_knight'
  | 'celestial_star'
  | 'glacier_eternal';

export type BoardSkinId =
  | 'classic'
  | 'emerald_palace'
  | 'lava_citadel'
  | 'cyber_neon'
  | 'glacier_eternal';

export interface ShopItem {
  id: string;
  name: string;
  category: 'dice' | 'token' | 'board';
  price: number;
  currency?: 'coins' | 'diamonds';
  vipLevel: number;
  description: string;
  flameColor?: string;
  previewBg: string;
  badge?: string;
  icon?: string;
  tag?: string;
  lockText?: string;
  tagline?: string;
}

export const TOKEN_VIP_LEVELS: Record<string, number> = {
  normal: 1,
  fire: 2,
  ice: 3,
  electric: 4,
  golden_shield: 5,
  cyber_core: 6,
  shadow_void: 7,
  emerald_lotus: 8,
  ruby_knight: 9,
  celestial_star: 10,
  glacier_eternal: 10,
};

export const SKIN_VIP_LEVELS: Record<string, number> = TOKEN_VIP_LEVELS;

/**
 * VIP Rank is determined by the equipped Token skin or Glacier Eternal Board (VIP 1 to VIP 10).
 */
export function getPlayerVipLevel(_equippedDice?: string, equippedToken?: string, equippedBoard?: string): number {
  if (equippedBoard === 'glacier_eternal' || equippedToken === 'glacier_eternal') {
    return 10;
  }
  const tokenKey = equippedToken || 'normal';
  return Math.min(10, Math.max(1, TOKEN_VIP_LEVELS[tokenKey] || 1));
}

/**
 * Generate a permanent device-bound Player ID (e.g., LUDO-847392-X9)
 * Uses hardware fingerprint so even after uninstall/reinstall on the same phone,
 * the exact same ID is recovered and restores Name, Avatar, Coins & Diamonds from Firebase.
 */
export function getOrCreatePermanentPlayerId(): string {
  if (typeof window === 'undefined') return 'LUDO-847392-X9';
  try {
    const existingPermanent = localStorage.getItem('ludo_permanent_id');
    if (existingPermanent && existingPermanent.startsWith('LUDO-')) {
      localStorage.setItem('ludo_online_player_id', existingPermanent);
      return existingPermanent;
    }

    // Build deterministic hardware fingerprint from phone screen, GPU, timezone, cores, platform
    let gpuRenderer = '';
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') ||
        (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          gpuRenderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
        }
      }
    } catch {}

    const rawSignals = [
      window.screen?.width || 0,
      window.screen?.height || 0,
      window.screen?.colorDepth || 24,
      Math.round((window.devicePixelRatio || 1) * 100),
      navigator.hardwareConcurrency || 4,
      (navigator as any).deviceMemory || 4,
      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      navigator.language || 'en',
      navigator.platform || 'mobile',
      gpuRenderer,
    ].join('|');

    let hash1 = 5381;
    let hash2 = 52711;
    for (let i = 0; i < rawSignals.length; i++) {
      const ch = rawSignals.charCodeAt(i);
      hash1 = (hash1 * 33) ^ ch;
      hash2 = (hash2 * 31) ^ ch;
    }

    const sixDigits = String((Math.abs(hash1) % 900000) + 100000);
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const digits = '23456789';
    const char1 = letters[Math.abs(hash2) % letters.length];
    const char2 = digits[Math.abs(hash1 ^ hash2) % digits.length];

    const permanentId = `LUDO-${sixDigits}-${char1}${char2}`;
    localStorage.setItem('ludo_permanent_id', permanentId);
    localStorage.setItem('ludo_online_player_id', permanentId);
    return permanentId;
  } catch {
    return 'LUDO-847392-X9';
  }
}

export const BOARD_SKINS: ShopItem[] = [
  {
    id: 'glacier_eternal',
    name: '❄️ GLACIER ETERNAL - DREAM OF KINGS 👑',
    category: 'board',
    price: 100,
    currency: 'diamonds',
    vipLevel: 10,
    description:
      'Transparent glacier ice crystal board • Blue under-glow • Diamond Heera Tokens • Ice Cube Dice • Aurora & Falling Snow • 1s Freeze Kill Effect',
    flameColor: '#38bdf8',
    previewBg: 'from-cyan-400 via-sky-600 to-blue-950',
    badge: '100 💎 KING DREAM',
    icon: '❄️',
    tag: '💎 ULTIMATE DREAM - 100 DIAMONDS ONLY',
    lockText: '🔒 YE SABKA SAPNA HAI! 100💎 CHAHIYE - SIRF KING LE SAKTA HAI!',
    tagline: 'Har koi dekhega, koi koi hi paayega! Kya aap King ho?',
  },
  {
    id: 'classic',
    name: 'Classic Championship Board',
    category: 'board',
    price: 0,
    currency: 'diamonds',
    vipLevel: 1,
    description: 'Standard official tournament Ludo board (Default)',
    previewBg: 'from-slate-700 to-slate-900',
    badge: 'DEFAULT',
    icon: '🎲',
  },
  {
    id: 'emerald_palace',
    name: 'Royal Emerald Palace Board',
    category: 'board',
    price: 15,
    currency: 'diamonds',
    vipLevel: 4,
    description: 'Imperial jade & gold palace board with glowing emerald borders',
    flameColor: '#10b981',
    previewBg: 'from-emerald-500 via-teal-700 to-slate-950',
    badge: '15 💎 EMERALD',
    icon: '❇️',
  },
  {
    id: 'lava_citadel',
    name: 'Inferno Lava Citadel Board',
    category: 'board',
    price: 35,
    currency: 'diamonds',
    vipLevel: 7,
    description: 'Volcanic obsidian board with molten magma veins & fiery glow',
    flameColor: '#f97316',
    previewBg: 'from-orange-600 via-red-700 to-zinc-950',
    badge: '35 💎 WARRIOR',
    icon: '🌋',
  },
  {
    id: 'cyber_neon',
    name: 'Cyber Neon Metropolis Board',
    category: 'board',
    price: 60,
    currency: 'diamonds',
    vipLevel: 9,
    description: 'Futuristic holographic neon laser grid board with pulse glow',
    flameColor: '#a855f7',
    previewBg: 'from-fuchsia-600 via-purple-700 to-indigo-950',
    badge: '60 💎 PRO MASTER',
    icon: '⚡',
  },
];

export const DICE_SKINS: ShopItem[] = [
  {
    id: 'normal',
    name: 'Classic Dice',
    category: 'dice',
    price: 0,
    currency: 'diamonds',
    vipLevel: 1,
    description: 'Standard classic tournament dice (Default)',
    previewBg: 'from-slate-700 to-slate-900',
    badge: 'CLASSIC (FREE)',
    icon: '🎲',
  },
  {
    id: 'fire',
    name: 'Fire Blaze Dice',
    category: 'dice',
    price: 5,
    currency: 'diamonds',
    vipLevel: 2,
    description: 'Fiery rolling dice with 1s burst roll flare',
    flameColor: '#f97316',
    previewBg: 'from-orange-600 via-red-600 to-amber-700',
    badge: '5 💎 FLAME 🔥',
    icon: '🔥',
  },
  {
    id: 'golden_fire',
    name: 'Golden Royale Dice',
    category: 'dice',
    price: 10,
    currency: 'diamonds',
    vipLevel: 3,
    description: '24K pure gold dice with royal sheen flare',
    flameColor: '#eab308',
    previewBg: 'from-amber-400 via-yellow-500 to-amber-700',
    badge: '10 💎 ROYALE 👑',
    icon: '👑',
  },
  {
    id: 'diamond_inferno',
    name: 'Diamond Crystal Dice',
    category: 'dice',
    price: 15,
    currency: 'diamonds',
    vipLevel: 4,
    description: 'Ice-diamond prismatic crystal with cyan glow roll flare',
    flameColor: '#06b6d4',
    previewBg: 'from-cyan-500 via-blue-600 to-indigo-900',
    badge: '15 💎 CRYSTAL',
    icon: '💎',
  },
  {
    id: 'neon_matrix',
    name: 'Cyber Matrix Dice',
    category: 'dice',
    price: 20,
    currency: 'diamonds',
    vipLevel: 5,
    description: 'Futuristic glowing neon green high-tech cyber matrix dice',
    flameColor: '#22c55e',
    previewBg: 'from-emerald-600 via-green-600 to-slate-900',
    badge: '20 💎 MATRIX ⚡',
    icon: '⚡',
  },
  {
    id: 'royal_amethyst',
    name: 'Purple Amethyst Dice',
    category: 'dice',
    price: 30,
    currency: 'diamonds',
    vipLevel: 6,
    description: 'Rare polished mystical amethyst crystal dice',
    flameColor: '#a855f7',
    previewBg: 'from-purple-600 via-violet-700 to-slate-900',
    badge: '30 💎 AMETHYST 🔮',
    icon: '🔮',
  },
  {
    id: 'cosmic_galaxy',
    name: 'Cosmic Galaxy Dice',
    category: 'dice',
    price: 40,
    currency: 'diamonds',
    vipLevel: 7,
    description: 'Deep nebula stardust dice with pulsing galactic roll burst',
    flameColor: '#ec4899',
    previewBg: 'from-pink-600 via-purple-700 to-indigo-950',
    badge: '40 💎 GALAXY 🌌',
    icon: '🌌',
  },
  {
    id: 'dragon_blood',
    name: 'Magma Dragon Dice',
    category: 'dice',
    price: 55,
    currency: 'diamonds',
    vipLevel: 8,
    description: 'Volcanic dragon heart magma dice with blazing lava burst',
    flameColor: '#dc2626',
    previewBg: 'from-red-700 via-rose-800 to-zinc-950',
    badge: '55 💎 MAGMA 🐉',
    icon: '🐉',
  },
  {
    id: 'emerald_king',
    name: 'Emerald Imperial Dice',
    category: 'dice',
    price: 70,
    currency: 'diamonds',
    vipLevel: 9,
    description: 'Royal emerald jewel dice with sparkling jade shine',
    flameColor: '#10b981',
    previewBg: 'from-emerald-500 via-teal-700 to-slate-900',
    badge: '70 💎 EMERALD ❇️',
    icon: '❇️',
  },
  {
    id: 'rainbow_prism',
    name: 'Rainbow Prism Dice',
    category: 'dice',
    price: 85,
    currency: 'diamonds',
    vipLevel: 10,
    description: 'Legendary iridescent multi-spectrum rainbow VIP dice',
    flameColor: '#f59e0b',
    previewBg: 'from-red-500 via-yellow-500 to-indigo-600',
    badge: '85 💎 PRISM 🌈',
    icon: '🌈',
  },
  {
    id: 'glacier_eternal',
    name: '❄️ Glacier Ice Cube Dice',
    category: 'dice',
    price: 100,
    currency: 'diamonds',
    vipLevel: 10,
    description: 'Translucent frozen ice cube dice • Roll pe baraf giregi ❄️ (Included with Glacier Eternal Board)',
    flameColor: '#38bdf8',
    previewBg: 'from-cyan-300 via-sky-500 to-blue-900',
    badge: '100 💎 ICE CUBE 🧊',
    icon: '🧊',
  },
];

export const TOKEN_SKINS: ShopItem[] = [
  {
    id: 'normal',
    name: 'Classic Token',
    category: 'token',
    price: 0,
    currency: 'diamonds',
    vipLevel: 1,
    description: 'Standard championship tournament token pin (Default)',
    previewBg: 'from-slate-700 to-slate-900',
    badge: 'VIP 1 (FREE)',
    icon: '📍',
  },
  {
    id: 'fire',
    name: 'Flame King Crown',
    category: 'token',
    price: 5,
    currency: 'diamonds',
    vipLevel: 2,
    description: 'VIP 3D Fiery Crown model • Drops burning flame trail when running',
    flameColor: '#f97316',
    previewBg: 'from-orange-600 via-red-600 to-amber-600',
    badge: '5 💎 VIP 2 🔥',
    icon: '🔥',
  },
  {
    id: 'ice',
    name: 'Frost Ice Monarch',
    category: 'token',
    price: 10,
    currency: 'diamonds',
    vipLevel: 3,
    description: 'VIP 3D Glacier Crystal model • Drops freezing frost mist trail',
    flameColor: '#38bdf8',
    previewBg: 'from-cyan-500 via-sky-600 to-blue-800',
    badge: '10 💎 VIP 3 ❄️',
    icon: '❄️',
  },
  {
    id: 'electric',
    name: 'Storm Lightning Totem',
    category: 'token',
    price: 15,
    currency: 'diamonds',
    vipLevel: 4,
    description: 'VIP 3D Lightning Totem model • Drops crackling electrical zaps',
    flameColor: '#eab308',
    previewBg: 'from-yellow-400 via-amber-500 to-purple-800',
    badge: '15 💎 VIP 4 ⚡',
    icon: '⚡',
  },
  {
    id: 'golden_shield',
    name: 'Royal Gold Aegis',
    category: 'token',
    price: 20,
    currency: 'diamonds',
    vipLevel: 5,
    description: 'VIP 3D Medieval Gold Heraldic Shield • Drops golden sparkle trail',
    flameColor: '#facc15',
    previewBg: 'from-amber-400 via-yellow-500 to-amber-700',
    badge: '20 💎 VIP 5 🛡️',
    icon: '🛡️',
  },
  {
    id: 'cyber_core',
    name: 'Neon Cyber Mech',
    category: 'token',
    price: 30,
    currency: 'diamonds',
    vipLevel: 6,
    description: 'VIP 3D Sci-Fi Cyber Node model • Drops neon matrix trail',
    flameColor: '#22c55e',
    previewBg: 'from-emerald-600 via-green-600 to-slate-900',
    badge: '30 💎 VIP 6 🤖',
    icon: '🤖',
  },
  {
    id: 'shadow_void',
    name: 'Obsidian Phantom',
    category: 'token',
    price: 40,
    currency: 'diamonds',
    vipLevel: 7,
    description: 'VIP 3D Dark Void Crystal • Drops dark mystical smoke trail',
    flameColor: '#9333ea',
    previewBg: 'from-purple-900 via-indigo-950 to-black',
    badge: '40 💎 VIP 7 🔮',
    icon: '🔮',
  },
  {
    id: 'emerald_lotus',
    name: 'Imperial Jade Lotus',
    category: 'token',
    price: 55,
    currency: 'diamonds',
    vipLevel: 8,
    description: 'VIP 3D Multi-Petal Jade Lotus Gem • Drops emerald petal trail',
    flameColor: '#10b981',
    previewBg: 'from-emerald-500 via-teal-700 to-slate-900',
    badge: '55 💎 VIP 8 🌸',
    icon: '🌸',
  },
  {
    id: 'ruby_knight',
    name: 'Crimson Knight Helmet',
    category: 'token',
    price: 70,
    currency: 'diamonds',
    vipLevel: 9,
    description: 'VIP 3D Crusader Knight Crest • Drops ruby ember flare trail',
    flameColor: '#ef4444',
    previewBg: 'from-rose-600 via-red-700 to-slate-900',
    badge: '70 💎 VIP 9 ⚔️',
    icon: '⚔️',
  },
  {
    id: 'celestial_star',
    name: 'Celestial Galaxy Star',
    category: 'token',
    price: 85,
    currency: 'diamonds',
    vipLevel: 10,
    description: 'VIP 3D 8-Point Diamond Star • Drops stardust galaxy trail',
    flameColor: '#f43f5e',
    previewBg: 'from-pink-500 via-purple-600 to-indigo-900',
    badge: '85 💎 VIP 10 ⭐',
    icon: '⭐',
  },
  {
    id: 'glacier_eternal',
    name: '💎 Glacier Heera Diamond Goti',
    category: 'token',
    price: 100,
    currency: 'diamonds',
    vipLevel: 10,
    description: 'Sparkling Blue, Green, Red, Yellow Heera Goti • Peeche baraf ka rasta banega ❄️ (Included with Glacier Board)',
    flameColor: '#38bdf8',
    previewBg: 'from-cyan-400 via-blue-600 to-indigo-950',
    badge: '100 💎 HEERA GOTI',
    icon: '💎',
  },
];

// First time install starts at 0 Coins & 0 Diamonds
export const DEFAULT_COINS = 0;
export const DEFAULT_DIAMONDS = 0;
export const DAILY_EXCHANGE_LIMIT = 5;

export interface PlayerInventory {
  coins: number;
  diamonds: number;
  ownedDice: DiceSkinId[];
  ownedTokens: TokenSkinId[];
  ownedBoards: BoardSkinId[];
  equippedDice: DiceSkinId;
  equippedToken: TokenSkinId;
  equippedBoard: BoardSkinId;
  lastDailyClaimTime?: number;
  dailyExchangeCount?: number;
  lastExchangeDate?: string;
}

export const ALL_DICE_IDS: DiceSkinId[] = [
  'normal',
  'fire',
  'golden_fire',
  'diamond_inferno',
  'neon_matrix',
  'royal_amethyst',
  'cosmic_galaxy',
  'dragon_blood',
  'emerald_king',
  'rainbow_prism',
  'glacier_eternal',
];

export const ALL_TOKEN_IDS: TokenSkinId[] = [
  'normal',
  'fire',
  'ice',
  'electric',
  'golden_shield',
  'cyber_core',
  'shadow_void',
  'emerald_lotus',
  'ruby_knight',
  'celestial_star',
  'glacier_eternal',
];

export const ALL_BOARD_IDS: BoardSkinId[] = [
  'classic',
  'emerald_palace',
  'lava_citadel',
  'cyber_neon',
  'glacier_eternal',
];

export function getTodayExchangeDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getLocalInventory(userId?: string): PlayerInventory {
  try {
    const uid = userId || getOrCreatePermanentPlayerId();

    // Reset any old test-mode 50000 coins / 100 diamonds once so fresh/existing installs start cleanly at 0
    const zeroInitKey = 'ludo_zero_start_v3_' + uid;
    if (!localStorage.getItem(zeroInitKey)) {
      localStorage.setItem(zeroInitKey, '1');
      localStorage.setItem('coins_' + uid, '0');
      localStorage.setItem('ludo_coins', '0');
      localStorage.setItem('userCoins', '0');
      localStorage.setItem('diamonds_' + uid, '0');
      localStorage.setItem('userDiamonds', '0');
      localStorage.setItem('owned_' + uid, JSON.stringify(['normal', 'classic']));
      localStorage.setItem('owned_boards_' + uid, JSON.stringify(['classic']));
      localStorage.setItem('equipped_dice_' + uid, 'normal');
      localStorage.setItem('equipped_token_' + uid, 'normal');
      localStorage.setItem('equipped_board_' + uid, 'classic');
    }

    let coins = DEFAULT_COINS;
    const coinsKey = 'coins_' + uid;
    const storedCoins = localStorage.getItem(coinsKey) ?? localStorage.getItem('userCoins');
    if (storedCoins !== null) {
      const parsed = parseInt(storedCoins, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        coins = parsed;
      }
    } else {
      localStorage.setItem(coinsKey, '0');
      localStorage.setItem('ludo_coins', '0');
      localStorage.setItem('userCoins', '0');
    }

    let diamonds = DEFAULT_DIAMONDS;
    const diamondsKey = 'diamonds_' + uid;
    const storedDiamonds = localStorage.getItem(diamondsKey) ?? localStorage.getItem('userDiamonds');
    if (storedDiamonds !== null) {
      const parsedD = parseInt(storedDiamonds, 10);
      if (!isNaN(parsedD) && parsedD >= 0) {
        diamonds = parsedD;
      }
    } else {
      localStorage.setItem(diamondsKey, '0');
      localStorage.setItem('userDiamonds', '0');
    }

    const ownedKey = 'owned_' + uid;
    const storedOwned = localStorage.getItem(ownedKey);
    let ownedDice: DiceSkinId[] = ['normal'];
    let ownedTokens: TokenSkinId[] = ['normal'];
    let ownedBoards: BoardSkinId[] = ['classic'];
    if (storedOwned) {
      try {
        const parsed = JSON.parse(storedOwned);
        if (Array.isArray(parsed)) {
          ownedDice = Array.from(new Set(['normal', ...(parsed.filter((id) => ALL_DICE_IDS.includes(id)) as DiceSkinId[])]));
          ownedTokens = Array.from(new Set(['normal', ...(parsed.filter((id) => ALL_TOKEN_IDS.includes(id)) as TokenSkinId[])]));
          ownedBoards = Array.from(new Set(['classic', ...(parsed.filter((id) => ALL_BOARD_IDS.includes(id)) as BoardSkinId[])]));
        }
      } catch {}
    } else {
      localStorage.setItem(ownedKey, JSON.stringify(['normal', 'classic']));
    }

    const ownedBoardsKey = 'owned_boards_' + uid;
    const storedOwnedBoards = localStorage.getItem(ownedBoardsKey);
    if (storedOwnedBoards) {
      try {
        const parsedB = JSON.parse(storedOwnedBoards);
        if (Array.isArray(parsedB)) {
          ownedBoards = Array.from(new Set(['classic', ...ownedBoards, ...(parsedB.filter((id) => ALL_BOARD_IDS.includes(id)) as BoardSkinId[])]));
        }
      } catch {}
    }

    const equippedDiceRaw =
      (localStorage.getItem('equipped_dice_' + uid) as DiceSkinId) ||
      (localStorage.getItem('ludo_equipped_dice') as DiceSkinId) ||
      'normal';
    const equippedTokenRaw =
      (localStorage.getItem('equipped_token_' + uid) as TokenSkinId) ||
      (localStorage.getItem('ludo_equipped_token') as TokenSkinId) ||
      'normal';
    const equippedBoardRaw =
      (localStorage.getItem('equipped_board_' + uid) as BoardSkinId) ||
      (localStorage.getItem('ludo_equipped_board') as BoardSkinId) ||
      'classic';

    const equippedDice = ALL_DICE_IDS.includes(equippedDiceRaw) && ownedDice.includes(equippedDiceRaw) ? equippedDiceRaw : 'normal';
    const equippedToken = ALL_TOKEN_IDS.includes(equippedTokenRaw) && ownedTokens.includes(equippedTokenRaw) ? equippedTokenRaw : 'normal';
    const equippedBoard = ALL_BOARD_IDS.includes(equippedBoardRaw) && ownedBoards.includes(equippedBoardRaw) ? equippedBoardRaw : 'classic';

    const lastClaimRaw = localStorage.getItem('last_daily_claim_' + uid);
    const lastDailyClaimTime = lastClaimRaw ? parseInt(lastClaimRaw, 10) : 0;

    const todayStr = getTodayExchangeDate();
    const lastExchangeDate = localStorage.getItem('last_exchange_date_' + uid) || '';
    let dailyExchangeCount = 0;
    if (lastExchangeDate === todayStr) {
      const cntRaw = localStorage.getItem('daily_exchange_count_' + uid);
      dailyExchangeCount = cntRaw ? parseInt(cntRaw, 10) || 0 : 0;
    }

    return {
      coins,
      diamonds,
      ownedDice,
      ownedTokens,
      ownedBoards,
      equippedDice,
      equippedToken,
      equippedBoard,
      lastDailyClaimTime,
      dailyExchangeCount,
      lastExchangeDate: todayStr,
    };
  } catch {
    return {
      coins: DEFAULT_COINS,
      diamonds: DEFAULT_DIAMONDS,
      ownedDice: ['normal'],
      ownedTokens: ['normal'],
      ownedBoards: ['classic'],
      equippedDice: 'normal',
      equippedToken: 'normal',
      equippedBoard: 'classic',
      lastDailyClaimTime: 0,
      dailyExchangeCount: 0,
      lastExchangeDate: getTodayExchangeDate(),
    };
  }
}

export function saveLocalInventory(inv: PlayerInventory, userId?: string) {
  try {
    const uid = userId || getOrCreatePermanentPlayerId();
    localStorage.setItem('ludo_zero_start_v3_' + uid, '1');
    const ownedKey = 'owned_' + uid;
    const allOwnedSkins = Array.from(new Set([...inv.ownedDice, ...inv.ownedTokens, ...(inv.ownedBoards || ['classic'])]));
    localStorage.setItem(ownedKey, JSON.stringify(allOwnedSkins));
    localStorage.setItem('owned_boards_' + uid, JSON.stringify(inv.ownedBoards || ['classic']));

    localStorage.setItem('coins_' + uid, inv.coins.toString());
    localStorage.setItem('ludo_coins', inv.coins.toString());
    localStorage.setItem('userCoins', inv.coins.toString());

    const dVal = typeof inv.diamonds === 'number' ? inv.diamonds : DEFAULT_DIAMONDS;
    localStorage.setItem('diamonds_' + uid, dVal.toString());
    localStorage.setItem('userDiamonds', dVal.toString());

    localStorage.setItem('equipped_dice_' + uid, inv.equippedDice);
    localStorage.setItem('equipped_token_' + uid, inv.equippedToken);
    localStorage.setItem('equipped_board_' + uid, inv.equippedBoard || 'classic');
    localStorage.setItem('ludo_equipped_dice', inv.equippedDice);
    localStorage.setItem('ludo_equipped_token', inv.equippedToken);
    localStorage.setItem('ludo_equipped_board', inv.equippedBoard || 'classic');
    localStorage.setItem('local_inventory', JSON.stringify(inv));

    if (inv.lastDailyClaimTime) {
      localStorage.setItem('last_daily_claim_' + uid, inv.lastDailyClaimTime.toString());
    }
    if (typeof inv.dailyExchangeCount === 'number') {
      localStorage.setItem('daily_exchange_count_' + uid, inv.dailyExchangeCount.toString());
    }
    if (inv.lastExchangeDate) {
      localStorage.setItem('last_exchange_date_' + uid, inv.lastExchangeDate);
    }
  } catch {}
}

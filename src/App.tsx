/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Player,
  PlayerColor,
  GameMode,
  MatchRule,
  GameState,
  ChatMessage,
} from './types/ludo';
import {
  getStepSequence,
  getValidMoves,
  checkTokenCapture,
  createPlayerTokens,
  checkPlayerWin,
  calculateSmartLudoDiceRoll,
  initialDiceTracker,
  PlayerDiceTracker,
  isStarSpace,
  isSafeStep,
  getTokenCoordinate,
} from './utils/ludoEngine';
import { soundEffects } from './utils/audioSynthesizer';
import { LudoBoard } from './components/LudoBoard';
import { LudoGameBackground } from './components/LudoGameBackground';
import { PlayerDicePod } from './components/PlayerDicePod';
import { GameLobby, AVATAR_OPTIONS } from './components/GameLobby';
import { ChatModal } from './components/ChatModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { RuleGuideModal } from './components/RuleGuideModal';
import { WinnerCelebrationModal, RematchState } from './components/WinnerCelebrationModal';
import { OnlineMatchModal } from './components/OnlineMatchModal';
import { OpponentLeftModal } from './components/OpponentLeftModal';
import { FriendsModal } from './components/FriendsModal';
import { InviteWaitingModal } from './components/InviteWaitingModal';
import { UpgradeShopModal } from './components/UpgradeShopModal';
import {
  getLocalInventory,
  saveLocalInventory,
  PlayerInventory,
  DEFAULT_COINS,
  getPlayerVipLevel,
  getOrCreatePermanentPlayerId,
} from './types/shop';
import { RecentPlayer, saveRecentPlayersFromGame } from './utils/recentPlayers';
import {
  updatePlayerPresence,
  listenForIncomingInvites,
  respondToMatchInvite,
  loadInventoryFromFirebase,
  saveInventoryToFirebase,
  processReferralInstall,
  listenToMyReferralRewards,
  RealtimeInvite,
} from './lib/firebase';
import { onlineMatchManager, MatchFoundPayload, OnlineMatchPlayer } from './utils/onlineMatchmaking';
import { chooseBestBotMove } from './utils/ludoBotAi';
import {
  MessageSquare,
  Volume2,
  VolumeX,
  ArrowLeft,
  Copy,
  Check,
  Zap,
  Sparkles,
  RotateCcw,
  Maximize,
  Minimize,
  MoreVertical,
  X,
  LogOut,
  Smartphone,
  ExternalLink,
  Share2,
  Send,
  RefreshCw,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Music,
  Disc,
} from 'lucide-react';

export default function App() {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fullscreen State & Mobile Handlers
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return Boolean(typeof document !== 'undefined' && document.fullscreenElement);
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const requestAppFullscreen = useCallback(() => {
    try {
      const elem = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
        mozRequestFullScreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
      };
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
      }
    } catch {
      // Safe fallback
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        requestAppFullscreen();
      } else {
        const doc = document as Document & {
          webkitExitFullscreen?: () => Promise<void>;
          mozCancelFullScreen?: () => Promise<void>;
          msExitFullscreen?: () => Promise<void>;
        };
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {});
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        }
      }
    } catch {
      // Safe fallback
    }
  }, [requestAppFullscreen]);

  // User Profile State (Persisted with Permanent Device ID)
  const [userName, setUserName] = useState<string>(() => {
    const saved = localStorage.getItem('player_name') || localStorage.getItem('ludo_username');
    if (!saved || saved.toLowerCase().includes('raj')) {
      localStorage.setItem('player_name', 'Player 1');
      localStorage.setItem('ludo_username', 'Player 1');
      return 'Player 1';
    }
    return saved;
  });
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    return (
      localStorage.getItem('player_avatar') ||
      localStorage.getItem('ludo_avatar') ||
      AVATAR_OPTIONS[0]
    );
  });
  // Permanent Device-Bound Player ID (e.g., LUDO-847392-X9) - Restores profile & balance even after delete/reinstall
  const [myPlayerId] = useState<string>(() => getOrCreatePermanentPlayerId());

  const [inventory, setInventory] = useState<PlayerInventory>(() => getLocalInventory(myPlayerId));
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [userCoins, setUserCoins] = useState<number>(() => {
    return inventory.coins || DEFAULT_COINS;
  });
  const [userTrophies, setUserTrophies] = useState<number>(() => {
    const saved = localStorage.getItem('ludo_trophies');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [userWins, setUserWins] = useState<number>(() => {
    const saved = localStorage.getItem('ludo_wins');
    return saved ? parseInt(saved, 10) : 0;
  });
  const userLevel = useMemo(() => 1 + userWins, [userWins]);
  const [userTotalGames, setUserTotalGames] = useState<number>(() => {
    const saved = localStorage.getItem('ludo_games');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Sound Mute State
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => soundEffects.getMuted());

  // Screens & Modals
  const [currentScreen, setCurrentScreen] = useState<'lobby' | 'game'>('lobby');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState<boolean>(false);

  // Status Notification Toast Banner
  const [actionNotification, setActionNotification] = useState<string>('');

  const showToast = useCallback((msg: string) => {
    setActionNotification(msg);
    setTimeout(() => {
      setActionNotification((prev) => (prev === msg ? '' : prev));
    }, 2800);
  }, []);

  const showNotification = showToast;

  // Daily Bonus Claim (+100 Coins once every 24h)
  const isDailyRewardReady = useMemo(() => {
    const now = Date.now();
    const lastClaim = inventory.lastDailyClaimTime || 0;
    return !lastClaim || now - lastClaim >= 24 * 3600 * 1000;
  }, [inventory.lastDailyClaimTime]);

  const handleClaimDailyReward = useCallback(() => {
    const now = Date.now();
    const lastClaim = inventory.lastDailyClaimTime || 0;
    const cooldownMs = 24 * 3600 * 1000;
    if (lastClaim && now - lastClaim < cooldownMs) {
      const remainingHours = Math.max(1, Math.ceil((cooldownMs - (now - lastClaim)) / (3600 * 1000)));
      showToast(`⏳ Daily bonus already claimed! Next bonus in ${remainingHours}h.`);
      return;
    }
    const newCoins = (inventory.coins || 0) + 100;
    const newInv: PlayerInventory = {
      ...inventory,
      coins: newCoins,
      lastDailyClaimTime: now,
    };
    setInventory(newInv);
    setUserCoins(newCoins);
    saveLocalInventory(newInv, myPlayerId);
    saveInventoryToFirebase(myPlayerId, newInv, {
      name: userName,
      avatar: userAvatar,
      wins: userWins,
      trophies: userTrophies,
    });
    soundEffects.playWinFanfare();
    showToast(`🎁 Daily Bonus Claimed: +100 Coins! 🪙 (Total: ${newCoins})`);
  }, [inventory, myPlayerId, showToast, userName, userAvatar, userWins, userTrophies]);

  const handleAddCoins = useCallback(
    (amount: number, _reason: string) => {
      const currentCoins = inventory.coins || 0;
      const newCoins = currentCoins + amount;
      const newInv: PlayerInventory = {
        ...inventory,
        coins: newCoins,
      };
      setInventory(newInv);
      setUserCoins(newCoins);
      try {
        localStorage.setItem('userCoins', newCoins.toString());
      } catch {}
      saveLocalInventory(newInv, myPlayerId);
      saveInventoryToFirebase(myPlayerId, newInv);
    },
    [inventory, myPlayerId]
  );

  // Game State (Offline Pass & Play by default, No Bots)
  const [gameState, setGameState] = useState<GameState>({
    roomId: 'OFFLINE',
    mode: 'local',
    matchRule: 'classic',
    players: [],
    playerOrder: ['blue', 'red', 'green', 'yellow'],
    currentTurnIndex: 0,
    diceValue: null,
    isRolling: false,
    hasRolled: false,
    consecutiveSixes: 0,
    validTokenMoves: [],
    winners: [],
    gameStatus: 'lobby',
    turnTimer: 0,
    turnTimeLimit: 0,
    activeHopToken: null,
  });

  // Safety watchdog: if isRolling gets stuck for more than 1200ms, unlock automatically!
  useEffect(() => {
    if (gameState.isRolling) {
      const timer = setTimeout(() => {
        setGameState((prev) => (prev.isRolling ? { ...prev, isRolling: false } : prev));
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [gameState.isRolling]);

  // Active Chat Messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeSpeechBubbles, setActiveSpeechBubbles] = useState<
    Record<PlayerColor, { text: string; type: 'text' | 'quick' | 'emoji'; timestamp: number } | null>
  >({
    blue: null,
    red: null,
    green: null,
    yellow: null,
  });

  const [copiedCode, setCopiedCode] = useState(false);

  // Individual dice values per player color so non-active colors never rotate or run
  const [playerLastRoll, setPlayerLastRoll] = useState<Record<PlayerColor, number | null>>({
    red: null,
    green: null,
    yellow: null,
    blue: null,
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Ensure 'Player 1' is strictly used instead of any lingering 'Raj'
  useEffect(() => {
    try {
      const stored = localStorage.getItem('player_name') || localStorage.getItem('ludo_username');
      if (!stored || stored.toLowerCase().includes('raj')) {
        localStorage.setItem('player_name', 'Player 1');
        localStorage.setItem('ludo_username', 'Player 1');
        setUserName('Player 1');
      }
    } catch {}
  }, []);

  const [isOnlineMatch, setIsOnlineMatch] = useState(false);
  const [lastWinWasTimeout, setLastWinWasTimeout] = useState(false);
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(null);
  const [myOnlineColor, setMyOnlineColor] = useState<PlayerColor>('blue');
  const [onlinePlayerCount, setOnlinePlayerCount] = useState<2 | 3 | 4>(2);
  const [onlineMatchPlayers, setOnlineMatchPlayers] = useState<OnlineMatchPlayer[]>([]);
  const [showOnlineMatchModal, setShowOnlineMatchModal] = useState(false);
  const [onlineSearchState, setOnlineSearchState] = useState<'idle' | 'searching' | 'matched' | 'timeout'>('idle');
  const [matchedOnlineData, setMatchedOnlineData] = useState<MatchFoundPayload | null>(null);
  const [showOpponentLeftModal, setShowOpponentLeftModal] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isInviteWaitingOpen, setIsInviteWaitingOpen] = useState(false);
  const [invitedPlayer, setInvitedPlayer] = useState<RecentPlayer | null>(null);
  const [invitePlayerCount, setInvitePlayerCount] = useState<2 | 3 | 4>(2);
  const [rematchState, setRematchState] = useState<RematchState>({
    isRequested: false,
    readyCount: 0,
    totalCount: 0,
    requesterName: '',
    opponentLeft: false,
  });

  // 30-Second Inactivity Turn Timer for Online Mode (Jobhi online player 30 second tak dice roll nahi karenge click nahi karenge, wo automatic game se out honge)
  const [onlineTurnTimeRemaining, setOnlineTurnTimeRemaining] = useState<number>(30);

  // Real-time Firebase Presence Heartbeat & Incoming Match Invites
  const [incomingInvite, setIncomingInvite] = useState<RealtimeInvite | null>(null);

  useEffect(() => {
    const syncPresence = async () => {
      try {
        await updatePlayerPresence(myPlayerId, userName, userAvatar);
      } catch {
        console.log('Presence update failed - offline mode');
      }
    };
    syncPresence();

    const interval = setInterval(() => {
      syncPresence();
    }, 25000);

    return () => clearInterval(interval);
  }, [myPlayerId, userName, userAvatar]);

  useEffect(() => {
    if (!myPlayerId) return;

    try {
      const unsub = listenForIncomingInvites(myPlayerId, (invite) => {
        // Don't interrupt if currently in an active game
        if (gameStateRef.current?.gameStatus === 'playing') return;
        setIncomingInvite(invite);
        soundEffects.playHomeEntry();
      });

      return () => unsub();
    } catch {
      console.log('Invites listener offline - will retry');
      return () => {};
    }
  }, [myPlayerId]);

  // Sync Permanent Player Profile, Shop Inventory & Coin/Diamond Balance from Firebase (Restores even after Delete & Re-install)
  const prevReferredCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!myPlayerId) return;

    // 1. Restore saved profile (Name, Avatar, Coins, Diamonds, Skins) for this permanent device ID
    const syncInventory = async () => {
      let fbData: any = null;
      try {
        fbData = await loadInventoryFromFirebase(myPlayerId);
      } catch {
        console.log('Inventory offline mode - using localStorage fallback');
        try {
          fbData = JSON.parse(localStorage.getItem('local_inventory') || 'null');
        } catch {}
      }

      if (!fbData) {
        try {
          fbData = JSON.parse(localStorage.getItem('local_inventory') || 'null');
        } catch {}
      }
      if (!fbData || typeof fbData !== 'object') return;

      if (fbData.name && typeof fbData.name === 'string' && !fbData.name.toLowerCase().includes('raj')) {
        setUserName(fbData.name);
        try {
          localStorage.setItem('player_name', fbData.name);
          localStorage.setItem('ludo_username', fbData.name);
        } catch {}
      }

      if (fbData.avatar && typeof fbData.avatar === 'string') {
        setUserAvatar(fbData.avatar);
        try {
          localStorage.setItem('player_avatar', fbData.avatar);
          localStorage.setItem('ludo_avatar', fbData.avatar);
        } catch {}
      }

      if (typeof fbData.wins === 'number') {
        setUserWins(fbData.wins);
        try {
          localStorage.setItem('ludo_wins', fbData.wins.toString());
        } catch {}
      }

      if (typeof fbData.trophies === 'number') {
        setUserTrophies(fbData.trophies);
        try {
          localStorage.setItem('ludo_trophies', fbData.trophies.toString());
        } catch {}
      }

      if (typeof fbData.coins === 'number' || typeof fbData.diamonds === 'number') {
        setInventory((prev) => {
          const merged: PlayerInventory = {
            ...prev,
            coins: typeof fbData.coins === 'number' ? fbData.coins : prev.coins,
            diamonds: typeof fbData.diamonds === 'number' ? fbData.diamonds : prev.diamonds,
            ownedDice: Array.isArray(fbData.ownedDice) ? fbData.ownedDice : prev.ownedDice,
            ownedTokens: Array.isArray(fbData.ownedTokens) ? fbData.ownedTokens : prev.ownedTokens,
            ownedBoards: Array.isArray(fbData.ownedBoards) ? fbData.ownedBoards : prev.ownedBoards,
            equippedDice: fbData.equippedDice ?? prev.equippedDice,
            equippedToken: fbData.equippedToken ?? prev.equippedToken,
            equippedBoard: fbData.equippedBoard ?? prev.equippedBoard,
            dailyExchangeCount:
              typeof fbData.dailyExchangeCount === 'number'
                ? fbData.dailyExchangeCount
                : prev.dailyExchangeCount,
            lastExchangeDate: fbData.lastExchangeDate ?? prev.lastExchangeDate,
          };
          setUserCoins(merged.coins);
          saveLocalInventory(merged, myPlayerId);
          return merged;
        });
      }
    };

    syncInventory();

    // 2. Listen in real-time when a WhatsApp-invited friend opens/installs the game (+1 Diamond reward)
    const unsubReferral = listenToMyReferralRewards(myPlayerId, (remote) => {
      if (
        prevReferredCountRef.current !== null &&
        remote.referredCount > prevReferredCountRef.current
      ) {
        soundEffects.playDiamondExchange();
        showToast('🎉 Aapke friend ne WhatsApp invite open/install kiya! +1 💎 Diamond मिला!');
      }
      prevReferredCountRef.current = remote.referredCount;

      if (typeof remote.diamonds === 'number') {
        setInventory((prev) => {
          if (remote.diamonds! > (prev.diamonds || 0)) {
            const updated: PlayerInventory = {
              ...prev,
              diamonds: remote.diamonds!,
            };
            saveLocalInventory(updated, myPlayerId);
            return updated;
          }
          return prev;
        });
      }
    });

    return () => unsubReferral();
  }, [myPlayerId, showToast]);

  const handleUpdateInventory = useCallback(
    (newInv: PlayerInventory) => {
      setInventory(newInv);
      setUserCoins(newInv.coins);
      saveLocalInventory(newInv, myPlayerId);
      if (myPlayerId) {
        saveInventoryToFirebase(myPlayerId, newInv);
      }
    },
    [myPlayerId]
  );

  const handleAddDiamonds = useCallback(
    (amount: number) => {
      const currentDiamonds = inventory.diamonds || 0;
      const newDiamonds = currentDiamonds + amount;
      const newInv: PlayerInventory = {
        ...inventory,
        diamonds: newDiamonds,
      };
      handleUpdateInventory(newInv);
    },
    [inventory, handleUpdateInventory]
  );

  // Glacier Eternal 100-Diamond States
  const [glacierEntryBanner, setGlacierEntryBanner] = useState<{
    kingName: string;
    isOpponent?: boolean;
  } | null>(null);
  const [showGlacierFomoPopup, setShowGlacierFomoPopup] = useState<boolean>(false);
  const [frozenCapture, setFrozenCapture] = useState<{
    row: number;
    col: number;
    color: PlayerColor;
    tokenId: number;
  } | null>(null);
  const [isGlacierPreviewActive, setIsGlacierPreviewActive] = useState<boolean>(false);

  const triggerGlacierKingEntry = useCallback(
    (kingName: string, isOpponentKing = false) => {
      if (!isOnlineMatch && !isGlacierPreviewActive) return;
      soundEffects.playGlacierCrack();
      setGlacierEntryBanner({ kingName, isOpponent: isOpponentKing });
      setTimeout(() => {
        setGlacierEntryBanner(null);
        if (isOnlineMatch && isOpponentKing && !inventory.ownedBoards?.includes('glacier_eternal')) {
          setShowGlacierFomoPopup(true);
        }
      }, 3200);
    },
    [isOnlineMatch, isGlacierPreviewActive, inventory.ownedBoards]
  );

  const handleShareForFreeDiamond = useCallback(() => {
    soundEffects.playButtonClick();
    const referralUrl = `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(myPlayerId)}`;
    const shareText = `👑❄️ GLACIER ETERNAL - 100 DIAMOND DREAM OF KINGS! Har koi dekhega, koi koi hi paayega! Kya aap King ho? Play Ludo Headmaster now: ${referralUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

    try {
      if (navigator.share) {
        navigator
          .share({
            title: 'Ludo Headmaster - Glacier Eternal 100💎',
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

    showToast(`📲 WhatsApp Invite Sent! Friend ke open/install karne par +1 💎 milega!`);
  }, [myPlayerId, showToast]);

  const onlineUnsubRef = useRef<(() => void) | null>(null);
  const botActionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const autoMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const passTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const finalizeMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const diceTrackerRef = useRef<Record<PlayerColor, PlayerDiceTracker>>({
    red: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
    green: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
    yellow: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
    blue: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
  });

  // Reset Board and Start Rematch with Same Players
  const resetBoardAndRestartGame = (currentPlayersList: Player[]) => {
    soundEffects.playHomeEntry();
    setIsWinnerModalOpen(false);
    setRematchState({
      isRequested: false,
      readyCount: 0,
      totalCount: 0,
      requesterName: '',
      opponentLeft: false,
    });

    const resetPlayers: Player[] = currentPlayersList.map((p) => ({
      ...p,
      tokens: createPlayerTokens(p.color),
      stats: { kills: 0, sixes: 0, tokensHome: 0 },
    }));

    setGameState((prev) => ({
      ...prev,
      players: resetPlayers,
      currentTurnIndex: 0,
      diceValue: null,
      isRolling: false,
      hasRolled: false,
      consecutiveSixes: 0,
      validTokenMoves: [],
      winners: [],
      gameStatus: 'playing',
      activeHopToken: null,
    }));

    setPlayerLastRoll({
      red: null,
      green: null,
      yellow: null,
      blue: null,
    });

    diceTrackerRef.current = {
      red: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
      green: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
      yellow: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
      blue: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
    };

    showNotification(`Rematch Started! ${resetPlayers[0]?.name}'s Turn 🎲`);
  };

  const handleRematchClick = () => {
    if (!isOnlineMatch) {
      // Offline mode rematch
      resetBoardAndRestartGame(gameState.players);
      return;
    }

    const realPlayers = gameState.players.filter((p) => !p.isBot);
    // If only user is real and others are bots -> Bots agree instantly
    if (realPlayers.length <= 1) {
      setRematchState({
        isRequested: true,
        readyCount: 1,
        totalCount: 1,
        requesterName: userName,
        opponentLeft: false,
      });
      setTimeout(() => {
        resetBoardAndRestartGame(gameState.players);
      }, 800);
      return;
    }

    // Multiplayer room with other real players
    setRematchState({
      isRequested: true,
      readyCount: 1,
      totalCount: realPlayers.length,
      requesterName: userName,
      opponentLeft: false,
    });
    if (onlineRoomId) {
      onlineMatchManager.requestRematch(onlineRoomId, myPlayerId, userName);
    }
  };

  // Online Matchmaking: Start Search for 2P, 3P, or 4P
  const handleStartOnlineSearch = (name: string, avatar: string, count?: 2 | 3 | 4) => {
    const pCount = count || onlinePlayerCount;
    setOnlinePlayerCount(pCount);
    setOnlineSearchState('searching');

    onlineMatchManager.startMatchmaking(
      myPlayerId,
      name,
      avatar,
      pCount,
      {
        onMatchFound: (data) => {
          setMatchedOnlineData(data);
          setOnlineSearchState('matched');
          soundEffects.playHomeEntry();
          setTimeout(() => {
            setShowOnlineMatchModal(false);
            setOnlineSearchState('idle');
            startOnlineGame(data);
          }, 1500);
        },
        onTimeout: () => {
          // 10-Second Auto Bot Fallback
          const colors: PlayerColor[] =
            pCount === 2 ? ['red', 'yellow'] : pCount === 3 ? ['red', 'yellow', 'blue'] : ['blue', 'red', 'green', 'yellow'];
          const botNames = ['Bot Raja 🤖', 'Bot Rani 🤖', 'Bot Sher 🤖', 'Bot Sikandar 🤖'];
          const botAvatars = [
            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
          ];
          const botLevels = [12, 9, 15, 18];

          const fallbackPlayers: OnlineMatchPlayer[] = [
            {
              id: myPlayerId,
              name,
              avatar,
              color: colors[0],
              isBot: false,
              level: userLevel,
              vipLevel: getPlayerVipLevel(inventory.equippedDice, inventory.equippedToken),
              diceSkin: inventory.equippedDice || 'normal',
              tokenSkin: inventory.equippedToken || 'normal',
            },
          ];
          for (let i = 1; i < pCount; i++) {
            const bIdx = (i - 1) % botNames.length;
            fallbackPlayers.push({
              id: `bot_${colors[i]}_${Date.now()}`,
              name: botNames[bIdx],
              avatar: botAvatars[bIdx],
              color: colors[i],
              isBot: true,
              level: botLevels[bIdx],
              vipLevel: 1, // Default VIP 1 for bots who have not purchased VIP
              diceSkin: 'normal', // Default normal classic dice
              tokenSkin: 'normal', // Default normal classic token
            });
          }

          const fallbackData: MatchFoundPayload = {
            gameId: Math.floor(100000 + Math.random() * 900000).toString(),
            playerCount: pCount,
            myColor: colors[0],
            myName: name,
            myAvatar: avatar,
            players: fallbackPlayers,
            firstTurn: colors[0],
          };

          setMatchedOnlineData(fallbackData);
          setOnlineSearchState('matched');
          soundEffects.playHomeEntry();
          setTimeout(() => {
            setShowOnlineMatchModal(false);
            setOnlineSearchState('idle');
            startOnlineGame(fallbackData);
          }, 1500);
        },
      },
      {
        diceSkin: inventory.equippedDice,
        tokenSkin: inventory.equippedToken,
        boardSkin: inventory.equippedBoard,
        playerLevel: userLevel,
        playerVipLevel: getPlayerVipLevel(inventory.equippedDice, inventory.equippedToken, inventory.equippedBoard),
      }
    );
  };

  const handleCancelOnlineSearch = () => {
    onlineMatchManager.cancelMatchmaking(myPlayerId);
    setOnlineSearchState('idle');
  };

  // URL Query parameter auto-join & WhatsApp Referral Install listener (?code=847392 or ?ref=LUDO-...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refId = params.get('ref');
      if (refId && myPlayerId && refId !== myPlayerId) {
        processReferralInstall(refId, myPlayerId).then((credited) => {
          if (credited) {
            showToast(`💎 Welcome via Friend Invite! Your friend earned +1 Diamond!`);
          }
        });
      }

      const roomCode = params.get('code') || params.get('room');
      if (roomCode) {
        showToast(`🔗 Joined Private Room #${roomCode}! Connecting... 👥`);
        setTimeout(() => {
          handleStartOnlineSearch(userName || 'Player 1', userAvatar, 2);
        }, 800);
      }
    } catch {}
  }, [myPlayerId]);

  const handleCreatePrivateRoom = useCallback(
    (playerCount: 2 | 4, roomCode: string) => {
      showToast(`👑 Private Room #${roomCode} Created! Connecting...`);
      handleStartOnlineSearch(userName, userAvatar, playerCount);
    },
    [userName, userAvatar, handleStartOnlineSearch, showToast]
  );

  const handleJoinPrivateRoom = useCallback(
    (roomCode: string) => {
      showToast(`🚪 Joining Private Room #${roomCode}...`);
      handleStartOnlineSearch(userName, userAvatar, 2);
    },
    [userName, userAvatar, handleStartOnlineSearch, showToast]
  );

  const handleOpenFriends = () => {
    setIsFriendsModalOpen(true);
  };

  const handleInviteFriend = (player: RecentPlayer, count: 2 | 3 | 4) => {
    setInvitedPlayer(player);
    setInvitePlayerCount(count);
    setIsFriendsModalOpen(false);
    setIsInviteWaitingOpen(true);
  };

  const handleInviteAccepted = (friend: RecentPlayer, count: 2 | 3 | 4, roomId: string) => {
    setIsInviteWaitingOpen(false);

    let matchPlayers: OnlineMatchPlayer[] = [];
    let myAssignedColor: PlayerColor = 'red';

    if (count === 2) {
      // 2 Players: Red vs Yellow (User is Red, Friend is Yellow)
      myAssignedColor = 'red';
      matchPlayers = [
        {
          id: myPlayerId,
          name: userName,
          avatar: userAvatar,
          color: 'red',
          isBot: false,
          level: userLevel,
          vipLevel: getPlayerVipLevel(inventory.equippedDice, inventory.equippedToken),
          diceSkin: inventory.equippedDice || 'normal',
          tokenSkin: inventory.equippedToken || 'normal',
        },
        {
          id: friend.id,
          name: friend.name,
          avatar: friend.avatar,
          color: 'yellow',
          isBot: false,
          level: 1,
          vipLevel: 1,
          diceSkin: 'normal',
          tokenSkin: 'normal',
        },
      ];
    } else if (count === 3) {
      // 3 Players: Red, Yellow, Blue (User Red, Friend Yellow, 3rd Bot Blue)
      myAssignedColor = 'red';
      matchPlayers = [
        {
          id: myPlayerId,
          name: userName,
          avatar: userAvatar,
          color: 'red',
          isBot: false,
          level: userLevel,
          vipLevel: getPlayerVipLevel(inventory.equippedDice, inventory.equippedToken),
          diceSkin: inventory.equippedDice || 'normal',
          tokenSkin: inventory.equippedToken || 'normal',
        },
        {
          id: friend.id,
          name: friend.name,
          avatar: friend.avatar,
          color: 'yellow',
          isBot: false,
          level: 1,
          vipLevel: 1,
          diceSkin: 'normal',
          tokenSkin: 'normal',
        },
        {
          id: `bot_blue_${Date.now()}`,
          name: 'Bot Raja 🤖',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          color: 'blue',
          isBot: true,
          level: 12,
          vipLevel: 1,
          diceSkin: 'normal',
          tokenSkin: 'normal',
        },
      ];
    } else {
      // 4 Players: Blue, Red, Green, Yellow (User Blue, Friend Red, 2 Bots)
      myAssignedColor = 'blue';
      matchPlayers = [
        {
          id: myPlayerId,
          name: userName,
          avatar: userAvatar,
          color: 'blue',
          isBot: false,
          level: userLevel,
          vipLevel: getPlayerVipLevel(inventory.equippedDice, inventory.equippedToken),
          diceSkin: inventory.equippedDice || 'normal',
          tokenSkin: inventory.equippedToken || 'normal',
        },
        {
          id: friend.id,
          name: friend.name,
          avatar: friend.avatar,
          color: 'red',
          isBot: false,
          level: 1,
          vipLevel: 1,
          diceSkin: 'normal',
          tokenSkin: 'normal',
        },
        {
          id: `bot_green_${Date.now()}`,
          name: 'Bot Rani 🤖',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
          color: 'green',
          isBot: true,
          level: 9,
          vipLevel: 1,
          diceSkin: 'normal',
          tokenSkin: 'normal',
        },
        {
          id: `bot_yellow_${Date.now()}`,
          name: 'Bot Sher 🤖',
          avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
          color: 'yellow',
          isBot: true,
          level: 15,
          vipLevel: 1,
          diceSkin: 'normal',
          tokenSkin: 'normal',
        },
      ];
    }

    const matchPayload: MatchFoundPayload = {
      gameId: roomId,
      playerCount: count,
      myColor: myAssignedColor,
      myName: userName,
      myAvatar: userAvatar,
      players: matchPlayers,
      firstTurn: matchPlayers[0].color,
    };

    saveRecentPlayersFromGame(matchPlayers, userName, myPlayerId);
    startOnlineGame(matchPayload);
  };

  const handlePlayWithBotsFallback = (count: 2 | 3 | 4) => {
    setIsInviteWaitingOpen(false);
    const roomId = Math.floor(100000 + Math.random() * 900000).toString();
    let matchPlayers: OnlineMatchPlayer[] = [];
    let myAssignedColor: PlayerColor = 'red';

    if (count === 2) {
      myAssignedColor = 'red';
      matchPlayers = [
        {
          id: myPlayerId,
          name: userName,
          avatar: userAvatar,
          color: 'red',
          isBot: false,
          level: userLevel,
          vipLevel: getPlayerVipLevel(inventory.equippedDice, inventory.equippedToken),
          diceSkin: inventory.equippedDice || 'normal',
          tokenSkin: inventory.equippedToken || 'normal',
        },
        {
          id: `bot_yellow_${Date.now()}`,
          name: 'Bot Raja 🤖',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          color: 'yellow',
          isBot: true,
          level: 12,
          vipLevel: 1,
          diceSkin: 'normal',
          tokenSkin: 'normal',
        },
      ];
    } else if (count === 3) {
      myAssignedColor = 'red';
      matchPlayers = [
        {
          id: myPlayerId,
          name: userName,
          avatar: userAvatar,
          color: 'red',
          isBot: false,
          level: userLevel,
          vipLevel: getPlayerVipLevel(inventory.equippedDice, inventory.equippedToken),
          diceSkin: inventory.equippedDice || 'normal',
          tokenSkin: inventory.equippedToken || 'normal',
        },
        {
          id: `bot_yellow_${Date.now()}`,
          name: 'Bot Raja 🤖',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          color: 'yellow',
          isBot: true,
          level: 12,
          vipLevel: 1,
          diceSkin: 'normal',
          tokenSkin: 'normal',
        },
        {
          id: `bot_blue_${Date.now()}`,
          name: 'Bot Rani 🤖',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
          color: 'blue',
          isBot: true,
          level: 9,
          vipLevel: 1,
          diceSkin: 'normal',
          tokenSkin: 'normal',
        },
      ];
    } else {
      myAssignedColor = 'blue';
      matchPlayers = [
        {
          id: myPlayerId,
          name: userName,
          avatar: userAvatar,
          color: 'blue',
          isBot: false,
          level: userLevel,
          vipLevel: getPlayerVipLevel(inventory.equippedDice, inventory.equippedToken),
          diceSkin: inventory.equippedDice || 'normal',
          tokenSkin: inventory.equippedToken || 'normal',
        },
        {
          id: `bot_red_${Date.now()}`,
          name: 'Bot Raja 🤖',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          color: 'red',
          isBot: true,
          level: 12,
          vipLevel: 1,
          diceSkin: 'normal',
          tokenSkin: 'normal',
        },
        {
          id: `bot_green_${Date.now()}`,
          name: 'Bot Rani 🤖',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
          color: 'green',
          isBot: true,
          level: 9,
          vipLevel: 1,
          diceSkin: 'normal',
          tokenSkin: 'normal',
        },
        {
          id: `bot_yellow_${Date.now()}`,
          name: 'Bot Sher 🤖',
          avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
          color: 'yellow',
          isBot: true,
          level: 15,
          vipLevel: 1,
          diceSkin: 'normal',
          tokenSkin: 'normal',
        },
      ];
    }

    const payload: MatchFoundPayload = {
      gameId: roomId,
      playerCount: count,
      myColor: myAssignedColor,
      myName: userName,
      myAvatar: userAvatar,
      players: matchPlayers,
      firstTurn: matchPlayers[0].color,
    };

    startOnlineGame(payload);
  };

  // Start Live Online Match (2P, 3P, or 4P with Real players and Bots)
  const startOnlineGame = (matchData: MatchFoundPayload) => {
    saveRecentPlayersFromGame(matchData.players, userName, myPlayerId);
    setIsOnlineMatch(true);
    setOnlineRoomId(matchData.gameId);
    setMyOnlineColor(matchData.myColor);
    setOnlinePlayerCount(matchData.players.length as 2 | 3 | 4);
    setOnlineMatchPlayers(matchData.players);

    onlineMatchManager.joinGameRoom(matchData.gameId, myPlayerId);

    const colors = matchData.players.map((p) => p.color);
    const onlinePlayers: Player[] = matchData.players.map((p) => {
      const isMe = p.id === myPlayerId || p.color === matchData.myColor;
      const dSkin = isMe ? (inventory.equippedDice || 'normal') : (p.diceSkin || 'normal');
      const tSkin = isMe ? (inventory.equippedToken || 'normal') : (p.tokenSkin || 'normal');
      const bSkin = isMe ? (inventory.equippedBoard || 'classic') : (p.boardSkin || 'classic');
      const vRank = isMe
        ? getPlayerVipLevel(inventory.equippedDice, inventory.equippedToken, inventory.equippedBoard)
        : (p.vipLevel || getPlayerVipLevel(dSkin, tSkin, bSkin));

      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: p.color,
        isBot: p.isBot,
        isConnected: true,
        coins: 10000,
        level: isMe ? userLevel : p.level || 1,
        vipLevel: vRank,
        isOut: false,
        diceSkin: dSkin,
        tokenSkin: tSkin,
        boardSkin: bSkin,
        tokens: createPlayerTokens(p.color),
        stats: { kills: 0, sixes: 0, tokensHome: 0 },
      };
    });

    const newGameState: GameState = {
      roomId: matchData.gameId,
      mode: 'online',
      matchRule: 'classic',
      players: onlinePlayers,
      playerOrder: colors,
      currentTurnIndex: 0,
      diceValue: null,
      isRolling: false,
      hasRolled: false,
      consecutiveSixes: 0,
      validTokenMoves: [],
      winners: [],
      gameStatus: 'playing',
      turnTimer: 30,
      turnTimeLimit: 30,
      activeHopToken: null,
    };

    setGameState(newGameState);
    setPlayerLastRoll({
      red: null,
      green: null,
      yellow: null,
      blue: null,
    });
    diceTrackerRef.current = {
      red: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
      green: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
      yellow: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
      blue: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
    };
    setOnlineTurnTimeRemaining(30);
    setCurrentScreen('game');

    if (onlineUnsubRef.current) {
      onlineUnsubRef.current();
      onlineUnsubRef.current = null;
    }

    // Subscribe to Opponent Moves & Rolls & Rematches in Real-time
    const gameEventsUnsub = onlineMatchManager.listenGameEvents(matchData.gameId, {
      onOpponentDice: (diceData) => {
        executeOpponentDiceRoll(diceData.playerColor, diceData.diceValue);
      },
      onOpponentMove: (moveData) => {
        executeOpponentTokenMove(moveData.tokenId);
      },
      onOpponentLeave: () => {
        setShowOpponentLeftModal(true);
      },
      onOpponentTimeout: (timeoutData) => {
        handlePlayerTimeout(timeoutData.playerColor);
      },
    });

    const rematchUnsub = onlineMatchManager.listenRematchEvents(matchData.gameId, {
      onProgress: (progress) => {
        setRematchState({
          isRequested: true,
          readyCount: progress.readyCount,
          totalCount: progress.totalCount,
          requesterName: progress.requesterName,
          opponentLeft: false,
        });
      },
      onStart: () => {
        resetBoardAndRestartGame(gameStateRef.current.players);
      },
      onOpponentDeclined: () => {
        setRematchState((prev) => ({ ...prev, opponentLeft: true }));
      },
    });

    onlineUnsubRef.current = () => {
      gameEventsUnsub();
      rematchUnsub();
    };

    const firstPlayer = onlinePlayers[0];
    showNotification(
      firstPlayer.color === matchData.myColor
        ? `Match Started! Aapka (${matchData.myName}) turn hai 🎲`
        : `Match Started! ${firstPlayer.name} ka turn hai ⏳`
    );

    // Check if any player entered with the 100-Diamond Glacier Eternal Board
    const glacierKing = onlinePlayers.find(
      (pl) =>
        pl.boardSkin === 'glacier_eternal' ||
        pl.diceSkin === 'glacier_eternal' ||
        pl.tokenSkin === 'glacier_eternal'
    );
    if (glacierKing) {
      const isOpponentKing = glacierKing.color !== matchData.myColor;
      triggerGlacierKingEntry(glacierKing.name, isOpponentKing);
    } else if (isGlacierPreviewActive) {
      triggerGlacierKingEntry(userName, false);
    }
  };

  // Autonomous Strong Bot Turn Controller (Tagra Bot)
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return;
    const activePlayer = gameState.players[gameState.currentTurnIndex];
    if (!activePlayer || !activePlayer.isBot) return;

    // If active hop token is moving, wait for it to finish
    if (gameState.activeHopToken) return;

    if (botActionTimeoutRef.current) {
      clearTimeout(botActionTimeoutRef.current);
      botActionTimeoutRef.current = null;
    }

    // Step 1: Force Bot Dice Roll within 1000ms
    if (!gameState.hasRolled && !gameState.isRolling) {
      botActionTimeoutRef.current = setTimeout(() => {
        botActionTimeoutRef.current = null;
        handleRollDice(activePlayer.color);
      }, 1000);

      return () => {
        if (botActionTimeoutRef.current) {
          clearTimeout(botActionTimeoutRef.current);
          botActionTimeoutRef.current = null;
        }
      };
    }

    // Step 2: Bot has rolled dice, choose best move with intelligent AI
    if (gameState.hasRolled && !gameState.isRolling && gameState.diceValue !== null) {
      const diceValue = gameState.diceValue;
      const movableTokens = gameState.validTokenMoves;

      botActionTimeoutRef.current = setTimeout(() => {
        botActionTimeoutRef.current = null;
        if (movableTokens.length > 0) {
          const bestTokenId =
            chooseBestBotMove(
              activePlayer,
              diceValue,
              movableTokens,
              gameState.players
            ) ?? movableTokens[0];

          handleSelectToken(bestTokenId, activePlayer.color, true);
        } else {
          // No move possible, pass turn
          advanceTurn(false);
        }
      }, 1200);

      return () => {
        if (botActionTimeoutRef.current) {
          clearTimeout(botActionTimeoutRef.current);
          botActionTimeoutRef.current = null;
        }
      };
    }
  }, [
    gameState.currentTurnIndex,
    gameState.players,
    gameState.hasRolled,
    gameState.isRolling,
    gameState.activeHopToken,
    gameState.diceValue,
    gameState.validTokenMoves,
    gameState.gameStatus,
  ]);

  const handleLeaveOnlineGame = () => {
    handleGoHome();
  };

  const handleGoHome = () => {
    if (isOnlineMatch && onlineRoomId) {
      onlineMatchManager.declineRematch(onlineRoomId, myPlayerId);
      onlineMatchManager.leaveGame(onlineRoomId, myPlayerId);
    }
    if (onlineUnsubRef.current) {
      onlineUnsubRef.current();
      onlineUnsubRef.current = null;
    }
    if (botActionTimeoutRef.current) {
      clearTimeout(botActionTimeoutRef.current);
      botActionTimeoutRef.current = null;
    }
    setIsOnlineMatch(false);
    setOnlineRoomId(null);
    setIsWinnerModalOpen(false);
    setShowOpponentLeftModal(false);
    setRematchState({
      isRequested: false,
      readyCount: 0,
      totalCount: 0,
      requesterName: '',
      opponentLeft: false,
    });
    setCurrentScreen('lobby');
  };

  const handleUpdateUserProfile = (name: string, avatar: string) => {
    const permanentId = getOrCreatePermanentPlayerId();
    setUserName(name);
    setUserAvatar(avatar);
    try {
      localStorage.setItem('ludo_permanent_id', permanentId);
      localStorage.setItem('player_name', name);
      localStorage.setItem('player_avatar', avatar);
      localStorage.setItem('ludo_username', name);
      localStorage.setItem('ludo_avatar', avatar);
    } catch {}
    saveInventoryToFirebase(permanentId, inventory, {
      name,
      avatar,
      wins: userWins,
      trophies: userTrophies,
    });
    updatePlayerPresence(permanentId, name, avatar);
  };

  const handleToggleSound = () => {
    const muted = soundEffects.toggleMute();
    setIsSoundMuted(muted);
  };

  // Start Offline Game from Lobby (Pass & Play)
  const handleStartGame = (
    _mode: GameMode,
    matchRule: MatchRule,
    playerCount: number,
    playerNames: string[],
    playerColors: PlayerColor[]
  ) => {
    soundEffects.playButtonClick();

    // Clean up any online subscriptions / rooms / timeouts
    if (isOnlineMatch && onlineRoomId) {
      onlineMatchManager.declineRematch(onlineRoomId, myPlayerId);
      onlineMatchManager.leaveGame(onlineRoomId, myPlayerId);
    }
    if (onlineUnsubRef.current) {
      onlineUnsubRef.current();
      onlineUnsubRef.current = null;
    }
    if (botActionTimeoutRef.current) {
      clearTimeout(botActionTimeoutRef.current);
      botActionTimeoutRef.current = null;
    }
    if (passTurnTimeoutRef.current) {
      clearTimeout(passTurnTimeoutRef.current);
      passTurnTimeoutRef.current = null;
    }
    if (autoMoveTimeoutRef.current) {
      clearTimeout(autoMoveTimeoutRef.current);
      autoMoveTimeoutRef.current = null;
    }
    if (hopIntervalRef.current) {
      clearInterval(hopIntervalRef.current);
      hopIntervalRef.current = null;
    }
    if (finalizeMoveTimeoutRef.current) {
      clearTimeout(finalizeMoveTimeoutRef.current);
      finalizeMoveTimeoutRef.current = null;
    }

    setIsOnlineMatch(false);
    setOnlineRoomId(null);
    setIsWinnerModalOpen(false);
    setShowOpponentLeftModal(false);
    setRematchState({
      isRequested: false,
      readyCount: 0,
      totalCount: 0,
      requesterName: '',
      opponentLeft: false,
    });

    // 100% Offline Pass & Play Setup - Strictly simple/classic (no glacier effects in offline)
    const configuredColors = playerColors.slice(0, playerCount);
    const configuredPlayers: Player[] = configuredColors.map((color, idx) => {
      const name = playerNames[idx] || `Player ${idx + 1}`;
      const avatar = AVATAR_OPTIONS[idx % AVATAR_OPTIONS.length];
      return {
        id: `p_${color}_${Date.now()}_${idx}`,
        name,
        avatar,
        color,
        isBot: false,
        isConnected: true,
        coins: 10000,
        level: idx === 0 ? userLevel : Math.max(1, userLevel - idx),
        vipLevel: 1,
        diceSkin: 'normal',
        tokenSkin: 'normal',
        boardSkin: 'classic',
        tokens: createPlayerTokens(color),
        stats: { kills: 0, sixes: 0, tokensHome: 0 },
      };
    });

    const newGameState: GameState = {
      roomId: 'OFFLINE',
      mode: 'local',
      matchRule,
      players: configuredPlayers,
      playerOrder: configuredColors,
      currentTurnIndex: 0,
      diceValue: null,
      isRolling: false,
      hasRolled: false,
      consecutiveSixes: 0,
      validTokenMoves: [],
      winners: [],
      gameStatus: 'playing',
      turnTimer: 30,
      turnTimeLimit: 0,
      activeHopToken: null,
    };

    setGameState(newGameState);
    setPlayerLastRoll({
      red: null,
      green: null,
      yellow: null,
      blue: null,
    });
    diceTrackerRef.current = {
      red: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
      green: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
      yellow: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
      blue: { baseRollCount: 0, midGameRollCount: 0, lastTokenRollCount: 0 },
    };
    setCurrentScreen('game');

    const firstPlayer = newGameState.players[0];
    showNotification(`Match Started! ${firstPlayer.name}'s (${firstPlayer.color.toUpperCase()}) turn 🎲`);

    const glacierKing = configuredPlayers.find(
      (pl) =>
        pl.boardSkin === 'glacier_eternal' ||
        pl.diceSkin === 'glacier_eternal' ||
        pl.tokenSkin === 'glacier_eternal'
    );
    if (glacierKing) {
      triggerGlacierKingEntry(glacierKing.name, false);
    }
  };

  // Handle 30-Second Inactivity Timeout for Online Players (Auto-Out Rule)
  const handlePlayerTimeout = useCallback(
    (timedOutColor: PlayerColor) => {
      const currentState = gameStateRef.current;
      if (currentState.gameStatus !== 'playing') return;

      const timedOutPlayer = currentState.players.find((p) => p.color === timedOutColor);
      if (!timedOutPlayer || timedOutPlayer.isOut) return;

      soundEffects.playCapture();

      // Broadcast timeout to online opponents
      if (isOnlineMatch && onlineRoomId && timedOutColor === myOnlineColor) {
        onlineMatchManager.sendPlayerTimeout(onlineRoomId, timedOutColor);
      }

      const updatedPlayers = currentState.players.map((p) => {
        if (p.color === timedOutColor) {
          return {
            ...p,
            isOut: true,
            // Clear their board tokens so they don't block
            tokens: p.tokens.map((t) => ({ ...t, inBase: true, step: -1, isHome: false })),
          };
        }
        return p;
      });

      showNotification(`⚠️ ${timedOutPlayer.name} (30s inactivity) game se OUT ho gaya!`);

      const remainingActive = updatedPlayers.filter((p) => !p.isOut);

      // If only 1 player remains in the game after 30s timeout, that player wins the match,
      // BUT as requested: "Lekin online game 30 second time out hoke win per nahi milenge Kushbhi" (0 coins / no reward on 30s timeout win)
      if (remainingActive.length === 1) {
        const winner = remainingActive[0];
        soundEffects.playWinFanfare();
        setLastWinWasTimeout(true);

        const isWinnerMe =
          isOnlineMatch
            ? winner.color === myOnlineColor
            : winner.color === (updatedPlayers[0]?.color || 'red');

        if (isWinnerMe) {
          showNotification(
            `🏆 Opponent 30s Timeout se Out ho gaya! (Timeout Win par 0 Coins milte hain)`
          );
        } else {
          showNotification(`🏆 ${winner.name} (${winner.color.toUpperCase()}) WON BY TIMEOUT!`);
        }

        setGameState((prev) => ({
          ...prev,
          players: updatedPlayers,
          winners: [winner.color],
          gameStatus: 'finished',
          activeHopToken: null,
        }));
        setIsWinnerModalOpen(true);
        return;
      }

      // If 0 active players remain
      if (remainingActive.length === 0) {
        setGameState((prev) => ({
          ...prev,
          players: updatedPlayers,
          gameStatus: 'finished',
        }));
        return;
      }

      // Multiple players remain -> Advance turn to next non-out player
      let nextIndex = (currentState.currentTurnIndex + 1) % updatedPlayers.length;
      let attempts = 0;
      while (updatedPlayers[nextIndex]?.isOut && attempts < updatedPlayers.length) {
        nextIndex = (nextIndex + 1) % updatedPlayers.length;
        attempts++;
      }

      setOnlineTurnTimeRemaining(30);
      setGameState((prev) => ({
        ...prev,
        players: updatedPlayers,
        currentTurnIndex: nextIndex,
        isRolling: false,
        hasRolled: false,
        diceValue: null,
        consecutiveSixes: 0,
        validTokenMoves: [],
        activeHopToken: null,
      }));

      const nextPlayer = updatedPlayers[nextIndex];
      if (nextPlayer) {
        showNotification(`${nextPlayer.name}'s Turn! Tap dice to roll (30s timer) 🎲`);
      }
    },
    [isOnlineMatch, onlineRoomId, myOnlineColor, showNotification, inventory, userWins, myPlayerId]
  );

  // Switch Turn in Online/Offline Mode with isOut player skipping
  const advanceTurn = useCallback(
    (hadExtraTurn: boolean = false) => {
      const currentState = gameStateRef.current;
      if (currentState.gameStatus === 'finished' || currentState.winners.length > 0) {
        return;
      }

      const activeP = currentState.players[currentState.currentTurnIndex];

      if (hadExtraTurn && activeP && !activeP.isOut) {
        setOnlineTurnTimeRemaining(30);
        setGameState((prev) => ({
          ...prev,
          isRolling: false,
          hasRolled: false,
          diceValue: null,
          validTokenMoves: [],
          activeHopToken: null,
        }));
        showNotification(`${activeP.name} gets a Bonus Roll! 🎁 Roll again`);
        return;
      }

      // Find next active player who is NOT isOut
      let nextIndex = (currentState.currentTurnIndex + 1) % currentState.players.length;
      let attempts = 0;
      while (currentState.players[nextIndex]?.isOut && attempts < currentState.players.length) {
        nextIndex = (nextIndex + 1) % currentState.players.length;
        attempts++;
      }

      const nextPlayer = currentState.players[nextIndex];

      setOnlineTurnTimeRemaining(30);
      setGameState((prev) => ({
        ...prev,
        currentTurnIndex: nextIndex,
        isRolling: false,
        hasRolled: false,
        diceValue: null,
        consecutiveSixes: 0,
        validTokenMoves: [],
        activeHopToken: null,
      }));

      if (nextPlayer) {
        showNotification(`${nextPlayer.name}'s Turn! Tap dice to roll 🎲`);
      }
    },
    [showNotification]
  );

  // 30-Second Turn Timer Hook for Online Mode
  useEffect(() => {
    if (!isOnlineMatch || gameState.gameStatus !== 'playing') {
      return;
    }

    const activePlayer = gameState.players[gameState.currentTurnIndex];
    if (!activePlayer || activePlayer.isOut) return;

    // Reset turn timer to 30s at start of active player's turn
    setOnlineTurnTimeRemaining(30);

    const timer = setInterval(() => {
      const current = gameStateRef.current;
      // Do not count down during active 3D dice roll animation or token hopping animation
      if (current.isRolling || current.activeHopToken) {
        return;
      }

      setOnlineTurnTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 30s Reached -> Disqualify/Kick active player from the online game!
          handlePlayerTimeout(activePlayer.color);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isOnlineMatch,
    gameState.gameStatus,
    gameState.currentTurnIndex,
    handlePlayerTimeout,
  ]);

  // Opponent Dice Roll Execution (Sync from Socket)
  const executeOpponentDiceRoll = (playerColor: PlayerColor, diceValue: number) => {
    const currentState = gameStateRef.current;
    const activePlayer = currentState.players[currentState.currentTurnIndex];
    if (!activePlayer || activePlayer.color !== playerColor) return;

    soundEffects.playDiceRoll();

    setGameState((prev) => ({
      ...prev,
      isRolling: true,
      validTokenMoves: [],
    }));

    setTimeout(() => {
      setPlayerLastRoll((prev) => ({
        ...prev,
        [playerColor]: diceValue,
      }));

      const newConsecutiveSixes = diceValue === 6 ? currentState.consecutiveSixes + 1 : 0;
      const validMoves = getValidMoves(activePlayer, diceValue);

      setGameState((prev) => ({
        ...prev,
        diceValue,
        isRolling: false,
        hasRolled: true,
        consecutiveSixes: newConsecutiveSixes,
        validTokenMoves: validMoves,
      }));

      // If opponent has no valid moves, advance turn
      if (validMoves.length === 0) {
        showNotification(`Opponent rolled [ ${diceValue} ] - No valid moves. Turn passing...`);
        if (passTurnTimeoutRef.current) {
          clearTimeout(passTurnTimeoutRef.current);
        }
        passTurnTimeoutRef.current = setTimeout(() => {
          passTurnTimeoutRef.current = null;
          advanceTurn(false);
        }, 950);
      }
    }, 350);
  };

  const executeOpponentTokenMove = (tokenId: number, playerColor?: PlayerColor) => {
    handleSelectToken(tokenId, playerColor, true);
  };

  // Roll Dice Action
  const handleRollDice = async (callerColor?: PlayerColor) => {
    const currentState = gameStateRef.current;
    const activePlayer = currentState.players[currentState.currentTurnIndex];
    if (!activePlayer) return;

    // In Online match, allow local player and local bots to roll
    if (isOnlineMatch && !activePlayer.isBot && activePlayer.color !== myOnlineColor) {
      return;
    }

    if (callerColor && callerColor !== activePlayer.color) {
      return;
    }

    if (
      currentState.isRolling ||
      currentState.hasRolled ||
      currentState.activeHopToken
    ) {
      return;
    }

    if (passTurnTimeoutRef.current) {
      clearTimeout(passTurnTimeoutRef.current);
      passTurnTimeoutRef.current = null;
    }
    if (autoMoveTimeoutRef.current) {
      clearTimeout(autoMoveTimeoutRef.current);
      autoMoveTimeoutRef.current = null;
    }

    soundEffects.playDiceRoll();

    const currentTracker = diceTrackerRef.current[activePlayer.color] || {
      baseRollCount: 0,
      midGameRollCount: 0,
      lastTokenRollCount: 0,
    };
    const { roll, newTracker } = calculateSmartLudoDiceRoll(
      activePlayer,
      currentTracker,
      currentState.consecutiveSixes
    );
    diceTrackerRef.current[activePlayer.color] = newTracker;
    const finalRoll = roll;

    // Sync roll with online opponent if in online match
    if (isOnlineMatch && onlineRoomId) {
      onlineMatchManager.sendDiceRoll(onlineRoomId, activePlayer.color, finalRoll);
    }

    // Start 3D rolling animation
    setGameState((prev) => ({
      ...prev,
      isRolling: true,
      validTokenMoves: [],
    }));

    // Natural 440ms roll tumble and drop timing
    setTimeout(() => {
      setPlayerLastRoll((prev) => ({
        ...prev,
        [activePlayer.color]: finalRoll,
      }));

      if (finalRoll === 6) {
        soundEffects.playDiceSix();
      }

      const newConsecutiveSixes = finalRoll === 6 ? currentState.consecutiveSixes + 1 : 0;

      if (newConsecutiveSixes === 3) {
        showNotification('Three consecutive 6s! Turn forfeited ⚠️');
        if (passTurnTimeoutRef.current) {
          clearTimeout(passTurnTimeoutRef.current);
        }
        passTurnTimeoutRef.current = setTimeout(() => {
          passTurnTimeoutRef.current = null;
          setGameState((prev) => {
            const nextIdx = (prev.currentTurnIndex + 1) % prev.players.length;
            const nextPlayer = prev.players[nextIdx];
            if (nextPlayer) {
              showNotification(`${nextPlayer.name}'s Turn! Tap dice to roll 🎲`);
            }
            return {
              ...prev,
              currentTurnIndex: nextIdx,
              isRolling: false,
              hasRolled: false,
              diceValue: null,
              consecutiveSixes: 0,
              validTokenMoves: [],
              activeHopToken: null,
            };
          });
        }, 1100);
        return;
      }

      const validMoves = getValidMoves(activePlayer, finalRoll);

      setGameState((prev) => ({
        ...prev,
        diceValue: finalRoll,
        isRolling: false,
        hasRolled: true,
        consecutiveSixes: newConsecutiveSixes,
        validTokenMoves: validMoves,
      }));

      // No moves available -> Auto advance
      if (validMoves.length === 0) {
        showNotification(`No valid moves with [ ${finalRoll} ]. Passing turn...`);
        if (passTurnTimeoutRef.current) {
          clearTimeout(passTurnTimeoutRef.current);
        }
        passTurnTimeoutRef.current = setTimeout(() => {
          passTurnTimeoutRef.current = null;
          advanceTurn(false);
        }, 950);
        return;
      }

      // Check distinct positions of all movable tokens
      const movablePositions = new Set(
        validMoves.map((id) => {
          const t = activePlayer.tokens[id];
          return t.inBase ? 'BASE' : `STEP_${t.step}`;
        })
      );

      // Stacked Auto-move Rule:
      // 1. Agar player ke jo bhi movable tokens hain wo sab ek hi cell / jagah par stacked hain (movablePositions.size === 1)
      //    (chahe 1 token ho, 2+ stacked tokens hon, ya yard me sab hon aur 6 aaye) -> Automatic chal jaye (no click needed).
      // 2. Agar movable tokens alag-alag jagah par hain (movablePositions.size > 1) -> Auto-move mat karo, player choose karega.
      if (movablePositions.size === 1 && validMoves.length > 0) {
        const tokenToMove = validMoves[0];
        if (autoMoveTimeoutRef.current) {
          clearTimeout(autoMoveTimeoutRef.current);
        }
        autoMoveTimeoutRef.current = setTimeout(() => {
          autoMoveTimeoutRef.current = null;
          handleSelectToken(tokenToMove, activePlayer.color);
        }, 320);
      }
    }, 350);
  };

  // Dedicated per-color click handlers
  const handleRollRed = () => handleRollDice('red');
  const handleRollGreen = () => handleRollDice('green');
  const handleRollYellow = () => handleRollDice('yellow');
  const handleRollBlue = () => handleRollDice('blue');

  // Handle Token Selection / Hop Animation & Movement
  const handleSelectToken = (
    tokenId: number,
    tokenColor?: PlayerColor,
    isOpponentRemoteMove: boolean = false
  ) => {
    const currentState = gameStateRef.current;
    const activePlayer = currentState.players[currentState.currentTurnIndex];
    if (
      !activePlayer ||
      !currentState.hasRolled ||
      currentState.diceValue === null ||
      currentState.activeHopToken !== null
    ) {
      return;
    }

    // STRICT COLOR LOCK: If a token of a specific color was clicked, ONLY accept if it matches active turn color
    if (tokenColor && tokenColor !== activePlayer.color) {
      return;
    }

    if (isOnlineMatch && !isOpponentRemoteMove && !activePlayer.isBot && activePlayer.color !== myOnlineColor) {
      return;
    }

    if (passTurnTimeoutRef.current) {
      clearTimeout(passTurnTimeoutRef.current);
      passTurnTimeoutRef.current = null;
    }
    if (autoMoveTimeoutRef.current) {
      clearTimeout(autoMoveTimeoutRef.current);
      autoMoveTimeoutRef.current = null;
    }

    if (!currentState.validTokenMoves.includes(tokenId)) {
      return;
    }

    const token = activePlayer.tokens.find((t) => t.id === tokenId);
    if (!token) return;

    const roll = currentState.diceValue;

    if (token.inBase && roll === 6) {
      soundEffects.playTokenHop(1, true);
      const updatedPlayers = currentState.players.map((p) => {
        if (p.color !== activePlayer.color) return p;
        return {
          ...p,
          tokens: p.tokens.map((t) => (t.id === tokenId ? { ...t, inBase: false, step: 0 } : t)),
        };
      });

      if (isOnlineMatch && !isOpponentRemoteMove && onlineRoomId) {
        onlineMatchManager.sendTokenMove(onlineRoomId, activePlayer.color, tokenId, 6, activePlayer.color, updatedPlayers);
      }

      setGameState((prev) => ({
        ...prev,
        players: updatedPlayers,
        hasRolled: false,
        diceValue: null,
        validTokenMoves: [],
        activeHopToken: null,
      }));

      showNotification(`${activePlayer.name} brought a token onto the board! 🚀 Roll again`);
      advanceTurn(true);
      return;
    }

    const startStep = token.step;
    const endStep = token.step + roll;
    if (endStep > 56) return;

    setGameState((prev) => ({
      ...prev,
      validTokenMoves: [],
      activeHopToken: {
        color: activePlayer.color,
        tokenId,
        fromStep: startStep,
        toStep: endStep,
        currentStep: startStep,
      },
    }));

    let stepCounter = startStep;
    if (hopIntervalRef.current) {
      clearInterval(hopIntervalRef.current);
      hopIntervalRef.current = null;
    }
    if (finalizeMoveTimeoutRef.current) {
      clearTimeout(finalizeMoveTimeoutRef.current);
      finalizeMoveTimeoutRef.current = null;
    }

    const STEP_DURATION = 155;

    hopIntervalRef.current = setInterval(() => {
      stepCounter += 1;
      const totalSteps = Math.max(1, endStep - startStep);
      const fraction = (stepCounter - startStep) / totalSteps;
      const isLastStep = stepCounter >= endStep;
      soundEffects.playTokenHop(fraction, isLastStep);

      setGameState((prev) => ({
        ...prev,
        activeHopToken: {
          color: activePlayer.color,
          tokenId,
          fromStep: startStep,
          toStep: endStep,
          currentStep: stepCounter,
        },
      }));

      if (stepCounter >= endStep) {
        if (hopIntervalRef.current) {
          clearInterval(hopIntervalRef.current);
          hopIntervalRef.current = null;
        }

        finalizeMoveTimeoutRef.current = setTimeout(() => {
          finalizeMoveTimeoutRef.current = null;

          const isHome = endStep === 56;
          if (isHome) soundEffects.playHomeEntry();

          let hadCapture = false;
          let capturedColor: PlayerColor | null = null;

          const latestPlayers = gameStateRef.current.players;
          const captureResult = checkTokenCapture(activePlayer.color, endStep, latestPlayers);

          if (!isHome && !captureResult && isStarSpace(activePlayer.color, endStep)) {
            soundEffects.playSafeZone();
          }

          const playersAfterMove = latestPlayers.map((p) => {
            if (p.color === activePlayer.color) {
              return {
                ...p,
                tokens: p.tokens.map((t) =>
                  t.id === tokenId ? { ...t, step: endStep, isHome } : t
                ),
                stats: {
                  ...p.stats,
                  tokensHome: isHome ? p.stats.tokensHome + 1 : p.stats.tokensHome,
                },
              };
            }

            if (captureResult && p.id === captureResult.capturedPlayerId) {
              hadCapture = true;
              capturedColor = captureResult.capturedColor;
              soundEffects.playCapture();
              if (isOnlineMatch && activeBoardSkin === 'glacier_eternal') {
                soundEffects.playGlacierCrack();
                const capCoord = getTokenCoordinate(activePlayer.color, tokenId, endStep);
                setFrozenCapture({
                  row: capCoord.row,
                  col: capCoord.col,
                  color: captureResult.capturedColor,
                  tokenId: captureResult.capturedTokenId,
                });
                setTimeout(() => {
                  setFrozenCapture(null);
                }, 1000);
              }
              return {
                ...p,
                tokens: p.tokens.map((t) =>
                  t.id === captureResult.capturedTokenId
                    ? { ...t, inBase: true, step: -1, isHome: false }
                    : t
                ),
              };
            }

            return p;
          });

          const bonusTurn = roll === 6 || isHome || hadCapture;
          const nextIndex = (gameStateRef.current.currentTurnIndex + 1) % gameStateRef.current.players.length;
          const nextTurnColor = bonusTurn
            ? activePlayer.color
            : gameStateRef.current.players[nextIndex]?.color || 'green';

          if (isOnlineMatch && !isOpponentRemoteMove && onlineRoomId) {
            onlineMatchManager.sendTokenMove(
              onlineRoomId,
              activePlayer.color,
              tokenId,
              roll,
              nextTurnColor,
              playersAfterMove
            );
          }

          const activePlayerUpdated = playersAfterMove.find((p) => p.color === activePlayer.color)!;
          const playerWon = checkPlayerWin(activePlayerUpdated, gameStateRef.current.matchRule);

          if (playerWon && !gameStateRef.current.winners.includes(activePlayer.color)) {
            soundEffects.playWinFanfare();
            setLastWinWasTimeout(false);
            const newWinners = [...gameStateRef.current.winners, activePlayer.color];
            saveRecentPlayersFromGame(playersAfterMove, userName, myPlayerId);

            const isWinnerMe =
              isOnlineMatch
                ? activePlayer.color === myOnlineColor
                : activePlayer.color === (gameStateRef.current.players[0]?.color || 'red');

            if (isWinnerMe) {
              const newCoins = (inventory.coins || 0) + 50;
              const newWins = userWins + 1;
              const newLevel = 1 + newWins;
              const newInv: PlayerInventory = {
                ...inventory,
                coins: newCoins,
              };
              setInventory(newInv);
              setUserCoins(newCoins);
              setUserWins(newWins);
              try {
                localStorage.setItem('ludo_wins', newWins.toString());
                localStorage.setItem('ludo_level', newLevel.toString());
              } catch {}
              saveLocalInventory(newInv, myPlayerId);
              saveInventoryToFirebase(myPlayerId, newInv, {
                name: userName,
                avatar: userAvatar,
                wins: newWins,
                trophies: userTrophies,
              });
              showNotification(`🏆 VICTORY! 🎉 LEVEL UP! Level ${newLevel}! +50 Coins Awarded! 🪙`);
            } else {
              showNotification(`🏆 ${activePlayer.name} (${activePlayer.color.toUpperCase()}) WON THE MATCH!`);
            }

            setGameState((prev) => ({
              ...prev,
              players: playersAfterMove,
              winners: newWinners,
              gameStatus: 'finished',
              activeHopToken: null,
            }));

            setIsWinnerModalOpen(true);
            return;
          }

          setGameState((prev) => ({
            ...prev,
            players: playersAfterMove,
            activeHopToken: null,
          }));

          if (hadCapture && capturedColor) {
            showNotification(
              `⚔️ ${activePlayer.name} captured ${capturedColor}'s token! Extra Bonus Turn!`
            );
          } else if (isHome) {
            showNotification(`🌟 Token reached Home Safe! Bonus Roll awarded!`);
          }

          advanceTurn(bonusTurn);
        }, STEP_DURATION);
      }
    }, STEP_DURATION);
  };

  // Send Chat Message
  const handleSendMessage = (text: string, type: 'text' | 'quick' | 'emoji' = 'text') => {
    const activePlayer = gameState.players[gameState.currentTurnIndex];
    const playerColor: PlayerColor = activePlayer?.color || 'blue';

    const newMsg: ChatMessage = {
      id: `chat_${Date.now()}_${Math.random()}`,
      senderId: 'user',
      senderName: userName,
      senderColor: playerColor,
      senderAvatar: userAvatar,
      text,
      timestamp: Date.now(),
      type,
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setActiveSpeechBubbles((prev) => ({
      ...prev,
      [playerColor]: { text, type, timestamp: Date.now() },
    }));
    soundEffects.playButtonClick();

    setTimeout(() => {
      setActiveSpeechBubbles((prev) => {
        if (prev[playerColor]?.timestamp === newMsg.timestamp) {
          return { ...prev, [playerColor]: null };
        }
        return prev;
      });
    }, 3500);
  };

  const handleRematch = () => {
    handleRematchClick();
  };

  const getPlayerByColor = (color: PlayerColor) => {
    return gameState.players.find((p) => p.color === color);
  };

  const activePlayer = gameState.players[gameState.currentTurnIndex];
  const isMyTurn = !isOnlineMatch || (activePlayer?.color === myOnlineColor && !activePlayer?.isBot);

  const activeBoardSkin = useMemo(() => {
    if (!isOnlineMatch) {
      return 'classic'; // Offline Pass & Play is always 100% simple classic
    }
    if (isGlacierPreviewActive) return 'glacier_eternal';
    if (inventory.equippedBoard === 'glacier_eternal') return 'glacier_eternal';
    if (
      gameState.players.some(
        (p) =>
          p.boardSkin === 'glacier_eternal' ||
          p.diceSkin === 'glacier_eternal' ||
          p.tokenSkin === 'glacier_eternal'
      )
    ) {
      return 'glacier_eternal';
    }
    return inventory.equippedBoard || 'classic';
  }, [isOnlineMatch, isGlacierPreviewActive, inventory.equippedBoard, gameState.players]);

  // Determine color of Self / Local player
  const localColor: PlayerColor = useMemo(() => {
    if (isOnlineMatch && myOnlineColor) return myOnlineColor;
    return gameState.players[0]?.color || 'red';
  }, [isOnlineMatch, myOnlineColor, gameState.players]);

  // Board Rotation based on Player Color & Game Mode:
  // - Online mode (2P, 3P, 4P): Each client sees their own base at the BOTTOM (rotated dynamically per client)
  //   For Red player -> Red at bottom-left (270deg)
  //   For Yellow player -> Yellow at bottom-left (90deg)
  //   For Green player -> Green at bottom-left (180deg)
  //   For Blue player -> Blue at bottom-left (0deg)
  // - Offline pass & play: Fixed single canonical board (0deg)
  const boardRotation = useMemo(() => {
    if (!isOnlineMatch) {
      return 0; // Fixed single board for offline pass & play
    }
    switch (localColor) {
      case 'red':
        return 270;
      case 'yellow':
        return 90;
      case 'green':
        return 180;
      case 'blue':
      default:
        return 0;
    }
  }, [isOnlineMatch, localColor]);

  // Screen corner color mapping based on board rotation:
  const cornerColors = useMemo(() => {
    switch (boardRotation) {
      case 270:
        return {
          bottomLeft: 'red' as PlayerColor,
          bottomRight: 'blue' as PlayerColor,
          topLeft: 'green' as PlayerColor,
          topRight: 'yellow' as PlayerColor,
        };
      case 90:
        return {
          bottomLeft: 'yellow' as PlayerColor,
          bottomRight: 'green' as PlayerColor,
          topLeft: 'blue' as PlayerColor,
          topRight: 'red' as PlayerColor,
        };
      case 180:
        return {
          bottomLeft: 'green' as PlayerColor,
          bottomRight: 'red' as PlayerColor,
          topLeft: 'yellow' as PlayerColor,
          topRight: 'blue' as PlayerColor,
        };
      case 0:
      default:
        return {
          bottomLeft: 'blue' as PlayerColor,
          bottomRight: 'yellow' as PlayerColor,
          topLeft: 'red' as PlayerColor,
          topRight: 'green' as PlayerColor,
        };
    }
  }, [boardRotation]);

  // Perspective-based Pod Placement: Attached directly next to each player's rotated home quadrant
  const podLayout = useMemo(() => {
    const activeColors = new Set(gameState.players.map((p) => p.color));

    return {
      topLeft: activeColors.has(cornerColors.topLeft) ? cornerColors.topLeft : null,
      topRight: activeColors.has(cornerColors.topRight) ? cornerColors.topRight : null,
      bottomLeft: activeColors.has(cornerColors.bottomLeft) ? cornerColors.bottomLeft : null,
      bottomRight: activeColors.has(cornerColors.bottomRight) ? cornerColors.bottomRight : null,
    };
  }, [cornerColors, gameState.players]);

  const renderPlayerDicePod = (color: PlayerColor | null, pinSide: 'left' | 'right' = 'left') => {
    if (!color) {
      return (
        <div
          className="invisible pointer-events-none select-none"
          style={{
            width: 'clamp(120px, 36vw, 160px)',
            height: '52px',
          }}
        />
      );
    }

    const player = getPlayerByColor(color);
    const isCurrentTurn = activePlayer?.color === color;
    const canRoll =
      isCurrentTurn &&
      !gameState.hasRolled &&
      !gameState.isRolling &&
      !gameState.activeHopToken &&
      (!isOnlineMatch || (color === myOnlineColor && !player?.isBot));

    const onRoll = () => handleRollDice(color);

    return (
      <PlayerDicePod
        color={color}
        player={player}
        isCurrentTurn={isCurrentTurn}
        canRoll={canRoll}
        hasRolled={isCurrentTurn && gameState.hasRolled}
        isRolling={isCurrentTurn && gameState.isRolling}
        diceValue={
          isCurrentTurn && gameState.diceValue !== null
            ? gameState.diceValue
            : playerLastRoll[color]
        }
        consecutiveSixes={isCurrentTurn ? gameState.consecutiveSixes : 0}
        pinSide={pinSide}
        onRollDice={onRoll}
        onDiceClick={onRoll}
        latestChatMessage={activeSpeechBubbles[color]}
        isOnlineMode={isOnlineMatch}
        turnTimeRemaining={isOnlineMatch && isCurrentTurn ? onlineTurnTimeRemaining : undefined}
        boardSkin={activeBoardSkin}
      />
    );
  };

  return (
    <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center font-['Outfit',sans-serif] select-none overflow-x-hidden overflow-y-auto">
      {/* 1. Lobby Screen */}
      {currentScreen === 'lobby' && (
        <GameLobby
          userName={userName}
          userAvatar={userAvatar}
          userCoins={inventory.coins}
          userDiamonds={inventory.diamonds}
          userTrophies={userTrophies}
          userLevel={userLevel}
          userWins={userWins}
          userVipLevel={getPlayerVipLevel(
            inventory.equippedDice,
            inventory.equippedToken,
            inventory.equippedBoard
          )}
          onUpdateUserProfile={handleUpdateUserProfile}
          onStartGame={handleStartGame}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenRules={() => setIsRulesOpen(true)}
          isSoundMuted={isSoundMuted}
          onToggleSound={handleToggleSound}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onOpenOnlineMatch={(count) => {
            if (count) setOnlinePlayerCount(count);
            setShowOnlineMatchModal(true);
          }}
          onOpenFriends={handleOpenFriends}
          onOpenShop={() => setIsShopOpen(true)}
          onAddCoins={handleAddCoins}
          onAddDiamonds={handleAddDiamonds}
          showToast={showToast}
          myPlayerId={myPlayerId}
          onCreatePrivateRoom={handleCreatePrivateRoom}
          onJoinPrivateRoom={handleJoinPrivateRoom}
          onInviteFriend={handleInviteFriend}
        />
      )}

      {/* 2. In-Game Screen */}
      {currentScreen === 'game' && (
        <div
          className="relative w-full h-screen h-[100dvh] max-h-[100dvh] flex flex-col items-center justify-between p-1 sm:p-2 select-none overflow-hidden touch-manipulation bg-[#130d24]"
        >
          {/* Authentic Ludo Game Background with Aurora & Snow when Glacier Eternal is active */}
          <LudoGameBackground boardSkin={activeBoardSkin} />

          {/* Upper Left Side Corner: Compact Back to Lobby Button */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setShowExitConfirm(true);
            }}
            className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-yellow-400 bg-gradient-to-b from-[#1b64b8] to-[#0c3e7d] shadow-[0_4px_14px_rgba(0,0,0,0.6)] flex items-center justify-center active:scale-90 transition-transform text-yellow-300 hover:text-white"
            title="Back to Lobby (पीछे जाएं)"
          >
            <ArrowLeft size={22} className="stroke-[2.5]" />
          </button>

          {/* Upper Right Side Corner: 3-Dot Menu Button */}
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setIsMenuOpen(true);
            }}
            className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-yellow-400 bg-gradient-to-b from-[#1b64b8] to-[#0c3e7d] shadow-[0_4px_14px_rgba(0,0,0,0.6)] flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
            title="3-Dot Menu & Settings"
          >
            <MoreVertical size={20} className="text-yellow-400 stroke-[2.5]" />
          </button>

          {/* Quick Token sound.mp3 Test Button */}
          <button
            onClick={() => {
              soundEffects.playTokenHop(1, true);
              showToast('🎵 Playing Token Step Sound');
            }}
            className="absolute top-2.5 right-14 sm:top-3.5 sm:right-16 z-40 h-10 px-2.5 sm:h-11 sm:px-3 rounded-full border-2 border-yellow-400/80 bg-gradient-to-b from-[#1b64b8] to-[#0c3e7d] shadow-[0_4px_14px_rgba(0,0,0,0.6)] flex items-center justify-center gap-1.5 active:scale-90 transition-transform text-yellow-300 hover:text-white cursor-pointer"
            title="Test Token Step Sound (टोकन साउंड टेस्ट)"
          >
            <Music size={18} className="text-yellow-400 stroke-[2.5]" />
            <span className="text-[11px] font-mono font-bold hidden sm:inline">Token Sound</span>
          </button>

          {/* Exit Game Confirmation Dialog */}
          {showExitConfirm && (
            <div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 select-none font-sans"
              onClick={() => setShowExitConfirm(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xs bg-slate-900 border-2 border-yellow-400/50 rounded-3xl p-5 shadow-2xl flex flex-col items-center gap-4 text-center text-white"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 shadow">
                  <LogOut size={24} />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Exit Game? (गेम छोड़ें?)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Kya aap match chhod kar Lobby me wapas jana chahte hain?
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full mt-1">
                  <button
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setShowExitConfirm(false);
                    }}
                    className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 active:scale-95 transition-all"
                  >
                    Cancel (नहीं)
                  </button>
                  <button
                    onClick={() => {
                      soundEffects.playButtonClick();
                      setShowExitConfirm(false);
                      handleGoHome();
                    }}
                    className="py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-md border border-rose-400/40 active:scale-95 transition-all"
                  >
                    Yes, Exit (हाँ, छोड़ें)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3-Dot / Menu Settings Modal */}
          {isMenuOpen && (
            <div
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
              onClick={() => setIsMenuOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xs bg-slate-900 border-2 border-yellow-500/40 rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 text-white"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h3 className="font-extrabold text-base text-yellow-400 flex items-center gap-2">
                    <span>⚙️</span> Game Settings
                  </h3>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Sound Effects ON / OFF Toggle Switch */}
                <div
                  onClick={handleToggleSound}
                  className="cursor-pointer flex items-center justify-between bg-slate-800/90 hover:bg-slate-800 border border-slate-700 p-3 rounded-2xl transition-all select-none"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        isSoundMuted ? 'bg-rose-950/80 text-rose-400' : 'bg-emerald-950/80 text-emerald-400'
                      }`}
                    >
                      {isSoundMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-100">Sound Effects</div>
                      <div className="text-[10px] text-slate-400">
                        {isSoundMuted ? 'Off (ध्वनि बंद)' : 'On (ध्वनि चालू)'}
                      </div>
                    </div>
                  </div>

                  {/* Interactive ON / OFF Switch */}
                  <div
                    className={`relative w-14 h-7 rounded-full transition-colors flex items-center px-1 font-bold text-xs ${
                      isSoundMuted ? 'bg-slate-700 justify-start' : 'bg-emerald-500 justify-end'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center text-[9px] font-black ${
                        isSoundMuted ? 'text-slate-800' : 'text-emerald-700'
                      }`}
                    >
                      {isSoundMuted ? 'OFF' : 'ON'}
                    </div>
                  </div>
                </div>

                {/* Full Screen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="w-full flex items-center justify-between bg-slate-800/90 hover:bg-slate-800 border border-slate-700 p-3 rounded-2xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400">
                      {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </div>
                    <span className="font-bold text-sm text-slate-100">Full Screen</span>
                  </div>
                  <span className="text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                    {isFullscreen ? 'Exit' : 'Enter'}
                  </span>
                </button>

                {/* Rules & Guide */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsRulesOpen(true);
                  }}
                  className="w-full flex items-center justify-between bg-slate-800/90 hover:bg-slate-800 border border-slate-700 p-3 rounded-2xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-sky-950/80 text-sky-400">
                      <span>📜</span>
                    </div>
                    <span className="font-bold text-sm text-slate-100">Game Rules</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">View</span>
                </button>

                {/* Exit to Lobby */}
                <button
                  onClick={() => {
                    soundEffects.playButtonClick();
                    setIsMenuOpen(false);
                    handleGoHome();
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold p-2.5 rounded-2xl transition-all text-xs"
                >
                  <LogOut size={16} /> Exit to Lobby
                </button>
              </div>
            </div>
          )}

          {/* Main Game Stage */}
          <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center my-auto min-h-0 py-0.5">
            {/* Top Row: Opponents above board - attached directly to their own home quadrant */}
            <div className="w-full max-w-[min(96vw,calc(100dvh-135px),640px)] flex items-center justify-between px-0.5 shrink-0 z-10 mb-[-3px] sm:mb-[-4px]">
              {renderPlayerDicePod(podLayout.topLeft, 'left')}
              {renderPlayerDicePod(podLayout.topRight, 'right')}
            </div>

            {/* Central 15x15 Ludo Board with dynamic perspective rotation */}
            <LudoBoard
              players={gameState.players}
              currentTurnColor={activePlayer?.color || 'blue'}
              validTokenMoves={gameState.validTokenMoves}
              canMoveToken={gameState.hasRolled && isMyTurn}
              activeHopToken={gameState.activeHopToken}
              onSelectToken={handleSelectToken}
              rotationDeg={boardRotation}
              isOnlineMode={isOnlineMatch}
              boardSkin={activeBoardSkin}
              frozenCapture={frozenCapture}
            />

            {/* Bottom Row: Local player (Me) below board - attached directly to own home quadrant */}
            <div className="w-full max-w-[min(96vw,calc(100dvh-135px),640px)] flex items-center justify-between px-0.5 shrink-0 z-10 mt-[-3px] sm:mt-[-4px]">
              {renderPlayerDicePod(podLayout.bottomLeft, 'left')}
              {renderPlayerDicePod(podLayout.bottomRight, 'right')}
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        currentPlayerName={userName}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUser={{
          name: userName,
          avatar: userAvatar,
          coins: userCoins,
          wins: userWins,
          totalGames: userTotalGames,
          trophies: userTrophies,
        }}
      />

      <RuleGuideModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      <WinnerCelebrationModal
        isOpen={isWinnerModalOpen}
        winners={gameState.winners}
        players={gameState.players}
        isOnlineMatch={isOnlineMatch}
        isTimeoutWin={lastWinWasTimeout}
        rematchState={rematchState}
        onPlayAgain={handleRematchClick}
        onGoHome={handleGoHome}
        activeBoardSkin={activeBoardSkin}
        userOwnsGlacier={Boolean(inventory.ownedBoards?.includes('glacier_eternal'))}
        onShareForDiamond={handleShareForFreeDiamond}
        onOpenShop={() => {
          setIsWinnerModalOpen(false);
          setIsShopOpen(true);
        }}
      />

      {/* Online Matchmaking Modal */}
      <OnlineMatchModal
        isOpen={showOnlineMatchModal}
        onClose={() => {
          setShowOnlineMatchModal(false);
          setOnlineSearchState('idle');
        }}
        currentName={userName}
        currentAvatar={userAvatar}
        onSaveProfile={handleUpdateUserProfile}
        onStartSearch={handleStartOnlineSearch}
        onCancelSearch={handleCancelOnlineSearch}
        searchState={onlineSearchState}
        matchedData={matchedOnlineData}
        selectedPlayerCount={onlinePlayerCount}
        onPlayerCountChange={(count) => setOnlinePlayerCount(count)}
      />

      {/* Opponent Left / Disconnected Modal */}
      <OpponentLeftModal
        isOpen={showOpponentLeftModal}
        opponentName={onlineMatchPlayers.find((p) => p.color !== myOnlineColor && !p.isBot)?.name || 'Opponent'}
        onGoHome={handleLeaveOnlineGame}
        onPlayAgainOnline={() => {
          handleLeaveOnlineGame();
          setTimeout(() => {
            setShowOnlineMatchModal(true);
            handleStartOnlineSearch(userName, userAvatar, onlinePlayerCount);
          }, 400);
        }}
      />

      {/* Friends & Recent Players Modal (Direct In-Game Invite with Real-Time Firebase) */}
      <FriendsModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
        onInvitePlayer={handleInviteFriend}
        initialPlayerCount={onlinePlayerCount}
        myPlayerId={myPlayerId}
      />

      {/* Direct In-Game Invite Waiting Popup with 15s timer */}
      <InviteWaitingModal
        isOpen={isInviteWaitingOpen}
        onClose={() => setIsInviteWaitingOpen(false)}
        invitedPlayer={invitedPlayer}
        playerCount={invitePlayerCount}
        onAccepted={handleInviteAccepted}
        onPlayWithBotsFallback={handlePlayWithBotsFallback}
        myPlayer={{ id: myPlayerId, name: userName, avatar: userAvatar }}
      />

      {/* Real-time Incoming Match Invite Dialog from Firebase */}
      {incomingInvite && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/80 rounded-3xl p-5 shadow-[0_0_50px_rgba(16,185,129,0.35)] flex flex-col items-center gap-4 text-center text-white">
            <div className="relative">
              <img
                src={incomingInvite.fromPlayerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80'}
                alt=""
                className="w-16 h-16 rounded-2xl border-2 border-emerald-400 object-cover shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                🎮 Real-time Match Invite
              </span>
              <h3 className="font-black text-lg text-white mt-1.5">{incomingInvite.fromPlayerName}</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                aapko <span className="font-bold text-yellow-300">{incomingInvite.playerCount}P Ludo Match</span> me challenge kar rahe hain!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 w-full mt-1">
              <button
                onClick={() => {
                  soundEffects.playButtonClick();
                  respondToMatchInvite(incomingInvite.id, false);
                  setIncomingInvite(null);
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 cursor-pointer active:scale-95 transition-all"
              >
                Decline (नहीं)
              </button>
              <button
                onClick={() => {
                  soundEffects.playButtonClick();
                  respondToMatchInvite(incomingInvite.id, true);
                  const inv = incomingInvite;
                  setIncomingInvite(null);
                  handleInviteAccepted(
                    {
                      id: inv.fromPlayerId,
                      name: inv.fromPlayerName,
                      avatar: inv.fromPlayerAvatar,
                      lastPlayed: Date.now(),
                      gamesPlayedWith: 1,
                      isOnline: true,
                    },
                    inv.playerCount,
                    inv.roomId
                  );
                }}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg border border-emerald-400/50 cursor-pointer active:scale-95 transition-all"
              >
                Accept &amp; Play 🚀
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 9. Ludo Upgrade Shop Modal (Fire Pro & 100-Diamond Glacier Dream System) */}
      <UpgradeShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        inventory={inventory}
        onUpdateInventory={handleUpdateInventory}
        playerId={myPlayerId}
        onClaimDailyReward={handleClaimDailyReward}
        onTestGlacierEntry={() => {
          setIsShopOpen(false);
          setIsGlacierPreviewActive(true);
          if (currentScreen !== 'game') {
            handleStartGame(
              'local',
              'classic',
              2,
              [userName || 'Glacier King 👑', 'Player 2'],
              ['red', 'yellow']
            );
          }
          triggerGlacierKingEntry(userName || 'GLACIER EMPEROR', true);
        }}
      />

      {/* 10. BAB RE BAB EFFECT: SLEEK TOP FLOATING BANNER (NO SCREEN FREEZE / 60 FPS) */}
      {glacierEntryBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-[92%] pointer-events-none select-none animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="rounded-2xl p-3 text-center border-2 border-cyan-200 bg-gradient-to-r from-cyan-950/95 via-sky-950/95 to-slate-950/95 shadow-[0_4px_25px_rgba(34,211,238,0.7)] flex items-center justify-between gap-2.5">
            <div className="text-2xl shrink-0">❄️👑</div>
            <div className="text-left flex-1">
              <div className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-sky-300 uppercase tracking-wide">
                ❄️ GLACIER KING ENTERED ❄️
              </div>
              <div className="text-[10px] font-bold text-amber-300">
                👑 {glacierEntryBanner.kingName} Entered the Arena!
              </div>
            </div>
            <div className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-300 text-[9px] font-black text-cyan-200 uppercase shrink-0">
              100💎 DREAM
            </div>
          </div>
        </div>
      )}

      {/* 11. DUSRO KO POPUP: FOMO MODAL FOR GLACIER DREAM BOARD */}
      {showGlacierFomoPopup && (
        <div
          onClick={() => setShowGlacierFomoPopup(false)}
          className="fixed inset-0 z-[115] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl p-5 bg-gradient-to-b from-[#041e42] via-[#072b5e] to-[#031229] border-2 border-cyan-300 shadow-[0_0_60px_rgba(34,211,238,0.65)] text-center flex flex-col items-center gap-3 text-white"
          >
            <div className="text-4xl">😭❄️💎</div>
            <div className="px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-300 text-[10px] font-black text-amber-200 uppercase tracking-wider">
              🌟 DREAM COLLECTION - 100 DIAMONDS 🌟
            </div>
            <h3 className="text-base sm:text-lg font-black text-cyan-100 leading-snug">
              😭 Ye sapno wala board chahiye? 100💎 jama karo! Share karke diamond pao!
            </h3>
            <p className="text-xs text-cyan-200/80 font-bold">
              Har koi dekhega, koi koi hi paayega! Kya aap King ho? ({inventory.diamonds || 0}/100 💎)
            </p>
            <div className="grid grid-cols-2 gap-2.5 w-full mt-1">
              <button
                onClick={() => {
                  handleShareForFreeDiamond();
                  setShowGlacierFomoPopup(false);
                }}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                📲 Share = Free 💎
              </button>
              <button
                onClick={() => {
                  setShowGlacierFomoPopup(false);
                  setIsShopOpen(true);
                }}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                ❄️ Open Shop
              </button>
            </div>
            <button
              onClick={() => setShowGlacierFomoPopup(false)}
              className="text-[11px] font-bold text-slate-400 hover:text-white mt-1 cursor-pointer"
            >
              Continue Playing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

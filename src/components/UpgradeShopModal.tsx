import React, { useState } from 'react';
import {
  X,
  Flame,
  Crown,
  Sparkles,
  Zap,
  Snowflake,
  Coins,
  Gift,
  Check,
  Lock,
  Share2,
  Eye,
} from 'lucide-react';
import { soundEffects } from '../utils/audioSynthesizer';
import {
  DICE_SKINS,
  TOKEN_SKINS,
  BOARD_SKINS,
  DiceSkinId,
  TokenSkinId,
  BoardSkinId,
  ShopItem,
  PlayerInventory,
  getPlayerVipLevel,
  DAILY_EXCHANGE_LIMIT,
  saveLocalInventory,
} from '../types/shop';
import { saveInventoryToFirebase } from '../lib/firebase';
import { LudoToken } from './LudoToken';
import { getTimeUntilMidnight, getTodayDateString } from '../utils/rewardsHelper';

interface UpgradeShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: PlayerInventory;
  onUpdateInventory: (newInv: PlayerInventory) => void;
  playerId?: string;
  onClaimDailyReward?: () => void;
  onTestGlacierEntry?: () => void;
}

export const UpgradeShopModal: React.FC<UpgradeShopModalProps> = React.memo(({
  isOpen,
  onClose,
  inventory,
  onUpdateInventory,
  playerId = 'user',
  onClaimDailyReward,
  onTestGlacierEntry,
}) => {
  const [activeTab, setActiveTab] = useState<'board' | 'dice' | 'token'>('board');
  const [purchaseToast, setPurchaseToast] = useState<string | null>(null);

  // Exchange Animation State: "Coins gir ke diamond bane"
  const [exchangeAnim, setExchangeAnim] = useState<{
    active: boolean;
    diamondsWon: number;
    coinsSpent: number;
  } | null>(null);

  if (!isOpen) return null;

  const now = Date.now();
  const lastDaily = inventory.lastDailyClaimTime || 0;
  const isDailyReady = !lastDaily || now - lastDaily >= 24 * 3600 * 1000;
  const remainingHours = Math.max(1, Math.ceil((24 * 3600 * 1000 - (now - lastDaily)) / (3600 * 1000)));

  // Daily exchange check
  const todayStr = getTodayDateString();
  const usedExchangesToday =
    inventory.lastExchangeDate === todayStr ? inventory.dailyExchangeCount || 0 : 0;
  const remainingExchanges = Math.max(0, DAILY_EXCHANGE_LIMIT - usedExchangesToday);

  const userDiamonds = inventory.diamonds || 0;
  const ownedBoards = inventory.ownedBoards || ['classic'];
  const equippedBoard = inventory.equippedBoard || 'classic';
  const isGlacierOwned = ownedBoards.includes('glacier_eternal');
  const isGlacierEquipped = equippedBoard === 'glacier_eternal';

  const currentVipLevel = getPlayerVipLevel(
    inventory.equippedDice,
    inventory.equippedToken,
    equippedBoard
  );

  const showToast = (msg: string) => {
    setPurchaseToast(msg);
    setTimeout(() => setPurchaseToast(null), 3200);
  };

  // 1. EXCHANGE SYSTEM: 1000 Coins = 1💎 | 10000 Coins = 12💎
  const handleExchangeCoinsToDiamonds = (coinsCost: number, diamondsReward: number) => {
    soundEffects.playButtonClick();

    if (remainingExchanges <= 0) {
      soundEffects.playError();
      showToast('❌ Daily Limit Reached! (5/5 Exchanges Done Today - Kal Aana Ji!)');
      return;
    }

    if (inventory.coins < coinsCost) {
      soundEffects.playError();
      showToast(
        `❌ Insufficient Coins! Need 🪙 ${coinsCost.toLocaleString()} Coins (You have 🪙 ${inventory.coins.toLocaleString()}).`
      );
      return;
    }

    const newCoins = inventory.coins - coinsCost;
    const newDiamonds = userDiamonds + diamondsReward;
    const newCount = usedExchangesToday + 1;

    const newInv: PlayerInventory = {
      ...inventory,
      coins: newCoins,
      diamonds: newDiamonds,
      dailyExchangeCount: newCount,
      lastExchangeDate: todayStr,
    };

    onUpdateInventory(newInv);
    saveLocalInventory(newInv, playerId);
    saveInventoryToFirebase(playerId, newInv);

    // Trigger "Coins gir ke diamond bane" sound + animation
    soundEffects.playDiamondExchange();
    setExchangeAnim({
      active: true,
      diamondsWon: diamondsReward,
      coinsSpent: coinsCost,
    });
    setTimeout(() => {
      setExchangeAnim(null);
    }, 1400);

    showToast(
      `💎 +${diamondsReward} DIAMOND${diamondsReward > 1 ? 'S' : ''} CREATED! (${DAILY_EXCHANGE_LIMIT - newCount}/5 Daily Exchanges Left)`
    );
  };

  // Share on WhatsApp = +1 Diamond when friend opens/installs
  const handleShareForFreeDiamond = () => {
    soundEffects.playButtonClick();
    const referralUrl = `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(playerId)}`;
    const shareText = `❄️👑 Trying to unlock the 100💎 GLACIER ETERNAL - DREAM OF KINGS Board in Ludo Headmaster! Join & play with me: ${referralUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

    try {
      if (navigator.share) {
        navigator
          .share({
            title: 'Ludo Headmaster - Glacier Eternal',
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
  };

  // Buy or Equip Glacier Eternal Dream Board (100 Diamonds)
  const handleGlacierDreamAction = () => {
    soundEffects.playButtonClick();

    if (isGlacierOwned) {
      const newInv: PlayerInventory = {
        ...inventory,
        equippedBoard: 'glacier_eternal',
        equippedDice: 'glacier_eternal',
        equippedToken: 'glacier_eternal',
      };
      onUpdateInventory(newInv);
      saveLocalInventory(newInv, playerId);
      saveInventoryToFirebase(playerId, newInv);
      soundEffects.playGlacierCrack();
      showToast('❄️👑 EQUIPPED GLACIER ETERNAL - DREAM OF KINGS! 👑❄️');
      return;
    }

    if (userDiamonds < 100) {
      soundEffects.playError();
      showToast(
        `🔒 YE SABKA SAPNA HAI! 100💎 CHAHIYE! (Your Progress: ${userDiamonds}/100 💎)`
      );
      return;
    }

    // Unlock Glacier Eternal Board + matching Ice Cube Dice + Diamond Heera Token!
    const newDiamonds = userDiamonds - 100;
    const newOwnedBoards = Array.from(new Set([...ownedBoards, 'glacier_eternal' as BoardSkinId]));
    const newOwnedDice = Array.from(
      new Set([...inventory.ownedDice, 'glacier_eternal' as DiceSkinId])
    );
    const newOwnedTokens = Array.from(
      new Set([...inventory.ownedTokens, 'glacier_eternal' as TokenSkinId])
    );

    const newInv: PlayerInventory = {
      ...inventory,
      diamonds: newDiamonds,
      ownedBoards: newOwnedBoards,
      ownedDice: newOwnedDice,
      ownedTokens: newOwnedTokens,
      equippedBoard: 'glacier_eternal',
      equippedDice: 'glacier_eternal',
      equippedToken: 'glacier_eternal',
    };

    onUpdateInventory(newInv);
    saveLocalInventory(newInv, playerId);
    saveInventoryToFirebase(playerId, newInv);
    soundEffects.playGlacierCrack();
    soundEffects.playWinFanfare();
    showToast('❄️👑 CONGRATULATIONS! GLACIER ETERNAL UNLOCKED & EQUIPPED! 👑❄️');
  };

  const handleBuyOrEquip = (item: ShopItem) => {
    soundEffects.playButtonClick();
    const isDiamondItem = item.currency === 'diamonds';

    if (item.category === 'board') {
      if (item.id === 'glacier_eternal') {
        handleGlacierDreamAction();
        return;
      }
      const isOwned = ownedBoards.includes(item.id as BoardSkinId);
      if (isOwned) {
        const newInv: PlayerInventory = {
          ...inventory,
          equippedBoard: item.id as BoardSkinId,
        };
        onUpdateInventory(newInv);
        saveLocalInventory(newInv, playerId);
        saveInventoryToFirebase(playerId, newInv);
        soundEffects.playHomeEntry();
        showToast(`✓ Equipped ${item.name}!`);
        return;
      }

      if (userDiamonds < item.price) {
        soundEffects.playError();
        showToast(`❌ Need ${item.price} 💎 Diamonds! Exchange Coins or Share to get Diamonds.`);
        return;
      }

      const newDiamonds = userDiamonds - item.price;
      const newOwnedBoards = [...ownedBoards, item.id as BoardSkinId];
      const newInv: PlayerInventory = {
        ...inventory,
        diamonds: newDiamonds,
        ownedBoards: newOwnedBoards,
        equippedBoard: item.id as BoardSkinId,
      };
      onUpdateInventory(newInv);
      saveLocalInventory(newInv, playerId);
      saveInventoryToFirebase(playerId, newInv);
      soundEffects.playWinFanfare();
      showToast(`🎉 Purchased & Equipped ${item.name}!`);
      return;
    }

    if (item.category === 'dice') {
      const isOwned = inventory.ownedDice.includes(item.id as DiceSkinId);
      if (isOwned) {
        const newInv: PlayerInventory = {
          ...inventory,
          equippedDice: item.id as DiceSkinId,
        };
        onUpdateInventory(newInv);
        saveLocalInventory(newInv, playerId);
        saveInventoryToFirebase(playerId, newInv);
        soundEffects.playHomeEntry();
        showToast(`✓ Equipped ${item.name}!`);
        return;
      }

      if (isDiamondItem) {
        if (userDiamonds < item.price) {
          soundEffects.playError();
          showToast(`❌ Insufficient Diamonds! Need ${item.price} 💎.`);
          return;
        }
        const newInv: PlayerInventory = {
          ...inventory,
          diamonds: userDiamonds - item.price,
          ownedDice: [...inventory.ownedDice, item.id as DiceSkinId],
          equippedDice: item.id as DiceSkinId,
        };
        onUpdateInventory(newInv);
        saveLocalInventory(newInv, playerId);
        saveInventoryToFirebase(playerId, newInv);
        soundEffects.playWinFanfare();
        showToast(`🎉 Purchased & Equipped ${item.name}!`);
        return;
      }

      if (inventory.coins < item.price) {
        soundEffects.playError();
        showToast(`❌ Insufficient Coins! Need 🪙 ${item.price.toLocaleString()} coins.`);
        return;
      }

      const newCoins = inventory.coins - item.price;
      const newOwned = [...inventory.ownedDice, item.id as DiceSkinId];
      const newInv: PlayerInventory = {
        ...inventory,
        coins: newCoins,
        ownedDice: newOwned,
        equippedDice: item.id as DiceSkinId,
      };
      onUpdateInventory(newInv);
      saveLocalInventory(newInv, playerId);
      saveInventoryToFirebase(playerId, newInv);
      soundEffects.playWinFanfare();
      showToast(`🎉 Purchased & Equipped ${item.name}!`);
    } else {
      // Token skin
      const isOwned = inventory.ownedTokens.includes(item.id as TokenSkinId);
      if (isOwned) {
        const newInv: PlayerInventory = {
          ...inventory,
          equippedToken: item.id as TokenSkinId,
        };
        onUpdateInventory(newInv);
        saveLocalInventory(newInv, playerId);
        saveInventoryToFirebase(playerId, newInv);
        soundEffects.playHomeEntry();
        showToast(`✓ Equipped ${item.name}!`);
        return;
      }

      if (isDiamondItem) {
        if (userDiamonds < item.price) {
          soundEffects.playError();
          showToast(`❌ Insufficient Diamonds! Need ${item.price} 💎.`);
          return;
        }
        const newInv: PlayerInventory = {
          ...inventory,
          diamonds: userDiamonds - item.price,
          ownedTokens: [...inventory.ownedTokens, item.id as TokenSkinId],
          equippedToken: item.id as TokenSkinId,
        };
        onUpdateInventory(newInv);
        saveLocalInventory(newInv, playerId);
        saveInventoryToFirebase(playerId, newInv);
        soundEffects.playWinFanfare();
        showToast(`🎉 Purchased & Equipped ${item.name}!`);
        return;
      }

      if (inventory.coins < item.price) {
        soundEffects.playError();
        showToast(`❌ Insufficient Coins! Need 🪙 ${item.price.toLocaleString()} coins.`);
        return;
      }

      const newCoins = inventory.coins - item.price;
      const newOwned = [...inventory.ownedTokens, item.id as TokenSkinId];
      const newInv: PlayerInventory = {
        ...inventory,
        coins: newCoins,
        ownedTokens: newOwned,
        equippedToken: item.id as TokenSkinId,
      };
      onUpdateInventory(newInv);
      saveLocalInventory(newInv, playerId);
      saveInventoryToFirebase(playerId, newInv);
      soundEffects.playWinFanfare();
      showToast(`🎉 Purchased & Equipped ${item.name}!`);
    }
  };

  const renderDicePreview = (diceId: string) => {
    switch (diceId) {
      case 'glacier_eternal':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-200 via-sky-400 to-blue-700 flex items-center justify-center border-2 border-white shadow-[0_0_12px_#38bdf8] relative">
            <span className="text-xl">🧊</span>
            <span className="absolute -top-1 -right-1 text-[10px]">❄️</span>
          </div>
        );
      case 'fire':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 flex items-center justify-center border-2 border-yellow-300 shadow-[0_0_12px_#f97316]">
            <span className="text-xl">🔥</span>
          </div>
        );
      case 'golden_fire':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 flex items-center justify-center border-2 border-yellow-200 shadow-[0_0_12px_#facc15]">
            <span className="text-xl">👑</span>
          </div>
        );
      case 'diamond_inferno':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-700 flex items-center justify-center border-2 border-cyan-200 shadow-[0_0_12px_#06b6d4]">
            <span className="text-xl">💎</span>
          </div>
        );
      case 'neon_matrix':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-lime-300 via-emerald-500 to-green-800 flex items-center justify-center border-2 border-lime-300 shadow-[0_0_12px_#84cc16]">
            <span className="text-xl">⚡</span>
          </div>
        );
      case 'royal_amethyst':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-400 via-purple-600 to-indigo-900 flex items-center justify-center border-2 border-fuchsia-300 shadow-[0_0_12px_#c026d3]">
            <span className="text-xl">🔮</span>
          </div>
        );
      case 'cosmic_galaxy':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 via-purple-600 to-slate-900 flex items-center justify-center border-2 border-pink-300 shadow-[0_0_12px_#ec4899]">
            <span className="text-xl">🌌</span>
          </div>
        );
      case 'dragon_blood':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-red-700 to-zinc-950 flex items-center justify-center border-2 border-rose-400 shadow-[0_0_12px_#f43f5e]">
            <span className="text-xl">🐉</span>
          </div>
        );
      case 'emerald_king':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-300 via-teal-500 to-emerald-900 flex items-center justify-center border-2 border-emerald-300 shadow-[0_0_12px_#10b981]">
            <span className="text-xl">❇️</span>
          </div>
        );
      case 'rainbow_prism':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 via-yellow-400 via-emerald-400 to-indigo-600 flex items-center justify-center border-2 border-yellow-200 shadow-[0_0_12px_#f59e0b]">
            <span className="text-xl">🌈</span>
          </div>
        );
      case 'normal':
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-slate-600 flex items-center justify-center shadow-inner">
            <span className="text-xl text-white font-black">🎲</span>
          </div>
        );
    }
  };

  const renderTokenPreview = (tokenId: string) => {
    return (
      <div className="w-12 h-14 flex items-center justify-center relative">
        <div className="w-10 h-12">
          <LudoToken
            color="blue"
            tokenId={0}
            isMovable={false}
            showRing={false}
            tokenSkin={tokenId}
          />
        </div>
      </div>
    );
  };

  const renderBoardPreview = (boardId: string) => {
    switch (boardId) {
      case 'glacier_eternal':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-900 border-2 border-white shadow-[0_0_12px_#38bdf8] flex items-center justify-center relative">
            <span className="text-xl">❄️</span>
            <span className="absolute -bottom-1 -right-1 text-[10px]">👑</span>
          </div>
        );
      case 'emerald_palace':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-600 to-emerald-950 border-2 border-emerald-300 shadow-[0_0_10px_#10b981] flex items-center justify-center">
            <span className="text-xl">❇️</span>
          </div>
        );
      case 'lava_citadel':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 via-red-600 to-zinc-950 border-2 border-orange-400 shadow-[0_0_10px_#f97316] flex items-center justify-center">
            <span className="text-xl">🌋</span>
          </div>
        );
      case 'cyber_neon':
        return (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-700 to-indigo-950 border-2 border-fuchsia-300 shadow-[0_0_10px_#a855f7] flex items-center justify-center">
            <span className="text-xl">⚡</span>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-slate-600 flex items-center justify-center">
            <span className="text-xl">🎲</span>
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 select-none font-sans overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[94dvh] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-2 border-yellow-500/80 rounded-3xl p-3.5 sm:p-5 shadow-[0_0_50px_rgba(56,189,248,0.3)] flex flex-col gap-2.5 relative overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* COINS GIR KE DIAMOND BANE - ANIMATION OVERLAY */}
        {exchangeAnim?.active && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150">
            <div className="relative w-56 h-56 flex flex-col items-center justify-center">
              {/* Bursting Crystal Diamond */}
              <div className="relative z-10 w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-300 via-sky-500 to-blue-800 border-2 border-white shadow-[0_0_40px_#38bdf8] flex items-center justify-center animate-bounce">
                <span className="text-5xl drop-shadow-[0_0_12px_#ffffff]">💎</span>
                <Sparkles className="absolute -top-3 -right-3 text-yellow-300" size={24} />
              </div>

              <div className="mt-4 text-center">
                <div className="text-lg font-black text-cyan-300 uppercase tracking-wider drop-shadow">
                  +{exchangeAnim.diamondsWon} DIAMOND{exchangeAnim.diamondsWon > 1 ? 'S' : ''} 💎
                </div>
                <div className="text-xs font-bold text-yellow-300">
                  {exchangeAnim.coinsSpent > 0
                    ? `🪙 ${exchangeAnim.coinsSpent.toLocaleString()} Coins Transformed Into Diamond!`
                    : '🎁 Free Share Diamond Added!'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-700 flex items-center justify-center text-white shadow-[0_0_15px_#38bdf8] border border-white/60">
              <Snowflake size={22} className="animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white leading-tight flex items-center gap-1.5">
                <span>VIP ROYAL &amp; GLACIER DREAM SHOP</span>
                <span className="text-[10px] bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black px-1.5 py-0.2 rounded-md">
                  100💎 KING
                </span>
              </h2>
              <p className="text-[10px] text-cyan-300 font-bold">
                Har koi dekhega, koi koi hi paayega! Kya aap King ho?
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

        {/* DUAL CURRENCY BAR: COINS 🪙 + DIAMONDS 💎 + VIP RANK */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/95 border border-cyan-500/40 rounded-2xl px-3 py-2 shadow-inner shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-amber-500/15 border border-yellow-400/50 px-2.5 py-1 rounded-xl">
              <span className="text-xs font-black text-yellow-300 tabular-nums">
                🪙 {inventory.coins.toLocaleString()} Coins
              </span>
            </div>

            <div className="flex items-center gap-1 bg-cyan-500/20 border border-cyan-400/70 px-2.5 py-1 rounded-xl shadow-[0_0_10px_rgba(56,189,248,0.25)]">
              <span className="text-xs font-black text-cyan-200 tabular-nums">
                💎 {userDiamonds} Diamonds
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 px-2 py-0.5 rounded-lg shadow border border-yellow-200">
              👑 VIP {currentVipLevel}
            </span>

            {onClaimDailyReward && (
              <button
                onClick={() => onClaimDailyReward()}
                disabled={!isDailyReady}
                className={`py-1 px-2 rounded-xl font-black text-[10px] flex items-center gap-1 shadow transition-all cursor-pointer active:scale-95 ${
                  isDailyReady
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 animate-pulse'
                    : 'bg-slate-800/80 text-slate-400 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <Gift size={12} />
                <span>{isDailyReady ? '+100 🪙' : `${remainingHours}h`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Toast Notification */}
        {purchaseToast && (
          <div className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-400 via-yellow-300 to-amber-400 text-slate-950 font-black text-xs text-center shadow-lg animate-in fade-in duration-200 shrink-0">
            {purchaseToast}
          </div>
        )}

        {/* ===================================================================== */}
        {/* SABSE UPAR ALAG SECTION: 🌟 DREAM COLLECTION - 100 DIAMONDS 🌟         */}
        {/* ===================================================================== */}
        <div className="relative rounded-2xl p-3 bg-gradient-to-b from-cyan-950/90 via-blue-950/95 to-slate-950 border-2 border-yellow-400 glacier-dream-frame overflow-hidden shrink-0">
          {/* Section Header */}
          <div className="text-center mb-2">
            <div className="inline-block px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_#facc15] border border-white">
              🌟 DREAM COLLECTION - 100 DIAMONDS 🌟
            </div>
            <h3 className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-white to-yellow-300 mt-1 drop-shadow">
              ❄️ GLACIER ETERNAL - DREAM OF KINGS 👑
            </h3>
            <div className="text-[10px] font-black text-cyan-300">
              💎 ULTIMATE DREAM - 100 DIAMONDS ONLY (1,00,000 Coins Value!)
            </div>
          </div>

          {/* Live Mini Preview of Glacier Board + 4 Diamond Heera Gotis + Ice Cube Dice */}
          <div className="grid grid-cols-3 gap-2 items-center bg-slate-950/85 border border-cyan-400/50 rounded-xl p-2 mb-2 shadow-inner">
            {/* 1. Transparent Glacier Crystal Board Preview */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-300/80 via-sky-500/70 to-blue-900/90 border-2 border-cyan-100 shadow-[0_0_12px_#38bdf8] flex items-center justify-center relative">
                <span className="text-xl">❄️</span>
                <span className="absolute -bottom-1 px-1 bg-cyan-950 text-[7px] font-black text-cyan-200 rounded border border-cyan-400">
                  ICE BOARD
                </span>
              </div>
              <span className="text-[9px] text-cyan-200 font-bold mt-1">Blue Glow + Mist</span>
            </div>

            {/* 2. 4 Sparkling Diamond Heera Gotis (Blue, Green, Red, Yellow) */}
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center justify-center -space-x-1.5 h-12">
                {(['blue', 'green', 'red', 'yellow'] as const).map((col, idx) => (
                  <div key={col} className="w-7 h-9">
                    <LudoToken
                      color={col}
                      tokenId={idx}
                      isMovable={false}
                      showRing={false}
                      tokenSkin="glacier_eternal"
                    />
                  </div>
                ))}
              </div>
              <span className="text-[9px] text-yellow-300 font-bold mt-1">4 Heera Goti 💎</span>
            </div>

            {/* 3. Ice Cube Dice + Freeze Kill Effect */}
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white via-cyan-300 to-sky-600 border-2 border-white shadow-[0_0_12px_#38bdf8] flex items-center justify-center relative">
                <span className="text-xl">🧊</span>
                <span className="absolute -top-1 -right-1 text-[10px]">❄️</span>
              </div>
              <span className="text-[9px] text-cyan-200 font-bold mt-1">Ice Dice + 1s Freeze</span>
            </div>
          </div>

          {/* Lock & Progress Box */}
          <div className="bg-slate-950/90 border border-yellow-400/50 rounded-xl p-2 mb-2 text-center">
            {!isGlacierOwned ? (
              <>
                <div className="text-[10px] font-black text-amber-300 leading-tight">
                  🔒 YE SABKA SAPNA HAI! 100💎 CHAHIYE - SIRF KING LE SAKTA HAI!
                </div>
                <div className="text-[11px] font-black text-white mt-1 tabular-nums">
                  100/100 Diamonds Needed - Your Progress: <span className="text-cyan-300">{userDiamonds}/100 💎</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-1.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-yellow-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, userDiamonds)}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="text-xs font-black text-emerald-400">
                👑 YOU ARE A GLACIER KING! DREAM BOARD UNLOCKED! ❄️
              </div>
            )}
            <div className="text-[9px] text-slate-300 italic mt-1">
              &ldquo;Har koi dekhega, koi koi hi paayega! Kya aap King ho?&rdquo;
            </div>
          </div>

          {/* Action Buttons inside Dream Collection */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={handleGlacierDreamAction}
              className={`col-span-2 py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg cursor-pointer active:scale-95 transition-all ${
                isGlacierEquipped
                  ? 'bg-emerald-500 text-slate-950 border border-white'
                  : isGlacierOwned
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 border border-white'
                  : userDiamonds >= 100
                  ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-cyan-400 text-slate-950 border-2 border-white animate-pulse'
                  : 'bg-gradient-to-r from-amber-500/30 via-cyan-600/30 to-blue-700/30 text-yellow-200 border border-yellow-400/60'
              }`}
            >
              {isGlacierEquipped ? (
                <>
                  <Check size={14} />
                  <span>❄️ GLACIER ETERNAL EQUIPPED 👑</span>
                </>
              ) : isGlacierOwned ? (
                <span>❄️ EQUIP GLACIER ETERNAL BOARD 👑</span>
              ) : (
                <>
                  <Lock size={13} />
                  <span>UNLOCK GLACIER DREAM BOARD (100 💎)</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareForFreeDiamond}
              className="py-1.5 px-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black text-[10px] flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95 border border-white/80"
            >
              <Share2 size={12} />
              <span>Share = Free Diamond 💎</span>
            </button>

            {onTestGlacierEntry ? (
              <button
                onClick={() => {
                  soundEffects.playButtonClick();
                  onTestGlacierEntry();
                }}
                className="py-1.5 px-2 rounded-xl bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 font-black text-[10px] flex items-center justify-center gap-1 border border-cyan-400/60 cursor-pointer active:scale-95"
              >
                <Eye size={12} />
                <span>❄️ Test King Entry</span>
              </button>
            ) : (
              <button
                onClick={() => handleExchangeCoinsToDiamonds(1000, 1)}
                className="py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center gap-1 border border-white/80 cursor-pointer active:scale-95"
              >
                <span>Get 💎 (1000🪙 = 1💎)</span>
              </button>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 1. EXCHANGE SYSTEM UPDATE (1000 Coins = 1💎 | 10000 Coins = 12💎)      */}
        {/* ===================================================================== */}
        <div className="bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-2.5 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1">
              <span>💎 COIN TO DIAMOND EXCHANGE</span>
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                remainingExchanges > 0
                  ? 'bg-amber-500/20 text-yellow-300 border-yellow-400/50'
                  : 'bg-rose-950 text-rose-300 border-rose-500/50'
              }`}
            >
              🔥 Daily Limit: {remainingExchanges}/{DAILY_EXCHANGE_LIMIT} Left
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {/* Button 1: EXCHANGE 1000 COINS = 1 DIAMOND 💎 */}
            <button
              onClick={() => handleExchangeCoinsToDiamonds(1000, 1)}
              disabled={remainingExchanges <= 0}
              className={`py-2 px-2.5 rounded-xl font-black text-[10px] sm:text-[11px] flex items-center justify-center gap-1 shadow transition-all cursor-pointer active:scale-95 border ${
                remainingExchanges > 0 && inventory.coins >= 1000
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-200 hover:brightness-110'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <span>EXCHANGE 1000 COINS = 1 DIAMOND 💎</span>
            </button>

            {/* Button 2: EXCHANGE 10000 COINS = 12 DIAMONDS (BONUS 2!) - Best value */}
            <button
              onClick={() => handleExchangeCoinsToDiamonds(10000, 12)}
              disabled={remainingExchanges <= 0}
              className={`relative py-2 px-2.5 rounded-xl font-black text-[10px] sm:text-[11px] flex items-center justify-center gap-1 shadow transition-all cursor-pointer active:scale-95 border ${
                remainingExchanges > 0 && inventory.coins >= 10000
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-cyan-400 text-slate-950 border-white hover:brightness-110'
                  : 'bg-slate-800 text-amber-200 border-yellow-500/40'
              }`}
            >
              <span>EXCHANGE 10000 COINS = 12 💎 (BONUS 2!)</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Boards vs Dice Skins vs VIP Tokens */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/90 border border-slate-800 rounded-2xl shrink-0">
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setActiveTab('board');
            }}
            className={`py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'board'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>❄️ Boards (5)</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setActiveTab('dice');
            }}
            className={`py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'dice'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎲 Dice (11)</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playButtonClick();
              setActiveTab('token');
            }}
            className={`py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'token'
                ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>♟️ Tokens (11)</span>
          </button>
        </div>

        {/* Items List (Scrollable) */}
        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
          {activeTab === 'board' &&
            BOARD_SKINS.map((item) => {
              const isOwned = ownedBoards.includes(item.id as BoardSkinId);
              const isEquipped = equippedBoard === item.id;
              const canAfford = userDiamonds >= item.price;

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                    isEquipped
                      ? 'bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-slate-900 border-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                      : isOwned
                      ? 'bg-slate-900/90 border-slate-700 hover:border-slate-600'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {renderBoardPreview(item.id)}

                    <div className="text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs text-white">{item.name}</span>
                        {item.badge && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-cyan-400/20 text-cyan-200 border border-cyan-400/40">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                      <div className="text-[10px] font-bold text-cyan-300 mt-0.5">
                        {item.price === 0 ? 'Free (Default)' : `💎 ${item.price} Diamonds`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuyOrEquip(item)}
                    className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1 shadow active:scale-95 ${
                      isEquipped
                        ? 'bg-emerald-500 text-slate-950'
                        : isOwned
                        ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                        : canAfford
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:brightness-110 text-slate-950'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isEquipped ? (
                      <>
                        <Check size={14} />
                        <span>EQUIPPED</span>
                      </>
                    ) : isOwned ? (
                      <span>EQUIP</span>
                    ) : (
                      <span>BUY 💎{item.price}</span>
                    )}
                  </button>
                </div>
              );
            })}

          {activeTab === 'dice' &&
            DICE_SKINS.map((item) => {
              const isOwned = inventory.ownedDice.includes(item.id as DiceSkinId);
              const isEquipped = inventory.equippedDice === item.id;
              const isDiamondItem = item.currency === 'diamonds';
              const canAfford = isDiamondItem
                ? userDiamonds >= item.price
                : inventory.coins >= item.price;

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                    isEquipped
                      ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-slate-900 border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.3)]'
                      : isOwned
                      ? 'bg-slate-900/90 border-slate-700'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {renderDicePreview(item.id)}

                    <div className="text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs text-white">{item.name}</span>
                        {item.badge && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-amber-400/20 text-yellow-300 border border-yellow-400/40">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                      <div className="text-[10px] font-bold text-amber-300 mt-0.5">
                        {item.price === 0
                          ? 'Free'
                          : isDiamondItem
                          ? `💎 ${item.price} Diamonds`
                          : `🪙 ${item.price.toLocaleString()} Coins`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuyOrEquip(item)}
                    className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1 shadow active:scale-95 ${
                      isEquipped
                        ? 'bg-emerald-500 text-slate-950'
                        : isOwned
                        ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950'
                        : canAfford
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-slate-950'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isEquipped ? (
                      <>
                        <Check size={14} />
                        <span>EQUIPPED</span>
                      </>
                    ) : isOwned ? (
                      <span>EQUIP</span>
                    ) : (
                      <span>
                        {isDiamondItem ? `BUY 💎${item.price}` : `BUY 🪙${item.price}`}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}

          {activeTab === 'token' &&
            TOKEN_SKINS.map((item) => {
              const isOwned = inventory.ownedTokens.includes(item.id as TokenSkinId);
              const isEquipped = inventory.equippedToken === item.id;
              const isDiamondItem = item.currency === 'diamonds';
              const canAfford = isDiamondItem
                ? userDiamonds >= item.price
                : inventory.coins >= item.price;

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                    isEquipped
                      ? 'bg-gradient-to-r from-orange-500/25 via-amber-500/20 to-slate-900 border-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                      : isOwned
                      ? 'bg-slate-900/90 border-slate-700'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {renderTokenPreview(item.id)}

                    <div className="text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs text-white">{item.name}</span>
                        {item.badge && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-orange-400/20 text-orange-300 border border-orange-400/40">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.description}
                      </p>
                      <div className="text-[10px] font-bold text-amber-300 mt-0.5">
                        {item.price === 0
                          ? 'Free'
                          : isDiamondItem
                          ? `💎 ${item.price} Diamonds`
                          : `🪙 ${item.price.toLocaleString()} Coins`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuyOrEquip(item)}
                    className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center gap-1 shadow active:scale-95 ${
                      isEquipped
                        ? 'bg-emerald-500 text-slate-950'
                        : isOwned
                        ? 'bg-orange-400 hover:bg-orange-300 text-slate-950'
                        : canAfford
                        ? 'bg-gradient-to-r from-orange-400 to-amber-500 hover:brightness-110 text-slate-950'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {isEquipped ? (
                      <>
                        <Check size={14} />
                        <span>EQUIPPED</span>
                      </>
                    ) : isOwned ? (
                      <span>EQUIP</span>
                    ) : (
                      <span>
                        {isDiamondItem ? `BUY 💎${item.price}` : `BUY 🪙${item.price}`}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
});

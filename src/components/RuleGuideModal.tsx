import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  X,
  Shield,
  Swords,
  Crown,
  RotateCcw,
  Globe,
  Smartphone,
  Clock,
  Coins,
  Sparkles,
  ShieldCheck,
  Users,
  KeyRound,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import { soundEffects } from '../utils/audioSynthesizer';

interface RuleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RuleGuideModal: React.FC<RuleGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md select-none"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-[#0a1122] to-slate-950 border-2 border-amber-500/90 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.3)] flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-4 py-3.5 flex items-center justify-between text-slate-950 font-black shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-950/15 flex items-center justify-center">
              <BookOpen size={22} className="stroke-[2.5]" />
            </div>
            <div className="text-left">
              <h2 className="text-sm sm:text-base font-black tracking-wide uppercase leading-tight">
                LUDO HEADMASTER — Official Rules
              </h2>
              <p className="text-[10px] font-bold text-slate-900/90">
                Complete Game Guide, Rewards &amp; Fair Play Policy
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-950/15 hover:bg-slate-950/30 text-slate-950 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Rules Content */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 text-xs text-slate-300 text-left">
          {/* Official Game Identity & Play Store Safe Notice */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border border-emerald-500/50 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-300 font-black text-xs uppercase tracking-wide">
              <ShieldCheck size={16} className="shrink-0" />
              <span>Official Game: LUDO HEADMASTER (100% Free-to-Play)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong>LUDO HEADMASTER</strong> is a family-friendly casual board game for entertainment only. All in-game <strong>Coins (🪙)</strong> and <strong>Diamonds (💎)</strong> are virtual items earned purely through gameplay, daily bonuses, and friend invites. There is <strong>NO real-money gambling, NO betting, NO real-money purchases, and NO cash withdrawal</strong>.
            </p>
          </div>

          {/* SECTION 1: GAME MODES (ONLINE VS OFFLINE) */}
          <div className="p-3 bg-slate-950/85 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="font-black text-amber-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={15} className="text-sky-400" />
              <span>1. Game Modes (Online &amp; Offline)</span>
            </h3>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li>
                • <strong>🌐 Play Online (2P, 3P, 4P):</strong> Real-time online match with live players (if no live opponent connects within 10s, smart AI bots join automatically so you never wait). VIP Dice, Token, and Glacier Eternal Board effects work exclusively in Online Mode.
              </li>
              <li>
                • <strong>👥 Play With Friends &amp; Recent Opponents:</strong> Create or Join a 6-digit Private Room via WhatsApp, or check your <strong>Recent Opponents History</strong> to see who is online and send a direct in-game match invite.
              </li>
              <li>
                • <strong>🤝 Pass &amp; Play (Offline Mode):</strong> Play with 2, 3, or 4 players on the same phone without internet. Offline mode uses the clean, classic Ludo board (no Glacier/snow effects) and the first dice roll always starts from the <strong>Bottom-Left (Blue)</strong> player.
              </li>
            </ul>
          </div>

          {/* SECTION 2: CORE BOARD & DICE RULES */}
          <div className="p-3 bg-slate-950/85 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="font-black text-amber-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <RotateCcw size={15} className="text-amber-400" />
              <span>2. Dice Roll &amp; Token Movement Rules</span>
            </h3>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li>
                • <strong>🎲 Roll a 6 to Open Token:</strong> All 4 tokens start in your Home Base. Roll a <strong>6</strong> to bring a token out onto your colored starting square.
              </li>
              <li>
                • <strong>🎁 Bonus Rolls:</strong> You get an extra bonus dice roll whenever you roll a <strong>6</strong>, capture an opponent&apos;s token (<strong>Kill</strong>), or reach the center <strong>Home Triangle</strong> with a token.
              </li>
              <li>
                • <strong>🚫 Three Consecutive 6s Penalty:</strong> Rolling three <strong>6s</strong> in a row (`6-6-6`) forfeits your turn immediately and passes the dice to the next player.
              </li>
              <li>
                • <strong>⚡ Smart Auto-Move:</strong> If you only have 1 valid token move (or multiple movable tokens stacked on the exact same square/base), it moves automatically for smooth gameplay. If movable tokens are on different squares, you tap the token you want to move.
              </li>
            </ul>
          </div>

          {/* SECTION 3: 8 SAFE STARS, CAPTURE & WINNING */}
          <div className="p-3 bg-slate-950/85 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="font-black text-amber-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={15} className="text-emerald-400" />
              <span>3. Safe Star Zones (8 Stars), Captures &amp; Victory</span>
            </h3>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li>
                • <strong>⭐ 8 Safe Star Squares:</strong> The 4 colored starting squares and 4 white Star (`⭐`) squares on the board are <strong>100% Safe Zones</strong>. No token can be cut/captured while standing on any of the 8 stars.
              </li>
              <li>
                • <strong>⚔️ Token Capture (Kill):</strong> Landing on a non-safe square occupied by an opponent&apos;s token sends their token back to their Home Base and gives you 1 Bonus Roll.
              </li>
              <li>
                • <strong>👑 Winning the Game:</strong> Classic Mode requires guiding all <strong>4 tokens</strong> into the center Home Triangle with an exact dice roll (Quick Mode requires <strong>2 tokens</strong> in Offline Pass &amp; Play).
              </li>
            </ul>
          </div>

          {/* SECTION 4: ONLINE 30-SECOND TIMER & TIMEOUT RULE */}
          <div className="p-3 bg-slate-950/85 rounded-2xl border border-rose-500/40 space-y-2">
            <h3 className="font-black text-rose-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={15} className="text-rose-400" />
              <span>4. Online 30-Second Turn Timer &amp; Timeout Rule</span>
            </h3>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li>
                • <strong>⏱️ 30-Second Turn Limit:</strong> In Online Mode, every player gets <strong>30 seconds</strong> to roll the dice and make their move.
              </li>
              <li>
                • <strong>⚠️ Auto-Out on Inactivity:</strong> If an online player does not roll or click within 30 seconds, they are automatically disqualified (<strong>OUT</strong>) from that match.
              </li>
              <li>
                • <strong>🚫 No Coins on 30s Timeout Win:</strong> Winning a normal completed game awards <strong>+50 Coins (🪙)</strong>. However, if you win an online match because your opponent timed out after 30 seconds, <strong>0 Coins (kuch bhi nahi)</strong> are awarded.
              </li>
            </ul>
          </div>

          {/* SECTION 5: COINS, DIAMONDS & VIP SHOP RULES */}
          <div className="p-3 bg-slate-950/85 rounded-2xl border border-cyan-500/40 space-y-2">
            <h3 className="font-black text-cyan-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Coins size={15} className="text-yellow-400" />
              <span>5. Coins (🪙), Diamonds (💎) &amp; VIP Shop Rules</span>
            </h3>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li>
                • <strong>🆕 First-Time Install Balance:</strong> Every new player starts with <strong>0 Coins (🪙)</strong> and <strong>0 Diamonds (💎)</strong>.
              </li>
              <li>
                • <strong>🏆 Match Victory Reward:</strong> Win 1 complete game = <strong>+50 Coins (🪙)</strong> + Level Up.
              </li>
              <li>
                • <strong>🎡 Daily Spin &amp; Daily Bonus:</strong> Daily Spin Wheel gives <strong>+100 Coins</strong> every day. Daily Bonus gives <strong>+100 Coins</strong> every 24 hours.
              </li>
              <li>
                • <strong>📲 WhatsApp Invite (+1 💎):</strong> Share your invite link on WhatsApp — when your friend opens/installs the game through your link, you automatically receive <strong>+1 Diamond (💎)</strong>.
              </li>
              <li>
                • <strong>🔄 Coin-to-Diamond Exchange:</strong> Convert <strong>1,000 Coins = 1 💎</strong> or <strong>10,000 Coins = 12 💎</strong> in the VIP Shop (up to 5 exchanges per day).
              </li>
              <li>
                • <strong>❄️ VIP Skins &amp; Glacier Eternal Price:</strong> Custom Dice, Token, and Board skins start from <strong>5 💎 Diamonds</strong> and increase by tier (`5💎` up to `85💎`). The ultimate <strong>Glacier Eternal — Dream of Kings</strong> set costs <strong>100 💎 Diamonds</strong>. Skins are purely visual/cosmetic and do not alter dice probabilities.
              </li>
            </ul>
          </div>

          {/* SECTION 6: PERMANENT PLAYER ID & ACCOUNT RECOVERY */}
          <div className="p-3 bg-slate-950/85 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="font-black text-amber-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound size={15} className="text-amber-400" />
              <span>6. Permanent Player ID &amp; Auto Data Recovery</span>
            </h3>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              When you save your profile name and avatar, your device is assigned a permanent unique Player ID (e.g., <code className="text-cyan-300 font-mono">LUDO-XXXXXX-XX</code>). Even if you uninstall and reinstall the game on the same phone, your <strong>Player ID, Name, Avatar, Coins, Diamonds, and Unlocked Skins</strong> are automatically restored.
            </p>
          </div>

          {/* SECTION 7: WHAT HAPPENS vs WHAT DOES NOT HAPPEN SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-1">
              <div className="flex items-center gap-1 text-emerald-300 font-black text-[11px] uppercase">
                <CheckCircle2 size={14} />
                <span>Kya Hota Hai (What Happens)</span>
              </div>
              <ul className="text-[10px] text-slate-300 space-y-0.5">
                <li>✓ New install starts at 0🪙 &amp; 0💎</li>
                <li>✓ Normal game win = +50 Coins</li>
                <li>✓ Daily Spin = +100 Coins</li>
                <li>✓ Daily Bonus = +100 Coins</li>
                <li>✓ Friend opens WhatsApp link = +1💎</li>
                <li>✓ Skins start at 5💎, Glacier = 100💎</li>
                <li>✓ Permanent ID restores data on reinstall</li>
              </ul>
            </div>

            <div className="p-2.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-1">
              <div className="flex items-center gap-1 text-rose-300 font-black text-[11px] uppercase">
                <Ban size={14} />
                <span>Kya Nahi Hota (What Never Happens)</span>
              </div>
              <ul className="text-[10px] text-slate-300 space-y-0.5">
                <li>✗ No coins on 30s online timeout win</li>
                <li>✗ No Glacier effects in Offline mode</li>
                <li>✗ No capture on any of the 8 Safe Stars</li>
                <li>✗ No turn after rolling 3 sixes (6-6-6)</li>
                <li>✗ No real-money gambling or cashout</li>
                <li>✗ No pay-to-win dice manipulation</li>
                <li>✗ No new ID created on same phone</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onClose();
            }}
            className="w-full py-2.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black rounded-xl uppercase tracking-wider text-xs shadow-md cursor-pointer active:scale-98 transition-all"
          >
            Got It! Let&apos;s Play LUDO HEADMASTER 🎲
          </button>
        </div>
      </motion.div>
    </div>
  );
};

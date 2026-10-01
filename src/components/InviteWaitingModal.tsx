import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  X,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Bot,
  Sparkles,
  Swords,
  Radio,
} from 'lucide-react';
import { RecentPlayer } from '../utils/recentPlayers';
import { soundEffects } from '../utils/audioSynthesizer';
import { sendDirectMatchInvite, listenToSentInvite } from '../lib/firebase';

interface InviteWaitingModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitedPlayer: RecentPlayer | null;
  playerCount: 2 | 3 | 4;
  onAccepted: (player: RecentPlayer, count: 2 | 3 | 4, roomId: string) => void;
  onPlayWithBotsFallback: (count: 2 | 3 | 4) => void;
  myPlayer?: { id: string; name: string; avatar: string };
}

export const InviteWaitingModal: React.FC<InviteWaitingModalProps> = ({
  isOpen,
  onClose,
  invitedPlayer,
  playerCount,
  onAccepted,
  onPlayWithBotsFallback,
  myPlayer,
}) => {
  const [status, setStatus] = useState<'waiting' | 'accepted' | 'declined' | 'timeout'>('waiting');
  const [secondsLeft, setSecondsLeft] = useState<number>(15);
  const roomIdRef = useRef<string>('');

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const decisionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (decisionTimeoutRef.current) {
      clearTimeout(decisionTimeoutRef.current);
      decisionTimeoutRef.current = null;
    }
  };

  const startInviteFlow = () => {
    clearAllTimers();
    setStatus('waiting');
    setSecondsLeft(15);
    const newRoomId = Math.floor(100000 + Math.random() * 900000).toString();
    roomIdRef.current = newRoomId;

    let unsubInvite: (() => void) | null = null;

    // Send Real-Time Firebase Invite if sender profile is available
    if (myPlayer && invitedPlayer) {
      sendDirectMatchInvite(myPlayer, invitedPlayer.id, newRoomId, playerCount)
        .then((inviteId) => {
          unsubInvite = listenToSentInvite(inviteId, (inv) => {
            if (inv.status === 'accepted') {
              clearAllTimers();
              if (unsubInvite) unsubInvite();
              setStatus('accepted');
              soundEffects.playHomeEntry();
              setTimeout(() => {
                onAccepted(invitedPlayer, playerCount, newRoomId);
              }, 1000);
            } else if (inv.status === 'declined') {
              clearAllTimers();
              if (unsubInvite) unsubInvite();
              setStatus('declined');
              soundEffects.playCapture();
            }
          });
        })
        .catch(() => {});
    }

    // 15 seconds countdown
    countdownIntervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearAllTimers();
          if (unsubInvite) unsubInvite();
          setStatus('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-acceptance fallback after 3.2-5.5s for seamless gameplay
    const willAccept = Math.random() < 0.75;
    const delayMs = Math.floor(Math.random() * 2500) + 3200;

    decisionTimeoutRef.current = setTimeout(() => {
      if (unsubInvite) unsubInvite();
      if (willAccept) {
        clearAllTimers();
        setStatus('accepted');
        soundEffects.playHomeEntry();

        // Launch game after brief celebration animation
        setTimeout(() => {
          if (invitedPlayer) {
            onAccepted(invitedPlayer, playerCount, roomIdRef.current);
          }
        }, 1100);
      } else {
        clearAllTimers();
        setStatus('declined');
        soundEffects.playCapture();
      }
    }, delayMs);
  };

  useEffect(() => {
    if (isOpen && invitedPlayer) {
      startInviteFlow();
    } else {
      clearAllTimers();
    }
    return () => {
      clearAllTimers();
    };
  }, [isOpen, invitedPlayer]);

  if (!isOpen || !invitedPlayer) return null;

  const modeBadge =
    playerCount === 2
      ? '2 Players (Red vs Yellow)'
      : playerCount === 3
      ? '3 Players (Red, Yellow, Blue)'
      : '4 Players (All Colors)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-emerald-500/80 rounded-3xl p-5 shadow-[0_0_60px_rgba(16,185,129,0.35)] flex flex-col items-center text-center overflow-hidden text-white"
      >
        {/* Top Close Button */}
        <button
          onClick={() => {
            soundEffects.playButtonClick();
            clearAllTimers();
            onClose();
          }}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Room Header Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-black uppercase tracking-wider mb-3">
          <Radio size={12} className="animate-pulse text-emerald-400" />
          <span>Private Match #{roomIdRef.current}</span>
        </div>

        {/* Invited Player Profile Card with Radar or Status Badge */}
        <div className="relative my-2">
          {status === 'waiting' && (
            <>
              <div className="absolute -inset-3 rounded-full border-2 border-emerald-500/30 animate-ping opacity-70 pointer-events-none" />
              <div className="absolute -inset-1.5 rounded-full border-2 border-emerald-400/60 animate-pulse pointer-events-none" />
            </>
          )}

          <div
            className={`relative w-20 h-20 rounded-full border-3 overflow-hidden shadow-2xl bg-slate-800 flex items-center justify-center ${
              status === 'accepted'
                ? 'border-emerald-400 ring-4 ring-emerald-400/50'
                : status === 'waiting'
                ? 'border-emerald-400'
                : 'border-rose-500'
            }`}
          >
            <img
              src={invitedPlayer.avatar}
              alt={invitedPlayer.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Status Indicator Icon Badge */}
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 border-2 border-slate-700">
            {status === 'waiting' && <Zap size={14} className="text-yellow-400 animate-bounce" />}
            {status === 'accepted' && <CheckCircle2 size={16} className="text-emerald-400 fill-emerald-950" />}
            {(status === 'declined' || status === 'timeout') && (
              <XCircle size={16} className="text-rose-500 fill-rose-950" />
            )}
          </div>
        </div>

        {/* Target Player Name */}
        <h3 className="text-lg font-black text-white mt-1 flex items-center gap-1.5">
          <span>{invitedPlayer.name}</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        </h3>

        <div className="text-[11px] text-emerald-300/90 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg mt-1">
          {modeBadge}
        </div>

        {/* Status Messages & Progress */}
        <div className="w-full my-4">
          {status === 'waiting' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-black text-emerald-200">
                  Invite Sent! Waiting for response...
                </p>
                <p className="text-[11px] text-slate-400">
                  {invitedPlayer.name} ko game invite bheja gaya hai.
                </p>
              </div>

              {/* Progress Countdown Bar */}
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-emerald-500/40 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-1000"
                  style={{ width: `${(secondsLeft / 15) * 100}%` }}
                />
              </div>

              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300">
                <Clock size={14} className="text-emerald-400" />
                <span>Auto-Timeout in 00:{secondsLeft.toString().padStart(2, '0')}s</span>
              </div>
            </div>
          )}

          {status === 'accepted' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.3)] space-y-1"
            >
              <p className="text-sm font-black text-emerald-300 flex items-center justify-center gap-1.5">
                <Sparkles size={16} className="text-yellow-400 animate-spin" />
                <span>Invite Accepted!</span>
              </p>
              <p className="text-xs text-slate-200">
                {invitedPlayer.name} match me shamil ho gaye hain. Board taiyar ho raha hai...
              </p>
            </motion.div>
          )}

          {status === 'declined' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/60 space-y-1"
            >
              <p className="text-sm font-black text-rose-300 flex items-center justify-center gap-1.5">
                <XCircle size={16} className="text-rose-400" />
                <span>Player is Busy</span>
              </p>
              <p className="text-xs text-slate-300">
                {invitedPlayer.name} abhi dusre game me vyast hain ya request decline kar di hai.
              </p>
            </motion.div>
          )}

          {status === 'timeout' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/60 space-y-1"
            >
              <p className="text-sm font-black text-amber-300 flex items-center justify-center gap-1.5">
                <Clock size={16} className="text-amber-400" />
                <span>No Response (Timeout)</span>
              </p>
              <p className="text-xs text-slate-300">
                15 second me koi javab nahi mila. Aap fir se try kar sakte hain ya Bots ke sath khel sakte hain.
              </p>
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2 pt-1">
          {status === 'waiting' && (
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                clearAllTimers();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer"
            >
              Cancel Invite
            </button>
          )}

          {(status === 'declined' || status === 'timeout') && (
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => {
                  soundEffects.playButtonClick();
                  startInviteFlow();
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Retry Invite (Fir Se Bhejo)</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playButtonClick();
                  clearAllTimers();
                  onClose();
                  onPlayWithBotsFallback(playerCount);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-yellow-500/50 text-yellow-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Bot size={14} className="text-yellow-400" />
                <span>Play with Computer Bots Instead 🤖</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playButtonClick();
                  clearAllTimers();
                  onClose();
                }}
                className="w-full py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Back to Lobby
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Trophy, Clock } from 'lucide-react';
import { soundEffects } from '../utils/audioSynthesizer';
import { getTodayDateString, getTimeUntilMidnight, hasSpunToday } from '../utils/rewardsHelper';

interface DailySpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCoins: number;
  onSpinSuccess: (newCoins: number) => void;
}

const WHEEL_SLICES = [
  { label: '100 🪙', color: 'from-amber-400 to-yellow-500', text: 'text-slate-950' },
  { label: '100 🪙', color: 'from-orange-500 to-amber-500', text: 'text-slate-950' },
  { label: '100 🪙', color: 'from-emerald-500 to-teal-400', text: 'text-slate-950' },
  { label: '100 🪙', color: 'from-sky-500 to-blue-600', text: 'text-white' },
  { label: '100 🪙', color: 'from-purple-500 to-indigo-600', text: 'text-white' },
  { label: '100 🪙', color: 'from-rose-500 to-pink-600', text: 'text-white' },
  { label: '100 🪙', color: 'from-yellow-300 to-amber-400', text: 'text-slate-950' },
  { label: '100 🪙', color: 'from-teal-400 to-emerald-500', text: 'text-slate-950' },
];

export const DailySpinModal: React.FC<DailySpinModalProps> = ({
  isOpen,
  onClose,
  userCoins,
  onSpinSuccess,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [hasWon, setHasWon] = useState(false);
  const [countdownText, setCountdownText] = useState(getTimeUntilMidnight());
  const [alreadySpun, setAlreadySpun] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAlreadySpun(hasSpunToday());
      setCountdownText(getTimeUntilMidnight());
      setHasWon(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownText(getTimeUntilMidnight());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const handleSpin = () => {
    const today = getTodayDateString();
    const storedLastSpin = localStorage.getItem('lastSpinDate');

    if (storedLastSpin === today || alreadySpun) {
      soundEffects.playError();
      return;
    }

    if (isSpinning) return;

    soundEffects.playButtonClick();
    setIsSpinning(true);

    // Realistic multi-revolution spin landing squarely on slice
    const spins = 6;
    const sliceAngle = 360 / WHEEL_SLICES.length;
    // Choose a slice angle to land centered
    const randomSlice = Math.floor(Math.random() * WHEEL_SLICES.length);
    const targetDegree = rotation + (360 * spins) + (randomSlice * sliceAngle);

    setRotation(targetDegree);
    soundEffects.playDiceRoll();

    setTimeout(() => {
      const fixedPrize = 100; // Daily Spin par 100 coins milega
      const newTotal = userCoins + fixedPrize;

      localStorage.setItem('lastSpinDate', today);
      localStorage.setItem('userCoins', newTotal.toString());

      setAlreadySpun(true);
      setIsSpinning(false);
      setHasWon(true);
      soundEffects.playWinFanfare();
      onSpinSuccess(newTotal);
    }, 2800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => {
        if (!isSpinning) onClose();
      }}
    >
      <div
        className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-2 border-yellow-500/70 rounded-3xl p-4 sm:p-5 shadow-[0_0_50px_rgba(234,179,8,0.35)] flex flex-col items-center gap-3 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 text-lg shadow shrink-0">
              🎡
            </div>
            <div className="text-left">
              <h3 className="text-base font-black text-white leading-tight">
                DAILY SPIN - Win 100 Coins
              </h3>
              <p className="text-[10px] text-yellow-300 font-bold">
                Free Daily Reward • 100 Fixed Coins
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!isSpinning) {
                soundEffects.playButtonClick();
                onClose();
              }
            }}
            disabled={isSpinning}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Coin Bar */}
        <div className="w-full bg-slate-950/80 border border-yellow-500/30 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-bold">Your Balance:</span>
          <span className="font-black text-amber-300">🪙 {userCoins.toLocaleString()} Coins</span>
        </div>

        {/* Wheel Container */}
        <div className="relative w-56 h-56 sm:w-60 sm:h-60 my-2 flex items-center justify-center">
          {/* Top Indicator Arrow */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
            <div className="w-0 h-0 border-x-8 border-x-transparent border-t-[16px] border-t-yellow-400 drop-shadow-[0_2px_8px_rgba(250,204,21,0.8)] animate-pulse" />
          </div>

          {/* Outer Wheel Golden Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.5)] pointer-events-none z-10" />

          {/* Rotating Wheel Body */}
          <div
            className="w-full h-full rounded-full overflow-hidden relative shadow-2xl transition-transform duration-[2800ms] ease-[cubic-bezier(0.12,0.8,0.2,1)]"
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {WHEEL_SLICES.map((slice, i) => {
              const deg = i * (360 / WHEEL_SLICES.length);
              return (
                <div
                  key={i}
                  className="absolute inset-0 flex items-start justify-center pt-2"
                  style={{
                    transform: `rotate(${deg}deg)`,
                    transformOrigin: '50% 50%',
                  }}
                >
                  <div className={`w-20 h-28 bg-gradient-to-b ${slice.color} rounded-t-xl flex flex-col items-center pt-1 border border-yellow-300/40 shadow-inner`}>
                    <span className={`text-[11px] font-black ${slice.text} leading-tight`}>
                      {slice.label}
                    </span>
                    <Sparkles size={10} className={`${slice.text} opacity-80 mt-0.5`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center Hub Button */}
          <div className="absolute z-20 w-16 h-16 rounded-full bg-gradient-to-b from-yellow-300 via-amber-500 to-yellow-600 p-1 shadow-[0_0_15px_rgba(250,204,21,0.8)] flex items-center justify-center">
            <button
              onClick={handleSpin}
              disabled={isSpinning || alreadySpun}
              className="w-full h-full rounded-full bg-slate-950 border-2 border-yellow-300 text-yellow-300 hover:text-white font-black text-[11px] uppercase tracking-wider flex flex-col items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-80 active:scale-95 transition-all shadow-inner"
            >
              <span>{isSpinning ? '...' : alreadySpun ? 'DONE' : 'SPIN'}</span>
            </button>
          </div>
        </div>

        {/* Win Notification or Countdown Info */}
        {hasWon ? (
          <div className="w-full bg-emerald-500/20 border border-emerald-400 rounded-2xl p-2.5 text-center animate-in zoom-in-90 duration-300">
            <span className="text-xs font-black text-emerald-300 block">
              🎉 Congratulations! Won 100 Coins!
            </span>
            <span className="text-[11px] text-white font-bold">
              Updated Balance: 🪙 {(userCoins).toLocaleString()} Coins
            </span>
          </div>
        ) : alreadySpun ? (
          <div className="w-full bg-slate-900 border border-yellow-500/40 rounded-2xl p-2 text-center text-slate-200">
            <div className="text-xs font-black text-amber-300 flex items-center justify-center gap-1">
              <span>❌ Aaj ka spin ho gaya! Kal aao</span>
            </div>
            <div className="text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1 mt-0.5">
              <Clock size={12} className="text-yellow-400" />
              <span>Timer: {countdownText}</span>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-center text-slate-400 font-bold">
            Tap button below to spin and win guaranteed 100 coins!
          </p>
        )}

        {/* Action Button */}
        {!alreadySpun ? (
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(250,204,21,0.5)] active:scale-95 transition-all cursor-pointer border-2 border-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trophy size={16} className="fill-slate-950" />
            <span>{isSpinning ? 'SPINNING WHEEL...' : 'SPIN NOW'}</span>
          </button>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase cursor-pointer"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

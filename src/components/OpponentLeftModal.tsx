import React from 'react';
import { LogOut, Home, RotateCcw } from 'lucide-react';
import { soundEffects } from '../utils/audioSynthesizer';

interface OpponentLeftModalProps {
  isOpen: boolean;
  opponentName?: string;
  onGoHome: () => void;
  onPlayAgainOnline: () => void;
}

export const OpponentLeftModal: React.FC<OpponentLeftModalProps> = ({
  isOpen,
  opponentName = 'Opponent',
  onGoHome,
  onPlayAgainOnline,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-6 shadow-[0_0_40px_rgba(244,63,94,0.3)] flex flex-col items-center gap-4 text-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-rose-400">
          <LogOut size={32} />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-black text-rose-400">
            Opponent Left The Game
          </h3>
          <p className="text-xs text-slate-300">
            {opponentName} disconnected or left the match.
          </p>
        </div>

        <div className="w-full space-y-2 pt-2">
          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onPlayAgainOnline();
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>Find New Opponent</span>
          </button>

          <button
            onClick={() => {
              soundEffects.playButtonClick();
              onGoHome();
            }}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
          >
            <Home size={16} />
            <span>Back to Home Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};

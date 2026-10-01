import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, PlayerColor } from '../types/ludo';
import { Send, Smile, MessageSquare, X, Volume2 } from 'lucide-react';
import { soundEffects } from '../utils/audioSynthesizer';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string, type: 'text' | 'quick' | 'emoji') => void;
  currentPlayerName: string;
}

export const QUICK_MESSAGES = [
  'Chalo jaldi chalo! ⏰',
  'Roll 6 please! 🎲',
  'Hahaha! 😂',
  'Well played! 👏',
  'Oops! 🙈',
  'Aree yaar! 🤦‍♂️',
  'Don’t kill me please! 🥺',
  'Better luck next time! 💥',
  'Victory is mine! 👑',
  'Good Game! 🤝',
  'Kill him not me! 🎯',
  'Lucky roll! ✨',
];

export const QUICK_EMOJIS = [
  '😂', '😍', '😭', '😡', '🔥', '👑', '🎲', '🎉', '🚀', '💀', '😈', '👏', '💥', '🥳', '😎', '😜'
];

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentPlayerName,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'emojis' | 'custom'>('quick');
  const [inputText, setInputText] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (text: string, type: 'text' | 'quick' | 'emoji') => {
    if (!text.trim()) return;
    soundEffects.playChatPop();
    onSendMessage(text, type);
    setInputText('');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleSend(inputText, 'text');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/80 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 p-3.5 flex items-center justify-between text-slate-950 font-black shadow-md">
            <div className="flex items-center gap-2">
              <MessageSquare size={22} className="fill-slate-950" />
              <span className="text-lg tracking-wide uppercase">Ludo King Live Chat</span>
            </div>
            <button
              onClick={() => {
                soundEffects.playButtonClick();
                onClose();
              }}
              className="p-1 rounded-full bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-950/90 border-b border-slate-800 p-1.5 gap-1">
            <button
              onClick={() => setActiveTab('quick')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'quick'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💬 Quick Voice
            </button>
            <button
              onClick={() => setActiveTab('emojis')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'emojis'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              😀 Emojis
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'custom'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ✍️ Type Custom
            </button>
          </div>

          {/* Chat Messages History */}
          <div
            ref={chatScrollRef}
            className="flex-1 p-3 overflow-y-auto space-y-2.5 min-h-[160px] max-h-[220px] bg-slate-950/50"
          >
            {messages.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                No chat yet. Send a message to taunt your opponents! 🎲
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    msg.senderName === currentPlayerName ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.senderName !== currentPlayerName && (
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border border-slate-600 text-xs flex items-center justify-center shrink-0">
                      {msg.senderAvatar ? <img src={msg.senderAvatar} alt="" /> : '👤'}
                    </div>
                  )}

                  <div
                    className={`px-3 py-1.5 rounded-2xl max-w-[75%] text-xs shadow-md ${
                      msg.senderName === currentPlayerName
                        ? 'bg-amber-500 text-slate-950 font-semibold rounded-tr-none'
                        : 'bg-slate-800 text-slate-100 font-medium rounded-tl-none border border-slate-700'
                    }`}
                  >
                    {msg.senderName !== currentPlayerName && (
                      <div className="text-[10px] font-bold text-amber-400 mb-0.5">
                        {msg.senderName}
                      </div>
                    )}
                    {msg.type === 'emoji' ? (
                      <span className="text-2xl">{msg.text}</span>
                    ) : (
                      <span>{msg.text}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tab Actions Content */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            {activeTab === 'quick' && (
              <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                {QUICK_MESSAGES.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleSend(phrase, 'quick');
                      onClose();
                    }}
                    className="p-2 text-left text-xs font-semibold bg-slate-800/80 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 rounded-xl border border-slate-700 hover:border-amber-400/50 transition-all flex items-center gap-1.5"
                  >
                    <Volume2 size={13} className="text-amber-400 shrink-0" />
                    <span className="truncate">{phrase}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'emojis' && (
              <div className="grid grid-cols-8 gap-2 max-h-[180px] overflow-y-auto py-1">
                {QUICK_EMOJIS.map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleSend(emoji, 'emoji');
                      onClose();
                    }}
                    className="p-2 text-2xl hover:scale-130 transition-transform flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'custom' && (
              <form onSubmit={handleCustomSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  maxLength={60}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold rounded-xl disabled:opacity-50 hover:opacity-90 flex items-center gap-1 shadow-lg"
                >
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

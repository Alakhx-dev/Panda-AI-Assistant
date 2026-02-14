
import React, { useEffect, useRef } from 'react';
import { Message, ThemeMode, Language } from '../types';
import { THEME_CONFIG, TRANSLATIONS } from '../constants';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  theme: ThemeMode;
  language: Language;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, theme, language }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const config = THEME_CONFIG[theme];
  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 space-y-4 sm:space-y-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl gradient-pink flex items-center justify-center text-4xl sm:text-5xl shadow-2xl animate-bounce">
          🐼
        </div>
        <div className="text-center space-y-2 max-w-xs sm:max-w-none">
          <h1 className={`text-2xl sm:text-4xl font-bold ${config.text}`}>{t.emptyStateTitle}</h1>
          <p className={`text-sm sm:text-lg opacity-60 ${config.text}`}>{t.emptyStateSub}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-2xl px-2">
          {[t.suggestion1, t.suggestion2, t.suggestion3, t.suggestion4].map((suggestion) => (
            <div 
              key={suggestion}
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${config.border} ${config.card} cursor-pointer hover:border-pink-500/50 transition-all ${config.text} group`}
            >
              <div className="font-medium text-sm sm:text-base group-hover:text-pink-500 transition-colors">{suggestion}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {messages.map((msg, idx) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div className={`flex gap-2 sm:gap-4 max-w-[92%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shrink-0 flex items-center justify-center text-lg sm:text-xl shadow-md ${msg.role === 'user' ? 'gradient-pink' : 'bg-white/10 backdrop-blur-md border border-white/20'}`}>
                {msg.role === 'user' ? '👤' : '🐼'}
              </div>
              <div className="space-y-2">
                <div 
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-pink-500 text-white rounded-tr-none' 
                      : `${config.card} ${config.text} rounded-tl-none border ${config.border}`
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm sm:text-base">
                    {msg.content}
                  </div>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.attachments.map((file, i) => (
                        <div key={i} className="text-[10px] sm:text-xs px-2 py-1 bg-black/10 rounded-lg border border-white/10 flex items-center gap-1.5 max-w-[150px] truncate">
                          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span className="truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fadeIn">
            <div className="flex gap-2 sm:gap-4 max-w-[92%]">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shrink-0 flex items-center justify-center text-lg sm:text-xl bg-white/10 backdrop-blur-md animate-pulse border border-white/20">
                🐼
              </div>
              <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${config.card} rounded-tl-none border ${config.border}`}>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;

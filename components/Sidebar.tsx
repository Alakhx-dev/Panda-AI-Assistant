
import React from 'react';
import { ChatSession, ThemeMode, User, Language } from '../types';
import { THEME_CONFIG, TRANSLATIONS } from '../constants';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  user: User | null;
  language: Language;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  user,
  language,
  onSelectSession,
  onNewChat,
  onLogout,
  onOpenSettings,
  theme,
  toggleTheme,
  isOpen,
  setIsOpen
}) => {
  const config = THEME_CONFIG[theme];
  const t = TRANSLATIONS[language];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Toggle Button (when sidebar is hidden) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed top-4 left-4 z-[40] p-2 rounded-lg hover:bg-pink-500/10 ${config.text} lg:hidden transition-all duration-200`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <div
        className={`fixed lg:relative z-50 h-[100dvh] transition-all duration-300 ease-out border-r ${config.border} 
        ${isOpen ? 'w-72 translate-x-0 shadow-2xl' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-20'} 
        ${config.card}`}
      >
        <div className={`flex flex-col h-full overflow-hidden ${!isOpen && 'lg:items-center'}`}>
          {/* Menu Toggle & Brand */}
          <div className={`p-4 flex items-center gap-3 border-b ${config.border} mb-2 ${!isOpen && 'justify-center'}`}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-lg hover:bg-pink-500/10 ${config.text} transition-colors shrink-0`}
              title={isOpen ? "Collapse menu" : "Expand menu"}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {isOpen && (
              <div className="flex items-center gap-2 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="w-7 h-7 rounded-lg gradient-pink flex items-center justify-center text-sm shadow-md shrink-0">
                  🐼
                </div>
                <span className={`font-bold text-lg tracking-tight truncate ${config.text}`}>{t.appName}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="px-4 py-2">
            <button
              onClick={() => {
                onNewChat();
                if (window.innerWidth < 1024) setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 border-2 ${theme === ThemeMode.DARK ? 'border-pink-500/30 hover:border-pink-500 text-pink-300' : 'border-pink-200 hover:border-pink-500 text-pink-700'} group ${!isOpen && 'justify-center'}`}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </span>
              {isOpen && <span className="font-medium">{t.newChat}</span>}
            </button>
          </div>

          {/* History */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-hide">
            {isOpen && <h3 className={`text-[10px] font-bold uppercase tracking-[2px] opacity-40 mb-3 mt-4 px-3 ${config.text}`}>{t.history}</h3>}
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl transition-all truncate text-sm flex items-center gap-3 ${currentSessionId === session.id
                  ? 'bg-pink-500/20 border border-pink-500/30 text-pink-500'
                  : `hover:bg-pink-500/10 border border-transparent ${config.text} opacity-60 hover:opacity-100`
                  } ${!isOpen && 'justify-center'}`}
              >
                <svg className="w-4 h-4 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {isOpen && <span className="truncate">{session.title || 'Untitled Chat'}</span>}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className={`p-4 mt-auto border-t ${config.border} space-y-1.5`}>
            {user && (
              <div
                className={`flex items-center gap-3 p-2.5 mb-2 rounded-xl bg-white/5 border border-white/5 transition-colors cursor-pointer hover:bg-white/10 ${!isOpen && 'justify-center'}`}
                onClick={onOpenSettings}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-pink-500/30 shrink-0">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gradient-pink flex items-center justify-center text-[10px] text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {isOpen && (
                  <div className="flex-1 overflow-hidden">
                    <div className={`text-xs font-bold truncate ${config.text}`}>{user.name}</div>
                    <div className={`text-[10px] opacity-40 truncate ${config.text}`}>{user.email}</div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onOpenSettings}
              className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-pink-500/10 transition-all ${config.text} ${!isOpen && 'justify-center'}`}
            >
              <span className="text-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              {isOpen && <span className="text-sm font-medium">{t.settings}</span>}
            </button>

            <button
              onClick={toggleTheme}
              className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-pink-500/10 transition-all ${config.text} ${!isOpen && 'justify-center'}`}
            >
              <span className="text-xl">
                {theme === ThemeMode.DARK ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </span>
              {isOpen && <span className="text-sm font-medium">{theme === ThemeMode.DARK ? t.lightMode : t.darkMode}</span>}
            </button>
            <button
              onClick={onLogout}
              className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-all ${!isOpen && 'justify-center'}`}
            >
              <span className="text-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </span>
              {isOpen && <span className="text-sm font-medium">{t.logout}</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

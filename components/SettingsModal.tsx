
import React from 'react';
import { ThemeMode, Language, User } from '../types';
import { TRANSLATIONS, THEME_CONFIG } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  theme: ThemeMode;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  theme,
  language,
  onLanguageChange
}) => {
  if (!isOpen) return null;

  const t = TRANSLATIONS[language];
  const config = THEME_CONFIG[theme];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fadeIn" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className={`relative w-full max-w-lg rounded-[32px] border ${config.border} ${config.card} p-6 sm:p-8 shadow-2xl animate-scaleIn`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold ${config.text}`}>{t.settings}</h2>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-pink-500/10 ${config.text} transition-colors`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-8">
          {/* User Section */}
          <div className="space-y-4">
            <h3 className={`text-xs font-bold uppercase tracking-[2px] opacity-40 ${config.text}`}>{t.profile}</h3>
            <div className={`flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5`}>
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-pink-500/30">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full gradient-pink flex items-center justify-center text-xl text-white">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className={`text-lg font-bold ${config.text}`}>{user?.name}</div>
                <div className={`text-sm opacity-50 ${config.text}`}>{user?.email}</div>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="space-y-4">
            <h3 className={`text-xs font-bold uppercase tracking-[2px] opacity-40 ${config.text}`}>{t.language}</h3>
            <div className="grid grid-cols-2 gap-3">
              {(['en', 'hi'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${
                    language === lang 
                    ? 'border-pink-500 bg-pink-500/10 text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.2)]' 
                    : `${config.border} hover:bg-white/5 ${config.text} opacity-60`
                  }`}
                >
                  <span className="font-semibold">{lang === 'en' ? 'English' : 'हिन्दी'}</span>
                  {language === lang && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-10 py-4 gradient-pink text-white font-bold rounded-2xl shadow-lg hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-95 transition-all"
        >
          {t.close}
        </button>
      </div>
    </div>
  );
};

export default SettingsModal;

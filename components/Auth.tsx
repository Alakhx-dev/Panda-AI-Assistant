
import React, { useState } from 'react';
import { User, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface AuthProps {
  onLogin: (user: User) => void;
  language: Language;
}

const Auth: React.FC<AuthProps> = ({ onLogin, language }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const t = TRANSLATIONS[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin({
        email,
        name: email.split('@')[0],
      });
      setLoading(false);
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setTimeout(() => {
      onLogin({
        email: 'alakh.niranjan@gmail.com',
        name: 'Alakh Niranjan',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alakh'
      });
      setGoogleLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 sm:px-6 py-6 bg-[#0a0508] relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-pink-500/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-700"></div>

      <div className="w-full max-w-md z-10">
        <div className="glass-card p-8 rounded-[32px] shadow-2xl border border-pink-500/20">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-3xl gradient-pink flex items-center justify-center text-4xl shadow-xl mb-4 scale-110">
              🐼
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{t.loginTitle}</h1>
            <p className="text-pink-300/60 mt-2">{t.loginSub}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-pink-200/80 mb-2 ml-1">{t.email}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="panda@example.com"
                className="w-full bg-white/5 border border-pink-500/10 rounded-2xl p-4 text-white placeholder-pink-200/20 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-pink-200/80 mb-2 ml-1">{t.password}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-pink-500/10 rounded-2xl p-4 text-white placeholder-pink-200/20 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-4 gradient-pink text-white font-bold rounded-2xl shadow-lg hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                isLogin ? t.signIn : t.createAccount
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-pink-500/10"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#12060b] px-4 text-pink-300/40 font-semibold tracking-widest">{t.or}</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full py-4 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {t.continueGoogle}
              </>
            )}
          </button>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-pink-400 hover:text-pink-300 text-sm font-medium transition-colors"
            >
              {isLogin ? t.toggleAuth : t.toggleAuthLogin}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

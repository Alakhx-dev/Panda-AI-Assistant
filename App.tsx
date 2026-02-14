
import React, { useState, useEffect } from 'react';
import { User, ChatSession, ThemeMode, Message, FileAttachment, Language } from './types';
import { THEME_CONFIG, TRANSLATIONS } from './constants';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import Auth from './components/Auth';
import FloatingHearts from './components/FloatingHearts';
import SettingsModal from './components/SettingsModal';
import { chatWithGemini } from './services/geminiService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(ThemeMode.DARK);
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const savedUser = localStorage.getItem('panda_user');
    const savedSessions = localStorage.getItem('panda_sessions');
    const savedLang = localStorage.getItem('panda_lang');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedSessions) setSessions(JSON.parse(savedSessions));
    if (savedLang) setLanguage(savedLang as Language);
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('panda_user', JSON.stringify(user));
    localStorage.setItem('panda_sessions', JSON.stringify(sessions));
    localStorage.setItem('panda_lang', language);
  }, [user, sessions, language]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogin = (userData: User) => setUser(userData);
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('panda_user');
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: language === 'hi' ? 'नया चैट' : 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const onSend = async (text: string, attachments: FileAttachment[]) => {
    let sid = currentSessionId;
    let targetSessions = [...sessions];

    if (!sid) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: text.slice(0, 30) || (language === 'hi' ? 'नया चैट' : 'New Chat'),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      targetSessions = [newSession, ...targetSessions];
      sid = newSession.id;
      setCurrentSessionId(sid);
      setSessions(targetSessions);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      attachments,
      timestamp: Date.now()
    };

    const updatedSessions = targetSessions.map(s =>
      s.id === sid ? { ...s, messages: [...s.messages, userMessage], updatedAt: Date.now() } : s
    );
    setSessions(updatedSessions);
    setIsLoading(true);

    try {
      const activeSession = updatedSessions.find(s => s.id === sid)!;
      let aiResponseText = '';
      const aiMessageId = (Date.now() + 1).toString();
      const initialAiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s =>
        s.id === sid ? { ...s, messages: [...s.messages, initialAiMessage] } : s
      ));

      await chatWithGemini(
        [...activeSession.messages, userMessage],
        (chunk) => {
          aiResponseText += chunk;
          setSessions(prev => prev.map(s =>
            s.id === sid
              ? {
                ...s,
                messages: s.messages.map(m => m.id === aiMessageId ? { ...m, content: aiResponseText } : m)
              }
              : s
          ));
        },
        language,
        attachments
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <>
        <FloatingHearts />
        <Auth onLogin={handleLogin} language={language} />
      </>
    );
  }

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const config = THEME_CONFIG[theme];
  const t = TRANSLATIONS[language];

  return (
    <div className={`flex min-h-[100dvh] overflow-hidden ${config.bg} ${config.gradient} bg-gradient-to-br transition-colors duration-500`}>
      <FloatingHearts />
      <div
        className="fixed pointer-events-none z-10 w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 bg-pink-500"
        style={{ left: mousePos.x - 300, top: mousePos.y - 300 }}
      ></div>

      <Sidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        user={user}
        language={language}
        onSelectSession={setCurrentSessionId}
        onNewChat={createNewSession}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={theme}
        toggleTheme={() => setTheme(prev => prev === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK)}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 flex flex-col relative z-20">
        <header className={`px-4 sm:px-6 py-4 flex items-center justify-between border-b ${config.border} bg-white/5 backdrop-blur-sm lg:hidden`}>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className={`p-2 rounded-lg ${config.text}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="font-bold text-pink-500">{t.appName}</div>
          <div
            className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center cursor-pointer"
            onClick={() => setIsSettingsOpen(true)}
          >
            🐼
          </div>
        </header>

        <ChatWindow
          messages={currentSession?.messages || []}
          isLoading={isLoading}
          theme={theme}
          language={language}
        />

        <ChatInput
          onSend={onSend}
          isLoading={isLoading}
          theme={theme}
          language={language}
        />

        <footer className={`px-4 sm:px-6 py-2 text-[10px] uppercase tracking-widest opacity-30 text-right ${config.text}`}>
          Made with ❤️ by Alakh
        </footer>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        theme={theme}
        language={language}
        onLanguageChange={setLanguage}
      />
    </div>
  );
};

export default App;

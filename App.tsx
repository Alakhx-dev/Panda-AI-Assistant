
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
import { checkEnvironment } from './services/envCheck';

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

  // ===== CHECK ENVIRONMENT ON APP STARTUP =====
  useEffect(() => {
    console.log("🚀 App.tsx: Performing environment check at startup");
    const envOk = checkEnvironment();
    if (envOk) {
      console.log("✅ Environment check PASSED - API key is available");
    } else {
      console.warn("⚠️ Environment check FAILED - API key not found. Check browser console for details.");
    }
  }, []);

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

      const apiResponse = await chatWithGemini(
        [...activeSession.messages, userMessage],
        (chunk) => {
          if (chunk && chunk.trim()) {  // Only update if chunk has content
            aiResponseText += chunk;
            setSessions(prev => prev.map(s =>
              s.id === sid
                ? {
                  ...s,
                  messages: s.messages.map(m => m.id === aiMessageId ? { ...m, content: aiResponseText } : m)
                }
                : s
            ));
          }
        },
        language,
        attachments
      );

      console.log("📬 Final API response returned:", apiResponse);

      // STRICT: Validate response is not empty before finalizing
      if (!apiResponse || apiResponse.trim() === '') {
        console.error("❌ STRICT VALIDATION FAILED: API returned empty/undefined response");
        console.error("Response was:", apiResponse);
        const fallbackMessage = language === 'hi'
          ? 'माफी करें, मुझे जवाब बनाने में समस्या हुई। कृपया फिर से प्रयास करें।'
          : 'Sorry, I couldn\'t generate a response. Please try again.';

        setSessions(prev => prev.map(s =>
          s.id === sid
            ? {
              ...s,
              messages: s.messages.map(m =>
                m.id === aiMessageId ? { ...m, content: fallbackMessage } : m
              )
            }
            : s
        ));
        setIsLoading(false);
        return;
      }

      console.log("✅ RESPONSE VALIDATION PASSED");
      console.log("✅ Final content being set, length:", apiResponse.length);
      // Ensure final content is properly set (in case streaming ended)
      setSessions(prev => prev.map(s =>
        s.id === sid
          ? {
            ...s,
            messages: s.messages.map(m => m.id === aiMessageId ? { ...m, content: apiResponse } : m)
          }
          : s
      ));
    } catch (error) {
      console.error("❌ Error in onSend - FULL ERROR DUMP:");
      console.error("Error object:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }

      // Extract specific error message
      let userErrorMessage = language === 'hi'
        ? 'API में त्रुटि: कृपया फिर से प्रयास करें।'
        : 'API Error: Please try again.';

      if (error instanceof Error) {
        const message = error.message;

        // Provide specific error messages based on error type
        if (message.includes('401')) {
          userErrorMessage = language === 'hi'
            ? 'API कुंजी अमान्य है। .env.local में VITE_OPENROUTER_API_KEY जांचें।'
            : 'Invalid API key. Check VITE_OPENROUTER_API_KEY in .env.local';
        } else if (message.includes('403')) {
          userErrorMessage = language === 'hi'
            ? 'API पहुंच अस्वीकृत। OpenRouter खाता जांचें।'
            : 'API access denied. Check your OpenRouter account.';
        } else if (message.includes('429')) {
          userErrorMessage = language === 'hi'
            ? 'बहुत अधिक अनुरोध। एक पल प्रतीक्षा करें।'
            : 'Too many requests. Please wait a moment.';
        } else if (message.includes('400')) {
          userErrorMessage = language === 'hi'
            ? 'अमान्य अनुरोध प्रारूप।'
            : 'Invalid request format.';
        } else if (message.includes('500')) {
          userErrorMessage = language === 'hi'
            ? 'OpenRouter सर्वर त्रुटि। बाद में पुनः प्रयास करें।'
            : 'OpenRouter server error. Try again later.';
        } else if (message.includes('not found') || message.includes('API Key')) {
          userErrorMessage = language === 'hi'
            ? 'API कुंजी नहीं मिली। डेवलपर सर्वर पुनः प्रारंभ करें।'
            : 'API key not found. Restart the dev server.';
        } else if (message.includes('empty response')) {
          userErrorMessage = language === 'hi'
            ? 'API ने खाली जवाब दिया। कृपया फिर से प्रयास करें।'
            : 'API returned empty response. Please try again.';
        }
      }

      console.log("🎯 Displaying error to user:", userErrorMessage);

      // Show error message to user
      setSessions(prev => {
        const session = prev.find(s => s.id === sid);
        if (session) {
          const lastMsg = session.messages[session.messages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content === '') {
            return prev.map(s =>
              s.id === sid
                ? {
                  ...s,
                  messages: s.messages.map(m =>
                    m.id === lastMsg.id ? { ...m, content: userErrorMessage } : m
                  )
                }
                : s
            );
          }
        }
        return prev;
      });
    } finally {
      console.log("🏁 Request complete, setting isLoading to false");
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
    <div className={`flex h-[100dvh] w-full ${config.bg} ${config.gradient} bg-gradient-to-br transition-colors duration-500 overflow-hidden`}>
      <FloatingHearts />
      <div
        className="fixed pointer-events-none z-10 w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] rounded-full blur-[120px] opacity-10 bg-pink-500 hidden sm:block"
        style={{ left: mousePos.x - 150, top: mousePos.y - 150 }}
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

      <div className="flex flex-col flex-1 min-h-0 relative">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-6 pb-[150px] pt-16 lg:pt-8">
          <ChatWindow
            messages={currentSession?.messages || []}
            isLoading={isLoading}
            theme={theme}
            language={language}
            onSuggestClick={(suggestion) => onSend(suggestion, [])}
          />
        </div>

        <div className="fixed bottom-[50px] left-0 right-0 bg-gradient-to-t from-slate-950/95 via-slate-950/90 to-transparent backdrop-blur-md p-3 sm:p-4 lg:static lg:bottom-auto lg:bg-none lg:backdrop-blur-none">
          <ChatInput
            onSend={onSend}
            isLoading={isLoading}
            theme={theme}
            language={language}
          />
        </div>

        <footer className={`fixed bottom-[10px] left-0 right-0 z-10 px-4 sm:px-6 py-2 text-[10px] uppercase tracking-widest opacity-30 text-right lg:static lg:bottom-auto lg:z-auto ${config.text}`}>
          Made with ❤️ by Alakh
        </footer>
      </div>

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

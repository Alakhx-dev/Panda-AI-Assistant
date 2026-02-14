import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Send, Plus, LogOut, MessageSquare, Loader2, Trash2, Mic, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { streamChat, type Msg } from "@/lib/chatStream";
import { toast } from "sonner";
import { SettingsDropdown } from "@/components/SettingsDropdown";
import { ProfileDropdown } from "@/components/ProfileDropdown";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    const loadConvos = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("id, title, created_at")
        .order("updated_at", { ascending: false });
      if (data) setConversations(data);
    };
    loadConvos();
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConvoId) { setMessages([]); return; }
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", activeConvoId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
    };
    loadMessages();
  }, [activeConvoId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const createNewChat = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: "New Chat" })
      .select("id, title, created_at")
      .single();
    if (error) { toast.error("Failed to create chat"); return; }
    setConversations(prev => [data, ...prev]);
    setActiveConvoId(data.id);
    setMessages([]);
  }, [user]);

  const deleteConversation = async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvoId === id) { setActiveConvoId(null); setMessages([]); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFile(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !pendingFile) return;
    if (isLoading || !user) return;

    let convoId = activeConvoId;
    if (!convoId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: input.slice(0, 50) || "New Chat" })
        .select("id, title, created_at")
        .single();
      if (error || !data) { toast.error("Failed to create conversation"); return; }
      convoId = data.id;
      setConversations(prev => [data, ...prev]);
      setActiveConvoId(convoId);
    }

    // Combine file info with message if file exists
    let finalContent = input.trim();
    if (pendingFile) {
      finalContent = `📎 File: ${pendingFile.name}\n${finalContent || "Please analyze this file."}`;
    }

    const userMsg: Msg = { role: "user", content: finalContent };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setPendingFile(null);
    setIsLoading(true);

    // Save user message
    await supabase.from("messages").insert({
      conversation_id: convoId,
      user_id: user.id,
      role: "user",
      content: userMsg.content,
    });

    let assistantSoFar = "";
    const allMsgs = [...messages, userMsg];

    try {
      await streamChat({
        messages: allMsgs,
        onDelta: (chunk) => {
          assistantSoFar += chunk;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
            }
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
        },
        onDone: async () => {
          setIsLoading(false);
          // Save assistant message
          await supabase.from("messages").insert({
            conversation_id: convoId!,
            user_id: user.id,
            role: "assistant",
            content: assistantSoFar,
          });
          // Update conversation title if first message
          if (messages.length === 0) {
            const title = userMsg.content.slice(0, 50);
            await supabase.from("conversations").update({ title }).eq("id", convoId!);
            setConversations(prev => prev.map(c => c.id === convoId ? { ...c, title } : c));
          }
        },
      });
    } catch (e) {
      setIsLoading(false);
      toast.error(e instanceof Error ? e.message : "Failed to get AI response");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground animate-pulse">{t("loading")}</span>
        </div>
      </div>
    );
  }

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="chat-page flex h-screen transition-colors duration-300">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex h-full flex-col sidebar overflow-hidden"
          >
            {/* Header with Logo */}
            <div className="flex items-center gap-3 p-4">
              <img src="/assets/panda.jpeg" className="h-8 w-8 object-contain" alt="Panda AI" />
              <span className="font-bold text-lg text-foreground">
                Panda <span className="gradient-text">AI</span>
              </span>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
              <Button
                onClick={createNewChat}
                className="w-full btn-primary"
              >
                <Plus className="mr-2 h-4 w-4" /> {t("newChat")}
              </Button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center gap-2 rounded-md px-3 py-2.5 text-sm cursor-pointer transition-all duration-200 ${activeConvoId === c.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    }`}
                  onClick={() => setActiveConvoId(c.id)}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{c.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Sign Out */}
            <div className="border-t border-border/10 p-3">
              <Button
                variant="ghost"
                onClick={async () => { await signOut(); navigate("/"); }}
                className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
              >
                <LogOut className="mr-2 h-4 w-4" /> {t("signOut")}
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-border/10 px-6 py-3.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          <h2 className="flex-1 text-sm font-medium text-muted-foreground truncate">
            {activeConvoId
              ? conversations.find(c => c.id === activeConvoId)?.title || "Chat"
              : t("startNewConvo")}
          </h2>
          <div className="flex items-center gap-1">
            <SettingsDropdown />
            <ProfileDropdown />
          </div>
        </header>

        {/* Messages or Empty State */}
        {isEmpty ? (
          // Landing-Style Centered Empty State
          <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-center mb-12"
            >
              {/* Powered By Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-white/5 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
                <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                {t("poweredBy")}
              </div>

              {/* Hero Title */}
              <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-7xl mb-6">
                {t("heroTitle1")}
                <br />
                <span className="gradient-text glow-text">{t("heroTitle2")}</span>
              </h1>

              {/* Hero Description */}
              <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
                {t("heroDesc")}
              </p>
            </motion.div>

            {/* Centered Input */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="w-full max-w-3xl"
            >
              {/* File Preview */}
              {pendingFile && (
                <div className="file-preview mb-2 px-4 py-2 bg-primary/10 rounded-lg flex items-center justify-between">
                  <span className="text-sm text-foreground">📎 {pendingFile.name}</span>
                  <button onClick={() => setPendingFile(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="chat-input-wrapper">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/5 transition-all"
                  title="Upload file"
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("typeMessage")}
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/40"
                  style={{ maxHeight: "120px" }}
                  onInput={(e) => {
                    const el = e.target as HTMLTextAreaElement;
                    el.style.height = "auto";
                    el.style.height = Math.min(el.scrollHeight, 120) + "px";
                  }}
                />
                <button
                  onClick={handleMicClick}
                  className={`mic-btn ${isListening ? "listening" : ""} flex items-center justify-center`}
                  title={isListening ? "Stop recording" : "Start recording"}
                >
                  <Mic className="h-4 w-4" />
                </button>
                <Button
                  onClick={sendMessage}
                  disabled={(!input.trim() && !pendingFile) || isLoading}
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full btn-primary"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        ) : (
          // Messages View with Fixed Bottom Input
          <>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="mx-auto max-w-[820px] space-y-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex shrink-0 mt-1">
                        <img src="/assets/panda.jpeg" className="h-8 w-8 object-contain" alt="Panda" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed transition-all duration-200 ${msg.role === "user"
                        ? "user-bubble"
                        : "ai-bubble"
                        }`}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </motion.div>
                ))}

                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="flex shrink-0 mt-1">
                      <img src="/assets/panda.jpeg" className="h-8 w-8 object-contain" alt="Panda" />
                    </div>
                    <div className="rounded-2xl ai-bubble px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Fixed Bottom Input */}
            <div className="px-4 py-4">
              <div className="mx-auto max-w-[820px]">
                {/* File Preview */}
                {pendingFile && (
                  <div className="file-preview mb-2 px-4 py-2 bg-primary/10 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-foreground">📎 {pendingFile.name}</span>
                    <button onClick={() => setPendingFile(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="chat-input-wrapper">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/5 transition-all"
                    title="Upload file"
                  >
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t("typeMessage")}
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/40"
                    style={{ maxHeight: "120px" }}
                    onInput={(e) => {
                      const el = e.target as HTMLTextAreaElement;
                      el.style.height = "auto";
                      el.style.height = Math.min(el.scrollHeight, 120) + "px";
                    }}
                  />
                  <button
                    onClick={handleMicClick}
                    className={`mic-btn ${isListening ? "listening" : ""} flex items-center justify-center`}
                    title={isListening ? "Stop recording" : "Start recording"}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <Button
                    onClick={sendMessage}
                    disabled={(!input.trim() && !pendingFile) || isLoading}
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full btn-primary"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 right-6 text-sm text-muted-foreground opacity-70 hover:opacity-100 transition-opacity duration-300 pointer-events-none select-none">
        Made with <span className="text-red-500">❤️</span> by <span className="text-primary font-medium">Alakh</span>
      </div>
    </div>
  );
};

export default Chat;

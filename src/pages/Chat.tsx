import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Bot, Send, Plus, LogOut, MessageSquare, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { streamChat, type Msg } from "@/lib/chatStream";
import { toast } from "sonner";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

const Chat = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    let convoId = activeConvoId;
    if (!convoId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: input.slice(0, 50) })
        .select("id, title, created_at")
        .single();
      if (error || !data) { toast.error("Failed to create conversation"); return; }
      convoId = data.id;
      setConversations(prev => [data, ...prev]);
      setActiveConvoId(convoId);
    }

    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
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
          <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex h-full flex-col border-r border-border/30 bg-sidebar overflow-hidden"
          >
            <div className="flex items-center gap-2 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary animate-glow-pulse">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">Panda <span className="gradient-text">AI</span></span>
            </div>

            <Button
              onClick={createNewChat}
              variant="outline"
              className="mx-3 mb-3 border-border/40 bg-surface/50 hover:bg-surface-hover transition-all hover:border-primary/30"
            >
              <Plus className="mr-2 h-4 w-4" /> New Chat
            </Button>

            <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-all duration-200 ${activeConvoId === c.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-sidebar-foreground hover:bg-sidebar-accent border border-transparent"
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

            <div className="border-t border-border/20 p-3">
              <Button
                variant="ghost"
                onClick={async () => { await signOut(); navigate("/"); }}
                className="w-full justify-start text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-border/20 px-4 py-3 bg-background/80 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          <h2 className="text-sm font-medium text-muted-foreground">
            {activeConvoId
              ? conversations.find(c => c.id === activeConvoId)?.title || "Chat"
              : "Start a new conversation"}
          </h2>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center pt-20 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 animate-float">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="text-xl font-semibold text-foreground"
                >
                  How can I help you today?
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="mt-2 text-sm text-muted-foreground"
                >
                  Ask me anything — I'm here to help you learn.
                </motion.p>
              </div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all ${msg.role === "user"
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/10"
                      : "bg-ai-bubble text-foreground border border-border/20"
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl bg-ai-bubble border border-border/20 px-4 py-3">
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

        {/* Input */}
        <div className="border-t border-border/20 px-4 py-4 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-end gap-3">
            <div className="flex-1 rounded-2xl border border-border/30 bg-surface/50 px-4 py-3 backdrop-blur-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 focus-within:shadow-lg focus-within:shadow-primary/5 transition-all duration-300">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                rows={1}
                className="w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                style={{ maxHeight: "120px" }}
                onInput={(e) => {
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 120) + "px";
                }}
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl glow-blue disabled:opacity-30 transition-all hover:scale-105"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

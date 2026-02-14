import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CursorGlow } from "@/components/CursorGlow";
import { Bot, Sparkles, MessageSquare, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <CursorGlow />

      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px] animate-pulse-glow" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[120px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-primary/3 blur-[140px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(hsl(220 90% 56% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(220 90% 56% / 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Nav */}
        <nav className="flex items-center justify-between px-6 py-5 md:px-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary glow-blue">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Panda <span className="gradient-text">AI</span>
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <Button variant="ghost" onClick={() => navigate("/login")} className="text-muted-foreground hover:text-foreground transition-colors">
              Log in
            </Button>
            <Button onClick={() => navigate("/signup")} className="glow-blue group">
              Get Started
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </motion.div>
        </nav>

        {/* Hero */}
        <main className="flex flex-1 flex-col items-center px-6 pt-16 pb-16 text-center md:pt-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-surface/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Powered by Advanced AI
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-7xl"
          >
            Your Intelligent
            <br />
            <span className="gradient-text glow-text">Study Assistant</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl"
          >
            Get clear, step-by-step explanations for any topic. Panda AI helps you learn smarter, not harder.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-10 flex gap-4"
          >
            <Button size="lg" onClick={() => navigate("/signup")} className="px-8 text-base glow-blue group">
              Start Chatting
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")} className="px-8 text-base border-border/50 hover:bg-surface transition-all">
              Sign In
            </Button>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-24 grid max-w-4xl grid-cols-1 gap-5 md:grid-cols-3"
          >
            {[
              { icon: MessageSquare, title: "Natural Conversations", desc: "Chat naturally and get intelligent responses tailored to your questions" },
              { icon: Sparkles, title: "Step-by-Step Learning", desc: "Complex topics broken down into clear, digestible explanations" },
              { icon: Shield, title: "Private & Secure", desc: "Your conversations are encrypted and never shared with third parties" },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="group rounded-xl card-glass p-6 text-left"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-border/20 px-6 py-6 md:px-12">
          <div className="mx-auto max-w-4xl flex flex-col items-center gap-3 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Panda <span className="gradient-text">AI</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} Panda AI. Built with ❤️ for learners everywhere.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;

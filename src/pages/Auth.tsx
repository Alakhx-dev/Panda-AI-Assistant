import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalHeader } from "@/components/GlobalHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUp = location.pathname === "/signup";
  const { signUp, signIn } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = isSignUp ? await signUp(email, password) : await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(isSignUp ? "Account created!" : "Welcome back!");
        navigate("/chat");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 transition-colors duration-300">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-accent/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <GlobalHeader className="absolute -top-24 right-0 md:fixed md:top-6 md:right-6" authenticated={false} />
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2" onClick={() => navigate("/")} role="button">
          <img src="/assets/panda.jpeg" alt="Panda AI Logo" className="h-10 w-10 object-contain" />
          <span className="text-2xl font-bold">
            Panda <span className="gradient-text">AI</span>
          </span>
        </div>

        {/* Form card */}
        <div className="rounded-2xl card-glass p-8 shadow-2xl shadow-primary/5">
          <h2 className="mb-1 text-center text-2xl font-bold text-foreground">
            {isSignUp ? t("createAccount") : t("welcomeBack")}
          </h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {isSignUp ? t("startLearning") : t("signInContinue")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-border/50 bg-white/5 placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-border/50 bg-white/5 placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
              />
            </div>

            <Button type="submit" className="w-full glow-blue transition-all hover:scale-[1.01]" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? t("createAccountBtn") : t("signInBtn")}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? t("alreadyHaveAccount") : t("dontHaveAccount")}{" "}
            <button
              onClick={() => navigate(isSignUp ? "/login" : "/signup")}
              className="font-medium text-primary hover:underline transition-colors"
            >
              {isSignUp ? t("signIn") : t("signUp")}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;

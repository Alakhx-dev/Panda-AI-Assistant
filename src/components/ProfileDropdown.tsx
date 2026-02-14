import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { useNavigate } from "react-router-dom";

export const ProfileDropdown = () => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { user, signOut } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLogout = async () => {
        setOpen(false);
        await signOut();
        navigate("/");
    };

    return (
        <div ref={ref} className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(!open)}
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface transition-all duration-200"
                title={t("profile")}
            >
                <User className="h-4.5 w-4.5" />
            </Button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-border/30 bg-card/90 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden"
                    >
                        <div className="border-b border-border/20 px-4 py-3">
                            <p className="text-xs text-muted-foreground">{t("loggedInAs")}</p>
                            <p className="text-sm font-medium text-foreground truncate mt-0.5">
                                {user?.email || "—"}
                            </p>
                        </div>

                        <div className="p-2">
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                {t("signOut")}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Globe, Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import type { Lang } from "@/context/LanguageContext";
import type { ThemeId } from "@/themes/theme-config";

export const SettingsDropdown = () => {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<"main" | "language" | "theme">("main");
    const ref = useRef<HTMLDivElement>(null);
    const { themeId, setTheme, allThemes } = useTheme();
    const { lang, setLang, t } = useLanguage();

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setTab("main");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleToggle = () => {
        setOpen(!open);
        if (open) setTab("main");
    };

    return (
        <div ref={ref} className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={handleToggle}
                className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface transition-all duration-200"
                title={t("settings")}
            >
                <Settings className="h-4.5 w-4.5" />
            </Button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-border/30 bg-card/90 backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="border-b border-border/20 px-4 py-3">
                            <h3 className="text-sm font-semibold text-foreground">{t("settings")}</h3>
                        </div>

                        {/* Main menu */}
                        {tab === "main" && (
                            <div className="p-2">
                                <button
                                    onClick={() => setTab("language")}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-surface transition-colors"
                                >
                                    <Globe className="h-4 w-4 text-primary" />
                                    {t("language")}
                                    <span className="ml-auto text-xs text-muted-foreground">
                                        {lang === "en" ? "English" : "हिंदी"}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setTab("theme")}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-surface transition-colors"
                                >
                                    <Palette className="h-4 w-4 text-primary" />
                                    {t("theme")}
                                    <span className="ml-auto text-xs text-muted-foreground">
                                        {allThemes.find((t) => t.id === themeId)?.name}
                                    </span>
                                </button>
                            </div>
                        )}

                        {/* Language selector */}
                        {tab === "language" && (
                            <div className="p-2">
                                <button
                                    onClick={() => setTab("main")}
                                    className="mb-1 flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    ← {t("settings")}
                                </button>
                                {(["en", "hi"] as Lang[]).map((l) => (
                                    <button
                                        key={l}
                                        onClick={() => { setLang(l); setTab("main"); }}
                                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${lang === l
                                                ? "bg-primary/10 text-primary"
                                                : "text-foreground hover:bg-surface"
                                            }`}
                                    >
                                        <span className="text-base">{l === "en" ? "🇺🇸" : "🇮🇳"}</span>
                                        {l === "en" ? t("english") : t("hindi")}
                                        {lang === l && <Check className="ml-auto h-4 w-4" />}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Theme selector */}
                        {tab === "theme" && (
                            <div className="p-2">
                                <button
                                    onClick={() => setTab("main")}
                                    className="mb-1 flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    ← {t("settings")}
                                </button>
                                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                                    {allThemes.map((th) => (
                                        <button
                                            key={th.id}
                                            onClick={() => setTheme(th.id as ThemeId)}
                                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${themeId === th.id
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-foreground hover:bg-surface"
                                                }`}
                                        >
                                            <div
                                                className="h-5 w-5 rounded-full shrink-0 border border-border/30"
                                                style={{ background: th.preview }}
                                            />
                                            {lang === "hi" ? th.nameHi : th.name}
                                            {themeId === th.id && <Check className="ml-auto h-4 w-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

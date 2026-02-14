import { useState } from "react";
import { Settings, Moon, Sun, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

export const SettingsDropdown = () => {
    const [open, setOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { lang, setLang, t } = useLanguage();

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(!open)}
                className="text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
                <Settings className="h-5 w-5" />
            </Button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 z-50 rounded-xl card border border-border/20 shadow-xl p-2">
                        {/* Mode Toggle */}
                        <div className="px-3 py-2 mb-1">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Appearance</p>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-sm"
                                onClick={() => {
                                    toggleTheme();
                                    setOpen(false);
                                }}
                            >
                                {theme === "dark" ? (
                                    <>
                                        <Sun className="mr-2 h-4 w-4" />
                                        Light Mode
                                    </>
                                ) : (
                                    <>
                                        <Moon className="mr-2 h-4 w-4" />
                                        Dark Mode
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Language Toggle */}
                        <div className="px-3 py-2 border-t border-border/20">
                            <p className="text-xs font-medium text-muted-foreground mb-2">{t("language")}</p>
                            <div className="space-y-1">
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start text-sm ${lang === "en" ? "bg-primary/10 text-primary" : ""}`}
                                    onClick={() => {
                                        setLang("en");
                                        setOpen(false);
                                    }}
                                >
                                    <Globe className="mr-2 h-4 w-4" />
                                    English
                                </Button>
                                <Button
                                    variant="ghost"
                                    className={`w-full justify-start text-sm ${lang === "hi" ? "bg-primary/10 text-primary" : ""}`}
                                    onClick={() => {
                                        setLang("hi");
                                        setOpen(false);
                                    }}
                                >
                                    <Globe className="mr-2 h-4 w-4" />
                                    हिन्दी
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { themes, DEFAULT_THEME, type ThemeId, type ThemeConfig } from "@/themes/theme-config";

interface ThemeContextType {
    themeId: ThemeId;
    theme: ThemeConfig;
    setTheme: (id: ThemeId) => void;
    allThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

function applyTheme(id: ThemeId) {
    const theme = themes.find((t) => t.id === id);
    if (!theme) return;
    const root = document.documentElement;
    root.setAttribute("data-theme", id);
    Object.entries(theme.vars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [themeId, setThemeId] = useState<ThemeId>(() => {
        const saved = localStorage.getItem("panda-theme") as ThemeId | null;
        return saved && themes.some((t) => t.id === saved) ? saved : DEFAULT_THEME;
    });

    const theme = themes.find((t) => t.id === themeId)!;

    useEffect(() => {
        applyTheme(themeId);
        localStorage.setItem("panda-theme", themeId);
    }, [themeId]);

    const setTheme = (id: ThemeId) => setThemeId(id);

    return (
        <ThemeContext.Provider value={{ themeId, theme, setTheme, allThemes: themes }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
    return ctx;
};

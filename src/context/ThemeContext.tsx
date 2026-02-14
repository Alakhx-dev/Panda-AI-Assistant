import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { themes, DEFAULT_THEME, type ThemeId, type ThemeConfig } from "@/themes/theme-config";

interface ThemeContextType {
    themeId: ThemeId;
    theme: ThemeConfig;
    setTheme: (id: ThemeId) => void;
    allThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    // Initialize state from localStorage or default
    const [themeId, setThemeId] = useState<ThemeId>(() => {
        const saved = localStorage.getItem("app-theme") as ThemeId | null;
        return saved && themes.some((t) => t.id === saved) ? saved : DEFAULT_THEME;
    });

    const theme = themes.find((t) => t.id === themeId)!;

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute("data-theme", themeId);
        localStorage.setItem("app-theme", themeId);
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

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Mode = "dark" | "light";

interface ThemeContextType {
    mode: Mode;
    toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [mode, setMode] = useState<Mode>(() => {
        const saved = localStorage.getItem("mode") as Mode | null;
        return saved || "dark";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-mode", mode);
        localStorage.setItem("mode", mode);
    }, [mode]);

    const toggleMode = () => {
        setMode(prev => prev === "dark" ? "light" : "dark");
    };

    return (
        <ThemeContext.Provider value={{ mode, toggleMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within ThemeProvider");
    return context;
};

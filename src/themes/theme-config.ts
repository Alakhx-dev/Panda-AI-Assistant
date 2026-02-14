// 7 Theme definitions — CSS-driven
export type ThemeId =
    | "fusion-dark"
    | "neon-purple"
    | "orange-inferno"
    | "glass-light"
    | "ocean-blue"
    | "minimal-beige"
    | "midnight-pro";

export interface ThemeConfig {
    id: ThemeId;
    name: string;
    nameHi: string; // Keeping Hindi names support
    preview: string; // gradient preview for the selector
}

export const themes: ThemeConfig[] = [
    {
        id: "fusion-dark",
        name: "Fusion Dark",
        nameHi: "फ्यूजन डार्क",
        preview: "linear-gradient(135deg, #050510 0%, #7b2cff 50%, #00d4ff 100%)",
    },
    {
        id: "neon-purple",
        name: "Neon Purple",
        nameHi: "नियॉन पर्पल",
        preview: "linear-gradient(135deg, #1a0033 0%, #b026ff 50%, #00f0ff 100%)",
    },
    {
        id: "orange-inferno",
        name: "Orange Inferno",
        nameHi: "ऑरेंज इन्फर्नो",
        preview: "linear-gradient(135deg, #1a0f00 0%, #ff6a00 50%, #ffb347 100%)",
    },
    {
        id: "glass-light",
        name: "Glass Light",
        nameHi: "ग्लास लाइट",
        preview: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 50%, #00bcd4 100%)",
    },
    {
        id: "ocean-blue",
        name: "Ocean Blue",
        nameHi: "ओशिन ब्लू",
        preview: "linear-gradient(135deg, #001f3f 0%, #00c6ff 50%, #0072ff 100%)",
    },
    {
        id: "minimal-beige",
        name: "Minimal Beige",
        nameHi: "मिनिमल बेज",
        preview: "linear-gradient(135deg, #f4f1ed 0%, #6b4f4f 50%, #a67c52 100%)",
    },
    {
        id: "midnight-pro",
        name: "Midnight Pro",
        nameHi: "मिडनाइट प्रो",
        preview: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    },
];

export const DEFAULT_THEME: ThemeId = "fusion-dark";

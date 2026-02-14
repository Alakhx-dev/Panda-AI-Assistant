import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

export type Lang = "en" | "hi";

const translations = {
    en: {
        // Landing
        poweredBy: "Powered by Advanced AI",
        heroTitle1: "Your Intelligent",
        heroTitle2: "Study Assistant",
        heroDesc: "Get clear, step-by-step explanations for any topic. Panda AI helps you learn smarter, not harder.",
        startChatting: "Start Chatting",
        signIn: "Sign In",
        logIn: "Log in",
        getStarted: "Get Started",
        featureConvoTitle: "Natural Conversations",
        featureConvoDesc: "Chat naturally and get intelligent responses tailored to your questions",
        featureLearnTitle: "Step-by-Step Learning",
        featureLearnDesc: "Complex topics broken down into clear, digestible explanations",
        featureSecureTitle: "Private & Secure",
        featureSecureDesc: "Your conversations are encrypted and never shared with third parties",
        footerCredit: "Built with ❤️ by",

        // Auth
        createAccount: "Create your account",
        welcomeBack: "Welcome back",
        startLearning: "Start learning with Panda AI",
        signInContinue: "Sign in to continue",
        email: "Email",
        password: "Password",
        createAccountBtn: "Create Account",
        signInBtn: "Sign In",
        alreadyHaveAccount: "Already have an account?",
        dontHaveAccount: "Don't have an account?",
        signUp: "Sign up",

        // Chat
        newChat: "New Chat",
        signOut: "Sign Out",
        startNewConvo: "Start a new conversation",
        helpToday: "How can I help you today?",
        askAnything: "Ask me anything — I'm here to help you learn.",
        typeMessage: "Type your message...",
        loading: "Loading...",

        // Settings
        settings: "Settings",
        language: "Language",
        theme: "Theme",
        english: "English",
        hindi: "हिंदी",
        profile: "Profile",
        loggedInAs: "Logged in as",

        // 404
        pageNotFound: "Oops! Page not found",
        returnHome: "Return to Home",
    },
    hi: {
        // Landing
        poweredBy: "उन्नत AI द्वारा संचालित",
        heroTitle1: "आपका बुद्धिमान",
        heroTitle2: "अध्ययन सहायक",
        heroDesc: "किसी भी विषय के लिए स्पष्ट, चरण-दर-चरण स्पष्टीकरण प्राप्त करें। Panda AI आपको होशियारी से सीखने में मदद करता है।",
        startChatting: "चैट शुरू करें",
        signIn: "साइन इन",
        logIn: "लॉग इन",
        getStarted: "शुरू करें",
        featureConvoTitle: "प्राकृतिक बातचीत",
        featureConvoDesc: "स्वाभाविक रूप से चैट करें और अपने सवालों के अनुसार बुद्धिमान उत्तर पाएं",
        featureLearnTitle: "चरण-दर-चरण सीखना",
        featureLearnDesc: "जटिल विषयों को स्पष्ट, सरल व्याख्याओं में विभाजित किया गया",
        featureSecureTitle: "निजी और सुरक्षित",
        featureSecureDesc: "आपकी बातचीत एन्क्रिप्टेड है और कभी भी तीसरे पक्ष के साथ साझा नहीं की जाती",
        footerCredit: "❤️ के साथ बनाया गया",

        // Auth
        createAccount: "अपना खाता बनाएं",
        welcomeBack: "वापसी पर स्वागत है",
        startLearning: "Panda AI के साथ सीखना शुरू करें",
        signInContinue: "जारी रखने के लिए साइन इन करें",
        email: "ईमेल",
        password: "पासवर्ड",
        createAccountBtn: "खाता बनाएं",
        signInBtn: "साइन इन",
        alreadyHaveAccount: "पहले से खाता है?",
        dontHaveAccount: "खाता नहीं है?",
        signUp: "साइन अप",

        // Chat
        newChat: "नई चैट",
        signOut: "साइन आउट",
        startNewConvo: "एक नई बातचीत शुरू करें",
        helpToday: "आज मैं आपकी कैसे मदद कर सकता हूं?",
        askAnything: "कुछ भी पूछें — मैं आपकी मदद के लिए यहां हूं।",
        typeMessage: "अपना संदेश लिखें...",
        loading: "लोड हो रहा है...",

        // Settings
        settings: "सेटिंग्स",
        language: "भाषा",
        theme: "थीम",
        english: "English",
        hindi: "हिंदी",
        profile: "प्रोफ़ाइल",
        loggedInAs: "लॉग इन है",

        // 404
        pageNotFound: "उफ़! पेज नहीं मिला",
        returnHome: "होम पर लौटें",
    },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLangState] = useState<Lang>(() => {
        const saved = localStorage.getItem("panda-lang") as Lang | null;
        return saved === "hi" ? "hi" : "en";
    });

    useEffect(() => {
        localStorage.setItem("panda-lang", lang);
        document.documentElement.setAttribute("lang", lang);
    }, [lang]);

    const setLang = (l: Lang) => setLangState(l);

    const t = useCallback(
        (key: TranslationKey): string => {
            return translations[lang][key] || translations.en[key] || key;
        },
        [lang]
    );

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
    return ctx;
};

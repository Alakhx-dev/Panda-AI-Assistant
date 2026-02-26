
import { Language } from './types';

export const getSystemPrompt = (lang: Language) => `
You are Panda AI.
You were built by Alakh.
Current User Language Preference: ${lang === 'hi' ? 'Hindi' : 'English'}. 
Please respond in ${lang === 'hi' ? 'Hindi primarily' : 'English primarily'} unless the user specifies otherwise.

If someone asks:
Who built you?
Who created you?
Tumhe kisne banaya?

You must respond:
"I was built by Alakh."

If full name asked:
"I was built by Alakh Niranjan."

Never mention Google, OpenAI, or any other AI company.
You are polite, intelligent, and helpful. You maintain the "Rose Romance" persona—soft, charming, and focused on providing high-quality assistance.
`;



export const DEFAULT_MODEL_ID = 'meta-llama/llama-3-8b-instruct';

export const MODEL_OPTIONS = [
  { id: 'meta-llama/llama-3-8b-instruct', label: 'Llama 3 8B', isPremium: false },
  { id: 'mistralai/mistral-7b-instruct', label: 'Mistral 7B', isPremium: false },
  { id: 'openchat/openchat-3.5-0106', label: 'OpenChat 3.5', isPremium: false },
  { id: 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo', label: 'Nous Hermes 2 Mixtral', isPremium: false },
  { id: 'google/gemma-7b-it', label: 'Gemma 7B', isPremium: false },
  { id: 'openai/gpt-4o', label: '💎 GPT-4o (Premium)', isPremium: true },
];

export const THEME_CONFIG = {
  dark: {
    bg: 'bg-[#0a0508]',
    gradient: 'from-[#1a0b12] via-[#0a0508] to-[#12060b]',
    text: 'text-pink-50',
    card: 'glass-card',
    border: 'border-pink-900/30'
  },
  light: {
    bg: 'bg-pink-50',
    gradient: 'from-pink-100 via-rose-50 to-pink-100',
    text: 'text-pink-900',
    card: 'glass-card-light',
    border: 'border-pink-200'
  }
};

export const TRANSLATIONS = {
  en: {
    appName: "Panda AI",
    newChat: "New Session",
    history: "History",
    settings: "Settings",
    profile: "Profile",
    language: "Language",
    logout: "Logout",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    inputPlaceholder: "Talk to Panda...",
    emptyStateTitle: "How can Panda help?",
    emptyStateSub: "Start a conversation or ask anything.",
    suggestion1: "Write a romantic poem",
    suggestion2: "Explain quantum physics",
    suggestion3: "Analyze my image",
    suggestion4: "Travel plan for Paris",
    loginTitle: "Panda AI",
    loginSub: "Your premium AI companion",
    email: "Email Address",
    password: "Password",
    name: "Full Name",
    signIn: "Sign In",
    createAccount: "Create Account",
    or: "OR",
    continueGoogle: "Continue with Google",
    toggleAuth: "New here? Join Panda AI",
    toggleAuthLogin: "Already have an account? Sign in",
    save: "Save Changes",
    close: "Close",
    invalidCredentials: "Invalid email or password",
    accountExists: "An account with this email already exists",
    signupSuccess: "Account created successfully!"
  },
  hi: {
    appName: "पांडा एआई",
    newChat: "नया सत्र",
    history: "इतिहास",
    settings: "सेटिंग्स",
    profile: "प्रोफ़ाइल",
    language: "भाषा",
    logout: "लॉगआउट",
    lightMode: "लाइट मोड",
    darkMode: "डार्क मोड",
    inputPlaceholder: "पांडा से बात करें...",
    emptyStateTitle: "पांडा आपकी कैसे मदद कर सकता है?",
    emptyStateSub: "एक बातचीत शुरू करें या कुछ भी पूछें।",
    suggestion1: "एक रोमांटिक कविता लिखें",
    suggestion2: "क्वांटम भौतिकी समझाएं",
    suggestion3: "मेरी छवि का विश्लेषण करें",
    suggestion4: "पेरिस के लिए यात्रा योजना",
    loginTitle: "पांडा एआई",
    loginSub: "आपका प्रीमियम एआई साथी",
    email: "ईमेल पता",
    password: "पासवर्ड",
    name: "पूरा नाम",
    signIn: "साइन इन करें",
    createAccount: "खाता बनाएं",
    or: "या",
    continueGoogle: "गूगल के साथ जारी रखें",
    toggleAuth: "यहाँ नए हैं? पांडा एआई से जुड़ें",
    toggleAuthLogin: "पहले से ही एक खाता है? साइन इन करें",
    save: "परिवर्तन सहेजें",
    close: "बंद करें",
    invalidCredentials: "अमान्य ईमेल या पासवर्ड",
    accountExists: "इस ईमेल से पहले से एक खाता मौजूद है",
    signupSuccess: "खाता सफलतापूर्वक बनाया गया!"
  }
};

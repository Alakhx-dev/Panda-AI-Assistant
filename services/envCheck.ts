/**
 * Environment Variable Checker
 * Call this early in the app to diagnose env loading issues
 */

export const checkEnvironment = () => {
  console.group("🔍 ENVIRONMENT SETUP CHECK");
  
  // Log all environment variables
  console.log("📦 All import.meta.env variables:", Object.entries(import.meta.env).reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {} as Record<string, any>));
  
  // Check for VITE_GEMINI_API_KEY specifically
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log("🔑 VITE_GEMINI_API_KEY:", apiKey ? "✅ PRESENT" : "❌ MISSING");
  
  if (apiKey) {
    console.log("  Length:", apiKey.length);
    console.log("  Preview:", apiKey.substring(0, 10) + "..." + apiKey.substring(apiKey.length - 5));
    console.log("  Has quotes:", apiKey.includes('"') || apiKey.includes("'") ? "⚠️ YES (REMOVE!)" : "✅ NO");
  } else {
    console.warn("  ⚠️ API Key is not loaded!");
    console.warn("  • Ensure .env.local exists at project root");
    console.warn("  • Ensure VITE_GEMINI_API_KEY=your_key (no quotes)");
    console.warn("  • Restart dev server after .env changes");
  }
  
  // Check for NODE_ENV
  console.log("🌍 NODE_ENV:", import.meta.env.MODE);
  
  // Check for DEV/PROD mode
  console.log("📍 Is Development:", import.meta.env.DEV);
  console.log("📍 Is Production:", import.meta.env.PROD);
  
  console.groupEnd();
  
  return !!apiKey;
};

/**
 * Quick debug for template literals
 */
export const debugEnv = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  return {
    isDefined: key !== undefined,
    isEmpty: key === '',
    isNull: key === null,
    value: key ? `${key.substring(0, 5)}...${key.substring(key.length - 3)}` : 'NOT FOUND',
  };
};

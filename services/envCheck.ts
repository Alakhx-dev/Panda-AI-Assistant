/**
 * Environment Variable Checker
 * Call this early in the app to diagnose env loading issues
 */

export const checkEnvironment = () => {
  console.group("🔍 ENVIRONMENT SETUP CHECK");

  // Check for VITE_OPENROUTER_API_KEY specifically
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  console.log("🔑 VITE_OPENROUTER_API_KEY:", apiKey ? "✅ PRESENT" : "❌ MISSING");

  if (apiKey) {
    console.log("  Length:", apiKey.length);
    console.log("  Preview:", apiKey.substring(0, 12) + "..." + apiKey.substring(apiKey.length - 5));
  } else {
    console.warn("  ⚠️ OpenRouter API Key is not loaded!");
    console.warn("  • Ensure .env.local exists at project root");
    console.warn("  • Ensure VITE_OPENROUTER_API_KEY=sk-or-... (no quotes)");
    console.warn("  • Restart dev server after .env changes");
  }

  // Check for DEV/PROD mode
  console.log("🌍 Mode:", import.meta.env.MODE);
  console.log("📍 Is Development:", import.meta.env.DEV);
  console.log("📍 Is Production:", import.meta.env.PROD);

  console.groupEnd();

  return !!apiKey;
};

/**
 * Quick debug for template literals
 */
export const debugEnv = () => {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  return {
    isDefined: key !== undefined,
    isEmpty: key === '',
    isNull: key === null,
    value: key ? `${key.substring(0, 8)}...${key.substring(key.length - 5)}` : 'NOT FOUND',
  };
};

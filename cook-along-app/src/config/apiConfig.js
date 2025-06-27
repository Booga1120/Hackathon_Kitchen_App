// DO NOT COMMIT THIS FILE WITH REAL CREDENTIALS
// API Configuration for OpenAI
export const API_CONFIG = {
  // OpenAI API settings
  OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
  
  // API Key
  API_KEY: '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',
  
  // Model settings - using gpt-3.5-turbo as default
  MODEL: 'gpt-3.5-turbo',
  TEMPERATURE: 0.7,
  MAX_TOKENS: 1000,
  
  // System prompt for recipe generation
  SYSTEM_PROMPT: 'You are a helpful cooking assistant. Generate recipes based on available ingredients. Return recipes in JSON format with name, ingredients, and steps.'
};

// Get API configuration
export const getApiConfig = () => {
  return API_CONFIG;
}; 
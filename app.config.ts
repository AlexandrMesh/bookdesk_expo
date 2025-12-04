import 'dotenv/config';

// Use require to avoid JSON module typing issues

const appJson = require('./app.json');

/**
 * Expo app config with support for env-based secrets.
 *
 * Secrets are provided via:
 * - .env for local development (loaded by dotenv)
 * - EAS secrets for cloud builds (injected as process.env.*)
 */
export default () => {
  const expo = appJson.expo;

  return {
    ...expo,
    extra: {
      ...(expo.extra ?? {}),
      // API keys from environment
      groqApiKey: process.env.GROQ_API_KEY,
      googleBooksApiKey: process.env.GOOGLE_BOOKS_API_KEY,
      googleSearchApiKey: process.env.GOOGLE_SEARCH_API_KEY,
    },
  };
};

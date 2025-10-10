import i18n from 'i18next';

import { RU, EN } from '~constants/languages';
import detectLanguage from '~utils/detectLanguage';

import appEn from './locales/en/app.json';
import authEn from './locales/en/auth.json';
import booksEn from './locales/en/books.json';
import categoriesEn from './locales/en/categories.json';
import commonEn from './locales/en/common.json';
import customBookEn from './locales/en/customBook.json';
import errorsEn from './locales/en/errors.json';
import goalsEn from './locales/en/goals.json';
import profileEn from './locales/en/profile.json';
import searchEn from './locales/en/search.json';
import statisticEn from './locales/en/statistic.json';
import app from './locales/ru/app.json';
import auth from './locales/ru/auth.json';
import books from './locales/ru/books.json';
import categories from './locales/ru/categories.json';
import common from './locales/ru/common.json';
import customBook from './locales/ru/customBook.json';
import errors from './locales/ru/errors.json';
import goals from './locales/ru/goals.json';
import profile from './locales/ru/profile.json';
import search from './locales/ru/search.json';
import statistic from './locales/ru/statistic.json';

const LanguageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (language: string) => void) => {
    const language = await detectLanguage();
    callback(language);
  },
  init: () => {},
  cacheUserLanguage: () => {},
} as any;

i18n.use(LanguageDetector).init({
  fallbackLng: EN,
  compatibilityJSON: 'v3',
  languages: [RU, EN],
  whitelist: [RU, EN],
  resources: {
    [RU]: {
      common,
      auth,
      books,
      goals,
      search,
      errors,
      profile,
      app,
      categories,
      customBook,
      statistic,
    },
    [EN]: {
      common: commonEn,
      auth: authEn,
      books: booksEn,
      goals: goalsEn,
      search: searchEn,
      errors: errorsEn,
      profile: profileEn,
      app: appEn,
      categories: categoriesEn,
      customBook: customBookEn,
      statistic: statisticEn,
    },
  },
});

export const getT = (namespace: string) => i18n.getFixedT(i18n.language, namespace);

export default i18n;

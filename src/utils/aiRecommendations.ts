/**
 * AI-powered Book Recommendations Service
 * Uses Groq AI (free tier) to analyze user's library and generate personalized recommendations
 * Then uses Google Books API to fetch book details
 */

import { OpenRouter } from '@openrouter/sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

import i18n from '~translations/i18n';
import { IBook } from '~types/books';
import { fetchPersonalizedFromCatalog, fetchPopularFromCatalog, matchCatalogRecommendation } from '~utils/catalogRecommendations';
import { searchOpenLibraryBook } from '~utils/openLibraryRecommendations';

const RECOMMENDATIONS_CACHE_KEY = 'book_recommendations_cache_v6';
const PREVIOUS_RECOMMENDATIONS_KEY = 'previous_recommendations_titles';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Groq API — often geo-blocked in RU (403). Prefer OpenRouter; Open Library is keyless fallback.
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-20b';

const extra = (Constants.expoConfig?.extra || {}) as {
  groqApiKey?: string;
  googleBooksApiKey?: string;
  openRouterApiKey?: string;
};

const GROQ_API_KEY = extra.groqApiKey ?? '';
const GOOGLE_BOOKS_API_KEY = extra.googleBooksApiKey ?? '';
const OPENROUTER_API_KEY = extra.openRouterApiKey ?? '';
const GOOGLE_BOOKS_HAS_KEY = Boolean(GOOGLE_BOOKS_API_KEY);

const isAppRussian = () => (i18n.language || 'en').toLowerCase().startsWith('ru');
const CYRILLIC_TEXT_RE = /[А-Яа-яЁёІіЇїЄєҐґ]/;
const hasCyrillicText = (text?: string) => !!text && CYRILLIC_TEXT_RE.test(text);

/** EN locale: only Latin titles/authors (no Cyrillic). */
const isLocaleCompatibleBook = (book: { title?: string; author?: string }): boolean => {
  if (isAppRussian()) return true;
  return !hasCyrillicText(book.title) && !hasCyrillicText(book.author);
};

export interface IRecommendedBook {
  id: string;
  title: string;
  author: string;
  pages?: number;
  coverUrl?: string;
  coverUrlHQ?: string;
  description?: string;
  genre?: string;
  genreRu?: string;
}

interface CachedRecommendations {
  books: IRecommendedBook[];
  timestamp: number;
  userBooksHash: string;
}

interface AIRecommendation {
  title: string;
  author: string;
  reason?: string;
}

// Cache for genre translations to avoid repeated API calls
const genreTranslationCache: Map<string, string> = new Map();

// Correct translations for common genres (API sometimes translates incorrectly)
const correctGenreTranslations: Record<string, string> = {
  fantasy: 'Фэнтези',
  'science fiction': 'Научная фантастика',
  'sci-fi': 'Научная фантастика',
  fiction: 'Художественная литература',
  'non-fiction': 'Нон-фикшн',
  nonfiction: 'Нон-фикшн',
  mystery: 'Детектив',
  thriller: 'Триллер',
  romance: 'Романтика',
  horror: 'Ужасы',
  biography: 'Биография',
  'self-help': 'Саморазвитие',
  psychology: 'Психология',
  philosophy: 'Философия',
  adventure: 'Приключения',
  classics: 'Классика',
  humor: 'Юмор',
  manga: 'Манга',
  comics: 'Комиксы',
  memoir: 'Мемуары',
  poetry: 'Поэзия',
  drama: 'Драма',
  'young adult': 'Молодёжная литература',
  children: 'Детская литература',
};

/**
 * Translate genre using correct translations or MyMemory API
 */
const translateGenreViaAPI = async (genre: string): Promise<string> => {
  if (!genre) return '';

  const { language } = i18n;
  if (language !== 'ru') {
    return genre;
  }

  const lowerGenre = genre.toLowerCase().trim();

  // Check cache first
  const cacheKey = `${lowerGenre}_ru`;
  if (genreTranslationCache.has(cacheKey)) {
    return genreTranslationCache.get(cacheKey)!;
  }

  // Check correct translations first (for genres that API translates incorrectly)
  if (correctGenreTranslations[lowerGenre]) {
    const translated = correctGenreTranslations[lowerGenre];
    genreTranslationCache.set(cacheKey, translated);
    return translated;
  }

  // Check if genre contains a known key (e.g., "Fantasy Fiction" contains "fantasy")
  for (const [key, value] of Object.entries(correctGenreTranslations)) {
    if (lowerGenre.includes(key)) {
      genreTranslationCache.set(cacheKey, value);
      return value;
    }
  }

  // Use API for other genres
  try {
    const response = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(genre)}&langpair=en|ru`, { timeout: 5000 });

    if (response.data?.responseStatus === 200 && response.data?.responseData?.translatedText) {
      let translated = response.data.responseData.translatedText;
      // Capitalize first letter
      translated = translated.charAt(0).toUpperCase() + translated.slice(1).toLowerCase();
      // Cache the result
      genreTranslationCache.set(cacheKey, translated);
      return translated;
    }
  } catch (error) {
    console.warn('Genre translation API error:', error);
  }

  // Return original if translation fails
  return genre;
};

/**
 * Generate a hash of user's books for cache invalidation
 */
const generateBooksHash = (books: IBook[]): string => {
  const titles = books
    .map((b) => b.title || '')
    .sort()
    .join('|');
  let hash = 0;
  for (let i = 0; i < titles.length; i++) {
    hash = (hash << 5) - hash + titles.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
};

/**
 * Get cached recommendations
 */
export const getCachedRecommendations = async (): Promise<{ books: IRecommendedBook[]; isExpired: boolean } | null> => {
  try {
    const cached = await AsyncStorage.getItem(RECOMMENDATIONS_CACHE_KEY);
    if (!cached) return null;

    const data: CachedRecommendations = JSON.parse(cached);
    const isExpired = Date.now() - data.timestamp > CACHE_EXPIRY_MS;

    // Normalize covers to use HQ version
    const normalizedBooks = data.books.map((book) => ({
      ...book,
      coverUrl: book.coverUrlHQ || book.coverUrl,
    }));

    return { books: normalizedBooks, isExpired };
  } catch {
    return null;
  }
};

/**
 * Save recommendations to cache
 */
const cacheRecommendations = async (books: IRecommendedBook[], userBooksHash: string): Promise<void> => {
  try {
    const data: CachedRecommendations = {
      books,
      timestamp: Date.now(),
      userBooksHash,
    };
    await AsyncStorage.setItem(RECOMMENDATIONS_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to cache recommendations:', error);
  }
};

/**
 * Clear recommendations cache and save previous titles for exclusion
 */
export const clearRecommendationsCache = async (): Promise<void> => {
  // Get current recommendations to add to exclusion list
  const cached = await getCachedRecommendations();
  if (cached && cached.books.length > 0) {
    const existingTitles = await getPreviousRecommendationTitles();
    const newTitles = cached.books.map((b) => b.title.toLowerCase().trim());
    const allTitles = [...new Set([...existingTitles, ...newTitles])].slice(-100); // Keep last 100
    await AsyncStorage.setItem(PREVIOUS_RECOMMENDATIONS_KEY, JSON.stringify(allTitles));
  }
  await AsyncStorage.removeItem(RECOMMENDATIONS_CACHE_KEY);
};

/**
 * Get previously recommended titles (for exclusion on refresh)
 */
const getPreviousRecommendationTitles = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(PREVIOUS_RECOMMENDATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Clear all recommendation history (full reset)
 */
export const clearAllRecommendationHistory = async (): Promise<void> => {
  await AsyncStorage.removeItem(RECOMMENDATIONS_CACHE_KEY);
  await AsyncStorage.removeItem(PREVIOUS_RECOMMENDATIONS_KEY);
};

/**
 * Analyze user's library to extract preferences
 */
const analyzeUserLibrary = (userBooks: IBook[]) => {
  // Sort by rating and votes to find favorites
  const booksWithMetrics = userBooks
    .filter((b) => b.title)
    .map((b) => ({
      ...b,
      score: (b.rating || 0) * 2 + (b.votesCount || 0),
    }))
    .sort((a, b) => b.score - a.score);

  // Favorite books (highly rated or liked)
  const favoriteBooks = booksWithMetrics.filter((b) => (b.rating && b.rating >= 4) || (b.votesCount && b.votesCount > 0)).slice(0, 10);

  // Extract favorite authors (from highly rated books)
  const authorCounts = new Map<string, number>();
  booksWithMetrics.forEach((book) => {
    book.authorsList?.forEach((author) => {
      if (author && author.trim()) {
        const count = authorCounts.get(author) || 0;
        const weight = book.score > 0 ? 2 : 1;
        authorCounts.set(author, count + weight);
      }
    });
  });
  const topAuthors = Array.from(authorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([author]) => author);

  // Extract genres/categories
  const genreCounts = new Map<string, number>();
  booksWithMetrics.forEach((book) => {
    if (book.categoryValue) {
      const count = genreCounts.get(book.categoryValue) || 0;
      const weight = book.score > 0 ? 2 : 1;
      genreCounts.set(book.categoryValue, count + weight);
    }
  });
  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);

  // All books for exclusion
  const allBooks = booksWithMetrics.slice(0, 40);

  return { favoriteBooks, topAuthors, topGenres, allBooks };
};

/**
 * Call OpenRouter API as fallback (works in Russia)
 */
const callOpenRouterAPI = async (systemPrompt: string, userPrompt: string): Promise<AIRecommendation[]> => {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  console.warn('Calling OpenRouter API via SDK...');

  try {
    const openRouter = new OpenRouter({
      apiKey: OPENROUTER_API_KEY,
    });

    const completion = await openRouter.chat.send({
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
    });

    const rawContent = completion.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Empty OpenRouter response');
    }

    // Ensure content is a string
    const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);

    console.warn('OpenRouter response received, content length:', content.length);

    // Remove markdown code block wrapper if present
    const cleanContent = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Try to parse JSON from response
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Handle different response formats
    let recs: AIRecommendation[] = [];

    if (parsed.recommendations) {
      // Check if recommendations contain nested books arrays (by category)
      if (parsed.recommendations[0]?.books) {
        // Flatten nested structure
        for (const category of parsed.recommendations) {
          if (category.books && Array.isArray(category.books)) {
            recs.push(...category.books);
          }
        }
      } else {
        // Direct array of books
        recs = parsed.recommendations;
      }
    }

    console.warn('Found recommendations:', recs.length);
    return recs.filter((r: AIRecommendation) => r && r.title && typeof r.title === 'string');
  } catch (error: unknown) {
    console.error('OpenRouter API error:', error);
    throw error;
  }
};

// OpenRouter is primary, Groq is fallback

/**
 * Call Groq AI to analyze user's library and get book recommendations
 */
const getAIRecommendations = async (userBooks: IBook[], apiKey: string, previousTitles: string[] = []): Promise<AIRecommendation[]> => {
  const isRussian = isAppRussian();

  // Analyze user's library
  const { favoriteBooks, topAuthors, topGenres, allBooks } = analyzeUserLibrary(userBooks);

  // Format favorite books with ratings
  const favoritesText = favoriteBooks
    .map((b) => {
      const authors = b.authorsList?.join(', ') || '';
      const ratingText = b.rating ? ` [рейтинг: ${b.rating}/5]` : '';
      const likedText = b.votesCount ? ' [❤️ понравилась]' : '';
      return `• "${b.title}"${authors ? ` — ${authors}` : ''}${ratingText}${likedText}`;
    })
    .join('\n');

  // Format all books list for exclusion
  const allBooksText = allBooks.map((b) => `"${b.title}"`).join(', ');

  // Format previous recommendations for exclusion (only if refreshing)
  const previousText = previousTitles.length > 0 ? previousTitles.slice(0, 30).join(', ') : '';

  const systemPrompt = isRussian
    ? `Ты - ведущий литературный эксперт и книжный критик с энциклопедическими знаниями мировой литературы. 

ТВОЯ МИССИЯ: Создать идеальную персонализированную подборку книг, которые точно понравятся читателю.

ПРИНЦИПЫ РЕКОМЕНДАЦИЙ:
1. КАЧЕСТВО: Только проверенные временем книги — бестселлеры, классика, признанные шедевры
2. ПЕРСОНАЛИЗАЦИЯ: Анализируй любимые книги пользователя и находи похожие по духу, стилю, тематике
3. АВТОРЫ: Если пользователь любит автора — рекомендуй его другие работы И похожих авторов
4. ЖАНРЫ: Учитывай жанровые предпочтения, но добавляй разнообразие
5. ОТКРЫТИЯ: Включай менее известные, но выдающиеся произведения в любимых жанрах
6. СТРОГО: Никогда не повторяй книги из библиотеки пользователя
7. ФОРМАТ: Только JSON, без пояснений`
    : `You are a leading literary expert and book critic with encyclopedic knowledge of world literature.

YOUR MISSION: Create the perfect personalized book selection that the reader will definitely enjoy.

RECOMMENDATION PRINCIPLES:
1. QUALITY: Only time-tested books — bestsellers, classics, recognized masterpieces
2. PERSONALIZATION: Analyze user's favorite books and find similar in spirit, style, theme
3. AUTHORS: If user likes an author — recommend their other works AND similar authors
4. GENRES: Consider genre preferences but add variety
5. DISCOVERIES: Include lesser-known but outstanding works in favorite genres
6. STRICT: Never repeat books from user's library
7. FORMAT: JSON only, no explanations`;

  // Build detailed user prompt
  const userPromptParts: string[] = [];

  if (isRussian) {
    userPromptParts.push('📚 АНАЛИЗ ЧИТАТЕЛЬСКОГО ПРОФИЛЯ:\n');

    if (favoriteBooks.length > 0) {
      userPromptParts.push(`⭐ ЛЮБИМЫЕ КНИГИ (высоко оценённые):\n${favoritesText}`);
    }
    if (topAuthors.length > 0) {
      userPromptParts.push(`✍️ ЛЮБИМЫЕ АВТОРЫ: ${topAuthors.join(', ')}`);
    }
    if (topGenres.length > 0) {
      userPromptParts.push(`📖 ЛЮБИМЫЕ ЖАНРЫ: ${topGenres.join(', ')}`);
    }

    userPromptParts.push(`\n🚫 ИСКЛЮЧИТЬ (уже в библиотеке): ${allBooksText}`);

    if (previousText) {
      userPromptParts.push(`\n🔄 ТАКЖЕ ИСКЛЮЧИТЬ (уже рекомендовались): ${previousText}`);
    }

    userPromptParts.push(`
📋 ЗАДАНИЕ: Подбери 30 НОВЫХ книг для этого читателя.

СТРАТЕГИЯ ПОДБОРА:
1. 30% — похожие на любимые книги (по атмосфере, стилю, темам)
2. 25% — другие произведения любимых авторов
3. 25% — лучшие книги в любимых жанрах
4. 20% — потенциальные открытия (качественные книги смежных жанров)

Ответ строго в JSON:
{"recommendations": [{"title": "Название", "author": "Автор"}]}`);
  } else {
    userPromptParts.push('📚 READER PROFILE ANALYSIS:\n');

    if (favoriteBooks.length > 0) {
      userPromptParts.push(`⭐ FAVORITE BOOKS (highly rated):\n${favoritesText}`);
    }
    if (topAuthors.length > 0) {
      userPromptParts.push(`✍️ FAVORITE AUTHORS: ${topAuthors.join(', ')}`);
    }
    if (topGenres.length > 0) {
      userPromptParts.push(`📖 FAVORITE GENRES: ${topGenres.join(', ')}`);
    }

    userPromptParts.push(`\n🚫 EXCLUDE (already in library): ${allBooksText}`);

    if (previousText) {
      userPromptParts.push(`\n🔄 ALSO EXCLUDE (previously recommended): ${previousText}`);
    }

    userPromptParts.push(`
📋 TASK: Select 30 NEW books for this reader.

SELECTION STRATEGY:
1. 30% — similar to favorite books (atmosphere, style, themes)
2. 25% — other works by favorite authors
3. 25% — best books in favorite genres
4. 20% — potential discoveries (quality books in adjacent genres)

Response strictly in JSON:
{"recommendations": [{"title": "Title", "author": "Author"}]}
IMPORTANT: Use English titles and author names only. Never use Cyrillic.`);
  }

  const userPrompt = userPromptParts.join('\n\n');

  if (OPENROUTER_API_KEY) {
    try {
      console.warn('Using OpenRouter API (primary)');
      return await callOpenRouterAPI(systemPrompt, userPrompt);
    } catch (openRouterError) {
      console.warn('OpenRouter failed, trying Groq fallback...', openRouterError);
    }
  } else {
    console.warn('OpenRouter API key not configured, skipping');
  }

  const groqKey = apiKey || GROQ_API_KEY;
  if (!groqKey) {
    throw new Error('NO_AI_KEYS');
  }

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty AI response');
    }

    const parsed = JSON.parse(content);
    const recs = parsed.recommendations || [];
    return recs.filter((r: AIRecommendation) => r && r.title && typeof r.title === 'string');
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 429) {
        console.warn('Groq API rate limit reached');
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      if (status === 401 || status === 403) {
        console.warn(`Groq unavailable (${status}): invalid key or region blocked — using Open Library`);
        throw new Error('GROQ_UNAVAILABLE');
      }
    }
    console.warn('Groq fallback failed:', error);
    throw error;
  }
};

/**
 * Get default recommendations for new users (popular bestsellers)
 */
const getDefaultAIRecommendations = async (apiKey: string, previousTitles: string[] = []): Promise<AIRecommendation[]> => {
  const isRussian = isAppRussian();

  // Format previous recommendations for exclusion
  const previousText = previousTitles.length > 0 ? previousTitles.slice(0, 30).join(', ') : '';

  const systemPrompt = isRussian
    ? `Ты - ведущий книжный эксперт с энциклопедическими знаниями мировой литературы. Твоя задача - составить идеальный список книг для нового читателя.`
    : `You are a leading book expert with encyclopedic knowledge of world literature. Your task is to compile the perfect book list for a new reader.`;

  let userPrompt = isRussian
    ? `📚 Составь список из 30 ЛУЧШИХ книг для нового читателя:

🌟 КАТЕГОРИИ (по 6-8 книг каждая):

1. МИРОВЫЕ БЕСТСЕЛЛЕРЫ
   Книги-феномены с миллионами продаж: Гарри Поттер, Властелин колец, Код да Винчи, Алхимик, Игра престолов, Голодные игры и подобные

2. ЗОЛОТАЯ КЛАССИКА
   Признанные шедевры: Толстой, Достоевский, Булгаков, Ремарк, Оруэлл, Хемингуэй, Фицджеральд

3. СОВРЕМЕННЫЕ ХИТЫ
   Популярные книги последних 20 лет: триллеры, детективы, романы, фантастика

4. НЕХУДОЖЕСТВЕННАЯ ЛИТЕРАТУРА
   Бестселлеры по саморазвитию, психологии, бизнесу, науке

🎯 ВАЖНО: Рекомендуй только ПРОВЕРЕННЫЕ книги с отличными отзывами!`
    : `📚 Compile a list of 30 BEST books for a new reader:

🌟 CATEGORIES (6-8 books each):

1. WORLD BESTSELLERS
   Phenomenon books with millions of sales: Harry Potter, Lord of the Rings, Da Vinci Code, The Alchemist, Game of Thrones, Hunger Games etc.

2. GOLDEN CLASSICS
   Recognized masterpieces: Tolstoy, Dostoevsky, Orwell, Hemingway, Fitzgerald, etc.

3. MODERN HITS
   Popular books from the last 20 years: thrillers, mysteries, novels, fantasy

4. NON-FICTION
   Bestsellers in self-improvement, psychology, business, science

🎯 IMPORTANT: Only recommend PROVEN books with excellent reviews!`;

  if (previousText) {
    userPrompt += isRussian
      ? `\n\n🚫 ИСКЛЮЧИТЬ (уже рекомендовались ранее): ${previousText}`
      : `\n\n🚫 EXCLUDE (previously recommended): ${previousText}`;
  }

  userPrompt += isRussian
    ? `\n\nОтвет строго в JSON:\n{"recommendations": [{"title": "Название", "author": "Автор"}]}`
    : `\n\nResponse strictly in JSON:\n{"recommendations": [{"title": "Title", "author": "Author"}]}\nIMPORTANT: English titles and author names only. Never use Cyrillic.`;

  if (OPENROUTER_API_KEY) {
    try {
      console.warn('Using OpenRouter API for default recommendations (primary)');
      return await callOpenRouterAPI(systemPrompt, userPrompt);
    } catch (openRouterError) {
      console.warn('OpenRouter failed for default recommendations, trying Groq fallback...', openRouterError);
    }
  } else {
    console.warn('OpenRouter API key not configured, skipping default AI');
  }

  const groqKey = apiKey || GROQ_API_KEY;
  if (!groqKey) {
    throw new Error('NO_AI_KEYS');
  }

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty AI response');
    }

    const parsed = JSON.parse(content);
    const recs = parsed.recommendations || [];
    return recs.filter((r: AIRecommendation) => r && r.title && typeof r.title === 'string');
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 429) {
        console.warn('Groq API rate limit reached');
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      if (status === 401 || status === 403) {
        console.warn(`Groq unavailable (${status}): invalid key or region blocked — using Open Library`);
        throw new Error('GROQ_UNAVAILABLE');
      }
    }
    console.warn('Groq fallback failed for default recommendations:', error);
    throw error;
  }
};

/**
 * Delay helper for rate limiting
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Google Books API request counter for rate limiting
 */
let googleBooksRequestCount = 0;
let googleBooksLastResetTime = Date.now();
const GOOGLE_BOOKS_RATE_LIMIT = 10; // requests per second
const GOOGLE_BOOKS_RESET_INTERVAL = 1000; // 1 second

/**
 * Resolve book details: Google Books (if keyed) → Open Library (keyless)
 */
const searchGoogleBooks = async (title: string, author: string, retryCount = 0): Promise<IRecommendedBook | null> => {
  if (!GOOGLE_BOOKS_HAS_KEY) {
    return (await searchOpenLibraryBook(title, author)) as IRecommendedBook | null;
  }

  const now = Date.now();
  if (now - googleBooksLastResetTime >= GOOGLE_BOOKS_RESET_INTERVAL) {
    googleBooksRequestCount = 0;
    googleBooksLastResetTime = now;
  }

  if (googleBooksRequestCount >= GOOGLE_BOOKS_RATE_LIMIT) {
    await delay(GOOGLE_BOOKS_RESET_INTERVAL);
    googleBooksRequestCount = 0;
    googleBooksLastResetTime = Date.now();
  }

  googleBooksRequestCount++;

  try {
    const query = author ? `intitle:"${title}" inauthor:${author}` : `intitle:"${title}"`;
    const langRestrict = isAppRussian() ? '&langRestrict=ru' : '&langRestrict=en';

    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=3&orderBy=relevance${langRestrict}&printType=books&key=${GOOGLE_BOOKS_API_KEY}`,
      { timeout: 10000 },
    );

    if (!response.data.items || response.data.items.length === 0) {
      googleBooksRequestCount++;
      const fallbackResponse = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}&maxResults=3&orderBy=relevance${langRestrict}&printType=books&key=${GOOGLE_BOOKS_API_KEY}`,
        { timeout: 10000 },
      );

      if (!fallbackResponse.data.items || fallbackResponse.data.items.length === 0) {
        return (await searchOpenLibraryBook(title, author)) as IRecommendedBook | null;
      }
      response.data.items = fallbackResponse.data.items;
    }

    const item = response.data.items[0];
    const volumeInfo = item.volumeInfo || {};
    const imageLinks = volumeInfo.imageLinks || {};
    const categories = volumeInfo.categories;
    const genre = categories ? categories[0] : undefined;

    const thumbnail = imageLinks.thumbnail?.replace('http://', 'https://');
    const coverUrlHQ = thumbnail
      ? thumbnail
          .replace(/&zoom=\d/, '&zoom=0')
          .replace('&edge=curl', '')
          .replace('zoom=1', 'zoom=0')
      : undefined;

    if (!coverUrlHQ) {
      return (await searchOpenLibraryBook(title, author)) as IRecommendedBook | null;
    }

    let genreRu: string | undefined;
    if (genre) {
      genreRu = await translateGenreViaAPI(genre);
    }

    const result: IRecommendedBook = {
      id: item.id || `google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: volumeInfo.title || title,
      author: volumeInfo.authors?.join(', ') || author || '',
      pages: volumeInfo.pageCount || undefined,
      coverUrl: coverUrlHQ,
      coverUrlHQ: coverUrlHQ,
      genre: genre,
      genreRu: genreRu,
    };

    if (!isLocaleCompatibleBook(result)) {
      return null;
    }

    return result;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      if (retryCount < 3) {
        console.warn(`Google Books API rate limit, retrying in ${(retryCount + 1) * 2}s...`);
        await delay((retryCount + 1) * 2000);
        return searchGoogleBooks(title, author, retryCount + 1);
      }
      console.warn('Google Books rate limit exceeded, falling back to Open Library');
      return (await searchOpenLibraryBook(title, author)) as IRecommendedBook | null;
    }
    console.error('Google Books API error, falling back to Open Library:', error);
    return (await searchOpenLibraryBook(title, author)) as IRecommendedBook | null;
  }
};

/**
 * Filter out low-quality books
 */
const isQualityBook = (book: IRecommendedBook): boolean => {
  const title = book.title.toLowerCase();

  const excludePatterns = [
    'study guide',
    'учебник',
    'workbook',
    'textbook',
    'exam',
    'справочник',
    'handbook',
    'manual',
    'encyclopedia',
    'энциклопедия',
    'dictionary',
    'словарь',
    'summary',
    'краткое содержание',
    'volume ',
    'том ',
    'book 1',
    'книга 1',
    'coloring book',
    'раскраска',
  ];

  for (const pattern of excludePatterns) {
    if (title.includes(pattern)) {
      return false;
    }
  }

  if (!book.author || book.author.length < 2) {
    return false;
  }

  return true;
};

/**
 * Shuffle array
 */
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Main function: Generate book recommendations using AI
 */
export const generateRecommendations = async (userBooks: IBook[], forceNew: boolean = false): Promise<IRecommendedBook[]> => {
  const booksWithTitles = userBooks.filter((b) => b.title && b.title.trim().length > 0);
  const userBooksHash = generateBooksHash(booksWithTitles);

  // Check cache first
  if (!forceNew) {
    const cached = await getCachedRecommendations();
    if (cached && cached.books.length > 0 && !cached.isExpired) {
      return cached.books;
    }
  }

  // Get previously recommended titles for exclusion (only when refreshing)
  const previousTitles = forceNew ? await getPreviousRecommendationTitles() : [];

  const recommendations: IRecommendedBook[] = [];
  const seenTitles = new Set<string>([...booksWithTitles.map((b) => b.title?.toLowerCase().trim() || ''), ...previousTitles]);
  const seenIds = new Set<string>();

  // 1) API first (OpenRouter / Groq) — use live results when available
  if (OPENROUTER_API_KEY || GROQ_API_KEY) {
    try {
      console.warn('Fetching recommendations from AI API...');
      const aiRecs = await getAIRecommendations(booksWithTitles, GROQ_API_KEY, previousTitles);

      for (const rec of shuffleArray(aiRecs)) {
        if (recommendations.length >= 20) break;
        if (!rec || !rec.title) continue;

        const titleLower = rec.title.toLowerCase().trim();
        if (seenTitles.has(titleLower)) continue;
        if (!isAppRussian() && hasCyrillicText(rec.title)) continue;

        // Prefer bundled catalog match (same book + local cover for RU/EN)
        const catalogMatch = matchCatalogRecommendation(rec.title, rec.author || '');
        if (catalogMatch && !seenIds.has(catalogMatch.id) && isLocaleCompatibleBook(catalogMatch)) {
          seenTitles.add(titleLower);
          seenTitles.add(catalogMatch.title.toLowerCase().trim());
          seenIds.add(catalogMatch.id);
          recommendations.push(catalogMatch);
          continue;
        }

        if (recommendations.length > 0) {
          await delay(100);
        }

        const book = await searchGoogleBooks(rec.title, rec.author || '');
        if (book && !seenIds.has(book.id) && isQualityBook(book) && isLocaleCompatibleBook(book)) {
          const fetchedTitleLower = book.title.toLowerCase().trim();
          if (seenTitles.has(fetchedTitleLower)) continue;

          seenTitles.add(titleLower);
          seenTitles.add(fetchedTitleLower);
          seenIds.add(book.id);
          recommendations.push(book);
        }
      }
    } catch (error) {
      console.warn('AI recommendations unavailable:', error);
    }
  }

  // 2) Local curated catalog if API empty / incomplete
  if (recommendations.length < 8) {
    try {
      console.warn('API empty/short — using local catalog fallback...');
      const catalogBooks = await fetchPersonalizedFromCatalog(booksWithTitles, previousTitles, 20);
      for (const book of catalogBooks) {
        if (recommendations.length >= 20) break;
        if (!isLocaleCompatibleBook(book)) continue;
        const titleLower = book.title.toLowerCase().trim();
        if (seenTitles.has(titleLower) || seenIds.has(book.id)) continue;
        seenTitles.add(titleLower);
        seenIds.add(book.id);
        recommendations.push(book);
      }
    } catch (catalogError) {
      console.warn('Catalog recommendations failed:', catalogError);
    }
  }

  if (recommendations.length > 0) {
    await cacheRecommendations(recommendations, userBooksHash);
  }

  return recommendations;
};

/**
 * Generate recommendations for new users without books
 */
export const generateDefaultRecommendations = async (forceNew: boolean = false): Promise<IRecommendedBook[]> => {
  // Check cache first
  if (!forceNew) {
    const cached = await getCachedRecommendations();
    if (cached && cached.books.length > 0 && !cached.isExpired) {
      return cached.books;
    }
  }

  // Get previously recommended titles for exclusion (only when refreshing)
  const previousTitles = forceNew ? await getPreviousRecommendationTitles() : [];

  const recommendations: IRecommendedBook[] = [];
  const seenTitles = new Set<string>(previousTitles);
  const seenIds = new Set<string>();

  // 1) API first
  if (OPENROUTER_API_KEY || GROQ_API_KEY) {
    try {
      console.warn('Fetching default recommendations from AI API...');
      const aiRecs = await getDefaultAIRecommendations(GROQ_API_KEY, previousTitles);

      for (const rec of shuffleArray(aiRecs)) {
        if (recommendations.length >= 20) break;
        if (!rec || !rec.title) continue;

        const titleLower = rec.title.toLowerCase().trim();
        if (seenTitles.has(titleLower)) continue;
        if (!isAppRussian() && hasCyrillicText(rec.title)) continue;

        const catalogMatch = matchCatalogRecommendation(rec.title, rec.author || '');
        if (catalogMatch && !seenIds.has(catalogMatch.id) && isLocaleCompatibleBook(catalogMatch)) {
          seenTitles.add(titleLower);
          seenTitles.add(catalogMatch.title.toLowerCase().trim());
          seenIds.add(catalogMatch.id);
          recommendations.push(catalogMatch);
          continue;
        }

        if (recommendations.length > 0) {
          await delay(100);
        }

        const book = await searchGoogleBooks(rec.title, rec.author || '');
        if (book && !seenIds.has(book.id) && isQualityBook(book) && isLocaleCompatibleBook(book)) {
          const fetchedTitleLower = book.title.toLowerCase().trim();
          if (seenTitles.has(fetchedTitleLower)) continue;

          seenTitles.add(titleLower);
          seenTitles.add(fetchedTitleLower);
          seenIds.add(book.id);
          recommendations.push(book);
        }
      }
    } catch (error) {
      console.warn('Default AI recommendations unavailable:', error);
    }
  }

  // 2) Local catalog fallback
  if (recommendations.length < 8) {
    try {
      console.warn('API empty/short — using local catalog fallback...');
      const catalogBooks = await fetchPopularFromCatalog(previousTitles, 20);
      for (const book of catalogBooks) {
        if (recommendations.length >= 20) break;
        if (!isLocaleCompatibleBook(book)) continue;
        const titleLower = book.title.toLowerCase().trim();
        if (seenTitles.has(titleLower) || seenIds.has(book.id)) continue;
        seenTitles.add(titleLower);
        seenIds.add(book.id);
        recommendations.push(book);
      }
    } catch (catalogError) {
      console.warn('Catalog default recommendations failed:', catalogError);
    }
  }

  if (recommendations.length > 0) {
    await cacheRecommendations(recommendations, 'default');
  }

  return recommendations;
};

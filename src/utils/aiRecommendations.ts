/**
 * AI-powered Book Recommendations Service
 * Uses Groq AI (free tier) to analyze user's library and generate personalized recommendations
 * Then uses Google Books API to fetch book details
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import i18n from '~translations/i18n';
import { IBook } from '~types/books';

const RECOMMENDATIONS_CACHE_KEY = 'book_recommendations_cache';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Groq API - Free tier: 30 RPM, 14,400 requests/day
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = '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';

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

// Genre translations
const genreTranslations: Record<string, string> = {
  fiction: 'Художественная литература',
  'non-fiction': 'Нон-фикшн',
  nonfiction: 'Нон-фикшн',
  'science fiction': 'Научная фантастика',
  'sci-fi': 'Научная фантастика',
  fantasy: 'Фэнтези',
  mystery: 'Детектив',
  thriller: 'Триллер',
  romance: 'Романтика',
  horror: 'Ужасы',
  biography: 'Биография',
  history: 'История',
  science: 'Наука',
  'self-help': 'Саморазвитие',
  psychology: 'Психология',
  philosophy: 'Философия',
  poetry: 'Поэзия',
  drama: 'Драма',
  adventure: 'Приключения',
  children: 'Детская литература',
  'young adult': 'Молодёжная литература',
  classics: 'Классика',
  crime: 'Криминал',
  humor: 'Юмор',
  cooking: 'Кулинария',
  art: 'Искусство',
  music: 'Музыка',
  travel: 'Путешествия',
  business: 'Бизнес',
  economics: 'Экономика',
  politics: 'Политика',
  religion: 'Религия',
  comics: 'Комиксы',
  manga: 'Манга',
  memoir: 'Мемуары',
  nature: 'Природа',
  sports: 'Спорт',
  health: 'Здоровье',
  technology: 'Технологии',
  programming: 'Программирование',
};

const translateGenre = (genre: string): string => {
  if (!genre) return '';
  const lowerGenre = genre.toLowerCase();
  if (genreTranslations[lowerGenre]) {
    return genreTranslations[lowerGenre];
  }
  for (const [key, value] of Object.entries(genreTranslations)) {
    if (lowerGenre.includes(key)) {
      return value;
    }
  }
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
 * Clear recommendations cache
 */
export const clearRecommendationsCache = async (): Promise<void> => {
  await AsyncStorage.removeItem(RECOMMENDATIONS_CACHE_KEY);
};

/**
 * Call Groq AI to analyze user's library and get book recommendations
 */
const getAIRecommendations = async (userBooks: IBook[], apiKey: string): Promise<AIRecommendation[]> => {
  const { language } = i18n;
  const isRussian = language === 'ru';

  // Prepare user's library summary
  const booksList = userBooks
    .filter((b) => b.title)
    .slice(0, 30) // Limit to avoid token limits
    .map((b) => {
      const authors = b.authorsList?.join(', ') || '';
      return authors ? `"${b.title}" - ${authors}` : `"${b.title}"`;
    })
    .join('\n');

  const systemPrompt = isRussian
    ? `Ты - эксперт по книгам и литературный критик. Твоя задача - анализировать библиотеку пользователя и рекомендовать книги, которые ему понравятся.

Правила:
1. Рекомендуй только известные, качественные книги (бестселлеры, классику, признанные произведения)
2. Учитывай жанры, авторов и темы из библиотеки пользователя
3. НЕ рекомендуй книги, которые уже есть в библиотеке пользователя
4. Рекомендуй разнообразные книги - не только от тех же авторов
5. Отвечай ТОЛЬКО в формате JSON без дополнительного текста`
    : `You are a book expert and literary critic. Your task is to analyze the user's library and recommend books they will enjoy.

Rules:
1. Only recommend well-known, quality books (bestsellers, classics, acclaimed works)
2. Consider genres, authors, and themes from the user's library
3. DO NOT recommend books already in the user's library
4. Recommend diverse books - not only from the same authors
5. Respond ONLY in JSON format without additional text`;

  const userPrompt = isRussian
    ? `Библиотека пользователя:
${booksList}

На основе этих книг порекомендуй 20 книг, которые понравятся пользователю.

Ответь в формате JSON:
{
  "recommendations": [
    {"title": "Название книги", "author": "Автор"}
  ]
}`
    : `User's library:
${booksList}

Based on these books, recommend 20 books the user will enjoy.

Respond in JSON format:
{
  "recommendations": [
    {"title": "Book Title", "author": "Author"}
  ]
}`;

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
    return parsed.recommendations || [];
  } catch (error) {
    console.error('Groq AI error:', error);
    throw error;
  }
};

/**
 * Get default recommendations for new users (no library analysis needed)
 */
const getDefaultAIRecommendations = async (apiKey: string): Promise<AIRecommendation[]> => {
  const { language } = i18n;
  const isRussian = language === 'ru';

  const systemPrompt = isRussian
    ? `Ты - эксперт по книгам. Порекомендуй популярные книги для нового читателя.`
    : `You are a book expert. Recommend popular books for a new reader.`;

  const userPrompt = isRussian
    ? `Порекомендуй 20 самых популярных и интересных книг разных жанров (классика, современная проза, детективы, фантастика, психология и т.д.).

Ответь в формате JSON:
{
  "recommendations": [
    {"title": "Название книги", "author": "Автор"}
  ]
}`
    : `Recommend 20 most popular and interesting books from different genres (classics, modern fiction, mystery, fantasy, psychology, etc.).

Respond in JSON format:
{
  "recommendations": [
    {"title": "Book Title", "author": "Author"}
  ]
}`;

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.1-8b-instant',
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
          Authorization: `Bearer ${apiKey}`,
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
    return parsed.recommendations || [];
  } catch (error) {
    console.error('Groq AI error:', error);
    throw error;
  }
};

/**
 * Search book in Google Books API
 */
const searchGoogleBooks = async (title: string, author: string): Promise<IRecommendedBook | null> => {
  try {
    const query = author ? `intitle:"${title}" inauthor:${author}` : `intitle:"${title}"`;
    const langRestrict = i18n.language === 'ru' ? '&langRestrict=ru' : '';

    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=3&orderBy=relevance${langRestrict}&printType=books`,
      { timeout: 10000 },
    );

    if (!response.data.items || response.data.items.length === 0) {
      // Try without author
      const fallbackResponse = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}&maxResults=3&orderBy=relevance${langRestrict}&printType=books`,
        { timeout: 10000 },
      );

      if (!fallbackResponse.data.items || fallbackResponse.data.items.length === 0) {
        return null;
      }
      response.data.items = fallbackResponse.data.items;
    }

    // Find best match
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

    // Skip books without covers
    if (!coverUrlHQ) {
      return null;
    }

    return {
      id: item.id || `google_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: volumeInfo.title || title,
      author: volumeInfo.authors?.join(', ') || author || '',
      pages: volumeInfo.pageCount || undefined,
      coverUrl: coverUrlHQ,
      coverUrlHQ: coverUrlHQ,
      genre: genre,
      genreRu: genre ? translateGenre(genre) : undefined,
    };
  } catch (error) {
    console.error('Google Books API error:', error);
    return null;
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

  const recommendations: IRecommendedBook[] = [];
  const seenTitles = new Set<string>(booksWithTitles.map((b) => b.title?.toLowerCase().trim() || ''));
  const seenIds = new Set<string>();

  try {
    // Get AI recommendations
    const aiRecs = await getAIRecommendations(booksWithTitles, GROQ_API_KEY);

    // Fetch each book from Google Books
    for (const rec of shuffleArray(aiRecs)) {
      if (recommendations.length >= 20) break;

      const titleLower = rec.title.toLowerCase().trim();
      if (seenTitles.has(titleLower)) continue;

      const book = await searchGoogleBooks(rec.title, rec.author);
      if (book && !seenIds.has(book.id) && isQualityBook(book)) {
        seenTitles.add(titleLower);
        seenIds.add(book.id);
        recommendations.push(book);
      }
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }

  // Cache results
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

  const recommendations: IRecommendedBook[] = [];
  const seenTitles = new Set<string>();
  const seenIds = new Set<string>();

  try {
    // Get AI recommendations for new users
    const aiRecs = await getDefaultAIRecommendations(GROQ_API_KEY);

    // Fetch each book from Google Books
    for (const rec of shuffleArray(aiRecs)) {
      if (recommendations.length >= 20) break;

      const titleLower = rec.title.toLowerCase().trim();
      if (seenTitles.has(titleLower)) continue;

      const book = await searchGoogleBooks(rec.title, rec.author);
      if (book && !seenIds.has(book.id) && isQualityBook(book)) {
        seenTitles.add(titleLower);
        seenIds.add(book.id);
        recommendations.push(book);
      }
    }
  } catch (error) {
    console.error('Error generating default recommendations:', error);
  }

  // Cache results
  if (recommendations.length > 0) {
    await cacheRecommendations(recommendations, 'default');
  }

  return recommendations;
};

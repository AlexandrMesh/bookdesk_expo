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
  const favoriteBooks = booksWithMetrics
    .filter((b) => b.rating && b.rating >= 4 || b.votesCount && b.votesCount > 0)
    .slice(0, 10);

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
 * Call Groq AI to analyze user's library and get book recommendations
 */
const getAIRecommendations = async (userBooks: IBook[], apiKey: string): Promise<AIRecommendation[]> => {
  const { language } = i18n;
  const isRussian = language === 'ru';

  // Analyze user's library
  const { favoriteBooks, topAuthors, topGenres, allBooks } = analyzeUserLibrary(userBooks);

  // Format favorite books with ratings
  const favoritesText = favoriteBooks
    .map((b) => {
      const authors = b.authorsList?.join(', ') || '';
      const ratingText = b.rating ? ` [оценка: ${b.rating}/5]` : '';
      const likedText = b.votesCount ? ' [понравилась]' : '';
      return `"${b.title}"${authors ? ` - ${authors}` : ''}${ratingText}${likedText}`;
    })
    .join('\n');

  // Format all books list
  const allBooksText = allBooks
    .map((b) => {
      const authors = b.authorsList?.join(', ') || '';
      return authors ? `"${b.title}" - ${authors}` : `"${b.title}"`;
    })
    .join('\n');

  const systemPrompt = isRussian
    ? `Ты - эксперт по книгам и литературный критик с глубоким знанием мировой литературы. Твоя задача - анализировать библиотеку пользователя и рекомендовать книги, которые ему понравятся.

ВАЖНЫЕ ПРАВИЛА:
1. Рекомендуй только известные, качественные книги (бестселлеры, классику, признанные произведения)
2. ПРИОРИТЕТ: книги, похожие на те, что пользователь оценил высоко или лайкнул
3. Учитывай любимых авторов пользователя - рекомендуй их другие произведения или похожих авторов
4. Учитывай жанровые предпочтения пользователя
5. НЕ рекомендуй книги, которые уже есть в библиотеке пользователя
6. Рекомендуй разнообразные книги - миксуй жанры и авторов
7. Отвечай ТОЛЬКО в формате JSON без дополнительного текста`
    : `You are a book expert and literary critic with deep knowledge of world literature. Your task is to analyze the user's library and recommend books they will enjoy.

IMPORTANT RULES:
1. Only recommend well-known, quality books (bestsellers, classics, acclaimed works)
2. PRIORITY: books similar to those the user rated highly or liked
3. Consider user's favorite authors - recommend their other works or similar authors
4. Consider user's genre preferences
5. DO NOT recommend books already in the user's library
6. Recommend diverse books - mix genres and authors
7. Respond ONLY in JSON format without additional text`;

  // Build detailed user prompt
  let userPromptParts: string[] = [];

  if (isRussian) {
    if (favoriteBooks.length > 0) {
      userPromptParts.push(`ЛЮБИМЫЕ КНИГИ (высокий рейтинг или лайк):\n${favoritesText}`);
    }
    if (topAuthors.length > 0) {
      userPromptParts.push(`ЛЮБИМЫЕ АВТОРЫ: ${topAuthors.join(', ')}`);
    }
    if (topGenres.length > 0) {
      userPromptParts.push(`ПРЕДПОЧИТАЕМЫЕ ЖАНРЫ: ${topGenres.join(', ')}`);
    }
    userPromptParts.push(`\nВСЕ КНИГИ В БИБЛИОТЕКЕ (не рекомендуй эти):\n${allBooksText}`);
    userPromptParts.push(`\nНа основе анализа предпочтений порекомендуй 25 книг.
Особый приоритет:
- Книгам похожим на любимые (с высоким рейтингом)
- Другим произведениям любимых авторов
- Книгам в предпочитаемых жанрах

Ответь в формате JSON:
{
  "recommendations": [
    {"title": "Название книги", "author": "Автор"}
  ]
}`);
  } else {
    if (favoriteBooks.length > 0) {
      userPromptParts.push(`FAVORITE BOOKS (highly rated or liked):\n${favoritesText}`);
    }
    if (topAuthors.length > 0) {
      userPromptParts.push(`FAVORITE AUTHORS: ${topAuthors.join(', ')}`);
    }
    if (topGenres.length > 0) {
      userPromptParts.push(`PREFERRED GENRES: ${topGenres.join(', ')}`);
    }
    userPromptParts.push(`\nALL BOOKS IN LIBRARY (do not recommend these):\n${allBooksText}`);
    userPromptParts.push(`\nBased on preference analysis, recommend 25 books.
Special priority:
- Books similar to favorites (highly rated)
- Other works by favorite authors
- Books in preferred genres

Respond in JSON format:
{
  "recommendations": [
    {"title": "Book Title", "author": "Author"}
  ]
}`);
  }

  const userPrompt = userPromptParts.join('\n\n');

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
 * Get default recommendations for new users (popular bestsellers)
 */
const getDefaultAIRecommendations = async (apiKey: string): Promise<AIRecommendation[]> => {
  const { language } = i18n;
  const isRussian = language === 'ru';

  const systemPrompt = isRussian
    ? `Ты - эксперт по книгам с глубоким знанием мировых бестселлеров и классики. Твоя задача - составить список самых популярных и читаемых книг в мире.`
    : `You are a book expert with deep knowledge of world bestsellers and classics. Your task is to compile a list of the most popular and widely read books in the world.`;

  const userPrompt = isRussian
    ? `Составь список из 25 самых ПОПУЛЯРНЫХ книг всех времён. Включи:

1. МИРОВЫЕ БЕСТСЕЛЛЕРЫ - книги с миллионами проданных копий:
   - "Гарри Поттер", "Властелин колец", "Код да Винчи", "Алхимик" и подобные

2. КЛАССИКУ МИРОВОЙ ЛИТЕРАТУРЫ:
   - Толстой, Достоевский, Булгаков, Оруэлл, Хемингуэй и др.

3. СОВРЕМЕННЫЕ ХИТЫ:
   - Популярные триллеры, детективы, романы последних лет

4. КНИГИ ПО САМОРАЗВИТИЮ:
   - Самые известные и полезные

Разнообразь жанры. Рекомендуй только ПРОВЕРЕННЫЕ временем и читателями книги.

Ответь в формате JSON:
{
  "recommendations": [
    {"title": "Название книги", "author": "Автор"}
  ]
}`
    : `Compile a list of 25 most POPULAR books of all time. Include:

1. WORLD BESTSELLERS - books with millions of copies sold:
   - "Harry Potter", "Lord of the Rings", "Da Vinci Code", "The Alchemist" etc.

2. CLASSIC WORLD LITERATURE:
   - Tolstoy, Dostoevsky, Orwell, Hemingway, etc.

3. MODERN HITS:
   - Popular thrillers, mysteries, novels from recent years

4. SELF-IMPROVEMENT BOOKS:
   - Most famous and useful ones

Diversify genres. Only recommend books PROVEN by time and readers.

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

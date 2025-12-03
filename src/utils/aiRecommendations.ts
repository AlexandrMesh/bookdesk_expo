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
const PREVIOUS_RECOMMENDATIONS_KEY = 'previous_recommendations_titles';
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
const getAIRecommendations = async (
  userBooks: IBook[],
  apiKey: string,
  previousTitles: string[] = [],
): Promise<AIRecommendation[]> => {
  const { language } = i18n;
  const isRussian = language === 'ru';

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
  const allBooksText = allBooks
    .map((b) => `"${b.title}"`)
    .join(', ');

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
{"recommendations": [{"title": "Title", "author": "Author"}]}`);
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
        temperature: 0.85, // Higher for more variety
        max_tokens: 2500,
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
const getDefaultAIRecommendations = async (
  apiKey: string,
  previousTitles: string[] = [],
): Promise<AIRecommendation[]> => {
  const { language } = i18n;
  const isRussian = language === 'ru';

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
    : `\n\nResponse strictly in JSON:\n{"recommendations": [{"title": "Title", "author": "Author"}]}`;

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

  // Get previously recommended titles for exclusion (only when refreshing)
  const previousTitles = forceNew ? await getPreviousRecommendationTitles() : [];

  const recommendations: IRecommendedBook[] = [];
  // Exclude user's existing books AND previous recommendations
  const seenTitles = new Set<string>([
    ...booksWithTitles.map((b) => b.title?.toLowerCase().trim() || ''),
    ...previousTitles,
  ]);
  const seenIds = new Set<string>();

  try {
    // Get AI recommendations with exclusion lists
    const aiRecs = await getAIRecommendations(booksWithTitles, GROQ_API_KEY, previousTitles);

    // Fetch each book from Google Books
    for (const rec of shuffleArray(aiRecs)) {
      if (recommendations.length >= 20) break;

      const titleLower = rec.title.toLowerCase().trim();
      // Skip if already in user's library or previously recommended
      if (seenTitles.has(titleLower)) continue;

      const book = await searchGoogleBooks(rec.title, rec.author);
      if (book && !seenIds.has(book.id) && isQualityBook(book)) {
        // Double-check the fetched book title isn't in exclusion list
        const fetchedTitleLower = book.title.toLowerCase().trim();
        if (seenTitles.has(fetchedTitleLower)) continue;

        seenTitles.add(titleLower);
        seenTitles.add(fetchedTitleLower);
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

  // Get previously recommended titles for exclusion (only when refreshing)
  const previousTitles = forceNew ? await getPreviousRecommendationTitles() : [];

  const recommendations: IRecommendedBook[] = [];
  const seenTitles = new Set<string>(previousTitles);
  const seenIds = new Set<string>();

  try {
    // Get AI recommendations for new users with exclusion list
    const aiRecs = await getDefaultAIRecommendations(GROQ_API_KEY, previousTitles);

    // Fetch each book from Google Books
    for (const rec of shuffleArray(aiRecs)) {
      if (recommendations.length >= 20) break;

      const titleLower = rec.title.toLowerCase().trim();
      if (seenTitles.has(titleLower)) continue;

      const book = await searchGoogleBooks(rec.title, rec.author);
      if (book && !seenIds.has(book.id) && isQualityBook(book)) {
        // Double-check the fetched book title isn't in exclusion list
        const fetchedTitleLower = book.title.toLowerCase().trim();
        if (seenTitles.has(fetchedTitleLower)) continue;

        seenTitles.add(titleLower);
        seenTitles.add(fetchedTitleLower);
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

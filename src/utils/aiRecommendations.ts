/**
 * Book recommendations service
 * Uses Google Books API (free, no API key required)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import i18n from '~translations/i18n';
import { IBook } from '~types/books';

const RECOMMENDATIONS_CACHE_KEY = 'book_recommendations_cache';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface IRecommendedBook {
  id: string;
  title: string;
  author: string;
  pages?: number;
  coverUrl?: string;
  coverUrlHQ?: string; // High quality cover
  description?: string;
  genre?: string;
  genreRu?: string; // Russian genre name
}

interface CachedRecommendations {
  books: IRecommendedBook[];
  timestamp: number;
  userBooksHash: string;
}

// Genre translations map - comprehensive Russian translations
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
  'love story': 'Романтика',
  horror: 'Ужасы',
  biography: 'Биография',
  autobiography: 'Автобиография',
  history: 'История',
  historical: 'Историческая литература',
  science: 'Наука',
  'self-help': 'Саморазвитие',
  'self help': 'Саморазвитие',
  'personal development': 'Саморазвитие',
  psychology: 'Психология',
  philosophy: 'Философия',
  poetry: 'Поэзия',
  poems: 'Поэзия',
  drama: 'Драма',
  comedy: 'Комедия',
  adventure: 'Приключения',
  action: 'Экшн',
  children: 'Детская литература',
  "children's": 'Детская литература',
  juvenile: 'Детская литература',
  'young adult': 'Молодёжная литература',
  ya: 'Молодёжная литература',
  teen: 'Подростковая литература',
  classics: 'Классика',
  classic: 'Классика',
  'literary fiction': 'Художественная проза',
  'historical fiction': 'Историческая проза',
  crime: 'Криминал',
  detective: 'Детектив',
  war: 'Военная проза',
  military: 'Военная литература',
  humor: 'Юмор',
  humour: 'Юмор',
  satire: 'Сатира',
  cooking: 'Кулинария',
  cookbooks: 'Кулинария',
  food: 'Кулинария',
  art: 'Искусство',
  arts: 'Искусство',
  music: 'Музыка',
  travel: 'Путешествия',
  religion: 'Религия',
  religious: 'Религия',
  spirituality: 'Духовность',
  spiritual: 'Духовность',
  business: 'Бизнес',
  management: 'Менеджмент',
  economics: 'Экономика',
  finance: 'Финансы',
  politics: 'Политика',
  political: 'Политика',
  law: 'Право',
  legal: 'Право',
  education: 'Образование',
  educational: 'Образование',
  reference: 'Справочники',
  comics: 'Комиксы',
  'graphic novels': 'Графические романы',
  'graphic novel': 'Графический роман',
  manga: 'Манга',
  anime: 'Аниме',
  'literary collections': 'Литературные сборники',
  anthology: 'Антология',
  essays: 'Эссе',
  essay: 'Эссе',
  journalism: 'Журналистика',
  'true crime': 'Документальный криминал',
  memoir: 'Мемуары',
  memoirs: 'Мемуары',
  nature: 'Природа',
  environment: 'Экология',
  sports: 'Спорт',
  sport: 'Спорт',
  fitness: 'Фитнес',
  health: 'Здоровье',
  wellness: 'Здоровье',
  medicine: 'Медицина',
  medical: 'Медицина',
  family: 'Семья',
  relationships: 'Отношения',
  parenting: 'Воспитание',
  'literary criticism': 'Литературная критика',
  criticism: 'Критика',
  'social science': 'Социология',
  sociology: 'Социология',
  technology: 'Технологии',
  tech: 'Технологии',
  computers: 'Компьютеры',
  programming: 'Программирование',
  software: 'Программирование',
  mathematics: 'Математика',
  math: 'Математика',
  architecture: 'Архитектура',
  design: 'Дизайн',
  photography: 'Фотография',
  'performing arts': 'Сценическое искусство',
  theater: 'Театр',
  theatre: 'Театр',
  film: 'Кино',
  cinema: 'Кино',
  movies: 'Кино',
  games: 'Игры',
  gaming: 'Игры',
  crafts: 'Рукоделие',
  diy: 'Сделай сам',
  antiques: 'Антиквариат',
  collecting: 'Коллекционирование',
  pets: 'Домашние животные',
  animals: 'Животные',
  gardening: 'Садоводство',
  garden: 'Садоводство',
  'house & home': 'Дом и быт',
  home: 'Дом и быт',
  interior: 'Интерьер',
  transportation: 'Транспорт',
  cars: 'Автомобили',
  'foreign language study': 'Изучение языков',
  language: 'Языки',
  linguistics: 'Лингвистика',
  'study aids': 'Учебные пособия',
  textbook: 'Учебник',
  'body, mind & spirit': 'Тело, разум и дух',
  'mind body': 'Тело и разум',
  paranormal: 'Паранормальное',
  supernatural: 'Сверхъестественное',
  dystopian: 'Антиутопия',
  dystopia: 'Антиутопия',
  utopian: 'Утопия',
  apocalyptic: 'Апокалиптика',
  'post-apocalyptic': 'Постапокалипсис',
  western: 'Вестерн',
  noir: 'Нуар',
  espionage: 'Шпионаж',
  spy: 'Шпионский роман',
  suspense: 'Саспенс',
  'cozy mystery': 'Уютный детектив',
  'urban fantasy': 'Городское фэнтези',
  'epic fantasy': 'Эпическое фэнтези',
  'dark fantasy': 'Тёмное фэнтези',
  'high fantasy': 'Высокое фэнтези',
  'space opera': 'Космическая опера',
  cyberpunk: 'Киберпанк',
  steampunk: 'Стимпанк',
  literary: 'Литература',
  contemporary: 'Современная литература',
  modern: 'Современная литература',
};

/**
 * Translate genre to Russian
 */
const translateGenre = (genre: string): string => {
  if (!genre) return '';
  const lowerGenre = genre.toLowerCase().trim();

  // Direct match
  if (genreTranslations[lowerGenre]) {
    return genreTranslations[lowerGenre];
  }

  // Check if genre contains any known key
  for (const [key, value] of Object.entries(genreTranslations)) {
    if (lowerGenre.includes(key)) {
      return value;
    }
  }

  // Check if any key contains the genre
  for (const [key, value] of Object.entries(genreTranslations)) {
    if (key.includes(lowerGenre) && lowerGenre.length > 3) {
      return value;
    }
  }

  // Return original if no translation found
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
 * Get cached recommendations if still valid
 */
export const getCachedRecommendations = async (): Promise<{ books: IRecommendedBook[]; isExpired: boolean } | null> => {
  try {
    const cached = await AsyncStorage.getItem(RECOMMENDATIONS_CACHE_KEY);
    if (!cached) return null;

    const data: CachedRecommendations = JSON.parse(cached);
    const isExpired = Date.now() - data.timestamp > CACHE_EXPIRY_MS;

    return { books: data.books, isExpired };
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
 * Extract unique authors from user's books (sorted by frequency)
 */
const extractAuthors = (books: IBook[]): string[] => {
  const authors = new Map<string, number>();
  books.forEach((book) => {
    if (book.authorsList && book.authorsList.length > 0) {
      book.authorsList.forEach((author) => {
        if (author && author.trim().length > 2) {
          const authorName = author.trim();
          authors.set(authorName, (authors.get(authorName) || 0) + 1);
        }
      });
    }
  });
  return Array.from(authors.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([author]) => author);
};

/**
 * Search books using Google Books API (free, no key required)
 * orderBy=relevance gives more popular results
 */
const searchGoogleBooks = async (query: string, maxResults: number = 10, startIndex: number = 0): Promise<IRecommendedBook[]> => {
  try {
    const langRestrict = i18n.language === 'ru' ? '&langRestrict=ru' : '';
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&startIndex=${startIndex}&orderBy=relevance${langRestrict}&printType=books`,
      { timeout: 15000 },
    );

    if (!response.data.items) {
      return [];
    }

    return response.data.items
      .filter((item: { volumeInfo?: { title?: string; imageLinks?: { thumbnail?: string } } }) => {
        const volumeInfo = item.volumeInfo || {};
        return volumeInfo.title && volumeInfo.imageLinks?.thumbnail;
      })
      .map((item: { id?: string; volumeInfo?: Record<string, unknown> }, index: number) => {
        const volumeInfo = (item.volumeInfo || {}) as Record<string, unknown>;
        const imageLinks = (volumeInfo.imageLinks || {}) as Record<string, string>;
        const categories = volumeInfo.categories as string[] | undefined;
        const genre = categories ? categories[0] : undefined;

        const thumbnail = imageLinks.thumbnail?.replace('http://', 'https://');
        const coverUrlHQ = thumbnail
          ? thumbnail
              .replace(/&zoom=\d/, '&zoom=0')
              .replace('&edge=curl', '')
              .replace('zoom=1', 'zoom=0')
          : undefined;

        return {
          id: item.id || `google_${Date.now()}_${index}`,
          title: (volumeInfo.title as string) || 'Unknown Title',
          author: (volumeInfo.authors as string[])?.join(', ') || '',
          pages: (volumeInfo.pageCount as number) || undefined,
          coverUrl: thumbnail,
          coverUrlHQ: coverUrlHQ,
          description: (volumeInfo.description as string)?.substring(0, 200) + '...' || undefined,
          genre: genre,
          genreRu: genre ? translateGenre(genre) : undefined,
        };
      });
  } catch (error) {
    console.error('Google Books API error:', error);
    return [];
  }
};

/**
 * Popular book queries - these return well-known, quality books
 */
const getPopularQueries = (language: string): string[] => {
  if (language === 'ru') {
    return [
      // Bestsellers and popular fiction
      'бестселлер 2024',
      'лучшие книги года',
      'популярная художественная литература',
      'современная русская проза',
      // Classics
      'русская классика Толстой Достоевский',
      'мировая классика литература',
      // Popular genres
      'детектив бестселлер',
      'фантастика популярная',
      'психология бестселлер',
      'саморазвитие популярные книги',
      'бизнес книги лучшие',
      'романы любовные популярные',
      'триллер захватывающий',
      'фэнтези лучшее',
      // Famous authors
      'Стивен Кинг',
      'Борис Акунин',
      'Дэн Браун',
      'Джоан Роулинг',
    ];
  }
  return [
    // Bestsellers
    'bestseller 2024',
    'new york times bestseller',
    'best books of the year',
    'popular fiction',
    // Classics
    'classic literature must read',
    'literary classics',
    // Popular genres
    'thriller bestseller',
    'mystery bestseller',
    'science fiction popular',
    'fantasy bestseller',
    'romance bestseller',
    'self help bestseller',
    'psychology popular books',
    'business bestseller',
    // Famous authors
    'Stephen King',
    'Dan Brown',
    'J.K. Rowling',
    'George R.R. Martin',
  ];
};

/**
 * Shuffle array randomly
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
 * Generate book recommendations based on user's library
 * IMPROVED: Focus on popular books with high ratings
 */
export const generateRecommendations = async (userBooks: IBook[], forceNew: boolean = false): Promise<IRecommendedBook[]> => {
  const booksWithTitles = userBooks.filter((b) => b.title && b.title.trim().length > 0);
  const userBooksHash = generateBooksHash(booksWithTitles);

  // Check cache first (unless forcing new)
  if (!forceNew) {
    const cached = await getCachedRecommendations();
    if (cached && cached.books.length > 0 && !cached.isExpired) {
      return cached.books;
    }
  }

  const { language } = i18n;
  const recommendations: IRecommendedBook[] = [];
  const seenTitles = new Set<string>(booksWithTitles.map((b) => b.title?.toLowerCase().trim() || ''));
  const seenIds = new Set<string>();

  // Random offset for variety on refresh
  const randomOffset = forceNew ? Math.floor(Math.random() * 20) : 0;

  // STRATEGY 1: Search by user's favorite authors (most personalized)
  const authors = extractAuthors(booksWithTitles);
  const topAuthors = shuffleArray(authors.slice(0, 5)).slice(0, 3);

  for (const author of topAuthors) {
    try {
      // Search for popular books by this author
      const authorBooks = await searchGoogleBooks(`inauthor:"${author}" bestseller`, 5, randomOffset);
      for (const book of authorBooks) {
        const titleLower = book.title.toLowerCase().trim();
        if (!seenTitles.has(titleLower) && !seenIds.has(book.id) && recommendations.length < 20) {
          seenTitles.add(titleLower);
          seenIds.add(book.id);
          recommendations.push(book);
        }
      }
    } catch (error) {
      console.error('Error searching by author:', error);
    }
  }

  // STRATEGY 2: Search popular books in general (ensures quality recommendations)
  const popularQueries = shuffleArray(getPopularQueries(language));

  for (const query of popularQueries.slice(0, 6)) {
    if (recommendations.length >= 20) break;

    try {
      const popularBooks = await searchGoogleBooks(query, 6, randomOffset);
      for (const book of popularBooks) {
        const titleLower = book.title.toLowerCase().trim();
        if (!seenTitles.has(titleLower) && !seenIds.has(book.id) && recommendations.length < 20) {
          seenTitles.add(titleLower);
          seenIds.add(book.id);
          recommendations.push(book);
        }
      }
    } catch (error) {
      console.error('Error searching popular books:', error);
    }
  }

  // Shuffle final results for variety
  const shuffledRecommendations = shuffleArray(recommendations);

  // Cache the results
  if (shuffledRecommendations.length > 0) {
    await cacheRecommendations(shuffledRecommendations, userBooksHash);
  }

  return shuffledRecommendations;
};

/**
 * Generate recommendations for new users without any books
 */
export const generateDefaultRecommendations = async (forceNew: boolean = false): Promise<IRecommendedBook[]> => {
  // Check cache first (unless forcing new)
  if (!forceNew) {
    const cached = await getCachedRecommendations();
    if (cached && cached.books.length > 0 && !cached.isExpired) {
      return cached.books;
    }
  }

  const { language } = i18n;
  const recommendations: IRecommendedBook[] = [];
  const seenTitles = new Set<string>();
  const seenIds = new Set<string>();

  const queries = shuffleArray(getPopularQueries(language));
  const randomOffset = forceNew ? Math.floor(Math.random() * 30) : 0;

  // Get popular books from different categories
  for (const query of queries.slice(0, 8)) {
    if (recommendations.length >= 20) break;

    try {
      const books = await searchGoogleBooks(query, 5, randomOffset);
      for (const book of books) {
        const titleLower = book.title.toLowerCase().trim();
        if (!seenTitles.has(titleLower) && !seenIds.has(book.id) && recommendations.length < 20) {
          seenTitles.add(titleLower);
          seenIds.add(book.id);
          recommendations.push(book);
        }
      }
    } catch (error) {
      console.error('Error fetching default recommendations:', error);
    }
  }

  const shuffledRecommendations = shuffleArray(recommendations);

  // Cache results
  if (shuffledRecommendations.length > 0) {
    await cacheRecommendations(shuffledRecommendations, 'default');
  }

  return shuffledRecommendations;
};

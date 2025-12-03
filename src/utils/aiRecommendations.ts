/**
 * Book recommendations service
 * Uses Google Books API and Open Library API (free, no API key required)
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

// Genre translations map
const genreTranslations: Record<string, string> = {
  'fiction': 'Художественная литература',
  'non-fiction': 'Нон-фикшн',
  'science fiction': 'Научная фантастика',
  'fantasy': 'Фэнтези',
  'mystery': 'Детектив',
  'thriller': 'Триллер',
  'romance': 'Романтика',
  'horror': 'Ужасы',
  'biography': 'Биография',
  'autobiography': 'Автобиография',
  'history': 'История',
  'science': 'Наука',
  'self-help': 'Саморазвитие',
  'psychology': 'Психология',
  'philosophy': 'Философия',
  'poetry': 'Поэзия',
  'drama': 'Драма',
  'comedy': 'Комедия',
  'adventure': 'Приключения',
  'children': 'Детская литература',
  'young adult': 'Молодёжная литература',
  'classics': 'Классика',
  'literary fiction': 'Художественная проза',
  'historical fiction': 'Историческая проза',
  'crime': 'Криминал',
  'war': 'Военная проза',
  'humor': 'Юмор',
  'cooking': 'Кулинария',
  'art': 'Искусство',
  'music': 'Музыка',
  'travel': 'Путешествия',
  'religion': 'Религия',
  'spirituality': 'Духовность',
  'business': 'Бизнес',
  'economics': 'Экономика',
  'politics': 'Политика',
  'law': 'Право',
  'education': 'Образование',
  'reference': 'Справочники',
  'comics': 'Комиксы',
  'graphic novels': 'Графические романы',
  'manga': 'Манга',
  'literary collections': 'Литературные сборники',
  'essays': 'Эссе',
  'journalism': 'Журналистика',
  'true crime': 'Документальный криминал',
  'memoir': 'Мемуары',
  'nature': 'Природа',
  'sports': 'Спорт',
  'health': 'Здоровье',
  'family': 'Семья',
  'relationships': 'Отношения',
  'parenting': 'Воспитание',
  'literary criticism': 'Литературная критика',
  'social science': 'Социология',
  'technology': 'Технологии',
  'computers': 'Компьютеры',
  'mathematics': 'Математика',
  'medical': 'Медицина',
  'architecture': 'Архитектура',
  'design': 'Дизайн',
  'photography': 'Фотография',
  'performing arts': 'Сценическое искусство',
  'film': 'Кино',
  'games': 'Игры',
  'crafts': 'Рукоделие',
  'antiques': 'Антиквариат',
  'pets': 'Домашние животные',
  'gardening': 'Садоводство',
  'house & home': 'Дом и быт',
  'transportation': 'Транспорт',
  'foreign language study': 'Изучение языков',
  'study aids': 'Учебные пособия',
  'body, mind & spirit': 'Тело, разум и дух',
};

/**
 * Translate genre to Russian
 */
const translateGenre = (genre: string): string => {
  if (!genre) return '';
  const lowerGenre = genre.toLowerCase();
  
  // Direct match
  if (genreTranslations[lowerGenre]) {
    return genreTranslations[lowerGenre];
  }
  
  // Partial match
  for (const [key, value] of Object.entries(genreTranslations)) {
    if (lowerGenre.includes(key) || key.includes(lowerGenre)) {
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
 * Extract unique authors from user's books
 */
const extractAuthors = (books: IBook[]): string[] => {
  const authors = new Set<string>();
  books.forEach((book) => {
    if (book.authorsList && book.authorsList.length > 0) {
      book.authorsList.forEach((author) => {
        if (author && author.trim().length > 2) {
          authors.add(author.trim());
        }
      });
    }
  });
  return Array.from(authors);
};

/**
 * Extract categories/genres from user's books
 */
const extractCategories = (books: IBook[]): string[] => {
  const categories = new Set<string>();
  books.forEach((book) => {
    if (book.categoryValue) {
      categories.add(book.categoryValue);
    }
  });
  return Array.from(categories);
};

/**
 * Extract keywords from book titles for better matching
 */
const extractKeywordsFromTitles = (books: IBook[]): string[] => {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'с', 'и', 'в', 'на', 'к', 'о', 'у', 'из']);
  const keywords = new Map<string, number>();
  
  books.forEach((book) => {
    if (book.title) {
      const words = book.title.toLowerCase().split(/\s+/);
      words.forEach((word) => {
        const cleaned = word.replace(/[^a-zа-яё]/gi, '');
        if (cleaned.length > 3 && !stopWords.has(cleaned)) {
          keywords.set(cleaned, (keywords.get(cleaned) || 0) + 1);
        }
      });
    }
  });
  
  // Sort by frequency and return top keywords
  return Array.from(keywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
};

/**
 * Search books using Google Books API (free, no key required)
 */
const searchGoogleBooks = async (query: string, maxResults: number = 10, startIndex: number = 0): Promise<IRecommendedBook[]> => {
  try {
    const langRestrict = i18n.language === 'ru' ? '&langRestrict=ru' : '';
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&startIndex=${startIndex}&orderBy=relevance${langRestrict}`,
      { timeout: 10000 },
    );

    if (!response.data.items) {
      return [];
    }

    return response.data.items.map((item: any, index: number) => {
      const volumeInfo = item.volumeInfo || {};
      const imageLinks = volumeInfo.imageLinks || {};
      const genre = volumeInfo.categories ? volumeInfo.categories[0] : undefined;

      // Get different quality covers
      const thumbnail = imageLinks.thumbnail?.replace('http://', 'https://');
      const smallThumbnail = imageLinks.smallThumbnail?.replace('http://', 'https://');
      // Higher quality versions
      const medium = imageLinks.medium?.replace('http://', 'https://');
      const large = imageLinks.large?.replace('http://', 'https://');
      
      // Try to get higher quality by modifying URL
      let coverUrlHQ = large || medium || thumbnail;
      if (thumbnail && !large && !medium) {
        // Google Books allows changing zoom parameter for higher quality
        coverUrlHQ = thumbnail.replace('zoom=1', 'zoom=2').replace('&edge=curl', '');
      }

      return {
        id: item.id || `google_${Date.now()}_${index}`,
        title: volumeInfo.title || 'Unknown Title',
        author: volumeInfo.authors ? volumeInfo.authors.join(', ') : '',
        pages: volumeInfo.pageCount || undefined,
        coverUrl: thumbnail || smallThumbnail,
        coverUrlHQ: coverUrlHQ,
        description: volumeInfo.description ? volumeInfo.description.substring(0, 200) + '...' : undefined,
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
 * Search books using Open Library API (free, no key required)
 */
const searchOpenLibrary = async (query: string, limit: number = 10, offset: number = 0): Promise<IRecommendedBook[]> => {
  try {
    const response = await axios.get(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`,
      { timeout: 10000 },
    );

    if (!response.data.docs) {
      return [];
    }

    return response.data.docs.map((doc: any, index: number) => {
      const genre = doc.subject ? doc.subject[0] : undefined;
      const coverId = doc.cover_i;
      
      return {
        id: doc.key || `openlibrary_${Date.now()}_${index}`,
        title: doc.title || 'Unknown Title',
        author: doc.author_name ? doc.author_name.join(', ') : '',
        pages: doc.number_of_pages_median || undefined,
        coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : undefined,
        coverUrlHQ: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : undefined,
        description: doc.first_sentence ? doc.first_sentence.join(' ').substring(0, 200) + '...' : undefined,
        genre: genre,
        genreRu: genre ? translateGenre(genre) : undefined,
      };
    });
  } catch (error) {
    console.error('Open Library API error:', error);
    return [];
  }
};

/**
 * Get genre-based search queries
 */
const getGenreQueries = (language: string): string[] => {
  if (language === 'ru') {
    return [
      'бестселлер художественная литература',
      'классика русская литература',
      'современная проза',
      'фантастика научная',
      'детектив триллер',
      'психология саморазвитие',
      'история биография',
      'приключения роман',
      'фэнтези магия',
      'любовный роман',
    ];
  }
  return [
    'bestseller fiction',
    'classic literature',
    'contemporary fiction',
    'science fiction fantasy',
    'mystery thriller',
    'psychology self-help',
    'history biography',
    'adventure novel',
    'fantasy magic',
    'romance novel',
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
 */
export const generateRecommendations = async (userBooks: IBook[], forceNew: boolean = false): Promise<IRecommendedBook[]> => {
  // Filter books that have titles
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
  const seenTitles = new Set<string>(booksWithTitles.map((b) => b.title?.toLowerCase() || ''));
  const seenIds = new Set<string>();

  // Random offset for variety on refresh
  const randomOffset = forceNew ? Math.floor(Math.random() * 20) : 0;

  // Strategy 1: Search by authors (most relevant)
  const authors = shuffleArray(extractAuthors(booksWithTitles)).slice(0, 4);
  for (const author of authors) {
    try {
      const authorBooks = await searchGoogleBooks(`inauthor:"${author}"`, 5, randomOffset);
      for (const book of authorBooks) {
        const titleLower = book.title.toLowerCase();
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

  // Strategy 2: Search by categories/subjects
  const categories = shuffleArray(extractCategories(booksWithTitles)).slice(0, 3);
  for (const category of categories) {
    try {
      const categoryBooks = await searchGoogleBooks(`subject:${category}`, 5, randomOffset);
      for (const book of categoryBooks) {
        const titleLower = book.title.toLowerCase();
        if (!seenTitles.has(titleLower) && !seenIds.has(book.id) && recommendations.length < 20) {
          seenTitles.add(titleLower);
          seenIds.add(book.id);
          recommendations.push(book);
        }
      }
    } catch (error) {
      console.error('Error searching by category:', error);
    }
  }

  // Strategy 3: Search by keywords from titles
  const keywords = extractKeywordsFromTitles(booksWithTitles);
  if (keywords.length > 0) {
    const keywordQuery = shuffleArray(keywords).slice(0, 3).join(' ');
    try {
      const keywordBooks = await searchGoogleBooks(keywordQuery, 5, randomOffset);
      for (const book of keywordBooks) {
        const titleLower = book.title.toLowerCase();
        if (!seenTitles.has(titleLower) && !seenIds.has(book.id) && recommendations.length < 20) {
          seenTitles.add(titleLower);
          seenIds.add(book.id);
          recommendations.push(book);
        }
      }
    } catch (error) {
      console.error('Error searching by keywords:', error);
    }
  }

  // Strategy 4: Search "similar to" user's books via Open Library
  const topBooks = shuffleArray(booksWithTitles).slice(0, 3);
  for (const book of topBooks) {
    if (recommendations.length >= 20) break;
    try {
      const similarBooks = await searchOpenLibrary(`${book.title}`, 3, randomOffset);
      for (const simBook of similarBooks) {
        const titleLower = simBook.title.toLowerCase();
        if (!seenTitles.has(titleLower) && !seenIds.has(simBook.id) && recommendations.length < 20) {
          seenTitles.add(titleLower);
          seenIds.add(simBook.id);
          recommendations.push(simBook);
        }
      }
    } catch (error) {
      console.error('Error searching similar books:', error);
    }
  }

  // Strategy 5: If not enough, add popular/bestseller books
  if (recommendations.length < 15) {
    const genreQueries = getGenreQueries(language);
    const randomGenres = shuffleArray(genreQueries).slice(0, 2);
    for (const genre of randomGenres) {
      try {
        const popularBooks = await searchGoogleBooks(genre, 8, randomOffset);
        for (const book of popularBooks) {
          const titleLower = book.title.toLowerCase();
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

  const queries = shuffleArray(getGenreQueries(language));
  const randomOffset = forceNew ? Math.floor(Math.random() * 30) : 0;

  // Get books from different genres
  for (const query of queries.slice(0, 5)) {
    try {
      const books = await searchGoogleBooks(query, 5, randomOffset);
      for (const book of books) {
        const titleLower = book.title.toLowerCase();
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

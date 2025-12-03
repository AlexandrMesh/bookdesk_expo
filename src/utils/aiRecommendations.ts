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
  'diy': 'Сделай сам',
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
  'literary': 'Литература',
  'contemporary': 'Современная литература',
  'modern': 'Современная литература',
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
 * Extract unique authors from user's books
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
  // Sort by frequency and return
  return Array.from(authors.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([author]) => author);
};

/**
 * Extract categories/genres from user's books
 */
const extractCategories = (books: IBook[]): string[] => {
  const categories = new Map<string, number>();
  books.forEach((book) => {
    if (book.categoryValue) {
      categories.set(book.categoryValue, (categories.get(book.categoryValue) || 0) + 1);
    }
  });
  return Array.from(categories.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);
};

/**
 * Extract meaningful keywords from book titles for better matching
 * This is the key improvement - analyze ALL book titles for common themes
 */
const extractKeywordsFromTitles = (books: IBook[]): string[] => {
  // Stop words in Russian and English
  const stopWords = new Set([
    // English
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'who', 'which', 'what', 'where', 'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'any', 'book', 'books', 'novel', 'story', 'stories', 'tale', 'tales', 'part', 'volume', 'edition',
    // Russian
    'и', 'в', 'на', 'с', 'к', 'о', 'у', 'из', 'по', 'за', 'от', 'до', 'для', 'без', 'при', 'под', 'над', 'через', 'про', 'между', 'перед', 'после', 'во', 'со', 'ко', 'об', 'а', 'но', 'да', 'или', 'ни', 'не', 'же', 'то', 'это', 'как', 'что', 'кто', 'где', 'когда', 'почему', 'зачем', 'чтобы', 'если', 'хотя', 'потому', 'так', 'уже', 'ещё', 'тоже', 'также', 'только', 'всё', 'все', 'вся', 'весь', 'его', 'её', 'их', 'мой', 'твой', 'свой', 'наш', 'ваш', 'этот', 'тот', 'такой', 'какой', 'который', 'чей', 'сам', 'самый', 'каждый', 'любой', 'другой', 'иной', 'один', 'два', 'три', 'много', 'мало', 'несколько', 'книга', 'книги', 'роман', 'история', 'часть', 'том',
  ]);

  const keywords = new Map<string, number>();

  books.forEach((book) => {
    if (book.title) {
      // Split by spaces and special characters
      const words = book.title.toLowerCase().split(/[\s\-–—:;,.!?()[\]{}«»""'']+/);
      words.forEach((word) => {
        const cleaned = word.replace(/[^a-zа-яёЁ0-9]/gi, '');
        // Only consider words with 4+ characters that aren't stop words
        if (cleaned.length >= 4 && !stopWords.has(cleaned) && !/^\d+$/.test(cleaned)) {
          keywords.set(cleaned, (keywords.get(cleaned) || 0) + 1);
        }
      });
    }
  });

  // Sort by frequency and return top keywords
  return Array.from(keywords.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
};

/**
 * Search books using Google Books API (free, no key required)
 */
const searchGoogleBooks = async (query: string, maxResults: number = 10, startIndex: number = 0): Promise<IRecommendedBook[]> => {
  try {
    const langRestrict = i18n.language === 'ru' ? '&langRestrict=ru' : '';
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&startIndex=${startIndex}&orderBy=relevance${langRestrict}&printType=books`,
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
        coverUrlHQ = thumbnail.replace('zoom=1', 'zoom=3').replace('&edge=curl', '');
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
 * Get genre-based search queries based on language
 */
const getGenreQueries = (language: string): string[] => {
  if (language === 'ru') {
    return [
      'современная русская литература бестселлер',
      'классика мировой литературы',
      'психология саморазвитие популярные',
      'детектив триллер российский',
      'фантастика фэнтези лучшее',
      'бизнес мотивация успех',
      'история биография известные',
      'любовный роман современный',
      'приключения путешествия',
      'научпоп наука интересно',
    ];
  }
  return [
    'bestseller fiction contemporary',
    'classic literature must read',
    'psychology self-help popular',
    'mystery thriller suspense',
    'science fiction fantasy award',
    'business motivation success',
    'history biography notable',
    'romance contemporary popular',
    'adventure travel exploration',
    'popular science nonfiction',
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
 * Improved algorithm focusing on keywords from all book titles
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
  const seenTitles = new Set<string>(booksWithTitles.map((b) => b.title?.toLowerCase().trim() || ''));
  const seenIds = new Set<string>();

  // Random offset for variety on refresh
  const randomOffset = forceNew ? Math.floor(Math.random() * 30) : 0;

  // STRATEGY 1: Search by KEYWORDS from all book titles (MOST IMPORTANT)
  // This analyzes all book titles to find common themes and topics
  const keywords = extractKeywordsFromTitles(booksWithTitles);
  if (keywords.length > 0) {
    // Create search queries from keyword combinations
    const keywordQueries = [];
    
    // Single important keywords
    for (const keyword of keywords.slice(0, 5)) {
      keywordQueries.push(keyword);
    }
    
    // Pairs of keywords for more specific searches
    for (let i = 0; i < Math.min(3, keywords.length); i++) {
      for (let j = i + 1; j < Math.min(5, keywords.length); j++) {
        keywordQueries.push(`${keywords[i]} ${keywords[j]}`);
      }
    }

    // Search using keyword queries
    const shuffledQueries = shuffleArray(keywordQueries).slice(0, 5);
    for (const query of shuffledQueries) {
      try {
        const keywordBooks = await searchGoogleBooks(query, 6, randomOffset);
        for (const book of keywordBooks) {
          const titleLower = book.title.toLowerCase().trim();
          if (!seenTitles.has(titleLower) && !seenIds.has(book.id) && recommendations.length < 25) {
            seenTitles.add(titleLower);
            seenIds.add(book.id);
            recommendations.push(book);
          }
        }
      } catch (error) {
        console.error('Error searching by keywords:', error);
      }
    }
  }

  // STRATEGY 2: Search by favorite AUTHORS
  const authors = extractAuthors(booksWithTitles);
  const topAuthors = shuffleArray(authors.slice(0, 6)).slice(0, 3);
  for (const author of topAuthors) {
    try {
      const authorBooks = await searchGoogleBooks(`inauthor:"${author}"`, 5, randomOffset);
      for (const book of authorBooks) {
        const titleLower = book.title.toLowerCase().trim();
        if (!seenTitles.has(titleLower) && !seenIds.has(book.id) && recommendations.length < 25) {
          seenTitles.add(titleLower);
          seenIds.add(book.id);
          recommendations.push(book);
        }
      }
    } catch (error) {
      console.error('Error searching by author:', error);
    }
  }

  // STRATEGY 3: Search by CATEGORIES/GENRES
  const categories = extractCategories(booksWithTitles);
  const topCategories = shuffleArray(categories.slice(0, 4)).slice(0, 2);
  for (const category of topCategories) {
    try {
      const categoryBooks = await searchGoogleBooks(`subject:${category}`, 5, randomOffset);
      for (const book of categoryBooks) {
        const titleLower = book.title.toLowerCase().trim();
        if (!seenTitles.has(titleLower) && !seenIds.has(book.id) && recommendations.length < 25) {
          seenTitles.add(titleLower);
          seenIds.add(book.id);
          recommendations.push(book);
        }
      }
    } catch (error) {
      console.error('Error searching by category:', error);
    }
  }

  // STRATEGY 4: If still not enough, add popular/bestseller books
  if (recommendations.length < 15) {
    const genreQueries = getGenreQueries(language);
    const randomGenres = shuffleArray(genreQueries).slice(0, 3);
    for (const genre of randomGenres) {
      try {
        const popularBooks = await searchGoogleBooks(genre, 8, randomOffset);
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
  const randomOffset = forceNew ? Math.floor(Math.random() * 40) : 0;

  // Get books from different genres
  for (const query of queries.slice(0, 5)) {
    try {
      const books = await searchGoogleBooks(query, 6, randomOffset);
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

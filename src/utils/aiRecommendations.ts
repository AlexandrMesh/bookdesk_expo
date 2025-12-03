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
 * Normalizes cover URLs to use HQ version for backward compatibility
 */
export const getCachedRecommendations = async (): Promise<{ books: IRecommendedBook[]; isExpired: boolean } | null> => {
  try {
    const cached = await AsyncStorage.getItem(RECOMMENDATIONS_CACHE_KEY);
    if (!cached) return null;

    const data: CachedRecommendations = JSON.parse(cached);
    const isExpired = Date.now() - data.timestamp > CACHE_EXPIRY_MS;

    // Normalize covers to use HQ version (backward compatibility with old cache)
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

        // Always use high quality cover - remove zoom restrictions and edge curl
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
          coverUrl: coverUrlHQ || thumbnail, // Use HQ cover as primary
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
 * Curated list of famous bestseller books with their exact titles
 * These are guaranteed high-quality, popular books
 * Extended list for more variety
 */
const getCuratedBestsellers = (language: string): string[] => {
  if (language === 'ru') {
    return [
      // Russian Classics
      'intitle:"Мастер и Маргарита" inauthor:Булгаков',
      'intitle:"Собачье сердце" inauthor:Булгаков',
      'intitle:"Белая гвардия" inauthor:Булгаков',
      'intitle:"Преступление и наказание" inauthor:Достоевский',
      'intitle:"Братья Карамазовы" inauthor:Достоевский',
      'intitle:"Идиот" inauthor:Достоевский',
      'intitle:"Бесы" inauthor:Достоевский',
      'intitle:"Война и мир" inauthor:Толстой',
      'intitle:"Анна Каренина" inauthor:Толстой',
      'intitle:"Воскресение" inauthor:Толстой',
      'intitle:"Евгений Онегин" inauthor:Пушкин',
      'intitle:"Капитанская дочка" inauthor:Пушкин',
      'intitle:"Мертвые души" inauthor:Гоголь',
      'intitle:"Ревизор" inauthor:Гоголь',
      'intitle:"Герой нашего времени" inauthor:Лермонтов',
      'intitle:"Отцы и дети" inauthor:Тургенев',
      'intitle:"Вишневый сад" inauthor:Чехов',
      'intitle:"Палата номер шесть" inauthor:Чехов',
      'intitle:"Обломов" inauthor:Гончаров',
      'intitle:"Доктор Живаго" inauthor:Пастернак',
      // World Classics
      'intitle:"1984" inauthor:Оруэлл',
      'intitle:"Скотный двор" inauthor:Оруэлл',
      'intitle:"О дивный новый мир" inauthor:Хаксли',
      'intitle:"Убить пересмешника" inauthor:Харпер Ли',
      'intitle:"Великий Гэтсби" inauthor:Фицджеральд',
      'intitle:"Над пропастью во ржи" inauthor:Сэлинджер',
      'intitle:"Портрет Дориана Грея" inauthor:Уайльд',
      'intitle:"Граф Монте-Кристо" inauthor:Дюма',
      'intitle:"Три мушкетера" inauthor:Дюма',
      'intitle:"Отверженные" inauthor:Гюго',
      'intitle:"Собор Парижской Богоматери" inauthor:Гюго',
      'intitle:"Джейн Эйр" inauthor:Бронте',
      'intitle:"Грозовой перевал" inauthor:Бронте',
      'intitle:"Гордость и предубеждение" inauthor:Остин',
      'intitle:"Сто лет одиночества" inauthor:Маркес',
      'intitle:"Любовь во время чумы" inauthor:Маркес',
      // Modern Bestsellers
      'intitle:"Гарри Поттер и философский камень" inauthor:Роулинг',
      'intitle:"Гарри Поттер и Тайная комната" inauthor:Роулинг',
      'intitle:"Властелин колец" inauthor:Толкин',
      'intitle:"Хоббит" inauthor:Толкин',
      'intitle:"Маленький принц" inauthor:Экзюпери',
      'intitle:"Код да Винчи" inauthor:Браун',
      'intitle:"Ангелы и демоны" inauthor:Браун',
      'intitle:"Инферно" inauthor:Браун',
      'intitle:"Три товарища" inauthor:Ремарк',
      'intitle:"На западном фронте без перемен" inauthor:Ремарк',
      'intitle:"Триумфальная арка" inauthor:Ремарк',
      'intitle:"Алхимик" inauthor:Коэльо',
      'intitle:"Вероника решает умереть" inauthor:Коэльо',
      'intitle:"Шантарам" inauthor:Робертс',
      'intitle:"Цветы для Элджернона" inauthor:Киз',
      'intitle:"Бегущий за ветром" inauthor:Хоссейни',
      'intitle:"Тысяча сияющих солнц" inauthor:Хоссейни',
      // Thrillers & Horror
      'intitle:"Оно" inauthor:Кинг',
      'intitle:"Сияние" inauthor:Кинг',
      'intitle:"Зеленая миля" inauthor:Кинг',
      'intitle:"Кэрри" inauthor:Кинг',
      'intitle:"Мизери" inauthor:Кинг',
      'intitle:"Кладбище домашних животных" inauthor:Кинг',
      'intitle:"Побег из Шоушенка" inauthor:Кинг',
      'intitle:"11/22/63" inauthor:Кинг',
      'intitle:"Девушка с татуировкой дракона" inauthor:Ларссон',
      'intitle:"Исчезнувшая" inauthor:Флинн',
      'intitle:"Молчание ягнят" inauthor:Харрис',
      'intitle:"Парфюмер" inauthor:Зюскинд',
      // Modern Fiction
      'intitle:"Норвежский лес" inauthor:Мураками',
      'intitle:"Кафка на пляже" inauthor:Мураками',
      'intitle:"1Q84" inauthor:Мураками',
      'intitle:"Охота на овец" inauthor:Мураками',
      'intitle:"Заводной апельсин" inauthor:Берджесс',
      'intitle:"Автостопом по галактике" inauthor:Адамс',
      'intitle:"Марсианин" inauthor:Вейер',
      'intitle:"Голодные игры" inauthor:Коллинз',
      'intitle:"Дивергент" inauthor:Рот',
      // Fantasy & Sci-Fi
      'intitle:"Игра престолов" inauthor:Мартин',
      'intitle:"Битва королей" inauthor:Мартин',
      'intitle:"Дюна" inauthor:Герберт',
      'intitle:"Игра Эндера" inauthor:Кард',
      'intitle:"Основание" inauthor:Азимов',
      'intitle:"Я робот" inauthor:Азимов',
      'intitle:"451 градус по Фаренгейту" inauthor:Брэдбери',
      'intitle:"Марсианские хроники" inauthor:Брэдбери',
      'intitle:"Солярис" inauthor:Лем',
      'intitle:"Ведьмак" inauthor:Сапковский',
      // Russian Modern
      'intitle:"Азазель" inauthor:Акунин',
      'intitle:"Турецкий гамбит" inauthor:Акунин',
      'intitle:"Статский советник" inauthor:Акунин',
      'intitle:"Пикник на обочине" inauthor:Стругацкие',
      'intitle:"Трудно быть богом" inauthor:Стругацкие',
      'intitle:"Понедельник начинается в субботу" inauthor:Стругацкие',
      'intitle:"Обитаемый остров" inauthor:Стругацкие',
      'intitle:"Метро 2033" inauthor:Глуховский',
      'intitle:"Текст" inauthor:Глуховский',
      'intitle:"Ночной Дозор" inauthor:Лукьяненко',
      'intitle:"Дневной Дозор" inauthor:Лукьяненко',
      // Psychology & Self-help
      'intitle:"Думай медленно решай быстро" inauthor:Канеман',
      'intitle:"Тонкое искусство пофигизма" inauthor:Мэнсон',
      'intitle:"Атомные привычки" inauthor:Клир',
      'intitle:"Сила воли" inauthor:Макгонигал',
    ];
  }
  return [
    // Classic Literature
    'intitle:"To Kill a Mockingbird" inauthor:Harper Lee',
    'intitle:"1984" inauthor:Orwell',
    'intitle:"Animal Farm" inauthor:Orwell',
    'intitle:"Brave New World" inauthor:Huxley',
    'intitle:"Pride and Prejudice" inauthor:Austen',
    'intitle:"Sense and Sensibility" inauthor:Austen',
    'intitle:"The Great Gatsby" inauthor:Fitzgerald',
    'intitle:"The Catcher in the Rye" inauthor:Salinger',
    'intitle:"One Hundred Years of Solitude" inauthor:Marquez',
    'intitle:"Love in the Time of Cholera" inauthor:Marquez',
    'intitle:"The Lord of the Flies" inauthor:Golding',
    'intitle:"Jane Eyre" inauthor:Bronte',
    'intitle:"Wuthering Heights" inauthor:Bronte',
    'intitle:"The Picture of Dorian Gray" inauthor:Wilde',
    'intitle:"Crime and Punishment" inauthor:Dostoevsky',
    'intitle:"The Brothers Karamazov" inauthor:Dostoevsky',
    'intitle:"War and Peace" inauthor:Tolstoy',
    'intitle:"Anna Karenina" inauthor:Tolstoy',
    'intitle:"Les Miserables" inauthor:Hugo',
    'intitle:"The Count of Monte Cristo" inauthor:Dumas',
    'intitle:"The Three Musketeers" inauthor:Dumas',
    'intitle:"Don Quixote" inauthor:Cervantes',
    'intitle:"Moby Dick" inauthor:Melville',
    'intitle:"Frankenstein" inauthor:Shelley',
    'intitle:"Dracula" inauthor:Stoker',
    // Modern Bestsellers
    'intitle:"Harry Potter and the Sorcerer" inauthor:Rowling',
    'intitle:"Harry Potter and the Chamber" inauthor:Rowling',
    'intitle:"Harry Potter and the Prisoner" inauthor:Rowling',
    'intitle:"The Lord of the Rings" inauthor:Tolkien',
    'intitle:"The Hobbit" inauthor:Tolkien',
    'intitle:"The Da Vinci Code" inauthor:Brown',
    'intitle:"Angels and Demons" inauthor:Brown',
    'intitle:"Inferno" inauthor:Brown',
    'intitle:"The Alchemist" inauthor:Coelho',
    'intitle:"The Kite Runner" inauthor:Hosseini',
    'intitle:"A Thousand Splendid Suns" inauthor:Hosseini',
    'intitle:"Gone Girl" inauthor:Flynn',
    'intitle:"The Girl on the Train" inauthor:Hawkins',
    'intitle:"The Girl with the Dragon Tattoo" inauthor:Larsson',
    'intitle:"The Hunger Games" inauthor:Collins',
    'intitle:"Catching Fire" inauthor:Collins',
    'intitle:"Divergent" inauthor:Roth',
    'intitle:"The Fault in Our Stars" inauthor:Green',
    'intitle:"The Little Prince" inauthor:Saint-Exupery',
    'intitle:"Flowers for Algernon" inauthor:Keyes',
    'intitle:"Shantaram" inauthor:Roberts',
    'intitle:"The Martian" inauthor:Weir',
    'intitle:"Ready Player One" inauthor:Cline',
    // Thrillers & Horror
    'intitle:"It" inauthor:Stephen King',
    'intitle:"The Shining" inauthor:Stephen King',
    'intitle:"The Green Mile" inauthor:Stephen King',
    'intitle:"Misery" inauthor:Stephen King',
    'intitle:"Pet Sematary" inauthor:Stephen King',
    'intitle:"Carrie" inauthor:Stephen King',
    'intitle:"The Stand" inauthor:Stephen King',
    'intitle:"11/22/63" inauthor:Stephen King',
    'intitle:"The Silence of the Lambs" inauthor:Harris',
    'intitle:"Perfume" inauthor:Suskind',
    'intitle:"And Then There Were None" inauthor:Christie',
    'intitle:"Murder on the Orient Express" inauthor:Christie',
    'intitle:"The Murder of Roger Ackroyd" inauthor:Christie',
    // Fantasy & Sci-Fi
    'intitle:"A Game of Thrones" inauthor:Martin',
    'intitle:"A Clash of Kings" inauthor:Martin',
    'intitle:"A Storm of Swords" inauthor:Martin',
    'intitle:"Dune" inauthor:Herbert',
    'intitle:"Ender Game" inauthor:Card',
    'intitle:"The Hitchhiker Guide to the Galaxy" inauthor:Adams',
    'intitle:"Foundation" inauthor:Asimov',
    'intitle:"I Robot" inauthor:Asimov',
    'intitle:"Fahrenheit 451" inauthor:Bradbury',
    'intitle:"The Martian Chronicles" inauthor:Bradbury',
    'intitle:"Solaris" inauthor:Lem',
    'intitle:"Neuromancer" inauthor:Gibson',
    'intitle:"Snow Crash" inauthor:Stephenson',
    'intitle:"The Name of the Wind" inauthor:Rothfuss',
    'intitle:"The Way of Kings" inauthor:Sanderson',
    'intitle:"Mistborn" inauthor:Sanderson',
    'intitle:"American Gods" inauthor:Gaiman',
    'intitle:"Good Omens" inauthor:Gaiman',
    'intitle:"The Witcher" inauthor:Sapkowski',
    // Contemporary Fiction
    'intitle:"Norwegian Wood" inauthor:Murakami',
    'intitle:"Kafka on the Shore" inauthor:Murakami',
    'intitle:"1Q84" inauthor:Murakami',
    'intitle:"A Clockwork Orange" inauthor:Burgess',
    'intitle:"The Road" inauthor:McCarthy',
    'intitle:"No Country for Old Men" inauthor:McCarthy',
    'intitle:"Life of Pi" inauthor:Martel',
    'intitle:"The Book Thief" inauthor:Zusak',
    'intitle:"The Lovely Bones" inauthor:Sebold',
    // Psychology & Self-help
    'intitle:"Thinking Fast and Slow" inauthor:Kahneman',
    'intitle:"Atomic Habits" inauthor:Clear',
    'intitle:"The Subtle Art of Not Giving" inauthor:Manson',
    'intitle:"Sapiens" inauthor:Harari',
    'intitle:"Homo Deus" inauthor:Harari',
  ];
};

/**
 * Filter out low-quality results (textbooks, study guides, collections, etc.)
 */
const isQualityBook = (book: IRecommendedBook): boolean => {
  const title = book.title.toLowerCase();
  const author = (book.author || '').toLowerCase();

  // Exclude patterns for textbooks, study materials, and collections
  const excludePatterns = [
    // Educational materials
    'study guide',
    'учебник',
    'учебное пособие',
    'рабочая тетрадь',
    'workbook',
    'textbook',
    'exam',
    'экзамен',
    'тест',
    'test prep',
    'для студентов',
    'for students',
    'курс лекций',
    'lecture',
    'справочник',
    'handbook',
    'manual',
    'руководство по',
    'guide to',
    'introduction to',
    'введение в',
    'основы ',
    'fundamentals',
    'encyclopedia',
    'энциклопедия',
    'словарь',
    'dictionary',
    'grammar',
    'грамматика',
    'самоучитель',
    'tutorial',
    // Summaries and analysis
    'краткое содержание',
    'summary',
    'notes on',
    'sparknotes',
    'cliffnotes',
    'analysis of',
    'анализ произведения',
    'сочинение',
    'essay on',
    'dissertation',
    'thesis',
    'монография',
    'критика',
    'review of',
    // Collections and compilations
    'сборник',
    'collection',
    'anthology',
    'антология',
    'собрание сочинений',
    'complete works',
    'избранное',
    'selected works',
    'полное собрание',
    'в 2 томах',
    'в 3 томах',
    'том 1',
    'том 2',
    'volume 1',
    'volume 2',
    'vol. ',
    'vol ',
    'part 1',
    'part 2',
    'часть 1',
    'часть 2',
    'book 1',
    'book 2',
    'книга 1',
    'книга 2',
    // Special editions and formats
    '(illustrated)',
    '(annotated)',
    '(abridged)',
    '(unabridged)',
    'coloring book',
    'раскраска',
    'activity book',
    'audiobook',
    'аудиокнига',
    // Reference and academic
    'bibliography',
    'библиография',
    'index',
    'указатель',
    'каталог',
    'catalog',
    'proceedings',
    'journal',
    'журнал',
    // Guides and how-to
    'how to',
    'как ',
    'for dummies',
    'для чайников',
    'complete guide',
    'полное руководство',
    "beginner's",
    'для начинающих',
    // Series markers that indicate fragments
    ': book ',
    ': книга ',
    ', book ',
    ', книга ',
    'trilogy',
    'трилогия',
    // Short stories and excerpts
    'short stories',
    'рассказы',
    'excerpt',
    'отрывок',
    // Other unwanted
    'calendar',
    'календарь',
    'planner',
    'ежедневник',
    'journal',
    'дневник',
    'notebook',
    'блокнот',
    'cookbook',
    'кулинарная книга',
    'recipe',
    'рецепт',
  ];

  for (const pattern of excludePatterns) {
    if (title.includes(pattern) || author.includes(pattern)) {
      return false;
    }
  }

  // Must have a real author (not empty or generic)
  if (!book.author || book.author.length < 3) {
    return false;
  }

  // Exclude if author looks like a publisher or organization
  const publisherPatterns = ['publisher', 'издательство', 'press', 'house', 'llc', 'inc', 'ltd', 'publishing'];
  for (const pattern of publisherPatterns) {
    if (author.includes(pattern)) {
      return false;
    }
  }

  // Title should be reasonable length (not too short or too long)
  if (book.title.length < 3 || book.title.length > 100) {
    return false;
  }

  // Exclude titles that are just numbers or very generic
  if (/^\d+$/.test(book.title.trim())) {
    return false;
  }

  return true;
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
 * NEW APPROACH: Use curated bestsellers list for guaranteed quality
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

  // Get curated bestsellers and shuffle for variety
  const bestsellers = shuffleArray(getCuratedBestsellers(language));

  // Fetch each bestseller - these are guaranteed quality books
  for (const query of bestsellers) {
    if (recommendations.length >= 20) break;

    try {
      // Search with maxResults=1 to get the exact book
      const books = await searchGoogleBooks(query, 3, 0);
      for (const book of books) {
        const titleLower = book.title.toLowerCase().trim();
        // Skip if user already has this book or we've seen it
        if (!seenTitles.has(titleLower) && !seenIds.has(book.id) && isQualityBook(book) && recommendations.length < 20) {
          seenTitles.add(titleLower);
          seenIds.add(book.id);
          recommendations.push(book);
          break; // Take only the first quality result per query
        }
      }
    } catch (error) {
      console.error('Error fetching bestseller:', error);
    }
  }

  // If we still need more books, try user's favorite authors
  if (recommendations.length < 15) {
    const authors = extractAuthors(booksWithTitles);
    const topAuthors = shuffleArray(authors.slice(0, 5)).slice(0, 2);

    for (const author of topAuthors) {
      if (recommendations.length >= 20) break;
      try {
        const authorBooks = await searchGoogleBooks(`inauthor:"${author}"`, 5, 0);
        for (const book of authorBooks) {
          const titleLower = book.title.toLowerCase().trim();
          if (!seenTitles.has(titleLower) && !seenIds.has(book.id) && isQualityBook(book) && recommendations.length < 20) {
            seenTitles.add(titleLower);
            seenIds.add(book.id);
            recommendations.push(book);
          }
        }
      } catch (error) {
        console.error('Error searching by author:', error);
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
 * Uses curated bestsellers list for guaranteed quality
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

  // Get curated bestsellers and shuffle for variety
  const bestsellers = shuffleArray(getCuratedBestsellers(language));

  // Fetch each bestseller - these are guaranteed quality books
  for (const query of bestsellers) {
    if (recommendations.length >= 20) break;

    try {
      const books = await searchGoogleBooks(query, 3, 0);
      for (const book of books) {
        const titleLower = book.title.toLowerCase().trim();
        if (!seenTitles.has(titleLower) && !seenIds.has(book.id) && isQualityBook(book) && recommendations.length < 20) {
          seenTitles.add(titleLower);
          seenIds.add(book.id);
          recommendations.push(book);
          break; // Take only the first quality result per query
        }
      }
    } catch (error) {
      console.error('Error fetching bestseller:', error);
    }
  }

  const shuffledRecommendations = shuffleArray(recommendations);

  // Cache results
  if (shuffledRecommendations.length > 0) {
    await cacheRecommendations(shuffledRecommendations, 'default');
  }

  return shuffledRecommendations;
};

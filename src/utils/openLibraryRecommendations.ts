import axios from 'axios';

import i18n from '~translations/i18n';
import { IBook } from '~types/books';

export interface IOpenLibraryBook {
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

const OL_SEARCH = 'https://openlibrary.org/search.json';
const OL_SUBJECT = 'https://openlibrary.org/subjects';
const REQUEST_TIMEOUT = 15000;
const TARGET_COUNT = 20;
/** Russian Cyrillic (excludes Ukrainian-specific letters ІЇЄҐ) */
const RUSSIAN_CYRILLIC_RE = /[А-Яа-яЁё]/;
const UKRAINIAN_LETTER_RE = /[ІіЇїЄєҐґ]/;
const UKRAINIAN_MARKER_RE = /ukrain|україн|украин/i;

const isRussianLocale = () => (i18n.language || 'ru').toLowerCase().startsWith('ru');
const hasRussianCyrillic = (text?: string) => !!text && RUSSIAN_CYRILLIC_RE.test(text);
const looksUkrainian = (text?: string) => !!text && (UKRAINIAN_LETTER_RE.test(text) || UKRAINIAN_MARKER_RE.test(text));

/** Russian-locale books: Cyrillic title, not Ukrainian. */
const isAcceptableRussianBook = (title?: string, author?: string, subjects?: string[]): boolean => {
  if (!title || !hasRussianCyrillic(title)) return false;
  if (looksUkrainian(title) || looksUkrainian(author)) return false;
  if (subjects?.some((s) => looksUkrainian(s))) return false;
  return true;
};

const DEFAULT_SUBJECTS_EN = [
  'fiction',
  'fantasy',
  'science_fiction',
  'mystery',
  'thriller',
  'romance',
  'historical_fiction',
  'biography',
  'psychology',
  'self-help',
  'classics',
  'adventure',
  'horror',
  'young_adult_fiction',
];

const DEFAULT_SUBJECTS_RU = ['russian_literature', 'soviet_literature', 'russian_fiction'];

const RU_GENRE_QUERIES: Record<string, string[]> = {
  fantasy: ['фэнтези', 'русское фэнтези'],
  science_fiction: ['научная фантастика', 'фантастика'],
  mystery: ['детектив', 'русский детектив'],
  thriller: ['триллер', 'детектив'],
  romance: ['любовный роман', 'женский роман'],
  horror: ['мистика', 'ужасы'],
  classics: ['русская классика', 'subject:russian literature'],
  biography: ['биография'],
  psychology: ['психология'],
  'self-help': ['саморазвитие', 'психология'],
  adventure: ['приключения'],
  history: ['исторический роман'],
  philosophy: ['философия'],
  poetry: ['поэзия'],
  fiction: ['современная проза', 'повести', 'рассказы'],
  historical_fiction: ['исторический роман'],
  young_adult_fiction: ['молодёжная проза'],
  juvenile_fiction: ['детская литература'],
};

/** Author seeds = Open Library search queries only (live results, not a static catalog). */
const RU_GENRE_AUTHOR_SEEDS: Record<string, string[]> = {
  fantasy: ['Сергей Лукьяненко', 'Ник Перумов', 'Мария Семёнова', 'Алексей Пехов'],
  science_fiction: ['Аркадий Стругацкий', 'Кир Булычёв', 'Иван Ефремов', 'Александр Беляев'],
  mystery: ['Борис Акунин', 'Александра Маринина', 'Татьяна Устинова'],
  thriller: ['Борис Акунин', 'Полина Дашкова'],
  romance: ['Татьяна Устинова'],
  horror: ['Алексей Иванов', 'Виктор Пелевин'],
  classics: ['Фёдор Достоевский', 'Лев Толстой', 'Антон Чехов', 'Иван Тургенев', 'Николай Гоголь', 'Александр Пушкин'],
  fiction: ['Людмила Улицкая', 'Виктор Пелевин', 'Захар Прилепин', 'Гузель Яхина', 'Евгений Водолазкин'],
  biography: ['Дмитрий Быков'],
  psychology: ['Михаил Лабковский'],
  adventure: ['Александр Грин', 'Вениамин Каверин'],
  historical_fiction: ['Борис Акунин', 'Валентин Пикуль'],
};

const GENRE_TO_SUBJECT: Record<string, string> = {
  fantasy: 'fantasy',
  фэнтези: 'fantasy',
  'science fiction': 'science_fiction',
  'sci-fi': 'science_fiction',
  'научная фантастика': 'science_fiction',
  фантастика: 'science_fiction',
  mystery: 'mystery',
  детектив: 'mystery',
  thriller: 'thriller',
  триллер: 'thriller',
  romance: 'romance',
  любовный: 'romance',
  романтика: 'romance',
  horror: 'horror',
  ужасы: 'horror',
  мистика: 'horror',
  classics: 'classics',
  классика: 'classics',
  biography: 'biography',
  биография: 'biography',
  psychology: 'psychology',
  психология: 'psychology',
  'self-help': 'self-help',
  саморазвитие: 'self-help',
  adventure: 'adventure',
  приключения: 'adventure',
  history: 'history',
  история: 'history',
  philosophy: 'philosophy',
  философия: 'philosophy',
  poetry: 'poetry',
  поэзия: 'poetry',
  drama: 'drama',
  драма: 'drama',
  humor: 'humor',
  юмор: 'humor',
  children: 'juvenile_fiction',
  детская: 'juvenile_fiction',
  'young adult': 'young_adult_fiction',
  молодёжная: 'young_adult_fiction',
  fiction: 'fiction',
  проза: 'fiction',
};

const SUBJECT_GENRE_RU: Record<string, string> = {
  fantasy: 'Фэнтези',
  science_fiction: 'Научная фантастика',
  mystery: 'Детектив',
  thriller: 'Триллер',
  romance: 'Романтика',
  horror: 'Ужасы',
  classics: 'Классика',
  biography: 'Биография',
  psychology: 'Психология',
  'self-help': 'Саморазвитие',
  adventure: 'Приключения',
  history: 'История',
  philosophy: 'Философия',
  fiction: 'Художественная литература',
  historical_fiction: 'Историческая проза',
  young_adult_fiction: 'Молодёжная литература',
  juvenile_fiction: 'Детская литература',
  russian_literature: 'Русская литература',
  soviet_literature: 'Советская литература',
  russian_fiction: 'Русская проза',
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const normalizeTitle = (title: string) => title.toLowerCase().trim();
const coverUrlFromId = (coverId: number, size: 'M' | 'L' = 'L') => `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg?default=false`;

/**
 * Cover-only lookup — no locale/language filters (English editions have better covers).
 */
export const findOpenLibraryCoverUrl = async (title: string, author: string = ''): Promise<string | null> => {
  const cleanTitle = title?.trim();
  if (!cleanTitle) return null;

  const fieldList = 'key,title,author_name,cover_i,edition_count,cover_edition_key,isbn';
  const queries: Array<Record<string, string | number>> = [
    { title: cleanTitle, ...(author ? { author: author.trim() } : {}), limit: 15, fields: fieldList },
    { q: `${cleanTitle} ${author}`.trim(), limit: 15, fields: fieldList },
    { title: cleanTitle, limit: 15, fields: fieldList },
  ];

  try {
    for (const params of queries) {
      const { data } = await axios.get(OL_SEARCH, {
        params,
        timeout: REQUEST_TIMEOUT,
        headers: { Accept: 'application/json' },
      });
      const docs: Array<OlDoc & { cover_edition_key?: string; isbn?: string[] }> = Array.isArray(data?.docs) ? data.docs : [];
      const ranked = [...docs]
        .filter((d) => (typeof d.cover_i === 'number' && d.cover_i > 0) || d.cover_edition_key || (d.isbn && d.isbn.length > 0))
        .sort((a, b) => (b.edition_count || 0) - (a.edition_count || 0));

      for (const doc of ranked) {
        if (typeof doc.cover_i === 'number' && doc.cover_i > 0) {
          return coverUrlFromId(doc.cover_i, 'M');
        }
        if (doc.cover_edition_key) {
          return `https://covers.openlibrary.org/b/olid/${doc.cover_edition_key}-M.jpg?default=false`;
        }
        const isbn = doc.isbn?.find((v) => typeof v === 'string' && v.length >= 10);
        if (isbn) {
          return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`;
        }
      }
    }
  } catch (error) {
    console.warn('Open Library cover lookup failed:', cleanTitle, error);
  }
  return null;
};

const mapSubjectSlug = (raw?: string): string | null => {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  if (GENRE_TO_SUBJECT[key]) return GENRE_TO_SUBJECT[key];
  for (const [label, slug] of Object.entries(GENRE_TO_SUBJECT)) {
    if (key.includes(label)) return slug;
  }
  if (/^[a-z0-9_]+$/.test(key)) return key;
  return null;
};

const extractAuthors = (books: IBook[]): string[] => {
  const counts = new Map<string, number>();
  for (const book of books) {
    for (const author of book.authorsList || []) {
      const name = author?.trim();
      if (!name || name.length < 2) continue;
      const weight = typeof book.rating === 'number' && book.rating > 0 ? book.rating : 1;
      counts.set(name, (counts.get(name) || 0) + weight);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .slice(0, 8);
};

const extractSubjects = (books: IBook[]): string[] => {
  const counts = new Map<string, number>();
  for (const book of books) {
    const slug = mapSubjectSlug(book.categoryValue);
    if (!slug) continue;
    counts.set(slug, (counts.get(slug) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([slug]) => slug)
    .slice(0, 6);
};

const isLowQualityTitle = (title: string): boolean => {
  const lower = title.toLowerCase();
  const banned = [
    'study guide',
    'учебник',
    'workbook',
    'textbook',
    'summary',
    'краткое содержание',
    'coloring book',
    'раскраска',
    'dictionary',
    'словарь',
    'собрание сочинений',
    'полный курс',
  ];
  return banned.some((p) => lower.includes(p));
};

interface OlDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  subject?: string[];
  language?: string[];
  edition_count?: number;
}

const docToBook = (doc: OlDoc, genreRuHint?: string): IOpenLibraryBook | null => {
  if (!doc?.title || !doc.cover_i) return null;
  if (isLowQualityTitle(doc.title)) return null;
  const author = Array.isArray(doc.author_name) ? doc.author_name.slice(0, 2).join(', ') : '';
  if (!author || author.length < 2) return null;

  if (isRussianLocale()) {
    const langs = Array.isArray(doc.language) ? doc.language.map((l) => String(l).toLowerCase()) : [];
    // Drop Ukrainian editions even if also tagged rus
    if (langs.includes('ukr')) return null;
    if (!isAcceptableRussianBook(doc.title, author, doc.subject)) return null;
  }

  const subject = Array.isArray(doc.subject) ? doc.subject[0] : undefined;
  const coverUrl = coverUrlFromId(doc.cover_i);

  return {
    id: doc.key || `ol_${doc.cover_i}`,
    title: doc.title,
    author,
    pages: typeof doc.number_of_pages_median === 'number' ? doc.number_of_pages_median : undefined,
    coverUrl,
    coverUrlHQ: coverUrl,
    genre: subject,
    genreRu: genreRuHint || (subject ? SUBJECT_GENRE_RU[mapSubjectSlug(subject) || ''] : undefined),
  };
};

const preferLocaleOrder = (books: IOpenLibraryBook[]): IOpenLibraryBook[] => {
  if (!isRussianLocale()) return shuffleArray(books);
  // RU locale: only Russian Cyrillic titles (Ukrainian already filtered out)
  return shuffleArray(books.filter((b) => isAcceptableRussianBook(b.title, b.author)));
};

const withRuLanguage = (params: Record<string, string | number>) => {
  if (isRussianLocale()) {
    params.language = 'rus';
  }
  return params;
};

const searchByAuthor = async (author: string, limit = 12, genreRuHint?: string): Promise<IOpenLibraryBook[]> => {
  try {
    const { data } = await axios.get(OL_SEARCH, {
      params: withRuLanguage({
        author,
        limit: Math.max(limit, 20),
        fields: 'key,title,author_name,cover_i,number_of_pages_median,subject,language',
      }),
      timeout: REQUEST_TIMEOUT,
      headers: { Accept: 'application/json' },
    });
    const docs: OlDoc[] = Array.isArray(data?.docs) ? data.docs : [];
    const mapped = docs.map((doc) => docToBook(doc, genreRuHint)).filter(Boolean) as IOpenLibraryBook[];
    return preferLocaleOrder(mapped).slice(0, limit);
  } catch (error) {
    console.warn('Open Library author search failed:', author, error);
    return [];
  }
};

const searchByQuery = async (query: string, limit = 16, genreRuHint?: string): Promise<IOpenLibraryBook[]> => {
  try {
    const { data } = await axios.get(OL_SEARCH, {
      params: withRuLanguage({
        q: query,
        limit: Math.max(limit * 2, 30),
        fields: 'key,title,author_name,cover_i,number_of_pages_median,subject,language',
      }),
      timeout: REQUEST_TIMEOUT,
      headers: { Accept: 'application/json' },
    });
    const docs: OlDoc[] = Array.isArray(data?.docs) ? data.docs : [];
    const mapped = docs.map((doc) => docToBook(doc, genreRuHint)).filter(Boolean) as IOpenLibraryBook[];
    return preferLocaleOrder(mapped).slice(0, limit);
  } catch (error) {
    console.warn('Open Library query search failed:', query, error);
    return [];
  }
};

const searchBySubject = async (subject: string, limit = 16): Promise<IOpenLibraryBook[]> => {
  try {
    const offset = Math.floor(Math.random() * 40);
    const { data } = await axios.get(`${OL_SUBJECT}/${encodeURIComponent(subject)}.json`, {
      params: { limit: Math.max(limit, 20), offset },
      timeout: REQUEST_TIMEOUT,
      headers: { Accept: 'application/json' },
    });
    const works = Array.isArray(data?.works) ? data.works : [];
    const genreRu = SUBJECT_GENRE_RU[subject];
    const mapped = works
      .map((work: { key?: string; title?: string; authors?: Array<{ name?: string }>; cover_id?: number; subject?: string[] }) => {
        if (!work?.title || !work.cover_id) return null;
        if (isLowQualityTitle(work.title)) return null;
        const author = work.authors?.[0]?.name || '';
        if (!author) return null;
        if (isRussianLocale() && !isAcceptableRussianBook(work.title, author, work.subject)) {
          return null;
        }
        const coverUrl = coverUrlFromId(work.cover_id);
        return {
          id: work.key || `ol_subj_${work.cover_id}`,
          title: work.title,
          author,
          coverUrl,
          coverUrlHQ: coverUrl,
          genre: subject.replace(/_/g, ' '),
          genreRu,
        } as IOpenLibraryBook;
      })
      .filter(Boolean) as IOpenLibraryBook[];
    return preferLocaleOrder(mapped).slice(0, limit);
  } catch (error) {
    console.warn('Open Library subject search failed:', subject, error);
    return [];
  }
};

const searchByGenre = async (subject: string, limit = 14): Promise<IOpenLibraryBook[]> => {
  if (!isRussianLocale()) {
    return searchBySubject(subject, limit);
  }

  const results: IOpenLibraryBook[] = [];
  const seen = new Set<string>();
  const push = (books: IOpenLibraryBook[]) => {
    for (const book of books) {
      if (results.length >= limit) break;
      const key = normalizeTitle(book.title);
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(book);
    }
  };

  for (const query of shuffleArray(RU_GENRE_QUERIES[subject] || [SUBJECT_GENRE_RU[subject] || subject]).slice(0, 2)) {
    if (results.length >= limit) break;
    push(await searchByQuery(query, limit, SUBJECT_GENRE_RU[subject]));
    await delay(100);
  }

  for (const author of shuffleArray(RU_GENRE_AUTHOR_SEEDS[subject] || []).slice(0, 3)) {
    if (results.length >= limit) break;
    push(await searchByAuthor(author, 8, SUBJECT_GENRE_RU[subject]));
    await delay(100);
  }

  if (results.length < limit) {
    push(await searchBySubject('russian_literature', limit));
  }

  return preferLocaleOrder(results).slice(0, limit);
};

const collectUnique = (
  incoming: IOpenLibraryBook[],
  bucket: IOpenLibraryBook[],
  seenTitles: Set<string>,
  seenIds: Set<string>,
  limit: number,
  preferCyrillic: boolean,
) => {
  const ordered = preferCyrillic ? preferLocaleOrder(incoming) : shuffleArray(incoming);
  for (const book of ordered) {
    if (bucket.length >= limit) break;
    const titleKey = normalizeTitle(book.title);
    if (seenTitles.has(titleKey) || seenIds.has(book.id)) continue;
    if (preferCyrillic && !isAcceptableRussianBook(book.title, book.author)) {
      continue;
    }
    seenTitles.add(titleKey);
    seenIds.add(book.id);
    bucket.push(book);
  }
};

export const fetchPersonalizedFromOpenLibrary = async (userBooks: IBook[], excludeTitles: string[] = []): Promise<IOpenLibraryBook[]> => {
  const preferCyrillic = isRussianLocale();
  const seenTitles = new Set<string>([...userBooks.map((b) => normalizeTitle(b.title || '')).filter(Boolean), ...excludeTitles.map(normalizeTitle)]);
  const seenIds = new Set<string>();
  const results: IOpenLibraryBook[] = [];

  const authors = extractAuthors(userBooks);
  const subjects = extractSubjects(userBooks);

  for (const author of authors.slice(0, 5)) {
    if (results.length >= TARGET_COUNT) break;
    const books = await searchByAuthor(author, 12);
    collectUnique(books, results, seenTitles, seenIds, TARGET_COUNT, preferCyrillic);
    await delay(120);
  }

  for (const subject of subjects.slice(0, 4)) {
    if (results.length >= TARGET_COUNT) break;
    const books = await searchByGenre(subject, 12);
    collectUnique(books, results, seenTitles, seenIds, TARGET_COUNT, preferCyrillic);
    await delay(120);
  }

  if (results.length < TARGET_COUNT) {
    const fillers = preferCyrillic
      ? shuffleArray([...DEFAULT_SUBJECTS_RU, 'fiction', 'classics', 'mystery', 'science_fiction']).slice(0, 5)
      : shuffleArray(DEFAULT_SUBJECTS_EN.filter((s) => !subjects.includes(s))).slice(0, 4);

    for (const subject of fillers) {
      if (results.length >= TARGET_COUNT) break;
      const books =
        preferCyrillic && !subject.includes('russian') && !subject.includes('soviet')
          ? await searchByGenre(subject, 10)
          : await searchBySubject(subject, 10);
      collectUnique(books, results, seenTitles, seenIds, TARGET_COUNT, preferCyrillic);
      await delay(120);
    }
  }

  if (preferCyrillic && results.length < TARGET_COUNT) {
    const books = await searchBySubject('russian_literature', 20);
    collectUnique(books, results, seenTitles, seenIds, TARGET_COUNT, true);
  }

  return results.slice(0, TARGET_COUNT);
};

export const fetchPopularFromOpenLibrary = async (excludeTitles: string[] = []): Promise<IOpenLibraryBook[]> => {
  const preferCyrillic = isRussianLocale();
  const seenTitles = new Set<string>(excludeTitles.map(normalizeTitle));
  const seenIds = new Set<string>();
  const results: IOpenLibraryBook[] = [];

  if (preferCyrillic) {
    for (const subject of shuffleArray([...DEFAULT_SUBJECTS_RU])) {
      if (results.length >= TARGET_COUNT) break;
      const books = await searchBySubject(subject, 14);
      collectUnique(books, results, seenTitles, seenIds, TARGET_COUNT, true);
      await delay(120);
    }

    const genres = shuffleArray(['fiction', 'classics', 'mystery', 'science_fiction', 'fantasy', 'romance', 'historical_fiction']);
    for (const genre of genres.slice(0, 5)) {
      if (results.length >= TARGET_COUNT) break;
      const books = await searchByGenre(genre, 10);
      collectUnique(books, results, seenTitles, seenIds, TARGET_COUNT, true);
      await delay(120);
    }
  } else {
    const subjects = shuffleArray([...DEFAULT_SUBJECTS_EN]).slice(0, 6);
    for (const subject of subjects) {
      if (results.length >= TARGET_COUNT) break;
      const books = await searchBySubject(subject, 12);
      collectUnique(books, results, seenTitles, seenIds, TARGET_COUNT, false);
      await delay(120);
    }
  }

  return results.slice(0, TARGET_COUNT);
};

export const searchOpenLibraryBook = async (title: string, author: string): Promise<IOpenLibraryBook | null> => {
  try {
    const params: Record<string, string | number> = withRuLanguage({
      limit: 12,
      fields: 'key,title,author_name,cover_i,number_of_pages_median,subject,language',
    });
    if (title) params.title = title;
    if (author) params.author = author;

    let { data } = await axios.get(OL_SEARCH, {
      params,
      timeout: REQUEST_TIMEOUT,
      headers: { Accept: 'application/json' },
    });

    let docs: OlDoc[] = Array.isArray(data?.docs) ? data.docs : [];
    if (docs.length === 0 && title) {
      const fallback = await axios.get(OL_SEARCH, {
        params: withRuLanguage({
          q: `${title} ${author}`.trim(),
          limit: 12,
          fields: 'key,title,author_name,cover_i,number_of_pages_median,subject,language',
        }),
        timeout: REQUEST_TIMEOUT,
        headers: { Accept: 'application/json' },
      });
      data = fallback.data;
      docs = Array.isArray(data?.docs) ? data.docs : [];
    }

    const preferRu = isRussianLocale();
    const ranked = preferRu ? docs.filter((d) => isAcceptableRussianBook(d.title, d.author_name?.join(', '), d.subject)) : docs;
    const withCover = (ranked.length > 0 ? ranked : preferRu ? [] : docs).find((d) => d.cover_i);
    return withCover ? docToBook(withCover) : null;
  } catch (error) {
    console.warn('Open Library book search error:', error);
    return null;
  }
};

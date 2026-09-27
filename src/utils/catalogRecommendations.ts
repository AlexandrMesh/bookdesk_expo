import { Image } from 'react-native';

import i18n from '~translations/i18n';
import { IBook } from '~types/books';
import type { IRecommendedBook } from '~utils/aiRecommendations';
import { CATALOG_COVER_ASSETS } from '~utils/catalogCoverAssets';
import { DEFAULT_COVER_SOURCE } from '~utils/coverUtils';
import { CatalogBook, CatalogGenre, POPULAR_BOOKS_CATALOG } from '~utils/popularBooksCatalog';

const TARGET = 20;

const isRu = () => (i18n.language || 'en').toLowerCase().startsWith('ru');

const GENRE_EN: Record<CatalogGenre, string> = {
  classics: 'Classics',
  fiction: 'Fiction',
  fantasy: 'Fantasy',
  science_fiction: 'Science Fiction',
  mystery: 'Mystery',
  thriller: 'Thriller',
  romance: 'Romance',
  horror: 'Horror',
  historical_fiction: 'Historical Fiction',
  biography: 'Biography',
  psychology: 'Psychology',
  'self-help': 'Self-Help',
  adventure: 'Adventure',
  young_adult: 'Young Adult',
  nonfiction: 'Non-Fiction',
};

const normalize = (value?: string) =>
  (value || '')
    .toLowerCase()
    .replace(/[«»"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const localized = (book: CatalogBook) => {
  // English app language → always English title/author (never Cyrillic labels)
  if (!isRu()) {
    return {
      title: book.titleEn,
      author: book.authorEn,
      genre: GENRE_EN[book.genre] || book.genre,
      genreRu: undefined,
    };
  }
  return {
    title: book.titleRu,
    author: book.authorRu,
    genre: book.genre,
    genreRu: book.genreRu,
  };
};

const shuffle = <T>(items: T[]): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const resolveAssetUri = (source: unknown): string | undefined => {
  try {
    const resolved = Image.resolveAssetSource(source as number);
    return resolved?.uri || undefined;
  } catch {
    return undefined;
  }
};

const DEFAULT_COVER_URI = resolveAssetUri(DEFAULT_COVER_SOURCE);

/** Bundled catalog cover URI (same asset for RU and EN). */
export const getCatalogCoverUri = (bookId: string): string | undefined => {
  const asset = CATALOG_COVER_ASSETS[bookId];
  if (!asset) return undefined;
  return resolveAssetUri(asset);
};

const GENRE_ALIASES: Record<string, CatalogGenre[]> = {
  fantasy: ['fantasy'],
  фэнтези: ['fantasy'],
  'science fiction': ['science_fiction'],
  'sci-fi': ['science_fiction'],
  фантастика: ['science_fiction'],
  'научная фантастика': ['science_fiction'],
  mystery: ['mystery', 'thriller'],
  детектив: ['mystery', 'thriller'],
  thriller: ['thriller', 'mystery'],
  триллер: ['thriller', 'mystery'],
  romance: ['romance'],
  романтика: ['romance'],
  любовный: ['romance'],
  horror: ['horror'],
  ужасы: ['horror'],
  мистика: ['horror'],
  classics: ['classics'],
  классика: ['classics'],
  fiction: ['fiction'],
  проза: ['fiction'],
  biography: ['biography', 'nonfiction'],
  биография: ['biography', 'nonfiction'],
  psychology: ['psychology', 'self-help'],
  психология: ['psychology', 'self-help'],
  'self-help': ['self-help', 'psychology'],
  саморазвитие: ['self-help', 'psychology'],
  adventure: ['adventure'],
  приключения: ['adventure'],
  historical: ['historical_fiction'],
  историческ: ['historical_fiction'],
  'young adult': ['young_adult'],
  молодёж: ['young_adult'],
  nonfiction: ['nonfiction', 'biography'],
  'нон-фикшн': ['nonfiction', 'biography'],
};

const mapUserGenre = (raw?: string): CatalogGenre[] => {
  if (!raw) return [];
  const key = raw.toLowerCase().trim();
  if (GENRE_ALIASES[key]) return GENRE_ALIASES[key];
  for (const [alias, genres] of Object.entries(GENRE_ALIASES)) {
    if (key.includes(alias)) return genres;
  }
  return [];
};

const extractPrefs = (userBooks: IBook[]) => {
  const authorScores = new Map<string, number>();
  const genreScores = new Map<CatalogGenre, number>();

  for (const book of userBooks) {
    const weight = typeof book.rating === 'number' && book.rating > 0 ? book.rating : book.votesCount ? 4 : 1;
    for (const author of book.authorsList || []) {
      const name = normalize(author);
      if (name.length < 2) continue;
      authorScores.set(name, (authorScores.get(name) || 0) + weight);
    }
    for (const g of mapUserGenre(book.categoryValue)) {
      genreScores.set(g, (genreScores.get(g) || 0) + weight);
    }
  }

  const topAuthors = [...authorScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name]) => name);

  const topGenres = [...genreScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);

  return { topAuthors, topGenres };
};

const scoreCatalogBook = (book: CatalogBook, topAuthors: string[], topGenres: CatalogGenre[]): number => {
  let score = 1;
  const authorRu = normalize(book.authorRu);
  const authorEn = normalize(book.authorEn);
  for (const author of topAuthors) {
    if (authorRu.includes(author) || authorEn.includes(author) || author.includes(authorRu) || author.includes(authorEn)) {
      score += 12;
      break;
    }
  }
  if (topGenres.includes(book.genre)) {
    score += 8 + (5 - topGenres.indexOf(book.genre));
  }
  if (book.genre === 'classics') score += 1;
  if (CATALOG_COVER_ASSETS[book.id]) score += 3;
  return score;
};

const toRecommended = (book: CatalogBook): IRecommendedBook => {
  const loc = localized(book);
  const coverUrl = getCatalogCoverUri(book.id) || DEFAULT_COVER_URI;
  return {
    id: book.id,
    title: loc.title,
    author: loc.author,
    pages: book.pages,
    coverUrl,
    coverUrlHQ: coverUrl,
    genre: loc.genre,
    genreRu: loc.genreRu,
  };
};

/** Match AI/API title to the same catalog entry (shared cover for RU/EN). */
export const matchCatalogRecommendation = (title: string, author: string = ''): IRecommendedBook | null => {
  const titleKey = normalize(title);
  const authorKey = normalize(author);
  if (!titleKey) return null;

  const found = POPULAR_BOOKS_CATALOG.find((book) => {
    if (!CATALOG_COVER_ASSETS[book.id]) return false;
    const titles = [normalize(book.titleRu), normalize(book.titleEn)];
    const titleHit = titles.includes(titleKey) || titles.some((t) => t.includes(titleKey) || titleKey.includes(t));
    if (!titleHit) return false;
    if (!authorKey) return true;
    const authors = [normalize(book.authorRu), normalize(book.authorEn)];
    return authors.some((a) => a.includes(authorKey) || authorKey.includes(a));
  });

  return found ? toRecommended(found) : null;
};

const pickFromCatalog = (userBooks: IBook[], excludeTitles: string[], limit: number): CatalogBook[] => {
  const excluded = new Set(excludeTitles.map(normalize).filter(Boolean));

  for (const userBook of userBooks) {
    const userTitle = normalize(userBook.title);
    if (userTitle) excluded.add(userTitle);
    for (const cat of POPULAR_BOOKS_CATALOG) {
      if (normalize(cat.titleRu) === userTitle || normalize(cat.titleEn) === userTitle) {
        excluded.add(normalize(cat.titleRu));
        excluded.add(normalize(cat.titleEn));
      }
    }
  }

  const { topAuthors, topGenres } = extractPrefs(userBooks);

  const candidates = POPULAR_BOOKS_CATALOG.filter((book) => {
    const titleRu = normalize(book.titleRu);
    const titleEn = normalize(book.titleEn);
    if (excluded.has(titleRu) || excluded.has(titleEn)) return false;
    return Boolean(CATALOG_COVER_ASSETS[book.id]);
  });

  const ranked = candidates
    .map((book) => ({ book, score: scoreCatalogBook(book, topAuthors, topGenres) }))
    .sort((a, b) => b.score - a.score || Math.random() - 0.5);

  const topSlice = ranked.filter((r) => r.score >= 8).map((r) => r.book);
  const rest = ranked.filter((r) => r.score < 8).map((r) => r.book);
  const mixed = [...shuffle(topSlice).slice(0, Math.ceil(limit * 0.7)), ...shuffle(rest)];

  const seen = new Set<string>();
  const result: CatalogBook[] = [];
  for (const book of mixed) {
    if (result.length >= limit) break;
    if (seen.has(book.id)) continue;
    seen.add(book.id);
    result.push(book);
  }
  return result;
};

export const fetchPersonalizedFromCatalog = async (userBooks: IBook[], excludeTitles: string[] = [], limit = TARGET): Promise<IRecommendedBook[]> => {
  console.warn(`Local catalog fallback (${Object.keys(CATALOG_COVER_ASSETS).length} covers, locale=${isRu() ? 'ru' : 'en'})`);
  return pickFromCatalog(userBooks, excludeTitles, limit).map(toRecommended);
};

export const fetchPopularFromCatalog = async (excludeTitles: string[] = [], limit = TARGET): Promise<IRecommendedBook[]> => {
  console.warn(`Local catalog fallback (${Object.keys(CATALOG_COVER_ASSETS).length} covers, locale=${isRu() ? 'ru' : 'en'})`);
  return pickFromCatalog([], excludeTitles, limit).map(toRecommended);
};

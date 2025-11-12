import * as SQLite from 'expo-sqlite';

import { ALL } from '~constants/boardType';
import { BookStatus, IBook, IBookNote, ICategory, IRating, IVote } from '~types/books';

const DB_NAME = 'bookdesk.db';

interface BoardData {
  boardType: BookStatus;
  data: IBook[];
  totalItems: number;
  hasNextPage: boolean;
  pageIndex: number;
  filterParams: string[];
  sortType: string;
  sortDirection: string;
  language: string;
  booksCountByYear?: any;
  timestamp: number;
}

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Инициализация базы данных
 */
export const initDatabase = async (): Promise<void> => {
  // Если уже инициализируется, ждем завершения
  if (initPromise) {
    return initPromise;
  }

  // Если уже инициализирована, возвращаемся
  if (db) {
    return;
  }

  // Создаем новый промис инициализации
  initPromise = (async () => {
    try {
      db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS board_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          board_type TEXT NOT NULL,
          page_index INTEGER NOT NULL,
          filter_params TEXT,
          sort_type TEXT,
          sort_direction TEXT,
          language TEXT,
          data TEXT NOT NULL,
          total_items INTEGER,
          has_next_page INTEGER,
          books_count_by_year TEXT,
          timestamp INTEGER NOT NULL,
          UNIQUE(board_type, page_index, filter_params, sort_type, sort_direction, language)
        );
        CREATE INDEX IF NOT EXISTS idx_board_type ON board_data(board_type);
        CREATE INDEX IF NOT EXISTS idx_timestamp ON board_data(timestamp);
        CREATE TABLE IF NOT EXISTS book_ratings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id TEXT NOT NULL UNIQUE,
          rating INTEGER NOT NULL,
          timestamp INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_book_ratings_book_id ON book_ratings(book_id);
        CREATE TABLE IF NOT EXISTS book_votes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id TEXT NOT NULL UNIQUE,
          votes_count INTEGER NOT NULL,
          timestamp INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_book_votes_book_id ON book_votes(book_id);
        CREATE TABLE IF NOT EXISTS user_votes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS book_dates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id TEXT NOT NULL UNIQUE,
          added INTEGER NOT NULL,
          book_status TEXT,
          timestamp INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_book_dates_book_id ON book_dates(book_id);
        CREATE TABLE IF NOT EXISTS book_notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id TEXT NOT NULL UNIQUE,
          comment TEXT NOT NULL,
          added INTEGER NOT NULL,
          timestamp INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_book_notes_book_id ON book_notes(book_id);
        CREATE TABLE IF NOT EXISTS goal_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_id TEXT NOT NULL UNIQUE,
          pages INTEGER NOT NULL,
          added_at INTEGER NOT NULL,
          timestamp INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_goal_items_item_id ON goal_items(item_id);
        CREATE INDEX IF NOT EXISTS idx_goal_items_added_at ON goal_items(added_at);
        CREATE TABLE IF NOT EXISTS user_goal (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          number_of_pages INTEGER,
          goal_type TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          UNIQUE(id)
        );
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          language TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          UNIQUE(language)
        );
        CREATE INDEX IF NOT EXISTS idx_categories_language ON categories(language);
      `);
      initPromise = null; // Сбрасываем промис после успешной инициализации
    } catch (error) {
      initPromise = null; // Сбрасываем промис при ошибке
      console.error('Error initializing database:', error);
      throw error;
    }
  })();

  return initPromise;
};

/**
 * Получение экземпляра базы данных с гарантией инициализации
 */
const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    await initDatabase();
  }
  if (!db) {
    throw new Error('Database initialization failed');
  }
  return db;
};

/**
 * Сохранение данных доски в базу данных
 */
export const saveBoardData = async (
  boardType: BookStatus,
  pageIndex: number,
  filterParams: string[],
  sortType: string,
  sortDirection: string,
  language: string,
  data: IBook[],
  totalItems: number,
  hasNextPage: boolean,
  booksCountByYear?: any,
): Promise<void> => {
  try {
    const database = await getDatabase();
    const filterParamsStr = JSON.stringify(filterParams);
    const dataStr = JSON.stringify(data);
    const booksCountByYearStr = booksCountByYear ? JSON.stringify(booksCountByYear) : null;
    const timestamp = Date.now();

    await database.runAsync(
      `INSERT OR REPLACE INTO board_data 
       (board_type, page_index, filter_params, sort_type, sort_direction, language, data, total_items, has_next_page, books_count_by_year, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        boardType,
        pageIndex,
        filterParamsStr,
        sortType,
        sortDirection,
        language,
        dataStr,
        totalItems,
        hasNextPage ? 1 : 0,
        booksCountByYearStr,
        timestamp,
      ],
    );

    // eslint-disable-next-line no-console
    console.log('💾 [SQLite Cache] Данные сохранены в локальную базу:');
    // eslint-disable-next-line no-console
    console.log(`   Доска: ${boardType}`);
    // eslint-disable-next-line no-console
    console.log(`   Количество книг: ${data.length}`);
    // eslint-disable-next-line no-console
    console.log(`   Всего элементов: ${totalItems}`);
    // eslint-disable-next-line no-console
    console.log(`   Страница: ${pageIndex}`);
    // eslint-disable-next-line no-console
    console.log(`   Фильтры: ${filterParams.length > 0 ? filterParams.join(', ') : 'нет'}`);
    // eslint-disable-next-line no-console
    console.log(`   Сортировка: ${sortType} (${sortDirection})`);
    // eslint-disable-next-line no-console
    console.log(`   Язык: ${language}`);
    // eslint-disable-next-line no-console
    console.log(`   Есть следующая страница: ${hasNextPage ? 'да' : 'нет'}`);
  } catch (error) {
    console.error('Error saving board data:', error);
    // Не пробрасываем ошибку дальше, чтобы не прерывать работу приложения
  }
};

/**
 * Загрузка данных доски из базы данных
 */
export const loadBoardData = async (
  boardType: BookStatus,
  pageIndex: number,
  filterParams: string[],
  sortType: string,
  sortDirection: string,
  language: string,
): Promise<BoardData | null> => {
  try {
    const database = await getDatabase();
    const filterParamsStr = JSON.stringify(filterParams);

    // Загружаем сохраненные даты и статусы заранее
    const datesMap = await loadBookDates();

    // Если это не доска ALL, собираем книги с нужным статусом из всех кэшей
    // Это нужно, чтобы книги, перемещенные на другую доску, появлялись на правильной доске
    // Теперь загружаем все страницы (page_index), так как мы больше не используем пагинацию
    if (boardType !== ALL) {
      // Получаем все записи с такими же параметрами фильтрации и сортировки, но для всех досок и всех страниц
      const allRecords = await database.getAllAsync<{
        board_type: string;
        page_index: number;
        filter_params: string;
        sort_type: string;
        sort_direction: string;
        language: string;
        data: string;
        total_items: number;
        has_next_page: number;
        books_count_by_year: string | null;
        timestamp: number;
      }>(
        `SELECT * FROM board_data 
         WHERE filter_params = ? 
         AND sort_type = ? AND sort_direction = ? AND language = ?
         ORDER BY page_index ASC`,
        [filterParamsStr, sortType, sortDirection, language],
      );

      if (allRecords.length > 0) {
        // Собираем все книги из всех записей
        const allBooks: IBook[] = [];
        let latestTimestamp = 0;
        let booksCountByYear: any = undefined;

        for (const record of allRecords) {
          const books = JSON.parse(record.data) as IBook[];
          allBooks.push(...books);
          if (record.timestamp > latestTimestamp) {
            latestTimestamp = record.timestamp;
            if (record.books_count_by_year) {
              booksCountByYear = JSON.parse(record.books_count_by_year);
            }
          }
        }

        // Применяем сохраненные статусы и даты
        let booksWithDates = applyBookDatesToData(allBooks, datesMap);

        // Фильтруем книги по статусу доски
        booksWithDates = booksWithDates.filter((book) => book.bookStatus === boardType);

        // Удаляем дубликаты по bookId
        const uniqueBooks = new Map<string, IBook>();
        for (const book of booksWithDates) {
          if (!uniqueBooks.has(book.bookId)) {
            uniqueBooks.set(book.bookId, book);
          }
        }
        const finalBooks = Array.from(uniqueBooks.values());

        // eslint-disable-next-line no-console
        console.log(`📖 [SQLite Cache] Загружены данные из локальной БД (собрано из всех досок):`);
        // eslint-disable-next-line no-console
        console.log(`   Доска: ${boardType}`);
        // eslint-disable-next-line no-console
        console.log(`   Количество книг после фильтрации: ${finalBooks.length}`);

        if (finalBooks.length > 0) {
          return {
            boardType,
            data: finalBooks,
            totalItems: finalBooks.length,
            hasNextPage: false, // Не знаем точно, но для первой страницы это нормально
            pageIndex,
            filterParams,
            sortType,
            sortDirection,
            language,
            booksCountByYear,
            timestamp: latestTimestamp,
          };
        }
      }
    }

    // Для доски ALL или если не нашли книги, загружаем стандартным способом
    // Загружаем все страницы, так как мы больше не используем пагинацию
    const allResults = await database.getAllAsync<{
      board_type: string;
      page_index: number;
      filter_params: string;
      sort_type: string;
      sort_direction: string;
      language: string;
      data: string;
      total_items: number;
      has_next_page: number;
      books_count_by_year: string | null;
      timestamp: number;
    }>(
      `SELECT * FROM board_data 
       WHERE board_type = ? AND filter_params = ? 
       AND sort_type = ? AND sort_direction = ? AND language = ?
       ORDER BY page_index ASC`,
      [boardType, filterParamsStr, sortType, sortDirection, language],
    );

    if (!allResults || allResults.length === 0) {
      return null;
    }

    // Собираем все книги из всех страниц
    const allBooks: IBook[] = [];
    let latestTimestamp = 0;
    let booksCountByYear: any = undefined;
    const filterParamsParsed = JSON.parse(allResults[0].filter_params) as string[];

    for (const result of allResults) {
      const parsedData = JSON.parse(result.data) as IBook[];
      allBooks.push(...parsedData);
      if (result.timestamp > latestTimestamp) {
        latestTimestamp = result.timestamp;
        if (result.books_count_by_year) {
          booksCountByYear = JSON.parse(result.books_count_by_year);
        }
      }
    }

    const cacheAge = Date.now() - latestTimestamp;
    const cacheAgeMinutes = Math.floor(cacheAge / 60000);
    const cacheAgeHours = Math.floor(cacheAgeMinutes / 60);
    const cacheAgeDays = Math.floor(cacheAgeHours / 24);

    let cacheAgeStr = '';
    if (cacheAgeDays > 0) {
      cacheAgeStr = `${cacheAgeDays} дн. ${cacheAgeHours % 24} ч.`;
    } else if (cacheAgeHours > 0) {
      cacheAgeStr = `${cacheAgeHours} ч. ${cacheAgeMinutes % 60} мин.`;
    } else if (cacheAgeMinutes > 0) {
      cacheAgeStr = `${cacheAgeMinutes} мин.`;
    } else {
      cacheAgeStr = `${Math.floor(cacheAge / 1000)} сек.`;
    }

    // eslint-disable-next-line no-console
    console.log('📦 [SQLite Cache] Данные загружены из локальной базы:');
    // eslint-disable-next-line no-console
    console.log(`   Доска: ${allResults[0].board_type}`);
    // eslint-disable-next-line no-console
    console.log(`   Количество книг (все страницы): ${allBooks.length}`);
    // eslint-disable-next-line no-console
    console.log(`   Количество страниц в кэше: ${allResults.length}`);
    // eslint-disable-next-line no-console
    console.log(`   Фильтры: ${filterParamsParsed.length > 0 ? filterParamsParsed.join(', ') : 'нет'}`);
    // eslint-disable-next-line no-console
    console.log(`   Сортировка: ${allResults[0].sort_type} (${allResults[0].sort_direction})`);
    // eslint-disable-next-line no-console
    console.log(`   Язык: ${allResults[0].language}`);
    // eslint-disable-next-line no-console
    console.log(`   Возраст кэша: ${cacheAgeStr}`);
    if (allBooks.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`   Первые 3 книги:`);
      allBooks.slice(0, 3).forEach((book, idx) => {
        // eslint-disable-next-line no-console
        console.log(`     ${idx + 1}. ${book.title} (${book.bookId})`);
      });
    }

    // Применяем сохраненные статусы и даты
    let booksWithDates = applyBookDatesToData(allBooks, datesMap);

    // Для доски ALL не фильтруем, для остальных фильтруем по статусу
    if (boardType !== ALL) {
      booksWithDates = booksWithDates.filter((book) => book.bookStatus === boardType);
      // eslint-disable-next-line no-console
      console.log(`   После фильтрации по статусу ${boardType}: ${booksWithDates.length} книг`);
    }

    return {
      boardType: allResults[0].board_type as BookStatus,
      data: booksWithDates,
      totalItems: booksWithDates.length,
      hasNextPage: false, // Больше не используем пагинацию
      pageIndex: 0,
      filterParams: filterParamsParsed,
      sortType: allResults[0].sort_type,
      sortDirection: allResults[0].sort_direction,
      language: allResults[0].language,
      booksCountByYear,
      timestamp: latestTimestamp,
    };
  } catch (error) {
    console.error('Error loading board data:', error);
    return null;
  }
};

/**
 * Загрузка всех данных для доски (все страницы)
 */
export const loadAllBoardData = async (
  boardType: BookStatus,
  filterParams: string[],
  sortType: string,
  sortDirection: string,
  language: string,
): Promise<BoardData[]> => {
  try {
    const database = await getDatabase();
    const filterParamsStr = JSON.stringify(filterParams);
    const results = await database.getAllAsync<{
      board_type: string;
      page_index: number;
      filter_params: string;
      sort_type: string;
      sort_direction: string;
      language: string;
      data: string;
      total_items: number;
      has_next_page: number;
      books_count_by_year: string | null;
      timestamp: number;
    }>(
      `SELECT * FROM board_data 
       WHERE board_type = ? AND filter_params = ? 
       AND sort_type = ? AND sort_direction = ? AND language = ?
       ORDER BY page_index ASC`,
      [boardType, filterParamsStr, sortType, sortDirection, language],
    );

    return results.map((result) => ({
      boardType: result.board_type as BookStatus,
      data: JSON.parse(result.data) as IBook[],
      totalItems: result.total_items,
      hasNextPage: result.has_next_page === 1,
      pageIndex: result.page_index,
      filterParams: JSON.parse(result.filter_params) as string[],
      sortType: result.sort_type,
      sortDirection: result.sort_direction,
      language: result.language,
      booksCountByYear: result.books_count_by_year ? JSON.parse(result.books_count_by_year) : undefined,
      timestamp: result.timestamp,
    }));
  } catch (error) {
    console.error('Error loading all board data:', error);
    return [];
  }
};

/**
 * Поиск книг в локальной БД
 */
export const searchBooksInCache = async (
  searchText: string,
  boardType: BookStatus,
  sortType: string,
  sortDirection: string,
  language: string,
): Promise<IBook[]> => {
  try {
    const database = await getDatabase();
    const datesMap = await loadBookDates();

    // Загружаем все книги из всех досок
    // Нужно загружать все книги, потому что статусы могут быть изменены и хранятся в book_dates
    const allBooks: IBook[] = [];
    const allResults = await database.getAllAsync<{
      board_type: string;
      data: string;
    }>(`SELECT DISTINCT board_type, data FROM board_data WHERE language = ?`, [language]);

    for (const result of allResults) {
      const books = JSON.parse(result.data) as IBook[];
      allBooks.push(...books);
    }

    // Применяем сохраненные статусы и даты
    let booksWithDates = applyBookDatesToData(allBooks, datesMap);

    // Фильтруем книги по статусу доски (если не ALL)
    if (boardType !== ALL) {
      booksWithDates = booksWithDates.filter((book) => book.bookStatus === boardType);
      // eslint-disable-next-line no-console
      console.log(`   После фильтрации по статусу ${boardType}: ${booksWithDates.length} книг`);
    }

    // Фильтруем по поисковому запросу (по title)
    if (searchText && searchText.trim().length > 0) {
      const searchLower = searchText.toLowerCase().trim();
      booksWithDates = booksWithDates.filter((book) => {
        const title = book.title?.toLowerCase() || '';
        return title.includes(searchLower);
      });
    }

    // Удаляем дубликаты по bookId
    const uniqueBooks = new Map<string, IBook>();
    for (const book of booksWithDates) {
      if (!uniqueBooks.has(book.bookId)) {
        uniqueBooks.set(book.bookId, book);
      }
    }
    const finalBooks = Array.from(uniqueBooks.values());

    // Применяем сортировку
    if (sortType && sortDirection) {
      finalBooks.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortType) {
          case 'title':
            aValue = a.title || '';
            bValue = b.title || '';
            break;
          case 'added':
            aValue = a.added || 0;
            bValue = b.added || 0;
            break;
          case 'votesCount':
            aValue = a.votesCount || 0;
            bValue = b.votesCount || 0;
            break;
          case 'pages':
            aValue = a.pages || 0;
            bValue = b.pages || 0;
            break;
          default:
            return 0;
        }

        if (sortDirection === 'asc' || sortDirection === '1') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }

    // eslint-disable-next-line no-console
    console.log(`🔍 [SQLite Cache] Поиск в локальной БД:`);
    // eslint-disable-next-line no-console
    console.log(`   Поисковый запрос: "${searchText}"`);
    // eslint-disable-next-line no-console
    console.log(`   Доска: ${boardType}`);
    // eslint-disable-next-line no-console
    console.log(`   Найдено книг: ${finalBooks.length}`);

    return finalBooks;
  } catch (error) {
    console.error('Error searching books in cache:', error);
    return [];
  }
};

/**
 * Очистка данных для конкретной доски
 */
export const clearBoardData = async (boardType: BookStatus): Promise<void> => {
  try {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM board_data WHERE board_type = ?`, [boardType]);
  } catch (error) {
    console.error('Error clearing board data:', error);
    throw error;
  }
};

/**
 * Очистка всех данных
 */
export const clearAllBoardData = async (): Promise<void> => {
  try {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM board_data`);
  } catch (error) {
    console.error('Error clearing all board data:', error);
    throw error;
  }
};

/**
 * Получение последнего timestamp для доски
 */
export const getLastTimestamp = async (
  boardType: BookStatus,
  filterParams: string[],
  sortType: string,
  sortDirection: string,
  language: string,
): Promise<number | null> => {
  try {
    const database = await getDatabase();
    const filterParamsStr = JSON.stringify(filterParams);
    const result = await database.getFirstAsync<{ timestamp: number }>(
      `SELECT MAX(timestamp) as timestamp FROM board_data 
       WHERE board_type = ? AND filter_params = ? 
       AND sort_type = ? AND sort_direction = ? AND language = ?`,
      [boardType, filterParamsStr, sortType, sortDirection, language],
    );

    return result?.timestamp || null;
  } catch (error) {
    console.error('Error getting last timestamp:', error);
    return null;
  }
};

/**
 * Обновление книги во всех записях кэша
 */
export const updateBookInCache = async (bookId: string, updates: Partial<IBook>): Promise<void> => {
  try {
    const database = await getDatabase();

    // Получаем все записи, содержащие эту книгу
    const allRecords = await database.getAllAsync<{
      id: number;
      board_type: string;
      page_index: number;
      filter_params: string;
      sort_type: string;
      sort_direction: string;
      language: string;
      data: string;
      total_items: number;
      has_next_page: number;
      books_count_by_year: string | null;
      timestamp: number;
    }>(`SELECT * FROM board_data`);

    let updatedCount = 0;

    for (const record of allRecords) {
      const books = JSON.parse(record.data) as IBook[];
      const bookIndex = books.findIndex((book) => book.bookId === bookId);

      if (bookIndex !== -1) {
        // Обновляем книгу
        books[bookIndex] = { ...books[bookIndex], ...updates };
        const updatedData = JSON.stringify(books);

        // Обновляем запись в БД
        await database.runAsync(`UPDATE board_data SET data = ?, timestamp = ? WHERE id = ?`, [updatedData, Date.now(), record.id]);

        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      // eslint-disable-next-line no-console
      console.log(`🔄 [SQLite Cache] Книга обновлена в кэше:`);
      // eslint-disable-next-line no-console
      console.log(`   bookId: ${bookId}`);
      // eslint-disable-next-line no-console
      console.log(`   Обновлено записей: ${updatedCount}`);
      // eslint-disable-next-line no-console
      console.log(`   Изменения:`, updates);
    }
  } catch (error) {
    console.error('Error updating book in cache:', error);
    throw error;
  }
};

/**
 * Добавление новой книги в кэш доски (во все записи board_data для указанной доски)
 */
export const addBookToCache = async (boardType: BookStatus, newBook: IBook): Promise<void> => {
  try {
    const database = await getDatabase();
    // Берём все записи, относящиеся к этой доске
    const records = await database.getAllAsync<{
      id: number;
      board_type: string;
      page_index: number;
      filter_params: string;
      sort_type: string;
      sort_direction: string;
      language: string;
      data: string;
      total_items: number;
      has_next_page: number;
      books_count_by_year: string | null;
      timestamp: number;
    }>(`SELECT * FROM board_data WHERE board_type = ?`, [boardType]);

    // Если записей нет, просто выходим — список будет пересохранён при следующей загрузке
    if (!records || records.length === 0) {
      // eslint-disable-next-line no-console
      console.log(`ℹ️ [SQLite Cache] Нет существующих записей board_data для доски ${boardType}; пропускаю addBookToCache`);
      return;
    }

    const now = Date.now();
    for (const record of records) {
      const books = JSON.parse(record.data) as IBook[];
      const exists = books.some((b) => b.bookId === newBook.bookId);
      if (!exists) {
        const updatedBooks = [newBook, ...books];
        const updatedData = JSON.stringify(updatedBooks);
        await database.runAsync(`UPDATE board_data SET data = ?, total_items = ?, timestamp = ? WHERE id = ?`, [
          updatedData,
          (record.total_items || 0) + 1,
          now,
          record.id,
        ]);
      }
    }

    // eslint-disable-next-line no-console
    console.log(`➕ [SQLite Cache] Книга добавлена в кэш доски ${boardType}: ${newBook.bookId}`);
  } catch (error) {
    console.error('Error adding book to cache:', error);
  }
};

/**
 * Обновление votesCount для книги во всех записях кэша
 */
export const updateBookVotesInCache = async (bookId: string, votesCount: number): Promise<void> => {
  await updateBookInCache(bookId, { votesCount });
  // eslint-disable-next-line no-console
  console.log(`👍 [SQLite Cache] Обновлен votesCount для книги ${bookId}: ${votesCount}`);
};

/**
 * Обновление статуса и даты книги во всех записях кэша
 */
export const updateBookStatusInCache = async (bookId: string, bookStatus: BookStatus, added: number): Promise<void> => {
  await updateBookInCache(bookId, { bookStatus, added });
  await saveBookDate(bookId, added, bookStatus);
  // eslint-disable-next-line no-console
  console.log(`📝 [SQLite Cache] Обновлен статус книги ${bookId}: ${bookStatus}, дата: ${new Date(added).toLocaleDateString()}`);
  // eslint-disable-next-line no-console
  console.log(`   Статус и дата сохранены в таблицу book_dates`);
};

/**
 * Удаление книги из всех записей кэша
 */
export const removeBookFromCache = async (bookId: string): Promise<void> => {
  try {
    const database = await getDatabase();

    // Получаем все записи, содержащие эту книгу
    const allRecords = await database.getAllAsync<{
      id: number;
      board_type: string;
      page_index: number;
      filter_params: string;
      sort_type: string;
      sort_direction: string;
      language: string;
      data: string;
      total_items: number;
      has_next_page: number;
      books_count_by_year: string | null;
      timestamp: number;
    }>(`SELECT * FROM board_data`);

    let removedCount = 0;

    for (const record of allRecords) {
      const books = JSON.parse(record.data) as IBook[];
      const bookIndex = books.findIndex((book) => book.bookId === bookId);

      if (bookIndex !== -1) {
        // Удаляем книгу из массива
        books.splice(bookIndex, 1);
        const updatedData = JSON.stringify(books);

        // Обновляем запись в БД
        await database.runAsync(`UPDATE board_data SET data = ?, total_items = ?, timestamp = ? WHERE id = ?`, [
          updatedData,
          Math.max(0, (record.total_items || 0) - 1),
          Date.now(),
          record.id,
        ]);

        removedCount++;
      }
    }

    // Удаляем связанные данные (дата, рейтинг, заметки)
    try {
      await database.runAsync(`DELETE FROM book_dates WHERE book_id = ?`, [bookId]);
      await database.runAsync(`DELETE FROM book_ratings WHERE book_id = ?`, [bookId]);
      await database.runAsync(`DELETE FROM book_notes WHERE book_id = ?`, [bookId]);
    } catch (e) {
      console.error('Error deleting related book data:', e);
    }

    if (removedCount > 0) {
      // eslint-disable-next-line no-console
      console.log(`🗑️ [SQLite Cache] Книга удалена из кэша:`);
      // eslint-disable-next-line no-console
      console.log(`   bookId: ${bookId}`);
      // eslint-disable-next-line no-console
      console.log(`   Удалено из записей: ${removedCount}`);
    }
  } catch (error) {
    console.error('Error removing book from cache:', error);
    throw error;
  }
};

/**
 * Сохранение даты книги в локальную БД
 */
export const saveBookDate = async (bookId: string, added: number, bookStatus?: BookStatus | null): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    await database.runAsync(`INSERT OR REPLACE INTO book_dates (book_id, added, book_status, timestamp) VALUES (?, ?, ?, ?)`, [
      bookId,
      added,
      bookStatus || null,
      timestamp,
    ]);

    // eslint-disable-next-line no-console
    console.log(`📅 [SQLite Cache] Дата сохранена: bookId=${bookId}, added=${new Date(added).toLocaleDateString()}, status=${bookStatus || 'null'}`);
  } catch (error) {
    console.error('Error saving book date:', error);
    throw error;
  }
};

/**
 * Сохранение статуса книги в локальную БД (без изменения даты)
 */
export const saveBookStatus = async (bookId: string, bookStatus: BookStatus | null, added?: number): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    // Получаем текущую дату, если она не передана
    let currentAdded = added;
    if (!currentAdded) {
      const existingDate = await database.getFirstAsync<{ added: number }>(`SELECT added FROM book_dates WHERE book_id = ?`, [bookId]);
      currentAdded = existingDate?.added || Date.now();
    }

    await database.runAsync(`INSERT OR REPLACE INTO book_dates (book_id, added, book_status, timestamp) VALUES (?, ?, ?, ?)`, [
      bookId,
      currentAdded,
      bookStatus || null,
      timestamp,
    ]);

    // eslint-disable-next-line no-console
    console.log(
      `📝 [SQLite Cache] Статус сохранен: bookId=${bookId}, status=${bookStatus || 'null'}, added=${new Date(currentAdded).toLocaleDateString()}`,
    );
  } catch (error) {
    console.error('Error saving book status:', error);
    throw error;
  }
};

/**
 * Загрузка всех дат книг из локальной БД
 */
export const loadBookDates = async (): Promise<Map<string, { added: number; bookStatus: BookStatus | null }>> => {
  try {
    const database = await getDatabase();
    const results = await database.getAllAsync<{
      book_id: string;
      added: number;
      book_status: string | null;
      timestamp: number;
    }>(`SELECT book_id, added, book_status, timestamp FROM book_dates ORDER BY timestamp DESC`);

    const datesMap = new Map<string, { added: number; bookStatus: BookStatus | null }>();
    results.forEach((result) => {
      datesMap.set(result.book_id, {
        added: result.added,
        bookStatus: (result.book_status as BookStatus) || null,
      });
    });

    // eslint-disable-next-line no-console
    console.log(`📅 [SQLite Cache] Загружено дат и статусов из локальной БД: ${datesMap.size} записей`);
    if (datesMap.size > 0) {
      const firstFive = Array.from(datesMap.entries()).slice(0, 5);
      // eslint-disable-next-line no-console
      console.log(
        `   Первые 5 записей:`,
        firstFive
          .map(([bookId, data]) => `${bookId}: дата=${new Date(data.added).toLocaleDateString()}, статус=${data.bookStatus || 'null'}`)
          .join(', '),
      );
    }

    return datesMap;
  } catch (error) {
    console.error('Error loading book dates:', error);
    return new Map();
  }
};

/**
 * Применение сохраненных дат к книгам в данных доски
 */
export const applyBookDatesToData = (books: IBook[], datesMap: Map<string, { added: number; bookStatus: BookStatus | null }>): IBook[] => {
  return books.map((book) => {
    const dateData = datesMap.get(book.bookId);
    if (dateData) {
      return {
        ...book,
        added: dateData.added,
        bookStatus: dateData.bookStatus !== null ? dateData.bookStatus : book.bookStatus,
      };
    }
    return book;
  });
};

/**
 * Обновление даты добавления книги во всех записях кэша
 */
export const updateBookDateInCache = async (bookId: string, added: number, bookStatus?: BookStatus | null): Promise<void> => {
  await updateBookInCache(bookId, { added });
  await saveBookDate(bookId, added, bookStatus);
  // eslint-disable-next-line no-console
  console.log(`📅 [SQLite Cache] Обновлена дата для книги ${bookId}: ${new Date(added).toLocaleDateString()}`);
};

/**
 * Сохранение рейтинга книги в локальную БД
 */
export const saveBookRating = async (bookId: string, rating: number): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    await database.runAsync(`INSERT OR REPLACE INTO book_ratings (book_id, rating, timestamp) VALUES (?, ?, ?)`, [bookId, rating, timestamp]);

    // eslint-disable-next-line no-console
    console.log(`⭐ [SQLite Cache] Рейтинг сохранен: bookId=${bookId}, rating=${rating}`);
  } catch (error) {
    console.error('Error saving book rating:', error);
    throw error;
  }
};

/**
 * Загрузка всех рейтингов из локальной БД
 */
export const loadBookRatings = async (): Promise<IRating[]> => {
  try {
    const database = await getDatabase();
    const results = await database.getAllAsync<{
      book_id: string;
      rating: number;
      timestamp: number;
    }>(`SELECT book_id, rating, timestamp FROM book_ratings ORDER BY timestamp DESC`);

    const ratings: IRating[] = results.map((result) => ({
      bookId: result.book_id,
      rating: result.rating,
    }));

    // eslint-disable-next-line no-console
    console.log(`📖 [SQLite Cache] Загружено рейтингов из локальной БД: ${ratings.length}`);
    if (ratings.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `   Первые 5 рейтингов:`,
        ratings
          .slice(0, 5)
          .map((r) => `${r.bookId}:${r.rating}`)
          .join(', '),
      );
    }

    return ratings;
  } catch (error) {
    console.error('Error loading book ratings:', error);
    return [];
  }
};

/**
 * Удаление рейтинга книги из локальной БД
 */
export const deleteBookRating = async (bookId: string): Promise<void> => {
  try {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM book_ratings WHERE book_id = ?`, [bookId]);
    // eslint-disable-next-line no-console
    console.log(`🗑️ [SQLite Cache] Рейтинг удален: bookId=${bookId}`);
  } catch (error) {
    console.error('Error deleting book rating:', error);
    throw error;
  }
};

/**
 * Сохранение количества лайков для книги в локальную БД
 */
export const saveBookVotesCount = async (bookId: string, votesCount: number): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    await database.runAsync(`INSERT OR REPLACE INTO book_votes (book_id, votes_count, timestamp) VALUES (?, ?, ?)`, [bookId, votesCount, timestamp]);

    // eslint-disable-next-line no-console
    console.log(`👍 [SQLite Cache] Лайки сохранены: bookId=${bookId}, votesCount=${votesCount}`);
  } catch (error) {
    console.error('Error saving book votes count:', error);
    throw error;
  }
};

/**
 * Сохранение массива userVotes (лайки пользователя) в локальную БД
 */
export const saveUserVotes = async (userVotes: IVote[]): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();
    const dataStr = JSON.stringify(userVotes);

    // Удаляем старые данные и вставляем новые (таблица хранит только одну запись)
    await database.runAsync(`DELETE FROM user_votes`);
    await database.runAsync(`INSERT INTO user_votes (data, timestamp) VALUES (?, ?)`, [dataStr, timestamp]);

    // eslint-disable-next-line no-console
    console.log(`👍 [SQLite Cache] UserVotes сохранены: ${userVotes.length} записей`);
  } catch (error) {
    console.error('Error saving user votes:', error);
    throw error;
  }
};

/**
 * Загрузка массива userVotes (лайки пользователя) из локальной БД
 */
export const loadUserVotes = async (): Promise<IVote[]> => {
  try {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{
      data: string;
      timestamp: number;
    }>(`SELECT data, timestamp FROM user_votes ORDER BY timestamp DESC LIMIT 1`);

    if (!result) {
      return [];
    }

    const userVotes: IVote[] = JSON.parse(result.data);

    // eslint-disable-next-line no-console
    console.log(`👍 [SQLite Cache] Загружено userVotes из локальной БД: ${userVotes.length} записей`);
    if (userVotes.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `   Первые 5 лайков:`,
        userVotes
          .slice(0, 5)
          .map((v) => `${v.bookId}:${v.count}`)
          .join(', '),
      );
    }

    return userVotes;
  } catch (error) {
    console.error('Error loading user votes:', error);
    return [];
  }
};

/**
 * Сохранение заметки к книге в локальную БД
 */
export const saveBookNote = async (bookId: string, comment: string, added: number): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    await database.runAsync(`INSERT OR REPLACE INTO book_notes (book_id, comment, added, timestamp) VALUES (?, ?, ?, ?)`, [
      bookId,
      comment,
      added,
      timestamp,
    ]);

    // eslint-disable-next-line no-console
    console.log(
      `📝 [SQLite Cache] Заметка сохранена: bookId=${bookId}, comment=${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}, added=${new Date(added).toLocaleDateString()}`,
    );
  } catch (error) {
    console.error('Error saving book note:', error);
    throw error;
  }
};

/**
 * Загрузка всех заметок из локальной БД
 */
export const loadBookNotes = async (): Promise<IBookNote[]> => {
  try {
    const database = await getDatabase();
    const results = await database.getAllAsync<{
      book_id: string;
      comment: string;
      added: number;
      timestamp: number;
    }>(`SELECT book_id, comment, added, timestamp FROM book_notes ORDER BY timestamp DESC`);

    const notes: IBookNote[] = results.map((result) => ({
      bookId: result.book_id,
      comment: result.comment,
      added: result.added,
    }));

    // eslint-disable-next-line no-console
    console.log(`📝 [SQLite Cache] Загружено заметок из локальной БД: ${notes.length}`);
    if (notes.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `   Первые 5 заметок:`,
        notes
          .slice(0, 5)
          .map((n) => `${n.bookId}:${n.comment.substring(0, 30)}${n.comment.length > 30 ? '...' : ''}`)
          .join(', '),
      );
    }

    return notes;
  } catch (error) {
    console.error('Error loading book notes:', error);
    return [];
  }
};

/**
 * Удаление заметки книги из локальной БД
 */
export const deleteBookNote = async (bookId: string): Promise<void> => {
  try {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM book_notes WHERE book_id = ?`, [bookId]);
    // eslint-disable-next-line no-console
    console.log(`🗑️ [SQLite Cache] Заметка удалена: bookId=${bookId}`);
  } catch (error) {
    console.error('Error deleting book note:', error);
    throw error;
  }
};

/**
 * Сохранение goal item в локальную БД
 */
export const saveGoalItem = async (itemId: string, pages: number, addedAt: number): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    await database.runAsync(`INSERT OR REPLACE INTO goal_items (item_id, pages, added_at, timestamp) VALUES (?, ?, ?, ?)`, [
      itemId,
      pages,
      addedAt,
      timestamp,
    ]);

    // eslint-disable-next-line no-console
    console.log(`📊 [SQLite Cache] Goal item сохранен: itemId=${itemId}, pages=${pages}, addedAt=${new Date(addedAt).toLocaleDateString()}`);
  } catch (error) {
    console.error('Error saving goal item:', error);
    throw error;
  }
};

/**
 * Сохранение массива goal items в локальную БД (для первого запуска)
 */
export const saveGoalItems = async (items: Array<{ _id: string; pages: number; added_at: number }>): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    // Используем транзакцию для быстрой вставки
    await database.withTransactionAsync(async () => {
      for (const item of items) {
        await database.runAsync(`INSERT OR REPLACE INTO goal_items (item_id, pages, added_at, timestamp) VALUES (?, ?, ?, ?)`, [
          item._id,
          item.pages,
          item.added_at,
          timestamp,
        ]);
      }
    });

    // eslint-disable-next-line no-console
    console.log(`📊 [SQLite Cache] Сохранено goal items: ${items.length}`);
  } catch (error) {
    console.error('Error saving goal items:', error);
    throw error;
  }
};

/**
 * Загрузка всех goal items из локальной БД
 */
export const loadGoalItems = async (): Promise<Array<{ _id: string; pages: number; added_at: number }>> => {
  try {
    const database = await getDatabase();
    const results = await database.getAllAsync<{
      item_id: string;
      pages: number;
      added_at: number;
      timestamp: number;
    }>(`SELECT item_id, pages, added_at, timestamp FROM goal_items ORDER BY added_at DESC`);

    const items = results.map((result) => ({
      _id: result.item_id,
      pages: result.pages,
      added_at: result.added_at,
    }));

    // eslint-disable-next-line no-console
    console.log(`📊 [SQLite Cache] Загружено goal items из локальной БД: ${items.length}`);
    if (items.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `   Первые 5 items:`,
        items
          .slice(0, 5)
          .map((i) => `${i._id}:${i.pages} pages (${new Date(i.added_at).toLocaleDateString()})`)
          .join(', '),
      );
    }

    return items;
  } catch (error) {
    console.error('Error loading goal items:', error);
    return [];
  }
};

/**
 * Удаление goal item из локальной БД
 */
export const deleteGoalItem = async (itemId: string): Promise<void> => {
  try {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM goal_items WHERE item_id = ?`, [itemId]);
    // eslint-disable-next-line no-console
    console.log(`🗑️ [SQLite Cache] Goal item удален: itemId=${itemId}`);
  } catch (error) {
    console.error('Error deleting goal item:', error);
    throw error;
  }
};

/**
 * Сохранение цели пользователя в локальную БД
 */
export const saveGoal = async (numberOfPages: number | null, goalType: string): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    // Удаляем старую цель (если есть) и вставляем новую
    await database.runAsync(`DELETE FROM user_goal`);
    await database.runAsync(`INSERT INTO user_goal (number_of_pages, goal_type, timestamp) VALUES (?, ?, ?)`, [numberOfPages, goalType, timestamp]);

    // eslint-disable-next-line no-console
    console.log(`🎯 [SQLite Cache] Цель сохранена: numberOfPages=${numberOfPages}, type=${goalType}`);
  } catch (error) {
    console.error('Error saving goal:', error);
    throw error;
  }
};

/**
 * Загрузка цели пользователя из локальной БД
 */
export const loadGoal = async (): Promise<{ numberOfPages: number | null; goalType: string } | null> => {
  try {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{
      number_of_pages: number | null;
      goal_type: string;
      timestamp: number;
    }>(`SELECT number_of_pages, goal_type, timestamp FROM user_goal LIMIT 1`);

    if (!result) {
      return null;
    }

    // eslint-disable-next-line no-console
    console.log(`🎯 [SQLite Cache] Загружена цель из локальной БД: numberOfPages=${result.number_of_pages}, type=${result.goal_type}`);

    return {
      numberOfPages: result.number_of_pages,
      goalType: result.goal_type,
    };
  } catch (error) {
    console.error('Error loading goal:', error);
    return null;
  }
};

/**
 * Удаление цели пользователя из локальной БД
 */
export const deleteGoal = async (): Promise<void> => {
  try {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM user_goal`);
    // eslint-disable-next-line no-console
    console.log(`🗑️ [SQLite Cache] Цель удалена из локальной БД`);
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};

/**
 * Группировка книг со статусом COMPLETED по годам и месяцам для статистики
 */
export const getBooksByYear = async (): Promise<{
  items: Array<{ year: number; month: number; count: number }>;
  booksReadPerMonth: number;
  booksReadPerYear: number;
}> => {
  try {
    const database = await getDatabase();
    const results = await database.getAllAsync<{
      book_id: string;
      added: number;
      book_status: string | null;
      timestamp: number;
    }>(`SELECT book_id, added, book_status, timestamp FROM book_dates WHERE book_status = ? ORDER BY added ASC`, ['completed']);

    // Группируем по годам и месяцам
    const groupedByYearMonth: Record<string, number> = {};
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    results.forEach((result) => {
      const date = new Date(result.added);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!groupedByYearMonth[key]) {
        groupedByYearMonth[key] = 0;
      }
      groupedByYearMonth[key] += 1; // Каждая книга = 1
    });

    // Преобразуем в формат для generateBarChartData
    const items = Object.entries(groupedByYearMonth).map(([key, count]) => {
      const [year, month] = key.split('-').map(Number);
      return { year, month, count };
    });

    // Вычисляем booksReadPerMonth (текущий месяц)
    const currentMonthKey = `${currentYear}-${currentMonth}`;
    const booksReadPerMonth = groupedByYearMonth[currentMonthKey] || 0;

    // Вычисляем booksReadPerYear (текущий год)
    const booksReadPerYear = Object.entries(groupedByYearMonth)
      .filter(([key]) => key.startsWith(`${currentYear}-`))
      .reduce((sum, [, count]) => sum + count, 0);

    // eslint-disable-next-line no-console
    console.log(`📚 [getBooksByYear] Сгруппировано по годам/месяцам: ${items.length} записей, всего книг: ${results.length}`);

    return {
      items,
      booksReadPerMonth,
      booksReadPerYear,
    };
  } catch (error) {
    console.error('Error grouping books by year:', error);
    return {
      items: [],
      booksReadPerMonth: 0,
      booksReadPerYear: 0,
    };
  }
};

/**
 * Группировка goal items по годам и месяцам для статистики
 */
export const getGoalItemsByYear = async (): Promise<{
  items: Array<{ year: number; month: number; count: number }>;
  pagesReadPerMonth: number;
  pagesReadPerYear: number;
}> => {
  try {
    const allItems = await loadGoalItems();

    // Группируем по годам и месяцам
    const groupedByYearMonth: Record<string, number> = {};
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    allItems.forEach((item) => {
      const date = new Date(item.added_at);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!groupedByYearMonth[key]) {
        groupedByYearMonth[key] = 0;
      }
      groupedByYearMonth[key] += item.pages;
    });

    // Преобразуем в формат для generateBarChartData
    const items = Object.entries(groupedByYearMonth).map(([key, count]) => {
      const [year, month] = key.split('-').map(Number);
      return { year, month, count };
    });

    // Вычисляем pagesReadPerMonth (текущий месяц)
    const currentMonthKey = `${currentYear}-${currentMonth}`;
    const pagesReadPerMonth = groupedByYearMonth[currentMonthKey] || 0;

    // Вычисляем pagesReadPerYear (текущий год)
    const pagesReadPerYear = Object.entries(groupedByYearMonth)
      .filter(([key]) => key.startsWith(`${currentYear}-`))
      .reduce((sum, [, count]) => sum + count, 0);

    // eslint-disable-next-line no-console
    console.log(`📊 [getGoalItemsByYear] Сгруппировано по годам/месяцам: ${items.length} записей`);

    return {
      items,
      pagesReadPerMonth,
      pagesReadPerYear,
    };
  } catch (error) {
    console.error('Error grouping goal items by year:', error);
    return {
      items: [],
      pagesReadPerMonth: 0,
      pagesReadPerYear: 0,
    };
  }
};

/**
 * Сохранение категорий в локальную БД
 */
export const saveCategories = async (categories: ICategory[], language: string): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();
    const dataStr = JSON.stringify(categories);

    await database.runAsync(`INSERT OR REPLACE INTO categories (language, data, timestamp) VALUES (?, ?, ?)`, [language, dataStr, timestamp]);

    // eslint-disable-next-line no-console
    console.log(`📂 [SQLite Cache] Категории сохранены: language=${language}, количество=${categories.length}`);
  } catch (error) {
    console.error('Error saving categories:', error);
    throw error;
  }
};

/**
 * Загрузка категорий из локальной БД
 */
export const loadCategories = async (language: string): Promise<ICategory[]> => {
  try {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{
      language: string;
      data: string;
      timestamp: number;
    }>(`SELECT language, data, timestamp FROM categories WHERE language = ?`, [language]);

    if (!result) {
      return [];
    }

    const categories: ICategory[] = JSON.parse(result.data);

    // eslint-disable-next-line no-console
    console.log(`📂 [SQLite Cache] Загружено категорий из локальной БД: ${categories.length} для языка ${language}`);
    if (categories.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `   Первые 5 категорий:`,
        categories
          .slice(0, 5)
          .map((c) => `${c.path}:${c.value}`)
          .join(', '),
      );
    }

    return categories;
  } catch (error) {
    console.error('Error loading categories:', error);
    return [];
  }
};

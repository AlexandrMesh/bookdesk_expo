import * as SQLite from 'expo-sqlite';

import { BookStatus, IBook } from '~types/books';

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
 * Получение ключа для кэша на основе параметров
 */
const getCacheKey = (
  boardType: BookStatus,
  pageIndex: number,
  filterParams: string[],
  sortType: string,
  sortDirection: string,
  language: string,
): string => {
  const filterKey = filterParams.sort().join(',');
  return `${boardType}_${pageIndex}_${filterKey}_${sortType}_${sortDirection}_${language}`;
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
    const result = await database.getFirstAsync<{
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
       WHERE board_type = ? AND page_index = ? AND filter_params = ? 
       AND sort_type = ? AND sort_direction = ? AND language = ?`,
      [boardType, pageIndex, filterParamsStr, sortType, sortDirection, language],
    );

    if (!result) {
      return null;
    }

    const parsedData = JSON.parse(result.data) as IBook[];
    const filterParamsParsed = JSON.parse(result.filter_params) as string[];
    const cacheAge = Date.now() - result.timestamp;
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
    console.log(`   Доска: ${result.board_type}`);
    // eslint-disable-next-line no-console
    console.log(`   Количество книг: ${parsedData.length}`);
    // eslint-disable-next-line no-console
    console.log(`   Всего элементов: ${result.total_items}`);
    // eslint-disable-next-line no-console
    console.log(`   Страница: ${result.page_index}`);
    // eslint-disable-next-line no-console
    console.log(`   Фильтры: ${filterParamsParsed.length > 0 ? filterParamsParsed.join(', ') : 'нет'}`);
    // eslint-disable-next-line no-console
    console.log(`   Сортировка: ${result.sort_type} (${result.sort_direction})`);
    // eslint-disable-next-line no-console
    console.log(`   Язык: ${result.language}`);
    // eslint-disable-next-line no-console
    console.log(`   Есть следующая страница: ${result.has_next_page === 1 ? 'да' : 'нет'}`);
    // eslint-disable-next-line no-console
    console.log(`   Возраст кэша: ${cacheAgeStr}`);
    if (parsedData.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`   Первые 3 книги:`);
      parsedData.slice(0, 3).forEach((book, idx) => {
        // eslint-disable-next-line no-console
        console.log(`     ${idx + 1}. ${book.title} (${book.bookId})`);
      });
    }

    return {
      boardType: result.board_type as BookStatus,
      data: parsedData,
      totalItems: result.total_items,
      hasNextPage: result.has_next_page === 1,
      pageIndex: result.page_index,
      filterParams: filterParamsParsed,
      sortType: result.sort_type,
      sortDirection: result.sort_direction,
      language: result.language,
      booksCountByYear: result.books_count_by_year ? JSON.parse(result.books_count_by_year) : undefined,
      timestamp: result.timestamp,
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


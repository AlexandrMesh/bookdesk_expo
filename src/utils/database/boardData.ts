import { ALL } from '~constants/boardType';
import { BookStatus, IBook } from '~types/books';

import { getDatabase } from './database';
import { BoardData } from './types';

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

    // Используем фиксированное значение 'all' для языка, чтобы данные были одинаковыми для всех языков
    const universalLanguage = 'all';

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
        universalLanguage,
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
    console.log(`   Фильтры: ${filterParams && filterParams.length > 0 ? filterParams.join(', ') : 'нет'}`);
    // eslint-disable-next-line no-console
    console.log(`   Сортировка: ${sortType} (${sortDirection})`);
    // eslint-disable-next-line no-console
    console.log(`   Язык: ${universalLanguage} (универсальный для всех языков)`);
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

    // Загружаем сохраненные даты и статусы заранее (динамический импорт для избежания циклической зависимости)
    const { loadBookDates, applyBookDatesToData } = await import('./bookDates');
    const datesMap = await loadBookDates();

    // Загружаем ВСЕ записи для доски независимо от фильтров и сортировки
    // Это важно для новых пользователей, у которых книги могут быть сохранены с разными параметрами
    // Затем применяем фильтры и сортировку к результату
    if (boardType !== ALL) {
      // Получаем все записи для этой доски (независимо от фильтров и сортировки)
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
         WHERE board_type = ?
         ORDER BY page_index ASC, timestamp DESC`,
        [boardType],
      );

      if (allRecords.length > 0) {
        // Собираем все книги из всех записей
        // Предпочитаем данные с языком 'all' (универсальные), если они есть
        const allBooks: IBook[] = [];
        let latestTimestamp = 0;
        let booksCountByYear: any = undefined;

        // Сначала собираем данные с языком 'all', затем остальные
        const recordsWithAll = allRecords.filter((r) => r.language === 'all');
        const recordsOther = allRecords.filter((r) => r.language !== 'all');
        const sortedRecords = [...recordsWithAll, ...recordsOther];

        for (const record of sortedRecords) {
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
        let finalBooks = Array.from(uniqueBooks.values());

        // Применяем фильтры по категориям (если указаны)
        if (filterParams && filterParams.length > 0) {
          finalBooks = finalBooks.filter((book) => {
            const bookCategoryPath = book.categoryPath || '';
            return filterParams.some((filterPath) => bookCategoryPath.startsWith(filterPath));
          });
        }

        // Применяем сортировку (если указана)
        if (sortType && sortDirection) {
          finalBooks.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortType) {
              case 'title':
                aValue = (a.title || '').toLowerCase();
                bValue = (b.title || '').toLowerCase();
                break;
              case 'added':
                aValue = a.added || 0;
                bValue = b.added || 0;
                break;
              case 'pages':
                aValue = a.pages || 0;
                bValue = b.pages || 0;
                break;
              default:
                return 0;
            }

            if (sortDirection === 'asc') {
              return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
              return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
          });
        }

        // eslint-disable-next-line no-console
        console.log(`📖 [SQLite Cache] Загружены данные из локальной БД (собрано из всех записей доски):`);
        // eslint-disable-next-line no-console
        console.log(`   Доска: ${boardType}`);
        // eslint-disable-next-line no-console
        console.log(`   Всего записей в board_data: ${allRecords.length}`);
        // eslint-disable-next-line no-console
        console.log(`   Книг до фильтрации: ${booksWithDates.length}`);
        // eslint-disable-next-line no-console
        console.log(`   Книг после фильтрации по статусу: ${Array.from(uniqueBooks.values()).length}`);
        // eslint-disable-next-line no-console
        console.log(`   Книг после применения фильтров и сортировки: ${finalBooks.length}`);

        if (finalBooks.length > 0) {
          return {
            boardType,
            data: finalBooks,
            totalItems: finalBooks.length,
            hasNextPage: false,
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
    // Загружаем все записи для доски независимо от фильтров и сортировки
    // Не фильтруем по языку - данные одинаковые для всех языков
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
       WHERE board_type = ?
       ORDER BY page_index ASC, timestamp DESC`,
      [boardType],
    );

    if (!allResults || allResults.length === 0) {
      return null;
    }

    // Собираем все книги из всех страниц
    // Предпочитаем данные с языком 'all' (универсальные), если они есть
    const allBooks: IBook[] = [];
    let latestTimestamp = 0;
    let booksCountByYear: any = undefined;
    // Безопасно парсим filter_params, если что-то пошло не так, используем переданный filterParams или пустой массив
    let filterParamsParsed: string[] = [];
    try {
      if (allResults[0].filter_params) {
        const parsed = JSON.parse(allResults[0].filter_params);
        filterParamsParsed = Array.isArray(parsed) ? parsed : filterParams || [];
      } else {
        filterParamsParsed = filterParams || [];
      }
    } catch (error) {
      console.warn('Error parsing filter_params from cache, using provided filterParams:', error);
      filterParamsParsed = filterParams || [];
    }

    // Сначала собираем данные с языком 'all', затем остальные
    const resultsWithAll = allResults.filter((r) => r.language === 'all');
    const resultsOther = allResults.filter((r) => r.language !== 'all');
    const sortedResults = [...resultsWithAll, ...resultsOther];

    for (const result of sortedResults) {
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
    console.log(`   Язык: ${allResults[0].language} (данные универсальные для всех языков)`);
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
    const booksWithDates = applyBookDatesToData(allBooks, datesMap);

    // Удаляем дубликаты по bookId (предпочитаем первые записи, которые с языком 'all')
    const uniqueBooksMap = new Map<string, IBook>();
    for (const book of booksWithDates) {
      if (!uniqueBooksMap.has(book.bookId)) {
        uniqueBooksMap.set(book.bookId, book);
      }
    }
    let finalBooks = Array.from(uniqueBooksMap.values());

    // Для доски ALL не фильтруем, для остальных фильтруем по статусу
    if (boardType !== ALL) {
      finalBooks = finalBooks.filter((book) => book.bookStatus === boardType);
      // eslint-disable-next-line no-console
      console.log(`   После фильтрации по статусу ${boardType}: ${finalBooks.length} книг`);
    }

    // Применяем фильтры по категориям (если указаны)
    if (filterParams && filterParams.length > 0) {
      finalBooks = finalBooks.filter((book) => {
        const bookCategoryPath = book.categoryPath || '';
        return filterParams.some((filterPath) => bookCategoryPath.startsWith(filterPath));
      });
    }

    // Применяем сортировку (если указана)
    if (sortType && sortDirection) {
      finalBooks.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortType) {
          case 'title':
            aValue = (a.title || '').toLowerCase();
            bValue = (b.title || '').toLowerCase();
            break;
          case 'added':
            aValue = a.added || 0;
            bValue = b.added || 0;
            break;
          case 'pages':
            aValue = a.pages || 0;
            bValue = b.pages || 0;
            break;
          default:
            return 0;
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }

    return {
      boardType: allResults[0].board_type as BookStatus,
      data: finalBooks,
      totalItems: finalBooks.length,
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
  _language: string,
): Promise<BoardData[]> => {
  try {
    const database = await getDatabase();
    const filterParamsStr = JSON.stringify(filterParams);
    // Не фильтруем по языку - данные одинаковые для всех языков
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
       AND sort_type = ? AND sort_direction = ?
       ORDER BY page_index ASC, timestamp DESC`,
      [boardType, filterParamsStr, sortType, sortDirection],
    );

    return results.map((result) => {
      // Безопасно парсим filter_params
      let parsedFilterParams: string[] = [];
      try {
        if (result.filter_params) {
          const parsed = JSON.parse(result.filter_params);
          parsedFilterParams = Array.isArray(parsed) ? parsed : [];
        }
      } catch (error) {
        console.warn('Error parsing filter_params in loadAllBoardData:', error);
        parsedFilterParams = [];
      }

      return {
        boardType: result.board_type as BookStatus,
        data: JSON.parse(result.data) as IBook[],
        totalItems: result.total_items,
        hasNextPage: result.has_next_page === 1,
        pageIndex: result.page_index,
        filterParams: parsedFilterParams,
        sortType: result.sort_type,
        sortDirection: result.sort_direction,
        language: result.language,
        booksCountByYear: result.books_count_by_year ? JSON.parse(result.books_count_by_year) : undefined,
        timestamp: result.timestamp,
      };
    });
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
  _language: string,
): Promise<IBook[]> => {
  try {
    const database = await getDatabase();
    const { loadBookDates, applyBookDatesToData } = await import('./bookDates');
    const datesMap = await loadBookDates();

    // Загружаем все книги из всех досок (независимо от языка)
    // Нужно загружать все книги, потому что статусы могут быть изменены и хранятся в book_dates
    const allBooks: IBook[] = [];
    const allResults = await database.getAllAsync<{
      board_type: string;
      data: string;
    }>(`SELECT DISTINCT board_type, data FROM board_data ORDER BY timestamp DESC`);

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
 * Если записей нет, создает новую запись с этой книгой
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

    const now = Date.now();

    // Если записей нет, создаем новую запись с этой книгой
    if (!records || records.length === 0) {
      // Создаем новую запись с пустыми фильтрами и сортировкой по умолчанию
      const emptyFilters = JSON.stringify([]);
      const defaultSortType = '';
      const defaultSortDirection = '';
      const universalLanguage = 'all';
      const booksData = JSON.stringify([newBook]);
      const timestamp = Date.now();

      await database.runAsync(
        `INSERT INTO board_data 
         (board_type, page_index, filter_params, sort_type, sort_direction, language, data, total_items, has_next_page, books_count_by_year, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [boardType, 0, emptyFilters, defaultSortType, defaultSortDirection, universalLanguage, booksData, 1, 0, null, timestamp],
      );

      // eslint-disable-next-line no-console
      console.log(`➕ [SQLite Cache] Создана новая запись board_data для доски ${boardType} с книгой: ${newBook.bookId}`);
      return;
    }

    // Если записи есть, добавляем книгу во все записи, где её еще нет
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
export const updateBookStatusInCache = async (bookId: string, bookStatus: BookStatus, added: number, fullBook?: IBook): Promise<void> => {
  await updateBookInCache(bookId, { bookStatus, added });
  const { saveBookDate } = await import('./bookDates');
  await saveBookDate(bookId, added, bookStatus);

  // Сохраняем полные данные книги в единую таблицу, если они переданы
  if (fullBook) {
    try {
      const { saveBook } = await import('./books');
      // Обновляем статус и дату в полном объекте книги
      const updatedBook = { ...fullBook, bookStatus, added };
      await saveBook(updatedBook);
      // eslint-disable-next-line no-console
      console.log(`📚 [SQLite Cache] Полные данные книги сохранены в единую таблицу: ${bookId}`);
    } catch (error) {
      console.warn(`Error saving full book data to unified table for book ${bookId}:`, error);
    }
  } else {
    // Если полные данные не переданы, пытаемся загрузить из кэша
    try {
      const database = await getDatabase();
      const allRecords = await database.getAllAsync<{ data: string }>(`SELECT data FROM board_data LIMIT 1`);
      if (allRecords && allRecords.length > 0) {
        const books = JSON.parse(allRecords[0].data) as IBook[];
        const existingBook = books.find((b) => b.bookId === bookId);
        if (existingBook) {
          const { saveBook } = await import('./books');
          const updatedBook = { ...existingBook, bookStatus, added };
          await saveBook(updatedBook);
          // eslint-disable-next-line no-console
          console.log(`📚 [SQLite Cache] Данные книги загружены из кэша и сохранены в единую таблицу: ${bookId}`);
        }
      }
    } catch (error) {
      console.warn(`Error loading book data from cache for book ${bookId}:`, error);
    }
  }

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

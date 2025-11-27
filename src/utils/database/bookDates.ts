import { BookStatus, IBook } from '~types/books';

import { getDatabase } from './database';

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

    // Обновляем единую таблицу books
    try {
      const { updateBook } = await import('./books');
      await updateBook(bookId, { added, bookStatus: bookStatus || null });
    } catch (error) {
      console.warn(`Error updating unified books table for book ${bookId}:`, error);
    }

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

    // Обновляем единую таблицу books
    try {
      const { updateBook } = await import('./books');
      await updateBook(bookId, { bookStatus: bookStatus || null, added: currentAdded });
    } catch (error) {
      console.warn(`Error updating unified books table for book ${bookId}:`, error);
    }

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

    if (datesMap.size > 0) {
      const firstFive = Array.from(datesMap.entries()).slice(0, 5);
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
  // Используем динамический импорт, чтобы избежать циклической зависимости
  const { updateBookInCache } = await import('./boardData');
  await updateBookInCache(bookId, { added });
  await saveBookDate(bookId, added, bookStatus);
};


import { IRating } from '~types/books';

import { getDatabase } from './database';

/**
 * Сохранение рейтинга книги в локальную БД
 */
export const saveBookRating = async (bookId: string, rating: number): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    await database.runAsync(`INSERT OR REPLACE INTO book_ratings (book_id, rating, timestamp) VALUES (?, ?, ?)`, [bookId, rating, timestamp]);

    // Обновляем единую таблицу books
    try {
      const { updateBookRating } = await import('./books');
      await updateBookRating(bookId, rating);
    } catch (error) {
      console.warn(`Error updating unified books table for book ${bookId}:`, error);
    }

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

    // Обновляем единую таблицу books
    try {
      const { updateBookRating } = await import('./books');
      await updateBookRating(bookId, null);
    } catch (error) {
      console.warn(`Error updating unified books table for book ${bookId}:`, error);
    }

    // eslint-disable-next-line no-console
    console.log(`🗑️ [SQLite Cache] Рейтинг удален: bookId=${bookId}`);
  } catch (error) {
    console.error('Error deleting book rating:', error);
    throw error;
  }
};


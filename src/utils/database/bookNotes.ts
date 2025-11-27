import { IBookNote } from '~types/books';

import { getDatabase } from './database';

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

    // Обновляем единую таблицу books
    try {
      const { updateBook } = await import('./books');
      await updateBook(bookId, { comment, commentAdded: added });
    } catch (error) {
      console.warn(`Error updating unified books table for book ${bookId}:`, error);
    }

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

    if (notes.length > 0) {
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

    // Обновляем единую таблицу books
    try {
      const { updateBook } = await import('./books');
      await updateBook(bookId, { comment: null as any, commentAdded: null as any });
    } catch (error) {
      console.warn(`Error updating unified books table for book ${bookId}:`, error);
    }

  } catch (error) {
    console.error('Error deleting book note:', error);
    throw error;
  }
};

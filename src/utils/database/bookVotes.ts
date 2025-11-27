import { IVote } from '~types/books';

import { getDatabase } from './database';

/**
 * Сохранение количества лайков для книги в локальную БД
 */
export const saveBookVotesCount = async (bookId: string, votesCount: number): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    await database.runAsync(`INSERT OR REPLACE INTO book_votes (book_id, votes_count, timestamp) VALUES (?, ?, ?)`, [bookId, votesCount, timestamp]);

    // Обновляем единую таблицу books
    try {
      const { updateBook } = await import('./books');
      await updateBook(bookId, { votesCount });
    } catch (error) {
      console.warn(`Error updating unified books table for book ${bookId}:`, error);
    }

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

    if (userVotes.length > 0) {
    }

    return userVotes;
  } catch (error) {
    console.error('Error loading user votes:', error);
    return [];
  }
};


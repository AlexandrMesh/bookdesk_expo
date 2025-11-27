import { BookStatus, IBook } from '~types/books';

import { getDatabase } from './database';

/**
 * Сохранение/обновление книги в единой таблице books
 */
export const saveBook = async (book: IBook): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    // Преобразуем массив авторов в JSON строку
    const authorsJson = book.authorsList ? JSON.stringify(book.authorsList) : null;

    await database.runAsync(
      `INSERT OR REPLACE INTO books (
        book_id, title, cover_path, authors, pages, category_value, category_path,
        book_status, added, rating, votes_count, comment, comment_added, annotation, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        book.bookId,
        book.title || null,
        book.coverPath || null,
        authorsJson,
        book.pages || null,
        book.categoryValue || null,
        book.categoryPath || null,
        book.bookStatus || null,
        book.added || null,
        book.rating || null,
        book.votesCount || null,
        book.comment || null,
        book.commentAdded || null,
        book.annotation || null,
        timestamp,
      ],
    );

  } catch (error) {
    console.error('Error saving book:', error);
    throw error;
  }
};

/**
 * Сохранение массива книг в единую таблицу
 */
export const saveBooks = async (books: IBook[]): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    // Используем транзакцию для более быстрого сохранения
    await database.withTransactionAsync(async () => {
      for (const book of books) {
        const authorsJson = book.authorsList ? JSON.stringify(book.authorsList) : null;

        await database.runAsync(
          `INSERT OR REPLACE INTO books (
            book_id, title, cover_path, authors, pages, category_value, category_path,
            book_status, added, rating, votes_count, comment, comment_added, annotation, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            book.bookId,
            book.title || null,
            book.coverPath || null,
            authorsJson,
            book.pages || null,
            book.categoryValue || null,
            book.categoryPath || null,
            book.bookStatus || null,
            book.added || null,
            book.rating || null,
            book.votesCount || null,
            book.comment || null,
            book.commentAdded || null,
            book.annotation || null,
            timestamp,
          ],
        );
      }
    });

  } catch (error) {
    console.error('Error saving books:', error);
    throw error;
  }
};

/**
 * Загрузка книги по ID
 */
export const loadBook = async (bookId: string): Promise<IBook | null> => {
  try {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{
      book_id: string;
      title: string | null;
      cover_path: string | null;
      authors: string | null;
      pages: number | null;
      category_value: string | null;
      category_path: string | null;
      book_status: string | null;
      added: number | null;
      rating: number | null;
      votes_count: number | null;
      comment: string | null;
      comment_added: number | null;
      annotation: string | null;
      timestamp: number;
    }>(`SELECT * FROM books WHERE book_id = ?`, [bookId]);

    if (!result) {
      return null;
    }

    // Парсим JSON строку авторов обратно в массив
    let authorsList: string[] | undefined;
    if (result.authors) {
      try {
        authorsList = JSON.parse(result.authors);
      } catch (error) {
        console.warn(`Error parsing authors for book ${bookId}:`, error);
      }
    }

    return {
      bookId: result.book_id,
      title: result.title || undefined,
      coverPath: result.cover_path || undefined,
      authorsList,
      pages: result.pages || undefined,
      categoryValue: result.category_value || undefined,
      categoryPath: result.category_path || undefined,
      bookStatus: (result.book_status as BookStatus) || null,
      added: result.added || undefined,
      rating: result.rating || undefined,
      votesCount: result.votes_count || undefined,
      comment: result.comment || undefined,
      commentAdded: result.comment_added || undefined,
      annotation: result.annotation || undefined,
    };
  } catch (error) {
    console.error('Error loading book:', error);
    return null;
  }
};

/**
 * Загрузка всех книг из единой таблицы
 */
export const loadAllBooks = async (): Promise<IBook[]> => {
  try {
    const database = await getDatabase();
    const results = await database.getAllAsync<{
      book_id: string;
      title: string | null;
      cover_path: string | null;
      authors: string | null;
      pages: number | null;
      category_value: string | null;
      category_path: string | null;
      book_status: string | null;
      added: number | null;
      rating: number | null;
      votes_count: number | null;
      comment: string | null;
      comment_added: number | null;
      annotation: string | null;
      timestamp: number;
    }>(`SELECT * FROM books ORDER BY timestamp DESC`);

    const books: IBook[] = results.map((result) => {
      let authorsList: string[] | undefined;
      if (result.authors) {
        try {
          authorsList = JSON.parse(result.authors);
        } catch (error) {
          console.warn(`Error parsing authors for book ${result.book_id}:`, error);
        }
      }

      return {
        bookId: result.book_id,
        title: result.title || undefined,
        coverPath: result.cover_path || undefined,
        authorsList,
        pages: result.pages || undefined,
        categoryValue: result.category_value || undefined,
        categoryPath: result.category_path || undefined,
        bookStatus: (result.book_status as BookStatus) || null,
        added: result.added || undefined,
        rating: result.rating || undefined,
        votesCount: result.votes_count || undefined,
        comment: result.comment || undefined,
        commentAdded: result.comment_added || undefined,
        annotation: result.annotation || undefined,
      };
    });

    return books;
  } catch (error) {
    console.error('Error loading all books:', error);
    return [];
  }
};

/**
 * Обновление конкретных полей книги
 */
export const updateBook = async (bookId: string, updates: Partial<IBook>): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    // Строим динамический SQL запрос для обновления только указанных полей
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title || null);
    }
    if (updates.coverPath !== undefined) {
      fields.push('cover_path = ?');
      values.push(updates.coverPath || null);
    }
    if (updates.authorsList !== undefined) {
      fields.push('authors = ?');
      values.push(updates.authorsList ? JSON.stringify(updates.authorsList) : null);
    }
    if (updates.pages !== undefined) {
      fields.push('pages = ?');
      values.push(updates.pages || null);
    }
    if (updates.categoryValue !== undefined) {
      fields.push('category_value = ?');
      values.push(updates.categoryValue || null);
    }
    if (updates.categoryPath !== undefined) {
      fields.push('category_path = ?');
      values.push(updates.categoryPath || null);
    }
    if (updates.bookStatus !== undefined) {
      fields.push('book_status = ?');
      values.push(updates.bookStatus || null);
    }
    if (updates.added !== undefined) {
      fields.push('added = ?');
      values.push(updates.added || null);
    }
    if (updates.rating !== undefined) {
      fields.push('rating = ?');
      values.push(updates.rating || null);
    }
    if (updates.votesCount !== undefined) {
      fields.push('votes_count = ?');
      values.push(updates.votesCount || null);
    }
    if (updates.comment !== undefined) {
      fields.push('comment = ?');
      values.push(updates.comment || null);
    }
    if (updates.commentAdded !== undefined) {
      fields.push('comment_added = ?');
      values.push(updates.commentAdded || null);
    }
    if (updates.annotation !== undefined) {
      fields.push('annotation = ?');
      values.push(updates.annotation || null);
    }

    if (fields.length === 0) {
      return; // Нет полей для обновления
    }

    fields.push('timestamp = ?');
    values.push(timestamp);
    values.push(bookId);

    await database.runAsync(`UPDATE books SET ${fields.join(', ')} WHERE book_id = ?`, values);

  } catch (error) {
    console.error('Error updating book:', error);
    throw error;
  }
};

/**
 * Обновление рейтинга книги
 */
export const updateBookRating = async (bookId: string, rating: number | null): Promise<void> => {
  try {
    await updateBook(bookId, { rating });
  } catch (error) {
    console.error('Error updating book rating:', error);
    throw error;
  }
};

/**
 * Удаление книги из единой таблицы
 */
export const deleteBook = async (bookId: string): Promise<void> => {
  try {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM books WHERE book_id = ?`, [bookId]);
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
};

/**
 * Загрузка книг по статусу
 */
export const loadBooksByStatus = async (bookStatus: BookStatus): Promise<IBook[]> => {
  try {
    const database = await getDatabase();
    const results = await database.getAllAsync<{
      book_id: string;
      title: string | null;
      cover_path: string | null;
      authors: string | null;
      pages: number | null;
      category_value: string | null;
      category_path: string | null;
      book_status: string | null;
      added: number | null;
      rating: number | null;
      votes_count: number | null;
      comment: string | null;
      comment_added: number | null;
      annotation: string | null;
      timestamp: number;
    }>(`SELECT * FROM books WHERE book_status = ? ORDER BY timestamp DESC`, [bookStatus]);

    const books: IBook[] = results.map((result) => {
      let authorsList: string[] | undefined;
      if (result.authors) {
        try {
          authorsList = JSON.parse(result.authors);
        } catch (error) {
          console.warn(`Error parsing authors for book ${result.book_id}:`, error);
        }
      }

      return {
        bookId: result.book_id,
        title: result.title || undefined,
        coverPath: result.cover_path || undefined,
        authorsList,
        pages: result.pages || undefined,
        categoryValue: result.category_value || undefined,
        categoryPath: result.category_path || undefined,
        bookStatus: (result.book_status as BookStatus) || null,
        added: result.added || undefined,
        rating: result.rating || undefined,
        votesCount: result.votes_count || undefined,
        comment: result.comment || undefined,
        commentAdded: result.comment_added || undefined,
        annotation: result.annotation || undefined,
      };
    });

    return books;
  } catch (error) {
    console.error('Error loading books by status:', error);
    return [];
  }
};


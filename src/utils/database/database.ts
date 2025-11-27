import * as SQLite from 'expo-sqlite';

const DB_NAME = 'bookdesk.db';

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
        CREATE TABLE IF NOT EXISTS user_profile (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL,
          registered INTEGER,
          updated INTEGER,
          support_app_confirmed INTEGER NOT NULL DEFAULT 0,
          support_app_viewed_at INTEGER,
          timestamp INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id);
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          language TEXT NOT NULL,
          data TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          UNIQUE(language)
        );
        CREATE INDEX IF NOT EXISTS idx_categories_language ON categories(language);
      `);

      const createBooksTable = async () => {
        if (!db) {
          return;
        }
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS books (
            book_id TEXT PRIMARY KEY,
            title TEXT,
            cover_path TEXT,
            authors TEXT,
            pages INTEGER,
            category_value TEXT,
            category_path TEXT,
            book_status TEXT,
            added INTEGER,
            rating INTEGER,
            votes_count INTEGER,
            comment TEXT,
            comment_added INTEGER,
            annotation TEXT,
            timestamp INTEGER NOT NULL
          );
        `);
        await db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_books_book_id ON books(book_id);
          CREATE INDEX IF NOT EXISTS idx_books_book_status ON books(book_status);
          CREATE INDEX IF NOT EXISTS idx_books_added ON books(added);
          CREATE INDEX IF NOT EXISTS idx_books_timestamp ON books(timestamp);
        `);
      };

      const ensureBooksTableSchema = async () => {
        if (!db) return;
        const booksTableExists = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='books'`,
        );

        if (!booksTableExists || booksTableExists.count === 0) {
          await createBooksTable();
          return;
        }

        const existingColumns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info('books')`);
        const requiredColumns = [
          'book_id',
          'title',
          'cover_path',
          'authors',
          'pages',
          'category_value',
          'category_path',
          'book_status',
          'added',
          'rating',
          'votes_count',
          'comment',
          'comment_added',
          'annotation',
          'timestamp',
        ];
        const missingColumns = requiredColumns.filter(
          (column) => !existingColumns.some((existing) => existing.name === column),
        );

        if (missingColumns.length > 0) {
          console.warn(
            `⚠️ [Migration] Таблица books не содержит столбцы: ${missingColumns.join(
              ', ',
            )}. Таблица будет пересоздана.`,
          );
          await db.execAsync(`DROP TABLE IF EXISTS books`);
          await createBooksTable();
        } else {
          await db.execAsync(`
            CREATE INDEX IF NOT EXISTS idx_books_book_id ON books(book_id);
            CREATE INDEX IF NOT EXISTS idx_books_book_status ON books(book_status);
            CREATE INDEX IF NOT EXISTS idx_books_added ON books(added);
            CREATE INDEX IF NOT EXISTS idx_books_timestamp ON books(timestamp);
          `);
        }
      };

      await ensureBooksTableSchema();

      // Миграция: переносим данные из старых таблиц в новую единую таблицу books
      try {
        if (!db) {
          throw new Error('Database not initialized');
        }

        // Проверяем существование таблиц и наличие колонки book_id перед миграцией
        const checkTableAndColumn = async (tableName: string): Promise<boolean> => {
          try {
            if (!db) return false;
            // Проверяем существование таблицы
            const tableResult = await db.getFirstAsync<{ count: number }>(
              `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`,
              [tableName],
            );
            if (!tableResult || tableResult.count === 0) {
              return false;
            }
            // Проверяем наличие колонки book_id через pragma_table_info
            // Используем прямой запрос, так как pragma_table_info не поддерживает параметры
            const columnResult = await db.getFirstAsync<{ count: number }>(
              `SELECT COUNT(*) as count FROM pragma_table_info('${tableName}') WHERE name='book_id'`,
            );
            return columnResult !== null && columnResult.count > 0;
          } catch {
            return false;
          }
        };

        const bookDatesExists = await checkTableAndColumn('book_dates');
        const bookRatingsExists = await checkTableAndColumn('book_ratings');
        const bookVotesExists = await checkTableAndColumn('book_votes');
        const bookNotesExists = await checkTableAndColumn('book_notes');

        // Если ни одна из старых таблиц не существует, пропускаем миграцию
        if (!bookDatesExists && !bookRatingsExists && !bookVotesExists && !bookNotesExists) {
          // eslint-disable-next-line no-console
          console.log('✅ [Migration] Старые таблицы не найдены, миграция не требуется');
        } else {
          // Проверяем, есть ли данные в старых таблицах, но нет в новой
          const existingBooks = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM books`);

          // Формируем UNION запрос только для существующих таблиц
          const unionParts: string[] = [];
          if (bookDatesExists) unionParts.push('SELECT book_id FROM book_dates');
          if (bookRatingsExists) unionParts.push('SELECT book_id FROM book_ratings');
          if (bookVotesExists) unionParts.push('SELECT book_id FROM book_votes');
          if (bookNotesExists) unionParts.push('SELECT book_id FROM book_notes');

          if (unionParts.length > 0) {
            const hasOldData = await db.getFirstAsync<{ count: number }>(`
              SELECT COUNT(*) as count FROM (
                ${unionParts.join(' UNION ')}
              )
            `);

            if (hasOldData && hasOldData.count > 0 && (!existingBooks || existingBooks.count === 0)) {
              // eslint-disable-next-line no-console
              console.log('🔄 [Migration] Начинаем миграцию данных из старых таблиц в единую таблицу books...');

              // Получаем все уникальные book_id из старых таблиц
              const allBookIds = await db.getAllAsync<{ book_id: string }>(`
                SELECT DISTINCT book_id FROM (
                  ${unionParts.join(' UNION ')}
                )
              `);

              // Для каждого book_id собираем данные из всех таблиц
              for (const { book_id } of allBookIds) {
                const dateData = bookDatesExists
                  ? await db.getFirstAsync<{ added: number; book_status: string | null }>(
                      `SELECT added, book_status FROM book_dates WHERE book_id = ?`,
                      [book_id],
                    )
                  : null;
                const ratingData = bookRatingsExists
                  ? await db.getFirstAsync<{ rating: number }>(`SELECT rating FROM book_ratings WHERE book_id = ?`, [book_id])
                  : null;
                const votesData = bookVotesExists
                  ? await db.getFirstAsync<{ votes_count: number }>(`SELECT votes_count FROM book_votes WHERE book_id = ?`, [book_id])
                  : null;
                const noteData = bookNotesExists
                  ? await db.getFirstAsync<{ comment: string; added: number }>(`SELECT comment, added FROM book_notes WHERE book_id = ?`, [book_id])
                  : null;

                // Вставляем или обновляем запись в единой таблице
                await db.runAsync(
                  `
                  INSERT OR REPLACE INTO books (
                    book_id, added, book_status, rating, votes_count, comment, comment_added, timestamp
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                  [
                    book_id,
                    dateData?.added || null,
                    dateData?.book_status || null,
                    ratingData?.rating || null,
                    votesData?.votes_count || null,
                    noteData?.comment || null,
                    noteData?.added || null,
                    Date.now(),
                  ],
                );
              }

              // eslint-disable-next-line no-console
              console.log(`✅ [Migration] Мигрировано ${allBookIds.length} книг из старых таблиц в единую таблицу books`);
            }
          }
        }
      } catch (error: any) {
        // Игнорируем ошибки миграции, но логируем их
        const errorMessage = error?.message || String(error);
        if (!errorMessage.includes('no such table') && !errorMessage.includes('no such column')) {
          console.warn('Migration warning (books table migration):', error);
        }
      }

      // Миграция: добавляем новые поля если их еще нет
      // SQLite не поддерживает IF NOT EXISTS для ALTER TABLE, поэтому используем try-catch
      try {
        await db.execAsync(`
          ALTER TABLE user_profile ADD COLUMN sync_with_local_database_completed INTEGER NOT NULL DEFAULT 0;
        `);
        // eslint-disable-next-line no-console
        console.log('✅ [Migration] Added sync_with_local_database_completed column');
      } catch (error: any) {
        // Игнорируем ошибку если колонка уже существует
        if (!error?.message?.includes('duplicate column') && !error?.message?.includes('already exists')) {
          console.warn('Migration warning (sync_with_local_database_completed):', error);
        }
      }

      try {
        await db.execAsync(`
          ALTER TABLE user_profile ADD COLUMN is_new_user INTEGER NOT NULL DEFAULT 0;
        `);
        // eslint-disable-next-line no-console
        console.log('✅ [Migration] Added is_new_user column');
      } catch (error: any) {
        // Игнорируем ошибку если колонка уже существует
        if (!error?.message?.includes('duplicate column') && !error?.message?.includes('already exists')) {
          console.warn('Migration warning (is_new_user):', error);
        }
      }

      try {
        // Проверяем, существует ли колонка перед добавлением
        const checkColumn = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM pragma_table_info('user_profile') WHERE name='sync_database_completed'`,
        );
        if (checkColumn && checkColumn.count === 0) {
          await db.execAsync(`
            ALTER TABLE user_profile ADD COLUMN sync_database_completed INTEGER NOT NULL DEFAULT 0;
          `);
          // eslint-disable-next-line no-console
          console.log('✅ [Migration] Added sync_database_completed column');
        } else {
          // eslint-disable-next-line no-console
          console.log('✅ [Migration] sync_database_completed column already exists');
        }
      } catch (error: any) {
        // Игнорируем ошибку если колонка уже существует
        const errorMessage = error?.message || String(error);
        if (!errorMessage.includes('duplicate column') && !errorMessage.includes('already exists') && !errorMessage.includes('no such column')) {
          console.warn('Migration warning (sync_database_completed):', error);
        }
      }

      // Инициализируем категории из config/categories.ts при первом запуске
      try {
        const { initializeCategoriesFromJson } = await import('./categories');
        // Инициализируем категории для всех поддерживаемых языков
        const languages = ['ru', 'en'];
        for (const lang of languages) {
          try {
            await initializeCategoriesFromJson(lang);
          } catch (error) {
            console.error(`Error initializing categories for language ${lang}:`, error);
          }
        }
        // eslint-disable-next-line no-console
        console.log('✅ [initDatabase] Категории инициализированы из config/categories.ts');
      } catch (error) {
        console.error('Error initializing categories during database init:', error);
        // Не прерываем инициализацию БД из-за ошибки категорий
      }

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
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    await initDatabase();
  }
  if (!db) {
    throw new Error('Database initialization failed');
  }
  return db;
};

/**
 * Полный сброс всех данных базы данных
 */
export const resetAllDatabaseData = async (): Promise<void> => {
  try {
    const database = await getDatabase();

    // Используем транзакцию для атомарности операции
    await database.withTransactionAsync(async () => {
      // Очищаем все таблицы в правильном порядке
      // Сначала зависимые таблицы, затем основную таблицу books
      const tables = [
        'board_data',
        'book_ratings',
        'book_votes',
        'user_votes',
        'book_dates',
        'book_notes',
        'goal_items',
        'user_goal',
        'user_profile',
        'categories',
        'books', // Единая таблица книг - очищаем последней
      ];

      for (const table of tables) {
        try {
          await database.runAsync(`DELETE FROM ${table}`);
        } catch (error) {
          // Игнорируем ошибки если таблица не существует
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('no such table')) {
            console.warn(`Warning: Could not delete from table ${table}:`, error);
          }
        }
      }
    });

    // eslint-disable-next-line no-console
    console.log('🗑️ [SQLite Cache] Все данные базы данных сброшены (включая единую таблицу books)');
  } catch (error) {
    console.error('Error resetting all database data:', error);
    throw error;
  }
};

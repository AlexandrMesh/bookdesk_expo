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
        await db.execAsync(`
          ALTER TABLE user_profile ADD COLUMN sync_database_completed INTEGER NOT NULL DEFAULT 0;
        `);
        // eslint-disable-next-line no-console
        console.log('✅ [Migration] Added sync_database_completed column');
      } catch (error: any) {
        // Игнорируем ошибку если колонка уже существует
        if (!error?.message?.includes('duplicate column') && !error?.message?.includes('already exists')) {
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

    // Очищаем все таблицы
    await database.execAsync(`
      DELETE FROM board_data;
      DELETE FROM book_ratings;
      DELETE FROM book_votes;
      DELETE FROM user_votes;
      DELETE FROM book_dates;
      DELETE FROM book_notes;
      DELETE FROM goal_items;
      DELETE FROM user_goal;
      DELETE FROM user_profile;
      DELETE FROM categories;
    `);

    // eslint-disable-next-line no-console
    console.log('🗑️ [SQLite Cache] Все данные базы данных сброшены');
  } catch (error) {
    console.error('Error resetting all database data:', error);
    throw error;
  }
};

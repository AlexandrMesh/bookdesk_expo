import { ICategory } from '~types/books';

import { getDatabase } from './database';

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


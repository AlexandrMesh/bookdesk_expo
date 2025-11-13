import { ICategory } from '~types/books';

import { categoriesData } from '../../config/categories';
import { getDatabase } from './database';

/**
 * Загрузка категорий из TypeScript файла
 */
export const loadCategoriesFromJson = async (language: string): Promise<ICategory[]> => {
  try {
    // Фильтруем категории по языку
    const categories: ICategory[] = categoriesData.filter((cat) => cat.language === language);

    // eslint-disable-next-line no-console
    console.log(`📂 [Categories] Загружено категорий из TS файла: ${categories.length} для языка ${language}`);
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
    console.error('Error loading categories from TS file:', error);
    return [];
  }
};

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

/**
 * Инициализация категорий из JSON файла в локальную БД (если их еще нет)
 */
export const initializeCategoriesFromJson = async (language: string): Promise<ICategory[]> => {
  try {
    // Сначала проверяем, есть ли категории в БД
    const existingCategories = await loadCategories(language);
    
    if (existingCategories.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`📂 [initializeCategoriesFromJson] Категории уже есть в БД, используем их`);
      return existingCategories;
    }

    // Если категорий нет в БД, загружаем из JSON файла
    // eslint-disable-next-line no-console
    console.log(`📂 [initializeCategoriesFromJson] Категорий нет в БД, загружаем из JSON файла`);
    const categoriesFromJson = await loadCategoriesFromJson(language);
    
    if (categoriesFromJson.length > 0) {
      // Сохраняем в БД
      await saveCategories(categoriesFromJson, language);
      // eslint-disable-next-line no-console
      console.log(`📂 [initializeCategoriesFromJson] Категории из JSON файла сохранены в БД`);
      return categoriesFromJson;
    }

    return [];
  } catch (error) {
    console.error('Error initializing categories from JSON:', error);
    return [];
  }
};


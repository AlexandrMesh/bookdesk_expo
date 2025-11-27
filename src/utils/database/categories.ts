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

    if (categories.length > 0) {
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

    if (categories.length > 0) {
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
      return existingCategories;
    }

    // Если категорий нет в БД, загружаем из JSON файла
    const categoriesFromJson = await loadCategoriesFromJson(language);
    
    if (categoriesFromJson.length > 0) {
      // Сохраняем в БД
      await saveCategories(categoriesFromJson, language);
      return categoriesFromJson;
    }

    return [];
  } catch (error) {
    console.error('Error initializing categories from JSON:', error);
    return [];
  }
};


import { getDatabase } from './database';

export interface ICustomGenreRecord {
  id: string;
  title: string;
  language: string;
  parentPath: string;
  createdAt: number;
  updatedAt: number;
}

const DEFAULT_PARENT_PATH = '1.my';

export const loadCustomGenres = async (language: string): Promise<ICustomGenreRecord[]> => {
  try {
    const database = await getDatabase();
    const rows = await database.getAllAsync<{
      id: string;
      title: string;
      language: string;
      parent_path: string;
      created_at: number;
      updated_at: number;
    }>(`SELECT id, title, language, parent_path, created_at, updated_at FROM custom_categories WHERE language = ? ORDER BY created_at ASC`, [language]);

    return rows.map(({ id, title, language: lang, parent_path, created_at, updated_at }) => ({
      id,
      title,
      language: lang,
      parentPath: parent_path,
      createdAt: created_at,
      updatedAt: updated_at,
    }));
  } catch (error) {
    console.error('Error loading custom genres:', error);
    return [];
  }
};

export const addCustomGenre = async (title: string, language: string, parentPath: string = DEFAULT_PARENT_PATH): Promise<ICustomGenreRecord> => {
  const trimmedTitle = title.trim();
  const id = `custom_${Date.now()}`;
  const timestamp = Date.now();

  try {
    const database = await getDatabase();
    await database.runAsync(
      `INSERT INTO custom_categories (id, title, language, parent_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, trimmedTitle, language, parentPath, timestamp, timestamp],
    );

    return {
      id,
      title: trimmedTitle,
      language,
      parentPath,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  } catch (error) {
    console.error('Error adding custom genre:', error);
    throw error;
  }
};

export const updateCustomGenre = async (id: string, title: string): Promise<void> => {
  const trimmedTitle = title.trim();
  try {
    const database = await getDatabase();
    await database.runAsync(`UPDATE custom_categories SET title = ?, updated_at = ? WHERE id = ?`, [trimmedTitle, Date.now(), id]);
  } catch (error) {
    console.error('Error updating custom genre:', error);
    throw error;
  }
};

export const deleteCustomGenre = async (id: string): Promise<void> => {
  try {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM custom_categories WHERE id = ?`, [id]);
  } catch (error) {
    console.error('Error deleting custom genre:', error);
    throw error;
  }
};


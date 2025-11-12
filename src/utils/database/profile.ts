import { getDatabase } from './database';

/**
 * Сохранение профиля пользователя в локальную БД
 */
export const saveProfile = async (profile: {
  _id: string;
  email: string;
  registered: number | null;
  updated: number | null;
  supportApp: { confirmed: boolean; viewedAt: number | null };
}): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    await database.runAsync(
      `INSERT OR REPLACE INTO user_profile (user_id, email, registered, updated, support_app_confirmed, support_app_viewed_at, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [profile._id, profile.email, profile.registered, profile.updated, profile.supportApp.confirmed ? 1 : 0, profile.supportApp.viewedAt, timestamp],
    );

    // eslint-disable-next-line no-console
    console.log(`👤 [SQLite Cache] Профиль сохранен: userId=${profile._id}, email=${profile.email}`);
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
};

/**
 * Загрузка профиля пользователя из локальной БД
 */
export const loadProfile = async (): Promise<{
  _id: string;
  email: string;
  registered: number | null;
  updated: number | null;
  supportApp: { confirmed: boolean; viewedAt: number | null };
} | null> => {
  try {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{
      user_id: string;
      email: string;
      registered: number | null;
      updated: number | null;
      support_app_confirmed: number;
      support_app_viewed_at: number | null;
      timestamp: number;
    }>(`SELECT user_id, email, registered, updated, support_app_confirmed, support_app_viewed_at, timestamp FROM user_profile LIMIT 1`);

    if (!result) {
      return null;
    }

    // eslint-disable-next-line no-console
    console.log(`👤 [SQLite Cache] Загружен профиль из локальной БД: userId=${result.user_id}, email=${result.email}`);

    return {
      _id: result.user_id,
      email: result.email,
      registered: result.registered,
      updated: result.updated,
      supportApp: {
        confirmed: result.support_app_confirmed === 1,
        viewedAt: result.support_app_viewed_at,
      },
    };
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
};

/**
 * Удаление профиля пользователя из локальной БД
 */
export const deleteProfile = async (): Promise<void> => {
  try {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM user_profile`);
    // eslint-disable-next-line no-console
    console.log(`🗑️ [SQLite Cache] Профиль удален из локальной БД`);
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
};


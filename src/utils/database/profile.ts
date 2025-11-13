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
  syncWithLocalDatabaseCompleted?: boolean;
  isNewUser?: boolean;
}): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    // Загружаем существующий профиль чтобы сохранить значения syncWithLocalDatabaseCompleted и isNewUser
    const existingProfile = await loadProfile();
    const syncCompleted = profile.syncWithLocalDatabaseCompleted !== undefined 
      ? profile.syncWithLocalDatabaseCompleted 
      : (existingProfile?.syncWithLocalDatabaseCompleted ?? false);
    const isNewUser = profile.isNewUser !== undefined 
      ? profile.isNewUser 
      : (existingProfile?.isNewUser ?? false);

    await database.runAsync(
      `INSERT OR REPLACE INTO user_profile (user_id, email, registered, updated, support_app_confirmed, support_app_viewed_at, sync_with_local_database_completed, is_new_user, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile._id, 
        profile.email, 
        profile.registered, 
        profile.updated, 
        profile.supportApp.confirmed ? 1 : 0, 
        profile.supportApp.viewedAt,
        syncCompleted ? 1 : 0,
        isNewUser ? 1 : 0,
        timestamp
      ],
    );

    // eslint-disable-next-line no-console
    console.log(`👤 [SQLite Cache] Профиль сохранен: userId=${profile._id}, email=${profile.email}, syncCompleted=${syncCompleted}, isNewUser=${isNewUser}`);
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
  syncWithLocalDatabaseCompleted: boolean;
  isNewUser: boolean;
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
      sync_with_local_database_completed: number;
      is_new_user: number;
      timestamp: number;
    }>(`SELECT user_id, email, registered, updated, support_app_confirmed, support_app_viewed_at, sync_with_local_database_completed, is_new_user, timestamp FROM user_profile LIMIT 1`);

    if (!result) {
      return null;
    }

    // eslint-disable-next-line no-console
    console.log(`👤 [SQLite Cache] Загружен профиль из локальной БД: userId=${result.user_id}, email=${result.email}, syncCompleted=${result.sync_with_local_database_completed === 1}, isNewUser=${result.is_new_user === 1}`);

    return {
      _id: result.user_id,
      email: result.email,
      registered: result.registered,
      updated: result.updated,
      supportApp: {
        confirmed: result.support_app_confirmed === 1,
        viewedAt: result.support_app_viewed_at,
      },
      syncWithLocalDatabaseCompleted: result.sync_with_local_database_completed === 1,
      isNewUser: result.is_new_user === 1,
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

/**
 * Проверка наличия пользователя в локальной БД
 */
export const hasUserProfile = async (): Promise<boolean> => {
  try {
    const profile = await loadProfile();
    return profile !== null;
  } catch (error) {
    console.error('Error checking user profile:', error);
    return false;
  }
};

/**
 * Сохранение гостевого пользователя (без токена) в локальную БД
 * @param forceCreate - если true, создает нового пользователя даже если профиль уже существует
 */
export const saveGuestProfile = async (forceCreate: boolean = false): Promise<void> => {
  try {
    // Проверяем, есть ли уже профиль
    if (!forceCreate) {
      const existingProfile = await loadProfile();
      if (existingProfile) {
        // eslint-disable-next-line no-console
        console.log('👤 [saveGuestProfile] Профиль уже существует, пропускаем сохранение');
        return;
      }
    }

    // Генерируем уникальный ID для гостевого пользователя
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    const database = await getDatabase();
    await database.runAsync(
      `INSERT OR REPLACE INTO user_profile (user_id, email, registered, updated, support_app_confirmed, support_app_viewed_at, sync_with_local_database_completed, is_new_user, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [guestId, '', timestamp, null, 0, null, 0, 1, timestamp], // is_new_user = 1 (true) для новых пользователей
    );

    // eslint-disable-next-line no-console
    console.log(`👤 [SQLite Cache] Гостевой профиль сохранен: userId=${guestId}, registered=${new Date(timestamp).toISOString()}, isNewUser=true`);
  } catch (error) {
    console.error('Error saving guest profile:', error);
    throw error;
  }
};

/**
 * Установка флага syncWithLocalDatabaseCompleted
 */
export const setSyncWithLocalDatabaseCompleted = async (completed: boolean): Promise<void> => {
  try {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE user_profile SET sync_with_local_database_completed = ? WHERE id IN (SELECT id FROM user_profile LIMIT 1)`,
      [completed ? 1 : 0],
    );
    // eslint-disable-next-line no-console
    console.log(`✅ [SQLite Cache] syncWithLocalDatabaseCompleted установлен: ${completed}`);
  } catch (error) {
    console.error('Error setting syncWithLocalDatabaseCompleted:', error);
    throw error;
  }
};


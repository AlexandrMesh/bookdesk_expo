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
  syncDatabaseCompleted?: boolean;
  isNewUser?: boolean;
}): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    // Загружаем существующий профиль чтобы сохранить значения syncWithLocalDatabaseCompleted, syncDatabaseCompleted и isNewUser
    // НО: если новый профиль имеет другой user_id, то не используем значения из старого профиля
    const existingProfile = await loadProfile();
    const isDifferentUser = existingProfile && existingProfile._id !== profile._id;

    // ВАЖНО: Если сохраняем профиль с другим user_id (например, профиль с сервера вместо гостевого),
    // то удаляем все старые записи профиля, чтобы гарантировать, что будет только одна запись
    if (isDifferentUser) {
      await database.runAsync(`DELETE FROM user_profile`);
    }

    const syncCompleted =
      profile.syncWithLocalDatabaseCompleted !== undefined
        ? profile.syncWithLocalDatabaseCompleted
        : isDifferentUser
          ? false
          : (existingProfile?.syncWithLocalDatabaseCompleted ?? false);
    const syncDatabaseCompletedValue =
      profile.syncDatabaseCompleted !== undefined
        ? profile.syncDatabaseCompleted
        : isDifferentUser
          ? false
          : (existingProfile?.syncDatabaseCompleted ?? false);
    const isNewUser = profile.isNewUser !== undefined ? profile.isNewUser : isDifferentUser ? false : (existingProfile?.isNewUser ?? false);


    // Проверяем, существует ли колонка sync_database_completed
    const checkColumn = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM pragma_table_info('user_profile') WHERE name='sync_database_completed'`
    );
    const hasSyncDatabaseCompleted = checkColumn && checkColumn.count > 0;
    
    if (hasSyncDatabaseCompleted) {
      await database.runAsync(
        `INSERT OR REPLACE INTO user_profile (user_id, email, registered, updated, support_app_confirmed, support_app_viewed_at, sync_with_local_database_completed, sync_database_completed, is_new_user, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          profile._id,
          profile.email,
          profile.registered,
          profile.updated,
          profile.supportApp.confirmed ? 1 : 0,
          profile.supportApp.viewedAt,
          syncCompleted ? 1 : 0,
          syncDatabaseCompletedValue ? 1 : 0,
          isNewUser ? 1 : 0,
          timestamp,
        ],
      );
    } else {
      // Если колонки нет, сохраняем без неё (миграция добавит её позже)
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
          timestamp,
        ],
      );
      // Пытаемся добавить колонку после сохранения
      try {
        await database.execAsync(`ALTER TABLE user_profile ADD COLUMN sync_database_completed INTEGER NOT NULL DEFAULT 0;`);
        // Обновляем запись с правильным значением
        await database.runAsync(`UPDATE user_profile SET sync_database_completed = ? WHERE user_id = ?`, [
          syncDatabaseCompletedValue ? 1 : 0,
          profile._id,
        ]);
      } catch (migrationError: any) {
        const errorMessage = migrationError?.message || String(migrationError);
        if (!errorMessage.includes('duplicate column') && !errorMessage.includes('already exists')) {
          console.warn('Warning: Could not add sync_database_completed column:', migrationError);
        }
      }
    }

    // Проверяем, что профиль действительно сохранился
    const savedProfile = await loadProfile();
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
  syncDatabaseCompleted: boolean;
  isNewUser: boolean;
} | null> => {
  try {
    const database = await getDatabase();
    
    // Проверяем, существует ли колонка sync_database_completed
    const checkColumn = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM pragma_table_info('user_profile') WHERE name='sync_database_completed'`
    );
    const hasSyncDatabaseCompleted = checkColumn && checkColumn.count > 0;
    
    // Формируем запрос в зависимости от наличия колонки
    const selectQuery = hasSyncDatabaseCompleted
      ? `SELECT user_id, email, registered, updated, support_app_confirmed, support_app_viewed_at, sync_with_local_database_completed, sync_database_completed, is_new_user, timestamp FROM user_profile LIMIT 1`
      : `SELECT user_id, email, registered, updated, support_app_confirmed, support_app_viewed_at, sync_with_local_database_completed, 0 as sync_database_completed, is_new_user, timestamp FROM user_profile LIMIT 1`;
    
    const result = await database.getFirstAsync<{
      user_id: string;
      email: string;
      registered: number | null;
      updated: number | null;
      support_app_confirmed: number;
      support_app_viewed_at: number | null;
      sync_with_local_database_completed: number;
      sync_database_completed: number;
      is_new_user: number;
      timestamp: number;
    }>(selectQuery);

    if (!result) {
      return null;
    }


    const loadedProfile = {
      _id: result.user_id,
      email: result.email,
      registered: result.registered,
      updated: result.updated,
      supportApp: {
        confirmed: result.support_app_confirmed === 1,
        viewedAt: result.support_app_viewed_at,
      },
      syncWithLocalDatabaseCompleted: result.sync_with_local_database_completed === 1,
      syncDatabaseCompleted: (result.sync_database_completed ?? 0) === 1,
      isNewUser: result.is_new_user === 1,
    };


    return loadedProfile;
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
    const existingProfile = await loadProfile();

    // ВАЖНО: Никогда не перезаписываем профиль, если syncDatabaseCompleted = true
    // Это означает, что профиль был синхронизирован с сервера и содержит реальные данные пользователя
    if (existingProfile && existingProfile.syncDatabaseCompleted === true) {
      return;
    }

    // Если forceCreate = false и профиль существует (но syncDatabaseCompleted != true), пропускаем
    if (!forceCreate && existingProfile) {
      return;
    }

    // Генерируем уникальный ID для гостевого пользователя
    const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    const database = await getDatabase();
    
    // Проверяем, существует ли колонка sync_database_completed
    const checkColumn = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM pragma_table_info('user_profile') WHERE name='sync_database_completed'`
    );
    const hasSyncDatabaseCompleted = checkColumn && checkColumn.count > 0;
    
    if (hasSyncDatabaseCompleted) {
      await database.runAsync(
        `INSERT OR REPLACE INTO user_profile (user_id, email, registered, updated, support_app_confirmed, support_app_viewed_at, sync_with_local_database_completed, sync_database_completed, is_new_user, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [guestId, '', timestamp, null, 0, null, 0, 0, 1, timestamp], // is_new_user = 1 (true) для новых пользователей, sync_database_completed = 0 (false)
      );
    } else {
      // Если колонки нет, сохраняем без неё
      await database.runAsync(
        `INSERT OR REPLACE INTO user_profile (user_id, email, registered, updated, support_app_confirmed, support_app_viewed_at, sync_with_local_database_completed, is_new_user, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [guestId, '', timestamp, null, 0, null, 0, 1, timestamp],
      );
      // Пытаемся добавить колонку после сохранения
      try {
        await database.execAsync(`ALTER TABLE user_profile ADD COLUMN sync_database_completed INTEGER NOT NULL DEFAULT 0;`);
        await database.runAsync(`UPDATE user_profile SET sync_database_completed = 0 WHERE user_id = ?`, [guestId]);
      } catch (migrationError: any) {
        const errorMessage = migrationError?.message || String(migrationError);
        if (!errorMessage.includes('duplicate column') && !errorMessage.includes('already exists')) {
          console.warn('Warning: Could not add sync_database_completed column:', migrationError);
        }
      }
    }

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
    await database.runAsync(`UPDATE user_profile SET sync_with_local_database_completed = ? WHERE id IN (SELECT id FROM user_profile LIMIT 1)`, [
      completed ? 1 : 0,
    ]);
  } catch (error) {
    console.error('Error setting syncWithLocalDatabaseCompleted:', error);
    throw error;
  }
};

/**
 * Установка флага syncDatabaseCompleted
 */
export const setSyncDatabaseCompleted = async (completed: boolean): Promise<void> => {
  try {
    const database = await getDatabase();
    
    // Проверяем, существует ли колонка sync_database_completed
    const checkColumn = await database.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM pragma_table_info('user_profile') WHERE name='sync_database_completed'`
    );
    const hasSyncDatabaseCompleted = checkColumn && checkColumn.count > 0;
    
    if (!hasSyncDatabaseCompleted) {
      // Если колонки нет, пытаемся добавить её
      try {
        await database.execAsync(`ALTER TABLE user_profile ADD COLUMN sync_database_completed INTEGER NOT NULL DEFAULT 0;`);
      } catch (migrationError: any) {
        const errorMessage = migrationError?.message || String(migrationError);
        if (!errorMessage.includes('duplicate column') && !errorMessage.includes('already exists')) {
          console.warn('Warning: Could not add sync_database_completed column:', migrationError);
          return; // Выходим, если не удалось добавить колонку
        }
      }
    }
    
    // Обновляем все записи профиля (должна быть только одна)
    const result = await database.runAsync(`UPDATE user_profile SET sync_database_completed = ?`, [completed ? 1 : 0]);

    // Проверяем, что значение действительно установлено
    const updatedProfile = await loadProfile();
    if (updatedProfile) {
    }
  } catch (error) {
    console.error('Error setting syncDatabaseCompleted:', error);
    throw error;
  }
};

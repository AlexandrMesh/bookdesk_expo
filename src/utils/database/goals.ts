import { getDatabase } from './database';

/**
 * Сохранение goal item в локальную БД
 */
export const saveGoalItem = async (itemId: string, pages: number, addedAt: number): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    await database.runAsync(`INSERT OR REPLACE INTO goal_items (item_id, pages, added_at, timestamp) VALUES (?, ?, ?, ?)`, [
      itemId,
      pages,
      addedAt,
      timestamp,
    ]);

  } catch (error) {
    console.error('Error saving goal item:', error);
    throw error;
  }
};

/**
 * Сохранение массива goal items в локальную БД (для первого запуска)
 */
export const saveGoalItems = async (items: Array<{ _id: string; pages: number; added_at: number }>): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    // Используем транзакцию для быстрой вставки
    await database.withTransactionAsync(async () => {
      for (const item of items) {
        await database.runAsync(`INSERT OR REPLACE INTO goal_items (item_id, pages, added_at, timestamp) VALUES (?, ?, ?, ?)`, [
          item._id,
          item.pages,
          item.added_at,
          timestamp,
        ]);
      }
    });

  } catch (error) {
    console.error('Error saving goal items:', error);
    throw error;
  }
};

/**
 * Загрузка всех goal items из локальной БД
 */
export const loadGoalItems = async (): Promise<Array<{ _id: string; pages: number; added_at: number }>> => {
  try {
    const database = await getDatabase();
    const results = await database.getAllAsync<{
      item_id: string;
      pages: number;
      added_at: number;
      timestamp: number;
    }>(`SELECT item_id, pages, added_at, timestamp FROM goal_items ORDER BY added_at DESC`);

    const items = results.map((result) => ({
      _id: result.item_id,
      pages: result.pages,
      added_at: result.added_at,
    }));

    if (items.length > 0) {
    }

    return items;
  } catch (error) {
    console.error('Error loading goal items:', error);
    return [];
  }
};

/**
 * Удаление goal item из локальной БД
 */
export const deleteGoalItem = async (itemId: string): Promise<void> => {
  try {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM goal_items WHERE item_id = ?`, [itemId]);
  } catch (error) {
    console.error('Error deleting goal item:', error);
    throw error;
  }
};

/**
 * Сохранение цели пользователя в локальную БД
 */
export const saveGoal = async (numberOfPages: number | null, goalType: string): Promise<void> => {
  try {
    const database = await getDatabase();
    const timestamp = Date.now();

    // Удаляем старую цель (если есть) и вставляем новую
    await database.runAsync(`DELETE FROM user_goal`);
    await database.runAsync(`INSERT INTO user_goal (number_of_pages, goal_type, timestamp) VALUES (?, ?, ?)`, [numberOfPages, goalType, timestamp]);

  } catch (error) {
    console.error('Error saving goal:', error);
    throw error;
  }
};

/**
 * Загрузка цели пользователя из локальной БД
 */
export const loadGoal = async (): Promise<{ numberOfPages: number | null; goalType: string } | null> => {
  try {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{
      number_of_pages: number | null;
      goal_type: string;
      timestamp: number;
    }>(`SELECT number_of_pages, goal_type, timestamp FROM user_goal LIMIT 1`);

    if (!result) {
      return null;
    }


    return {
      numberOfPages: result.number_of_pages,
      goalType: result.goal_type,
    };
  } catch (error) {
    console.error('Error loading goal:', error);
    return null;
  }
};

/**
 * Удаление цели пользователя из локальной БД
 */
export const deleteGoal = async (): Promise<void> => {
  try {
    const database = await getDatabase();
    await database.runAsync(`DELETE FROM user_goal`);
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};


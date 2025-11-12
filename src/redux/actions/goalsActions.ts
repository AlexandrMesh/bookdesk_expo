import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import GoalsService from '~http/services/goals';
import { triggerReloadStat } from '~redux/actions/statisticActions';
import { AppThunkAPI } from '~redux/store/configureStore';
import { GoalType, IGoal } from '~types/goals';
import { deleteGoalItem, initDatabase, loadGoalItems, saveGoalItem, saveGoalItems } from '~utils/boardStorage';

const PREFIX = 'GOALS';

export const setGoal = createAction<{ pages: number; type: GoalType }>(`${PREFIX}/setGoal`);
export const clearData = createAction(`${PREFIX}/clearData`);

export const deleteUserGoalItem = createAsyncThunk(`${PREFIX}/deleteUserGoalItem`, async (id: string, { dispatch }: AppThunkAPI) => {
  try {
    // Удаляем из локальной БД
    await initDatabase();
    await deleteGoalItem(id);

    // Загружаем все items из локальной БД для обновления state
    const allItems = await loadGoalItems();

    dispatch(triggerReloadStat());

    // eslint-disable-next-line no-console
    console.log('📊 [deleteUserGoalItem] Goal item удален из локальной БД:', id);

    return allItems as IGoal[];
  } catch (error) {
    console.error('Error deleting goal item:', error);
    throw error;
  }
});

export const addGoal = createAsyncThunk(`${PREFIX}/addGoal`, async (params: { numberOfPages: string; type: GoalType }) => {
  try {
    await GoalsService().addGoal({ ...params });
    return {
      numberOfPages: Number(params.numberOfPages),
      type: params.type,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
});

export const updateGoal = createAsyncThunk(`${PREFIX}/updateGoal`, async (params: { numberOfPages: string; type: GoalType }) => {
  try {
    await GoalsService().updateGoal({ ...params });
    return {
      numberOfPages: Number(params.numberOfPages),
      type: params.type,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
});

export const getGoalItems = createAsyncThunk(`${PREFIX}/getGoalItems`, async () => {
  try {
    // Загружаем из локальной БД
    await initDatabase();
    const localGoalItems = await loadGoalItems();

    if (localGoalItems.length > 0) {
      // eslint-disable-next-line no-console
      console.log('📊 [getGoalItems] Загружены goal items из локальной БД');
      return localGoalItems as IGoal[];
    }

    // Если в локальной БД нет данных, загружаем с сервера (первый запуск)
    // eslint-disable-next-line no-console
    console.log('📊 [getGoalItems] Goal items в локальной БД нет, загружаем с сервера');
    const { data } = await GoalsService().getGoalItems();

    // Сохраняем в локальную БД
    if (data && data.length > 0) {
      try {
        await saveGoalItems(data);
        // eslint-disable-next-line no-console
        console.log('📊 [getGoalItems] Goal items сохранены в локальную БД');
      } catch (saveError) {
        console.error('Error saving goal items to local DB:', saveError);
      }
    }

    return data || [];
  } catch (error) {
    console.error(error);
    throw error;
  }
});

export const addGoalItem = createAsyncThunk(`${PREFIX}/addGoalItem`, async (pages: string | null, { dispatch }: AppThunkAPI) => {
  const addedAt = new Date().getTime();
  const pagesNumber = Number(pages) || 0;

  try {
    // Генерируем локальный ID
    const itemId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Сохраняем в локальную БД
    await initDatabase();
    await saveGoalItem(itemId, pagesNumber, addedAt);

    // Создаем объект для Redux state
    const newItem: IGoal = {
      _id: itemId,
      pages: pagesNumber,
      added_at: addedAt,
      type: 'daily' as GoalType, // Тип не важен для item, используется только для goal
    };

    // Загружаем все items из локальной БД для обновления state
    const allItems = await loadGoalItems();

    dispatch(triggerReloadStat());

    // eslint-disable-next-line no-console
    console.log('📊 [addGoalItem] Goal item добавлен в локальную БД:', itemId);

    return allItems as IGoal[];
  } catch (error) {
    console.error('Error adding goal item:', error);
    throw error;
  }
});

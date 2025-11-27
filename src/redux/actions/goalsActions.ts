import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { triggerReloadStat } from '~redux/actions/statisticActions';
import { AppThunkAPI } from '~redux/store/configureStore';
import { GoalType, IGoal } from '~types/goals';
import { deleteGoal, deleteGoalItem, initDatabase, loadGoal, loadGoalItems, saveGoal, saveGoalItem } from '~utils/boardStorage';

const PREFIX = 'GOALS';

export const setGoal = createAction<{ pages: number; type: GoalType }>(`${PREFIX}/setGoal`);

// Обновленный setGoal, который также сохраняет в локальную БД
export const setGoalWithSave = createAsyncThunk(`${PREFIX}/setGoalWithSave`, async ({ pages, type }: { pages: number; type: GoalType }) => {
  try {
    await initDatabase();
    await saveGoal(pages, type);
    return { pages, type };
  } catch (error) {
    console.error('Error saving goal:', error);
    return { pages, type };
  }
});

// Action для загрузки цели из локальной БД
export const loadGoalFromLocalDB = createAsyncThunk(`${PREFIX}/loadGoalFromLocalDB`, async () => {
  try {
    await initDatabase();
    const goal = await loadGoal();
    if (goal) {
      return {
        numberOfPages: goal.numberOfPages,
        type: goal.goalType as GoalType,
      };
    }
    return null;
  } catch (error) {
    console.error('Error loading goal from local DB:', error);
    return null;
  }
});

export const clearData = createAction(`${PREFIX}/clearData`);

// Action для удаления цели
export const deleteGoalAction = createAsyncThunk(`${PREFIX}/deleteGoal`, async () => {
  try {
    await initDatabase();
    await deleteGoal();
    return null;
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
});

export const deleteUserGoalItem = createAsyncThunk(`${PREFIX}/deleteUserGoalItem`, async (id: string, { dispatch }: AppThunkAPI) => {
  try {
    // Удаляем из локальной БД
    await initDatabase();
    await deleteGoalItem(id);

    // Загружаем все items из локальной БД для обновления state
    const allItems = await loadGoalItems();

    dispatch(triggerReloadStat());


    return allItems as IGoal[];
  } catch (error) {
    console.error('Error deleting goal item:', error);
    throw error;
  }
});

export const addGoal = createAsyncThunk(`${PREFIX}/addGoal`, async (params: { numberOfPages: string; type: GoalType }) => {
  try {
    const numberOfPages = Number(params.numberOfPages);

    // Сохраняем в локальную БД
    await initDatabase();
    await saveGoal(numberOfPages, params.type);


    return {
      numberOfPages,
      type: params.type,
    };
  } catch (error) {
    console.error('Error adding goal:', error);
    throw error;
  }
});

export const updateGoal = createAsyncThunk(`${PREFIX}/updateGoal`, async (params: { numberOfPages: string; type: GoalType }) => {
  try {
    const numberOfPages = Number(params.numberOfPages);

    // Сохраняем в локальную БД
    await initDatabase();
    await saveGoal(numberOfPages, params.type);


    return {
      numberOfPages,
      type: params.type,
    };
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
});

export const getGoalItems = createAsyncThunk(`${PREFIX}/getGoalItems`, async () => {
  try {
    // Загружаем из локальной БД
    await initDatabase();
    const localGoalItems = await loadGoalItems();

    return localGoalItems as IGoal[];
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


    return allItems as IGoal[];
  } catch (error) {
    console.error('Error adding goal item:', error);
    throw error;
  }
});

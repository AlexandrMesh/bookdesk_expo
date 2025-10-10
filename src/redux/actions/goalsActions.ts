import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import GoalsService from '~http/services/goals';
import { triggerReloadStat } from '~redux/actions/statisticActions';
import { AppThunkAPI } from '~redux/store/configureStore';
import { GoalType } from '~types/goals';

const PREFIX = 'GOALS';

export const setGoal = createAction<{ pages: number; type: GoalType }>(`${PREFIX}/setGoal`);
export const clearData = createAction(`${PREFIX}/clearData`);

export const deleteUserGoalItem = createAsyncThunk(`${PREFIX}/deleteUserGoalItem`, async (id: string, { dispatch }: AppThunkAPI) => {
  try {
    const { data } = await GoalsService().deleteUserGoalItem({ id });
    dispatch(triggerReloadStat());
    return data;
  } catch (error) {
    console.error(error);
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
    const { data } = await GoalsService().getGoalItems();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
});

export const addGoalItem = createAsyncThunk(`${PREFIX}/addGoalItem`, async (pages: string | null, { dispatch }: AppThunkAPI) => {
  const params = { pages, added_at: new Date().getTime() };
  try {
    const { data } = await GoalsService().addGoalItem({ ...params });
    dispatch(triggerReloadStat());
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
});

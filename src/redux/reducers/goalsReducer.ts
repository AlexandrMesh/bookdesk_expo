import { createReducer } from '@reduxjs/toolkit';

import { DAILY } from '~constants/goals';
import * as goalsActions from '~redux/actions/goalsActions';
import { IGoal, GoalType } from '~types/goals';

export interface IGoalState {
  numberOfPages: number | null;
  type: GoalType;
  data: IGoal[];
}

const getDefaultGoalState = (): IGoalState => ({
  numberOfPages: null,
  type: DAILY,
  data: [],
});

export interface IDefaultState {
  goal: IGoalState;
}

const getDefaultState = (): IDefaultState => ({
  goal: getDefaultGoalState(),
});

const defaultState = getDefaultState();

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(goalsActions.deleteUserGoalItem.fulfilled, (state, action) => {
      state.goal.data = action.payload;
    })
    .addCase(goalsActions.addGoal.fulfilled, (state, { payload: { numberOfPages, type } }) => {
      state.goal.numberOfPages = numberOfPages;
      state.goal.type = type;
    })
    .addCase(goalsActions.updateGoal.fulfilled, (state, { payload: { numberOfPages, type } }) => {
      state.goal.numberOfPages = numberOfPages;
      state.goal.type = type;
    })
    .addCase(goalsActions.getGoalItems.fulfilled, (state, action) => {
      state.goal.data = action.payload;
    })
    .addCase(goalsActions.addGoalItem.fulfilled, (state, action) => {
      state.goal.data = action.payload;
    })
    .addCase(goalsActions.setGoal, (state, { payload: { pages, type } }) => {
      state.goal.numberOfPages = pages;
      state.goal.type = type;
    })
    .addCase(goalsActions.setGoalWithSave.fulfilled, (state, { payload: { pages, type } }) => {
      state.goal.numberOfPages = pages;
      state.goal.type = type;
    })
    .addCase(goalsActions.loadGoalFromLocalDB.fulfilled, (state, action) => {
      if (action.payload) {
        state.goal.numberOfPages = action.payload.numberOfPages;
        state.goal.type = action.payload.type;
      }
    })
    .addCase(goalsActions.deleteGoalAction.fulfilled, (state) => {
      state.goal.numberOfPages = null;
      state.goal.type = DAILY;
    })
    .addCase(goalsActions.clearData, () => defaultState);
});

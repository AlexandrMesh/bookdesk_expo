import { createReducer } from '@reduxjs/toolkit';
import * as statisticActions from '~redux/actions/statisticActions';

export interface IDefaultState {
  shouldReloadStat: boolean;
}

const getDefaultState = (): IDefaultState => ({
  shouldReloadStat: false,
});

const defaultState = getDefaultState();

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(statisticActions.triggerReloadStat, (state) => {
      state.shouldReloadStat = true;
    })
    .addCase(statisticActions.loadStat.fulfilled, (state) => {
      state.shouldReloadStat = false;
    })
    .addCase(statisticActions.clearData, () => defaultState);
});

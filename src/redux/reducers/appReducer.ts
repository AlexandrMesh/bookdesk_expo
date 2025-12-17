import { createReducer } from '@reduxjs/toolkit';

import { IDLE } from '~constants/loadingStatuses';
import * as appActions from '~redux/actions/appActions';
import { ISupportApp } from '~types/app';
import { LoadingType } from '~types/loadingTypes';

const getDefaultSupportAppState = (): ISupportApp => ({
  confirmed: false,
  viewedAt: null,
});

export interface IAppState {
  supportApp: ISupportApp;
  loadingDataStatus: LoadingType;
  hiddenBoards: string[];
}

export const getDefaultState = (): IAppState => ({
  supportApp: getDefaultSupportAppState(),
  loadingDataStatus: IDLE,
  hiddenBoards: [],
});

const defaultState = getDefaultState();

export default createReducer(defaultState, (builder) => {
  builder.addCase(appActions.supportApp.fulfilled, (state, { payload: { confirmed, viewedAt } }) => {
    state.supportApp.confirmed = confirmed;
    state.supportApp.viewedAt = viewedAt;
  });
  builder.addCase(appActions.toggleBoardVisibility.fulfilled, (state, { payload }) => {
    state.hiddenBoards = payload;
  });
  builder.addCase(appActions.loadBoardSettings.fulfilled, (state, { payload }) => {
    state.hiddenBoards = payload;
  });
  builder.addCase(appActions.setHiddenBoards, (state, { payload }) => {
    state.hiddenBoards = payload;
  });
  builder.addCase(appActions.resetBoardSettings.fulfilled, (state, { payload }) => {
    state.hiddenBoards = payload;
  });
});

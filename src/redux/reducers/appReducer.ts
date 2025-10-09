import { createReducer } from '@reduxjs/toolkit';
import * as appActions from '~redux/actions/appActions';
import { IDLE } from '~constants/loadingStatuses';
import { LoadingType } from '~types/loadingTypes';
import { ISupportApp } from '~types/app';

const getDefaultSupportAppState = (): ISupportApp => ({
  confirmed: false,
  viewedAt: null,
});

export interface IAppState {
  supportApp: ISupportApp;
  loadingDataStatus: LoadingType;
}

export const getDefaultState = (): IAppState => ({
  supportApp: getDefaultSupportAppState(),
  loadingDataStatus: IDLE,
});

const defaultState = getDefaultState();

export default createReducer(defaultState, (builder) => {
  builder.addCase(appActions.supportApp.fulfilled, (state, { payload: { confirmed, viewedAt } }) => {
    state.supportApp.confirmed = confirmed;
    state.supportApp.viewedAt = viewedAt;
  });
});

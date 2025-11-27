import { createReducer } from '@reduxjs/toolkit';

import { IDLE, SUCCEEDED } from '~constants/loadingStatuses';
import * as authActions from '~redux/actions/authActions';
import { IProfile } from '~types/auth';
import { LoadingType } from '~types/loadingTypes';

const getDefaultProfileState = (): IProfile => ({
  _id: '',
  email: '',
  registered: null,
  updated: null,
  supportApp: {
    confirmed: false,
    viewedAt: null,
  },
  syncWithLocalDatabaseCompleted: false,
  syncDatabaseCompleted: false,
  isNewUser: false,
});

export interface IAuthState {
  profile: IProfile;
  checkingStatus: LoadingType;
}

export const getDefaultState = (): IAuthState => ({
  profile: getDefaultProfileState(),
  checkingStatus: IDLE,
});

const defaultState = getDefaultState();

export default createReducer(defaultState, (builder) => {
  builder.addCase(authActions.initializationComplete, (state, { payload: { profile } }) => {
    state.checkingStatus = SUCCEEDED;
    if (profile) {
      state.profile = profile;
    } else {
      state.profile = getDefaultProfileState();
    }
  });
});

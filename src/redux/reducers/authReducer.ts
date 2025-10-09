import { createReducer } from '@reduxjs/toolkit';
import * as authActions from '~redux/actions/authActions';
import { IDLE, PENDING, FAILED, SUCCEEDED } from '~constants/loadingStatuses';
import { IError, IProfile } from '~types/auth';
import { LoadingType } from '~types/loadingTypes';

export interface ISignUpState {
  isSignedUp: boolean;
  loadingDataStatus: LoadingType;
  errors: IError;
}

export interface ISignInState {
  isSignedIn: boolean;
  isGoogleAccount: boolean;
  loadingDataStatus: LoadingType;
  errors: IError;
}

const getDefaultErrorsState = (): IError => ({
  email: '',
  password: '',
});

const getDefaultSignUpState = (): ISignUpState => ({
  isSignedUp: false,
  loadingDataStatus: IDLE,
  errors: getDefaultErrorsState(),
});

const getDefaultSignInState = (): ISignInState => ({
  isSignedIn: false,
  isGoogleAccount: false,
  loadingDataStatus: IDLE,
  errors: getDefaultErrorsState(),
});

const getDefaultProfileState = (): IProfile => ({
  _id: '',
  email: '',
  registered: null,
  updated: null,
  supportApp: {
    confirmed: false,
    viewedAt: null,
  },
});

export interface IAuthState {
  profile: IProfile;
  signUp: ISignUpState;
  signIn: ISignInState;
  checkingStatus: LoadingType;
}

export const getDefaultState = (): IAuthState => ({
  profile: getDefaultProfileState(),
  signUp: getDefaultSignUpState(),
  signIn: getDefaultSignInState(),
  checkingStatus: IDLE,
});

const defaultState = getDefaultState();

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(authActions.signIn.pending, (state) => {
      state.signIn.loadingDataStatus = PENDING;
    })
    .addCase(authActions.signIn.fulfilled, (state, { payload: { profile, isGoogleAccount, isSignedIn } }) => {
      state.signIn.isSignedIn = isSignedIn;
      state.signIn.loadingDataStatus = SUCCEEDED;
      state.profile = profile;
      state.signIn.isGoogleAccount = isGoogleAccount;
    })
    .addCase(authActions.setSignInError, (state, { payload: { fieldName, error } }) => {
      state.signIn.errors[fieldName] = error as string;
    })
    .addCase(authActions.signInFailed.fulfilled, (state, { payload: { fieldName, error } }) => {
      state.signIn.loadingDataStatus = FAILED;
      state.signIn.errors[fieldName] = error as string;
    })
    .addCase(authActions.signUp.pending, (state) => {
      state.signUp.loadingDataStatus = PENDING;
    })
    .addCase(authActions.signUp.fulfilled, (state, { payload: { profile, isSignedIn } }) => {
      state.signIn.isSignedIn = isSignedIn;
      state.signIn.loadingDataStatus = SUCCEEDED;
      state.profile = profile;
    })
    .addCase(authActions.signUp.rejected, (state) => {
      state.signUp.loadingDataStatus = FAILED;
    })
    .addCase(authActions.setSignUpError, (state, { payload: { fieldName, error } }) => {
      state.signUp.errors[fieldName] = error as string;
    })
    .addCase(authActions.checkAuth.pending, (state) => {
      state.checkingStatus = PENDING;
    })
    .addCase(authActions.checkAuth.fulfilled, (state, { payload: { profile, isGoogleAccount, isSignedIn } }) => {
      state.signIn.isSignedIn = isSignedIn;
      state.signIn.loadingDataStatus = SUCCEEDED;
      state.checkingStatus = SUCCEEDED;
      state.signIn.isGoogleAccount = isGoogleAccount;
      state.profile = profile;
    })
    .addCase(authActions.checkAuth.rejected, (state) => {
      state.checkingStatus = FAILED;
    })
    .addCase(authActions.authCheckingFailed, (state) => {
      state.checkingStatus = FAILED;
    })
    .addCase(authActions.signOut.fulfilled, (state) => {
      state.profile = getDefaultProfileState();
      state.signUp = getDefaultSignUpState();
      state.signIn = getDefaultSignInState();
    });
});

import { RootState } from '~redux/store/configureStore';

type StateWithAuth = Pick<RootState, 'auth'>;

const getAuth = (state: StateWithAuth) => state.auth;
const getSignIn = (state: StateWithAuth) => getAuth(state).signIn;
const getSignUp = (state: StateWithAuth) => getAuth(state).signUp;
const getProfile = (state: StateWithAuth) => getAuth(state).profile;

export const getUserId = (state: StateWithAuth) => getProfile(state)._id;
export const getUserEmail = (state: StateWithAuth) => getProfile(state).email;
export const getRegistered = (state: StateWithAuth) => getProfile(state).registered;
export const getSupportAppViewedAt = (state: StateWithAuth) => getProfile(state).supportApp?.viewedAt;
export const getSignInLoadingDataStatus = (state: StateWithAuth) => getSignIn(state).loadingDataStatus;

export const getIsSignedIn = (state: StateWithAuth) => getSignIn(state).isSignedIn;
export const getSignInErrors = (state: StateWithAuth) => getSignIn(state).errors;

export const getIsSignedUp = (state: StateWithAuth) => getSignUp(state).isSignedUp;
export const getSignUpLoadingDataStatus = (state: StateWithAuth) => getSignUp(state).loadingDataStatus;
export const getSignUpErrors = (state: StateWithAuth) => getSignUp(state).errors;

export const getCheckingStatus = (state: StateWithAuth) => getAuth(state).checkingStatus;

import { RootState } from '~redux/store/configureStore';

type StateWithAuth = Pick<RootState, 'auth'>;

const getAuth = (state: StateWithAuth) => state.auth;
const getProfile = (state: StateWithAuth) => getAuth(state).profile;

export const getUserId = (state: StateWithAuth) => getProfile(state)._id;
export const getUserEmail = (state: StateWithAuth) => getProfile(state).email;
export const getRegistered = (state: StateWithAuth) => getProfile(state).registered;
export const getSupportAppViewedAt = (state: StateWithAuth) => getProfile(state).supportApp?.viewedAt;

export const getCheckingStatus = (state: StateWithAuth) => getAuth(state).checkingStatus;

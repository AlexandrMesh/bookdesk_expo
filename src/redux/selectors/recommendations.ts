import { RootState } from '~redux/store/configureStore';

export const getRecommendations = (state: RootState) => state.recommendations.recommendations;

export const getRecommendationsLoadingStatus = (state: RootState) => state.recommendations.loadingStatus;

export const getRecommendationsError = (state: RootState) => state.recommendations.error;

export const getRecommendationsLastUpdated = (state: RootState) => state.recommendations.lastUpdated;

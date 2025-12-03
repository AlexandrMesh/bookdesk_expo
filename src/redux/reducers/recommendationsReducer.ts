import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { IDLE, PENDING, SUCCEEDED, FAILED } from '~constants/loadingStatuses';
import { loadRecommendations, clearRecommendations } from '~redux/actions/recommendationsActions';
import { LoadingType } from '~types/loadingTypes';
import { IRecommendedBook } from '~utils/aiRecommendations';

interface RecommendationsState {
  recommendations: IRecommendedBook[];
  loadingStatus: LoadingType;
  error: string | null;
  lastUpdated: number | null;
}

const initialState: RecommendationsState = {
  recommendations: [],
  loadingStatus: IDLE,
  error: null,
  lastUpdated: null,
};

const recommendationsSlice = createSlice({
  name: 'recommendations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Clear recommendations
    builder.addCase(clearRecommendations, (state) => {
      state.recommendations = [];
      state.loadingStatus = IDLE;
      state.error = null;
    });

    // Load recommendations
    builder.addCase(loadRecommendations.pending, (state) => {
      state.loadingStatus = PENDING;
      state.error = null;
    });
    builder.addCase(loadRecommendations.fulfilled, (state, action: PayloadAction<IRecommendedBook[]>) => {
      state.recommendations = action.payload;
      state.loadingStatus = SUCCEEDED;
      state.lastUpdated = Date.now();
      state.error = null;
    });
    builder.addCase(loadRecommendations.rejected, (state, action) => {
      state.loadingStatus = FAILED;
      state.error = (action.payload as string) || 'UNKNOWN_ERROR';
    });
  },
});

export default recommendationsSlice.reducer;

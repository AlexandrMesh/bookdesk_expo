import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { COMPLETED, IN_PROGRESS, PLANNED } from '~constants/boardType';
import { AppThunkAPI } from '~redux/store/configureStore';
import { BookStatus, IBook } from '~types/books';
import {
  generateRecommendations,
  generateDefaultRecommendations,
  IRecommendedBook,
  clearRecommendationsCache,
  getCachedRecommendations,
} from '~utils/aiRecommendations';
import { loadAllBoardData } from '~utils/boardStorage';

const PREFIX = 'RECOMMENDATIONS';

// Simple actions
export const clearRecommendations = createAction(`${PREFIX}/clearRecommendations`);

/**
 * Extract books from BoardData array
 */
const extractBooksFromBoardData = (boardDataArray: { data: IBook[] }[]): IBook[] => {
  return boardDataArray.flatMap((bd) => bd.data || []);
};

export const loadRecommendations = createAsyncThunk(
  `${PREFIX}/loadRecommendations`,
  async (forceRefresh: boolean = false, { rejectWithValue }: AppThunkAPI) => {
    try {
      // Check if we have valid cached data first (and not forcing refresh)
      if (!forceRefresh) {
        const cached = await getCachedRecommendations();
        if (cached && cached.books.length > 0 && !cached.isExpired) {
          return cached.books;
        }
      }

      // Load user's books from local database
      const completedBoardData = await loadAllBoardData(COMPLETED as BookStatus, [], '', '', 'ru');
      const inProgressBoardData = await loadAllBoardData(IN_PROGRESS as BookStatus, [], '', '', 'ru');
      const plannedBoardData = await loadAllBoardData(PLANNED as BookStatus, [], '', '', 'ru');

      // Extract books from board data
      const completedBooks = extractBooksFromBoardData(completedBoardData);
      const inProgressBooks = extractBooksFromBoardData(inProgressBoardData);
      const plannedBooks = extractBooksFromBoardData(plannedBoardData);

      // Combine books for analysis (prioritize completed and in-progress)
      const allUserBooks: IBook[] = [...completedBooks, ...inProgressBooks, ...plannedBooks];

      let recommendations: IRecommendedBook[];

      if (allUserBooks.length === 0) {
        // For new users, show default/popular recommendations
        recommendations = await generateDefaultRecommendations(forceRefresh);
      } else {
        // Generate personalized recommendations based on user's library
        recommendations = await generateRecommendations(allUserBooks, forceRefresh);
      }

      if (recommendations.length === 0) {
        return rejectWithValue('NO_RECOMMENDATIONS_FOUND');
      }

      return recommendations;
    } catch (error: any) {
      const errorMessage = error.message || 'UNKNOWN_ERROR';
      return rejectWithValue(errorMessage);
    }
  },
);

export const refreshRecommendations = createAsyncThunk(`${PREFIX}/refreshRecommendations`, async (_, { dispatch }) => {
  await clearRecommendationsCache();
  dispatch(clearRecommendations());
  // Force refresh to get new recommendations
  return dispatch(loadRecommendations(true));
});

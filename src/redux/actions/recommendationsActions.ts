import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { COMPLETED, IN_PROGRESS, PLANNED } from '~constants/boardType';
import { AppThunkAPI } from '~redux/store/configureStore';
import i18n from '~translations/i18n';
import { BookStatus, IBook, IRating } from '~types/books';
import {
  generateRecommendations,
  generateDefaultRecommendations,
  IRecommendedBook,
  clearRecommendationsCache,
  getCachedRecommendations,
} from '~utils/aiRecommendations';
import { loadAllBoardData, loadBookRatings } from '~utils/boardStorage';

const PREFIX = 'RECOMMENDATIONS';
const MIN_BOOKS_FOR_PERSONALIZATION = 10;

// Simple actions
export const clearRecommendations = createAction(`${PREFIX}/clearRecommendations`);

/**
 * Extract books from BoardData array
 */
const extractBooksFromBoardData = (boardDataArray: { data: IBook[] }[]): IBook[] => {
  return boardDataArray.flatMap((bd) => bd.data || []);
};

/**
 * Merge ratings into books
 */
const mergeRatingsIntoBooks = (books: IBook[], ratings: IRating[]): IBook[] => {
  const ratingsMap = new Map(ratings.map((r) => [r.bookId, r.rating]));
  return books.map((book) => ({
    ...book,
    rating: ratingsMap.get(book.bookId) || book.rating,
  }));
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

      // Load user's books from local database (all books, no filters)
      const currentLanguage = i18n.language || 'ru';
      const completedBoardData = await loadAllBoardData(COMPLETED as BookStatus, [], '', '', currentLanguage);
      const inProgressBoardData = await loadAllBoardData(IN_PROGRESS as BookStatus, [], '', '', currentLanguage);
      const plannedBoardData = await loadAllBoardData(PLANNED as BookStatus, [], '', '', currentLanguage);

      // Extract books from board data
      const completedBooks = extractBooksFromBoardData(completedBoardData);
      const inProgressBooks = extractBooksFromBoardData(inProgressBoardData);
      const plannedBooks = extractBooksFromBoardData(plannedBoardData);

      // Load user ratings
      const ratings = await loadBookRatings();

      // Merge ratings into books
      const completedWithRatings = mergeRatingsIntoBooks(completedBooks, ratings);
      const inProgressWithRatings = mergeRatingsIntoBooks(inProgressBooks, ratings);
      const plannedWithRatings = mergeRatingsIntoBooks(plannedBooks, ratings);

      // Combine books for analysis (prioritize completed and in-progress)
      const allUserBooks: IBook[] = [...completedWithRatings, ...inProgressWithRatings, ...plannedWithRatings];

      let recommendations: IRecommendedBook[];

      // Logic: If user has less than 10 books → show top popular books
      //        If user has 10+ books → generate personalized recommendations based on their library
      if (allUserBooks.length < MIN_BOOKS_FOR_PERSONALIZATION) {
        // For new users with less than 10 books, show popular bestsellers
        recommendations = await generateDefaultRecommendations(forceRefresh);
      } else {
        // Generate personalized recommendations based on user's library analysis
        recommendations = await generateRecommendations(allUserBooks, forceRefresh);
      }

      if (recommendations.length === 0) {
        return rejectWithValue('NO_RECOMMENDATIONS_FOUND');
      }

      return recommendations;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
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

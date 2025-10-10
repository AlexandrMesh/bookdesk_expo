import { createAction } from '@reduxjs/toolkit';
import { BookStatus } from '~types/books';

const PREFIX = 'SHARED';

// Actions used by both booksActions and customBookActions
export const updateSuggestedBook = createAction<{ bookId: string; bookStatus: BookStatus; added: number }>(`${PREFIX}/updateSuggestedBook`);
export const updateCustomBook = createAction<{ bookId: string; bookStatus: BookStatus; added: number }>(`${PREFIX}/updateCustomBook`);
export const updateBookVotesInSuggestedBook = createAction<{ bookId: string; votesCount: number }>(`${PREFIX}/updateBookVotesInSuggestedBook`);
export const updateBookVotesInCustomBook = createAction<{ bookId: string; votesCount: number }>(`${PREFIX}/updateBookVotesInCustomBook`);
export const updateBookOnBoardAndSearch = createAction<{
  bookId: string;
  bookStatus: BookStatus;
  title: string;
  pages: number;
  authorsList: string[];
}>(`${PREFIX}/updateBookOnBoardAndSearch`);
export const triggerReloadBookList = createAction<BookStatus>(`${PREFIX}/triggerReloadBookList`);

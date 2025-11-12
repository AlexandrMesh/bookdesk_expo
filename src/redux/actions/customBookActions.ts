import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import {
  removeBookFromBoardAndSearch,
  updateBookVotesInCustomBook as sharedUpdateBookVotesInCustomBook,
  updateBookVotesInSuggestedBook as sharedUpdateBookVotesInSuggestedBook,
  updateCustomBook as sharedUpdateCustomBook,
  updateSuggestedBook as sharedUpdateSuggestedBook,
  updateBookOnBoardAndSearch,
} from '~redux/actions/sharedActions';
import { deriveCustomBookParams, getNewCustomBookNameValue, getStatus } from '~redux/selectors/customBook';
import { AppThunkAPI } from '~redux/store/configureStore';
import i18n from '~translations/i18n';
import { BookStatus } from '~types/books';
import type { IBook } from '~types/books';
import { loadSuggestedCovers as loadSuggestedCoversUtil } from '~utils/coversLoader';

const PREFIX = 'CUSTOM_BOOKS';

export const submitCategory = createAction(`${PREFIX}/submitCategory`);
export const clearAddCustomBookState = createAction(`${PREFIX}/clearAddCustomBookState`);
export const toggleExpandedCategoryCustomBooks = createAction<string>(`${PREFIX}/toggleExpandedCategoryCustomBooks`);
export const selectCategory = createAction<{ path: string; label: string }>(`${PREFIX}/selectCategory`);
export const setSearchQuery = createAction<string>(`${PREFIX}/setSearchQuery`);
export const clearCategory = createAction(`${PREFIX}/clearCategory`);
export const setStatus = createAction<BookStatus>(`${PREFIX}/setStatus`);
export const setNewCustomBookName = createAction<{ name: string; error: string | null }>(`${PREFIX}/setNewCustomBookName`);
export const setAvailableStep = createAction<number>(`${PREFIX}/setAvailableStep`);
export const setCurrentStep = createAction<number>(`${PREFIX}/setCurrentStep`);
export const setPages = createAction<{ pages: string | null; error: string | null }>(`${PREFIX}/setPages`);
export const addAuthor = createAction<string>(`${PREFIX}/addAuthor`);
export const updateAuthor = createAction<{ id: string; name: string; error: string | null }>(`${PREFIX}/updateAuthor`);
export const removeAuthor = createAction<string>(`${PREFIX}/removeAuthor`);
export const submitAuthors = createAction(`${PREFIX}/submitAuthors`);
export const selectCover = createAction<string>(`${PREFIX}/selectCover`);
export const setShouldAddCover = createAction<boolean | undefined>(`${PREFIX}/setShouldAddCover`);
export const setAnnotation = createAction<{ annotation: string; error: string | null }>(`${PREFIX}/setAnnotation`);
export const setAnnotationError = createAction<string | null>(`${PREFIX}/setAnnotationError`);
export const clearStep2 = createAction(`${PREFIX}/clearStep2`);
export const clearStep3 = createAction(`${PREFIX}/clearStep3`);
export const clearSuggestedBooks = createAction(`${PREFIX}/clearSuggestedBooks`);
export const clearData = createAction(`${PREFIX}/clearData`);
export const triggerReloadCustomBookList = createAction(`${PREFIX}/triggerReloadCustomBookList`);

export const loadSuggestedCovers = createAsyncThunk(`${PREFIX}/loadSuggestedCovers`, async (_, { getState }: AppThunkAPI) => {
  const state = getState();
  const bookName = getNewCustomBookNameValue(state);
  return loadSuggestedCoversUtil(bookName);
});

export const addCustomBook = createAsyncThunk(`${PREFIX}/addCustomBook`, async (_, { dispatch, getState }: AppThunkAPI) => {
  const { language } = i18n;
  const state = getState();
  const bookStatus = getStatus(state);
  const customBookParams = deriveCustomBookParams(state);
  const params = { ...customBookParams, language } as Record<string, unknown>;
  try {
    // Локальное сохранение: генерируем id и сохраняем статусы/дату в SQLite
    const bookId = `custom_${Date.now()}`;
    const added = Date.now();

    // Сохраняем дату/статус локально
    try {
      const { saveBookDate } = await import('~utils/boardStorage');
      await saveBookDate(bookId, added, (bookStatus as BookStatus) || null);
    } catch (e) {
      console.error('Failed to save custom book in SQLite', e);
    }

    // Обновляем Redux: добавляем книгу на текущую доску и в поиск
    const response = {
      bookId,
      title: params.title as string,
      pages: (params.pages as number) || 0,
      authorsList: (params.authorsList as string[]) || [],
      annotation: '',
      bookStatus: (bookStatus as BookStatus) || null,
      coverPath: (params.coverPath as string) || undefined,
      added,
      categoryPath: params.categoryPath as string,
    };
    dispatch(updateBookOnBoardAndSearch(response));
    dispatch(triggerReloadCustomBookList());

    // Сохраняем книгу в кэш board_data для выбранной доски, чтобы после перезапуска она загрузилась из локальной БД
    try {
      const { addBookToCache } = await import('~utils/boardStorage');
      await addBookToCache((bookStatus as BookStatus) || null, response as IBook);
    } catch (e) {
      console.error('Failed to cache custom book in board_data', e);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
});

export const updateUserCustomBook = createAsyncThunk(
  `${PREFIX}/updateCustomBook`,
  async (
    params: {
      bookId: string;
      pages: string;
      title: string;
      authorsList: string[];
      annotation: string;
      bookStatus: BookStatus;
      coverPath?: string;
    },
    { dispatch }: AppThunkAPI,
  ) => {
    try {
      // Локальное обновление: обновляем книгу в Redux и кэше
      const response = {
        bookId: params.bookId,
        title: params.title,
        pages: Number(params.pages) || 0,
        authorsList: params.authorsList,
        annotation: params.annotation || '',
        bookStatus: params.bookStatus,
        coverPath: params.coverPath,
      };
      dispatch(updateBookOnBoardAndSearch(response));

      // Обновляем книгу в кэше board_data
      try {
        const { updateBookInCache } = await import('~utils/boardStorage');
        await updateBookInCache(params.bookId, response);
      } catch (e) {
        console.error('Failed to update custom book in board_data cache', e);
      }

      return response;
    } catch (error) {
      console.error(error);
      return {
        bookId: '',
        title: '',
        pages: 0,
        authorsList: [],
        annotation: '',
        bookStatus: '' as unknown as BookStatus,
      };
    }
  },
);

export const deleteCustomBook = createAsyncThunk(
  `${PREFIX}/deleteCustomBook`,
  async (bookId: string, { dispatch }: AppThunkAPI) => {
    try {
      // Удаляем книгу из кэша board_data и связанных таблиц
      try {
        const { removeBookFromCache } = await import('~utils/boardStorage');
        await removeBookFromCache(bookId);
      } catch (e) {
        console.error('Failed to remove custom book from board_data cache', e);
      }

      // Удаляем книгу из Redux state через action
      dispatch(removeBookFromBoardAndSearch(bookId));
      dispatch(triggerReloadCustomBookList());

      return bookId;
    } catch (error) {
      console.error('Error deleting custom book:', error);
      throw error;
    }
  },
);

// Re-export shared actions for backward compatibility
export const updateSuggestedBook = sharedUpdateSuggestedBook;
export const updateCustomBook = sharedUpdateCustomBook;
export const updateBookVotesInSuggestedBook = sharedUpdateBookVotesInSuggestedBook;
export const updateBookVotesInCustomBook = sharedUpdateBookVotesInCustomBook;

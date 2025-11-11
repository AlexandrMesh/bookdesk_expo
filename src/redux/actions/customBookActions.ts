import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { ALL } from '~constants/boardType';
import { PAGE_SIZE } from '~constants/bookList';
import { EN, RU } from '~constants/languages';
import DataService from '~http/services/books';
import CustomBooksService from '~http/services/customBooks';
import {
  updateBookVotesInCustomBook as sharedUpdateBookVotesInCustomBook,
  updateBookVotesInSuggestedBook as sharedUpdateBookVotesInSuggestedBook,
  updateCustomBook as sharedUpdateCustomBook,
  updateSuggestedBook as sharedUpdateSuggestedBook,
  triggerReloadBookList,
  updateBookOnBoardAndSearch,
} from '~redux/actions/sharedActions';
import {
  deriveCustomBookParams,
  getCustomBooksData,
  getCustomBooksHasNextPage,
  getCustomBooksPageIndex,
  getNewCustomBookNameValue,
  getStatus,
  getSuggestedBooksSortParams,
} from '~redux/selectors/customBook';
import { AppThunkAPI } from '~redux/store/configureStore';
import i18n from '~translations/i18n';
import { BookStatus } from '~types/books';

const PREFIX = 'CUSTOM_BOOKS';

export const submitCategory = createAction(`${PREFIX}/submitCategory`);
export const clearCategory = createAction(`${PREFIX}/clearCategory`);
export const clearAddCustomBookState = createAction(`${PREFIX}/clearAddCustomBookState`);
export const clearStep2 = createAction(`${PREFIX}/clearStep2`);
export const clearStep3 = createAction(`${PREFIX}/clearStep3`);
export const setCurrentStep = createAction<number>(`${PREFIX}/setCurrentStep`);
export const setAvailableStep = createAction<number>(`${PREFIX}/setAvailableStep`);
export const addAuthor = createAction<string>(`${PREFIX}/addAuthor`);
export const setAnnotation = createAction<{ annotation: string; error: string | null | undefined }>(`${PREFIX}/setAnnotation`);
export const setAnnotationError = createAction<any>(`${PREFIX}/setAnnotationError`);
export const updateAuthor = createAction<{ id: string; name: string; error: string | null | undefined }>(`${PREFIX}/updateAuthor`);
export const removeAuthor = createAction<string>(`${PREFIX}/removeAuthor`);
export const setPages = createAction<{ pages: string | null; error: string | null | undefined }>(`${PREFIX}/setPages`);
export const selectCover = createAction<string>(`${PREFIX}/selectCover`);
export const setSearchQuery = createAction<string>(`${PREFIX}/setSearchQuery`);
export const setShouldAddCover = createAction<boolean>(`${PREFIX}/setShouldAddCover`);
export const setNewCustomBookName = createAction<{ name: string; error: string | null }>(`${PREFIX}/setNewCustomBookName`);
export const allowToAddBook = createAction<boolean>(`${PREFIX}/allowToAddBook`);
export const setNewCustomBookError = createAction<string>(`${PREFIX}/setNewCustomBookError`);
export const clearSuggestedBooks = createAction(`${PREFIX}/clearSuggestedBooks`);
export const toggleExpandedCategoryCustomBooks = createAction<string>(`${PREFIX}/toggleExpandedCategoryCustomBooks`);
export const selectCategory = createAction<{ path: string; label: string }>(`${PREFIX}/selectCategory`);
export const setStatus = createAction<BookStatus>(`${PREFIX}/setStatus`);
export const triggerReloadCustomBookList = createAction(`${PREFIX}/triggerReloadCustomBookList`);
export const clearData = createAction(`${PREFIX}/clearData`);

export const loadSuggestedBooks = createAsyncThunk(`${PREFIX}/loadSuggestedBooks`, async (bookName: string, { getState }: AppThunkAPI) => {
  const state = getState();
  const sortParams = getSuggestedBooksSortParams(state);
  const { language } = i18n;

  const params = {
    limit: 10,
    pageIndex: 0,
    boardType: ALL,
    title: bookName,
    sortType: sortParams.type,
    sortDirection: sortParams.direction,
    language,
  };

  try {
    const { data: dataBookList } = (await DataService().getBookList({ ...params })) || {};
    return {
      error: null,
      data: dataBookList.items || [],
      totalItems: dataBookList.pagination?.totalItems || 0,
      hasNextPage: dataBookList.pagination?.hasNextPage || false,
      allowToAddBook: true,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
});

export const loadCustomBookList = createAsyncThunk(
  `${PREFIX}/loadCustomBookList`,
  async ({ shouldLoadMoreResults }: { shouldLoadMoreResults: boolean }, { getState }: AppThunkAPI) => {
    const state = getState();
    const { language } = i18n;
    const pageIndex = getCustomBooksPageIndex(state);

    const params = {
      pageIndex: shouldLoadMoreResults ? pageIndex + 1 : 0,
      limit: PAGE_SIZE,
      language,
    };

    try {
      const result = await CustomBooksService().getCustomBooks({ ...params });
      const { items, pagination } = result?.data[0] || {};
      return {
        data: items || [],
        totalItems: pagination?.totalItems,
        hasNextPage: pagination?.hasNextPage,
        shouldLoadMoreResults,
      };
    } catch (error) {
      console.error(error);
      return {
        data: [],
        totalItems: 0,
        hasNextPage: false,
        shouldLoadMoreResults: false,
      };
    }
  },
);

export const loadMoreBooks = createAsyncThunk(`${PREFIX}/loadMoreBooks`, async (_, { dispatch, getState }: AppThunkAPI) => {
  const state = getState();
  const hasNextPage = getCustomBooksHasNextPage(state);
  const bookList = getCustomBooksData(state);
  try {
    if (bookList.length >= PAGE_SIZE && hasNextPage) {
      await dispatch(loadCustomBookList({ shouldLoadMoreResults: true }));
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
});

export const loadSuggestedCovers = createAsyncThunk(`${PREFIX}/loadSuggestedCovers`, async (_, { getState }: AppThunkAPI) => {
  const state = getState();
  const bookName = getNewCustomBookNameValue(state);
  const { language } = i18n;

  try {
    const query = language === RU ? `${bookName} книга` : `${bookName} book`;
    const gl = language === RU ? 'ru' : 'us';

    const { data } = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        gl,
        searchType: 'image',
        key: 'AIzaSyD0Gx2sBVthtxNrNGLZwQYVpGSeKaBnvUM',
        q: query,
        cx: '42a8480a652154a54',
        num: 10,
      },
    });

    const items =
      data.items
        ?.filter(({ fileFormat }: { fileFormat: string }) => fileFormat === 'image/jpeg' || fileFormat === 'image/png' || fileFormat === 'image/webp')
        .map(({ link }: { link: string }) => ({
          coverPath: link,
        })) || [];

    return items;
  } catch (error) {
    console.error('Error loading suggested covers:', error);
    throw error;
  }
});

export const addCustomBook = createAsyncThunk(`${PREFIX}/addCustomBook`, async (_, { dispatch, getState }: AppThunkAPI) => {
  const { language } = i18n;
  const state = getState();
  const bookStatus = getStatus(state);
  const customBookParams = deriveCustomBookParams(state);
  const params = { ...customBookParams, language };
  try {
    await CustomBooksService().addCustomBook({ ...params });
    if (bookStatus !== ALL) {
      // ставим метку о том что надо перезагрузить определенную доску где произошли изменения (добавилась книга например)
      dispatch(triggerReloadBookList(bookStatus));
    }
    dispatch(triggerReloadCustomBookList());
  } catch (error) {
    console.error(error);
    throw error;
  }
});

export const updateUserCustomBook = createAsyncThunk(
  `${PREFIX}/updateCustomBook`,
  async (
    params: { bookId: string; pages: string; title: string; authorsList: string[]; annotation: string; bookStatus: BookStatus },
    { dispatch }: AppThunkAPI,
  ) => {
    const { language } = i18n;
    try {
      const { data } = await CustomBooksService().updateCustomBook({ ...params, language });
      const response = {
        bookId: data._id,
        title: data.title,
        pages: data.pages,
        authorsList: data.authorsList,
        annotation: data.annotation,
        bookStatus: params.bookStatus,
      };
      dispatch(updateBookOnBoardAndSearch(response));
      return response;
    } catch (error) {
      console.error(error);
      return {
        bookId: '',
        title: '',
        pages: '',
        authorsList: [],
        annotation: '',
        bookStatus: '',
      };
    }
  },
);

// Re-export shared actions for backward compatibility
export const updateSuggestedBook = sharedUpdateSuggestedBook;
export const updateCustomBook = sharedUpdateCustomBook;
export const updateBookVotesInSuggestedBook = sharedUpdateBookVotesInSuggestedBook;
export const updateBookVotesInCustomBook = sharedUpdateBookVotesInCustomBook;

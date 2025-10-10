import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import difference from 'lodash/difference';
import intersection from 'lodash/intersection';

import { ALL } from '~constants/boardType';
import { PAGE_SIZE } from '~constants/bookList';
import DataService from '~http/services/books';
import {
  triggerReloadBookList as sharedTriggerReloadBookList,
  updateBookOnBoardAndSearch as sharedUpdateBookOnBoardAndSearch,
  updateBookVotesInCustomBook,
  updateBookVotesInSuggestedBook,
  updateCustomBook,
  updateSuggestedBook,
} from '~redux/actions/sharedActions';
import { triggerReloadStat } from '~redux/actions/statisticActions';
import {
  deriveBookListData,
  deriveBookListHasNextPage,
  deriveBookListPageIndex,
  deriveBookListSortParams,
  deriveBookListTotalItems,
  deriveFilterBookCategoryPaths,
  deriveManageTopLevelCategorySelection,
  deriveNestedCategories,
  deriveSearchQuery,
  getBookToUpdate,
  getCategoriesData,
  getSearchQuery,
  getSearchResults,
  getSearchResultsHasNextPage,
  getSearchResultsPageIndex,
  getSearchSortParams,
  getShouldReloadCategories,
} from '~redux/selectors/books';
import { AppThunkAPI } from '~redux/store/configureStore';
import i18n from '~translations/i18n';
import { BookStatus, IBook, IBookNote, IRating, IVote } from '~types/books';

const PREFIX = 'BOOKS';

export const userBookRatingsLoaded = createAction<IRating[]>(`${PREFIX}/userBookRatingsLoaded`);
export const setBookToUpdate = createAction<{ bookId: string; bookStatus: BookStatus; added: number }>(`${PREFIX}/setBookToUpdate`);
export const setBoardType = createAction<BookStatus>(`${PREFIX}/setBoardType`);
export const showModal = createAction<string>(`${PREFIX}/showModal`);
export const hideModal = createAction(`${PREFIX}/hideModal`);
export const searchCategory = createAction<{ boardType: BookStatus; query: string }>(`${PREFIX}/searchCategory`);
export const clearSearchQueryForCategory = createAction<BookStatus>(`${PREFIX}/clearSearchQueryForCategory`);
export const resetCategories = createAction<BookStatus>(`${PREFIX}/resetCategories`);
export const clearBookDetails = createAction(`${PREFIX}/clearBookDetails`);
export const toggleExpandedCategoryBooks = createAction<{ path: string; boardType: BookStatus }>(`${PREFIX}/toggleExpandedCategoryBooks`);
export const addToIndeterminatedCategories = createAction<{ boardType: BookStatus; value: string }>(`${PREFIX}/addToIndeterminatedCategories`);
export const clearIndeterminatedCategories = createAction<{ boardType: BookStatus; path: string }>(`${PREFIX}/toggleExpandedCategory`);
export const setBookVotes = createAction<IVote[]>(`${PREFIX}/setBookVotes`);
export const setBookNotes = createAction<IBookNote[]>(`${PREFIX}/setBookNotes`);
export const triggerReloadSearchResults = createAction(`${PREFIX}/triggerReloadSearchResults`);
export const clearBooksData = createAction(`${PREFIX}/clearBooksData`);
export const clearDataForChangeLanguage = createAction(`${PREFIX}/clearDataForChangeLanguage`);
export const clearSearchResults = createAction(`${PREFIX}/clearSearchResults`);
export const triggerShouldNotClearSearchQuery = createAction(`${PREFIX}/triggerShouldNotClearSearchQuery`);
export const addFilterValue = createAction<{ boardType: BookStatus; filterParam: string; value: string | string[] }>(`${PREFIX}/addFilterValue`);
export const removeFilterValue = createAction<{ boardType: BookStatus; filterParam: string; value: string | string[] }>(
  `${PREFIX}/removeFilterValue`,
);
export const setSearchQueryAction = createAction<string>(`${PREFIX}/setSearchQueryAction`);
export const clearFilters = createAction<BookStatus>(`${PREFIX}/clearFilters`);
export const clearAllFilters = createAction<BookStatus>(`${PREFIX}/clearAllFilters`);
export const populateFilters = createAction<BookStatus>(`${PREFIX}/populateFilters`);

export const manageTopLevelCategorySelection = (path: string, boardType: BookStatus) => (dispatch: any, getState: any) => {
  const { shouldSelectTopLevelCategory, shouldUnselectTopLevelCategory, shouldIndeterminateTopLevelCategory, categoryPath } =
    deriveManageTopLevelCategorySelection(path, boardType)(getState()) || {};
  // if we click on the first or the second level categories we should clear indeterminate state
  dispatch(clearIndeterminatedCategories({ boardType, path }));
  // очищать только топ 1 и топ 2 категорийй в indeterminated
  if ((shouldIndeterminateTopLevelCategory || []).length > 0) {
    dispatch(addToIndeterminatedCategories({ boardType, value: shouldIndeterminateTopLevelCategory as string }));
  }
  if (shouldSelectTopLevelCategory) {
    dispatch(addFilterValue({ boardType, filterParam: 'categoryPaths', value: categoryPath as string }));
  } else if (shouldUnselectTopLevelCategory) {
    dispatch(removeFilterValue({ boardType, filterParam: 'categoryPaths', value: categoryPath as string }));
  }
};

export const setSearchQuery = (query: string) => (dispatch: any, getState: any) => {
  const searchQuery = getSearchQuery(getState());
  if (searchQuery.toLowerCase().trim() !== query.toLowerCase().trim()) {
    dispatch(setSearchQueryAction(query));
    dispatch(triggerReloadSearchResults());
  }
};

const addAndManageFilters = (path: string, boardType: BookStatus, filterParam: string, value: string | string[]) => (dispatch: any) => {
  dispatch(addFilterValue({ boardType, filterParam, value }));
  dispatch(manageTopLevelCategorySelection(path, boardType));
};

const removeAndManageFilters = (path: string, boardType: BookStatus, filterParam: string, value: string[] | string) => (dispatch: any) => {
  dispatch(removeFilterValue({ boardType, filterParam, value }));
  dispatch(manageTopLevelCategorySelection(path, boardType));
};

export const manageFilters = (path: string, boardType: BookStatus, categoryPaths: string[]) => (dispatch: any, getState: any) => {
  const nestedCategories = deriveNestedCategories(path)(getState());
  const intersectedCategories = intersection(categoryPaths, nestedCategories);
  if (nestedCategories.length > 0) {
    if (intersectedCategories.length === nestedCategories.length && difference(nestedCategories, intersectedCategories).length === 0) {
      return dispatch(removeAndManageFilters(path, boardType, 'categoryPaths', nestedCategories));
    }
    dispatch(addAndManageFilters(path, boardType, 'categoryPaths', nestedCategories));
  } else if (categoryPaths.includes(path)) {
    return dispatch(removeAndManageFilters(path, boardType, 'categoryPaths', path));
  } else {
    return dispatch(addAndManageFilters(path, boardType, 'categoryPaths', path));
  }
  // remove if click on top level all multi selection category
  return undefined;
};

export const loadSearchResults = createAsyncThunk(
  `${PREFIX}/loadSearchResults`,
  async (param: { shouldLoadMoreResults: boolean; boardType: BookStatus }, { getState }: AppThunkAPI) => {
    const state = getState();
    const pageIndex = getSearchResultsPageIndex(state);
    const searchText = deriveSearchQuery(state);
    const sortParams = getSearchSortParams(state);
    const { language } = i18n;

    const params = {
      limit: PAGE_SIZE,
      pageIndex: param.shouldLoadMoreResults ? pageIndex + 1 : 0,
      boardType: param.boardType || ALL,
      title: searchText,
      sortType: sortParams.type,
      sortDirection: sortParams.direction,
      language,
    };
    try {
      const { data } = (await DataService().getBookList({ ...params })) || {};
      const { items, pagination } = data || {};
      return {
        boardType: ALL,
        data: items || [],
        totalItems: pagination?.totalItems || 0,
        hasNextPage: pagination?.hasNextPage || false,
        shouldLoadMoreResults: param.shouldLoadMoreResults,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
);

export const getSimilarBooks = createAsyncThunk(
  `${PREFIX}/getSimilarBooks`,
  async ({ bookId, categoryPath }: { bookId: string; categoryPath: string | undefined }) => {
    const { language } = i18n;

    const params = {
      bookId,
      categoryPath,
      language,
    };
    try {
      const { data } = (await DataService().getSimilarBooks({ ...params })) || {};
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
);

export const loadBookList = createAsyncThunk(
  `${PREFIX}/loadBookList`,
  async ({ boardType, shouldLoadMoreResults }: { boardType: BookStatus; shouldLoadMoreResults: boolean }, { getState }: AppThunkAPI) => {
    const state = getState();
    const pageIndex = deriveBookListPageIndex(boardType)(state);
    const filterParams = deriveFilterBookCategoryPaths(boardType)(state);
    const sortParams = deriveBookListSortParams(boardType)(state);
    const { language } = i18n;

    const params = {
      pageIndex: shouldLoadMoreResults ? pageIndex + 1 : 0,
      limit: PAGE_SIZE,
      boardType,
      categoryPaths: filterParams,
      sortType: sortParams.type,
      sortDirection: sortParams.direction,
      language,
    };

    try {
      const { data } =
        boardType !== ALL && !shouldLoadMoreResults ? await DataService().getBooksCountByYear({ boardType, language }) : { data: null };
      const result = await DataService().getBookList({ ...params });
      const { items, pagination } = result?.data || {};
      return {
        boardType,
        data: items || [],
        totalItems: pagination?.totalItems,
        hasNextPage: pagination?.hasNextPage,
        shouldLoadMoreResults,
        booksCountByYear: data,
      };
    } catch (error) {
      console.error(error);
      throw boardType;
    }
  },
);

export const loadMoreBooks = createAsyncThunk(`${PREFIX}/loadMoreBooks`, async (boardType: BookStatus, { dispatch, getState }: AppThunkAPI) => {
  const state = getState();
  const hasNextPage = deriveBookListHasNextPage(boardType)(state);
  const bookList = deriveBookListData(boardType)(state);
  try {
    if (bookList.length >= PAGE_SIZE && hasNextPage) {
      await dispatch(loadBookList({ boardType, shouldLoadMoreResults: true }));
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
});

export const loadCategories = createAsyncThunk(`${PREFIX}/loadCategories`, async (shouldRewrite: boolean, { getState }: AppThunkAPI) => {
  const state = getState();
  const categories = getCategoriesData(state);
  const shouldReloadCategories = getShouldReloadCategories(state);
  const { language } = i18n;
  if (categories.length === 0 || shouldReloadCategories || shouldRewrite) {
    try {
      const { data } = (await DataService().getCategories({ language })) || {};
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
});

export const loadBookDetails = createAsyncThunk(`${PREFIX}/loadBookDetails`, async (bookId: string) => {
  try {
    const { data } = (await DataService().getBookDetails({ bookId })) || {};
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
});

export const loadMoreSearchResults = createAsyncThunk(
  `${PREFIX}/loadMoreSearchResults`,
  async (boardType: BookStatus, { dispatch, getState }: AppThunkAPI) => {
    const state = getState();
    const hasNextPage = getSearchResultsHasNextPage(state);
    const bookList = getSearchResults(state);
    try {
      if (bookList.length >= PAGE_SIZE && hasNextPage) {
        await dispatch(loadSearchResults({ shouldLoadMoreResults: true, boardType }));
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
);

export const reloadBookList = createAsyncThunk(
  `${PREFIX}/reloadBookList`,
  async (boardType: BookStatus | null, { dispatch, getState }: AppThunkAPI) => {
    const state = getState();
    const bookList = deriveBookListData(boardType as BookStatus)(state);
    const totalItems = deriveBookListTotalItems(boardType as BookStatus)(state);

    // for reloading data if we removed all items from page and we have some other items as well
    if (bookList.length === 0 && bookList.length < totalItems) {
      dispatch(triggerReloadBookList(boardType as BookStatus));
    }
  },
);

export const updateUserBookAddedDate = createAsyncThunk(
  `${PREFIX}/updateUserBookAddedDate`,
  async (added: number, { dispatch, getState }: AppThunkAPI) => {
    try {
      const { language } = i18n;
      const { bookId, bookStatus } = getBookToUpdate(getState());
      const { data } = await DataService().updateUserBookAddedValue({ bookId, date: added, language, boardType: bookStatus });

      dispatch(updateSuggestedBook({ bookId, bookStatus, added: data.added }));
      dispatch(updateCustomBook({ bookId, bookStatus, added: data.added }));
      dispatch(triggerReloadStat());

      return {
        bookStatus,
        countByYear: data.countByYear,
        added: data.added,
        bookId,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
);

export const deleteUserComment = createAsyncThunk(`${PREFIX}/deleteUserComment`, async (bookId: string) => {
  try {
    await DataService().deleteUserComment({ bookId });
    return bookId;
  } catch (error) {
    console.error(error);
    throw error;
  }
});

export const deleteUserBookRating = createAsyncThunk(`${PREFIX}/deleteUserBookRating`, async (bookId: string) => {
  try {
    const { data } = await DataService().deleteUserBookRating({ bookId });
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
});

export const updateUserBook = createAsyncThunk(
  `${PREFIX}/updateUserBook`,
  async (
    { book, newBookStatus, added, boardType }: { book: IBook; newBookStatus: BookStatus; added: number; boardType: BookStatus },
    { dispatch }: AppThunkAPI,
  ) => {
    const { language } = i18n;
    const { bookId, bookStatus } = book;
    try {
      const { data } = await DataService().updateUserBook({ bookId, added, bookStatus: newBookStatus, language, boardType: bookStatus });

      if (newBookStatus === ALL) {
        await dispatch(deleteUserComment(bookId));
        await dispatch(deleteUserBookRating(bookId));
      }
      // It's because we don't want to refresh all books list to preserve scrolling
      dispatch(updateSuggestedBook({ bookId, bookStatus: data.bookStatus, added: data.added }));
      dispatch(updateCustomBook({ bookId, bookStatus: data.bookStatus, added: data.added }));

      dispatch(triggerReloadStat());

      return {
        boardType,
        currentBookStatus: bookStatus as BookStatus,
        countByYear: data.countByYear,
        bookId,
        bookStatus: data.bookStatus,
        added: data.added,
        newBookStatus,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
);

export const updateUserComment = createAsyncThunk(
  `${PREFIX}/updateUserComment`,
  async ({ bookId, comment, added }: { bookId: string; comment: string; added: number }) => {
    try {
      const { data } = await DataService().updateUserComment({ bookId, added, comment });
      return {
        bookId,
        comment: data.comment,
        added: data.added,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
);

export const updateUserBookRating = createAsyncThunk(
  `${PREFIX}/updateUserBookRating`,
  async ({ bookId, rating, added }: { bookId: string; rating: number; added: number }) => {
    try {
      const { data } = await DataService().updateUserBookRating({ bookId, added, rating });
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
);

export const updateBookVotes = createAsyncThunk(
  `${PREFIX}/updateBookVotes`,
  async ({ bookId, shouldAdd, bookStatus }: { bookId: string; shouldAdd: boolean; bookStatus: BookStatus }, { dispatch }: AppThunkAPI) => {
    try {
      const { data } = await DataService().updateBookVotes({ bookId, shouldAdd });

      dispatch(updateBookVotesInSuggestedBook({ bookId, votesCount: data.votesCount }));
      dispatch(updateBookVotesInCustomBook({ bookId, votesCount: data.votesCount }));
      return {
        userVotes: data.userVotes,
        votesCount: data.votesCount,
        bookStatus,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
);

// Re-export shared actions for backward compatibility
export const triggerReloadBookList = sharedTriggerReloadBookList;
export const updateBookOnBoardAndSearch = sharedUpdateBookOnBoardAndSearch;

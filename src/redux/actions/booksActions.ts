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
import {
  deleteBookNote,
  initDatabase,
  loadBoardData,
  saveBoardData,
  saveBookDate,
  saveBookNote,
  saveBookRating,
  saveBookStatus,
  saveBookVotesCount,
  saveUserVotes,
  updateBookDateInCache,
  updateBookStatusInCache,
  updateBookVotesInCache,
} from '~utils/boardStorage';

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
  async (
    { boardType, shouldLoadMoreResults, forceRefresh }: { boardType: BookStatus; shouldLoadMoreResults: boolean; forceRefresh?: boolean },
    { getState }: AppThunkAPI,
  ) => {
    const state = getState();
    const pageIndex = deriveBookListPageIndex(boardType)(state);
    const filterParams = deriveFilterBookCategoryPaths(boardType)(state);
    const sortParams = deriveBookListSortParams(boardType)(state);
    const { language } = i18n;

    const targetPageIndex = shouldLoadMoreResults ? pageIndex + 1 : 0;

    // Инициализируем базу данных
    try {
      await initDatabase();
    } catch (error) {
      console.error('Error initializing database:', error);
    }

    // Пытаемся загрузить из кэша, если не принудительное обновление и не загружаем больше результатов
    if (!forceRefresh && !shouldLoadMoreResults) {
      try {
        const sortType = (sortParams.type ?? '') as string;
        const sortDirection = (sortParams.direction ?? '') as string;
        const cachedData = await loadBoardData(boardType, targetPageIndex, filterParams, sortType, sortDirection, language);
        if (cachedData) {
          // eslint-disable-next-line no-console
          console.log('✅ [loadBookList] Используются данные из локального кэша');

          // Загружаем booksCountByYear отдельно, если нужно
          let booksCountByYear = cachedData.booksCountByYear;
          if (boardType !== ALL && !booksCountByYear) {
            try {
              // eslint-disable-next-line no-console
              console.log('   Загрузка booksCountByYear с сервера...');
              const { data } = await DataService().getBooksCountByYear({ boardType, language });
              booksCountByYear = data;
            } catch (error) {
              console.error('Error loading booksCountByYear:', error);
            }
          }

          return {
            boardType,
            data: cachedData.data,
            totalItems: cachedData.totalItems,
            hasNextPage: cachedData.hasNextPage,
            shouldLoadMoreResults: false,
            booksCountByYear,
            fromCache: true,
          };
        } else {
          // eslint-disable-next-line no-console
          console.log('❌ [loadBookList] Данные не найдены в локальном кэше, загрузка с сервера...');
        }
      } catch (error) {
        console.error('Error loading from cache:', error);
        // Продолжаем загрузку с сервера в случае ошибки
      }
    } else {
      if (forceRefresh) {
        // eslint-disable-next-line no-console
        console.log('🔄 [loadBookList] Принудительное обновление - загрузка с сервера');
      } else {
        // eslint-disable-next-line no-console
        console.log('📄 [loadBookList] Загрузка следующей страницы с сервера');
      }
    }

    // Загружаем с сервера
    const params = {
      pageIndex: targetPageIndex,
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

      const responseData = {
        boardType,
        data: items || [],
        totalItems: pagination?.totalItems,
        hasNextPage: pagination?.hasNextPage,
        shouldLoadMoreResults,
        booksCountByYear: data,
        fromCache: false,
      };

      // Сохраняем в кэш
      try {
        // eslint-disable-next-line no-console
        console.log('💾 [loadBookList] Сохранение данных в локальный кэш...');
        const sortType = (sortParams.type ?? '') as string;
        const sortDirection = (sortParams.direction ?? '') as string;

        // Сохраняем даты и статусы книг отдельно
        if (items && items.length > 0) {
          for (const book of items) {
            try {
              if (book.added && book.bookStatus) {
                await saveBookDate(book.bookId, book.added, book.bookStatus);
              } else if (book.bookStatus) {
                // Сохраняем только статус, если даты нет
                await saveBookStatus(book.bookId, book.bookStatus);
              } else if (book.added) {
                // Сохраняем только дату, если статуса нет
                await saveBookDate(book.bookId, book.added);
              }
            } catch (error) {
              console.error(`Error saving date/status for book ${book.bookId}:`, error);
            }
          }
        }

        await saveBoardData(
          boardType,
          targetPageIndex,
          filterParams,
          sortType,
          sortDirection,
          language,
          items || [],
          pagination?.totalItems || 0,
          pagination?.hasNextPage || false,
          data,
        );
        // eslint-disable-next-line no-console
        console.log('✅ [loadBookList] Данные успешно сохранены в кэш');
      } catch (error) {
        console.error('Error saving to cache:', error);
        // Не прерываем выполнение, если не удалось сохранить в кэш
      }

      return responseData;
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
      const { bookId, bookStatus } = getBookToUpdate(getState());

      // eslint-disable-next-line no-console
      console.log('📅 [updateUserBookAddedDate] Обновление даты книги через локальную БД');
      // eslint-disable-next-line no-console
      console.log(`   bookId: ${bookId}`);
      // eslint-disable-next-line no-console
      console.log(`   bookStatus: ${bookStatus}`);
      // eslint-disable-next-line no-console
      console.log(`   новая дата: ${new Date(added).toLocaleDateString()}`);

      // Обновляем в локальной БД
      await updateBookDateInCache(bookId, added, bookStatus);

      dispatch(updateSuggestedBook({ bookId, bookStatus, added }));
      dispatch(updateCustomBook({ bookId, bookStatus, added }));
      dispatch(triggerReloadStat());

      // eslint-disable-next-line no-console
      console.log('✅ [updateUserBookAddedDate] Дата успешно обновлена в локальной БД');

      return {
        bookStatus,
        countByYear: null, // Не загружаем с сервера
        added,
        bookId,
      };
    } catch (error) {
      console.error('Error updating book date:', error);
      throw error;
    }
  },
);

export const deleteUserComment = createAsyncThunk(`${PREFIX}/deleteUserComment`, async (bookId: string) => {
  try {
    // eslint-disable-next-line no-console
    console.log('🗑️ [deleteUserComment] Удаление заметки через локальную БД');
    // eslint-disable-next-line no-console
    console.log(`   bookId: ${bookId}`);

    // Удаляем из локальной БД
    await deleteBookNote(bookId);

    // eslint-disable-next-line no-console
    console.log('✅ [deleteUserComment] Заметка успешно удалена из локальной БД');

    return bookId;
  } catch (error) {
    console.error('Error deleting user comment:', error);
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
    const { bookId, bookStatus } = book;
    try {
      // eslint-disable-next-line no-console
      console.log('📝 [updateUserBook] Изменение статуса книги через локальную БД');
      // eslint-disable-next-line no-console
      console.log(`   bookId: ${bookId}`);
      // eslint-disable-next-line no-console
      console.log(`   старый статус: ${bookStatus}`);
      // eslint-disable-next-line no-console
      console.log(`   новый статус: ${newBookStatus}`);
      // eslint-disable-next-line no-console
      console.log(`   дата: ${new Date(added).toLocaleDateString()}`);

      // Обновляем в локальной БД
      // updateBookStatusInCache обновляет статус книги во всех записях кэша
      await updateBookStatusInCache(bookId, newBookStatus, added);

      // НЕ очищаем кэш - updateBookStatusInCache уже обновил статус во всех записях кэша
      // При следующей загрузке из кэша будут использованы обновленные данные

      if (newBookStatus === ALL) {
        // Удаляем комментарий и рейтинг локально
        // eslint-disable-next-line no-console
        console.log(`   Удаление комментария и рейтинга для книги ${bookId}`);
      }

      // It's because we don't want to refresh all books list to preserve scrolling
      dispatch(updateSuggestedBook({ bookId, bookStatus: newBookStatus, added }));
      dispatch(updateCustomBook({ bookId, bookStatus: newBookStatus, added }));

      dispatch(triggerReloadStat());

      // eslint-disable-next-line no-console
      console.log('✅ [updateUserBook] Статус книги успешно обновлен в локальной БД');

      return {
        boardType,
        currentBookStatus: bookStatus as BookStatus,
        countByYear: null, // Не загружаем с сервера
        bookId,
        bookStatus: newBookStatus,
        added,
        newBookStatus,
      };
    } catch (error) {
      console.error('Error updating book status:', error);
      throw error;
    }
  },
);

export const updateUserComment = createAsyncThunk(
  `${PREFIX}/updateUserComment`,
  async ({ bookId, comment, added }: { bookId: string; comment: string; added: number }, { getState }: AppThunkAPI) => {
    try {
      // eslint-disable-next-line no-console
      console.log('📝 [updateUserComment] Обновление заметки через локальную БД');
      // eslint-disable-next-line no-console
      console.log(`   bookId: ${bookId}`);
      // eslint-disable-next-line no-console
      console.log(`   comment: ${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}`);
      // eslint-disable-next-line no-console
      console.log(`   дата: ${new Date(added).toLocaleDateString()}`);

      // Сохраняем в локальную БД
      await saveBookNote(bookId, comment, added);

      // Redux state обновится через reducer на основе возвращаемых данных
      const state = getState();
      const currentNotes = state.books.bookNotes || [];
      const existingNoteIndex = currentNotes.findIndex((note: IBookNote) => note.bookId === bookId);

      if (existingNoteIndex !== -1) {
        // eslint-disable-next-line no-console
        console.log(`   Обновлена существующая заметка`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`   Добавлена новая заметка`);
      }

      // eslint-disable-next-line no-console
      console.log('✅ [updateUserComment] Заметка обновлена в Redux state и сохранена в локальную БД');

      return {
        bookId,
        comment,
        added,
      };
    } catch (error) {
      console.error('Error updating user comment:', error);
      throw error;
    }
  },
);

export const updateUserBookRating = createAsyncThunk(
  `${PREFIX}/updateUserBookRating`,
  async ({ bookId, rating, added }: { bookId: string; rating: number; added: number }, { getState }: AppThunkAPI) => {
    try {
      // eslint-disable-next-line no-console
      console.log('⭐ [updateUserBookRating] Обновление рейтинга книги через локальную БД');
      // eslint-disable-next-line no-console
      console.log(`   bookId: ${bookId}`);
      // eslint-disable-next-line no-console
      console.log(`   рейтинг: ${rating}`);
      // eslint-disable-next-line no-console
      console.log(`   дата: ${new Date(added).toLocaleDateString()}`);

      // Получаем текущие рейтинги из state
      const state = getState();
      const currentRatings = state.books.bookRatings || [];

      // Обновляем или добавляем рейтинг
      const existingRatingIndex = currentRatings.findIndex((r: IRating) => r.bookId === bookId);
      let updatedRatings: IRating[];

      if (existingRatingIndex !== -1) {
        // Обновляем существующий рейтинг
        updatedRatings = currentRatings.map((r: IRating, index: number) => (index === existingRatingIndex ? { ...r, rating } : r));
        // eslint-disable-next-line no-console
        console.log(`   Обновлен существующий рейтинг (было: ${currentRatings[existingRatingIndex].rating})`);
      } else {
        // Добавляем новый рейтинг
        updatedRatings = [...currentRatings, { bookId, rating }];
        // eslint-disable-next-line no-console
        console.log(`   Добавлен новый рейтинг`);
      }

      // Сохраняем рейтинг в локальную БД
      await saveBookRating(bookId, rating);

      // eslint-disable-next-line no-console
      console.log('✅ [updateUserBookRating] Рейтинг обновлен в Redux state и сохранен в локальную БД');

      // Возвращаем обновленный массив рейтингов (reducer ожидает IRating[])
      return updatedRatings;
    } catch (error) {
      console.error('Error updating book rating:', error);
      throw error;
    }
  },
);

export const updateBookVotes = createAsyncThunk(
  `${PREFIX}/updateBookVotes`,
  async ({ bookId, shouldAdd, bookStatus }: { bookId: string; shouldAdd: boolean; bookStatus: BookStatus }, { dispatch, getState }: AppThunkAPI) => {
    try {
      // eslint-disable-next-line no-console
      console.log('👍 [updateBookVotes] Обновление лайков книги через локальную БД');
      // eslint-disable-next-line no-console
      console.log(`   bookId: ${bookId}`);
      // eslint-disable-next-line no-console
      console.log(`   действие: ${shouldAdd ? 'добавить лайк' : 'убрать лайк'}`);

      // Получаем текущее количество лайков из state
      const state = getState();
      const currentBook = state.books.board[bookStatus]?.data?.find((book: IBook) => book.bookId === bookId);
      const currentVotesCount = currentBook?.votesCount || 0;
      const newVotesCount = shouldAdd ? currentVotesCount + 1 : Math.max(0, currentVotesCount - 1);

      // Обновляем в локальной БД
      await updateBookVotesInCache(bookId, newVotesCount);
      await saveBookVotesCount(bookId, newVotesCount);

      // Обновляем userVotes в Redux state и сохраняем в БД
      const currentUserVotes = state.books.bookVotes || [];
      const existingVoteIndex = currentUserVotes.findIndex((v: IVote) => v.bookId === bookId);
      let updatedUserVotes: IVote[];

      if (shouldAdd) {
        if (existingVoteIndex !== -1) {
          // Увеличиваем счетчик
          updatedUserVotes = currentUserVotes.map((v: IVote, index: number) => (index === existingVoteIndex ? { ...v, count: v.count + 1 } : v));
        } else {
          // Добавляем новый лайк
          updatedUserVotes = [...currentUserVotes, { bookId, count: 1 }];
        }
      } else {
        if (existingVoteIndex !== -1) {
          const existingVote = currentUserVotes[existingVoteIndex];
          if (existingVote.count > 1) {
            // Уменьшаем счетчик
            updatedUserVotes = currentUserVotes.map((v: IVote, index: number) => (index === existingVoteIndex ? { ...v, count: v.count - 1 } : v));
          } else {
            // Удаляем лайк
            updatedUserVotes = currentUserVotes.filter((v: IVote, index: number) => index !== existingVoteIndex);
          }
        } else {
          updatedUserVotes = currentUserVotes;
        }
      }

      // Сохраняем userVotes в локальную БД
      await saveUserVotes(updatedUserVotes);

      // Обновляем в Redux state
      dispatch(updateBookVotesInSuggestedBook({ bookId, votesCount: newVotesCount }));
      dispatch(updateBookVotesInCustomBook({ bookId, votesCount: newVotesCount }));

      // eslint-disable-next-line no-console
      console.log(`✅ [updateBookVotes] Лайки обновлены: ${currentVotesCount} → ${newVotesCount}`);
      // eslint-disable-next-line no-console
      console.log(`   UserVotes обновлены: ${currentUserVotes.length} → ${updatedUserVotes.length} записей`);

      return {
        userVotes: updatedUserVotes,
        votesCount: newVotesCount,
        bookStatus,
      };
    } catch (error) {
      console.error('Error updating book votes:', error);
      throw error;
    }
  },
);

// Re-export shared actions for backward compatibility
export const triggerReloadBookList = sharedTriggerReloadBookList;
export const updateBookOnBoardAndSearch = sharedUpdateBookOnBoardAndSearch;

import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import difference from 'lodash/difference';
import intersection from 'lodash/intersection';

import { ALL } from '~constants/boardType';
import { SEARCH_RESULTS_LIMIT } from '~constants/bookList';
import {
  removeBookFromBoardAndSearch as sharedRemoveBookFromBoardAndSearch,
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
  getSearchSortParams,
  getShouldReloadCategories,
} from '~redux/selectors/books';
import { AppThunkAPI } from '~redux/store/configureStore';
import i18n from '~translations/i18n';
import { BookStatus, IBook, IBookNote, ICategory, IRating, IVote } from '~types/books';
import {
  deleteBookNote,
  initDatabase,
  initializeCategoriesFromJson,
  loadBoardData,
  loadCategories as loadCategoriesFromDB,
  saveBoardData,
  saveBookDate,
  saveBookNote,
  saveBookRating,
  saveBookStatus,
  saveBookVotesCount,
  searchBooksInCache,
  saveUserVotes,
  updateBookDateInCache,
  updateBookStatusInCache,
  updateBookVotesInCache,
} from '~utils/boardStorage';

const PREFIX = 'BOOKS';

const syncBooksTableWithCache = async (books: IBook[]) => {
  if (!books || books.length === 0) {
    return;
  }

  try {
    const { saveBooks } = await import('~utils/database/books');
    await saveBooks(books);
  } catch (error) {
    console.error('Error syncing unified books table from cache:', error);
  }
};

/**
 * Подсчет количества книг по месяцам из массива книг
 */
const calculateBooksCountByYear = (books: IBook[], language: string): Array<{ monthAndYear: string; count: number }> => {
  const monthCountMap = new Map<string, number>();

  books.forEach((book) => {
    if (book.added) {
      const date = new Date(book.added);
      const monthAndYear = date.toLocaleString(language, { month: 'long', year: 'numeric' });
      monthCountMap.set(monthAndYear, (monthCountMap.get(monthAndYear) || 0) + 1);
    }
  });

  return Array.from(monthCountMap.entries())
    .map(([monthAndYear, count]) => ({ monthAndYear, count }))
    .sort((a, b) => {
      // Сортируем по дате (новые сначала)
      const dateA = new Date(a.monthAndYear);
      const dateB = new Date(b.monthAndYear);
      return dateB.getTime() - dateA.getTime();
    });
};

export const userBookRatingsLoaded = createAction<IRating[]>(`${PREFIX}/userBookRatingsLoaded`);
export const setBookToUpdate = createAction<{ bookId: string; bookStatus: BookStatus; added: number }>(`${PREFIX}/setBookToUpdate`);
export const setBoardType = createAction<BookStatus>(`${PREFIX}/setBoardType`);
export const showModal = createAction<string>(`${PREFIX}/showModal`);
export const hideModal = createAction(`${PREFIX}/hideModal`);
export const setCoverUrl = createAction<string>(`${PREFIX}/setCoverUrl`);
export const searchCategory = createAction<{ boardType: BookStatus; query: string }>(`${PREFIX}/searchCategory`);
export const clearSearchQueryForCategory = createAction<BookStatus>(`${PREFIX}/clearSearchQueryForCategory`);
export const resetCategories = createAction<BookStatus>(`${PREFIX}/resetCategories`);
export const toggleExpandedCategoryBooks = createAction<{ path: string; boardType: BookStatus }>(`${PREFIX}/toggleExpandedCategoryBooks`);
export const addToIndeterminatedCategories = createAction<{ boardType: BookStatus; value: string }>(`${PREFIX}/addToIndeterminatedCategories`);
export const clearIndeterminatedCategories = createAction<{ boardType: BookStatus; path: string }>(`${PREFIX}/toggleExpandedCategory`);
export const setBookVotes = createAction<IVote[]>(`${PREFIX}/setBookVotes`);
export const setBookNotes = createAction<IBookNote[]>(`${PREFIX}/setBookNotes`);
export const setCategories = createAction<ICategory[]>(`${PREFIX}/setCategories`);
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
    const searchText = deriveSearchQuery(state);
    const sortParams = getSearchSortParams(state);
    const { language } = i18n;

    // Инициализируем базу данных
    try {
      await initDatabase();
    } catch (error) {
      console.error('Error initializing database:', error);
    }

    // Поиск в локальной БД
    try {
      const sortType = (sortParams.type ?? '') as string;
      const sortDirection = (sortParams.direction ?? '') as string;
      const searchBoardType = param.boardType || ALL;


      const foundBooks = await searchBooksInCache(searchText, searchBoardType, sortType, sortDirection, language);
      const limitedBooks = foundBooks.slice(0, SEARCH_RESULTS_LIMIT);


      return {
        boardType: ALL,
        data: limitedBooks,
        totalItems: limitedBooks.length,
        hasNextPage: false, // Больше не используем пагинацию
        shouldLoadMoreResults: false,
      };
    } catch (error) {
      console.error('Error searching in cache:', error);
      // В случае ошибки возвращаем пустой результат
      return {
        boardType: ALL,
        data: [],
        totalItems: 0,
        hasNextPage: false,
        shouldLoadMoreResults: false,
      };
    }
  },
);

const loadBookListFromCache = async (
  { boardType, shouldLoadMoreResults }: { boardType: BookStatus; shouldLoadMoreResults: boolean },
  { getState }: AppThunkAPI,
) => {

  const state = getState();
  const pageIndex = deriveBookListPageIndex(boardType)(state);
  const filterParams = deriveFilterBookCategoryPaths(boardType)(state);
  const sortParams = deriveBookListSortParams(boardType)(state);
  const { language } = i18n;


  const targetPageIndex = shouldLoadMoreResults ? pageIndex + 1 : 0;

  try {
    await initDatabase();
  } catch (error) {
    console.error('Error initializing database:', error);
  }


  try {
    const sortType = (sortParams.type ?? '') as string;
    const sortDirection = (sortParams.direction ?? '') as string;
    const cachedData = await loadBoardData(boardType, targetPageIndex, filterParams, sortType, sortDirection, language);

    if (cachedData) {


      let booksCountByYear: any = null;
      if (boardType !== ALL && cachedData.data && cachedData.data.length > 0) {
        booksCountByYear = calculateBooksCountByYear(cachedData.data, language);
      }

      const returnPayload = {
        boardType,
        data: cachedData.data,
        totalItems: cachedData.data.length,
        hasNextPage: false,
        shouldLoadMoreResults: false,
        booksCountByYear,
        fromCache: true,
      };


      await syncBooksTableWithCache((cachedData.data || []) as IBook[]);

      return returnPayload;
    }

    return {
      boardType,
      data: [],
      totalItems: 0,
      hasNextPage: false,
      shouldLoadMoreResults: false,
      booksCountByYear: null,
      fromCache: true,
    };
  } catch (error) {
    console.error('Error loading from local DB:', error);
    return {
      boardType,
      data: [],
      totalItems: 0,
      hasNextPage: false,
      shouldLoadMoreResults: false,
      booksCountByYear: null,
      fromCache: true,
    };
  }
};

export const loadBookList = createAsyncThunk(
  `${PREFIX}/loadBookList`,
  async (params: { boardType: BookStatus; shouldLoadMoreResults: boolean }, thunkAPI: AppThunkAPI) => loadBookListFromCache(params, thunkAPI),
);

export const loadBookListFromLocalDB = createAsyncThunk(
  `${PREFIX}/loadBookListFromLocalDB`,
  async (params: { boardType: BookStatus; shouldLoadMoreResults: boolean }, thunkAPI: AppThunkAPI) => loadBookListFromCache(params, thunkAPI),
);

export const loadCategories = createAsyncThunk(`${PREFIX}/loadCategories`, async (shouldRewrite: boolean, { getState }: AppThunkAPI) => {
  const state = getState();
  const categories = getCategoriesData(state);
  const shouldReloadCategories = getShouldReloadCategories(state);
  const { language } = i18n;

  // Инициализируем базу данных
  try {
    await initDatabase();
  } catch (error) {
    console.error('Error initializing database:', error);
  }

  // Пытаемся загрузить из локальной БД, если не принудительное обновление
  if (!shouldRewrite && !shouldReloadCategories && categories.length > 0) {
    // Если категории уже есть в state, используем их
    return categories;
  }

  // Всегда загружаем категории локально (из БД или из TS файла)
  try {
    const cachedCategories = await loadCategoriesFromDB(language);
    if (cachedCategories.length > 0) {
      return cachedCategories;
    }

    // Если категорий нет в БД, загружаем из TS файла и сохраняем в БД
    const categoriesFromTs = await initializeCategoriesFromJson(language);
    if (categoriesFromTs.length > 0) {
      return categoriesFromTs;
    }

    // Если и из TS файла не удалось загрузить, возвращаем пустой массив
    return [];
  } catch (error) {
    console.error('Error loading categories:', error);
    // В случае ошибки пытаемся загрузить из TS файла
    try {
      const categoriesFromTs = await initializeCategoriesFromJson(language);
      if (categoriesFromTs.length > 0) {
        return categoriesFromTs;
      }
    } catch (tsError) {
      console.error('Error loading categories from TS file:', tsError);
    }
    return [];
  }
});

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


      // Обновляем в локальной БД
      await updateBookDateInCache(bookId, added, bookStatus);

      dispatch(updateSuggestedBook({ bookId, bookStatus, added }));
      dispatch(updateCustomBook({ bookId, bookStatus, added }));
      dispatch(triggerReloadStat());


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

    // Удаляем из локальной БД
    await deleteBookNote(bookId);


    return bookId;
  } catch (error) {
    console.error('Error deleting user comment:', error);
    throw error;
  }
});

export const deleteUserBookRating = createAsyncThunk(`${PREFIX}/deleteUserBookRating`, async (bookId: string, { getState }: AppThunkAPI) => {
  try {

    // Удаляем из локальной БД
    const { deleteBookRating } = await import('~utils/boardStorage');
    await deleteBookRating(bookId);

    // Получаем текущие рейтинги из state и удаляем нужный
    const state = getState();
    const currentRatings = state.books.bookRatings || [];
    const updatedRatings = currentRatings.filter((r: IRating) => r.bookId !== bookId);


    return updatedRatings;
  } catch (error) {
    console.error('Error deleting user book rating:', error);
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

      // Обновляем в локальной БД
      // updateBookStatusInCache обновляет статус книги во всех записях кэша
      // Передаем полный объект книги, чтобы сохранить все данные (название, авторы, страницы и т.д.)
      const updatedBook = { ...book, bookStatus: newBookStatus, added };
      await updateBookStatusInCache(bookId, newBookStatus, added, updatedBook);

      // Убеждаемся, что книга есть в board_data для новой доски
      // Это важно для новых пользователей, у которых может не быть записей в board_data
      const { addBookToCache } = await import('~utils/boardStorage');
      await addBookToCache(newBookStatus, updatedBook);

      // НЕ очищаем кэш - updateBookStatusInCache уже обновил статус во всех записях кэша
      // При следующей загрузке из кэша будут использованы обновленные данные

      if (newBookStatus === ALL) {
        // Удаляем комментарий и рейтинг локально
      }

      // It's because we don't want to refresh all books list to preserve scrolling
      dispatch(updateSuggestedBook({ bookId, bookStatus: newBookStatus, added }));
      dispatch(updateCustomBook({ bookId, bookStatus: newBookStatus, added }));

      dispatch(triggerReloadStat());


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

      // Сохраняем в локальную БД
      await saveBookNote(bookId, comment, added);

      // Redux state обновится через reducer на основе возвращаемых данных
      const state = getState();
      const currentNotes = state.books.bookNotes || [];
      const existingNoteIndex = currentNotes.findIndex((note: IBookNote) => note.bookId === bookId);

      if (existingNoteIndex !== -1) {
      } else {
      }


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

      // Получаем текущие рейтинги из state
      const state = getState();
      const currentRatings = state.books.bookRatings || [];

      // Обновляем или добавляем рейтинг
      const existingRatingIndex = currentRatings.findIndex((r: IRating) => r.bookId === bookId);
      let updatedRatings: IRating[];

      if (existingRatingIndex !== -1) {
        // Обновляем существующий рейтинг
        updatedRatings = currentRatings.map((r: IRating, index: number) => (index === existingRatingIndex ? { ...r, rating } : r));
      } else {
        // Добавляем новый рейтинг
        updatedRatings = [...currentRatings, { bookId, rating }];
      }

      // Сохраняем рейтинг в локальную БД
      await initDatabase();
      await saveBookRating(bookId, rating);


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

      // Получаем текущее количество лайков из state
      const state = getState();
      const currentBook = state.books.board[bookStatus]?.data?.find((book: IBook) => book.bookId === bookId);
      const currentVotesCount = currentBook?.votesCount || 0;
      const newVotesCount = shouldAdd ? currentVotesCount + 1 : Math.max(0, currentVotesCount - 1);

      // Обновляем в локальной БД
      await initDatabase();
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
      await initDatabase();
      await saveUserVotes(updatedUserVotes);

      // Обновляем в Redux state
      dispatch(updateBookVotesInSuggestedBook({ bookId, votesCount: newVotesCount }));
      dispatch(updateBookVotesInCustomBook({ bookId, votesCount: newVotesCount }));


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
export const removeBookFromBoardAndSearch = sharedRemoveBookFromBoardAndSearch;

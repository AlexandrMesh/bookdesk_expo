import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import difference from 'lodash/difference';
import intersection from 'lodash/intersection';

import { ALL } from '~constants/boardType';
import { SEARCH_RESULTS_LIMIT } from '~constants/bookList';
import DataService from '~http/services/books';
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

      // eslint-disable-next-line no-console
      console.log('🔍 [loadSearchResults] Поиск в локальной БД...');

      const foundBooks = await searchBooksInCache(searchText, searchBoardType, sortType, sortDirection, language);
      const limitedBooks = foundBooks.slice(0, SEARCH_RESULTS_LIMIT);

      // eslint-disable-next-line no-console
      console.log(`✅ [loadSearchResults] Найдено книг: ${foundBooks.length} (отображаем ${limitedBooks.length})`);

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

export const loadBookList = createAsyncThunk(
  `${PREFIX}/loadBookList`,
  async ({ boardType, shouldLoadMoreResults }: { boardType: BookStatus; shouldLoadMoreResults: boolean }, { getState }: AppThunkAPI) => {
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

    // eslint-disable-next-line no-console
    console.log('📡 [loadBookList] Загрузка данных с сервера API');

    const params = {
      pageIndex: 0,
      limit: 10000, // Большой лимит, чтобы загрузить все книги сразу
      boardType,
      categoryPaths: filterParams,
      sortType: sortParams.type,
      sortDirection: sortParams.direction,
      language,
    };

    try {
      // Устанавливаем таймаут для запроса, чтобы не висеть вечно
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000); // 30 секунд
      });

      const result = (await Promise.race([DataService().getBookList({ ...params }), timeoutPromise])) as any;
      const { items } = result?.data || {};

      // Подсчитываем booksCountByYear локально из всех загруженных книг
      let booksCountByYear: any = null;
      if (boardType !== ALL && items && items.length > 0) {
        booksCountByYear = calculateBooksCountByYear(items, language);
        // eslint-disable-next-line no-console
        console.log(`   Подсчитано booksCountByYear локально: ${booksCountByYear?.length || 0} месяцев`);
      }

      // Сохраняем в кэш и конвертируем обложки
      let booksWithBase64Covers: typeof items = items || [];
      try {
        // eslint-disable-next-line no-console
        console.log('💾 [loadBookList] Сохранение данных в локальный кэш...');
        const sortType = (sortParams.type ?? '') as string;
        const sortDirection = (sortParams.direction ?? '') as string;

        // Сохраняем даты и статусы книг отдельно
        // Конвертируем обложки в base64 для локального хранения
        const { getImgUrl } = await import('~config/api');
        const imgUrl = await getImgUrl();
        const { convertBookCoverToBase64 } = await import('~utils/imageConverter');

        // Сохраняем все книги в единую таблицу (данные будут агрегированы)
        if (items && items.length > 0) {
          try {
            const { saveBooks } = await import('~utils/database/books');
            // Сначала сохраняем книги без обложек (базовая информация)
            await saveBooks(items);
            // eslint-disable-next-line no-console
            console.log(`💾 [loadBookList] Сохранено ${items.length} книг в единую таблицу`);
          } catch (error) {
            console.error('Error saving books to unified table:', error);
          }
        }

        // Конвертируем обложки в base64 для локального хранения
        if (items && items.length > 0) {
          // eslint-disable-next-line no-console
          console.log(`🖼️ [loadBookList] Начинаем конвертацию обложек в base64 для ${items.length} книг`);
          let convertedCount = 0;
          let skippedCount = 0;
          let errorCount = 0;

          // Конвертируем обложки параллельно, но с ограничением (по 5 одновременно)
          const CONCURRENT_LIMIT = 5;
          const safeItems = (items || []) as IBook[];
          const booksToConvert = safeItems.filter((book: IBook) => book.coverPath && !book.coverPath.startsWith('data:image') && Boolean(imgUrl));

          // Формируем карту конвертированных обложек
          const coverMap = new Map<string, string>();
          for (let i = 0; i < booksToConvert.length; i += CONCURRENT_LIMIT) {
            const batch = booksToConvert.slice(i, i + CONCURRENT_LIMIT);
            const conversionPromises = batch.map(async (book: IBook) => {
              try {
                const base64Cover = await convertBookCoverToBase64(book.coverPath!, imgUrl);
                if (base64Cover) {
                  coverMap.set(book.bookId, base64Cover);
                  convertedCount++;
                } else {
                  errorCount++;
                }
              } catch (error) {
                console.error(`Error converting cover to base64 for book ${book.bookId}:`, error);
                errorCount++;
              }
            });
            await Promise.all(conversionPromises);
          }

          // Формируем финальный массив книг с конвертированными обложками
          booksWithBase64Covers = [];
          for (const book of safeItems) {
            let coverPath = book.coverPath;
            if (coverPath && !coverPath.startsWith('data:image') && coverMap.has(book.bookId)) {
              coverPath = coverMap.get(book.bookId)!;
            } else if (coverPath && coverPath.startsWith('data:image')) {
              skippedCount++;
            } else if (!coverPath) {
              skippedCount++;
            }

            booksWithBase64Covers.push({
              ...book,
              coverPath,
            });
          }

          // Обновляем обложки в единой таблице после конвертации
          if (booksWithBase64Covers.length > 0) {
            try {
              const { updateBook } = await import('~utils/database/books');
              for (const book of booksWithBase64Covers as IBook[]) {
                if (book.coverPath) {
                  await updateBook(book.bookId, { coverPath: book.coverPath });
                }
              }
              // eslint-disable-next-line no-console
              console.log(`🖼️ [loadBookList] Обновлены обложки в единой таблице для ${booksWithBase64Covers.length} книг`);
            } catch (error) {
              console.error('Error updating covers in unified table:', error);
            }
          }

          // eslint-disable-next-line no-console
          console.log(
            `✅ [loadBookList] Конвертация обложек завершена: конвертировано=${convertedCount}, пропущено=${skippedCount}, ошибок=${errorCount}`,
          );
        }

        await saveBoardData(
          boardType,
          targetPageIndex,
          filterParams,
          sortType,
          sortDirection,
          language,
          booksWithBase64Covers,
          booksWithBase64Covers.length,
          false,
          booksCountByYear,
        );
        // eslint-disable-next-line no-console
        console.log('✅ [loadBookList] Данные успешно сохранены в кэш');
      } catch (error) {
        console.error('Error saving to cache:', error);
        // Не прерываем выполнение, если не удалось сохранить в кэш
      }

      // ВАЖНО: Возвращаем данные с конвертированными обложками, чтобы Redux state обновился правильно
      const responseData = {
        boardType,
        data: booksWithBase64Covers,
        totalItems: booksWithBase64Covers.length,
        hasNextPage: false,
        shouldLoadMoreResults: false,
        booksCountByYear,
        fromCache: false,
      };

      // eslint-disable-next-line no-console
      console.log(`✅ [loadBookList] Загружено ${booksWithBase64Covers.length} книг с сервера (с конвертированными обложками)`);
      return responseData;
    } catch (error) {
      console.error('Error loading book list from server:', error);
      // При ошибке возвращаем пустой массив, чтобы не висеть
      // eslint-disable-next-line no-console
      console.log('⚠️ [loadBookList] Ошибка загрузки с сервера, возвращаем пустой массив');
      return {
        boardType,
        data: [],
        totalItems: 0,
        hasNextPage: false,
        shouldLoadMoreResults: false,
        booksCountByYear: null,
        fromCache: false,
      };
    }
  },
);

export const loadBookListFromLocalDB = createAsyncThunk(
  `${PREFIX}/loadBookListFromLocalDB`,
  async ({ boardType, shouldLoadMoreResults }: { boardType: BookStatus; shouldLoadMoreResults: boolean }, { getState }: AppThunkAPI) => {
    // DEBUG: Логируем начало загрузки
    console.log(`🔍 [loadBookListFromLocalDB DEBUG] ${boardType}: Начало загрузки`);

    const state = getState();
    const pageIndex = deriveBookListPageIndex(boardType)(state);
    const filterParams = deriveFilterBookCategoryPaths(boardType)(state);
    const sortParams = deriveBookListSortParams(boardType)(state);
    const { language } = i18n;

    // DEBUG: Логируем параметры загрузки
    console.log(`🔍 [loadBookListFromLocalDB DEBUG] ${boardType}: Параметры:`, {
      pageIndex,
      filterParamsIsArray: Array.isArray(filterParams),
      filterParamsLength: Array.isArray(filterParams) ? filterParams.length : typeof filterParams,
      sortParamsExists: !!sortParams,
      sortParamsType: sortParams?.type,
      sortParamsDirection: sortParams?.direction,
      language,
    });

    const targetPageIndex = shouldLoadMoreResults ? pageIndex + 1 : 0;

    // Инициализируем базу данных
    try {
      await initDatabase();
    } catch (error) {
      console.error('Error initializing database:', error);
    }

    // eslint-disable-next-line no-console
    console.log('💾 [loadBookListFromLocalDB] Загрузка данных из локальной БД');

    try {
      const sortType = (sortParams.type ?? '') as string;
      const sortDirection = (sortParams.direction ?? '') as string;
      const cachedData = await loadBoardData(boardType, targetPageIndex, filterParams, sortType, sortDirection, language);

      if (cachedData) {
        // DEBUG: Логируем загруженные данные
        console.log(`🔍 [loadBookListFromLocalDB DEBUG] ${boardType}: cachedData получен:`, {
          dataIsArray: Array.isArray(cachedData.data),
          dataLength: Array.isArray(cachedData.data) ? cachedData.data.length : typeof cachedData.data,
          filterParamsExists: !!cachedData.filterParams,
          filterParamsIsArray: Array.isArray(cachedData.filterParams),
          filterParamsLength: Array.isArray(cachedData.filterParams) ? cachedData.filterParams.length : typeof cachedData.filterParams,
        });

        // eslint-disable-next-line no-console
        console.log(`✅ [loadBookListFromLocalDB] Загружено ${cachedData.data.length} книг из локальной БД`);

        // Подсчитываем booksCountByYear локально из всех книг в кэше
        let booksCountByYear: any = null;
        if (boardType !== ALL && cachedData.data && cachedData.data.length > 0) {
          booksCountByYear = calculateBooksCountByYear(cachedData.data, language);
          // eslint-disable-next-line no-console
          console.log(`   Подсчитано booksCountByYear из локальной БД: ${booksCountByYear?.length || 0} месяцев`);
        }

        const returnPayload = {
          boardType,
          data: cachedData.data,
          totalItems: cachedData.data.length, // Используем реальное количество книг
          hasNextPage: false, // Больше не используем пагинацию
          shouldLoadMoreResults: false,
          booksCountByYear,
          fromCache: true,
        };

        // DEBUG: Логируем payload перед возвратом
        console.log(`🔍 [loadBookListFromLocalDB DEBUG] ${boardType}: Возвращаем payload:`, {
          dataIsArray: Array.isArray(returnPayload.data),
          dataLength: Array.isArray(returnPayload.data) ? returnPayload.data.length : typeof returnPayload.data,
          booksCountByYearIsArray: Array.isArray(returnPayload.booksCountByYear),
          booksCountByYearType: typeof returnPayload.booksCountByYear,
        });

        return returnPayload;
      } else {
        // eslint-disable-next-line no-console
        console.log('⚠️ [loadBookListFromLocalDB] Данные не найдены в локальной БД, возвращаем пустой массив');
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
    } catch (error) {
      console.error('Error loading from local DB:', error);
      // При ошибке возвращаем пустой массив
      // eslint-disable-next-line no-console
      console.log('⚠️ [loadBookListFromLocalDB] Ошибка загрузки из локальной БД, возвращаем пустой массив');
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
  },
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
      // eslint-disable-next-line no-console
      console.log('✅ [loadCategories] Используются категории из локального кэша');
      return cachedCategories;
    }

    // Если категорий нет в БД, загружаем из TS файла и сохраняем в БД
    // eslint-disable-next-line no-console
    console.log('📂 [loadCategories] Категории не найдены в локальном кэше, загружаем из TS файла...');
    const categoriesFromTs = await initializeCategoriesFromJson(language);
    if (categoriesFromTs.length > 0) {
      // eslint-disable-next-line no-console
      console.log('✅ [loadCategories] Категории загружены из TS файла и сохранены в БД');
      return categoriesFromTs;
    }

    // Если и из TS файла не удалось загрузить, возвращаем пустой массив
    // eslint-disable-next-line no-console
    console.log('❌ [loadCategories] Не удалось загрузить категории ни из БД, ни из TS файла');
    return [];
  } catch (error) {
    console.error('Error loading categories:', error);
    // В случае ошибки пытаемся загрузить из TS файла
    try {
      const categoriesFromTs = await initializeCategoriesFromJson(language);
      if (categoriesFromTs.length > 0) {
        // eslint-disable-next-line no-console
        console.log('✅ [loadCategories] Категории загружены из TS файла (fallback после ошибки)');
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

export const deleteUserBookRating = createAsyncThunk(`${PREFIX}/deleteUserBookRating`, async (bookId: string, { getState }: AppThunkAPI) => {
  try {
    // eslint-disable-next-line no-console
    console.log('🗑️ [deleteUserBookRating] Удаление рейтинга через локальную БД');
    // eslint-disable-next-line no-console
    console.log(`   bookId: ${bookId}`);

    // Удаляем из локальной БД
    const { deleteBookRating } = await import('~utils/boardStorage');
    await deleteBookRating(bookId);

    // Получаем текущие рейтинги из state и удаляем нужный
    const state = getState();
    const currentRatings = state.books.bookRatings || [];
    const updatedRatings = currentRatings.filter((r: IRating) => r.bookId !== bookId);

    // eslint-disable-next-line no-console
    console.log(`✅ [deleteUserBookRating] Рейтинг успешно удален из локальной БД (было: ${currentRatings.length}, стало: ${updatedRatings.length})`);

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
      await initDatabase();
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
export const removeBookFromBoardAndSearch = sharedRemoveBookFromBoardAndSearch;

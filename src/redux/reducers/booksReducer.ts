import { createReducer } from '@reduxjs/toolkit';
import isEmpty from 'lodash/isEmpty';
import union from 'lodash/union';
import uniqBy from 'lodash/uniqBy';

import { ALL } from '~constants/boardType';
import { FAILED, IDLE, PENDING, SUCCEEDED } from '~constants/loadingStatuses';
import * as booksActions from '~redux/actions/booksActions';
import { BookStatus, IBook, IBookNote, ICategory, IRating, IVote } from '~types/books';
import { LoadingType } from '~types/loadingTypes';

export interface ICategoriesState {
  data: ICategory[];
  shouldReloadData: boolean;
  loadingDataStatus: LoadingType;
}

export interface IPaginationState {
  pageIndex: number;
  totalItems: number;
  hasNextPage: boolean;
}

export interface ISortParamsState {
  type: string;
  direction: number | null;
}

export interface ISearchState {
  data: IBook[];
  query: string;
  loadingDataStatus: LoadingType;
  shouldClearSearchQuery: boolean;
  shouldReloadData: boolean;
  pagination: IPaginationState;
  sortParams: ISortParamsState;
}

export interface IFilterParamsState {
  [x: string]: string[] | string;
  categoryPaths: string[];
  categorySearchQuery: string;
  indeterminated: string[];
  expanded: string[];
}

export interface IBookDetailsState {
  data: IBook;
  loadingDataStatus: LoadingType;
}

const getDefaultCategoriesState = (): ICategoriesState => ({
  data: [],
  shouldReloadData: false,
  loadingDataStatus: IDLE,
});

const getDefaultPaginationState = (): IPaginationState => ({
  pageIndex: -1,
  totalItems: 0,
  hasNextPage: false,
});

const getDefaultSearchState = (): ISearchState => ({
  data: [],
  query: '',
  loadingDataStatus: IDLE,
  shouldClearSearchQuery: false,
  shouldReloadData: false,
  pagination: getDefaultPaginationState(),
  sortParams: {
    type: 'votesCount',
    direction: -1,
  },
});

const getDefaultFilterParamsState = (): IFilterParamsState => ({
  categorySearchQuery: '',
  categoryPaths: [],
  expanded: [],
  indeterminated: [],
});

const getDefaultBookDetailsState = (): IBookDetailsState => ({
  data: {
    bookId: '',
    title: '',
    coverPath: '',
    bookStatus: null,
    authorsList: [],
    pages: 0,
    categoryValue: '',
    votesCount: 0,
    annotation: '',
    comment: '',
    commentAdded: null,
  },
  loadingDataStatus: IDLE,
});

export interface IBoardState {
  data: IBook[];
  booksCountByYear: any[];
  loadingDataStatus: LoadingType;
  shouldReloadData: boolean;
  editableFilterParams: IFilterParamsState;
  filterParams: IFilterParamsState;
  sortParams: ISortParamsState;
  pagination: IPaginationState;
}

const getDefaultBoardState = ({ sortType = '', sortDirection = null }: { sortType: string; sortDirection: null | number }): IBoardState => ({
  data: [],
  booksCountByYear: [],
  loadingDataStatus: IDLE,
  shouldReloadData: false,
  editableFilterParams: getDefaultFilterParamsState(),
  filterParams: getDefaultFilterParamsState(),
  sortParams: {
    type: sortType,
    direction: sortDirection,
  },
  pagination: getDefaultPaginationState(),
});

export interface IBookCommentState {
  data: IBookNote;
  loadingDataStatus: LoadingType;
  updatingDataStatus: LoadingType;
  deletingDataStatus: LoadingType;
}

export interface IUpdatedBookValuesState {
  bookToUpdate: {
    bookId: string;
    bookStatus: BookStatus;
    added: number | null;
  };
  loadingDataStatus: LoadingType;
}

const getUpdatedBookValuesState = (): IUpdatedBookValuesState => ({
  bookToUpdate: {
    bookId: '',
    bookStatus: 'all',
    added: null,
  },
  loadingDataStatus: IDLE,
});

export interface IBooksState {
  updatingBookStatus: LoadingType;
  boardType: BookStatus | null;
  activeModal: string | null;
  activeAlert: string | null;
  updatedBookValues: IUpdatedBookValuesState;
  bookVotes: IVote[];
  bookNotes: IBookNote[];
  bookRatings: IRating[];
  bookDetails: IBookDetailsState;
  board: {
    all: IBoardState;
    planned: IBoardState;
    inProgress: IBoardState;
    completed: IBoardState;
  };
  categories: ICategoriesState;
  search: ISearchState;
}

const getDefaultState = (): IBooksState => ({
  updatingBookStatus: IDLE,
  boardType: ALL,
  activeModal: null,
  activeAlert: null,
  updatedBookValues: getUpdatedBookValuesState(),
  bookVotes: [],
  bookNotes: [],
  bookRatings: [],
  bookDetails: getDefaultBookDetailsState(),
  board: {
    all: getDefaultBoardState({ sortType: 'votesCount', sortDirection: -1 }),
    planned: getDefaultBoardState({ sortType: 'added', sortDirection: -1 }),
    inProgress: getDefaultBoardState({ sortType: 'added', sortDirection: -1 }),
    completed: getDefaultBoardState({ sortType: 'added', sortDirection: -1 }),
  },
  categories: getDefaultCategoriesState(),
  search: getDefaultSearchState(),
});

const defaultState = getDefaultState();

export default createReducer(defaultState, (builder) => {
  builder
    .addCase(booksActions.setBoardType, (state, action) => {
      state.boardType = action.payload;
    })
    .addCase(booksActions.showModal, (state, action) => {
      state.activeModal = action.payload;
    })
    .addCase(booksActions.hideModal, (state) => {
      state.activeModal = null;
    })
    .addCase(booksActions.deleteUserComment.fulfilled, (state, action) => {
      state.bookNotes = state.bookNotes.filter((note) => note.bookId !== action.payload);
    })
    .addCase(booksActions.updateUserComment.fulfilled, (state, { payload: { bookId, comment, added } }) => {
      state.bookNotes = state.bookNotes.some((note) => note.bookId === bookId)
        ? state.bookNotes.map((note) => (note.bookId === bookId ? { ...note, comment, added } : note))
        : [...state.bookNotes, { bookId, comment, added }];
    })
    .addCase(booksActions.userBookRatingsLoaded, (state, action) => {
      state.bookRatings = action.payload;
    })
    .addCase(booksActions.updateUserBookRating.fulfilled, (state, action) => {
      state.bookRatings = action.payload;
    })
    .addCase(booksActions.deleteUserBookRating.fulfilled, (state, action) => {
      state.bookRatings = action.payload;
    })
    .addCase(booksActions.setBookToUpdate, (state, { payload: { bookId, bookStatus, added } }) => {
      state.updatedBookValues.bookToUpdate.bookId = bookId;
      state.updatedBookValues.bookToUpdate.bookStatus = bookStatus;
      state.updatedBookValues.bookToUpdate.added = added;
    })
    .addCase(booksActions.updateUserBookAddedDate.pending, (state) => {
      state.updatedBookValues.loadingDataStatus = PENDING;
    })
    .addCase(booksActions.updateUserBookAddedDate.fulfilled, (state, { payload: { bookStatus, countByYear, added, bookId } }) => {
      state.board[bookStatus].booksCountByYear = countByYear;
      state.bookDetails.data.bookStatus = bookStatus;
      state.bookDetails.data.added = added;
      state.updatingBookStatus = SUCCEEDED;
      state.board[ALL].data = state.board[ALL].data.map((book) => (book.bookId === bookId ? { ...book, added } : book));
      state.board[bookStatus].data = state.board[bookStatus].data.map((book) => (book.bookId === bookId ? { ...book, added } : book));
      state.search.data = state.search.data.map((book) => (book.bookId === bookId ? { ...book, added } : book));
      state.updatedBookValues.loadingDataStatus = SUCCEEDED;
    })
    .addCase(booksActions.updateUserBookAddedDate.rejected, (state) => {
      state.updatedBookValues.loadingDataStatus = FAILED;
    })
    .addCase(booksActions.clearBookDetails, (state) => {
      state.bookDetails = getDefaultBookDetailsState();
    })
    .addCase(booksActions.setBookVotes, (state, action) => {
      state.bookVotes = action.payload;
    })
    .addCase(booksActions.setBookNotes, (state, action) => {
      state.bookNotes = action.payload;
    })
    .addCase(booksActions.updateBookVotes.fulfilled, (state, { meta, payload: { bookStatus, userVotes, votesCount } }) => {
      state.bookVotes = userVotes;
      state.board[ALL].data = state.board[ALL].data.map((book) => (book.bookId === meta.arg.bookId ? { ...book, votesCount } : book));
      state.search.data = state.search.data.map((book) => (book.bookId === meta.arg.bookId ? { ...book, votesCount } : book));

      if (!isEmpty(state.bookDetails.data)) {
        state.bookDetails.data.votesCount = votesCount;
      }

      if (bookStatus) {
        state.board[bookStatus].data = state.board[bookStatus].data.map((book) => (book.bookId === meta.arg.bookId ? { ...book, votesCount } : book));
      }
    })
    .addCase(booksActions.clearSearchResults, (state) => {
      state.search = { ...getDefaultSearchState(), shouldClearSearchQuery: true };
    })
    .addCase(booksActions.updateUserBook.pending, (state) => {
      state.updatingBookStatus = PENDING;
    })
    .addCase(
      booksActions.updateUserBook.fulfilled,
      (state, { payload: { boardType, currentBookStatus, countByYear, bookId, bookStatus, added, newBookStatus } }) => {
        state.board[currentBookStatus || ALL].booksCountByYear = countByYear;
        if (!isEmpty(state.bookDetails.data)) {
          state.bookDetails.data.bookStatus = bookStatus;
          state.bookDetails.data.added = added;
        }

        // Удаляем книгу со старой доски (если книга имела конкретный статус)
        // currentBookStatus - это старый статус книги (откуда переводим)
        if (currentBookStatus && currentBookStatus !== ALL) {
          state.board[currentBookStatus].data = state.board[currentBookStatus].data.filter((book) => book.bookId !== bookId);
          state.board[currentBookStatus].pagination.totalItems =
            state.board[currentBookStatus].pagination.totalItems > 0 ? state.board[currentBookStatus].pagination.totalItems - 1 : 0;
        }

        state.updatingBookStatus = SUCCEEDED;

        // Обновляем книгу в доске ALL (она всегда там присутствует, меняется только статус)
        state.board[ALL].data = state.board[ALL].data.map((book) => (book.bookId === bookId ? { ...book, bookStatus, added } : book));
        state.search.data = state.search.data.map((book) => (book.bookId === bookId ? { ...book, bookStatus, added } : book));

        // Ставим метку о том что надо перезагрузить новую доску куда добавилась книга
        // ВАЖНО: перезагружаем целевую доску, чтобы книга появилась там в правильном порядке
        if (newBookStatus !== ALL) {
          // Если переводим на конкретную доску (planned/inProgress/completed), очищаем и перезагружаем её
          state.board[newBookStatus].data = [];
          state.board[newBookStatus].shouldReloadData = true;
        }

        // Если текущая доска опустела и есть еще книги в пагинации, перезагружаем её
        if (state.board[boardType].data.length === 0 && state.board[boardType].pagination.totalItems > 0) {
          state.board[boardType].data = [];
          state.board[boardType].shouldReloadData = true;
        }
      },
    )
    .addCase(booksActions.updateBookOnBoardAndSearch, (state, { payload: { bookId, bookStatus, title, pages, authorsList } }) => {
      state.board[bookStatus || ALL].data = state.board[bookStatus || ALL].data.map((book) =>
        book.bookId === bookId ? { ...book, title, pages, authorsList } : book,
      );
      state.search.data = state.search.data.map((book) => (book.bookId === bookId ? { ...book, title, pages, authorsList } : book));
    })
    .addCase(booksActions.triggerReloadBookList, (state, action) => {
      state.board[action.payload].data = [];
      state.board[action.payload].shouldReloadData = true;
    })
    .addCase(booksActions.loadBookList.pending, (state, action) => {
      // Mark loading as PENDING for any load start (initial, reload, or load-more)
      state.board[action.meta.arg.boardType].loadingDataStatus = PENDING;
    })
    .addCase(
      booksActions.loadBookList.fulfilled,
      (state, { payload: { boardType, data = [], totalItems = 0, hasNextPage = false, shouldLoadMoreResults, booksCountByYear } }) => {
        state.board[boardType].loadingDataStatus = SUCCEEDED;
        state.board[boardType].shouldReloadData = false;
        state.board[boardType].data = shouldLoadMoreResults ? uniqBy([...state.board[boardType].data, ...data], 'bookId') : data;
        state.board[boardType].pagination.pageIndex = shouldLoadMoreResults ? state.board[boardType].pagination.pageIndex + 1 : 0;
        state.board[boardType].pagination.totalItems = totalItems;
        state.board[boardType].pagination.hasNextPage = hasNextPage;
        state.board[boardType].booksCountByYear = booksCountByYear || state.board[boardType].booksCountByYear;
      },
    )
    .addCase(booksActions.loadBookList.rejected, (state, action) => {
      state.board[action.meta.arg.boardType].loadingDataStatus = FAILED;
      state.board[action.meta.arg.boardType].shouldReloadData = false;
    })
    .addCase(booksActions.loadCategories.pending, (state) => {
      state.categories.loadingDataStatus = PENDING;
    })
    .addCase(booksActions.loadCategories.fulfilled, (state, action) => {
      state.categories.data = action.payload || state.categories.data;
      state.categories.shouldReloadData = false;
      state.categories.loadingDataStatus = SUCCEEDED;
    })
    .addCase(booksActions.loadCategories.rejected, (state) => {
      state.categories.shouldReloadData = false;
      state.categories.loadingDataStatus = FAILED;
    })
    .addCase(booksActions.loadBookDetails.pending, (state) => {
      state.bookDetails.loadingDataStatus = PENDING;
    })
    .addCase(booksActions.loadBookDetails.fulfilled, (state, action) => {
      state.bookDetails.data = action.payload;
      state.bookDetails.loadingDataStatus = SUCCEEDED;
    })
    .addCase(booksActions.loadBookDetails.rejected, (state) => {
      state.bookDetails.loadingDataStatus = FAILED;
    })
    .addCase(booksActions.resetCategories, (state, action) => {
      state.board[action.payload].editableFilterParams.categorySearchQuery = '';
    })
    .addCase(booksActions.searchCategory, (state, { payload: { boardType, query } }) => {
      state.board[boardType].editableFilterParams.categorySearchQuery = query;
    })
    .addCase(booksActions.clearSearchQueryForCategory, (state, action) => {
      state.board[action.payload].editableFilterParams.categorySearchQuery = '';
    })
    .addCase(booksActions.toggleExpandedCategoryBooks, (state, { payload: { boardType, path } }) => {
      state.board[boardType].editableFilterParams.expanded = state.board[boardType].editableFilterParams.expanded.includes(path)
        ? state.board[boardType].editableFilterParams.expanded.filter((item) => item !== path)
        : [...state.board[boardType].editableFilterParams.expanded, path];
    })
    .addCase(booksActions.addToIndeterminatedCategories, (state, { payload: { boardType, value } }) => {
      state.board[boardType].editableFilterParams.indeterminated = Array.isArray(value)
        ? [...state.board[boardType].editableFilterParams.indeterminated, ...value]
        : [...state.board[boardType].editableFilterParams.indeterminated, value];
    })
    .addCase(booksActions.clearIndeterminatedCategories, (state, { payload: { boardType, path } }) => {
      state.board[boardType].editableFilterParams.indeterminated = state.board[boardType].editableFilterParams.indeterminated.filter((item) => {
        const splittedPath = path.split('.');
        if (splittedPath.length === 1) {
          return null;
        }
        const firstLevel = `${splittedPath[0]}`;
        const secondLevel = `${splittedPath[0]}.${splittedPath[1]}`;
        return item !== firstLevel && item !== secondLevel;
      });
    })
    .addCase(booksActions.clearFilters, (state, action) => {
      state.board[action.payload].editableFilterParams.categoryPaths = [];
      state.board[action.payload].editableFilterParams.indeterminated = [];
    })
    .addCase(booksActions.clearAllFilters, (state, action) => {
      state.board[action.payload].filterParams.categoryPaths = [];
      state.board[action.payload].filterParams.indeterminated = [];
      state.board[action.payload].editableFilterParams.categoryPaths = [];
      state.board[action.payload].editableFilterParams.indeterminated = [];
    })
    .addCase(booksActions.populateFilters, (state, action) => {
      const editable = state.board[action.payload].editableFilterParams;
      // Clone to avoid sharing references between editable and applied filters
      state.board[action.payload].filterParams = {
        categorySearchQuery: editable.categorySearchQuery,
        categoryPaths: [...editable.categoryPaths],
        expanded: [...editable.expanded],
        indeterminated: [...editable.indeterminated],
      } as any;
    })
    .addCase(booksActions.addFilterValue, (state, { payload: { boardType, filterParam, value } }) => {
      state.board[boardType].editableFilterParams[filterParam] = Array.isArray(value)
        ? union([...state.board[boardType].editableFilterParams[filterParam], ...value])
        : [...state.board[boardType].editableFilterParams[filterParam], value];
    })
    .addCase(booksActions.removeFilterValue, (state, { payload: { boardType, filterParam, value } }) => {
      state.board[boardType].editableFilterParams[filterParam] = Array.isArray(value)
        ? (state.board[boardType].editableFilterParams[filterParam] as string[]).filter((param) => !value.includes(param))
        : (state.board[boardType].editableFilterParams[filterParam] as string[]).filter((param) => param !== value);
    })
    .addCase(booksActions.loadSearchResults.pending, (state) => {
      state.search.loadingDataStatus = PENDING;
    })
    .addCase(
      booksActions.loadSearchResults.fulfilled,
      (state, { payload: { data = [], totalItems = 0, hasNextPage = false, shouldLoadMoreResults } }) => {
        state.search.data = shouldLoadMoreResults ? [...state.search.data, ...data] : data;
        state.search.loadingDataStatus = SUCCEEDED;
        state.search.shouldReloadData = false;
        state.search.pagination.totalItems = totalItems;
        state.search.pagination.hasNextPage = hasNextPage;
        state.search.pagination.pageIndex = shouldLoadMoreResults ? state.search.pagination.pageIndex + 1 : 0;
      },
    )
    .addCase(booksActions.loadSearchResults.rejected, (state) => {
      state.search.loadingDataStatus = FAILED;
      state.search.shouldReloadData = false;
    })
    .addCase(booksActions.triggerReloadSearchResults, (state) => {
      state.search.data = [];
      state.search.shouldReloadData = true;
    })
    .addCase(booksActions.triggerShouldNotClearSearchQuery, (state) => {
      state.search.shouldClearSearchQuery = false;
    })
    .addCase(booksActions.setSearchQueryAction, (state, action) => {
      state.search.shouldClearSearchQuery = false;
      state.search.query = action.payload;
    })
    .addCase(booksActions.clearDataForChangeLanguage, (state) => {
      state.bookVotes = [];
      state.activeModal = null;
    })
    .addCase(booksActions.clearBooksData, () => defaultState);
});

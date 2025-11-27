import { createReducer } from '@reduxjs/toolkit';
// uniqBy removed: not used in local flow

import { PLANNED } from '~constants/boardType';
import { IDLE, PENDING, FAILED, SUCCEEDED } from '~constants/loadingStatuses';
import * as customBooksActions from '~redux/actions/customBookActions';
import { BookStatus, IBook } from '~types/books';
import { ICover } from '~types/customBooks';
import { LoadingType } from '~types/loadingTypes';

export interface IPaginationState {
  pageIndex: number;
  totalItems: number;
  hasNextPage: boolean;
}

const getDefaultPaginationState = (): IPaginationState => ({
  pageIndex: 0,
  totalItems: 0,
  hasNextPage: false,
});

export interface ISortParamsState {
  type: string;
  direction: number;
}

const getDefaultSortParamsState = (): ISortParamsState => ({
  type: 'votesCount',
  direction: -1,
});

export interface ISuggestedBooksState {
  data: IBook[];
  shouldReloadData: boolean;
  pagination: IPaginationState;
  sortParams: ISortParamsState;
  loadingDataStatus: LoadingType;
}

const getDefaultSuggestedBooksState = (): ISuggestedBooksState => ({
  data: [],
  shouldReloadData: false,
  pagination: getDefaultPaginationState(),
  sortParams: getDefaultSortParamsState(),
  loadingDataStatus: IDLE,
});

export interface ISuggestedCoversState {
  data: ICover[];
  loadingDataStatus: LoadingType;
}

const getDefaultSuggestedCoversState = (): ISuggestedCoversState => ({
  data: [],
  loadingDataStatus: IDLE,
});

export interface ICategoryState {
  searchQuery: string;
  expanded: string[];
  selectedCategory: { path: string; label: string };
}

export interface INameState {
  value: string;
  error: string | null;
}

const getDefaultNameState = (): INameState => ({
  value: '',
  error: null,
});

export interface IStep1State {
  updatingBookStatus: LoadingType;
  name: INameState;
  allowToAddBook: boolean;
  suggestedBooks: ISuggestedBooksState;
}

const getDefaultStep1State = (): IStep1State => ({
  updatingBookStatus: IDLE,
  name: getDefaultNameState(),
  allowToAddBook: false,
  suggestedBooks: getDefaultSuggestedBooksState(),
});

export interface IStep2State {
  shouldAddCover: boolean | undefined;
  suggestedCovers: ISuggestedCoversState;
  selectedCover: string;
}

const getDefaultStep2State = (): IStep2State => ({
  shouldAddCover: undefined,
  suggestedCovers: getDefaultSuggestedCoversState(),
  selectedCover: '',
});

export interface IValueState {
  value: string | null;
  error: string | null | undefined;
}

const getDefaultValueState = (): IValueState => ({
  value: '',
  error: null,
});

export interface IBookState {
  added: boolean;
  loadingDataStatus: LoadingType;
}

const getDefaultBookState = (): IBookState => ({
  added: false,
  loadingDataStatus: IDLE,
});

const getDefaultCategoryState = (): ICategoryState => ({
  searchQuery: '',
  expanded: [],
  selectedCategory: {
    path: '',
    label: '',
  },
});

export interface IStep3State {
  category: ICategoryState;
  editableCategory: ICategoryState;
  status: BookStatus;
  pages: IValueState;
  authorsList: { id: string; name: string | null; error: string | null | undefined }[];
  annotation: IValueState;
}

const getDefaultStep3State = (): IStep3State => ({
  category: getDefaultCategoryState(),
  editableCategory: getDefaultCategoryState(),
  status: PLANNED,
  pages: getDefaultValueState(),
  authorsList: [{ id: 'default', name: null, error: null }],
  annotation: getDefaultValueState(),
});

export interface IAddState {
  currentStep: number;
  availableStep: number;
  book: IBookState;
  steps: {
    1: IStep1State;
    2: IStep2State;
    3: IStep3State;
  };
}

const getDefaultBooksDatatState = () => ({
  data: [],
  loadingDataStatus: IDLE as LoadingType,
  shouldReloadData: false,
  pagination: getDefaultPaginationState(),
});

const getDefaultAddState = (): IAddState => ({
  currentStep: 1,
  availableStep: 1,
  book: getDefaultBookState(),
  steps: {
    1: getDefaultStep1State(),
    2: getDefaultStep2State(),
    3: getDefaultStep3State(),
  },
});

export interface IBooksDataState {
  data: IBook[];
  loadingDataStatus: LoadingType;
  shouldReloadData: boolean;
  pagination: IPaginationState;
}

export interface IDefaultState {
  add: IAddState;
  booksData: IBooksDataState;
}

const getDefaultState = (): IDefaultState => ({
  add: getDefaultAddState(),
  booksData: getDefaultBooksDatatState(),
});

const defaultState = getDefaultState();

export default createReducer(defaultState, (builder) => {
  builder
    // loadCustomBookList handlers removed; local flow no longer uses remote list
    .addCase(customBooksActions.setNewCustomBookName, (state, { payload: { name, error } }) => {
      state.add.steps[1].name.value = name;
      state.add.steps[1].name.error = error;
    })
    .addCase(customBooksActions.addCustomBook.pending, (state) => {
      state.add.book.loadingDataStatus = PENDING;
    })
    .addCase(customBooksActions.addCustomBook.fulfilled, (state) => {
      state.add.book.loadingDataStatus = SUCCEEDED;
      state.add.book.added = true;
    })
    .addCase(customBooksActions.addCustomBook.rejected, (state) => {
      state.add.book.loadingDataStatus = FAILED;
      state.add.book.added = false;
    })
    .addCase(customBooksActions.setCurrentStep, (state, action) => {
      state.add.currentStep = action.payload;
    })
    .addCase(customBooksActions.setAvailableStep, (state, action) => {
      state.add.availableStep = action.payload;
    })
    .addCase(customBooksActions.clearAddCustomBookState, (state) => {
      state.add = getDefaultAddState();
    })
    .addCase(customBooksActions.clearStep2, (state) => {
      state.add.steps[2] = getDefaultStep2State();
    })
    .addCase(customBooksActions.clearStep3, (state) => {
      // Сбрасываем поля шага 3, но сохраняем заранее установленный статус (если он есть)
      const preservedStatus = state.add.steps[3].status;
      state.add.steps[3] = getDefaultStep3State();
      state.add.steps[3].status = preservedStatus ?? state.add.steps[3].status;
    })
    .addCase(customBooksActions.setStatus, (state, action) => {
      state.add.steps[3].status = action.payload;
    })
    .addCase(customBooksActions.setAnnotation, (state, { payload: { annotation, error } }) => {
      state.add.steps[3].annotation.value = annotation;
      state.add.steps[3].annotation.error = error;
    })
    .addCase(customBooksActions.setAnnotationError, (state, action) => {
      state.add.steps[3].annotation.error = action.payload;
    })
    .addCase(customBooksActions.addAuthor, (state, action) => {
      state.add.steps[3].authorsList = [...state.add.steps[3].authorsList, { id: action.payload, name: null, error: null }];
    })
    .addCase(customBooksActions.updateAuthor, (state, { payload: { id, name, error } }) => {
      state.add.steps[3].authorsList = state.add.steps[3].authorsList.map((author) => (author.id === id ? { ...author, name, error } : author));
    })
    .addCase(customBooksActions.removeAuthor, (state, action) => {
      state.add.steps[3].authorsList = state.add.steps[3].authorsList.filter(({ id }) => id !== action.payload);
    })
    .addCase(customBooksActions.setPages, (state, { payload: { pages, error } }) => {
      state.add.steps[3].pages.value = pages;
      state.add.steps[3].pages.error = error;
    })
    .addCase(customBooksActions.toggleExpandedCategoryCustomBooks, (state, action) => {
      const expanded = state.add.steps[3].editableCategory.expanded;
      state.add.steps[3].editableCategory.expanded = expanded.includes(action.payload)
        ? expanded.filter((path) => path !== action.payload)
        : [...expanded, action.payload];
    })
    .addCase(customBooksActions.setSearchQuery, (state, action) => {
      state.add.steps[3].editableCategory.searchQuery = action.payload;
    })
    .addCase(customBooksActions.clearCategory, (state) => {
      state.add.steps[3].editableCategory.searchQuery = '';
    })
    .addCase(customBooksActions.submitCategory, (state) => {
      state.add.steps[3].category = state.add.steps[3].editableCategory;
    })
    .addCase(customBooksActions.updateSuggestedBook, (state, { payload: { bookId, bookStatus, added } }) => {
      state.add.steps[1].updatingBookStatus = SUCCEEDED;
      state.add.steps[1].suggestedBooks.data = state.add.steps[1].suggestedBooks.data.map((book) =>
        book.bookId === bookId ? { ...book, bookStatus, added } : book,
      );
    })
    .addCase(customBooksActions.updateCustomBook, (state, { payload: { bookId, bookStatus, added } }) => {
      state.booksData.data = state.booksData.data.map((book) => (book.bookId === bookId ? { ...book, bookStatus, added } : book));
    })
    .addCase(customBooksActions.triggerReloadCustomBookList, (state) => {
      state.booksData.shouldReloadData = true;
    })
    .addCase(customBooksActions.updateBookVotesInSuggestedBook, (state, { payload: { bookId, votesCount } }) => {
      state.add.steps[1].suggestedBooks.data = state.add.steps[1].suggestedBooks.data.map((book) =>
        book.bookId === bookId ? { ...book, votesCount } : book,
      );
    })
    .addCase(customBooksActions.updateBookVotesInCustomBook, (state, { payload: { bookId, votesCount } }) => {
      state.booksData.data = state.booksData.data.map((book) => (book.bookId === bookId ? { ...book, votesCount } : book));
    })
    .addCase(
      customBooksActions.updateUserCustomBook.fulfilled,
      (state, { payload: { bookId, title, pages, authorsList, annotation, categoryPath } }) => {
        state.booksData.data = state.booksData.data.map((book) =>
          book.bookId === bookId ? { ...book, title, pages, authorsList, annotation, categoryPath } : book,
        );
        state.add.steps[1].suggestedBooks.data = state.add.steps[1].suggestedBooks.data.map((book) =>
          book.bookId === bookId ? { ...book, title, pages, authorsList, categoryPath } : book,
        );
      },
    )
    .addCase(customBooksActions.deleteCustomBook.fulfilled, (state, { payload: bookId }) => {
      // Удаляем книгу из списка кастомных книг
      state.booksData.data = state.booksData.data.filter((book) => book.bookId !== bookId);
      // Удаляем из предложенных книг, если есть
      state.add.steps[1].suggestedBooks.data = state.add.steps[1].suggestedBooks.data.filter((book) => book.bookId !== bookId);
    })
    .addCase(customBooksActions.clearSuggestedBooks, (state) => {
      state.add.steps[1].suggestedBooks = getDefaultSuggestedBooksState();
    })
    .addCase(customBooksActions.setShouldAddCover, (state, action) => {
      state.add.steps[2].shouldAddCover = action.payload;
    })
    .addCase(customBooksActions.loadSuggestedCovers.pending, (state) => {
      state.add.steps[2].suggestedCovers.loadingDataStatus = PENDING;
    })
    .addCase(customBooksActions.loadSuggestedCovers.fulfilled, (state, action) => {
      state.add.steps[2].suggestedCovers.data = action.payload;
      state.add.steps[2].suggestedCovers.loadingDataStatus = SUCCEEDED;
    })
    .addCase(customBooksActions.loadSuggestedCovers.rejected, (state) => {
      state.add.steps[2].suggestedCovers.loadingDataStatus = FAILED;
    })
    .addCase(customBooksActions.selectCover, (state, action) => {
      state.add.steps[2].selectedCover = action.payload;
    })
    .addCase(customBooksActions.selectCategory, (state, action) => {
      state.add.steps[3].editableCategory.selectedCategory = action.payload;
    })
    .addCase(customBooksActions.clearData, () => defaultState);
});

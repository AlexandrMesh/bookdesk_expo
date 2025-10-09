import isEmpty from 'lodash/isEmpty';
import { createSelector } from 'reselect';
import { DEFAULT_COVER } from '~constants/customBooks';
import { SUCCEEDED } from '~constants/loadingStatuses';
import { getT } from '~translations/i18n';

import { getCategoriesData } from '~redux/selectors/common';
import { RootState } from '~redux/store/configureStore';

type StateWithCustomBook = Pick<RootState, 'customBook'>;

const getCustomBook = (state: StateWithCustomBook) => state.customBook;
const getAddCustomBook = (state: StateWithCustomBook) => getCustomBook(state).add;
const getBooksData = (state: StateWithCustomBook) => getCustomBook(state).booksData;
export const getCustomBooksData = (state: StateWithCustomBook) => getBooksData(state).data;
const getCustomBooksPagination = (state: StateWithCustomBook) => getBooksData(state).pagination;
export const getCustomBooksHasNextPage = (state: StateWithCustomBook) => getCustomBooksPagination(state).hasNextPage;
export const getCustomBooksPageIndex = (state: StateWithCustomBook) => getCustomBooksPagination(state).pageIndex;
export const getCustomBooksTotalItems = (state: StateWithCustomBook) => getCustomBooksPagination(state).totalItems;
export const getCustomBooksLoadingDataStatus = (state: StateWithCustomBook) => getBooksData(state).loadingDataStatus;
export const getCustomBooksShouldReloadData = (state: StateWithCustomBook) => getBooksData(state).shouldReloadData;
const getCustomBookData = (state: StateWithCustomBook) => getAddCustomBook(state).book;
const getAddCustomBookSteps = (state: StateWithCustomBook) => getAddCustomBook(state).steps;
const getAddCustomBookStep1 = (state: StateWithCustomBook) => getAddCustomBookSteps(state)[1];
const getAddCustomBookStep2 = (state: StateWithCustomBook) => getAddCustomBookSteps(state)[2];
const getAddCustomBookStep3 = (state: StateWithCustomBook) => getAddCustomBookSteps(state)[3];
const getEditableCategory = (state: StateWithCustomBook) => getAddCustomBookStep3(state).editableCategory;
const getCategory = (state: StateWithCustomBook) => getAddCustomBookStep3(state).category;
const getSuggestedBooks = (state: StateWithCustomBook) => getAddCustomBookStep1(state).suggestedBooks;
const getSuggestedBooksPagination = (state: StateWithCustomBook) => getSuggestedBooks(state).pagination;

// common
export const getAddedCustomBook = (state: StateWithCustomBook) => getCustomBookData(state).added;
export const getSavingCustomBookStatus = (state: StateWithCustomBook) => getCustomBookData(state).loadingDataStatus;
export const getCurrentStep = (state: StateWithCustomBook) => getAddCustomBook(state).currentStep;
export const getAvailableStep = (state: StateWithCustomBook) => getAddCustomBook(state).availableStep;

// step 1
export const getNewCustomBookName = (state: StateWithCustomBook) => getAddCustomBookStep1(state).name;
export const getNewCustomBookNameValue = (state: StateWithCustomBook) => getNewCustomBookName(state).value.trim();
export const getSuggestedBooksSortParams = (state: StateWithCustomBook) => getSuggestedBooks(state).sortParams;
export const getSuggestedBooksData = (state: StateWithCustomBook) => getSuggestedBooks(state).data;
export const getSuggestedBooksLoadingStatus = (state: StateWithCustomBook) => getSuggestedBooks(state).loadingDataStatus;
export const getSuggestedBooksTotalItems = (state: StateWithCustomBook) => getSuggestedBooksPagination(state).totalItems;
export const getAllowToAddBook = (state: StateWithCustomBook) => getAddCustomBookStep1(state).allowToAddBook;

// step 2
export const getShouldAddCover = (state: StateWithCustomBook) => getAddCustomBookStep2(state).shouldAddCover;
export const getSuggestedCovers = (state: StateWithCustomBook) => getAddCustomBookStep2(state).suggestedCovers;
export const getSelectedCover = (state: StateWithCustomBook) => getAddCustomBookStep2(state).selectedCover;
export const getSuggestedCoversData = (state: StateWithCustomBook) => getSuggestedCovers(state).data;
export const getSuggestedCoversLoadingDataStatus = (state: StateWithCustomBook) => getSuggestedCovers(state).loadingDataStatus;

// step 3
export const getEditableSelectedCategory = (state: StateWithCustomBook) => getEditableCategory(state).selectedCategory;
export const getEditableSelectedCategoryPath = (state: StateWithCustomBook) => getEditableSelectedCategory(state).path;
export const getEditableSelectedCategoryLabel = (state: StateWithCustomBook) => getEditableSelectedCategory(state).label;
export const getSelectedCategory = (state: StateWithCustomBook) => getCategory(state).selectedCategory;
export const getSelectedCategoryPath = (state: StateWithCustomBook) => getSelectedCategory(state).path;
export const getSelectedCategoryLabel = (state: StateWithCustomBook) => getSelectedCategory(state).label;
export { getExpandedCategories } from '~redux/selectors/common';
export const getCategorySearchQuery = (state: StateWithCustomBook) => getEditableCategory(state).searchQuery;
export const getStatus = (state: StateWithCustomBook) => getAddCustomBookStep3(state).status;
export const getPages = (state: StateWithCustomBook) => getAddCustomBookStep3(state).pages;
export const getAuthorsList = (state: StateWithCustomBook) => getAddCustomBookStep3(state).authorsList;
export const getAnnotation = (state: StateWithCustomBook) => getAddCustomBookStep3(state).annotation;

export const deriveCustomBookListData = createSelector([getCustomBooksData, getCategoriesData], (booksData, categories) =>
  booksData.map((book) => ({ ...book, categoryValue: categories.find((category) => category.path === book.categoryPath)?.value })),
);

export const deriveCategoriesSearchResult = createSelector([getCategoriesData, getCategorySearchQuery], (categories, query) => {
  const searchQuery = query.trim().toLowerCase();
  return searchQuery
    ? categories
        .filter(({ path }) => path.split('.').length === 3)
        .map((item) => ({ ...item, title: item.value, label: getT('categories')(item.value) }))
        .filter(({ label }) => label.toLowerCase().includes(searchQuery))
    : [];
});

export const deriveIsValidStep1 = createSelector(
  [getAllowToAddBook, getNewCustomBookName, getSuggestedBooksLoadingStatus],
  (allowToAddBook, bookName, loadingDataStatus) => allowToAddBook && isEmpty(bookName.error) && !!bookName.value && loadingDataStatus === SUCCEEDED,
);

export const deriveIsValidStep2 = createSelector(
  [getShouldAddCover, getSelectedCover],
  (shouldAddCover, selectedCover) => shouldAddCover === false || (shouldAddCover === true && !!selectedCover),
);

export const deriveIsValidAuthorsList = createSelector(
  [getAuthorsList],
  (authorsList) => authorsList.length > 0 && authorsList.every(({ name, error }) => name && !error),
);

export const deriveIsValidStep3 = createSelector(
  [getSelectedCategoryPath, getPages, deriveIsValidAuthorsList, getAnnotation],
  (selectedCategoryPath, pages, isValidAuthorsList, annotation) =>
    !!selectedCategoryPath && !!pages.value && !pages.error && isValidAuthorsList && !!annotation.value && !annotation.error,
);

export const deriveIsValidFullForm = createSelector(
  [deriveIsValidStep1, deriveIsValidStep2, deriveIsValidStep3],
  (isValidStep1, isValidStep2, isValidStep3) => isValidStep1 && isValidStep2 && isValidStep3,
);

export const deriveCustomBookParams = createSelector(
  [getNewCustomBookNameValue, getShouldAddCover, getSelectedCover, getSelectedCategoryPath, getStatus, getPages, getAuthorsList, getAnnotation],
  (customBookName, shouldAddCover, selectedCover, selectedCategoryPath, status, pages, authorsList, annotation) => ({
    title: customBookName,
    categoryPath: selectedCategoryPath.trim(),
    coverPath: shouldAddCover ? selectedCover : DEFAULT_COVER,
    authorsList: authorsList.map(({ name }) => name?.trim()),
    annotation: (annotation.value as string).trim(),
    pages: Number(pages.value),
    status,
  }),
);

export const deriveSuggestBooksData = createSelector([getSuggestedBooksData, getCategoriesData], (suggestedBooks, categories) =>
  suggestedBooks.map((book) => ({ ...book, categoryValue: (categories as any[]).find((category) => category.path === book.categoryPath).value })),
);

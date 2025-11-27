import groupBy from 'lodash/groupBy';
import map from 'lodash/map';
import { createSelector } from 'reselect';

import { getCategoriesData, getExpandedCategories } from '~redux/selectors/common';
import { RootState } from '~redux/store/configureStore';
import i18n, { getT } from '~translations/i18n';
import { BookStatus } from '~types/books';

type StateWithBooks = Pick<RootState, 'books'>;

const getBooks = (state: StateWithBooks) => state.books;
const getSearch = (state: StateWithBooks) => getBooks(state).search;
const getCategories = (state: StateWithBooks) => getBooks(state).categories;
const getBoard = (state: StateWithBooks) => getBooks(state).board;
const getUpdatedBookValues = (state: StateWithBooks) => getBooks(state).updatedBookValues;

export const getBoardType = (state: StateWithBooks) => getBooks(state).boardType;
export const getBookVotes = (state: StateWithBooks) => getBooks(state).bookVotes;
export const getBookNotes = (state: StateWithBooks) => getBooks(state).bookNotes;
export const getActiveModal = (state: StateWithBooks) => getBooks(state).activeModal;
export const getCoverUrl = (state: StateWithBooks) => getBooks(state).coverUrl;
export const getSearchQuery = (state: StateWithBooks) => getSearch(state).query;
export const getSearchResults = (state: StateWithBooks) => getSearch(state).data;
export const getLoadingSearchResultsStatus = (state: StateWithBooks) => getSearch(state).loadingDataStatus;
export const getShouldReloadSearchResults = (state: StateWithBooks) => getSearch(state).shouldReloadData;
export const getSearchResultsPagination = (state: StateWithBooks) => getSearch(state).pagination;
export const getSearchResultsHasNextPage = (state: StateWithBooks) => getSearchResultsPagination(state).hasNextPage;
export const getSearchResultsTotalItems = (state: StateWithBooks) => getSearchResultsPagination(state).totalItems;
export const getSearchResultsPageIndex = (state: StateWithBooks) => getSearchResultsPagination(state).pageIndex;
export const getSearchSortParams = (state: StateWithBooks) => getSearch(state).sortParams;
export const getSearchSortType = (state: StateWithBooks) => getSearchSortParams(state).type;
export const getSearchSortDirection = (state: StateWithBooks) => getSearchSortParams(state).direction;
export const getShouldClearSearchQuery = (state: StateWithBooks) => getSearch(state).shouldClearSearchQuery;

export const getUpdatingBookStatus = (state: StateWithBooks) => getBooks(state).updatingBookStatus;
// Export getCategoriesData from common for backwards compatibility
export { getCategoriesData };
export const getShouldReloadCategories = (state: StateWithBooks) => getCategories(state).shouldReloadData;

export const getBookToUpdate = (state: StateWithBooks) => getUpdatedBookValues(state).bookToUpdate;
export const getBookValuesUpdatingStatus = (state: StateWithBooks) => getUpdatedBookValues(state).loadingDataStatus;

export const getUserBookRatings = (state: StateWithBooks) => getBooks(state).bookRatings;

export const deriveBoard = (status: BookStatus) =>
  createSelector([getBoard], (board) => {
    // DEBUG: Логируем состояние board

    // Защита от undefined - возвращаем дефолтное состояние если board или board[status] undefined
    if (!board || !board[status]) {
      const { IDLE } = require('~constants/loadingStatuses');
      return {
        data: [],
        booksCountByYear: [],
        loadingDataStatus: IDLE,
        shouldReloadData: false,
        editableFilterParams: { categoryPaths: [], expanded: [], indeterminated: [], categorySearchQuery: '' },
        filterParams: { categoryPaths: [], expanded: [], indeterminated: [], categorySearchQuery: '' },
        sortParams: { type: '', direction: null },
        pagination: { pageIndex: -1, totalItems: 0, hasNextPage: false },
      };
    }

    const boardState = board[status];

    return boardState;
  });

export const deriveUserBookRating = (bookIdExternal: string) =>
  createSelector([getUserBookRatings], (bookRatings) => bookRatings.find(({ bookId }) => bookId === bookIdExternal));

export const deriveBookListEditableFilterParams = (status: BookStatus) =>
  createSelector(
    [deriveBoard(status)],
    (board) => board?.editableFilterParams || { categoryPaths: [], expanded: [], indeterminated: [], categorySearchQuery: '' },
  );
export const deriveBookListFilterParams = (status: BookStatus) =>
  createSelector(
    [deriveBoard(status)],
    (board) => board?.filterParams || { categoryPaths: [], expanded: [], indeterminated: [], categorySearchQuery: '' },
  );

export const deriveEditableIndeterminatedCategories = (status: BookStatus) =>
  createSelector([deriveBookListEditableFilterParams(status)], (editableFilterParams) => editableFilterParams.indeterminated);

export const deriveIndeterminatedCategories = (status: BookStatus) =>
  createSelector([deriveBookListFilterParams(status)], (filterParams) => filterParams.indeterminated);

export const deriveEditableExpandedCategories = (status: BookStatus) =>
  createSelector([deriveBookListEditableFilterParams(status)], (editableFilterParams) => editableFilterParams.expanded);

export const deriveExpandedCategories = (status: BookStatus) =>
  createSelector([deriveBookListFilterParams(status)], (filterParams) => filterParams.expanded);

export const deriveBookVotes = (bookIdExternal: string) =>
  createSelector([getBookVotes], (bookVotes) => bookVotes.some(({ bookId }) => bookId === bookIdExternal));

export const deriveBookNote = (bookIdExternal: string) =>
  createSelector([getBookNotes], (bookNotes) => bookNotes.find(({ bookId }) => bookId === bookIdExternal));

export const deriveCategorySearchQuery = (status: BookStatus) =>
  createSelector([deriveBookListEditableFilterParams(status)], (editableFilterParams) => editableFilterParams.categorySearchQuery);

export const deriveFilterBookCategoryPaths = (status: BookStatus) =>
  createSelector([deriveBookListFilterParams(status)], (filterParams) => {
    const categoryPaths = filterParams?.categoryPaths;
    return Array.isArray(categoryPaths) ? categoryPaths.filter((item) => item && typeof item === 'string' && item.split('.').length === 3) : [];
  });

export const deriveBooksCountByYear = (status: BookStatus) =>
  createSelector([deriveBoard(status)], (board) => (board && Array.isArray(board.booksCountByYear) ? board.booksCountByYear : []));

export const deriveSearchQuery = createSelector([getSearchQuery], (query) => query.trim());

export const deriveCategoriesSearchResult = (status: BookStatus) =>
  createSelector([getCategoriesData, deriveCategorySearchQuery(status)], (categories, query) => {
    const searchQuery = query.trim().toLowerCase();
    return searchQuery
      ? categories
          .filter(({ path, isCustom }) => isCustom || path.split('.').length === 3)
          .map((item) => {
            const label = item.isCustom ? item.customTitle || item.value : getT('categories')(item.value);
            return { ...item, title: item.value, label };
          })
          .filter(({ label }) => label.toLowerCase().includes(searchQuery))
      : [];
  });

export const deriveBoardData = (status: BookStatus) =>
  createSelector([deriveBoard(status)], (board) => (board && Array.isArray(board.data) ? board.data : []));

export const deriveBookListData = (status: BookStatus) =>
  createSelector([deriveBoardData(status), getCategoriesData], (board, categories) => {
    // Убеждаемся что board это массив
    const boardArray = Array.isArray(board) ? board : [];
    const categoriesArray = Array.isArray(categories) ? categories : [];
    return boardArray.map((book) => ({ ...book, categoryValue: categoriesArray.find((category) => category.path === book.categoryPath)?.value }));
  });

export const deriveSectionedBookListData = (status: BookStatus) =>
  createSelector([deriveBookListData(status), deriveBooksCountByYear(status)], (books, _booksCountByYear) => {
    // DEBUG: Логируем входные данные

    // Убеждаемся что books это массив
    const booksArray = Array.isArray(books) ? books : [];

    // Если массив пустой, возвращаем пустой массив
    if (booksArray.length === 0) {
      return [];
    }

    try {
      const sortedBooks = [...booksArray].sort((a, b) => (b.added || 0) - (a.added || 0));
      const mappedBooks = sortedBooks.map((item) => {
        const monthAndYear = item.added ? new Date(item.added).toLocaleString(i18n.language, { month: 'long', year: 'numeric' }) : 'Invalid Date';
        return {
          ...item,
          monthAndYear,
        };
      });

      const grouped = groupBy(mappedBooks, 'monthAndYear');

      // Убеждаемся что grouped это объект
      if (!grouped || typeof grouped !== 'object') {
        return [];
      }

      const result = map(grouped, (value: any[], key: string) => {
        // DEBUG: Логируем каждую группу
        const isArray = Array.isArray(value);
        const count = isArray ? value.length : 0;

        // Используем реальное количество книг в группе вместо booksCountByYear
        const sortedValue = isArray ? value.sort((a, b) => (b.added || 0) - (a.added || 0)) : [];
        const data = [`${key}/${count}`, sortedValue].flat();
        return data;
      });

      // Убеждаемся что result это массив перед вызовом flat
      const finalResult = Array.isArray(result) ? result.flat() : [];
      return finalResult;
    } catch (error) {
      console.error(`🔍 [deriveSectionedBookListData DEBUG] ${status}: ERROR:`, error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'no stack');
      return [];
    }
  });

export const deriveSearchBookListData = createSelector([getSearchResults, getCategoriesData], (searchResults, categories) =>
  searchResults.map((book) => ({
    ...book,
    categoryValue: categories.find((category) => category.path === book.categoryPath)?.value,
  })),
);

export const deriveLoadingBookListStatus = (status: BookStatus) =>
  createSelector([deriveBoard(status)], (board) => board?.loadingDataStatus || 'idle');

export const deriveShouldReloadBookList = (status: BookStatus) => createSelector([deriveBoard(status)], (board) => board?.shouldReloadData || false);

export const deriveBookListPagination = (status: BookStatus) => createSelector([deriveBoard(status)], (board) => board.pagination);

export const deriveBookListTotalItems = (status: BookStatus) =>
  createSelector([deriveBookListPagination(status)], (pagination) => pagination.totalItems);

export const deriveBookListHasNextPage = (status: BookStatus) =>
  createSelector([deriveBookListPagination(status)], (pagination) => pagination.hasNextPage);

export const deriveBookListPageIndex = (status: BookStatus) =>
  createSelector([deriveBookListPagination(status)], (pagination) => pagination.pageIndex);

export const deriveBookListSortParams = (status: BookStatus) => createSelector([deriveBoard(status)], (board) => board.sortParams);

export const deriveNestedCategories = (fullPath: string) =>
  createSelector([getCategoriesData], (categories) => {
    const splittedPath = fullPath.split('.');
    const level = splittedPath.length;
    if (level === 1) {
      return categories
        .filter(({ path }) => {
          const innerSplittedPath = path.split('.');
          return innerSplittedPath[0] === splittedPath[0];
        })
        .map(({ path }) => path);
    }
    if (level === 2) {
      return categories
        .filter(({ path }) => {
          const innerSplittedPath = path.split('.');
          return innerSplittedPath[0] === splittedPath[0] && innerSplittedPath[1] === splittedPath[1];
        })
        .map(({ path }) => path);
    }
    return [];
  });

export const getCategoryLength = (array: any[], splittedPath: any, level: number, level1: number, level2?: number) =>
  array.filter((item) => {
    const innerSplittedPath = (item.path || item).split('.');
    if (level2) {
      return (
        innerSplittedPath.length === level && innerSplittedPath[level1] === splittedPath[level1] && innerSplittedPath[level2] === splittedPath[level2]
      );
    }
    return innerSplittedPath.length === level && innerSplittedPath[level1] === splittedPath[level1];
  }).length;

export const deriveManageTopLevelCategorySelection = (fullPath: string, status: BookStatus) =>
  createSelector(
    [getCategoriesData, deriveBookListEditableFilterParams(status), deriveEditableIndeterminatedCategories(status)],
    (categories, filterParams, indeterminatedCategories) => {
      const splittedPath = fullPath.split('.');
      const level = splittedPath.length;
      const { categoryPaths } = filterParams;
      const topLevelCategory = `${splittedPath[0]}`;

      if (level === 1) {
        const categoriesToRemoveFromIndeterminated = indeterminatedCategories.filter((path) => {
          const internalSplittedPath = path.split('.');
          const theFirstLevel = internalSplittedPath[0];
          return theFirstLevel === splittedPath[0] ? path : null;
        });
        // rename categoryPath => categoriesToRemoveFromIndeterminated
        return { categoryPath: categoriesToRemoveFromIndeterminated };
      }

      // handling select for the second level items (without nested items)
      if (level === 2) {
        const topLevelCategoryLength = getCategoryLength(categories, splittedPath, 2, 0);
        const selectedCategoryLength = getCategoryLength(categoryPaths as any[], splittedPath, 2, 0);
        if (selectedCategoryLength === 0) {
          return { shouldUnselectTopLevelCategory: true, categoryPath: topLevelCategory };
        }
        if (topLevelCategoryLength - selectedCategoryLength === 0) {
          return { shouldSelectTopLevelCategory: true, categoryPath: topLevelCategory };
        }
        return { shouldIndeterminateTopLevelCategory: topLevelCategory };

        // TODO: handle indeterminate state
      }
      // handling select for the third level items (without nested items)
      if (level === 3) {
        const current2LevelCategoryLength = getCategoryLength(categories, splittedPath, 3, 0, 1);
        const selected2LevelCategoryLength = getCategoryLength(categoryPaths as any[], splittedPath, 3, 0, 1);

        const secondLevelCategory = `${splittedPath[0]}.${splittedPath[1]}`;

        const current1LevelCategoryLength = getCategoryLength(categories, splittedPath, 3, 0);
        const selected1LevelCategoryLength = getCategoryLength(categoryPaths as any[], splittedPath, 3, 0);

        if (current2LevelCategoryLength - selected2LevelCategoryLength === 0 && current1LevelCategoryLength - selected1LevelCategoryLength === 0) {
          return { shouldSelectTopLevelCategory: true, shouldUnselectTopLevelCategory: false, categoryPath: [secondLevelCategory, topLevelCategory] };
        }
        if (selected2LevelCategoryLength === 0 && selected1LevelCategoryLength === 0) {
          return { shouldUnselectTopLevelCategory: true, shouldSelectTopLevelCategory: false, categoryPath: [secondLevelCategory, topLevelCategory] };
        }
        if (current2LevelCategoryLength - selected2LevelCategoryLength === 0) {
          return {
            shouldSelectTopLevelCategory: true,
            shouldUnselectTopLevelCategory: false,
            categoryPath: secondLevelCategory,
            shouldIndeterminateTopLevelCategory: topLevelCategory,
          };
        }
        if (selected2LevelCategoryLength === 0) {
          return {
            shouldUnselectTopLevelCategory: true,
            shouldSelectTopLevelCategory: false,
            categoryPath: secondLevelCategory,
            shouldIndeterminateTopLevelCategory: topLevelCategory,
          };
        }
        return {
          shouldIndeterminateTopLevelCategory: [secondLevelCategory, topLevelCategory],
          shouldUnselectTopLevelCategory: true,
          categoryPath: [secondLevelCategory, topLevelCategory],
        };
      }
      return 0;
    },
  );

export const deriveCategories = (boardType: BookStatus, isForCustomBook?: boolean) =>
  createSelector(
    [getCategoriesData, deriveEditableExpandedCategories(boardType), getExpandedCategories],
    (categories, editableExpandedCategories, expandedCategoriesFromCustomBook) =>
      categories
        .map((category) => {
          const firstLevel = category.path.split('.');
          if (firstLevel.length === 1) {
            const expandedCategories = isForCustomBook ? expandedCategoriesFromCustomBook : editableExpandedCategories;
            return {
              path: category.path,
              title: category.value,
              isExpanded: expandedCategories.includes(category.path),
              isCustom: category.isCustom,
              customId: category.customId,
              customTitle: category.customTitle,
              isMyGenresGroup: category.isMyGenresGroup,
              data: categories
                .map((secondLevelCategory) => {
                  const secondLevel = secondLevelCategory.path.split('.');
                  if (secondLevel.length === 2 && firstLevel[0] === secondLevel[0]) {
                    return {
                      path: secondLevelCategory.path,
                      title: secondLevelCategory.value,
                      isExpanded: expandedCategories.includes(secondLevelCategory.path),
                      isCustom: secondLevelCategory.isCustom,
                      customId: secondLevelCategory.customId,
                      customTitle: secondLevelCategory.customTitle,
                      isMyGenresGroup: secondLevelCategory.isMyGenresGroup,
                      data: categories
                        .map((thirdLevelCategory) => {
                          const thirdLevel = thirdLevelCategory.path.split('.');
                          if (thirdLevel.length === 3 && firstLevel[0] === thirdLevel[0] && thirdLevel[1] === secondLevel[1]) {
                            return {
                              path: thirdLevelCategory.path,
                              title: thirdLevelCategory.value,
                              isCustom: thirdLevelCategory.isCustom,
                              customId: thirdLevelCategory.customId,
                              customTitle: thirdLevelCategory.customTitle,
                              isMyGenresGroup: thirdLevelCategory.isMyGenresGroup,
                            };
                          }
                          return null;
                        })
                        .filter((item) => item !== null),
                    };
                  }
                  return null;
                })
                .filter((item) => item !== null),
            };
          }
          return null;
        })
        .filter((item) => item !== null),
  );

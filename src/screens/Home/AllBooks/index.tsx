import React, { useCallback, useEffect } from 'react';

import { View } from 'react-native';

import { useIsFocused } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '~hooks';

import { ALL } from '~constants/boardType';
import { IDLE, PENDING, SUCCEEDED } from '~constants/loadingStatuses';
import { loadBookList, loadMoreBooks, loadCategories, setBoardType } from '~redux/actions/booksActions';
import {
  deriveBookListData,
  deriveLoadingBookListStatus,
  deriveBookListFilterParams,
  deriveShouldReloadBookList,
  deriveBookListTotalItems,
  deriveFilterBookCategoryPaths,
} from '~redux/selectors/books';
import EmptyResults from '~screens/Home/EmptyResults';
import { BookStatus } from '~types/books';

import ActionBar from '../ActionBar/ActionBar';
import BooksList from '../BooksList';
import styles from './styles';

const AllBooks = () => {
  const isFocused = useIsFocused();

  const dispatch = useAppDispatch();
  const _loadBookList = useCallback(
    ({ boardType, shouldLoadMoreResults }: { boardType: BookStatus; shouldLoadMoreResults: boolean }) =>
      dispatch(loadBookList({ boardType, shouldLoadMoreResults })),
    [dispatch],
  );
  const _loadMoreBooks = useCallback(() => dispatch(loadMoreBooks(ALL)), [dispatch]);
  const _loadCategories = useCallback(() => dispatch(loadCategories(false)), [dispatch]);
  const _setBoardType = useCallback(() => dispatch(setBoardType(ALL)), [dispatch]);

  const bookList = useAppSelector(deriveBookListData(ALL));
  const loadingDataStatus = useAppSelector(deriveLoadingBookListStatus(ALL));
  const filterParams = useAppSelector(deriveBookListFilterParams(ALL));
  const shouldReloadData = useAppSelector(deriveShouldReloadBookList(ALL));
  const totalItems = useAppSelector(deriveBookListTotalItems(ALL));
  const activeFiltersCount = useAppSelector(deriveFilterBookCategoryPaths(ALL))?.length;

  useEffect(() => {
    if (isFocused) {
      _setBoardType();
    }
  }, [isFocused, _setBoardType]);

  useEffect(() => {
    if (isFocused && (loadingDataStatus === IDLE || shouldReloadData)) {
      const loadData = async () => {
        await _loadCategories();
        _loadBookList({
          boardType: ALL,
          shouldLoadMoreResults: false,
        });
      };
      loadData();
    }
  }, [_loadCategories, _loadBookList, loadingDataStatus, shouldReloadData, isFocused]);

  // Отдельный useEffect для обработки shouldReloadData
  useEffect(() => {
    if (shouldReloadData && isFocused) {
      _loadBookList({
        boardType: ALL,
        shouldLoadMoreResults: false,
      });
    }
  }, [shouldReloadData, isFocused, _loadBookList]);

  if (isFocused && bookList.length === 0 && loadingDataStatus === SUCCEEDED && !shouldReloadData) {
    return <EmptyResults />;
  }

  return (
    <View style={styles.wrapper}>
      {loadingDataStatus !== IDLE && loadingDataStatus !== PENDING ? (
        <ActionBar boardType={ALL} filterParams={filterParams} activeFiltersCount={activeFiltersCount} totalItems={totalItems} />
      ) : null}
      <BooksList data={bookList} loadMoreBooks={_loadMoreBooks} loadingDataStatus={loadingDataStatus} />
    </View>
  );
};

export default AllBooks;

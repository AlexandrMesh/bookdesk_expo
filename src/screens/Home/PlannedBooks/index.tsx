import React, { useCallback, useEffect } from 'react';

import { View } from 'react-native';

import { useIsFocused } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '~hooks';

import { PLANNED } from '~constants/boardType';
import { IDLE, PENDING, SUCCEEDED } from '~constants/loadingStatuses';
import { loadBookList, loadMoreBooks, setBoardType } from '~redux/actions/booksActions';
import {
  deriveLoadingBookListStatus,
  deriveShouldReloadBookList,
  deriveBookListTotalItems,
  deriveSectionedBookListData,
} from '~redux/selectors/books';
import EmptyBoard from '~screens/Home/EmptyBoard';
import { BookStatus } from '~types/books';

import styles from './styles';
import ActionBar from '../ActionBar/ActionBar';
import BooksList from '../BooksList';

const PlannedBooks = () => {
  const isFocused = useIsFocused();

  const dispatch = useAppDispatch();
  const _loadBookList = useCallback(
    ({ boardType, shouldLoadMoreResults, forceRefresh }: { boardType: BookStatus; shouldLoadMoreResults: boolean; forceRefresh?: boolean }) =>
      dispatch(loadBookList({ boardType, shouldLoadMoreResults, forceRefresh })),
    [dispatch],
  );
  const _loadMoreBooks = useCallback(() => dispatch(loadMoreBooks(PLANNED)), [dispatch]);
  const _setBoardType = useCallback(() => dispatch(setBoardType(PLANNED)), [dispatch]);

  const sectionedBookListData = useAppSelector(deriveSectionedBookListData(PLANNED));
  const loadingDataStatus = useAppSelector(deriveLoadingBookListStatus(PLANNED));
  const shouldReloadData = useAppSelector(deriveShouldReloadBookList(PLANNED));
  const totalItems = useAppSelector(deriveBookListTotalItems(PLANNED));

  useEffect(() => {
    if (isFocused) {
      _setBoardType();
    }
  }, [isFocused, _setBoardType]);

  useEffect(() => {
    if (isFocused && (loadingDataStatus === IDLE || shouldReloadData)) {
      _loadBookList({
        boardType: PLANNED,
        shouldLoadMoreResults: false,
        forceRefresh: shouldReloadData,
      });
    }
  }, [_loadBookList, loadingDataStatus, shouldReloadData, isFocused]);

  if (sectionedBookListData.length === 0 && loadingDataStatus === SUCCEEDED && !shouldReloadData) {
    return <EmptyBoard />;
  }

  return (
    <View style={styles.wrapper}>
      {loadingDataStatus !== IDLE && loadingDataStatus !== PENDING ? (
        <ActionBar boardType={PLANNED} shouldRenderFilterButton={false} totalItems={totalItems} />
      ) : null}
      <BooksList data={sectionedBookListData} loadMoreBooks={_loadMoreBooks} loadingDataStatus={loadingDataStatus} />
    </View>
  );
};

export default PlannedBooks;

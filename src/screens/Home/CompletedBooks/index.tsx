import React, { useCallback, useEffect } from 'react';

import { View } from 'react-native';

import { useIsFocused } from '@react-navigation/native';

import { COMPLETED } from '~constants/boardType';
import { IDLE, SUCCEEDED, PENDING } from '~constants/loadingStatuses';
import { useAppDispatch, useAppSelector } from '~hooks';
import { loadBookList, loadMoreBooks, setBoardType } from '~redux/actions/booksActions';
import {
  deriveLoadingBookListStatus,
  deriveShouldReloadBookList,
  deriveBookListTotalItems,
  deriveSectionedBookListData,
} from '~redux/selectors/books';
import EmptyBoard from '~screens/Home/EmptyBoard';
import { BookStatus } from '~types/books';

import ActionBar from '../ActionBar/ActionBar';
import BooksList from '../BooksList';
import styles from './styles';

const CompletedBooks = () => {
  const isFocused = useIsFocused();

  const dispatch = useAppDispatch();
  const _loadBookList = useCallback(
    ({ boardType, shouldLoadMoreResults }: { boardType: BookStatus; shouldLoadMoreResults: boolean }) =>
      dispatch(loadBookList({ boardType, shouldLoadMoreResults })),
    [dispatch],
  );
  const _loadMoreBooks = useCallback(() => dispatch(loadMoreBooks(COMPLETED)), [dispatch]);
  const _setBoardType = useCallback(() => dispatch(setBoardType(COMPLETED)), [dispatch]);

  const sectionedBookListData = useAppSelector(deriveSectionedBookListData(COMPLETED));
  const loadingDataStatus = useAppSelector(deriveLoadingBookListStatus(COMPLETED));
  const shouldReloadData = useAppSelector(deriveShouldReloadBookList(COMPLETED));
  const totalItems = useAppSelector(deriveBookListTotalItems(COMPLETED));

  useEffect(() => {
    if (isFocused) {
      _setBoardType();
    }
  }, [isFocused, _setBoardType]);

  useEffect(() => {
    if (isFocused && (loadingDataStatus === IDLE || shouldReloadData)) {
      _loadBookList({
        boardType: COMPLETED,
        shouldLoadMoreResults: false,
      });
    }
  }, [_loadBookList, loadingDataStatus, shouldReloadData, isFocused]);

  if (sectionedBookListData.length === 0 && loadingDataStatus === SUCCEEDED && !shouldReloadData) {
    return <EmptyBoard />;
  }

  return (
    <View style={styles.wrapper}>
      {loadingDataStatus !== IDLE && loadingDataStatus !== PENDING ? (
        <ActionBar boardType={COMPLETED} shouldRenderFilterButton={false} totalItems={totalItems} />
      ) : null}
      <BooksList data={sectionedBookListData} loadMoreBooks={_loadMoreBooks} loadingDataStatus={loadingDataStatus} />
    </View>
  );
};

export default CompletedBooks;

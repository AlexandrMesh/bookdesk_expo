import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import EmptyBoard from '~screens/Home/EmptyBoard';
import { IDLE, PENDING, SUCCEEDED } from '~constants/loadingStatuses';
import { IN_PROGRESS } from '~constants/boardType';
import { useAppDispatch, useAppSelector } from '~hooks';
import {
  deriveLoadingBookListStatus,
  deriveBookListTotalItems,
  deriveShouldReloadBookList,
  deriveSectionedBookListData,
} from '~redux/selectors/books';
import { loadBookList, loadMoreBooks, setBoardType } from '~redux/actions/booksActions';
import { BookStatus } from '~types/books';
import BooksList from '../BooksList';
import ActionBar from '../ActionBar/ActionBar';
import styles from './styles';

const InProgressBooks = () => {
  const isFocused = useIsFocused();

  const dispatch = useAppDispatch();
  const _loadBookList = useCallback(
    ({ boardType, shouldLoadMoreResults }: { boardType: BookStatus; shouldLoadMoreResults: boolean }) =>
      dispatch(loadBookList({ boardType, shouldLoadMoreResults })),
    [dispatch],
  );
  const _loadMoreBooks = useCallback(() => dispatch(loadMoreBooks(IN_PROGRESS)), [dispatch]);
  const _setBoardType = useCallback(() => dispatch(setBoardType(IN_PROGRESS)), [dispatch]);

  const sectionedBookListData = useAppSelector(deriveSectionedBookListData(IN_PROGRESS));
  const loadingDataStatus = useAppSelector(deriveLoadingBookListStatus(IN_PROGRESS));
  const shouldReloadData = useAppSelector(deriveShouldReloadBookList(IN_PROGRESS));
  const totalItems = useAppSelector(deriveBookListTotalItems(IN_PROGRESS));

  useEffect(() => {
    if (isFocused) {
      _setBoardType();
    }
  }, [isFocused, _setBoardType]);

  useEffect(() => {
    if (isFocused && (loadingDataStatus === IDLE || shouldReloadData)) {
      _loadBookList({
        boardType: IN_PROGRESS,
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
        <ActionBar boardType={IN_PROGRESS} shouldRenderFilterButton={false} totalItems={totalItems} />
      ) : null}
      <BooksList data={sectionedBookListData} loadMoreBooks={_loadMoreBooks} loadingDataStatus={loadingDataStatus} />
    </View>
  );
};

export default InProgressBooks;

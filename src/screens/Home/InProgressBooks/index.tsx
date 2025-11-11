import React, { useCallback, useEffect } from 'react';

import { View } from 'react-native';

import { useIsFocused, useNavigation } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '~hooks';

import { IN_PROGRESS } from '~constants/boardType';
import { IDLE, PENDING, SUCCEEDED } from '~constants/loadingStatuses';
import { ADD_CUSTOM_BOOK_NAVIGATOR_ROUTE, CUSTOM_BOOKS_ROUTE } from '~constants/routes';
import { loadBookList, loadCategories, loadMoreBooks, setBoardType } from '~redux/actions/booksActions';
import { setStatus } from '~redux/actions/customBookActions';
import {
  deriveLoadingBookListStatus,
  deriveBookListTotalItems,
  deriveShouldReloadBookList,
  deriveSectionedBookListData,
} from '~redux/selectors/books';
import EmptyBoard from '~screens/Home/EmptyBoard';
import { BookStatus } from '~types/books';

import styles from './styles';
import ActionBar from '../ActionBar/ActionBar';
import BooksList from '../BooksList';

const InProgressBooks = () => {
  const isFocused = useIsFocused();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();

  const dispatch = useAppDispatch();
  const _loadBookList = useCallback(
    ({ boardType, shouldLoadMoreResults, forceRefresh }: { boardType: BookStatus; shouldLoadMoreResults: boolean; forceRefresh?: boolean }) =>
      dispatch(loadBookList({ boardType, shouldLoadMoreResults, forceRefresh })),
    [dispatch],
  );
  const _loadMoreBooks = useCallback(() => dispatch(loadMoreBooks(IN_PROGRESS)), [dispatch]);
  const _loadCategories = useCallback(() => dispatch(loadCategories(false)), [dispatch]);
  const _setBoardType = useCallback(() => dispatch(setBoardType(IN_PROGRESS)), [dispatch]);
  const _goToAddBook = useCallback(() => {
    dispatch(setStatus(IN_PROGRESS));
    navigation.navigate(ADD_CUSTOM_BOOK_NAVIGATOR_ROUTE, {
      screen: CUSTOM_BOOKS_ROUTE,
      params: { initialStatus: IN_PROGRESS },
    });
  }, [dispatch, navigation]);

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
      const loadData = async () => {
        await _loadCategories();
        _loadBookList({
          boardType: IN_PROGRESS,
          shouldLoadMoreResults: false,
          forceRefresh: shouldReloadData,
        });
      };
      loadData();
    }
  }, [_loadCategories, _loadBookList, loadingDataStatus, shouldReloadData, isFocused]);

  if (sectionedBookListData.length === 0 && loadingDataStatus === SUCCEEDED && !shouldReloadData) {
    return <EmptyBoard onAddPress={_goToAddBook} />;
  }

  return (
    <View style={styles.wrapper}>
      {loadingDataStatus !== IDLE && loadingDataStatus !== PENDING ? (
        <ActionBar boardType={IN_PROGRESS} shouldRenderFilterButton={false} totalItems={totalItems} />
      ) : null}
      <BooksList data={sectionedBookListData} loadMoreBooks={_loadMoreBooks} loadingDataStatus={loadingDataStatus} onPressAdd={_goToAddBook} />
    </View>
  );
};

export default InProgressBooks;

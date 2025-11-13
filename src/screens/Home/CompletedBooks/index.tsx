import React, { useCallback, useEffect } from 'react';

import { View } from 'react-native';

import { useIsFocused, useNavigation } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '~hooks';

import { COMPLETED } from '~constants/boardType';
import { IDLE, SUCCEEDED, PENDING } from '~constants/loadingStatuses';
import { ADD_CUSTOM_BOOK_NAVIGATOR_ROUTE, CUSTOM_BOOKS_ROUTE } from '~constants/routes';
import { loadBookList, loadCategories, loadMoreBooks, setBoardType } from '~redux/actions/booksActions';
import { setStatus } from '~redux/actions/customBookActions';
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
  const navigation = useNavigation<any>();

  const dispatch = useAppDispatch();
  const _loadBookList = useCallback(
    ({ boardType, shouldLoadMoreResults, forceRefresh }: { boardType: BookStatus; shouldLoadMoreResults: boolean; forceRefresh?: boolean }) =>
      dispatch(loadBookList({ boardType, shouldLoadMoreResults, forceRefresh })),
    [dispatch],
  );
  const _loadMoreBooks = useCallback(() => dispatch(loadMoreBooks(COMPLETED)), [dispatch]);
  const _loadCategories = useCallback(() => dispatch(loadCategories(false)), [dispatch]);
  const _setBoardType = useCallback(() => dispatch(setBoardType(COMPLETED)), [dispatch]);
  const _goToAddBook = useCallback(() => {
    dispatch(setStatus(COMPLETED));
    navigation.navigate(ADD_CUSTOM_BOOK_NAVIGATOR_ROUTE, {
      screen: CUSTOM_BOOKS_ROUTE,
      params: { initialStatus: COMPLETED },
    });
  }, [dispatch, navigation]);

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
      const loadData = async () => {
        await _loadCategories();
        _loadBookList({
          boardType: COMPLETED,
          shouldLoadMoreResults: false,
          forceRefresh: false, // Загружаем из кэша (данные универсальные для всех языков)
        });
      };
      loadData();
    }
  }, [_loadCategories, _loadBookList, loadingDataStatus, shouldReloadData, isFocused]);

  if ((!sectionedBookListData || sectionedBookListData.length === 0) && loadingDataStatus === SUCCEEDED && !shouldReloadData) {
    return <EmptyBoard onAddPress={_goToAddBook} />;
  }

  return (
    <View style={styles.wrapper}>
      {loadingDataStatus !== IDLE && loadingDataStatus !== PENDING ? (
        <ActionBar boardType={COMPLETED} shouldRenderFilterButton={false} totalItems={totalItems} />
      ) : null}
      <BooksList data={sectionedBookListData || []} loadMoreBooks={_loadMoreBooks} loadingDataStatus={loadingDataStatus} onPressAdd={_goToAddBook} />
    </View>
  );
};

export default CompletedBooks;

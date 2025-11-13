import React, { useCallback, useEffect } from 'react';

import { View } from 'react-native';

import { useIsFocused } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '~hooks';

import { PLANNED } from '~constants/boardType';
import { IDLE, PENDING, SUCCEEDED } from '~constants/loadingStatuses';
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

import styles from './styles';
import ActionBar from '../ActionBar/ActionBar';
import BooksList from '../BooksList';

const PlannedBooks = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();

  const dispatch = useAppDispatch();
  const _loadBookList = useCallback(
    ({ boardType, shouldLoadMoreResults, forceRefresh }: { boardType: BookStatus; shouldLoadMoreResults: boolean; forceRefresh?: boolean }) =>
      dispatch(loadBookList({ boardType, shouldLoadMoreResults, forceRefresh })),
    [dispatch],
  );
  const _loadMoreBooks = useCallback(() => dispatch(loadMoreBooks(PLANNED)), [dispatch]);
  const _loadCategories = useCallback(() => dispatch(loadCategories(false)), [dispatch]);
  const _setBoardType = useCallback(() => dispatch(setBoardType(PLANNED)), [dispatch]);
  const _goToAddBook = useCallback(() => {
    dispatch(setStatus(PLANNED));
    navigation.navigate(ADD_CUSTOM_BOOK_NAVIGATOR_ROUTE, {
      screen: CUSTOM_BOOKS_ROUTE,
      params: { initialStatus: PLANNED },
    });
  }, [dispatch, navigation]);

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
      const loadData = async () => {
        await _loadCategories();
        _loadBookList({
          boardType: PLANNED,
          shouldLoadMoreResults: false,
          forceRefresh: false, // Загружаем из кэша (данные универсальные для всех языков)
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
        <ActionBar boardType={PLANNED} shouldRenderFilterButton={false} totalItems={totalItems} />
      ) : null}
      <BooksList data={sectionedBookListData} loadMoreBooks={_loadMoreBooks} loadingDataStatus={loadingDataStatus} onPressAdd={_goToAddBook} />
    </View>
  );
};

export default PlannedBooks;

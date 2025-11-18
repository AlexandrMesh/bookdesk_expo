import React, { useCallback, useEffect } from 'react';

import { View, Text } from 'react-native';

import { useRoute, useIsFocused, useFocusEffect, RouteProp } from '@react-navigation/native';
import isEmpty from 'lodash/isEmpty';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import { ALL } from '~constants/boardType';
import { PENDING, SUCCEEDED } from '~constants/loadingStatuses';
import { clearSearchResults, loadSearchResults, setBoardType } from '~redux/actions/booksActions';
import {
  deriveSearchBookListData,
  deriveSearchQuery,
  getLoadingSearchResultsStatus,
  getSearchResultsTotalItems,
  getShouldReloadSearchResults,
} from '~redux/selectors/books';
import TotalCount from '~screens/Home/ActionBar/TotalCount';
import BooksList from '~screens/Home/BooksList';
import EmptyResults from '~screens/Home/EmptyResults';
import { BookStatus } from '~types/books';

import styles from './styles';

type ParamList = {
  SearchResults: {
    boardType: BookStatus;
  };
};

const SearchResults = () => {
  const { t } = useTranslation('search');
  const isFocused = useIsFocused();

  const { params } = useRoute<RouteProp<ParamList, 'SearchResults'>>();

  const dispatch = useAppDispatch();
  const _loadSearchResults = useCallback(
    (shouldLoadMoreResults: boolean) => dispatch(loadSearchResults({ shouldLoadMoreResults, boardType: params.boardType })),
    [dispatch, params.boardType],
  );
  const _setBoardType = useCallback(() => dispatch(setBoardType(ALL)), [dispatch]);
  const _clearSearchResults = useCallback(() => dispatch(clearSearchResults()), [dispatch]);

  const searchResult = useAppSelector(deriveSearchBookListData);
  const searchQuery = useAppSelector(deriveSearchQuery) as string;
  const loadingDataStatus = useAppSelector(getLoadingSearchResultsStatus);
  const totalItems = useAppSelector(getSearchResultsTotalItems);
  const shouldReloadData = useAppSelector(getShouldReloadSearchResults);

  // Сбрасываем данные поиска при открытии экрана
  useFocusEffect(
    useCallback(() => {
      _clearSearchResults();
      _setBoardType();
    }, [_clearSearchResults, _setBoardType]),
  );

  useEffect(() => {
    if (!isEmpty(searchQuery) && shouldReloadData) {
      _loadSearchResults(false);
    }
  }, [searchQuery, _loadSearchResults, shouldReloadData]);

  if (isEmpty(searchQuery)) {
    return (
      <View style={styles.wrapper}>
        <View>
          <Text style={styles.label}>{t('findBook')}</Text>
        </View>
      </View>
    );
  }

  if (searchResult.length === 0 && loadingDataStatus === SUCCEEDED && !shouldReloadData) {
    return <EmptyResults />;
  }

  return (
    <>
      {loadingDataStatus === PENDING ? null : <TotalCount count={searchResult.length > 0 ? totalItems : 0} />}
      <BooksList data={searchResult} loadingDataStatus={loadingDataStatus} />
    </>
  );
};

export default SearchResults;

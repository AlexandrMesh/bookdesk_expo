import React, { useCallback, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRoute, useIsFocused, RouteProp } from '@react-navigation/native';
import isEmpty from 'lodash/isEmpty';
import { useTranslation } from 'react-i18next';
import EmptyResults from '~screens/Home/EmptyResults';
import TotalCount from '~screens/Home/ActionBar/TotalCount';
import { PENDING, SUCCEEDED } from '~constants/loadingStatuses';
import { ALL } from '~constants/boardType';
import {
  deriveSearchBookListData,
  deriveSearchQuery,
  getLoadingSearchResultsStatus,
  getSearchResultsTotalItems,
  getShouldReloadSearchResults,
} from '~redux/selectors/books';
import { loadSearchResults, loadMoreSearchResults, setBoardType } from '~redux/actions/booksActions';
import { useAppDispatch, useAppSelector } from '~hooks';
import BooksList from '~screens/Home/BooksList';
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
  const _loadMoreSearchResults = () => dispatch(loadMoreSearchResults(params.boardType));
  const _setBoardType = useCallback(() => dispatch(setBoardType(ALL)), [dispatch]);

  const searchResult = useAppSelector(deriveSearchBookListData);
  const searchQuery = useAppSelector(deriveSearchQuery) as string;
  const loadingDataStatus = useAppSelector(getLoadingSearchResultsStatus);
  const totalItems = useAppSelector(getSearchResultsTotalItems);
  const shouldReloadData = useAppSelector(getShouldReloadSearchResults);

  useEffect(() => {
    if (isFocused) {
      _setBoardType();
    }
  }, [isFocused, _setBoardType]);

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
      <BooksList loadMoreBooks={_loadMoreSearchResults} data={searchResult} loadingDataStatus={loadingDataStatus} />
    </>
  );
};

export default SearchResults;

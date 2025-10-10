import React, { useEffect, useCallback } from 'react';

import { View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { PENDING, IDLE } from '~constants/loadingStatuses';
import { useAppDispatch, useAppSelector } from '~hooks';
import useDebouncedSearch from '~hooks/useDebouncedSearch';
import { setSearchQuery, clearSearchResults, triggerShouldNotClearSearchQuery } from '~redux/actions/booksActions';
import { deriveSearchQuery, getShouldClearSearchQuery, getLoadingSearchResultsStatus } from '~redux/selectors/books';
import Input from '~UI/TextInput';

import styles from './styles';

const SearchBar = () => {
  const { t } = useTranslation(['books', 'common', 'search']);
  const dispatch = useAppDispatch();

  const _setSearchQuery = (query: string) => dispatch(setSearchQuery(query));
  const _clearSearchResults = useCallback(() => dispatch(clearSearchResults()), [dispatch]);
  const _triggerShouldNotClearSearchQuery = useCallback(() => dispatch(triggerShouldNotClearSearchQuery()), [dispatch]);

  const searchQuery = useAppSelector(deriveSearchQuery);
  const shouldClearSearchQuery = useAppSelector(getShouldClearSearchQuery);
  const loadingDataStatus = useAppSelector(getLoadingSearchResultsStatus);

  const [searchQueryValue, handleChangeQuery, clearSearchText, isBusy] = useDebouncedSearch(_setSearchQuery, searchQuery, 600);

  const handleClear = useCallback(() => {
    if (loadingDataStatus === PENDING || loadingDataStatus === IDLE || isBusy) {
      return false;
    }
    (clearSearchText as any)();
    _clearSearchResults();
    return true;
  }, [_clearSearchResults, clearSearchText, isBusy, loadingDataStatus]);

  const onChangeText = useCallback(
    (value: string) => {
      _triggerShouldNotClearSearchQuery();
      (handleChangeQuery as any)(value);
    },
    [_triggerShouldNotClearSearchQuery, handleChangeQuery],
  );

  useEffect(() => {
    if (shouldClearSearchQuery) {
      (clearSearchText as any)();
    }
  }, [clearSearchText, shouldClearSearchQuery]);

  return (
    <View style={styles.wrapper}>
      <Input
        placeholder={t('search:enterSearchQuery')}
        onChangeText={onChangeText}
        autoFocus={!searchQueryValue}
        value={searchQueryValue as string}
        shouldDisplayClearButton={!!searchQueryValue && !isBusy && loadingDataStatus !== PENDING && loadingDataStatus !== IDLE}
        validateable={false}
        onClear={handleClear}
      />
    </View>
  );
};

export default SearchBar;

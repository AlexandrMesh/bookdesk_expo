import React, { useCallback, useEffect } from 'react';

import { FlatList, Pressable, SectionList, Text, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import ArrowDown from '~assets/arrow-down.svg';
import { ALL } from '~constants/boardType';
import { FILTER_ICON } from '~constants/dimensions';
import { SECONDARY } from '~constants/themes';
import {
  clearFilters,
  clearSearchQueryForCategory,
  manageFilters,
  populateFilters,
  resetCategories,
  searchCategory,
  toggleExpandedCategoryBooks,
  triggerReloadBookList,
} from '~redux/actions/booksActions';
import {
  deriveBookListEditableFilterParams,
  deriveBookListFilterParams,
  deriveCategories,
  deriveCategoriesSearchResult,
  deriveCategorySearchQuery,
  deriveEditableIndeterminatedCategories,
  getBoardType,
} from '~redux/selectors/books';
import { BookStatus } from '~types/books';
import Button from '~UI/Button';
import CheckBox from '~UI/CheckBox';
import Input from '~UI/TextInput';

import styles from './styles';

const Filtering = () => {
  const { t } = useTranslation(['common', 'categories']);
  const navigation = useNavigation();

  const dispatch = useAppDispatch();

  const _manageFilters = useCallback((path: string, categoryPaths: string[]) => dispatch(manageFilters(path, ALL, categoryPaths)), [dispatch]);
  const applyFiltersAll = useCallback(() => {
    dispatch(populateFilters(ALL));
    dispatch(triggerReloadBookList(ALL));
  }, [dispatch]);
  const _toggleExpandedCategory = useCallback((path: string) => dispatch(toggleExpandedCategoryBooks({ path, boardType: ALL })), [dispatch]);
  const _searchCategory = useCallback((query: string) => dispatch(searchCategory({ boardType: ALL, query })), [dispatch]);
  const _clearSearchQueryForCategory = useCallback(() => dispatch(clearSearchQueryForCategory(ALL)), [dispatch]);
  const _clearFilters = useCallback(() => dispatch(clearFilters(ALL)), [dispatch]);

  const boardType = useAppSelector(getBoardType) as BookStatus; // kept for other logic if needed
  const categories = useAppSelector(deriveCategories(ALL));
  const indeterminatedCategories = useAppSelector(deriveEditableIndeterminatedCategories(ALL));
  const editableFilterParams = useAppSelector(deriveBookListEditableFilterParams(ALL));
  const appliedFilterParams = useAppSelector(deriveBookListFilterParams(ALL));
  const searchQuery = useAppSelector(deriveCategorySearchQuery(ALL));
  const categoriesSearchResult = useAppSelector(deriveCategoriesSearchResult(ALL));

  const handleFilter = useCallback(() => {
    applyFiltersAll();
    navigation.goBack();
  }, [applyFiltersAll, navigation]);

  const handleReset = useCallback(() => {
    _clearFilters();
    applyFiltersAll();
    navigation.goBack();
  }, [_clearFilters, applyFiltersAll, navigation]);

  const { categoryPaths } = editableFilterParams;
  const { categoryPaths: appliedCategoryPaths } = appliedFilterParams;

  const shouldDisplaySearchResults = searchQuery;

  const emptySearchResult = () => (
    <View style={styles.emptyResult}>
      <Text style={styles.emptyLabel}>{t('noCategories')}</Text>
    </View>
  );

  const renderCategoryItem = useCallback(
    ({ value, path, isExpanded, isSearchResult }: any) => {
      const splittedPath = path.split('.');
      const level = splittedPath.length;
      const iconWrapperStyle = () => {
        if (level === 1) {
          return styles.firstLevel;
        }
        return null;
      };

      const shouldDisplayArrowIcon = level === 1 || level === 2;
      const indeterminate = indeterminatedCategories.includes(path);

      return (
        <View key={path} style={[styles.menuItem, isSearchResult && styles.searchResult]}>
          {!isSearchResult && (
            <Pressable
              disabled={!shouldDisplayArrowIcon}
              onPress={() => _toggleExpandedCategory(path)}
              style={[styles.arrowIconWrapper, iconWrapperStyle()]}
            >
              {shouldDisplayArrowIcon ? (
                <ArrowDown style={isExpanded ? null : styles.collapsed} width={FILTER_ICON.width} height={FILTER_ICON.height} />
              ) : null}
            </Pressable>
          )}
          <Pressable style={styles.labelWrapper} onPress={() => _manageFilters(path, categoryPaths)}>
            <Text style={styles.menuItemTitle}>{t(`categories:${value}`)}</Text>
            <CheckBox isChecked={categoryPaths.includes(path)} indeterminate={indeterminate} />
          </Pressable>
        </View>
      );
    },
    [categoryPaths, indeterminatedCategories, _manageFilters, t, _toggleExpandedCategory],
  );

  const getKeyExtractorForCategory = useCallback((item: any) => item.path, []);

  const renderItemForCategory = useCallback(
    ({ item }: any) => renderCategoryItem({ value: item.title, path: item.path, isExpanded: item.isExpanded }),
    [renderCategoryItem],
  );

  const renderCategory = useCallback(
    ({ value, path, isExpanded, data }: any) => {
      return (
        <>
          {renderCategoryItem({ value, path, isExpanded })}
          {isExpanded && data.length > 0 && (
            <FlatList keyboardShouldPersistTaps='handled' data={data} renderItem={renderItemForCategory} keyExtractor={getKeyExtractorForCategory} />
          )}
        </>
      );
    },
    [getKeyExtractorForCategory, renderCategoryItem, renderItemForCategory],
  );

  const getKeyExtractorForSearch = useCallback((item: any) => item.path, []);

  const renderItemForSearch = useCallback(
    ({ item }: any) => renderCategoryItem({ value: item.title, path: item.path, isSearchResult: true }),
    [renderCategoryItem],
  );

  const renderSearchResults = () => {
    if (shouldDisplaySearchResults) {
      return (
        <FlatList
          keyboardShouldPersistTaps='handled'
          data={categoriesSearchResult}
          renderItem={renderItemForSearch}
          keyExtractor={getKeyExtractorForSearch}
          ListEmptyComponent={emptySearchResult()}
        />
      );
    }
    return null;
  };

  const getKeyExtractor = useCallback((item: any) => item.path, []);

  const renderItem = useCallback(
    ({ item, section }: any) =>
      section.isExpanded &&
      renderCategory({ value: item.title, path: item.path, isExpanded: item.isExpanded, data: item.data, section: item.isExpanded }),
    [renderCategory],
  );

  const renderSectionHeader = useCallback(
    ({ section }: any) => renderCategoryItem({ value: section.title, path: section.path, isExpanded: section.isExpanded }),
    [renderCategoryItem],
  );

  useEffect(() => {
    dispatch(resetCategories(ALL));
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <Input
        placeholder={t('searchCategory')}
        onChangeText={_searchCategory}
        value={searchQuery}
        validateable={false}
        shouldDisplayClearButton={!!searchQuery}
        onClear={_clearSearchQueryForCategory}
      />
      <View style={styles.wrapper}>
        {renderSearchResults()}
        {!searchQuery && (
          <SectionList
            keyboardShouldPersistTaps='handled'
            sections={categories}
            keyExtractor={getKeyExtractor}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
          />
        )}
      </View>
      <View style={styles.submitButtonWrapper}>
        {appliedCategoryPaths.length > 0 ? (
          <View style={styles.buttonsRow}>
            <Button style={styles.filterButton} title={t('toFilter')} onPress={handleFilter} />
            <Button style={styles.resetButton} theme={SECONDARY} title={t('reset')} onPress={handleReset} />
          </View>
        ) : (
          <Button style={styles.submitButton} title={t('toFilter')} onPress={handleFilter} />
        )}
      </View>
    </View>
  );
};

export default Filtering;

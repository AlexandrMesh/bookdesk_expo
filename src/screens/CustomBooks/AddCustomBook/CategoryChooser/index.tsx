import React, { useCallback, useEffect } from 'react';

import { FlatList, Pressable, SectionList, Text, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import ArrowDown from '~assets/arrow-down.svg';
import { ALL } from '~constants/boardType';
import { FILTER_ICON } from '~constants/dimensions';
import { useAppDispatch, useAppSelector } from '~hooks';
import { clearCategory, selectCategory, setSearchQuery, submitCategory, toggleExpandedCategoryCustomBooks } from '~redux/actions/customBookActions';
import { deriveCategories } from '~redux/selectors/books';
import { deriveCategoriesSearchResult, getCategorySearchQuery, getEditableSelectedCategoryPath } from '~redux/selectors/customBook';
import Button from '~UI/Button';
import RadioButton from '~UI/RadioButton';
import Input from '~UI/TextInput';

import styles from './styles';

const CategoryChooser = () => {
  const { t } = useTranslation(['common', 'categories']);
  const navigation = useNavigation();

  const dispatch = useAppDispatch();
  const _toggleExpandedCategory = useCallback((path: string) => dispatch(toggleExpandedCategoryCustomBooks(path)), [dispatch]);
  const _selectCategory = useCallback((category: { path: string; label: string }) => dispatch(selectCategory(category)), [dispatch]);
  const _setSearchQuery = (query: string) => dispatch(setSearchQuery(query));
  const clearSearchQueryForCategory = () => dispatch(setSearchQuery(''));
  const _submitCategory = () => dispatch(submitCategory());

  const categories = useAppSelector(deriveCategories(ALL, true));
  const searchQuery = useAppSelector(getCategorySearchQuery);
  const categoriesSearchResult = useAppSelector(deriveCategoriesSearchResult);
  const selectedCategoryPath = useAppSelector(getEditableSelectedCategoryPath);

  const handleChoose = () => {
    _submitCategory();
    navigation.goBack();
  };

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
          <Pressable
            style={styles.labelWrapper}
            onPress={() => (level === 3 ? _selectCategory({ label: value, path }) : _toggleExpandedCategory(path))}
          >
            <Text style={styles.menuItemTitle}>{t(`categories:${value}`)}</Text>
            {level === 3 && <RadioButton isSelected={selectedCategoryPath === path} />}
          </Pressable>
        </View>
      );
    },
    [_selectCategory, selectedCategoryPath, t, _toggleExpandedCategory],
  );

  const getKeyExtractorForCategory = useCallback((item: any) => item.path, []);

  const renderItemForCategory = useCallback(({ item }: any) => renderCategoryItem({ value: item.title, path: item.path }), [renderCategoryItem]);

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
    dispatch(clearCategory());
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <Input
        placeholder={t('searchCategory')}
        onChangeText={_setSearchQuery}
        value={searchQuery}
        validateable={false}
        shouldDisplayClearButton={!!searchQuery}
        onClear={clearSearchQueryForCategory}
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
        <Button style={styles.submitButton} title={t('choose')} onPress={handleChoose} />
      </View>
    </View>
  );
};

export default CategoryChooser;

import React, { useCallback, useEffect, useState } from 'react';

import { Alert, FlatList, Modal, Pressable, SectionList, Text, View } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import ArrowDown from '~assets/arrow-down.svg';
import { ALL } from '~constants/boardType';
import { FILTER_ICON } from '~constants/dimensions';
import { SECONDARY } from '~constants/themes';
import { addCustomGenre, deleteCustomGenre, updateCustomGenre } from '~redux/actions/booksActions';
import { clearCategory, selectCategory, setSearchQuery, submitCategory, toggleExpandedCategoryCustomBooks } from '~redux/actions/customBookActions';
import { deriveCategories } from '~redux/selectors/books';
import { deriveCategoriesSearchResult, getCategorySearchQuery, getEditableSelectedCategoryPath } from '~redux/selectors/customBook';
import colors from '~styles/colors';
import Button from '~UI/Button';
import RadioButton from '~UI/RadioButton';
import Input from '~UI/TextInput';

import styles from './styles';

const MY_GENRES_GROUP_PATH = 'myGenres';

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

  const [isCustomGenreModalVisible, setCustomGenreModalVisible] = useState(false);
  const [customGenreName, setCustomGenreName] = useState('');
  const [customGenreError, setCustomGenreError] = useState<string | null>(null);
  const [editingCustomGenre, setEditingCustomGenre] = useState<{ id: string; title: string } | null>(null);
  const [isSavingCustomGenre, setIsSavingCustomGenre] = useState(false);

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

  const openAddCustomGenreModal = useCallback(() => {
    setEditingCustomGenre(null);
    setCustomGenreName('');
    setCustomGenreError(null);
    setCustomGenreModalVisible(true);
  }, []);

  const closeCustomGenreModal = useCallback(() => {
    setCustomGenreModalVisible(false);
    setCustomGenreName('');
    setCustomGenreError(null);
    setEditingCustomGenre(null);
  }, []);

  const openEditCustomGenreModal = useCallback((category: { customId?: string; customTitle?: string; title?: string }) => {
    if (!category?.customId) {
      return;
    }
    const currentTitle = category.customTitle || category.title || '';
    setEditingCustomGenre({ id: category.customId, title: currentTitle });
    setCustomGenreName(currentTitle);
    setCustomGenreError(null);
    setCustomGenreModalVisible(true);
  }, []);

  const handleSaveCustomGenre = useCallback(async () => {
    const trimmedName = customGenreName.trim();
    if (!trimmedName) {
      setCustomGenreError(t('categories:genreNameRequired'));
      return;
    }
    setIsSavingCustomGenre(true);
    try {
      if (editingCustomGenre?.id) {
        await dispatch(updateCustomGenre({ id: editingCustomGenre.id, title: trimmedName })).unwrap();
      } else {
        await dispatch(addCustomGenre(trimmedName)).unwrap();
      }
      closeCustomGenreModal();
    } catch (error) {
      console.error('Error saving custom genre:', error);
    } finally {
      setIsSavingCustomGenre(false);
    }
  }, [closeCustomGenreModal, customGenreName, dispatch, editingCustomGenre, t]);

  const handleDeleteCustomGenre = useCallback(() => {
    if (!editingCustomGenre?.id) {
      return;
    }
    Alert.alert('', t('categories:deleteGenreConfirmation'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('common:remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(deleteCustomGenre(editingCustomGenre.id)).unwrap();
            closeCustomGenreModal();
          } catch (error) {
            console.error('Error deleting custom genre:', error);
          }
        },
      },
    ]);
  }, [closeCustomGenreModal, dispatch, editingCustomGenre, t]);

  const renderCategoryItem = useCallback(
    ({ item, isSearchResult }: { item: any; isSearchResult?: boolean }) => {
      if (!item) {
        return null;
      }
      const { path, title, isExpanded, isMyGenresGroup, isCustom, customTitle, customId } = item;
      const splittedPath = path.split('.');
      const level = splittedPath.length;
      const iconWrapperStyle = level === 1 ? styles.firstLevel : null;
      const isLeafCategory = level === 3 || isCustom;
      const shouldDisplayArrowIcon = !isSearchResult && !isLeafCategory && (level === 1 || level === 2);
      const label = isCustom ? customTitle || title : t(`categories:${title}`);

      const handlePressLabel = () => {
        if (isMyGenresGroup) {
          _toggleExpandedCategory(path);
          return;
        }
        if (isLeafCategory) {
          _selectCategory({ label, path });
        } else {
          _toggleExpandedCategory(path);
        }
      };

      return (
        <View key={path} style={[styles.menuItem, isSearchResult && styles.searchResult]}>
          {!isSearchResult && (
            <Pressable
              disabled={!shouldDisplayArrowIcon}
              onPress={() => _toggleExpandedCategory(path)}
              style={[styles.arrowIconWrapper, iconWrapperStyle]}
            >
              {shouldDisplayArrowIcon ? (
                <ArrowDown style={isExpanded ? undefined : styles.collapsed} width={FILTER_ICON.width} height={FILTER_ICON.height} />
              ) : null}
            </Pressable>
          )}
          <Pressable style={styles.labelWrapper} onPress={handlePressLabel}>
            <Text style={styles.menuItemTitle} numberOfLines={1} ellipsizeMode='tail'>
              {label}
            </Text>
            <View style={styles.categoryActions}>
              {isMyGenresGroup && !isSearchResult && (
                <Pressable
                  style={styles.addCustomAction}
                  onPress={(event) => {
                    event.stopPropagation();
                    openAddCustomGenreModal();
                  }}
                >
                  <Text style={styles.addCustomText}>{t('categories:addGenre')}</Text>
                </Pressable>
              )}
              {isLeafCategory && (
                <View style={styles.radioWrapper}>
                  <RadioButton isSelected={selectedCategoryPath === path} />
                </View>
              )}
              {isCustom && customId && !isSearchResult && (
                <Pressable
                  style={styles.editIconButton}
                  onPress={(event) => {
                    event.stopPropagation();
                    openEditCustomGenreModal(item);
                  }}
                >
                  <MaterialCommunityIcons name='pencil-outline' size={18} color={colors.neutral_light} />
                </Pressable>
              )}
            </View>
          </Pressable>
        </View>
      );
    },
    [_selectCategory, _toggleExpandedCategory, openAddCustomGenreModal, openEditCustomGenreModal, selectedCategoryPath, t],
  );

  const getKeyExtractorForCategory = useCallback((item: any) => item.path, []);

  const renderItemForCategory = useCallback(({ item }: any) => renderCategoryItem({ item }), [renderCategoryItem]);

  const renderCategory = useCallback(
    (item: any) => {
      if (!item) {
        return null;
      }
      const { data = [], isExpanded } = item;
      return (
        <>
          {renderCategoryItem({ item })}
          {isExpanded && data.length > 0 && (
            <FlatList keyboardShouldPersistTaps='handled' data={data} renderItem={renderItemForCategory} keyExtractor={getKeyExtractorForCategory} />
          )}
          {isExpanded && data.length === 0 && item.isMyGenresGroup && (
            <View style={styles.customEmptyWrapper}>
              <Text style={styles.customEmptyText}>{t('categories:noCustomGenres')}</Text>
              <Button theme={SECONDARY} style={styles.customEmptyButton} title={t('categories:addGenre')} onPress={openAddCustomGenreModal} />
            </View>
          )}
        </>
      );
    },
    [getKeyExtractorForCategory, openAddCustomGenreModal, renderCategoryItem, renderItemForCategory, t],
  );

  const getKeyExtractorForSearch = useCallback((item: any) => item.path, []);

  const renderItemForSearch = useCallback(({ item }: any) => renderCategoryItem({ item, isSearchResult: true }), [renderCategoryItem]);

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
    ({ item, section }: any) => {
      if (!section.isExpanded) {
        return null;
      }
      return renderCategory(item);
    },
    [renderCategory],
  );

  const renderSectionHeader = useCallback(({ section }: any) => renderCategoryItem({ item: section }), [renderCategoryItem]);

  useEffect(() => {
    dispatch(setSearchQuery(''));
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
      <Modal visible={isCustomGenreModalVisible} transparent animationType='fade' onRequestClose={closeCustomGenreModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCustomGenre ? t('categories:editGenre') : t('categories:addGenre')}</Text>
            <Input
              placeholder={t('categories:genreNamePlaceholder')}
              value={customGenreName}
              onChangeText={(value) => {
                if (customGenreError) {
                  setCustomGenreError(null);
                }
                setCustomGenreName(value);
              }}
              validateable={false}
            />
            {customGenreError ? <Text style={styles.modalError}>{customGenreError}</Text> : null}
            <View style={styles.modalButtons}>
              {editingCustomGenre && (
                <Button
                  theme={SECONDARY}
                  style={styles.modalButton}
                  titleStyle={styles.modalButtonText}
                  title={t('common:remove')}
                  onPress={handleDeleteCustomGenre}
                  disabled={isSavingCustomGenre}
                />
              )}
              <Button
                theme={SECONDARY}
                style={styles.modalButton}
                titleStyle={styles.modalButtonText}
                title={t('common:cancel')}
                onPress={closeCustomGenreModal}
                disabled={isSavingCustomGenre}
              />
              <Button
                style={styles.modalButton}
                titleStyle={styles.modalButtonText}
                title={editingCustomGenre ? t('common:save') : t('common:add')}
                onPress={handleSaveCustomGenre}
                disabled={isSavingCustomGenre}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CategoryChooser;

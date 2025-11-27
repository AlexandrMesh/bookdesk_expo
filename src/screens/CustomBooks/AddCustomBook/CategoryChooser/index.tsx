import React, { useCallback, useEffect, useState } from 'react';

import { Alert, FlatList, Modal, Pressable, SectionList, SectionListRenderItemInfo, Text, View, ToastAndroid, Platform } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import ArrowDown from '~assets/arrow-down.svg';
import { ALL } from '~constants/boardType';
import { FILTER_ICON } from '~constants/dimensions';
import { SECONDARY } from '~constants/themes';
import { addCustomGenre, deleteCustomGenre, updateCustomGenre } from '~redux/actions/booksActions';
import { selectCategory, setSearchQuery, submitCategory, toggleExpandedCategoryCustomBooks } from '~redux/actions/customBookActions';
import { deriveCategories } from '~redux/selectors/books';
import { deriveCategoriesSearchResult, getCategorySearchQuery, getEditableSelectedCategoryPath } from '~redux/selectors/customBook';
import { useThemeColors } from '~theme/hooks';
import { useThemedStyles } from '~theme/useThemedStyles';
import Button from '~UI/Button';
import RadioButton from '~UI/RadioButton';
import Input from '~UI/TextInput';

import createStyles from './styles';

const MY_GENRES_GROUP_PATH = 'myGenres';

interface CategoryChooserProps {
  variant?: 'screen' | 'embedded';
  onClose?: () => void;
}

type CategoryNode = {
  path: string;
  title: string;
  isExpanded?: boolean;
  data?: CategoryNode[];
  isMyGenresGroup?: boolean;
  isCustom?: boolean;
  customTitle?: string;
  customId?: string;
};

const CategoryChooser = ({ variant = 'screen', onClose }: CategoryChooserProps) => {
  const { t } = useTranslation(['common', 'categories']);
  const navigation = useNavigation();
  const isEmbedded = variant === 'embedded';
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const dispatch = useAppDispatch();
  const _toggleExpandedCategory = useCallback((path: string) => dispatch(toggleExpandedCategoryCustomBooks(path)), [dispatch]);
  const _selectCategory = useCallback((category: { path: string; label: string }) => dispatch(selectCategory(category)), [dispatch]);
  const _setSearchQuery = (query: string) => dispatch(setSearchQuery(query));
  const clearSearchQueryForCategory = () => dispatch(setSearchQuery(''));
  const _submitCategory = () => dispatch(submitCategory());

  type CategorySection = CategoryNode & { data: CategoryNode[] };

  const categories = useAppSelector(deriveCategories(ALL, true)) as CategorySection[];
  const searchQuery = useAppSelector(getCategorySearchQuery);
  const categoriesSearchResult = useAppSelector(deriveCategoriesSearchResult) as CategoryNode[];
  const selectedCategoryPath = useAppSelector(getEditableSelectedCategoryPath);
  const [pendingGenre, setPendingGenre] = useState<{ path: string; label: string } | null>(null);

  const [isCustomGenreModalVisible, setCustomGenreModalVisible] = useState(false);
  const [customGenreName, setCustomGenreName] = useState('');
  const [customGenreError, setCustomGenreError] = useState<string | null>(null);
  const [editingCustomGenre, setEditingCustomGenre] = useState<{ id: string; title: string } | null>(null);
  const [isSavingCustomGenre, setIsSavingCustomGenre] = useState(false);

  const handleChoose = () => {
    _submitCategory();
    if (!isEmbedded && !onClose) {
      navigation.goBack();
    }
    if (onClose) {
      onClose();
    }
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

  const showGenreAddedToast = useCallback(
    (name: string) => {
      const message = t('categories:genreAddedToast', { genre: name });
      if (Platform.OS === 'android') {
        ToastAndroid.showWithGravity(message, ToastAndroid.SHORT, ToastAndroid.BOTTOM);
      } else {
        Alert.alert('', message);
      }
    },
    [t],
  );

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
        const newGenre = await dispatch(addCustomGenre(trimmedName)).unwrap();
        if (newGenre?.id) {
          const newPath = `${MY_GENRES_GROUP_PATH}.${newGenre.id}`;
          setPendingGenre({ path: newPath, label: trimmedName });
          showGenreAddedToast(trimmedName);
        }
      }
      closeCustomGenreModal();
    } catch (error) {
      console.error('Error saving custom genre:', error);
    } finally {
      setIsSavingCustomGenre(false);
    }
  }, [closeCustomGenreModal, customGenreName, dispatch, editingCustomGenre, showGenreAddedToast, t]);

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
    ({ item, isSearchResult }: { item: CategoryNode; isSearchResult?: boolean }) => {
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
                  <MaterialCommunityIcons name='pencil-outline' size={18} color={themeColors.neutral_light} />
                </Pressable>
              )}
            </View>
          </Pressable>
        </View>
      );
    },
    [
      _selectCategory,
      _toggleExpandedCategory,
      openAddCustomGenreModal,
      openEditCustomGenreModal,
      selectedCategoryPath,
      styles,
      t,
      themeColors.neutral_light,
    ],
  );

  const getKeyExtractorForCategory = useCallback((item: CategoryNode) => item.path, []);

  const renderItemForCategory = useCallback(({ item }: { item: CategoryNode }) => renderCategoryItem({ item }), [renderCategoryItem]);

  const renderCategory = useCallback(
    (item: CategoryNode) => {
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
    [getKeyExtractorForCategory, openAddCustomGenreModal, renderCategoryItem, renderItemForCategory, styles, t],
  );

  const getKeyExtractorForSearch = useCallback((item: CategoryNode) => item.path, []);

  const renderItemForSearch = useCallback(
    ({ item }: { item: CategoryNode }) => renderCategoryItem({ item, isSearchResult: true }),
    [renderCategoryItem],
  );

  const renderSearchResults = () => {
    if (shouldDisplaySearchResults) {
      return (
        <FlatList<CategoryNode>
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

  const getKeyExtractor = useCallback((item: CategoryNode) => item.path, []);

  const renderItem = useCallback(
    ({ item, section }: SectionListRenderItemInfo<CategoryNode, CategorySection>) => {
      if (!section.isExpanded) {
        return null;
      }
      return renderCategory(item);
    },
    [renderCategory],
  );

  const renderSectionHeader = useCallback(({ section }: { section: CategorySection }) => renderCategoryItem({ item: section }), [renderCategoryItem]);

  useEffect(() => {
    dispatch(setSearchQuery(''));
  }, [dispatch]);

  const containerStyle = isEmbedded ? styles.embeddedContainer : styles.container;
  const listWrapperStyle = isEmbedded ? styles.embeddedWrapper : styles.wrapper;

  useEffect(() => {
    if (!pendingGenre) {
      return;
    }
    const myGenresSection = categories.find((section) => section?.isMyGenresGroup);
    if (!myGenresSection) {
      return;
    }
    const hasGenre =
      myGenresSection.path === pendingGenre.path ||
      myGenresSection.data?.some((item: CategoryNode) => item?.path === pendingGenre.path) ||
      myGenresSection.data?.some((item: CategoryNode) => item?.data?.some((child: CategoryNode) => child?.path === pendingGenre.path));
    if (hasGenre) {
      if (!myGenresSection.isExpanded) {
        _toggleExpandedCategory(myGenresSection.path);
      }
      _selectCategory({ path: pendingGenre.path, label: pendingGenre.label });
      setPendingGenre(null);
    }
  }, [categories, pendingGenre, _selectCategory, _toggleExpandedCategory]);

  return (
    <View style={containerStyle}>
      <Input
        placeholder={t('searchCategory')}
        onChangeText={_setSearchQuery}
        value={searchQuery}
        validateable={false}
        shouldDisplayClearButton={!!searchQuery}
        onClear={clearSearchQueryForCategory}
      />
      <View style={listWrapperStyle}>
        {renderSearchResults()}
        {!searchQuery && (
          <SectionList<CategoryNode, CategorySection>
            keyboardShouldPersistTaps='handled'
            sections={categories}
            keyExtractor={getKeyExtractor}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
          />
        )}
      </View>
      {!isEmbedded && (
        <View style={styles.submitButtonWrapper}>
          <Button style={styles.submitButton} title={t('choose')} onPress={handleChoose} />
        </View>
      )}
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

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { View, Text, SectionList, Pressable } from 'react-native';

import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import ArrowDown from '~assets/arrow-down.svg';
import MedalIcon from '~assets/medal-star.svg';
import RemoveIcon from '~assets/remove.svg';
import useDisplayAlert from '~hooks/useDisplayAlert';
import { addGoalItem, getGoalItems, deleteUserGoalItem } from '~redux/actions/goalsActions';
import {
  deriveSectionedPagesDone,
  getGoalNumberOfPages,
  deriveNumberOfPagesDoneToday,
  deriveTodayProgress,
  deriveGoalsDataLength,
} from '~redux/selectors/goals';
import colors from '~styles/colors';
import Button from '~UI/Button';
import { Spinner } from '~UI/Spinner';
import Input from '~UI/TextInput';
import { getValidationFailure, validationTypes } from '~utils/validation';

import ItemPlaceholder from '../ItemPlaceholder';
import styles from './styles';

const READING_HISTORY_ITEM_HEIGHT = 72;
const PAGE_SIZE = 100;

const Daily = () => {
  const { i18n, t } = useTranslation(['goals', 'errors', 'common', 'statistic']);
  const [pages, setPages] = useState<string>('');
  const [errorForPage, setErrorForPages] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(false);
  const deletedId = useRef<string>('');
  const [loadingGoalItemsId, setLoadingGoalItemsId] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const dispatch = useAppDispatch();
  const _getGoalItems = useCallback(() => dispatch(getGoalItems()), [dispatch]);
  const _addGoalItem = useCallback((pages: string) => dispatch(addGoalItem(pages)), [dispatch]);
  const _deleteUserGoalItem = useCallback((id: string) => dispatch(deleteUserGoalItem(id)), [dispatch]);

  const goalsDataLength = useAppSelector(deriveGoalsDataLength);
  const sectionedPagesDone = useAppSelector((state) => deriveSectionedPagesDone(state, visibleCount));
  const goalNumberOfPages = useAppSelector(getGoalNumberOfPages) as number;
  const numberOfPagesDoneToday = useAppSelector(deriveNumberOfPagesDoneToday);
  const todayProgress = useAppSelector(deriveTodayProgress);
  const goalsData = useAppSelector((state) => state.goals.goal.data);

  const { language } = i18n;

  const addExpandedItem = useCallback((item: any) => setExpandedItems([...expandedItems, item]), [expandedItems]);

  const removeExpandedItem = useCallback(
    (item: any) => setExpandedItems(expandedItems.filter((expandedItem) => expandedItem !== item)),
    [expandedItems],
  );

  const toggleExpandedItem = useCallback(
    (item: any) => (expandedItems.includes(item) ? removeExpandedItem(item) : addExpandedItem(item)),
    [addExpandedItem, expandedItems, removeExpandedItem],
  );

  const validateForm = () => {
    const params = {
      lessComparedValue: 1,
      moreComparedValue: 1000,
    };
    const error = getValidationFailure(
      pages,
      [validationTypes.mustContainOnlyNumbers, validationTypes.isMoreThan, validationTypes.isLessThan],
      params,
    );
    return error ? t(`errors:${error}`, params) : null;
  };

  const handleAddGoalItem = async () => {
    try {
      setIsLoading(true);
      await _addGoalItem(pages);
      setPages('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitForm = () => {
    const error = validateForm();
    if (error) {
      setErrorForPages(error);
    } else {
      handleAddGoalItem();
    }
  };

  const handleChangePages = (value: any) => {
    setErrorForPages('');
    setPages(value);
  };

  const handleClearPages = () => {
    setErrorForPages('');
    setPages('');
  };

  const handleDeleteGoalItem = useCallback(async () => {
    setLoadingGoalItemsId(deletedId.current);
    try {
      await _deleteUserGoalItem(deletedId.current);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingGoalItemsId(null);
    }
  }, [deletedId, _deleteUserGoalItem]);

  const displayConfirmationAlert = useDisplayAlert(handleDeleteGoalItem);

  const onDelete = useCallback(
    (id: string) => {
      deletedId.current = id;
      displayConfirmationAlert();
    },
    [deletedId, displayConfirmationAlert],
  );

  useEffect(() => {
    let isMounted = true;

    if (goalsData.length === 0 && !isFetchingRef.current) {
      isFetchingRef.current = true;
      setIsInitialLoading(true);
      _getGoalItems()
        .catch((error) => {
          console.error('Error loading goal items:', error);
        })
        .finally(() => {
          if (isMounted) {
            setIsInitialLoading(false);
          }
          isFetchingRef.current = false;
        });
    }

    if (goalsData.length > 0) {
      setIsInitialLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [goalsData.length, _getGoalItems]);

  const renderReadingHistoryItem = useCallback(
    (item: any) => (
      <Pressable
        style={[styles.readingHistory, expandedItems.includes(item.title) && styles.readingHistoryActive]}
        onPress={() => toggleExpandedItem(item.title)}
      >
        <View style={styles.titleColumn}>
          <ArrowDown style={[styles.arrowIcon, expandedItems.includes(item.title) ? null : styles.collapsedIcon]} width={16} height={16} />
          <Text style={styles.readingHistoryItem}>{item.title}</Text>
        </View>
        <View style={styles.countColumn}>
          {item.count >= goalNumberOfPages ? <MedalIcon style={styles.starIcon} width={24} height={24} fill={colors.gold} /> : null}
          <Text style={styles.countItem}>{t('common:count', { count: item.count })}</Text>
        </View>
      </Pressable>
    ),
    [expandedItems, goalNumberOfPages, t, toggleExpandedItem],
  );

  const getKeyExtractor = useCallback((item: any) => item._id, []);

  const renderItem = useCallback(
    ({ item }: any) => (
      <View style={[styles.readingHistory, styles.nested]}>
        <View>
          <Text style={styles.readingHistoryItem}>
            {new Date(item.added_at).toLocaleString(language, {
              day: 'numeric',
              month: 'long',
              hour: 'numeric',
              minute: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.countColumn}>
          <Text style={styles.countItem}>{t('common:count', { count: item.pages })}</Text>
          <Pressable style={styles.removeIcon} onPress={() => !loadingGoalItemsId && onDelete(item._id)}>
            {loadingGoalItemsId === item._id ? (
              <Spinner size='small' variant='inline' />
            ) : (
              <RemoveIcon fill={colors.neutral_medium} width={20} height={20} />
            )}
          </Pressable>
        </View>
      </View>
    ),
    [onDelete, language, loadingGoalItemsId, t],
  );

  const renderReadingHistoryNestedItems = useCallback(
    (item: any) => (
      <FlashList
        keyboardShouldPersistTaps='handled'
        data={item.data}
        renderItem={renderItem}
        keyExtractor={getKeyExtractor}
        estimatedItemSize={READING_HISTORY_ITEM_HEIGHT}
      />
    ),
    [getKeyExtractor, renderItem],
  );

  const getProgressBarLabelColor = () => {
    if (todayProgress >= 100) {
      return colors.gold;
    }
    if (todayProgress >= 55) {
      return colors.primary_dark;
    }
    return colors.neutral_light;
  };

  useEffect(() => {
    if (goalsDataLength === 0) {
      setVisibleCount(PAGE_SIZE);
      return;
    }
    setVisibleCount((prev) => {
      if (prev > goalsDataLength) {
        return Math.max(PAGE_SIZE, goalsDataLength);
      }
      return prev;
    });
  }, [goalsDataLength]);

  const disabledControls = isLoading || !!loadingGoalItemsId;

  const emptyListComponent = useCallback(() => {
    if (isInitialLoading) {
      return (
        <View style={styles.listSpinnerWrapper}>
          <Spinner variant='inline' />
        </View>
      );
    }
    return goalsData.length === 0 ? <ItemPlaceholder /> : null;
  }, [goalsData.length, isInitialLoading]);

  const canLoadMore = goalsDataLength > visibleCount;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, goalsDataLength));
  }, [goalsDataLength]);

  const footerComponent = useMemo(
    () =>
      canLoadMore ? (
        <View style={styles.loadMoreWrapper}>
          <Button style={styles.loadMoreButton} onPress={handleLoadMore} title={t('goals:loadMore')} />
        </View>
      ) : null,
    [canLoadMore, handleLoadMore, t],
  );

  const renderSectionHeader = useCallback(
    ({ section }: any) => (
      <View style={styles.stickyHeader}>
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>{section.title}</Text>
        </View>
        <View style={[styles.countColumn, styles.headerTitle]}>
          <Text style={styles.headerTitleText}>{t('common:count', { count: section.count })}</Text>
        </View>
      </View>
    ),
    [t],
  );

  const renderItemFFormSectionList = useCallback(
    ({ item }: any) => (
      <>
        {renderReadingHistoryItem(item)}
        {expandedItems.includes(item.title) ? renderReadingHistoryNestedItems(item) : null}
      </>
    ),
    [expandedItems, renderReadingHistoryItem, renderReadingHistoryNestedItems],
  );

  const getKeyExtractorForSectionList = useCallback((item: any) => item.title, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topBlock}>
          <View>
            <View style={styles.info}>
              <View style={styles.blockLeft}>
                <View>
                  <Text style={styles.infoText}>{t('goals:pagesDone')}</Text>
                </View>
                <View style={styles.goalWrapper}>
                  {todayProgress >= 100 && <MedalIcon style={styles.starIcon} width={24} height={24} fill={colors.gold} />}
                  <Text style={{ ...styles.blockText, color: todayProgress >= 100 ? colors.gold : colors.completed }}>{numberOfPagesDoneToday}</Text>
                </View>
              </View>

              <View style={styles.blockRight}>
                <View>
                  <Text style={styles.infoText}>{t('goals:goalInPages')}</Text>
                </View>
                <View style={styles.goalWrapper}>
                  <Text style={[styles.blockText, styles.goal]}>{goalNumberOfPages}</Text>
                </View>
              </View>
            </View>

            <View style={{ ...styles.progressBarWrapper, borderColor: todayProgress >= 100 ? colors.gold : colors.completed }}>
              <View
                style={{
                  ...styles.progressBar,
                  width: todayProgress > 100 ? '100%' : `${todayProgress}%`,
                  backgroundColor: todayProgress >= 100 ? 'transparent' : colors.completed,
                }}
              />
              <View style={styles.progressBarLabelWrapper}>
                <Text style={{ ...styles.progressBarLabel, color: getProgressBarLabelColor() }}>
                  {todayProgress >= 100 ? t('goals:goalAchieved') : `${todayProgress} %`}
                </Text>
              </View>
            </View>

            <Text style={styles.pagesCountDescription}>{t('goals:addedPageCountDescription')}</Text>
            <View style={styles.actionWrapper}>
              <Input
                wrapperClassName={styles.inputWrapper}
                errorWrapperClassName={styles.inputError}
                placeholder={t('goals:pagesCount')}
                disabled={disabledControls}
                error={errorForPage}
                onChangeText={handleChangePages}
                shouldDisplayClearButton={!!pages && !isLoading}
                onClear={handleClearPages}
                inputMode='numeric'
                value={pages}
              />
              <View>
                <Button
                  disabled={disabledControls}
                  iconPosition='right'
                  icon={isLoading ? <Spinner size='small' variant='inline' /> : undefined}
                  style={styles.button}
                  onPress={submitForm}
                  title={t('goals:add')}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionedList}>
          {sectionedPagesDone.length > 0 ? <Text style={styles.title}>{t('goals:achievementsJournal')}</Text> : null}
          <SectionList
            sections={sectionedPagesDone}
            keyExtractor={getKeyExtractorForSectionList}
            ListEmptyComponent={emptyListComponent}
            ListFooterComponent={footerComponent}
            renderItem={renderItemFFormSectionList}
            renderSectionHeader={renderSectionHeader}
          />
        </View>
      </View>
    </View>
  );
};

export default Daily;

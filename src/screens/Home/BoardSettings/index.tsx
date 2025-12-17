import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '~hooks';
import { setHiddenBoards } from '~redux/actions/appActions';
import { getHiddenBoards } from '~redux/selectors/common';
import { useThemeColors } from '~theme/hooks';
import { saveHiddenBoards } from '~utils/storage/boardPreferences';
import Button from '~UI/Button';

import CheckboxCheckedIcon from '~assets/checkbox-checked.svg';
import CheckboxBlankIcon from '~assets/checkbox-blank.svg';

const BOARDS = ['recommended', 'planned', 'inProgress', 'completed'] as const;

const BoardSettings = () => {
  const { t } = useTranslation(['books', 'common']);
  const themeColors = useThemeColors();
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const savedHiddenBoards = useAppSelector(getHiddenBoards);

  // Local state for editing
  const [localHiddenBoards, setLocalHiddenBoards] = useState<string[]>(savedHiddenBoards);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = useCallback((boardKey: string) => {
    setLocalHiddenBoards((prev) => {
      if (prev.includes(boardKey)) {
        return prev.filter((key) => key !== boardKey);
      } else {
        return [...prev, boardKey];
      }
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await saveHiddenBoards(localHiddenBoards);
      dispatch(setHiddenBoards(localHiddenBoards));
      navigation.goBack();
    } catch (error) {
      setIsSaving(false);
    }
  }, [localHiddenBoards, dispatch, navigation, isSaving]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.primary_dark,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.neutral_medium,
      textTransform: 'uppercase',
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    boardsList: {
      backgroundColor: themeColors.primary_darkest,
      borderRadius: 12,
      overflow: 'hidden',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.neutral_medium,
    },
    itemLast: {
      borderBottomWidth: 0,
    },
    itemText: {
      fontSize: 16,
      color: themeColors.neutral_light,
      marginLeft: 12,
    },
    itemDisabled: {
      opacity: 0.5,
    },
    footer: {
      padding: 16,
      paddingBottom: 16,
      alignItems: 'center',
    },
    saveButton: {
      minWidth: 120,
      paddingHorizontal: 24,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('common:boardVisibility')}</Text>
        <View style={styles.boardsList}>
          {BOARDS.map((boardKey, idx) => {
            const isVisible = !localHiddenBoards.includes(boardKey);
            const isLast = idx === BOARDS.length - 1;
            const visibleCount = BOARDS.length - localHiddenBoards.length;
            const isLastVisible = isVisible && visibleCount === 1;
            const isDisabled = isSaving || isLastVisible;
            return (
              <TouchableOpacity
                key={boardKey}
                style={[styles.item, isLast && styles.itemLast, isDisabled && styles.itemDisabled]}
                onPress={() => handleToggle(boardKey)}
                disabled={isDisabled}
              >
                {isVisible ? (
                  <CheckboxCheckedIcon width={24} height={24} fill={isLastVisible ? themeColors.neutral_medium : themeColors.success} />
                ) : (
                  <CheckboxBlankIcon width={24} height={24} fill={themeColors.neutral_medium} />
                )}
                <Text style={styles.itemText}>{t(`books:${boardKey}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <View style={styles.footer}>
        <Button
          title={t('common:save')}
          onPress={handleSave}
          isLoading={isSaving}
          disabled={isSaving}
          style={styles.saveButton}
        />
      </View>
    </SafeAreaView>
  );
};

export default BoardSettings;

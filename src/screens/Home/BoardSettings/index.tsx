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
    await saveHiddenBoards(localHiddenBoards);
    dispatch(setHiddenBoards(localHiddenBoards));
    navigation.goBack();
  }, [localHiddenBoards, dispatch, navigation]);

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
    footer: {
      padding: 16,
      paddingBottom: 24,
    },
    saveButton: {
      backgroundColor: themeColors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: themeColors.neutral_lightest,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('common:boardVisibility', 'Видимость досок')}</Text>
        <View style={styles.boardsList}>
          {BOARDS.map((boardKey, idx) => {
            const isVisible = !localHiddenBoards.includes(boardKey);
            const isLast = idx === BOARDS.length - 1;
            return (
              <TouchableOpacity
                key={boardKey}
                style={[styles.item, isLast && styles.itemLast]}
                onPress={() => handleToggle(boardKey)}
              >
                {isVisible ? (
                  <CheckboxCheckedIcon width={24} height={24} fill={themeColors.success} />
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
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('common:save')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default BoardSettings;

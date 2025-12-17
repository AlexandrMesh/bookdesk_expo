import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '~hooks';
import { resetBoardSettings, toggleBoardVisibility } from '~redux/actions/appActions';
import { getHiddenBoards } from '~redux/selectors/common';
import { useThemeColors } from '~theme/hooks';

import CheckboxCheckedIcon from '~assets/checkbox-checked.svg';
import CheckboxBlankIcon from '~assets/checkbox-blank.svg';

const BOARDS = ['recommended', 'planned', 'inProgress', 'completed'] as const;

const BoardSettings = () => {
  const { t } = useTranslation('books');
  const themeColors = useThemeColors();
  const dispatch = useAppDispatch();
  const hiddenBoards = useAppSelector(getHiddenBoards);

  const handleToggle = useCallback(
    (boardKey: string) => {
      dispatch(toggleBoardVisibility(boardKey));
    },
    [dispatch],
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.primary_dark,
    },
    content: {
      padding: 16,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.neutral_medium,
    },
    itemText: {
      fontSize: 16,
      color: themeColors.neutral_light,
      marginLeft: 12,
    },
    resetButton: {
      marginTop: 16,
      justifyContent: 'center',
    },
  });

  const handleReset = useCallback(() => {
    dispatch(resetBoardSettings());
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {BOARDS.map((boardKey) => {
          const isVisible = !hiddenBoards.includes(boardKey);
          return (
            <TouchableOpacity key={boardKey} style={styles.item} onPress={() => handleToggle(boardKey)}>
              {isVisible ? (
                <CheckboxCheckedIcon width={24} height={24} fill={themeColors.success} />
              ) : (
                <CheckboxBlankIcon width={24} height={24} fill={themeColors.neutral_medium} />
              )}
              <Text style={styles.itemText}>{t(boardKey)}</Text>
            </TouchableOpacity>
          );
        })}
        {hiddenBoards.length > 0 && (
          <TouchableOpacity style={[styles.item, styles.resetButton]} onPress={handleReset}>
            <Text style={[styles.itemText, { marginLeft: 0, color: themeColors.accent }]}>Сбросить настройки</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default BoardSettings;


import React from 'react';

import { Pressable, Text, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import { setThemeMode } from '~redux/actions/themeActions';
import { getThemeMode } from '~redux/selectors/theme';

import styles from './styles';

const ThemeSettings = () => {
  const { t } = useTranslation(['profile']);
  const dispatch = useAppDispatch();
  const mode = useAppSelector(getThemeMode);

  const options: Array<{ value: 'auto' | 'light' | 'dark'; label: string }> = [
    { value: 'auto', label: t('themeAuto') },
    { value: 'light', label: t('themeLight') },
    { value: 'dark', label: t('themeDark') },
  ];

  return (
    <View style={styles.themeSettings}>
      <Text style={[styles.label, styles.mTop]}>{t('themeTitle')}</Text>
      <View style={styles.themeSegment}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.themeOption, mode === option.value && styles.themeOptionActive]}
            onPress={() => dispatch(setThemeMode(option.value))}
          >
            <Text style={[styles.themeOptionText, mode === option.value && styles.themeOptionTextActive]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default ThemeSettings;


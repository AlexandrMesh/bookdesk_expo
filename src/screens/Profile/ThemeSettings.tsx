import React, { FC, useMemo } from 'react';

import { StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import { setThemeMode } from '~redux/actions/themeActions';
import { getThemeMode } from '~redux/selectors/theme';
import Dropdown from '~UI/Dropdown';
import { useThemedStyles } from '~theme/useThemedStyles';

import createStyles from './styles';

type Props = {
  buttonStyle?: StyleProp<ViewStyle>;
  buttonLabelStyle?: StyleProp<TextStyle>;
};

const ThemeSettings: FC<Props> = ({ buttonStyle, buttonLabelStyle }) => {
  const { t } = useTranslation(['profile']);
  const dispatch = useAppDispatch();
  const mode = useAppSelector(getThemeMode);
  const styles = useThemedStyles(createStyles);

  const options: Array<{ value: 'auto' | 'light' | 'dark'; title: string }> = useMemo(
    () => [
      { value: 'auto', title: t('themeAuto') },
      { value: 'light', title: t('themeLight') },
      { value: 'dark', title: t('themeDark') },
    ],
    [t],
  );

  const currentOption = options.find((option) => option.value === mode);

  return (
    <View style={styles.themeSettings}>
      <Text style={[styles.label, styles.mTop]}>{t('themeTitle')}</Text>
      <Dropdown
        items={options}
        selectedItem={mode}
        buttonLabel={currentOption?.title || ''}
        onChange={(value) => dispatch(setThemeMode(value))}
        wrapperStyle={buttonStyle}
        buttonLabelStyle={buttonLabelStyle}
        fillBackground={false}
        isLoading={false}
      />
    </View>
  );
};

export default ThemeSettings;


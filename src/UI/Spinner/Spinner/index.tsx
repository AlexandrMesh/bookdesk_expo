import React, { memo, FC } from 'react';

import { ActivityIndicator, View, Text } from 'react-native';

import { useThemeColors } from '~theme/hooks';
import { useThemedStyles } from '~theme/useThemedStyles';

import createStyles from '../styles';

export type Props = {
  color?: string;
  label?: string;
  size?: number | 'small' | 'large' | undefined;
  backgroundColor?: string;
  labelColor?: string;
  variant?: 'overlay' | 'inline';
};

const Spinner: FC<Props> = ({
  backgroundColor,
  color,
  labelColor,
  size = 'large',
  label,
  variant = 'overlay',
}) => {
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const isOverlay = variant === 'overlay';

  return (
    <View style={[isOverlay ? styles.overlay : styles.inline, isOverlay && { backgroundColor: backgroundColor || themeColors.primary_dark }]}>
      <ActivityIndicator color={color || themeColors.neutral_light} size={size} />
      {label && <Text style={[{ color: labelColor || themeColors.neutral_light }, styles.label]}>{label}</Text>}
    </View>
  );
};

export default memo(Spinner);

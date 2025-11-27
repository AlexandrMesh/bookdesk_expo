import React, { memo, FC, JSX } from 'react';

import { TouchableHighlight, View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';

import { PRIMARY, SECONDARY } from '~constants/themes';
import { Spinner } from '~UI/Spinner';
import { useThemeColors } from '~theme/hooks';
import { useThemedStyles } from '~theme/useThemedStyles';

import createStyles from './styles';

export type Props = {
  icon?: JSX.Element | undefined;
  iconPosition?: 'left' | 'right';
  title: string;
  titleStyle?: StyleProp<TextStyle>;
  onPress: () => void;
  theme?: typeof PRIMARY | typeof SECONDARY;
  style?: StyleProp<ViewStyle>;
  iconClassName?: StyleProp<ViewStyle>;
  disabled?: boolean | undefined;
  isLoading?: boolean;
};

const Button: FC<Props> = ({
  icon,
  iconPosition = 'left',
  title,
  titleStyle,
  onPress,
  theme = PRIMARY,
  style,
  iconClassName,
  disabled,
  isLoading = false,
}) => {
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const colorTheme: Record<string, StyleProp<ViewStyle>> = {
    [PRIMARY]: styles.primary,
    [SECONDARY]: styles.secondary,
  };

  const handlePress = () => {
    if (!disabled && !isLoading) {
      onPress();
    } else {
      return undefined;
    }
    return true;
  };

  return (
    <TouchableHighlight
      disabled={disabled || isLoading}
      style={[styles.button, colorTheme[theme], disabled || isLoading ? styles.disabled : {}, style]}
      onPress={handlePress}
    >
      <View style={styles.titleWrapper}>
        {isLoading ? (
          <Spinner size='small' color={theme === PRIMARY ? themeColors.neutral_light : themeColors.neutral_light} variant='inline' />
        ) : (
          <>
            {icon && iconPosition === 'left' && <View style={[styles.icon, styles.iconLeft, iconClassName]}>{icon}</View>}
            <Text style={[styles.title, titleStyle]}>{title}</Text>
            {icon && iconPosition === 'right' && <View style={[styles.icon, styles.iconRight, iconClassName]}>{icon}</View>}
          </>
        )}
      </View>
    </TouchableHighlight>
  );
};

export default memo(Button);

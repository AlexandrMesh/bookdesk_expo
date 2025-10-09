import React, { memo, FC, JSX } from 'react';
import { TouchableHighlight, View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { PRIMARY, SECONDARY } from '~constants/themes';
import styles from './styles';

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
};

const colorTheme: Record<string, StyleProp<ViewStyle>> = {
  [PRIMARY]: styles.primary,
  [SECONDARY]: styles.secondary,
};

const Button: FC<Props> = ({ icon, iconPosition = 'left', title, titleStyle, onPress, theme = PRIMARY, style, iconClassName, disabled }) => {
  const handlePress = () => {
    if (!disabled) {
      onPress();
    } else {
      return undefined;
    }
    return true;
  };

  return (
    <TouchableHighlight disabled={disabled} style={[styles.button, colorTheme[theme], disabled ? styles.disabled : {}, style]} onPress={handlePress}>
      <View style={styles.titleWrapper}>
        {icon && iconPosition === 'left' && <View style={[styles.icon, styles.iconLeft, iconClassName]}>{icon}</View>}
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {icon && iconPosition === 'right' && <View style={[styles.icon, styles.iconRight, iconClassName]}>{icon}</View>}
      </View>
    </TouchableHighlight>
  );
};

export default memo(Button);

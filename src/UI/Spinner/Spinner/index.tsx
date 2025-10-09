import React, { memo, FC } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import colors from '~styles/colors';
import styles from '../styles';

export type Props = {
  color?: string;
  label?: string;
  size?: number | 'small' | 'large' | undefined;
  backgroundColor?: string;
  labelColor?: string;
};

const Spinner: FC<Props> = ({
  backgroundColor = colors.primary_dark,
  color = colors.neutral_light,
  labelColor = colors.neutral_light,
  size = 'large',
  label,
}) => {
  return (
    <View
      style={[
        styles.overlay,
        {
          backgroundColor,
        },
      ]}
    >
      <ActivityIndicator color={color} size={size} />
      {label && <Text style={[{ color: labelColor }, styles.label]}>{label}</Text>}
    </View>
  );
};

export default memo(Spinner);

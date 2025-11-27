import React, { memo, FC } from 'react';

import { View, Text } from 'react-native';

import { useThemeColors } from '~theme/hooks';
import { useThemedStyles } from '~theme/useThemedStyles';

import createStyles from './styles';

type Props = {
  value: number;
};

const DataPointLabel: FC<Props> = ({ value }) => {
  const styles = useThemedStyles(createStyles);
  return value ? (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{value}</Text>
    </View>
  ) : null;
};

export default memo(DataPointLabel);

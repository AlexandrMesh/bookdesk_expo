import React, { memo, FC } from 'react';
import { View, Text } from 'react-native';
import styles from './styles';

type Props = {
  value: number;
};

const DataPointLabel: FC<Props> = ({ value }) => {
  return value ? (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{value}</Text>
    </View>
  ) : null;
};

export default memo(DataPointLabel);

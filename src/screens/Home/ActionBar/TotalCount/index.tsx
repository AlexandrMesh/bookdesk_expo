import React, { memo, FC } from 'react';

import { View, Text } from 'react-native';

import { useTranslation } from 'react-i18next';

import numberFormat from '~utils/numberFormat';

import styles from './styles';

export type Props = {
  count: number;
};

const TotalCount: FC<Props> = ({ count }) => {
  const { t } = useTranslation(['books', 'common']);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{count < 1000 ? t('count', { count }) : t('countWithThousands', { count: numberFormat(count) })}</Text>
    </View>
  );
};

export default memo(TotalCount);

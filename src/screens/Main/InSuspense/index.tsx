import React, { PropsWithChildren, FC, JSX, Suspense } from 'react';

import { View } from 'react-native';

import { useThemedStyles } from '~theme/useThemedStyles';

import createStyles from './styles';

type Props = {
  children: JSX.Element;
};

const inSuspense: FC<PropsWithChildren<Props>> = ({ children }) => {
  const styles = useThemedStyles(createStyles);
  return <Suspense fallback={<View style={styles.wrapper} />}>{children}</Suspense>;
};

export default inSuspense;

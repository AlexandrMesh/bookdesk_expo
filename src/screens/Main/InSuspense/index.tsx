import React, { PropsWithChildren, FC, JSX, Suspense } from 'react';

import { View } from 'react-native';

import styles from './styles';

type Props = {
  children: JSX.Element;
};

const inSuspense: FC<PropsWithChildren<Props>> = ({ children }) => <Suspense fallback={<View style={styles.wrapper} />}>{children}</Suspense>;

export default inSuspense;

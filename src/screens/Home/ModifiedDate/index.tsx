import React, { FC, useCallback, memo } from 'react';

import { View, Text, Animated } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import { PENDING } from '~constants/loadingStatuses';
import { DATE_UPDATER } from '~constants/modalTypes';
import useGetAnimatedPlaceholderStyle from '~hooks/useGetAnimatedPlaceholderStyle';
import { setBookToUpdate, showModal } from '~redux/actions/booksActions';
import { getBookValuesUpdatingStatus, getBookToUpdate } from '~redux/selectors/books';
import { BookStatus } from '~types/books';

import styles from './styles';

export type Props = {
  added: number;
  bookId: string;
  bookStatus: BookStatus;
  fontSize?: number;
  height?: number;
};

const ModifiedDate: FC<Props> = ({ bookId, bookStatus, added, fontSize = 15, height = 25 }) => {
  const { i18n } = useTranslation();
  const { language } = i18n;
  const dispatch = useAppDispatch();
  const bookIdToUpdateAddedDate = useAppSelector(getBookToUpdate)?.bookId;
  const bookValuesUpdatingStatus = useAppSelector(getBookValuesUpdatingStatus);

  const handleAddedPress = useCallback(() => {
    dispatch(setBookToUpdate({ bookId, bookStatus, added }));
    dispatch(showModal(DATE_UPDATER));
  }, [added, bookId, bookStatus, dispatch]);

  const animatedStyle = useGetAnimatedPlaceholderStyle(bookIdToUpdateAddedDate === bookId && bookValuesUpdatingStatus === PENDING);

  return (
    <Animated.View style={[{ height }, bookIdToUpdateAddedDate === bookId && bookValuesUpdatingStatus === PENDING ? { opacity: animatedStyle } : {}]}>
      <View style={styles.addedWrapper}>
        <Text onPress={handleAddedPress} style={[{ fontSize }, styles.lightColor]}>
          {new Date(added).toLocaleDateString(language)}
        </Text>
      </View>
    </Animated.View>
  );
};

export default memo(ModifiedDate);

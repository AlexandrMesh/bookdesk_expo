import React, { useState, useCallback, FC, memo } from 'react';

import { Animated, Pressable, Text, Vibration } from 'react-native';

import { useAppDispatch, useAppSelector } from '~hooks';

import LikeIcon from '~assets/like.svg';
import LikeFillIcon from '~assets/like_fill.svg';
import { LIKE_ICON } from '~constants/dimensions';
import useGetAnimatedPlaceholderStyle from '~hooks/useGetAnimatedPlaceholderStyle';
import { updateBookVotes } from '~redux/actions/booksActions';
import { deriveBookVotes } from '~redux/selectors/books';
import { BookStatus } from '~types/books';

import styles from './styles';

export type Props = {
  bookId: string;
  votesCount: number;
  bookStatus: BookStatus;
};

const Like: FC<Props> = ({ bookId, votesCount, bookStatus }) => {
  const [isLoading, setIsloading] = useState(false);
  const bookWithVote = useAppSelector(deriveBookVotes(bookId));
  const dispatch = useAppDispatch();

  const animatedStyle = useGetAnimatedPlaceholderStyle(isLoading);

  const handleLike = useCallback(async () => {
    if (isLoading) {
      return;
    }
    try {
      Vibration.vibrate(70);
      setIsloading(true);
      await dispatch(updateBookVotes({ bookId, shouldAdd: !bookWithVote, bookStatus }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsloading(false);
    }
  }, [bookId, bookStatus, bookWithVote, dispatch, isLoading]);

  return (
    <Animated.View style={isLoading ? { opacity: animatedStyle } : {}}>
      <Pressable style={styles.votesWrapper} disabled={isLoading} onPress={handleLike}>
        {bookWithVote ? (
          <LikeFillIcon width={LIKE_ICON.width} height={LIKE_ICON.width} />
        ) : (
          <LikeIcon width={LIKE_ICON.width} height={LIKE_ICON.width} />
        )}
        <Text style={[styles.lightColor, styles.votesCount]}>{votesCount}</Text>
      </Pressable>
    </Animated.View>
  );
};

export default memo(Like);

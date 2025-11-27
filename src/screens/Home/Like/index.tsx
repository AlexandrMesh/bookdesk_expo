import React, { useState, useCallback, FC, memo } from 'react';

import { Animated, Pressable, Vibration } from 'react-native';

import { useAppDispatch, useAppSelector } from '~hooks';

import LikeIcon from '~assets/like.svg';
import LikeFillIcon from '~assets/like_fill.svg';
import { LIKE_ICON } from '~constants/dimensions';
import useGetAnimatedPlaceholderStyle from '~hooks/useGetAnimatedPlaceholderStyle';
import { updateBookVotes } from '~redux/actions/booksActions';
import { deriveBookVotes } from '~redux/selectors/books';
import { BookStatus } from '~types/books';
import { useThemeColors } from '~theme/hooks';
import { useThemedStyles } from '~theme/useThemedStyles';

import createStyles from './styles';

export type Props = {
  bookId: string;
  bookStatus: BookStatus;
};

const Like: FC<Props> = ({ bookId, bookStatus }) => {
  const [isLoading, setIsloading] = useState(false);
  const bookWithVote = useAppSelector(deriveBookVotes(bookId));
  const dispatch = useAppDispatch();
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);

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

  const iconSize = Number(LIKE_ICON.width);
  const activeColor = themeColors.gold;
  const inactiveColor = themeColors.neutral_light;

  return (
    <Animated.View style={isLoading ? { opacity: animatedStyle } : {}}>
      <Pressable style={styles.votesWrapper} disabled={isLoading} onPress={handleLike}>
        {bookWithVote ? (
          <LikeFillIcon width={iconSize} height={iconSize} fill={activeColor} stroke={activeColor} />
        ) : (
          <LikeIcon width={iconSize} height={iconSize} fill="transparent" stroke={inactiveColor} />
        )}
      </Pressable>
    </Animated.View>
  );
};

export default memo(Like);

import React, { memo, FC, useState, useEffect, useCallback, useMemo } from 'react';
import { Animated, View, Pressable, Vibration, ViewStyle, StyleProp } from 'react-native';
import { useAppDispatch } from '~hooks';
import useGetAnimatedPlaceholderStyle from '~hooks/useGetAnimatedPlaceholderStyle';
import { updateUserBookRating } from '~redux/actions/booksActions';
import FilledStarIcon from '~assets/star-filled.svg';
import StarIcon from '~assets/star.svg';
import styles from './styles';

export type Props = {
  bookId: string;
  rating?: number;
  wrapperStyle?: StyleProp<ViewStyle>;
  width?: number;
  height?: number;
};

const Rating: FC<Props> = ({ bookId, width = 32, height = 32, wrapperStyle, rating = 0 }) => {
  const [internalBookRating, setInternalBookRating] = useState(rating);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();

  const animatedStyleForRating = useGetAnimatedPlaceholderStyle(isLoading);

  const onChangeRating = useCallback(
    async (value: number) => {
      try {
        setIsLoading(true);
        const ratingAdded = new Date().getTime();
        await dispatch(updateUserBookRating({ bookId, rating: value, added: ratingAdded }));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [bookId, dispatch],
  );

  const handleChangeRating = useCallback(
    (value: number) => {
      Vibration.vibrate(70);
      if (value === internalBookRating) {
        const rating = value - 1;
        setInternalBookRating(value - 1);
        onChangeRating(rating);
      } else {
        setInternalBookRating(value);
        onChangeRating(value);
      }
    },
    [internalBookRating, onChangeRating],
  );

  const ratingItems = useMemo(
    () => [
      { id: '1', isSelected: internalBookRating >= 1, action: () => handleChangeRating(1) },
      { id: '2', isSelected: internalBookRating >= 2, action: () => handleChangeRating(2) },
      { id: '3', isSelected: internalBookRating >= 3, action: () => handleChangeRating(3) },
      { id: '4', isSelected: internalBookRating >= 4, action: () => handleChangeRating(4) },
      { id: '5', isSelected: internalBookRating >= 5, action: () => handleChangeRating(5) },
    ],
    [handleChangeRating, internalBookRating],
  );

  useEffect(() => {
    setInternalBookRating(rating);
  }, [rating]);

  useEffect(() => {
    return () => setInternalBookRating(0);
  }, []);

  return (
    <Animated.View style={[styles.wrapper, wrapperStyle, isLoading ? { opacity: animatedStyleForRating } : {}]}>
      <View style={[styles.rating, { height }]}>
        {ratingItems.map(({ id, isSelected, action }) => {
          return (
            <Pressable
              key={id}
              onPress={() => {
                if (!isLoading) {
                  action();
                }
              }}
            >
              {isSelected ? <FilledStarIcon width={width} height={height} /> : <StarIcon width={width} height={height} />}
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
};

export default memo(Rating);

import React, { FC, useCallback, useEffect, useState } from 'react';

import { Pressable, Text, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { useAppDispatch } from '~hooks';

import { BOOK_DETAILS_ROUTE } from '~constants/routes';
import { getSimilarBooks } from '~redux/actions/booksActions';
import { ISimilarBook } from '~types/books';

import ItemPlaceholder from './ItemPlaceholder';
import styles from './styles';

export type Props = {
  bookId: string;
  categoryPath: string | undefined;
  imgUrl: string;
};

const SimilarBooks: FC<Props> = ({ bookId, categoryPath, imgUrl }) => {
  const { t } = useTranslation('books');
  const [data, setData] = useState([]);
  const getKeyExtractor = useCallback(({ _id }: { _id: string }) => _id, []);
  const dispatch = useAppDispatch();

  const navigation = useNavigation<any>();

  const navigateToBookDetails = useCallback((id: string) => navigation.navigate(BOOK_DETAILS_ROUTE, { bookId: id }), [navigation]);

  const renderItem = useCallback(
    (renderedItem: { item: ISimilarBook }) => {
      const getFullImgUrl = imgUrl ? `${imgUrl}/${renderedItem.item.coverPath}.webp` : null;
      return (
        <Pressable style={styles.wrapper} onPress={() => navigateToBookDetails(renderedItem.item._id)}>
          <View>
            {getFullImgUrl && (
              <Image
                style={styles.cover}
                source={{
                  uri: getFullImgUrl,
                }}
              />
            )}
          </View>
          <View style={styles.titleWrapper}>
            <Text numberOfLines={3} style={[styles.title, styles.lightColor]}>
              {renderedItem.item.title}
            </Text>
          </View>
        </Pressable>
      );
    },
    [imgUrl, navigateToBookDetails],
  );

  const getListEmptyComponent = useCallback(() => <ItemPlaceholder />, []);

  const loadSimilarBooks = useCallback(async () => {
    try {
      const result = await dispatch(getSimilarBooks({ bookId, categoryPath })).unwrap();
      setData(result);
    } catch (error) {
      console.error(error);
    }
  }, [dispatch, bookId, categoryPath]);

  useEffect(() => {
    loadSimilarBooks();
  }, [loadSimilarBooks]);

  return (
    <View style={styles.listWrapper}>
      <Text style={[styles.blockTitle, styles.lightColor]}>{t('similarBooks')}</Text>
      <FlashList
        data={data}
        estimatedItemSize={120}
        estimatedListSize={{ height: 260, width: 500 }}
        horizontal
        renderItem={renderItem}
        keyExtractor={getKeyExtractor}
        ListEmptyComponent={getListEmptyComponent}
      />
    </View>
  );
};

export default SimilarBooks;

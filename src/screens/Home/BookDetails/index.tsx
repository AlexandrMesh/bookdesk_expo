import React, { useCallback, useEffect } from 'react';

import { Pressable, ScrollView, Text, View } from 'react-native';

import { RouteProp, useIsFocused, useRoute } from '@react-navigation/native';
import { Image } from 'expo-image';
import { ZoomIn } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '~hooks';

import { IDLE, PENDING } from '~constants/loadingStatuses';
import { COVER_VIEWER } from '~constants/modalTypes';
import useGetImgUrl from '~hooks/useGetImgUrl';
import { clearBookDetails, loadBookDetails, setCoverUrl, showModal } from '~redux/actions/booksActions';
import { deriveBookDetails, deriveUserBookRating, getLoadingBookDetailsStatus } from '~redux/selectors/books';
import BookStatusDropdown from '~screens/Home/BookStatusDropdown';
import Like from '~screens/Home/Like';
import Rating from '~screens/Home/Rating';
import colors from '~styles/colors';
import { BookStatus } from '~types/books';

import BookNotePreview from '../BookNotePreview';
import ModifiedDate from '../ModifiedDate';
import Placeholder from './Placeholder';
import SimilarBooks from './SimilarBooks';
import styles from './styles';

type ParamList = {
  BookDetails: {
    bookId: string;
  };
};

const BookDetails = () => {
  const isFocused = useIsFocused();
  const { params } = useRoute<RouteProp<ParamList, 'BookDetails'>>();

  const bookRating = useAppSelector(deriveUserBookRating(params?.bookId))?.rating;
  const loadingDataStatus = useAppSelector(getLoadingBookDetailsStatus);
  const bookDetailsData = useAppSelector(deriveBookDetails);

  const { title, coverPath, authorsList, pages, categoryValue, categoryPath, bookStatus, added, votesCount, annotation } = bookDetailsData || {};
  const { t } = useTranslation(['books', 'categories', 'common']);
  const imgUrl = useGetImgUrl();

  const dispatch = useAppDispatch();
  const _loadBookDetails = useCallback((bookId: string) => dispatch(loadBookDetails(bookId)), [dispatch]);
  const _clearBookDetails = useCallback(() => dispatch(clearBookDetails()), [dispatch]);

  const handleCoverPress = useCallback(() => {
    if (imgUrl && coverPath) {
      const fullUrl = `${imgUrl}/${coverPath}.webp`;
      dispatch(setCoverUrl(fullUrl));
      dispatch(showModal(COVER_VIEWER));
    }
  }, [imgUrl, coverPath, dispatch]);

  useEffect(() => {
    _loadBookDetails(params?.bookId);
  }, [_loadBookDetails, params]);

  useEffect(() => {
    if (!isFocused) {
      _clearBookDetails();
    }
  }, [isFocused, _clearBookDetails]);

  return loadingDataStatus === IDLE || loadingDataStatus === PENDING ? (
    <Placeholder />
  ) : (
    <SafeAreaView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps='handled'>
        <View style={styles.header}>
          {imgUrl && (
            <Pressable onPress={handleCoverPress} style={styles.coverPressable}>
              <Image
                style={styles.cover}
                source={{
                  uri: `${imgUrl}/${coverPath}.webp`,
                }}
              />
              <View style={styles.zoomIconContainer}>
                <ZoomIn size={24} color={colors.neutral_white} />
              </View>
            </Pressable>
          )}
          <Text style={[styles.title, styles.lightColor]}>{title}</Text>
          {(authorsList as string[])?.length > 0 &&
            authorsList?.map((author) => (
              <View key={author}>
                <Text style={[styles.item, styles.mediumColor]}>{author}</Text>
              </View>
            ))}
        </View>
        <View>
          <View style={styles.bookStatusWrapper}>
            <BookStatusDropdown
              bookStatus={bookStatus as BookStatus}
              bookId={params?.bookId}
              wrapperStyle={styles.statusButton}
              buttonLabelStyle={styles.buttonTitle}
            />
            <Like bookId={params?.bookId} bookStatus={bookStatus as BookStatus} />
          </View>
          <View style={[styles.info, styles.marginTop]}>
            <Text style={[styles.item, styles.lightColor]}>{t(`categories:${categoryValue}`)}</Text>
            {!!pages && (
              <Text style={[styles.item, styles.mediumColor]}>
                {t('pages')}
                <Text style={styles.lightColor}>{pages}</Text>
              </Text>
            )}
            {bookStatus && (
              <Text style={[styles.item, styles.mediumColor]}>
                {t('added')}
                <ModifiedDate bookId={params?.bookId} bookStatus={bookStatus} added={added as number} fontSize={18} height={25} />
              </Text>
            )}
          </View>

          {bookStatus ? (
            <View style={[styles.info, styles.marginTop]}>
              <View style={styles.blockHeader}>
                <View style={styles.ratingLabel}>
                  <View>
                    <Text style={[styles.item, styles.mediumColor]}>{t('rating')}</Text>
                  </View>
                </View>
                <Rating bookId={params?.bookId} rating={bookRating} />
              </View>
            </View>
          ) : null}

          {bookStatus ? <BookNotePreview bookId={params?.bookId} bookTitle={title} numberOfLines={5} fontSize={18} /> : null}
          <SimilarBooks bookId={params?.bookId} imgUrl={imgUrl} categoryPath={categoryPath} />
          {annotation && (
            <View>
              <View>
                <Text style={[styles.item, styles.mediumColor]}>{t('annotation')}</Text>
              </View>
              <Text style={[styles.annotation, styles.lightColor]}>{annotation}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookDetails;

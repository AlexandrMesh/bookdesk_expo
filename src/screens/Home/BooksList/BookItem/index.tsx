/* eslint-disable react/display-name */
import React, { FC, memo, useCallback, useMemo } from 'react';

import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { ZoomIn } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { useAppDispatch } from '~hooks';

import { COVER_VIEWER } from '~constants/modalTypes';
import { EDIT_CUSTOM_BOOK_ROUTE } from '~constants/routes';
import { setCoverUrl, showModal } from '~redux/actions/booksActions';
import { deriveUserBookRating } from '~redux/selectors/books';
import { getCategoriesData } from '~redux/selectors/common';
import BookNotePreview from '~screens/Home/BookNotePreview';
import BookStatusDropdown from '~screens/Home/BookStatusDropdown';
import Like from '~screens/Home/Like';
import Rating from '~screens/Home/Rating';
import colors from '~styles/colors';
import { BookStatus, IBook } from '~types/books';
import Button from '~UI/Button';

import styles from './styles';
import ModifiedDate from '../../ModifiedDate';

export type Props = {
  imgUrl: string;
  bookItem: IBook;
  itemStyle?: StyleProp<ViewStyle>;
  isEditable?: boolean;
};

const BookItem: FC<Props> = memo(
  (book) => {
    const { bookId, title, coverPath, pages, categoryValue, categoryPath, authorsList, added, bookStatus, annotation } = book.bookItem;
    const { t } = useTranslation(['books', 'categories', 'common']);
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();
    const bookRating = useSelector(deriveUserBookRating(bookId))?.rating;
    const categories = useSelector(getCategoriesData);

    const categoryLabel = useMemo(() => {
      if (!categoryValue && !categoryPath) {
        return '';
      }
      const categoryFromStore = categories.find((category) => category.path === categoryPath);
      if (categoryFromStore?.isCustom) {
        return categoryFromStore.customTitle || categoryFromStore.value;
      }
      if (categoryFromStore?.value) {
        return t(`categories:${categoryFromStore.value}`);
      }
      if (categoryValue) {
        return t(`categories:${categoryValue}`);
      }
      return '';
    }, [categories, categoryPath, categoryValue, t]);

    const navigateToEditCustomBook = useCallback(() => {
      navigation.navigate(EDIT_CUSTOM_BOOK_ROUTE, {
        bookId,
        title,
        pages,
        authorsList,
        annotation,
        bookStatus,
        coverPath,
        categoryPath,
        categoryLabel,
      });
    }, [navigation, bookId, title, pages, authorsList, annotation, bookStatus, coverPath, categoryPath, categoryLabel]);

    const imageUri = useMemo(() => {
      if (!coverPath) return '';
      const lower = String(coverPath);

      // Если обложка уже в формате data:image, используем её напрямую
      if (lower.startsWith('data:image')) {
        return coverPath;
      }

      // Если это абсолютный URL (http/https/file/content), используем его напрямую
      if (/^https?:\/\//i.test(lower) || lower.startsWith('file:') || lower.startsWith('content:')) {
        return coverPath;
      }

      // Для относительных путей формируем URL с imgUrl
      if (!book.imgUrl) return '';
      const hasWebpExtension = lower.endsWith('.webp');
      const finalCoverPath = hasWebpExtension ? coverPath : `${coverPath}.webp`;

      return `${book.imgUrl}/${finalCoverPath}`;
    }, [coverPath, book.imgUrl]);

    const getImageUri = useCallback(() => imageUri, [imageUri]);

    const handleCoverPress = useCallback(() => {
      if (coverPath) {
        const fullUrl = getImageUri();
        dispatch(setCoverUrl(fullUrl));
        dispatch(showModal(COVER_VIEWER));
      }
    }, [coverPath, getImageUri, dispatch]);

    return (
      <View style={[styles.wrapper, book.itemStyle]}>
        <View style={styles.bookItem}>
          <View style={styles.leftSide}>
            <View style={styles.coverWrapper}>
              {coverPath && imageUri ? (
                <Pressable onPress={handleCoverPress} style={styles.coverPressable}>
                  <Image
                    key={`${bookId}-${coverPath.substring(0, 50)}`}
                    style={styles.cover}
                    source={{
                      uri: imageUri,
                    }}
                    cachePolicy={imageUri.startsWith('data:image') ? 'none' : 'memory-disk'}
                    contentFit='cover'
                    transition={200}
                    priority='high'
                    recyclingKey={`${bookId}-${coverPath.substring(0, 50)}`}
                  />
                  <View style={styles.zoomIconContainer}>
                    <ZoomIn size={20} color={colors.neutral_white} />
                  </View>
                </Pressable>
              ) : (
                <View style={[styles.cover, { backgroundColor: colors.neutral_medium }]} />
              )}
            </View>
            <View>
              <Button style={styles.more} titleStyle={styles.moreTitle} title={t('common:edit')} onPress={navigateToEditCustomBook} />
              <BookStatusDropdown bookStatus={bookStatus as BookStatus} bookId={bookId} dropdownLeftPosition={16} />
            </View>
          </View>
          <View style={styles.rightSide}>
            <Text style={[styles.title, styles.lightColor]}>{title}</Text>
            {Array.isArray(authorsList) &&
              authorsList.length > 0 &&
              authorsList.map(
                (author, index) =>
                  index < 2 && (
                    <View key={`${author}_${index}`}>
                      <Text style={[styles.item, styles.mediumColor]}>{author}</Text>
                    </View>
                  ),
              )}
            <View style={styles.info}>
              {categoryLabel ? (
                <Text style={[styles.lightColor]} numberOfLines={1} ellipsizeMode='tail'>
                  {categoryLabel}
                </Text>
              ) : null}
              {!!pages && (
                <Text style={[styles.pagesBlock, styles.item, styles.mediumColor]}>
                  {t('pages')}
                  <Text style={styles.lightColor}>{pages}</Text>
                </Text>
              )}
              {bookStatus && (
                <>
                  <View style={styles.dateWrapper}>
                    <Text style={[styles.item, styles.mediumColor]}>{t('added')}</Text>
                    <ModifiedDate bookId={bookId} bookStatus={bookStatus} added={added as number} />
                  </View>
                  <Rating bookId={bookId} rating={bookRating} width={28} height={28} />
                </>
              )}
            </View>
            {bookStatus ? <BookNotePreview bookId={bookId} bookTitle={title} /> : null}
          </View>
        </View>
        <View style={styles.bottom}>
          <View>
            <Like bookId={bookId} bookStatus={bookStatus as BookStatus} />
          </View>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.imgUrl === nextProps.imgUrl &&
      prevProps.isEditable === nextProps.isEditable &&
      prevProps.bookItem.coverPath === nextProps.bookItem.coverPath &&
      prevProps.bookItem.votesCount === nextProps.bookItem.votesCount &&
      prevProps.bookItem.bookStatus === nextProps.bookItem.bookStatus &&
      prevProps.bookItem.added === nextProps.bookItem.added &&
      prevProps.bookItem.title === nextProps.bookItem.title &&
      prevProps.bookItem.pages === nextProps.bookItem.pages &&
      prevProps.bookItem.authorsList === nextProps.bookItem.authorsList
    );
  },
);

export default BookItem;

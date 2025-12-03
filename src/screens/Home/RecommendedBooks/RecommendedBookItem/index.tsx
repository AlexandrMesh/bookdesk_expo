import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { Text, View, Pressable } from 'react-native';

import { Image } from 'expo-image';
import { BookOpen } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch } from '~hooks';

import { PLANNED, IN_PROGRESS, COMPLETED, ALL } from '~constants/boardType';
import { COVER_VIEWER } from '~constants/modalTypes';
import { setCoverUrl, showModal } from '~redux/actions/booksActions';
import { updateBookOnBoardAndSearch } from '~redux/actions/sharedActions';
import { useThemeColors } from '~theme/hooks';
import { useThemedStyles } from '~theme/useThemedStyles';
import { BookStatus, IBook } from '~types/books';
import Dropdown from '~UI/Dropdown';
import { IRecommendedBook } from '~utils/aiRecommendations';

import createStyles from './styles';

export type Props = {
  book: IRecommendedBook;
};

const RecommendedBookItemComponent: FC<Props> = ({ book }) => {
  const { title, author, pages, coverUrl, coverUrlHQ, genreRu, genre } = book;
  const { t } = useTranslation(['books', 'common']);
  const dispatch = useAppDispatch();
  const styles = useThemedStyles(createStyles);
  const themeColors = useThemeColors();
  const [isAdding, setIsAdding] = useState(false);
  const [addedStatus, setAddedStatus] = useState<BookStatus | null>(null);

  // Don't show "Unknown author" or empty author
  const displayAuthor = author && author.toLowerCase() !== 'unknown author' && author.trim().length > 0 ? author : null;

  // Use Russian genre if available, otherwise fallback to original
  const displayGenre = genreRu || genre;

  const actionTypes: { title: string; value: BookStatus }[] = useMemo(
    () => [
      { title: t('planned'), value: PLANNED },
      { title: t('inProgress'), value: IN_PROGRESS },
      { title: t('completed'), value: COMPLETED },
    ],
    [t],
  );

  const handleAddToBoard = useCallback(
    async (status: BookStatus) => {
      if (isAdding || status === ALL) return;

      setIsAdding(true);
      try {
        const bookId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const added = Date.now();

        // Create book object
        const newBook: IBook = {
          bookId,
          title,
          authorsList: displayAuthor ? [displayAuthor] : [],
          pages: pages || 0,
          coverPath: coverUrl || undefined,
          bookStatus: status,
          added,
        };

        // Save book date/status locally
        try {
          const { saveBookDate, addBookToCache } = await import('~utils/boardStorage');
          await saveBookDate(bookId, added, status);
          await addBookToCache(status, newBook);
        } catch (e) {
          console.error('Failed to save recommended book in SQLite', e);
        }

        // Save to unified books table
        try {
          const { saveBook } = await import('~utils/database/books');
          await saveBook(newBook);
        } catch (error) {
          console.error('Failed to save recommended book in unified books table', error);
        }

        // Update Redux
        dispatch(
          updateBookOnBoardAndSearch({
            bookId,
            bookStatus: status,
            title: title || '',
            pages: pages || 0,
            authorsList: displayAuthor ? [displayAuthor] : [],
            coverPath: coverUrl,
            added,
          }),
        );

        setAddedStatus(status);
      } catch (error) {
        console.error('Error adding recommended book:', error);
      } finally {
        setIsAdding(false);
      }
    },
    [dispatch, title, displayAuthor, pages, coverUrl, isAdding],
  );

  const statusLabel = useMemo(() => {
    if (!addedStatus) return null;
    switch (addedStatus) {
      case PLANNED:
        return t('planned');
      case IN_PROGRESS:
        return t('inProgress');
      case COMPLETED:
        return t('completed');
      default:
        return null;
    }
  }, [addedStatus, t]);

  const getStatusColor = useCallback(
    (status: BookStatus | null) => {
      if (!status) return themeColors.neutral_medium;
      return (
        {
          [PLANNED]: themeColors.planned,
          [IN_PROGRESS]: themeColors.in_progress,
          [COMPLETED]: themeColors.completed,
          [ALL]: themeColors.neutral_light,
        }[status] || themeColors.neutral_medium
      );
    },
    [themeColors],
  );

  const handleCoverPress = useCallback(() => {
    // Use high quality cover URL if available
    const fullUrl = coverUrlHQ || coverUrl;
    if (fullUrl) {
      dispatch(setCoverUrl(fullUrl));
      dispatch(showModal(COVER_VIEWER));
    }
  }, [coverUrl, coverUrlHQ, dispatch]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.bookItem}>
        <View style={styles.leftSide}>
          <View style={styles.coverWrapper}>
            {coverUrl ? (
              <Pressable onPress={handleCoverPress}>
                <Image
                  style={styles.cover}
                  source={{ uri: coverUrl }}
                  contentFit='cover'
                  transition={200}
                  placeholder={require('~assets/logo.webp')}
                />
              </Pressable>
            ) : (
              <View style={[styles.coverPlaceholder, { backgroundColor: themeColors.neutral_medium }]}>
                <BookOpen size={40} color={themeColors.neutral_light} />
                <Text style={[styles.coverPlaceholderText, styles.lightColor]} numberOfLines={2}>
                  {title}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.buttonWrapper}>
            {addedStatus ? (
              <View style={[styles.statusButton, { backgroundColor: getStatusColor(addedStatus), borderColor: getStatusColor(addedStatus) }]}>
                <Text style={styles.statusButtonText}>{statusLabel}</Text>
              </View>
            ) : (
              <Dropdown
                items={actionTypes}
                isLoading={isAdding}
                wrapperStyle={[styles.dropdownWrapper, { borderColor: themeColors.accent }]}
                buttonLabelStyle={styles.dropdownLabel}
                selectedItem={ALL}
                buttonLabel={t('common:add')}
                onChange={handleAddToBoard}
                dropdownLeftPosition={16}
                fillBackground={true}
              />
            )}
          </View>
        </View>
        <View style={styles.rightSide}>
          <Text style={[styles.title, styles.lightColor]}>{title}</Text>
          {displayAuthor && <Text style={[styles.item, styles.mediumColor]}>{displayAuthor}</Text>}
          <View style={styles.info}>
            {displayGenre && (
              <View style={styles.genreBadge}>
                <Text style={[styles.genreText, styles.lightColor]}>{displayGenre}</Text>
              </View>
            )}
            {!!pages && (
              <Text style={[styles.pagesBlock, styles.item, styles.mediumColor]}>
                {t('pages')}
                <Text style={styles.lightColor}>{pages}</Text>
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const RecommendedBookItem = memo(RecommendedBookItemComponent, (prevProps, nextProps) => {
  return prevProps.book.id === nextProps.book.id && prevProps.book.coverUrl === nextProps.book.coverUrl;
});

export default RecommendedBookItem;

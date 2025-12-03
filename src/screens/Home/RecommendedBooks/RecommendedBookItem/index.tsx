import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Text, View, Pressable } from 'react-native';

import { Image } from 'expo-image';
import { BookOpen, ZoomIn } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { useAppDispatch } from '~hooks';

import { PLANNED, IN_PROGRESS, COMPLETED, ALL } from '~constants/boardType';
import { COVER_VIEWER } from '~constants/modalTypes';
import { setCoverUrl, showModal } from '~redux/actions/booksActions';
import { updateBookOnBoardAndSearch } from '~redux/actions/sharedActions';
import { deriveBoard } from '~redux/selectors/books';
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
  const [localAddedStatus, setLocalAddedStatus] = useState<BookStatus | null>(null);
  const [coverError, setCoverError] = useState(false);

  // Get all boards to check if book exists
  const plannedBoard = useSelector(deriveBoard(PLANNED));
  const inProgressBoard = useSelector(deriveBoard(IN_PROGRESS));
  const completedBoard = useSelector(deriveBoard(COMPLETED));

  // Don't show "Unknown author" or empty author
  const displayAuthor = author && author.toLowerCase() !== 'unknown author' && author.trim().length > 0 ? author : null;

  // Use Russian genre if available, otherwise fallback to original
  const displayGenre = genreRu || genre;

  // Check if this book is already in user's library by title
  const existingBookStatus = useMemo(() => {
    const titleLower = title?.toLowerCase().trim();
    if (!titleLower) return null;

    // Check in all boards
    const findBookByTitle = (boardData: { data?: IBook[] } | null): BookStatus | null => {
      if (!boardData?.data) return null;
      const found = boardData.data.find((b) => b.title?.toLowerCase().trim() === titleLower);
      return found?.bookStatus || null;
    };

    const inPlanned = findBookByTitle(plannedBoard);
    if (inPlanned) return inPlanned;

    const inProgress = findBookByTitle(inProgressBoard);
    if (inProgress) return inProgress;

    const inCompleted = findBookByTitle(completedBoard);
    if (inCompleted) return inCompleted;

    return null;
  }, [title, plannedBoard, inProgressBoard, completedBoard]);

  // Combined status: existing book status OR locally added status
  const currentStatus = existingBookStatus || localAddedStatus;

  // Reset local status if book was removed from boards
  useEffect(() => {
    if (localAddedStatus && !existingBookStatus) {
      // Check if the book was removed - if localAddedStatus was set but existingBookStatus is now null
      // This means user removed the book from boards
      setLocalAddedStatus(null);
    }
  }, [existingBookStatus, localAddedStatus]);

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

        setLocalAddedStatus(status);
      } catch (error) {
        console.error('Error adding recommended book:', error);
      } finally {
        setIsAdding(false);
      }
    },
    [dispatch, title, displayAuthor, pages, coverUrl, isAdding],
  );

  const statusLabel = useMemo(() => {
    if (!currentStatus) return null;
    switch (currentStatus) {
      case PLANNED:
        return t('planned');
      case IN_PROGRESS:
        return t('inProgress');
      case COMPLETED:
        return t('completed');
      default:
        return null;
    }
  }, [currentStatus, t]);

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
    // Use high quality cover URL if available, fallback to regular
    const fullUrl = coverUrlHQ || coverUrl;
    if (fullUrl && !coverError) {
      dispatch(setCoverUrl(fullUrl));
      dispatch(showModal(COVER_VIEWER));
    }
  }, [coverUrl, coverUrlHQ, coverError, dispatch]);

  const handleCoverError = useCallback(() => {
    setCoverError(true);
  }, []);

  const showCover = coverUrl && !coverError;

  return (
    <View style={styles.wrapper}>
      <View style={styles.bookItem}>
        <View style={styles.leftSide}>
          <View style={styles.coverWrapper}>
            {showCover ? (
              <Pressable onPress={handleCoverPress} style={styles.coverPressable}>
                <Image style={styles.cover} source={{ uri: coverUrl }} contentFit='cover' transition={200} onError={handleCoverError} />
                <View style={styles.zoomIconContainer}>
                  <ZoomIn size={20} color={themeColors.neutral_white} />
                </View>
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
            {currentStatus ? (
              <View style={[styles.statusButton, { backgroundColor: getStatusColor(currentStatus), borderColor: getStatusColor(currentStatus) }]}>
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

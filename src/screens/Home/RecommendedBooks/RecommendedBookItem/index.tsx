import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Text, ToastAndroid, TouchableOpacity, View, Pressable } from 'react-native';

import { Image } from 'expo-image';
import { BookOpen, ZoomIn } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { useAppDispatch } from '~hooks';

import { PLANNED, IN_PROGRESS, COMPLETED, ALL } from '~constants/boardType';
import { COVER_VIEWER } from '~constants/modalTypes';
import { setCoverUrl, showModal, updateUserBook, loadCategories } from '~redux/actions/booksActions';
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
  const { title, author, pages, coverUrl, genreRu, genre } = book;
  const { t, i18n } = useTranslation(['books', 'common']);
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
  const existingBook = useMemo(() => {
    const titleLower = title?.toLowerCase().trim();
    if (!titleLower) return null;

    // Check in all boards
    const findBookByTitle = (boardData: { data?: IBook[] } | null): IBook | null => {
      if (!boardData?.data) return null;
      return boardData.data.find((b) => b.title?.toLowerCase().trim() === titleLower) || null;
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
  const currentStatus = existingBook?.bookStatus || localAddedStatus;

  // Reset local status if book was removed from boards
  useEffect(() => {
    if (localAddedStatus && !existingBook) {
      setLocalAddedStatus(null);
    }
  }, [existingBook, localAddedStatus]);

  const actionTypes: { title: string; value: BookStatus }[] = useMemo(
    () => [
      { title: t('planned'), value: PLANNED },
      { title: t('inProgress'), value: IN_PROGRESS },
      { title: t('completed'), value: COMPLETED },
    ],
    [t],
  );

  const handleStatusChange = useCallback(
    async (newStatus: BookStatus) => {
      if (isAdding || newStatus === ALL) return;

      // If changing status of existing book - use updateUserBook for proper board management
      if (existingBook && existingBook.bookId && currentStatus && currentStatus !== newStatus) {
        setIsAdding(true);
        try {
          const added = Date.now();

          // Use the proper updateUserBook action which handles removing from old board
          // and adding to new board correctly
          await dispatch(
            updateUserBook({
              book: existingBook,
              newBookStatus: newStatus,
              added,
              boardType: currentStatus, // Current board type (where the book is now)
            }),
          );

          setLocalAddedStatus(newStatus);
          ToastAndroid.show(t('statusUpdated'), ToastAndroid.SHORT);
        } catch (error) {
          console.error('Error updating book status:', error);
        } finally {
          setIsAdding(false);
        }
        return;
      }

      // Adding new book (book doesn't exist in library yet)
      setIsAdding(true);
      try {
        const bookId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const added = Date.now();

        // Add genre to custom categories ("My Genres") if available
        let categoryPath: string | undefined;
        let categoryValue: string | undefined;
        let genreAdded = false;
        if (displayGenre) {
          try {
            const { addCustomGenre, loadCustomGenres } = await import('~utils/database/customCategories');
            const currentLang = i18n.language || 'ru';

            // Check if genre already exists in custom categories
            const existingGenres = await loadCustomGenres(currentLang);
            const existingGenre = existingGenres.find((g) => g.title.toLowerCase() === displayGenre.toLowerCase());

            if (existingGenre) {
              // Use existing genre - path format: myGenres.{id}
              categoryPath = `myGenres.${existingGenre.id}`;
              categoryValue = existingGenre.title;
            } else {
              // Add new genre to "My Genres"
              const newGenre = await addCustomGenre(displayGenre, currentLang);
              categoryPath = `myGenres.${newGenre.id}`;
              categoryValue = newGenre.title;
              genreAdded = true;
            }
          } catch (e) {
            console.error('Failed to add genre to custom categories', e);
          }
        }

        // Reload categories if a new genre was added
        if (genreAdded) {
          dispatch(loadCategories(true));
        }

        // Convert cover URL to base64 for offline storage (http/https/file/content URI)
        let finalCoverPath = coverUrl || undefined;
        if (finalCoverPath) {
          try {
            const { convertAnyCoverToBase64 } = await import('~utils/imageConverter');
            const base64Cover = await convertAnyCoverToBase64(finalCoverPath);
            if (base64Cover) {
              finalCoverPath = base64Cover;
            }
          } catch (error) {
            console.error('Failed to convert recommended book cover to base64:', error);
            // Continue with original path if conversion fails
          }
        }

        // Create book object
        const newBook: IBook = {
          bookId,
          title,
          authorsList: displayAuthor ? [displayAuthor] : [],
          pages: pages || 0,
          coverPath: finalCoverPath,
          bookStatus: newStatus,
          added,
          categoryPath,
          categoryValue,
        };

        // Save book date/status locally
        try {
          const { saveBookDate, addBookToCache } = await import('~utils/boardStorage');
          await saveBookDate(bookId, added, newStatus);
          await addBookToCache(newStatus, newBook);
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
            bookStatus: newStatus,
            title: title || '',
            pages: pages || 0,
            authorsList: displayAuthor ? [displayAuthor] : [],
            coverPath: finalCoverPath,
            added,
            categoryPath,
            categoryValue,
          }),
        );

        setLocalAddedStatus(newStatus);
        ToastAndroid.show(t('statusUpdated'), ToastAndroid.SHORT);
      } catch (error) {
        console.error('Error adding recommended book:', error);
      } finally {
        setIsAdding(false);
      }
    },
    [dispatch, title, displayAuthor, pages, coverUrl, isAdding, existingBook, currentStatus, t, displayGenre, i18n],
  );

  const getStatusColor = useCallback(
    (status: BookStatus | null) => {
      if (!status) return themeColors.accent;
      return (
        {
          [PLANNED]: themeColors.planned,
          [IN_PROGRESS]: themeColors.in_progress,
          [COMPLETED]: themeColors.completed,
          [ALL]: themeColors.neutral_light,
        }[status] || themeColors.accent
      );
    },
    [themeColors],
  );

  const handleCoverPress = useCallback(() => {
    // Use the same URL that's already loaded and cached by expo-image
    // No additional network request needed
    if (coverUrl) {
      dispatch(setCoverUrl(coverUrl));
      dispatch(showModal(COVER_VIEWER));
    }
  }, [coverUrl, dispatch]);

  const handleCoverError = useCallback(() => {
    setCoverError(true);
  }, []);

  const showCover = coverUrl && !coverError;

  const buttonLabel = currentStatus ? t(currentStatus) : t('common:add');
  const statusColor = getStatusColor(currentStatus);

  return (
    <View style={styles.wrapper}>
      <View style={styles.bookItem}>
        <View style={styles.leftSide}>
          <View style={styles.coverWrapper}>
            {showCover ? (
              <Pressable onPress={handleCoverPress} style={styles.coverPressable}>
                <Image
                  style={styles.cover}
                  source={{ uri: coverUrl }}
                  contentFit='contain'
                  transition={0}
                  cachePolicy='memory-disk'
                  recyclingKey={book.id}
                  onError={handleCoverError}
                />
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
          <View style={styles.buttonsWrapper}>
            <Dropdown
              items={actionTypes}
              isLoading={isAdding}
              wrapperStyle={[styles.dropdownWrapper, { borderColor: statusColor }]}
              buttonLabelStyle={styles.dropdownLabel}
              selectedItem={currentStatus || ALL}
              buttonLabel={buttonLabel}
              onChange={handleStatusChange}
              dropdownLeftPosition={16}
              fillBackground={true}
            />
          </View>
        </View>
        <View style={styles.rightSide}>
          <Text style={[styles.title, styles.lightColor]}>{title}</Text>
          {displayAuthor && <Text style={[styles.item, styles.mediumColor]}>{displayAuthor}</Text>}
          <View style={styles.info}>
            {displayGenre && (
              <TouchableOpacity style={styles.genreBadge} onPress={() => ToastAndroid.show(displayGenre, ToastAndroid.SHORT)} activeOpacity={0.7}>
                <Text style={[styles.genreText, styles.lightColor]}>{displayGenre}</Text>
              </TouchableOpacity>
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

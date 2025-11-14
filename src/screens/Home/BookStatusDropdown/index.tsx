import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import { ALL, COMPLETED, IN_PROGRESS, PLANNED } from '~constants/boardType';
import { updateUserBook } from '~redux/actions/booksActions';
import { deriveBoard, getBoardType } from '~redux/selectors/books';
import colors from '~styles/colors';
import { BookStatus, IBook } from '~types/books';
import Dropdown from '~UI/Dropdown';

export type Props = {
  bookId: string;
  bookStatus: BookStatus;
  dropdownLeftPosition?: number;
  wrapperStyle?: StyleProp<ViewStyle>;
  buttonLabelStyle?: StyleProp<TextStyle>;
};

const getStatusColor = (bookStatus: BookStatus) =>
  ({
    [PLANNED]: colors.planned,
    [IN_PROGRESS]: colors.in_progress,
    [COMPLETED]: colors.completed,
    [ALL]: colors.neutral_light,
  })[bookStatus] || colors.neutral_light;

const BookStatusDropdown: FC<Props> = ({ bookStatus, bookId, dropdownLeftPosition, wrapperStyle, buttonLabelStyle }) => {
  const { t } = useTranslation('books');
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const statusColor = getStatusColor(bookStatus);
  const boardType = useAppSelector(getBoardType) as BookStatus;
  const currentBoard = useAppSelector(deriveBoard(boardType));

  const actionTypes: { title: string; value: BookStatus }[] = useMemo(
    () => [
      {
        title: t('planned'),
        value: PLANNED,
      },
      { title: t('inProgress'), value: IN_PROGRESS },
      { title: t('completed'), value: COMPLETED },
    ],
    [t],
  );

  const handleUpdateBookStatus = useCallback(
    async (newBookStatus: BookStatus) => {
      if (isLoading || (bookStatus || ALL) === newBookStatus) {
        return;
      }
      const added = new Date().getTime();
      try {
        setIsLoading(true);

        // Получаем полную книгу из единой таблицы или из кэша
        let fullBook: IBook | null = null;
        try {
          const { loadBook } = await import('~utils/database/books');
          fullBook = await loadBook(bookId);
        } catch (error) {
          console.warn(`Error loading book from unified table:`, error);
        }

        // Если не нашли в единой таблице, пытаемся найти в текущем board state
        if (!fullBook && currentBoard?.data) {
          fullBook = currentBoard.data.find((b) => b.bookId === bookId) || null;
        }

        // Используем полную книгу, если нашли, иначе создаем минимальный объект
        const bookToUpdate: IBook = fullBook || { bookId, bookStatus };

        await dispatch(
          updateUserBook({
            book: bookToUpdate,
            added,
            newBookStatus,
            boardType,
          }),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [boardType, bookId, bookStatus, dispatch, isLoading, currentBoard],
  );

  return (
    <Dropdown
      items={actionTypes}
      isLoading={isLoading}
      wrapperStyle={[wrapperStyle, { borderColor: statusColor }]}
      buttonLabelStyle={[buttonLabelStyle, { color: statusColor }]}
      iconStyle={{ fill: statusColor } as any}
      selectedItem={bookStatus || ALL}
      buttonLabel={t(bookStatus) || t('noStatus')}
      onChange={handleUpdateBookStatus}
      dropdownLeftPosition={dropdownLeftPosition}
    />
  );
};

export default memo(BookStatusDropdown);

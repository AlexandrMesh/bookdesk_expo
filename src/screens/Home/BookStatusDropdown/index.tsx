import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { ALL, COMPLETED, IN_PROGRESS, PLANNED } from '~constants/boardType';
import { useAppDispatch, useAppSelector } from '~hooks';
import { updateUserBook } from '~redux/actions/booksActions';
import { getBoardType } from '~redux/selectors/books';
import colors from '~styles/colors';
import { BookStatus } from '~types/books';
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
  }[bookStatus] || colors.neutral_light);

const BookStatusDropdown: FC<Props> = ({ bookStatus, bookId, dropdownLeftPosition, wrapperStyle, buttonLabelStyle }) => {
  const { t } = useTranslation('books');
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const statusColor = getStatusColor(bookStatus);
  const boardType = useAppSelector(getBoardType) as BookStatus;

  const actionTypes: { title: string; value: BookStatus }[] = useMemo(
    () => [
      { title: t('noStatus'), value: ALL },
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
        await dispatch(
          updateUserBook({
            book: { bookId, bookStatus },
            added,
            newBookStatus,
            boardType,
          }),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [boardType, bookId, bookStatus, dispatch, isLoading],
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

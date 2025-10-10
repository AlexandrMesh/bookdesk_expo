import React, { useMemo, useState, useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { ALL, PLANNED, IN_PROGRESS, COMPLETED } from '~constants/boardType';
import { useAppDispatch, useAppSelector } from '~hooks';
import { setStatus } from '~redux/actions/customBookActions';
import { getStatus } from '~redux/selectors/customBook';
import colors from '~styles/colors';
import { BookStatus } from '~types/books';
import Dropdown from '~UI/Dropdown';

const getStatusColor = (bookStatus: BookStatus) =>
  ({
    [PLANNED]: colors.planned,
    [IN_PROGRESS]: colors.in_progress,
    [COMPLETED]: colors.completed,
    [ALL]: colors.neutral_light,
  })[bookStatus] || colors.neutral_light;

const CustomBookStatusDropdown = () => {
  const { t } = useTranslation(['customBook', 'books', 'common']);
  const dispatch = useAppDispatch();
  const _setStatus = useCallback((status: BookStatus) => dispatch(setStatus(status)), [dispatch]);

  const bookStatus = useAppSelector(getStatus);

  const statusColor = getStatusColor(bookStatus);

  const [isLoading, setIsLoading] = useState(false);

  const actionTypes: { title: string; value: BookStatus }[] = useMemo(
    () => [
      { title: t('books:noStatus'), value: ALL },
      {
        title: t('books:planned'),
        value: PLANNED,
      },
      { title: t('books:inProgress'), value: IN_PROGRESS },
      { title: t('books:completed'), value: COMPLETED },
    ],
    [t],
  );

  const handleUpdateBookStatus = useCallback(
    async (newBookStatus: BookStatus) => {
      if (isLoading || (bookStatus || ALL) === newBookStatus) {
        return;
      }
      try {
        setIsLoading(true);
        _setStatus(newBookStatus);
      } finally {
        setIsLoading(false);
      }
    },
    [_setStatus, bookStatus, isLoading],
  );

  return (
    <Dropdown
      items={actionTypes}
      isLoading={isLoading}
      wrapperStyle={{ borderColor: statusColor }}
      buttonLabelStyle={{ color: statusColor }}
      iconStyle={{ fill: statusColor } as any}
      selectedItem={bookStatus || ALL}
      buttonLabel={bookStatus === ALL ? t('books:noStatus') : t(`books:${bookStatus}`)}
      onChange={handleUpdateBookStatus}
    />
  );
};

export default CustomBookStatusDropdown;

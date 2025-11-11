import React, { useMemo, useState, useCallback, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import { ALL, PLANNED, IN_PROGRESS, COMPLETED } from '~constants/boardType';
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
      {
        title: t('books:planned'),
        value: PLANNED,
      },
      { title: t('books:inProgress'), value: IN_PROGRESS },
      { title: t('books:completed'), value: COMPLETED },
    ],
    [t],
  );

  // Устанавливаем значение по умолчанию, если статус ещё не выбран или равен ALL
  useEffect(() => {
    if (!bookStatus || bookStatus === ALL) {
      _setStatus(actionTypes[0].value);
    }
  }, [bookStatus, _setStatus, actionTypes]);

  const handleUpdateBookStatus = useCallback(
    async (newBookStatus: BookStatus) => {
      if (isLoading || bookStatus === newBookStatus) {
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
      selectedItem={bookStatus || actionTypes[0].value}
      buttonLabel={t(`books:${bookStatus || actionTypes[0].value}`)}
      onChange={handleUpdateBookStatus}
    />
  );
};

export default CustomBookStatusDropdown;

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

  // Устанавливаем значение по умолчанию только если статус действительно null или ALL
  // Не устанавливаем, если статус уже был установлен извне (например, через навигацию)
  useEffect(() => {
    // Проверяем, что статус действительно отсутствует (null) или равен ALL
    // и что он не является одним из валидных статусов
    if (bookStatus === null || bookStatus === ALL) {
      _setStatus(actionTypes[0].value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      selectedItem={bookStatus || actionTypes[0].value}
      buttonLabel={t(`books:${bookStatus || actionTypes[0].value}`)}
      onChange={handleUpdateBookStatus}
    />
  );
};

export default CustomBookStatusDropdown;

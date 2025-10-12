import React from 'react';

import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import { ALL } from '~constants/boardType';
import { SECONDARY } from '~constants/themes';
import { clearFilters } from '~redux/actions/booksActions';
import { deriveBookListEditableFilterParams } from '~redux/selectors/books';
import { BookStatus } from '~types/books';
import Button from '~UI/Button';

import styles from './styles';

const ClearFilters = () => {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const filterParams = useAppSelector(deriveBookListEditableFilterParams(ALL));
  const _clearFilters = (boardType: BookStatus) => dispatch(clearFilters(boardType));

  const { categoryPaths } = filterParams;

  const handleClearFilters = () => {
    _clearFilters(ALL);
  };

  return categoryPaths.length > 0 ? (
    <Button style={styles.resetButton} titleStyle={styles.titleStyle} theme={SECONDARY} title={t('clear')} onPress={handleClearFilters} />
  ) : null;
};

export default ClearFilters;

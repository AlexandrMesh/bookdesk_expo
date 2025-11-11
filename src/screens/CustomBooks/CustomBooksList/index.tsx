import React, { useCallback } from 'react';

import { View } from 'react-native';

import { useAppSelector } from '~hooks';

import { IDLE, PENDING, SUCCEEDED } from '~constants/loadingStatuses';
// loadCustomBookList removed: custom books are now added to boards locally
import {
  deriveCustomBookListData,
  getCustomBooksLoadingDataStatus,
  getCustomBooksShouldReloadData,
  getCustomBooksTotalItems,
} from '~redux/selectors/customBook';
import TotalCount from '~screens/Home/ActionBar/TotalCount';
import BooksList from '~screens/Home/BooksList';
import EmptyBoard from '~screens/Home/EmptyBoard';

import styles from './styles';

const CustomBooksList = () => {
  // Custom books are now added to boards locally, no separate loading needed
  const _loadMoreBooks = useCallback(() => {
    // No-op: custom books are loaded with board data
  }, []);

  const data = useAppSelector(deriveCustomBookListData);
  const loadingDataStatus = useAppSelector(getCustomBooksLoadingDataStatus);
  const shouldReloadData = useAppSelector(getCustomBooksShouldReloadData);
  const totalItems = useAppSelector(getCustomBooksTotalItems);

  // Removed useEffect: custom books are loaded with board data locally

  if (data.length === 0 && loadingDataStatus === SUCCEEDED && !shouldReloadData) {
    return <EmptyBoard />;
  }

  return (
    <View style={styles.wrapper}>
      {loadingDataStatus !== IDLE && loadingDataStatus !== PENDING ? <TotalCount count={totalItems} /> : null}
      <BooksList data={data} isEditable loadMoreBooks={_loadMoreBooks} loadingDataStatus={loadingDataStatus} />
    </View>
  );
};

export default CustomBooksList;

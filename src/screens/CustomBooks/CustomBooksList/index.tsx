import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import EmptyBoard from '~screens/Home/EmptyBoard';
import TotalCount from '~screens/Home/ActionBar/TotalCount';
import { IDLE, PENDING, SUCCEEDED } from '~constants/loadingStatuses';
import { useAppDispatch, useAppSelector } from '~hooks';
import { loadCustomBookList, loadMoreBooks } from '~redux/actions/customBookActions';
import {
  deriveCustomBookListData,
  getCustomBooksLoadingDataStatus,
  getCustomBooksShouldReloadData,
  getCustomBooksTotalItems,
} from '~redux/selectors/customBook';
import BooksList from '../../Home/BooksList';
import styles from './styles';

const CustomBooksList = () => {
  const dispatch = useAppDispatch();
  const _loadBookList = useCallback(
    ({ shouldLoadMoreResults }: { shouldLoadMoreResults: boolean }) => dispatch(loadCustomBookList({ shouldLoadMoreResults })),
    [dispatch],
  );
  const _loadMoreBooks = useCallback(() => dispatch(loadMoreBooks()), [dispatch]);

  const data = useAppSelector(deriveCustomBookListData);
  const loadingDataStatus = useAppSelector(getCustomBooksLoadingDataStatus);
  const shouldReloadData = useAppSelector(getCustomBooksShouldReloadData);
  const totalItems = useAppSelector(getCustomBooksTotalItems);

  useEffect(() => {
    if (loadingDataStatus === IDLE || shouldReloadData) {
      _loadBookList({
        shouldLoadMoreResults: false,
      });
    }
  }, [_loadBookList, loadingDataStatus, shouldReloadData]);

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

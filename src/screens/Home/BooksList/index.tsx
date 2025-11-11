import React, { FC, memo, useCallback, useEffect, useRef } from 'react';

import { Text, View } from 'react-native';

import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';

import { IDLE, PENDING, SUCCEEDED } from '~constants/loadingStatuses';
import useGetImgUrl from '~hooks/useGetImgUrl';
import { IBook } from '~types/books';
import { LoadingType } from '~types/loadingTypes';
import Button from '~UI/Button';
import { Spinner } from '~UI/Spinner';

import BookItem from './BookItem';
import ItemPlaceholder from './ItemPlaceholder';
import styles from './styles';

export type Props = {
  horizontal?: boolean;
  data: IBook[];
  loadMoreBooks?: () => void;
  loadingDataStatus: LoadingType;
  isEditable?: boolean;
  onPressAdd?: () => void;
};

const BookList: FC<Props> = ({ data = [], loadMoreBooks = () => undefined, loadingDataStatus, horizontal, isEditable, onPressAdd }) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tBooks } = useTranslation('books');
  const listRef = useRef<any>(null);
  const imgUrl = useGetImgUrl();
  const getFooter = useCallback(() => {
    if (loadingDataStatus === PENDING && data?.length > 0) {
      return (
        <View style={styles.listFooterComponent}>
          <Spinner />
        </View>
      );
    }
    if (loadingDataStatus === SUCCEEDED && data?.length > 0 && onPressAdd) {
      return (
        <View style={styles.footerAddWrapper}>
          <Button style={styles.footerAddButton} title={tBooks('addBook')} onPress={onPressAdd} />
        </View>
      );
    }
    return null;
  }, [data.length, loadingDataStatus, onPressAdd, tBooks]);

  const getListEmptyComponent = useCallback(
    () => (
      <>
        <ItemPlaceholder />
        <ItemPlaceholder />
        <ItemPlaceholder />
      </>
    ),
    [],
  );

  const onEndReached = useCallback(() => {
    if (data?.length > 0 && loadingDataStatus !== PENDING && loadingDataStatus !== IDLE) {
      loadMoreBooks();
    }
  }, [data.length, loadMoreBooks, loadingDataStatus]);

  const getKeyExtractor = useCallback((item: IBook) => (typeof item === 'string' ? item : item.bookId), []);

  const renderSectionHeader = useCallback(
    (item: string) => {
      const splittedItem = item.split('/');
      const title = splittedItem[0];
      const count = splittedItem[1];
      return (
        <View style={styles.stickyHeader}>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>{title}</Text>
          </View>
          <View style={[styles.taskCount, styles.headerTitle]}>
            <Text style={styles.headerTitleText}>{String(tCommon('count', { count } as any))}</Text>
          </View>
        </View>
      );
    },
    [tCommon],
  );

  const renderItem = useCallback(
    (item: { item: IBook | string }) => {
      if (typeof item.item === 'string') {
        // Rendering header
        return renderSectionHeader(item.item);
      }
      // Render item
      return <BookItem imgUrl={imgUrl} bookItem={item.item as IBook} isEditable={isEditable} />;
    },
    [renderSectionHeader, imgUrl, isEditable],
  );

  const getItemType = useCallback((item: IBook | string) => {
    // To achieve better performance, specify the type based on the item
    return typeof item === 'string' ? 'sectionHeader' : 'row';
  }, []);

  useEffect(() => {
    if (data?.length === 0 && loadingDataStatus === SUCCEEDED) {
      listRef?.current?.scrollToOffset({ offset: 0 });
    }
  }, [data?.length, loadingDataStatus]);

  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        horizontal={horizontal}
        data={data}
        renderItem={renderItem}
        getItemType={getItemType}
        keyExtractor={getKeyExtractor}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={getListEmptyComponent}
        onEndReached={onEndReached}
        ListFooterComponent={getFooter}
      />
    </View>
  );
};

export default memo(BookList);

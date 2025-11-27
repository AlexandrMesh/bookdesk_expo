import React, { FC, memo, useCallback, useEffect, useRef } from 'react';

import { Text, View } from 'react-native';

import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';

import { PENDING, SUCCEEDED } from '~constants/loadingStatuses';
import useGetImgUrl from '~hooks/useGetImgUrl';
import { IBook } from '~types/books';
import { LoadingType } from '~types/loadingTypes';
import { useThemedStyles } from '~theme/useThemedStyles';
import Button from '~UI/Button';
import { Spinner } from '~UI/Spinner';

import BookItem from './BookItem';
import ItemPlaceholder from './ItemPlaceholder';
import createStyles from './styles';

const BOOK_ITEM_ESTIMATED_HEIGHT = 260;
const SECTION_HEADER_HEIGHT = 64;

export type Props = {
  horizontal?: boolean;
  data: Array<IBook | string>;
  loadingDataStatus: LoadingType;
  isEditable?: boolean;
  onPressAdd?: () => void;
};

const VirtualizedFlashList: any = FlashList;

const BookList: FC<Props> = ({ data = [], loadingDataStatus, horizontal, isEditable, onPressAdd }) => {
  const { t: tCommon } = useTranslation('common');
  const { t: tBooks } = useTranslation('books');
  const styles = useThemedStyles(createStyles);
  const listRef = useRef<any>(null);
  const imgUrl = useGetImgUrl();
  // Убеждаемся что data всегда массив
  const safeData = (Array.isArray(data) ? data : []) as Array<IBook | string>;
  const getFooter = useCallback(() => {
    if (loadingDataStatus === PENDING && safeData?.length > 0) {
      return (
        <View style={styles.listFooterComponent}>
          <Spinner />
        </View>
      );
    }
    if (loadingDataStatus === SUCCEEDED && safeData?.length > 0 && onPressAdd) {
      return (
        <View style={styles.footerAddWrapper}>
          <Button style={styles.footerAddButton} title={tBooks('addBook')} onPress={onPressAdd} />
        </View>
      );
    }
    return null;
  }, [safeData?.length, loadingDataStatus, onPressAdd, tBooks]);

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

  const getKeyExtractor = useCallback((item: IBook | string) => (typeof item === 'string' ? item : item.bookId), []);

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

  const overrideItemLayout = useCallback((layout: any, item: IBook | string) => {
    layout.size = typeof item === 'string' ? SECTION_HEADER_HEIGHT : BOOK_ITEM_ESTIMATED_HEIGHT;
  }, []);

  useEffect(() => {
    if (safeData?.length === 0 && loadingDataStatus === SUCCEEDED) {
      listRef?.current?.scrollToOffset({ offset: 0 });
    }
  }, [safeData?.length, loadingDataStatus]);

  return (
    <View style={styles.container}>
      <VirtualizedFlashList
        ref={listRef}
        horizontal={horizontal}
        data={safeData}
        renderItem={renderItem}
        getItemType={getItemType}
        keyExtractor={getKeyExtractor}
        estimatedItemSize={BOOK_ITEM_ESTIMATED_HEIGHT}
        overrideItemLayout={overrideItemLayout}
        ListEmptyComponent={getListEmptyComponent}
        ListFooterComponent={getFooter}
        removeClippedSubviews={false}
      />
    </View>
  );
};

export default memo(BookList);

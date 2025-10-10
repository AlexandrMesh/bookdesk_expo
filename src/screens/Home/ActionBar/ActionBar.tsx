import React, { memo, FC } from 'react';

import { View, TouchableHighlight } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import FilterIcon from '~assets/filter.svg';
import SearchIcon from '~assets/search.svg';
import { FILTER_ICON } from '~constants/dimensions';
import { SEARCH_ROUTE, FITLERING_ROUTE } from '~constants/routes';
import { SECONDARY } from '~constants/themes';
import colors from '~styles/colors';
import { BookStatus } from '~types/books';
import Button from '~UI/Button';

import styles from './styles';
import TotalCount from './TotalCount';

export type Props = {
  filterParams?: {
    categoryPaths: string[];
  };
  totalItems: number;
  activeFiltersCount?: number;
  shouldRenderFilterButton?: boolean;
  boardType: BookStatus;
};

const ActionBar: FC<Props> = ({ filterParams, totalItems, activeFiltersCount, shouldRenderFilterButton = true, boardType }) => {
  const { t } = useTranslation('common');
  const navigation = useNavigation<any>();

  const categoriesLength = filterParams?.categoryPaths?.length || 0;
  const isActiveFilter = categoriesLength > 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.buttons}>
          {shouldRenderFilterButton ? (
            <Button
              theme={SECONDARY}
              style={[styles.button, isActiveFilter && { borderColor: colors.success }]}
              titleStyle={[styles.titleStyle, isActiveFilter && { color: colors.success }]}
              iconClassName={styles.icon}
              icon={
                <FilterIcon width={FILTER_ICON.width} height={FILTER_ICON.height} fill={isActiveFilter ? colors.success : colors.neutral_light} />
              }
              onPress={() => navigation.navigate(FITLERING_ROUTE)}
              title={isActiveFilter ? t('categoriesCount', { count: activeFiltersCount }) : t('categoriesTitle')}
            />
          ) : null}
        </View>
        <View style={styles.rightSide}>
          <TotalCount count={totalItems} />
          <TouchableHighlight style={styles.searchIconWrapper} onPress={() => navigation.navigate(SEARCH_ROUTE, { boardType })}>
            <SearchIcon width={24} height={24} fill={colors.neutral_light} />
          </TouchableHighlight>
        </View>
      </View>
    </View>
  );
};

export default memo(ActionBar);

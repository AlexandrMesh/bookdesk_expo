import { StyleSheet } from 'react-native';

import { ThemeColors } from '~theme/types';

export default (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      borderTopWidth: 1,
      borderTopColor: colors.neutral_medium,
      backgroundColor: colors.primary_dark,
    },
    listFooterComponent: {
      height: 80,
    },
    footerAddWrapper: {
      paddingVertical: 20,
      paddingHorizontal: 16,
    },
    footerAddButton: {
      maxWidth: 260,
      alignSelf: 'center',
    },
    stickyHeader: {
      marginHorizontal: 5,
      marginVertical: 10,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitle: {
      padding: 5,
      paddingHorizontal: 10,
      borderRadius: 5,
      backgroundColor: colors.neutral_medium,
    },
    headerTitleText: {
      fontSize: 16,
      color: colors.neutral_white,
    },
    taskCount: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    bookItem: {
      borderTopWidth: 1,
      borderTopColor: colors.neutral_medium,
    },
  });

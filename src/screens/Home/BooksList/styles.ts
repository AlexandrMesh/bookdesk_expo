import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: colors.neutral_medium,
    backgroundColor: colors.primary_dark,
  },
  listFooterComponent: {
    height: 80,
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
    borderRadius: 5,
    backgroundColor: colors.neutral_medium,
  },
  headerTitleText: {
    fontSize: 16,
    color: colors.neutral_light,
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

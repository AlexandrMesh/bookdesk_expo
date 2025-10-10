import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: colors.primary_dark,
  },
  tabBarLabel: {
    fontWeight: 'bold',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  wrapper: {
    display: 'flex',
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary_dark,
  },
  statBlock: {
    display: 'flex',
    flex: 1,
    minHeight: 360,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral_medium,
  },
  titleWrapper: {
    marginLeft: 5,
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 5,
    color: colors.neutral_light,
    backgroundColor: colors.primary_darkest,
    borderRadius: 5,
  },
  subTitle: {
    fontSize: 16,
    marginHorizontal: 5,
    color: colors.neutral_light,
  },
  chartWrapper: {
    marginTop: 10,
  },
  info: {
    marginTop: 10,
  },
  label: {
    fontSize: 17,
    paddingHorizontal: 15,
    marginTop: 15,
    color: colors.neutral_light,
  },
  noDataLabel: {
    fontSize: 18,
    color: colors.neutral_light,
    textAlign: 'center',
  },
  highlightedCount: {
    color: colors.completed,
    fontWeight: 'bold',
  },
  viewWrapper: {
    backgroundColor: colors.primary_dark,
    padding: 15,
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

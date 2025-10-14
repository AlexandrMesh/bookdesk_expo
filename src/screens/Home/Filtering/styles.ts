import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  container: {
    backgroundColor: colors.primary_dark,
    display: 'flex',
    flex: 1,
    height: '100%',
  },
  wrapper: {
    height: 300,
    width: '100%',
    display: 'flex',
    flex: 1,
    backgroundColor: colors.primary_dark,
  },
  menuItem: {
    height: 50,
    borderColor: colors.neutral_medium,
    paddingRight: 15,
    borderBottomWidth: 1,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchResult: {
    paddingLeft: 15,
  },
  menuItemTitle: {
    fontSize: 16,
    color: colors.neutral_light,
  },
  arrowIconWrapper: {
    paddingRight: 10,
    width: 55,
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  labelWrapper: {
    height: '100%',
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    width: '48%',
  },
  submitButtonWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 15,
  },
  submitButton: {
    maxWidth: 400,
  },
  buttonsRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  filterButton: {
    flex: 1,
    marginRight: 8,
  },
  resetButton: {
    flex: 1,
    marginLeft: 8,
  },
  firstLevel: {
    width: 35,
  },
  collapsed: {
    transform: [{ rotate: '-90deg' }],
  },
  emptyResult: {
    height: 300,
    width: '100%',
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyLabel: {
    fontSize: 16,
    color: colors.neutral_light,
  },
});

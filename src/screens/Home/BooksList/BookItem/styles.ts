import { StyleSheet } from 'react-native';
import colors from '~styles/colors';

export default StyleSheet.create({
  wrapper: {
    padding: 15,
    borderWidth: 1,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    borderColor: colors.neutral_medium,
  },
  bookItem: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  leftSide: {
    width: 126,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightSide: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginLeft: 15,
    flex: 1,
  },
  bottom: {
    marginTop: 10,
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  votesWrapper: {
    height: 30,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  spinnerWrapper: {
    width: 70,
    display: 'flex',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
  },
  coverWrapper: {
    marginBottom: 10,
  },
  cover: {
    width: 126,
    height: 180,
  },
  info: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 10,
    backgroundColor: colors.primary_darkest,
    padding: 10,
    borderRadius: 4,
  },
  pagesBlock: {
    marginTop: 5,
  },
  item: {
    fontSize: 15,
  },
  dateWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  lightColor: {
    color: colors.neutral_light,
  },
  mediumColor: {
    color: colors.neutral_medium,
  },
  votesCount: {
    marginLeft: 3,
  },
  buttonTitle: {
    fontSize: 15,
  },
  buttonsWrapper: {
    marginTop: 20,
  },
  statusButton: {
    width: 126,
    height: 30,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  planned: {
    borderColor: colors.planned,
  },
  inProgress: {
    borderColor: colors.in_progress,
  },
  completed: {
    borderColor: colors.completed,
  },
  more: {
    width: 126,
    height: 30,
  },
  moreTitle: {
    fontSize: 16,
  },
  editButton: {
    marginTop: 10,
  },
});

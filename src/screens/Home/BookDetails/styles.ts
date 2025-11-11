import { StyleSheet } from 'react-native';

import colors from '~styles/colors';

export default StyleSheet.create({
  spinnerWrapper: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    height: '100%',
    padding: 15,
    backgroundColor: colors.primary_dark,
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 15,
    fontSize: 21,
    textAlign: 'center',
  },
  lightColor: {
    color: colors.neutral_light,
  },
  ratingWrapper: {
    height: 32,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  ratingLabel: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingSpinnerWrapper: {
    width: 20,
    height: 20,
    marginLeft: 5,
    position: 'relative',
  },
  coverPressable: {
    position: 'relative',
  },
  cover: {
    width: 260,
    height: 395,
    resizeMode: 'contain',
  },
  zoomIconContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    padding: 6,
  },
  item: {
    fontSize: 18,
  },
  annotation: {
    fontSize: 18,
  },
  comment: {
    fontSize: 18,
    marginTop: 10,
  },
  mediumColor: {
    color: colors.neutral_medium,
  },
  commentWrapperClassName: {
    marginTop: 10,
    height: 240,
  },
  commentInput: {
    height: 210,
    textAlignVertical: 'top',
  },
  commentButton: {
    width: 100,
    height: 30,
    marginRight: 10,
  },
  commentButtonTitle: {
    fontSize: 14,
  },
  blockHeader: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marginTop: {
    marginTop: 15,
  },
  info: {
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: colors.primary_darkest,
    padding: 10,
    borderRadius: 4,
  },
  bookStatusWrapper: {
    marginTop: 15,
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteWrapper: {
    height: 30,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  votesSpinnerWrapper: {
    marginLeft: 20,
    width: 70,
    display: 'flex',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTitle: {
    fontSize: 18,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  statusButton: {
    width: 150,
    height: 36,
  },
  votesCount: {
    fontSize: 18,
    marginLeft: 5,
  },
});

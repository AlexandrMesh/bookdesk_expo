import { StyleSheet } from 'react-native';
import colors from '~styles/colors';

export default StyleSheet.create({
  wrapper: {
    padding: 10,
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary_dark,
  },
  noNoteWrapper: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  noNoteLabel: {
    marginRight: 15,
  },
  book: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  added: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  lightColor: {
    color: colors.neutral_light,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
  },
  info: {
    backgroundColor: colors.primary_darkest,
    padding: 10,
    borderRadius: 4,
  },
  content: {
    fontSize: 17,
    lineHeight: 23,
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  button: {
    width: 140,
    marginLeft: 10,
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  editIcon: {
    marginRight: 10,
  },
  commentWrapperClassName: {
    marginTop: 10,
    height: 240,
  },
  commentInput: {
    height: 210,
    textAlignVertical: 'top',
  },
  primaryButton: {
    width: 140,
    height: 40,
    marginRight: 10,
  },
  cancelButton: {
    width: 100,
    height: 40,
    marginRight: 10,
  },
  editActions: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
  },
  symbolsWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  subTitle: {
    fontSize: 16,
    color: colors.neutral_light,
  },
});

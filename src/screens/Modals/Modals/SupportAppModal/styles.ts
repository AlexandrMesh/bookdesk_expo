import { StyleSheet } from 'react-native';
import colors from '~styles/colors';

export default StyleSheet.create({
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.neutral_black,
    opacity: 0.5,
  },
  wrapper: {
    padding: 15,
    display: 'flex',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    maxWidth: 500,
    backgroundColor: colors.primary_dark,
    padding: 15,
    borderRadius: 5,
  },
  title: {
    textAlign: 'center',
    color: colors.neutral_light,
    fontSize: 24,
  },
  description: {
    marginTop: 15,
    color: colors.neutral_light,
    fontSize: 18,
  },
  footer: {
    marginTop: 15,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportButton: {
    width: 140,
    marginRight: 15,
  },
  supportButtonTitle: {
    textAlign: 'center',
  },
  alreadySupportedLink: {
    color: colors.neutral_light,
    fontSize: 18,
    borderBottomColor: colors.neutral_light,
    borderWidth: 1,
  },
});

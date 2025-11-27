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
    flex: 1,
    marginRight: 8,
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  radioWrapper: {
    marginLeft: 8,
  },
  addCustomAction: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  addCustomText: {
    color: colors.primary_medium,
    fontSize: 14,
  },
  editIconButton: {
    padding: 6,
    marginLeft: 4,
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
  customEmptyWrapper: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: colors.neutral_medium,
  },
  customEmptyText: {
    color: colors.neutral_light,
    marginBottom: 12,
  },
  customEmptyButton: {
    alignSelf: 'flex-start',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.primary_darkest,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    color: colors.neutral_light,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
  },
  modalButton: {
    width: 100,
    height: 40,
    marginLeft: 6,
  },
  modalError: {
    marginTop: 6,
    color: colors.error,
  },
  modalButtonText: {
    fontSize: 14,
  },
});

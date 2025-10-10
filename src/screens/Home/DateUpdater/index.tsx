import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DATE_UPDATER } from '~constants/modalTypes';
import { useAppDispatch, useAppSelector } from '~hooks';
import { hideModal, updateUserBookAddedDate } from '~redux/actions/booksActions';
import { getActiveModal, getBookToUpdate } from '~redux/selectors/books';

const DateUpdater = () => {
  const { t } = useTranslation(['books', 'categories']);
  const dispatch = useAppDispatch();

  const _hideDateUpdater = () => dispatch(hideModal());
  const _updateUserBookAddedDate = (added: number) => dispatch(updateUserBookAddedDate(added));

  const isVisible = useAppSelector(getActiveModal) === DATE_UPDATER;
  const added = useAppSelector(getBookToUpdate)?.added;

  const [selectedDate, setSelectedDate] = useState(added ? new Date(added) : new Date());

  const handleConfirm = () => {
    const date = selectedDate.getTime();
    _updateUserBookAddedDate(date);
    _hideDateUpdater();
  };

  const handleDateChange = (_event: any, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType='fade' onRequestClose={_hideDateUpdater}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{t('common:selectDate')}</Text>
          <DateTimePicker value={selectedDate} mode='date' display='spinner' onChange={handleDateChange} textColor='#FFFFFF' />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={_hideDateUpdater}>
              <Text style={styles.buttonText}>{t('common:cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleConfirm}>
              <Text style={[styles.buttonText, styles.confirmButtonText]}>{t('common:confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confirmButtonText: {
    color: '#FFFFFF',
  },
});

export default DateUpdater;

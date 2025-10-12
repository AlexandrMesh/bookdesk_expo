import React, { useEffect, useState } from 'react';

import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';

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
  const [showPicker, setShowPicker] = useState(false);

  // Обновляем дату когда открывается модалка
  useEffect(() => {
    if (isVisible) {
      setSelectedDate(added ? new Date(added) : new Date());
      setShowPicker(true);
    } else {
      setShowPicker(false);
    }
  }, [isVisible, added]);

  const handleConfirm = () => {
    const date = selectedDate.getTime();
    _updateUserBookAddedDate(date);
    _hideDateUpdater();
  };

  const handleDateChange = (_event: any, date?: Date) => {
    // На Android DateTimePicker автоматически закрывается после выбора
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (date) {
        setSelectedDate(date);
        // На Android сразу обновляем дату
        const timestamp = date.getTime();
        _updateUserBookAddedDate(timestamp);
        _hideDateUpdater();
      } else {
        // Пользователь нажал отмену
        _hideDateUpdater();
      }
    } else {
      // На iOS просто обновляем выбранную дату
      if (date) {
        setSelectedDate(date);
      }
    }
  };

  // На Android показываем нативный picker, на iOS - в модалке
  if (Platform.OS === 'android') {
    return showPicker && isVisible ? (
      <DateTimePicker value={selectedDate} mode='date' display='default' onChange={handleDateChange} />
    ) : null;
  }

  // iOS версия с кастомной модалкой
  return (
    <Modal visible={isVisible} transparent={true} animationType='fade' onRequestClose={_hideDateUpdater}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{t('common:selectDate')}</Text>
          {showPicker && <DateTimePicker value={selectedDate} mode='date' display='spinner' onChange={handleDateChange} themeVariant='dark' />}
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

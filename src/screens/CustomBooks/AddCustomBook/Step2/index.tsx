/* eslint-disable import/order */
import React, { useEffect, useState } from 'react';

import { ImageStyle, Pressable, ScrollView, Text, View, ViewStyle } from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { useBackHandler } from '@react-native-community/hooks';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { DEFAULT_COVER } from '~constants/customBooks';
import { PENDING, SUCCEEDED } from '~constants/loadingStatuses';
import { SECONDARY } from '~constants/themes';
import { useAppDispatch, useAppSelector } from '~hooks';
import useGetImgUrl from '~hooks/useGetImgUrl';
import useNetworkStatus from '~hooks/useNetworkStatus';
import { loadSuggestedCovers, selectCover, setAvailableStep, setCurrentStep, setShouldAddCover } from '~redux/actions/customBookActions';
import {
  deriveIsValidStep2,
  getNewCustomBookName,
  getSelectedCover,
  getShouldAddCover,
  getSuggestedCoversData,
  getSuggestedCoversLoadingDataStatus,
} from '~redux/selectors/customBook';
import Button from '~UI/Button';
import RadioButton from '~UI/RadioButton';
import { Spinner } from '~UI/Spinner';

import styles from './styles';

const Step2 = () => {
  const { t } = useTranslation(['customBook, common']);

  const dispatch = useAppDispatch();
  const onPressBack = () => dispatch(setCurrentStep(1));
  const onPressNext = () => {
    dispatch(setCurrentStep(3));
    dispatch(setAvailableStep(3));
  };

  const shouldAddCover = useAppSelector(getShouldAddCover);
  const allowsNextActionInTheStep2 = useAppSelector(deriveIsValidStep2);
  const bookName = useAppSelector(getNewCustomBookName);
  const loadingDataStatus = useAppSelector(getSuggestedCoversLoadingDataStatus);
  const suggestedCoversData = useAppSelector(getSuggestedCoversData);
  const selectedCover = useAppSelector(getSelectedCover);

  const imgUrl = useGetImgUrl();
  const isOnline = useNetworkStatus();
  const [isPickingFromDevice, setIsPickingFromDevice] = useState(false);

  const handlePressOnWithoutCover = () => {
    dispatch(setShouldAddCover(false));
  };

  const handlePressOnWithCover = () => dispatch(setShouldAddCover(true));
  const handleFindCover = () => {
    dispatch(setShouldAddCover(true));
    // Очистим выбранную обложку с устройства, чтобы запустить загрузку предложенных обложек
    dispatch(selectCover(''));
  };

  const pickImageFromDevice = async () => {
    try {
      setIsPickingFromDevice(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        dispatch(setShouldAddCover(true));
        dispatch(selectCover(uri));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPickingFromDevice(false);
    }
  };

  const suggestedCoversExist = suggestedCoversData.length > 0;
  // Проверяем, является ли выбранная обложка одной из предложенных из интернета
  const isSelectedInSuggestedList = !!selectedCover && suggestedCoversData.some((item) => item.coverPath === selectedCover);
  // Проверяем, является ли выбранная обложка с устройства (не из предложенных)
  const isSelectedFromDevice = !!selectedCover && !isSelectedInSuggestedList;

  useBackHandler(() => {
    onPressBack();
    return true;
  });

  const isFindCoverDisabled = !isOnline || !!(shouldAddCover && !isSelectedFromDevice);

  useEffect(() => {
    // Загружаем только если у нас включен поиск, ещё ничего не выбрано и нет загруженных обложек
    if (bookName.value && shouldAddCover && !suggestedCoversExist && !selectedCover && isOnline) {
      dispatch(loadSuggestedCovers());
    }
  }, [dispatch, bookName.value, shouldAddCover, suggestedCoversExist, selectedCover, isOnline]);

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        {shouldAddCover === undefined && <Text style={styles.suggestionLabel}>{t('customBook:chooseTheOptionForBookCover')}</Text>}

        <View style={styles.buttonsWrapper}>
          <Button
            disabled={shouldAddCover === false}
            theme={SECONDARY}
            style={styles.button as ViewStyle}
            titleStyle={styles.buttonTitle}
            onPress={handlePressOnWithoutCover}
            title={t('customBook:withoutCover')}
          />
          <Button
            disabled={isFindCoverDisabled}
            style={styles.button}
            titleStyle={styles.buttonTitle}
            onPress={handleFindCover}
            title={t('customBook:findCover')}
          />
          <Button style={styles.button} titleStyle={styles.buttonTitle} onPress={pickImageFromDevice} title={t('common:choose')} />
        </View>

        <ScrollView style={styles.contentWrapper} keyboardShouldPersistTaps='handled'>
          {shouldAddCover === false && !isPickingFromDevice && (
            <View style={styles.defaultCoverWrapper}>
              <Text style={styles.suggestionLabel}>{t('customBook:theExampleOfTheBookCover')}</Text>
              <View>
                <View style={[styles.defaultCover, styles.selectedCover]}>
                  <RadioButton style={styles.selectedCoverRadioButton as ViewStyle} isSelected />
                  {imgUrl && (
                    <Image
                      style={styles.cover as ImageStyle}
                      source={{
                        uri: `${imgUrl}/${DEFAULT_COVER}.webp`,
                      }}
                    />
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Спиннер в контентной области: для поиска из интернета или выбора с устройства */}
          {(isPickingFromDevice || (shouldAddCover && !isSelectedFromDevice && loadingDataStatus === PENDING)) && (
            <View style={styles.contentSpinnerWrapper}>
              <Spinner />
            </View>
          )}

          {/* Показываем только свою обложку, если она выбрана с устройства */}
          {shouldAddCover && !isPickingFromDevice && isSelectedFromDevice && (
            <View style={styles.deviceCoverWrapper}>
              <View style={[styles.coverWrapper, styles.selectedCover]}>
                <RadioButton style={styles.selectedCoverRadioButton as ViewStyle} isSelected={true} />
                <Image
                  style={styles.cover as ImageStyle}
                  source={{
                    uri: selectedCover,
                  }}
                />
              </View>
            </View>
          )}

          {/* Показываем предложенные обложки только если нет выбранной обложки с устройства */}
          {shouldAddCover && !isSelectedFromDevice && !isPickingFromDevice && loadingDataStatus === SUCCEEDED && suggestedCoversData.length > 0 && (
            <View style={styles.suggestedCovers}>
              <Text style={styles.suggestionLabel}>{t('customBook:chooseTheBookCover')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.coversScrollContent}>
                {suggestedCoversData.map((item) => {
                  const selected = selectedCover === item.coverPath;
                  return (
                    <Pressable
                      key={item.coverPath}
                      style={[styles.coverWrapper, selected && styles.selectedCover]}
                      onPress={() => dispatch(selectCover(item.coverPath))}
                    >
                      <RadioButton style={styles.selectedCoverRadioButton as ViewStyle} isSelected={selected} />
                      <Image
                        style={styles.cover as ImageStyle}
                        source={{
                          uri: item.coverPath,
                        }}
                      />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </View>

      <View style={styles.footerButtonsWrapper}>
        <Button theme={SECONDARY} style={styles.footerButton} onPress={onPressBack} title={t('common:back')} />
        <Button disabled={!allowsNextActionInTheStep2} style={styles.footerButton} onPress={onPressNext} title={t('common:next')} />
      </View>
    </View>
  );
};

export default Step2;

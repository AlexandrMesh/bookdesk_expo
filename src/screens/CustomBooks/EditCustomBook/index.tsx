import React, { useState, useEffect, useMemo, useRef } from 'react';

import { ScrollView, View, ToastAndroid, Pressable, Text, ImageStyle, ViewStyle, Modal } from 'react-native';

import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import uniqueId from 'lodash/uniqueId';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppDispatch } from '~hooks';

import CloseIcon from '~assets/close.svg';
import { DEFAULT_COVER } from '~constants/customBooks';
import { CLOSE_ICON } from '~constants/dimensions';
import { SECONDARY } from '~constants/themes';
import useDisplayAlert from '~hooks/useDisplayAlert';
import useGetImgUrl from '~hooks/useGetImgUrl';
import useNetworkStatus from '~hooks/useNetworkStatus';
import { deleteCustomBook, updateUserCustomBook } from '~redux/actions/customBookActions';
import colors from '~styles/colors';
import { BookStatus } from '~types/books';
import Button from '~UI/Button';
import RadioButton from '~UI/RadioButton';
import { Spinner } from '~UI/Spinner';
import Input from '~UI/TextInput';
import { loadSuggestedCovers } from '~utils/coversLoader';
import { getValidationFailure, validationTypes } from '~utils/validation';

import styles from './styles';

type ParamList = {
  EditCustomBook: {
    bookId: string;
    title: string;
    pages: string;
    authorsList: string[];
    annotation: string;
    bookStatus: BookStatus;
    coverPath?: string;
  };
};

const showToast = (message: string) => {
  ToastAndroid.show(message, ToastAndroid.SHORT);
};

const EditCustomBook = () => {
  const { t } = useTranslation(['customBook, common, books, categories, errors']);

  const { params } = useRoute<RouteProp<ParamList, 'EditCustomBook'>>();

  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const imgUrl = useGetImgUrl();
  const isOnline = useNetworkStatus();
  const insets = useSafeAreaInsets();

  const [_title, setTitle] = useState<string | null>(params.title);
  const [titleError, setTitleError] = useState<string | null>(null);
  const initialPagesValue = params.pages ? params.pages.toString() : '';
  const [_pages, setPages] = useState<string | null>(initialPagesValue);
  const [authors, setAuthors] = useState(
    params.authorsList && params.authorsList.length > 0
      ? params.authorsList.map((item: string) => ({ id: uniqueId(), name: item, error: null }))
      : [],
  );
  const [pagesError, setPagesError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cover state
  const initialCoverPath = params.coverPath || DEFAULT_COVER;
  const [shouldAddCover, setShouldAddCover] = useState<boolean | undefined>(initialCoverPath === DEFAULT_COVER ? false : true);
  const [selectedCover, setSelectedCover] = useState<string>(initialCoverPath === DEFAULT_COVER ? '' : initialCoverPath);

  useEffect(() => {
  }, []);
  const [isPickingFromDevice, setIsPickingFromDevice] = useState(false);
  const [suggestedCoversData, setSuggestedCoversData] = useState<Array<{ coverPath: string }>>([]);
  const [loadingDataStatus, setLoadingDataStatus] = useState<'idle' | 'pending' | 'succeeded' | 'failed'>('idle');
  const [isCoverModalVisible, setIsCoverModalVisible] = useState(false);
  const backupSelectedCoverRef = useRef<string>('');
  const backupShouldAddCoverRef = useRef<boolean | undefined>(undefined);
  // Draft state for modal (apply on Save only)
  const [draftShouldAddCover, setDraftShouldAddCover] = useState<boolean | undefined>(undefined);
  const [draftSelectedCover, setDraftSelectedCover] = useState<string>('');
  const [draftIsPickingFromDevice, setDraftIsPickingFromDevice] = useState(false);
  const [draftSuggestedCoversData, setDraftSuggestedCoversData] = useState<Array<{ coverPath: string }>>([]);
  const [draftLoadingDataStatus, setDraftLoadingDataStatus] = useState<'idle' | 'pending' | 'succeeded' | 'failed'>('idle');

  // Computed values for draft state (used in modal)
  const draftSuggestedCoversExist = draftSuggestedCoversData.length > 0;
  const draftIsSelectedInSuggestedList = !!draftSelectedCover && draftSuggestedCoversData.some((item) => item.coverPath === draftSelectedCover);
  const draftIsCurrentCover = draftSelectedCover === initialCoverPath && initialCoverPath !== DEFAULT_COVER;
  const draftIsSelectedFromDevice =
    !!draftSelectedCover &&
    !draftIsSelectedInSuggestedList &&
    !draftIsCurrentCover &&
    (draftSelectedCover.startsWith('file:') || draftSelectedCover.startsWith('content:') || draftSelectedCover.startsWith('data:'));
  const isDraftFindCoverDisabled = !isOnline || !!(draftShouldAddCover && !draftIsSelectedFromDevice && !draftIsCurrentCover);

  const suggestedCoversExist = suggestedCoversData.length > 0;
  const isSelectedInSuggestedList = !!selectedCover && suggestedCoversData.some((item) => item.coverPath === selectedCover);
  const isCurrentCover = selectedCover === initialCoverPath && initialCoverPath !== DEFAULT_COVER;
  const isSelectedFromDevice =
    !!selectedCover &&
    !isSelectedInSuggestedList &&
    !isCurrentCover &&
    (selectedCover.startsWith('file:') || selectedCover.startsWith('content:') || selectedCover.startsWith('data:'));

  // Валидация: только название обязательно, страницы и авторы необязательны
  const isValidForm = !titleError && _title && _title.trim().length > 0 && authors.every((item: any) => !item.error);

  const handleAddAuthor = () => {
    setAuthors([...authors, { id: uniqueId(), name: '', error: null }]);
  };

  const updateAuthor = (id: string, name: string | null, error: string | null) =>
    setAuthors(authors.map((item: any) => (item.id === id ? { ...item, name, error } : item)));

  const removeAuthor = (id: string) => setAuthors(authors.filter((item: any) => item.id !== id));

  const handleAuthorChange = (value: string, id: string) => {
    // Авторы не обязательны, валидация мягкая (только буквы)
    const params = {
      minLength: 0,
      maxLength: 64,
    };
    const error = value ? getValidationFailure(value, [validationTypes.mustContainOnlyLetters, validationTypes.isTooLong], params) : null;
    updateAuthor(id, value, error ? t(`errors:${error}`, params) : null);
  };

  const handleChangeTitle = (value: string) => {
    const params = { minLength: 3, maxLength: 64 };
    const error = getValidationFailure(
      value,
      [validationTypes.containsSpecialCharacters, validationTypes.isTooShort, validationTypes.isTooLong],
      params,
    );
    if (error) {
      setTitleError(t(`errors:${error}`, params));
    } else {
      setTitle(value);
      setTitleError(null);
    }
  };

  const handleChangePages = (value: string) => {
    // Страницы не обязательны, допускаем пустое значение
    const params = {
      minLength: 0,
      maxLength: 5,
    };
    const error = value ? getValidationFailure(value, [validationTypes.mustContainOnlyNumbers, validationTypes.isTooLong], params) : null;
    if (error) {
      setPagesError(t(`errors:${error}`, params));
    } else {
      setPages(value);
      setPagesError(null);
    }
  };

  // Cover handlers (for modal - use draft states)
  const handlePressOnWithoutCover = () => {
    setDraftShouldAddCover(false);
    setDraftSelectedCover(DEFAULT_COVER);
  };

  const handleFindCover = () => {
    setDraftShouldAddCover(true);
    setDraftSelectedCover('');
    setDraftSuggestedCoversData([]);
    setDraftLoadingDataStatus('idle');
  };

  const handleSelectCurrentCover = () => {
    setDraftShouldAddCover(true);
    setDraftSelectedCover(initialCoverPath);
  };

  const pickImageFromDevice = async () => {
    try {
      setDraftIsPickingFromDevice(true);
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
        setDraftShouldAddCover(true);
        setDraftSelectedCover(uri);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDraftIsPickingFromDevice(false);
    }
  };

  // Load suggested covers (modal drafts)
  useEffect(() => {
    if (_title && draftShouldAddCover && !draftSuggestedCoversExist && !draftSelectedCover && isOnline) {
      setDraftLoadingDataStatus('pending');
      const loadCovers = async () => {
        try {
          const items = await loadSuggestedCovers(_title);
          setDraftSuggestedCoversData(items);
          setDraftLoadingDataStatus('succeeded');
        } catch (error) {
          console.error('Error loading suggested covers:', error);
          setDraftLoadingDataStatus('failed');
        }
      };
      loadCovers();
    }
  }, [_title, draftShouldAddCover, draftSuggestedCoversExist, draftSelectedCover, isOnline]);

  // Reset all state when switching to another book
  useEffect(() => {
    setTitle(params.title);
    setPages(params.pages ? params.pages.toString() : '');
    setAuthors(params.authorsList.map((item: string) => ({ id: uniqueId(), name: item, error: null })));
    const init = params.coverPath || DEFAULT_COVER;
    setShouldAddCover(init === DEFAULT_COVER ? false : true);
    setSelectedCover(init === DEFAULT_COVER ? '' : init);
    setSuggestedCoversData([]);
    setLoadingDataStatus('idle');
  }, [params.bookId]);

  const handleEditBook = async () => {
    setIsSaving(true);
    try {
      const coverPath = shouldAddCover === false ? DEFAULT_COVER : selectedCover || params.coverPath || DEFAULT_COVER;
      await dispatch(
        updateUserCustomBook({
          bookId: params.bookId,
          title: _title as string,
          pages: _pages || '',
          authorsList: authors.map((item) => item.name).filter(Boolean),
          annotation: '',
          bookStatus: params.bookStatus,
          coverPath,
        }),
      );
      navigation.goBack();
      showToast(t('customBook:bookSuccessfullyUpdated'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBook = async () => {
    try {
      setIsDeleting(true);
      await dispatch(deleteCustomBook(params.bookId));
      navigation.goBack();
      showToast(t('customBook:bookSuccessfullyDeleted', { defaultValue: 'Книга успешно удалена' }));
    } catch (error) {
      console.error('Error deleting book:', error);
      showToast(t('customBook:bookDeletionError', { defaultValue: 'Ошибка при удалении книги' }));
    } finally {
      setIsDeleting(false);
    }
  };

  const displayDeleteConfirmation = useDisplayAlert(handleDeleteBook);

  const getImageUri = (cover: string) => {
    if (!cover || cover === DEFAULT_COVER) {
      // Для дефолтной обложки всегда возвращаем URI, даже если imgUrl еще не готов
      const uri = imgUrl ? `${imgUrl}/${DEFAULT_COVER}.webp` : '';
      return uri;
    }
    const lower = String(cover);
    const isAbsolute = /^https?:\/\//i.test(lower) || lower.startsWith('file:') || lower.startsWith('content:') || lower.startsWith('data:');
    if (isAbsolute) {
      return cover;
    }
    const uri = imgUrl ? `${imgUrl}/${cover}.webp` : '';
    return uri;
  };

  const currentCoverThumb = useMemo(() => {
    const cover = selectedCover || initialCoverPath;
    const uri = getImageUri(cover);
    return uri;
  }, [selectedCover, initialCoverPath, imgUrl]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <ScrollView style={styles.inputWrapper} keyboardShouldPersistTaps='handled'>
          <View>
            <Text style={styles.subTitle}>
              {t('customBook:bookTitle')}
              {t('common:required')}
            </Text>
            <Input
              placeholder={t('customBook:enterBookTitle')}
              disabled={isSaving}
              onChangeText={handleChangeTitle}
              value={_title as string}
              error={titleError}
              shouldDisplayClearButton={!!_title}
              onClear={() => setTitle(null)}
            />
          </View>

          {/* Cover block with thumbnail and Change button */}
          <View style={styles.block}>
            <Text style={styles.subTitle}>{t('customBook:bookCover')}</Text>
            <View style={styles.editThumbWrapper}>
              <View style={styles.editThumbCover}>
                {currentCoverThumb ? (
                  <Image
                    style={styles.cover as ImageStyle}
                    source={{
                      uri: currentCoverThumb,
                    }}
                    onError={(e) => {
                    }}
                    onLoad={() => {
                    }}
                  />
                ) : (
                  <View style={styles.coverPlaceholder} />
                )}
              </View>
              <Button
                style={styles.editChangeButton}
                titleStyle={styles.buttonTitle}
                title={t('common:edit')}
                onPress={() => setIsCoverModalVisible(true)}
              />
            </View>
          </View>

          {/* Cover selection modal (reuses step 2 logic) */}
          <Modal
            visible={isCoverModalVisible}
            transparent
            animationType='slide'
            onShow={() => {
              // Backup current state
              backupSelectedCoverRef.current = selectedCover;
              backupShouldAddCoverRef.current = shouldAddCover;
              // Initialize draft state from current state
              if (initialCoverPath === DEFAULT_COVER || shouldAddCover === false) {
                // У книги нет обложки — сразу выставляем режим "Без обложки"
                setDraftShouldAddCover(false);
                setDraftSelectedCover(DEFAULT_COVER);
              } else {
                setDraftShouldAddCover(shouldAddCover);
                setDraftSelectedCover(selectedCover);
              }
              setDraftIsPickingFromDevice(false);
              setDraftSuggestedCoversData([]);
              setDraftLoadingDataStatus('idle');
            }}
            onRequestClose={() => {
              // discard changes
              setSelectedCover(backupSelectedCoverRef.current);
              setShouldAddCover(backupShouldAddCoverRef.current);
              setIsCoverModalVisible(false);
            }}
          >
            <View style={styles.wrapper}>
              <View style={styles.container}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>{t('customBook:bookCover')}</Text>
                  <Pressable
                    onPress={() => {
                      // discard changes
                      setSelectedCover(backupSelectedCoverRef.current);
                      setShouldAddCover(backupShouldAddCoverRef.current);
                      setIsCoverModalVisible(false);
                    }}
                  >
                    <CloseIcon width={CLOSE_ICON.width} height={CLOSE_ICON.height} fill={colors.neutral_light} />
                  </Pressable>
                </View>
                <ScrollView style={styles.inputWrapper} keyboardShouldPersistTaps='handled'>
                  {draftShouldAddCover === undefined && <Text style={styles.suggestionLabel}>{t('customBook:chooseTheOptionForBookCover')}</Text>}

                  <View style={styles.buttonsWrapper}>
                    {initialCoverPath !== DEFAULT_COVER && (
                      <Button
                        disabled={draftIsCurrentCover}
                        theme={SECONDARY}
                        style={styles.button as ViewStyle}
                        titleStyle={styles.buttonTitle}
                        onPress={handleSelectCurrentCover}
                        title={t('customBook:currentCover')}
                      />
                    )}
                    <Button
                      disabled={draftShouldAddCover === false}
                      theme={SECONDARY}
                      style={styles.button as ViewStyle}
                      titleStyle={styles.buttonTitle}
                      onPress={handlePressOnWithoutCover}
                      title={t('customBook:withoutCover')}
                    />
                    <Button
                      disabled={isDraftFindCoverDisabled}
                      style={styles.button}
                      titleStyle={styles.buttonTitle}
                      onPress={handleFindCover}
                      title={t('customBook:findCover')}
                    />
                    <Button style={styles.button} titleStyle={styles.buttonTitle} onPress={pickImageFromDevice} title={t('common:choose')} />
                  </View>

                  <ScrollView style={styles.contentWrapper} keyboardShouldPersistTaps='handled'>
                    {draftShouldAddCover === false && !draftIsPickingFromDevice && (
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

                    {(draftIsPickingFromDevice ||
                      (draftShouldAddCover && !draftIsSelectedFromDevice && !draftIsCurrentCover && draftLoadingDataStatus === 'pending')) && (
                      <View style={styles.contentSpinnerWrapper}>
                        <Spinner />
                      </View>
                    )}

                    {draftShouldAddCover && !draftIsPickingFromDevice && draftIsSelectedFromDevice && (
                      <View style={styles.deviceCoverWrapper}>
                        <View style={[styles.coverWrapper, styles.selectedCover]}>
                          <RadioButton style={styles.selectedCoverRadioButton as ViewStyle} isSelected={true} />
                          <Image
                            style={styles.cover as ImageStyle}
                            source={{
                              uri: draftSelectedCover,
                            }}
                          />
                        </View>
                      </View>
                    )}

                    {draftShouldAddCover === true && !draftIsPickingFromDevice && draftIsCurrentCover && (
                      <View style={styles.deviceCoverWrapper}>
                        <Text style={styles.suggestionLabel}>{t('customBook:currentCover')}</Text>
                        <View style={[styles.coverWrapper, styles.selectedCover]}>
                          <RadioButton style={styles.selectedCoverRadioButton as ViewStyle} isSelected={true} />
                          <Image
                            style={styles.cover as ImageStyle}
                            source={{
                              uri: getImageUri(draftSelectedCover),
                            }}
                          />
                        </View>
                      </View>
                    )}

                    {draftShouldAddCover &&
                      !draftIsSelectedFromDevice &&
                      !draftIsCurrentCover &&
                      !draftIsPickingFromDevice &&
                      draftLoadingDataStatus === 'succeeded' &&
                      draftSuggestedCoversData.length > 0 && (
                        <View style={styles.suggestedCovers}>
                          <Text style={styles.suggestionLabel}>{t('customBook:chooseTheBookCover')}</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.coversScrollContent}>
                            {draftSuggestedCoversData.map((item) => {
                              const selected = draftSelectedCover === item.coverPath;
                              return (
                                <Pressable
                                  key={item.coverPath}
                                  style={[styles.coverWrapper, selected && styles.selectedCover]}
                                  onPress={() => setDraftSelectedCover(item.coverPath)}
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
                </ScrollView>
                <View style={styles.footerButtonsWrapper}>
                  <Button
                    theme={SECONDARY}
                    style={styles.footerButton}
                    onPress={() => {
                      // discard changes
                      setSelectedCover(backupSelectedCoverRef.current);
                      setShouldAddCover(backupShouldAddCoverRef.current);
                      setIsCoverModalVisible(false);
                    }}
                    title={t('common:back')}
                  />
                  <Button
                    style={styles.footerButton}
                    onPress={() => {
                      // apply draft changes to main state
                      setSelectedCover(draftSelectedCover);
                      setShouldAddCover(draftShouldAddCover);
                      setIsCoverModalVisible(false);
                    }}
                    title={t('common:save')}
                  />
                </View>
              </View>
            </View>
          </Modal>

          <View>
            <Text style={styles.subTitle}>{t('customBook:pages')}</Text>
            <Input
              placeholder={t('customBook:enterPagesCount')}
              disabled={isSaving}
              onChangeText={handleChangePages}
              value={_pages as string}
              error={pagesError}
              shouldDisplayClearButton={!!_pages}
              onClear={() => setPages(null)}
              inputMode='numeric'
            />
          </View>

          <View style={styles.block}>
            <Text style={styles.subTitle}>{t('customBook:authorsList')}</Text>
            {authors.map(({ id, name, error }) => (
              <View style={styles.authorWrapper} key={id}>
                <Input
                  wrapperClassName={styles.authorsNameInputWrapper}
                  disabled={isSaving}
                  placeholder={t('customBook:enterAuthorsName')}
                  onChangeText={(value) => handleAuthorChange(value, id)}
                  value={name as string}
                  error={error}
                  shouldDisplayClearButton={!!name}
                  onClear={() => updateAuthor(id, '', null)}
                />
                <Pressable style={styles.removeAuthorButton} onPress={() => removeAuthor(id)}>
                  <CloseIcon width={CLOSE_ICON.width} height={CLOSE_ICON.height} fill={colors.neutral_light} />
                </Pressable>
              </View>
            ))}

            <Button
              disabled={authors.length > 2 || isSaving}
              style={[styles.button, styles.addAuthorButton]}
              titleStyle={styles.footerButtonTitle}
              onPress={handleAddAuthor}
              title={t(authors.length > 0 ? 'customBook:addAnotherAuthor' : 'customBook:addAuthor')}
            />
          </View>
        </ScrollView>

        <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={styles.footerButtonsWrapper}>
            <Button
              disabled={isSaving || isDeleting}
              theme={SECONDARY}
              style={styles.footerButton}
              titleStyle={styles.footerButtonTitle}
              onPress={() => navigation.goBack()}
              title={t('common:back')}
            />
            <Button
              disabled={isSaving || isDeleting}
              theme={SECONDARY}
              style={[styles.footerButton, styles.deleteButton]}
              titleStyle={styles.footerButtonTitle}
              onPress={displayDeleteConfirmation}
              title={t('common:delete', { defaultValue: 'Удалить' })}
            />
            <Button
              style={styles.footerButton}
              titleStyle={styles.footerButtonTitle}
              disabled={!isValidForm || isSaving || isDeleting}
              onPress={handleEditBook}
              title={t('common:save')}
            />
          </View>
        </View>
      </View>
      {isSaving && <Spinner backgroundColor='rgba(0, 0, 0, 0.5)' />}
    </View>
  );
};

export default EditCustomBook;

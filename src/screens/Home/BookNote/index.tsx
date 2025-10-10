import React, { FC, useState, useCallback } from 'react';

import { TouchableHighlight, ScrollView, View, Text } from 'react-native';

import { useRoute, RouteProp } from '@react-navigation/native';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';

import EditIcon from '~assets/edit.svg';
import RemoveIcon from '~assets/remove.svg';
import { MAX_COUNT_CHARACTERS_FOR_COMMENT, MIN_COUNT_CHARACTERS_FOR_COMMENT } from '~constants/bookList';
import { SECONDARY } from '~constants/themes';
import { useAppDispatch, useAppSelector } from '~hooks';
import useDisplayAlert from '~hooks/useDisplayAlert';
import { deleteUserComment, updateUserComment } from '~redux/actions/booksActions';
import { deriveBookNote } from '~redux/selectors/books';
import colors from '~styles/colors';
import Button from '~UI/Button';
import { Spinner } from '~UI/Spinner';
import Input from '~UI/TextInput';
import { getValidationFailure, validationTypes } from '~utils/validation';

import styles from './styles';

type ParamList = {
  BookNote: {
    bookTitle: string;
    bookId: string;
    shouldOpenEditableMode: boolean;
  };
};

const BookNote: FC = () => {
  const { t, i18n } = useTranslation(['common', 'books']);
  const { language } = i18n;
  const { params } = useRoute<RouteProp<ParamList, 'BookNote'>>();

  const bookNote = useAppSelector(deriveBookNote(params?.bookId));
  const bookNoteContent = bookNote?.comment || '';
  const bookNoteAdded = new Date(bookNote?.added as number).toLocaleDateString(language);

  const [editableMode, setEditableMode] = useState(params?.shouldOpenEditableMode);
  const [editedComment, setEditedComment] = useState(bookNoteContent);
  const [editedCommentError, setEditedCommentError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const dispatch = useAppDispatch();

  const deleteComment = async () => {
    try {
      setIsEditing(true);
      await dispatch(deleteUserComment(params?.bookId));
    } finally {
      setIsEditing(false);
    }
  };

  const displayConfirmationAlert = useDisplayAlert(deleteComment);

  const turnOffEditableMode = () => setEditableMode(false);
  const toggleEditableMode = () => {
    setEditedCommentError('');
    setEditedComment(bookNoteContent);
    setEditableMode(!editableMode);
  };

  const validateComment = useCallback(() => {
    const params = {
      minLength: MIN_COUNT_CHARACTERS_FOR_COMMENT,
      maxLength: MAX_COUNT_CHARACTERS_FOR_COMMENT,
    };
    const error = getValidationFailure(
      editedComment.trim(),
      [validationTypes.containsSpecialCharacters, validationTypes.isTooShort, validationTypes.isTooLong],
      params,
    );
    setEditedCommentError(error ? t(`errors:${error}`, params) : '');
    return !error;
  }, [editedComment, t]);

  const handleSaveComment = useCallback(async () => {
    const isCommentValid = validateComment();

    if (isCommentValid) {
      try {
        setIsEditing(true);
        const commentAdded = new Date().getTime();
        await dispatch(updateUserComment({ bookId: params?.bookId, comment: editedComment.trim(), added: commentAdded })).unwrap();
        turnOffEditableMode();
      } catch (error) {
        console.error(error);
      } finally {
        setIsEditing(false);
      }
    }
  }, [dispatch, editedComment, params?.bookId, validateComment]);

  const handleClearComment = useCallback(() => {
    setEditedComment('');
    setEditedCommentError('');
  }, []);

  const handleChangeComment = useCallback((value: string) => {
    setEditedCommentError('');
    setEditedComment(value);
  }, []);

  const renderBookTitle = () => (
    <View style={styles.book}>
      <Text style={[styles.info, styles.title, styles.lightColor]}>{params?.bookTitle}</Text>
    </View>
  );

  const renderCommentForm = () => (
    <View>
      <View style={styles.symbolsWrapper}>
        <Text style={styles.subTitle}>
          {t('common:charactersCount', { count: editedComment.trim().length, maxCount: MAX_COUNT_CHARACTERS_FOR_COMMENT })}
        </Text>
      </View>
      <Input
        placeholder={t('books:enterNote')}
        autoFocus
        wrapperClassName={styles.commentWrapperClassName}
        className={styles.commentInput}
        onChangeText={handleChangeComment}
        value={editedComment}
        error={editedCommentError}
        shouldDisplayClearButton={!!editedComment && !isEditing}
        disabled={isEditing}
        onClear={handleClearComment}
        multiline
        numberOfLines={5}
      />
      <View style={styles.editActions}>
        <Button
          style={styles.primaryButton}
          onPress={handleSaveComment}
          disabled={isEditing}
          icon={isEditing ? <Spinner size='small' /> : undefined}
          title={t('common:save')}
        />
        <Button theme={SECONDARY} style={styles.cancelButton} disabled={isEditing} onPress={toggleEditableMode} title={t('common:cancel')} />
      </View>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <ScrollView keyboardShouldPersistTaps='handled'>
        {isEmpty(bookNote) ? (
          <>
            {renderBookTitle()}
            {editableMode ? (
              renderCommentForm()
            ) : (
              <View style={[styles.info, styles.noNoteWrapper]}>
                <Text style={[styles.title, styles.lightColor, styles.noNoteLabel]}>{t('books:noBookNote')}</Text>
                <Button style={styles.primaryButton} onPress={toggleEditableMode} title={t('common:add')} />
              </View>
            )}
          </>
        ) : (
          <>
            {renderBookTitle()}
            <View style={styles.added}>
              <View>
                <Text style={[styles.lightColor, styles.content]}>{bookNoteAdded}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableHighlight disabled={isEditing} style={styles.editIcon} onPress={toggleEditableMode}>
                  <EditIcon width={26} height={26} stroke={colors.neutral_medium} />
                </TouchableHighlight>
                <TouchableHighlight disabled={isEditing} onPress={displayConfirmationAlert}>
                  <RemoveIcon fill={colors.neutral_medium} width={26} height={26} />
                </TouchableHighlight>
              </View>
            </View>
            <View>
              {editableMode ? renderCommentForm() : <Text style={[styles.info, styles.lightColor, styles.content]}>{bookNoteContent}</Text>}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default BookNote;

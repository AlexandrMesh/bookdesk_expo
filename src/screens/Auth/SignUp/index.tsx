import React, { useState } from 'react';

import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import isEmpty from 'lodash/isEmpty';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '~hooks';

import { PENDING } from '~constants/loadingStatuses';
import { SIGN_IN_ROUTE } from '~constants/routes';
import { SECONDARY } from '~constants/themes';
import { setSignUpError, signUp } from '~redux/actions/authActions';
import { getSignUpErrors, getSignUpLoadingDataStatus } from '~redux/selectors/auth';
import Logo from '~screens/Auth/Logo';
import Button from '~UI/Button';
import { Spinner } from '~UI/Spinner';
import Input from '~UI/TextInput';
import { getValidationFailure, validationTypes } from '~utils/validation';

import styles from './styles';

const SignUp = () => {
  const { t } = useTranslation(['auth', 'errors']);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const _signUp = (params: { email: string; password: string }) => dispatch(signUp(params));
  const _setSignUpError = (fieldName: string, error: string | null) => dispatch(setSignUpError({ fieldName, error }));

  const navigation = useNavigation<any>();

  const loadingDataStatus = useAppSelector(getSignUpLoadingDataStatus);
  const errors = useAppSelector(getSignUpErrors);

  const pendingSignUp = loadingDataStatus === PENDING;

  const isValidForm = () => {
    const emailError = getValidationFailure(email, [validationTypes.hasNoValue, validationTypes.isNotValidEmailPattern]);
    const passwordError = getValidationFailure(password, [validationTypes.hasNoValue, validationTypes.isTooShort, validationTypes.isTooLong]);
    _setSignUpError('email', emailError ? t(`errors:${emailError}`) : null);
    _setSignUpError('password', passwordError ? t(`errors:${passwordError}`, { minLength: 6, maxLength: 64 }) : null);
    return !(emailError || passwordError);
  };

  const handleSetEmail = (email: string) => {
    if (!isEmpty(errors.email)) _setSignUpError('email', '');
    setEmail(email);
  };

  const handleSetPassword = (password: string) => {
    if (!isEmpty(errors.password)) _setSignUpError('password', '');
    setPassword(password);
  };

  const handleSubmitSignIn = () => {
    if (isValidForm()) {
      _signUp({ email, password });
    }
  };

  const handleNavigateToSignIn = () => {
    if (!pendingSignUp) {
      navigation.navigate(SIGN_IN_ROUTE);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.content}>
          <Logo />
          <View style={styles.formWrapper}>
            <Input
              wrapperClassName={styles.marginBottom}
              error={errors.email}
              placeholder={t('email')}
              onChangeText={handleSetEmail}
              value={email}
              disabled={pendingSignUp}
              inputMode='email'
            />
            <Input
              wrapperClassName={styles.marginBottom}
              error={errors.password}
              placeholder={t('password')}
              onChangeText={handleSetPassword}
              value={password}
              secureTextEntry
              disabled={pendingSignUp}
            />
            <Button
              icon={pendingSignUp ? <Spinner size='small' variant='inline' /> : undefined}
              onPress={handleSubmitSignIn}
              title={t('signUp')}
              disabled={pendingSignUp || isEmpty(email) || isEmpty(password)}
            />

            <View style={styles.existingAccountWrapper}>
              <View style={styles.existingAccountContainer}>
                <Text style={styles.neutralLight}>{t('alreadyHaveAnAccount')} </Text>
                <Button
                  theme={SECONDARY}
                  style={styles.loginButton}
                  titleStyle={styles.loginTitleStyle}
                  onPress={handleNavigateToSignIn}
                  title={t('signIn')}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;

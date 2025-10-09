import React, { useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import isEmpty from 'lodash/isEmpty';
import { useNavigation } from '@react-navigation/native';
import { getValidationFailure, validationTypes } from '~utils/validation';
import { signUp, setSignUpError } from '~redux/actions/authActions';
import { getSignUpLoadingDataStatus, getSignUpErrors } from '~redux/selectors/auth';
import { SIGN_IN_ROUTE } from '~constants/routes';
import { useAppDispatch, useAppSelector } from '~hooks';
import Button from '~UI/Button';
import Logo from '~screens/Auth/Logo';
import Input from '~UI/TextInput';
import { Spinner } from '~UI/Spinner';
import { SECONDARY } from '~constants/themes';
import { PENDING } from '~constants/loadingStatuses';
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
    !isEmpty(errors.email) && _setSignUpError('email', '');
    setEmail(email);
  };

  const handleSetPassword = (password: string) => {
    !isEmpty(errors.password) && _setSignUpError('password', '');
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
    <View style={styles.wrapper}>
      <View style={styles.content}>
        <ScrollView keyboardShouldPersistTaps='handled'>
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
              icon={pendingSignUp ? <Spinner size='small' /> : undefined}
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
        </ScrollView>
      </View>
    </View>
  );
};

export default SignUp;

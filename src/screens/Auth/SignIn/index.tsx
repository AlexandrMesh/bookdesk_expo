import React, { useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import isEmpty from 'lodash/isEmpty';
import Button from '~UI/Button';
import GoogleIcon from '~assets/google.svg';
import { getValidationFailure, validationTypes } from '~utils/validation';
import { SIGN_UP_ROUTE } from '~constants/routes';
import { SECONDARY } from '~constants/themes';
import { GOOGLE_ICON } from '~constants/dimensions';
import { useAppDispatch, useAppSelector } from '~hooks';
import { getSignInLoadingDataStatus, getSignInErrors } from '~redux/selectors/auth';
import { signIn, setSignInError } from '~redux/actions/authActions';
import Logo from '~screens/Auth/Logo';
import Input from '~UI/TextInput';
import { Spinner } from '~UI/Spinner';
import { PENDING } from '~constants/loadingStatuses';
import styles from './styles';

const SignIn = () => {
  const { t } = useTranslation(['auth', 'errors']);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigation = useNavigation<any>();

  const dispatch = useAppDispatch();
  const _signIn = (params: { email: string; password: string; isGoogleAccount?: boolean }) => dispatch(signIn(params));
  const _setSignInError = (fieldName: string, error: string | null) => dispatch(setSignInError({ fieldName, error }));

  const loadingDataStatus = useAppSelector(getSignInLoadingDataStatus);
  const errors = useAppSelector(getSignInErrors);

  const pendingSignIn = loadingDataStatus === PENDING;

  const isValidForm = () => {
    const emailError = getValidationFailure(email, [validationTypes.hasNoValue, validationTypes.isNotValidEmailPattern]);
    const passwordError = getValidationFailure(password, [validationTypes.hasNoValue, validationTypes.isTooShort, validationTypes.isTooLong]);
    _setSignInError('email', emailError ? t(`errors:${emailError}`) : null);
    _setSignInError('password', passwordError ? t(`errors:${passwordError}`, { minLength: 6, maxLength: 64 }) : null);
    return !(emailError || passwordError);
  };

  const handleSetEmail = (email: string) => {
    !isEmpty(errors.email) && _setSignInError('email', '');
    setEmail(email);
  };

  const handleSetPassword = (password: string) => {
    !isEmpty(errors.password) && _setSignInError('password', '');
    setPassword(password);
  };

  const handleSubmitSignIn = () => {
    if (isValidForm()) {
      _signIn({ email, password });
    }
  };

  const handleGoogleSignIn = () => _signIn({ email, password, isGoogleAccount: true });

  const handleNavigateToSignUp = () => {
    if (!pendingSignIn) {
      navigation.navigate(SIGN_UP_ROUTE);
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
              disabled={pendingSignIn}
              inputMode='email'
            />
            <Input
              wrapperClassName={styles.marginBottom}
              error={errors.password}
              placeholder={t('password')}
              onChangeText={handleSetPassword}
              value={password}
              secureTextEntry
              disabled={pendingSignIn}
            />
            <Button
              icon={pendingSignIn ? <Spinner size='small' /> : undefined}
              onPress={handleSubmitSignIn}
              title={t('signIn')}
              disabled={pendingSignIn || isEmpty(email) || isEmpty(password)}
            />

            <View style={styles.orWrapper}>
              <Text style={styles.neutralLight}>{t('or')}</Text>
            </View>

            <Button
              theme={SECONDARY}
              onPress={handleGoogleSignIn}
              icon={<GoogleIcon width={GOOGLE_ICON.width} height={GOOGLE_ICON.height} />}
              title={t('googleSignIn')}
              disabled={pendingSignIn}
            />

            <View style={styles.noAccountWrapper}>
              <View style={styles.noAccountContainer}>
                <Text style={styles.neutralLight}>{t('noAccount')} </Text>
                <Button
                  theme={SECONDARY}
                  style={styles.createButton}
                  titleStyle={styles.createTitleStyle}
                  onPress={handleNavigateToSignUp}
                  title={t('create')}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default SignIn;

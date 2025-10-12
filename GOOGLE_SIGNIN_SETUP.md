# 🔐 Настройка Google Sign-In

## Что было исправлено

### 1. ✅ Исправлена передача параметров
**Было:** При клике на кнопку Google Sign-In передавались локальные значения `email` и `password` из формы  
**Стало:** Передаются пустые значения, так как они не используются для Google авторизации

**Файл:** `src/screens/Auth/SignIn/index.tsx`
```typescript
// Было
const handleGoogleSignIn = () => _signIn({ email, password, isGoogleAccount: true });

// Стало
const handleGoogleSignIn = () => _signIn({ email: '', password: '', isGoogleAccount: true });
```

### 2. ✅ Улучшена конфигурация GoogleSignin
**Файл:** `App.tsx`
- Добавлены `scopes: ['email', 'profile']`
- Улучшена обработка ошибок инициализации

### 3. ✅ Добавлена fallback конфигурация
**Файл:** `src/redux/actions/authActions.ts`
- Если GoogleSignin не был сконфигурирован в App.tsx, он конфигурируется автоматически при первом использовании

### 4. ✅ Улучшена обработка ошибок Google Sign-In
Добавлена детальная обработка специфичных ошибок:
- Отмена входа пользователем (коды `-5` и `12501`)
- Ошибки конфигурации (код `10` или `DEVELOPER_ERROR`)
- Проблемы с Google Play Services

### 5. ✅ Добавлены переводы ошибок
**Файлы:**
- `src/translations/locales/ru/errors.json`
- `src/translations/locales/en/errors.json`

Добавлены сообщения:
- `googleSignInConfigError` - ошибка конфигурации
- `googlePlayServicesError` - проблемы с Google Play Services

## 🔧 Настройка Google Cloud Console

### Шаг 1: Получение SHA-1 и SHA-256

#### Для production сборки (EAS):
```bash
eas credentials -p android
# Выберите: Production → Keystore → Show
# Скопируйте SHA-1 и SHA-256
```

#### Для локальной разработки (debug):
```bash
# Windows
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android

# macOS/Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Шаг 2: Добавление в Google Cloud Console

1. Откройте [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите ваш проект
3. Перейдите в **APIs & Services → Credentials**
4. Найдите или создайте **OAuth 2.0 Client ID** для Android
5. Заполните:
   - **Package name:** `com.meshok.bookdesk`
   - **SHA-1:** (вставьте полученный SHA-1)
   - **SHA-256:** (вставьте полученный SHA-256)

### Шаг 3: Проверка webClientId

Убедитесь, что в коде используется правильный **Web Client ID** из Google Cloud Console:

**Файл:** `App.tsx`
```typescript
webClientId: '798541911751-2bfmd87u0b4tlua24hs8k57r5pmag36e.apps.googleusercontent.com'
```

Если у вас другой проект, замените этот ID на ваш.

## 🐛 Диагностика проблем

### Ошибка: "DEVELOPER_ERROR" или код 10

**Причина:** Неправильная конфигурация в Google Cloud Console

**Решение:**
1. Проверьте, что SHA-1/SHA-256 добавлены в Google Console
2. Убедитесь, что package name совпадает: `com.meshok.bookdesk`
3. Проверьте webClientId
4. Подождите 5-10 минут после изменений в Google Console

### Ошибка: "Google Play Services is not available"

**Причина:** Устройство не имеет Google Play Services или они устарели

**Решение:**
1. Обновите Google Play Services на устройстве
2. Убедитесь, что тестируете на реальном устройстве (не эмуляторе без Google Play)

### Ошибка: Пользователь отменил вход (коды -5 или 12501)

**Причина:** Пользователь закрыл окно авторизации Google

**Решение:** Это нормальное поведение, не требует исправления

## 📱 Тестирование

### В Expo Go
Google Sign-In **НЕ РАБОТАЕТ** в Expo Go - это нормально!

### В production build
```bash
# Создать тестовую сборку
npm run build:android:preview

# Или production сборку
npm run build:android:production
```

После установки APK/AAB на устройство, Google Sign-In должен работать корректно.

## 🔍 Логи и отладка

При возникновении ошибок проверьте логи:

```bash
# Android
npx react-native log-android

# iOS
npx react-native log-ios
```

Ищите сообщения:
- `Google Sign In initialized` - успешная инициализация
- `Google Sign-In error:` - детали ошибки
- `DEVELOPER_ERROR` - проблема с конфигурацией

## 📚 Дополнительные ресурсы

- [Google Sign-In для Android - Официальная документация](https://developers.google.com/identity/sign-in/android/start)
- [React Native Google Sign-In - GitHub](https://github.com/react-native-google-signin/google-signin)
- [EAS Build - Expo Documentation](https://docs.expo.dev/build/introduction/)

## ✅ Чеклист проверки

- [ ] SHA-1 и SHA-256 добавлены в Google Cloud Console
- [ ] Package name в Google Console: `com.meshok.bookdesk`
- [ ] webClientId правильный в коде
- [ ] Тестирование на production build (не в Expo Go)
- [ ] Google Play Services обновлены на устройстве
- [ ] Подождали 5-10 минут после изменений в Google Console


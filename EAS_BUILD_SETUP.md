# EAS Build Setup для BookDesk

## Что было настроено

### 1. Условная загрузка нативных модулей
- ✅ Google Sign In настроен с динамическим импортом
- ✅ Yandex Mobile Ads настроен с динамическим импортом
- ✅ Нативные модули загружаются только в production build
- ✅ Приложение совместимо с Expo Go (без prebuild локально)
- ✅ Используется `Constants.appOwnership` для определения окружения

### 2. EAS Build с удаленным Prebuild
- ✅ Создан файл `eas.json` с профилями сборки (development, preview, production)
- ✅ Добавлен `prebuildCommand` в каждый профиль для удаленного prebuild
- ✅ Создан `.easignore` для исключения локальных ios/android папок
- ✅ Добавлены npm скрипты для удобной сборки в `package.json`
- ✅ Проект настроен на pure managed workflow

### 3. Плагины в app.json
- ✅ Добавлен плагин `@react-native-google-signin/google-signin` для автоматической конфигурации

## Как работает Pure Managed Workflow

### Локальная разработка (Expo Go)
1. Запускаете `npm start`
2. Сканируете QR-код в Expo Go приложении
3. Нативные модули **не загружаются** (определяется через `Constants.appOwnership === 'expo'`)
4. Приложение работает без ошибок, показывая в консоли: "Running in Expo Go - native modules disabled"
5. **НЕТ папок `/ios` и `/android`** - работаете в чистом JavaScript окружении

### Удаленная сборка (EAS Build)
1. Запускаете `eas build`
2. Код загружается на сервер Expo (без папок ios/android благодаря `.easignore`)
3. На сервере выполняется **expo prebuild --clean**:
   - Генерируются нативные папки ios и android
   - Применяются все плагины из `app.json`
   - `@react-native-google-signin/google-signin` настраивается автоматически
   - `yandex-mobile-ads` настраивается автоматически
4. Выполняется нативная сборка с поддержкой всех SDK
5. Нативные модули **загружаются** (определяется через `Constants.appOwnership !== 'expo'`)
6. Получаете готовый APK/IPA с работающими Google Sign In и рекламой

### Преимущества такого подхода
- ✅ Быстрая разработка в Expo Go без prebuild
- ✅ Не нужно коммитить нативные папки
- ✅ Нативные SDK работают в production без изменений
- ✅ Один кодовая база для всех окружений
- ✅ Легко переключаться между Expo Go и production build

## Использование EAS Build

### Предварительные требования

1. Установите EAS CLI глобально:
```bash
npm install -g eas-cli
```

2. Войдите в аккаунт Expo:
```bash
eas login
```

3. Настройте проект (выполните один раз):
```bash
eas build:configure
```

### Команды для сборки

#### Android

**Preview сборка** (APK для тестирования):
```bash
npm run build:android:preview
# или
eas build --platform android --profile preview
```

**Production сборка**:
```bash
npm run build:android:production
# или
eas build --platform android --profile production
```

#### iOS

**Preview сборка**:
```bash
npm run build:ios:preview
# или
eas build --platform ios --profile preview
```

**Production сборка**:
```bash
npm run build:ios:production
# или
eas build --platform ios --profile production
```

### Development билд

Для разработки с dev client:
```bash
eas build --platform android --profile development
eas build --platform ios --profile development
```

## Профили сборки в eas.json

### development
- Включает Development Client для быстрой разработки
- Internal distribution
- Android: APK сборка
- iOS: Debug конфигурация

### preview
- Для внутреннего тестирования
- Internal distribution
- Android: APK сборка

### production
- Для публикации в сторы
- Android: APK (можно изменить на AAB для Google Play)

## Важные заметки

### Условная загрузка нативных модулей
Код в `App.tsx` использует умную систему загрузки:
```typescript
const initializeNativeModules = async () => {
  const isExpoGo = Constants.appOwnership === 'expo';
  
  if (!isExpoGo) {
    // Динамический импорт только в production build
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    // ... инициализация
  }
};
```

**Как это работает:**
- **Expo Go**: `Constants.appOwnership === 'expo'` → модули не загружаются
- **Production build**: `Constants.appOwnership === 'standalone'` → модули загружаются
- Используется динамический `import()` вместо статического, что предотвращает ошибки в Expo Go

### Google Sign In
- Убедитесь, что webClientId правильно настроен в `App.tsx` (строки 18-22)
- Для iOS потребуется дополнительная настройка в Google Cloud Console
- Для Android добавьте SHA-1/SHA-256 сертификатов в Google Cloud Console
- В Expo Go увидите: "Running in Expo Go - native modules disabled"
- В production build увидите: "Google Sign In initialized"

### Yandex Mobile Ads
- Убедитесь, что у вас есть Yandex Ads App ID
- Может потребоваться добавить `googleMobileAdsAppId` в `app.json` для Android
- В Expo Go увидите: "Running in Expo Go - native modules disabled"
- В production build увидите: "Yandex Mobile Ads initialized"

### Локальная разработка

#### Рекомендуемый способ (Expo Go)
```bash
npm start
# Сканируйте QR в Expo Go
```
- Мгновенный hot reload
- Не требует prebuild
- Нативные SDK недоступны (но это OK для UI/логики)

#### Альтернативный способ (с нативными модулями)
Используйте только если нужно отладить Google Sign In или рекламу локально:

1. Выполните prebuild локально:
```bash
npx expo prebuild --clean
```

2. Запустите приложение:
```bash
npm run android
# или
npm run ios
```

3. **Важно после тестирования**:
```bash
# Удалите локальные нативные папки
rm -rf ios android
# Они не должны коммититься в git
```

4. **Примечание**: Папки ios/android создаются локально, но:
   - Они в `.gitignore` (не коммитятся)
   - Они в `.easignore` (не загружаются на EAS)
   - При следующем `npm start` вернетесь к Expo Go workflow

## Следующие шаги

1. Настройте креденшалы для подписи приложений:
```bash
eas credentials
```

2. Настройте Google Sign In в Google Cloud Console:
   - Добавьте SHA-1/SHA-256 ваших сертификатов
   - Настройте OAuth 2.0 Client IDs

3. Выполните первую сборку:
```bash
npm run build:android:preview
```

4. После успешной сборки загрузите APK и протестируйте Google Sign In и рекламу

## Полезные ссылки

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)
- [Google Sign In Setup](https://github.com/react-native-google-signin/google-signin)
- [Yandex Mobile Ads](https://yandex.com/dev/mobile-ads/)


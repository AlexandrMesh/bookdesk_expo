# Changelog - EAS Build Configuration

## [2025-10-10] - Pure Managed Workflow с Expo Go

### ✅ Добавлено

#### Условная загрузка нативных модулей (новое!)
- Настроена динамическая загрузка Google Sign In через `import()` в `App.tsx`
- Настроена динамическая загрузка Yandex Mobile Ads через `import()` в `App.tsx`
- Добавлена проверка окружения через `Constants.appOwnership`
- Нативные модули загружаются только в production build, не в Expo Go
- Приложение теперь полностью совместимо с Expo Go для локальной разработки

#### EAS Build с удаленным Prebuild
- Создан `eas.json` с тремя профилями сборки:
  - `development` - для dev client с `prebuildCommand`
  - `preview` - APK для тестирования с `prebuildCommand`
  - `production` - AAB для Google Play с `prebuildCommand`
- Создан `.easignore` для исключения локальных папок ios/android
- Добавлены npm скрипты для удобной сборки:
  - `build:android:preview`
  - `build:android:production`
  - `build:ios:preview`
  - `build:ios:production`
- Добавлен `eas-cli@^15.0.0` в devDependencies
- Добавлен плагин `@react-native-google-signin/google-signin` в `app.json`
- Настроена автоматическая подпись через EAS credentials

#### Документация
- `EAS_BUILD_SETUP.md` - подробная документация по EAS Build
- `QUICK_START.md` - быстрое руководство по началу работы
- `README_EXPO_GO.md` - краткая сводка настройки
- `ANDROID_SIGNING.md` - полная документация по подписи Android приложений
- `SIGNING_CHEATSHEET.md` - шпаргалка с командами управления ключами
- `CHANGELOG.md` - этот файл

### 🔧 Техническая информация

#### Pure Managed Workflow
Проект настроен на **pure managed workflow**:
- Папки `/ios` и `/android` находятся в `.gitignore` (не коммитятся)
- Папки `/ios` и `/android` находятся в `.easignore` (не загружаются на EAS)
- При EAS Build **удаленно** выполняется `expo prebuild --clean`
- Все нативные SDK (Google Sign In, Yandex Mobile Ads) конфигурируются автоматически
- Локально работаете с Expo Go без prebuild
- Production build создается на серверах Expo с полной нативной поддержкой

#### Условная загрузка модулей
```typescript
// App.tsx
const initializeNativeModules = async () => {
  const isExpoGo = Constants.appOwnership === 'expo';
  
  if (!isExpoGo) {
    // Динамический импорт только в production
    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
    GoogleSignin.configure({...});
  }
};
```

**Окружения:**
- `Constants.appOwnership === 'expo'` → Expo Go (модули не загружаются)
- `Constants.appOwnership === 'standalone'` → Production build (модули загружаются)

#### Плагины в app.json
```json
"plugins": [
  "./plugins/remove-adid-permission",
  ["expo-splash-screen", {...}],
  "@react-native-google-signin/google-signin"  // Новый
]
```

### 📝 Примечания

#### Локальная разработка
- Используйте `npm start` для Expo Go разработки
- Нативные модули НЕ работают в Expo Go - это нормально!
- В консоли увидите: "Running in Expo Go - native modules disabled"
- Быстрый hot reload, отличная developer experience

#### Production Build
- Используйте `npm run build:android:preview` для EAS Build
- Prebuild происходит ТОЛЬКО на удаленном сервере Expo
- Нативные модули работают полностью
- В консоли увидите: "Google Sign In initialized", "Yandex Mobile Ads initialized"

#### Конфигурация
- webClientId для Google Sign In: `798541911751-2bfmd87u0b4tlua24hs8k57r5pmag36e.apps.googleusercontent.com`
- Автоматическое управление keystore через EAS (рекомендуется)
- Получить SHA: `eas credentials -p android`
- Не забудьте добавить SHA-1/SHA-256 сертификатов в Google Cloud Console
- Предупреждения линтера о нативных модулях - это нормально для managed workflow

### 🚀 Как использовать

#### Локальная разработка
```bash
npm start
# Сканируйте QR-код в Expo Go
```

#### Production build
```bash
# Установка зависимостей
npm install

# Логин в Expo (первый раз)
eas login

# Первая сборка
npm run build:android:preview
```

См. `QUICK_START.md` для подробной инструкции.

### 📦 Файлы

#### Новые файлы
- `eas.json` - конфигурация EAS Build с prebuildCommand и AAB для production
- `.easignore` - исключает ios/android из загрузки на EAS
- `EAS_BUILD_SETUP.md` - подробная документация
- `QUICK_START.md` - быстрое руководство
- `README_EXPO_GO.md` - краткая сводка
- `ANDROID_SIGNING.md` - подробная документация по подписи приложений
- `SIGNING_CHEATSHEET.md` - шпаргалка с командами для управления ключами
- `CHANGELOG.md` - этот файл

#### Измененные файлы
- `App.tsx` - условная загрузка нативных модулей
- `app.json` - добавлен плагин Google Sign In
- `package.json` - добавлены скрипты для EAS Build и eas-cli
- `.gitignore` - добавлены *.keystore, credentials.json, service-account-key.json


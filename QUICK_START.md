# 🚀 Быстрый старт с EAS Build

## ✅ Что уже готово

1. **Google Sign In и Yandex Mobile Ads** настроены с условной загрузкой
2. **EAS Build** сконфигурирован с удаленным prebuild
3. **Expo Go** поддержка для локальной разработки
4. **Нативные SDK** работают только в production build, не мешают Expo Go

## 🎯 Два режима работы

### 1. Локальная разработка (Expo Go)
```bash
npm start
# Сканируйте QR-код в Expo Go приложении
```
**Важно:** Google Sign In и Yandex Ads НЕ будут работать в Expo Go, но приложение будет запускаться без ошибок.

### 2. Production build (EAS Build)
```bash
npm run build:android:preview
# Или любая другая команда билда
```
**Важно:** Prebuild выполняется ТОЛЬКО на удаленных серверах Expo. Нативные SDK работают полностью.

## 📦 Установка зависимостей

Если вы еще не установили зависимости после изменений:

```bash
npm install
```

## 🔧 Настройка EAS Build (первый раз)

### 1. Установите EAS CLI
```bash
npm install -g eas-cli
# или используйте уже добавленную локальную версию:
npx eas-cli
```

### 2. Войдите в Expo аккаунт
```bash
eas login
```

### 3. Настройте проект
```bash
eas build:configure
```

## 🏗️ Первая сборка

### Android APK для тестирования
```bash
npm run build:android:preview
```

### iOS для тестирования
```bash
npm run build:ios:preview
```

## ⚠️ Важно: Работа с нативными модулями

### В Expo Go
- Google Sign In и Yandex Mobile Ads **не загружаются**
- Приложение работает без ошибок
- В консоли увидите: "Running in Expo Go - native modules disabled"

### В Production Build
- Все нативные модули **активируются автоматически**
- В консоли увидите: "Google Sign In initialized", "Yandex Mobile Ads initialized"

### Предупреждения линтера
Предупреждения о нативных модулях - это нормально и ожидаемо для managed workflow.

## 🔑 Настройка Google Sign In

Перед использованием Google Sign In убедитесь:

1. **webClientId** в `App.tsx` правильный (сейчас: `798541911751-2bfmd87u0b4tlua24hs8k57r5pmag36e.apps.googleusercontent.com`)

2. В Google Cloud Console добавьте:
   - **Android**: SHA-1 и SHA-256 вашего сертификата
   - **iOS**: Bundle ID вашего приложения

### Как получить SHA-1/SHA-256:

#### Из EAS (после первой сборки):
```bash
eas credentials -p android
# → Production → Keystore → Show
# Копируйте SHA-1 и SHA-256
```

#### Для локальной разработки (debug):
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

📚 **Подробнее**: См. [ANDROID_SIGNING.md](./ANDROID_SIGNING.md) и [SIGNING_CHEATSHEET.md](./SIGNING_CHEATSHEET.md)

## 🧪 Локальная разработка

### Стандартная разработка (Рекомендуется)
```bash
# Запустить Expo Go
npm start
```
- Быстрый цикл разработки
- Hot reload работает мгновенно
- Нативные SDK недоступны (но это нормально для разработки UI/логики)

### Разработка с нативными модулями (Не рекомендуется для каждодневной работы)
```bash
# Сгенерировать нативные папки локально
npx expo prebuild

# Запустить на Android
npm run android

# Запустить на iOS  
npm run ios
```

**Важно**: 
- Папки `ios` и `android` создаются локально, но НЕ коммитятся (они в .gitignore)
- После prebuild локально, удалите папки перед коммитом
- Используйте этот способ только для отладки нативных модулей

## 📱 Профили сборки

- **development** - dev client для разработки
- **preview** - APK для внутреннего тестирования
- **production** - для публикации в сторы

## 🔐 Подпись приложения (Keystore)

### Автоматическое управление (Рекомендуется) ✅

EAS автоматически создаст и сохранит keystore при первой production сборке:

```bash
npm run build:android:production
# При вопросе "Generate a new Android Keystore?" → Yes
```

**Преимущества:**
- ✅ Автоматическое создание и хранение
- ✅ Безопасное хранение в облаке Expo
- ✅ Легко получить SHA для Google Sign In
- ✅ Можно скачать для backup

**Управление keystore:**
```bash
# Посмотреть информацию и SHA
eas credentials -p android

# Скачать keystore (backup)
eas credentials -p android
# → Production → Keystore → Download
```

📚 **Подробнее о подписи**: 
- [ANDROID_SIGNING.md](./ANDROID_SIGNING.md) - подробная документация
- [SIGNING_CHEATSHEET.md](./SIGNING_CHEATSHEET.md) - шпаргалка с командами

## 🆘 Проблемы?

### Ошибка "Google Sign In not configured"
- Проверьте webClientId в `App.tsx`
- Получите SHA: `eas credentials -p android`
- Добавьте SHA сертификатов в Google Cloud Console

### Ошибка "Yandex Ads initialization failed"
- Убедитесь, что у вас есть Yandex Ads account
- Проверьте настройки приложения в Yandex Mobile Ads

### Prebuild выполняется локально (а не должен)
- Убедитесь, что папки `/ios` и `/android` НЕ закоммичены в git
- Удалите локальные папки: `rm -rf ios android`
- Они созданы через `.easignore` и будут игнорироваться EAS Build
- Prebuild должен происходить ТОЛЬКО на удаленном сервере

### Нативные модули не работают в Expo Go
- Это нормально! Expo Go не поддерживает кастомные нативные модули
- Используйте EAS Build для тестирования нативных функций
- Или используйте `npx expo prebuild` + `npm run android` для локального тестирования

## 📚 Подробная документация

См. `EAS_BUILD_SETUP.md` для детальной информации.

## 🎯 Следующие шаги

1. Выполните первую сборку
2. Загрузите APK и протестируйте
3. Настройте Google Sign In credentials
4. Настройте Yandex Mobile Ads
5. Подготовьте production сборку для сторов


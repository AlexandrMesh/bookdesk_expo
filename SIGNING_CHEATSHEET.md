# 🔐 Шпаргалка - Подпись Android приложения

## ⚡ Быстрый старт (Рекомендуется)

### Первая production сборка с автоматическим keystore
```bash
# 1. Логин
eas login

# 2. Сборка
npm run build:android:production

# 3. При вопросе "Generate a new Android Keystore?" → Yes
```

**EAS создаст и сохранит keystore автоматически!** ✅

---

## 📋 Основные команды

### Управление credentials
```bash
# Посмотреть все credentials
eas credentials

# Только для Android
eas credentials -p android

# Только для iOS
eas credentials -p ios
```

### Работа с keystore

#### Посмотреть информацию (SHA-1, SHA-256)
```bash
eas credentials -p android
# → Production → Keystore → Show
```

#### Скачать keystore (backup!)
```bash
eas credentials -p android
# → Production → Keystore → Download
```

#### Загрузить свой keystore
```bash
eas credentials -p android
# → Production → Keystore → Upload
```

#### Удалить keystore (осторожно!)
```bash
eas credentials -p android
# → Production → Keystore → Remove
```

---

## 🔑 Получить SHA для Google Sign In

### Вариант 1: Из EAS (просто!)
```bash
eas credentials -p android
# → Production → Keystore → Show
# Копируйте SHA-1 и SHA-256
```

### Вариант 2: Из локального keystore
```bash
keytool -list -v -keystore release.keystore -alias release-key
```

### Вариант 3: Из debug.keystore (для разработки)
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

---

## 🏗️ Профили сборки

### Preview (APK для тестирования)
```bash
npm run build:android:preview
# Создаст APK, можно установить напрямую
```

### Production (AAB для Google Play)
```bash
npm run build:android:production
# Создаст AAB для публикации в Google Play
```

---

## 📦 Типы сборок

### APK vs AAB

**APK** (Android Package)
- ✅ Можно установить напрямую
- ✅ Хорош для тестирования
- ❌ Google Play больше не принимает APK для новых приложений
```json
"android": {
  "buildType": "apk"
}
```

**AAB** (Android App Bundle)
- ✅ Требуется для Google Play
- ✅ Меньший размер загрузки
- ✅ Оптимизация под устройства
- ❌ Нельзя установить напрямую
```json
"android": {
  "buildType": "app-bundle"
}
```

---

## 🚀 Полный цикл публикации

### 1. Создать production build
```bash
npm run build:android:production
```

### 2. Получить SHA сертификата
```bash
eas credentials -p android
# Скопировать SHA-1 и SHA-256
```

### 3. Добавить SHA в Google Cloud Console
1. Открыть [Google Cloud Console](https://console.cloud.google.com/)
2. Выбрать проект
3. APIs & Services → Credentials
4. OAuth 2.0 Client ID (Android)
5. Добавить SHA-1 и SHA-256

### 4. Скачать AAB
```bash
# После завершения сборки ссылка будет в консоли
# Или скачать через:
eas build:list
```

### 5. Опубликовать в Google Play
```bash
# Автоматическая публикация (нужен service-account-key.json)
eas submit --platform android --profile production

# Или вручную через Google Play Console
```

---

## 🔧 Настройка service account для автопубликации

### 1. Создать service account в Google Cloud
1. [Google Cloud Console](https://console.cloud.google.com/)
2. IAM & Admin → Service Accounts
3. Create Service Account
4. Добавить роль "Service Account User"
5. Create Key → JSON → Download

### 2. Сохранить как service-account-key.json
```bash
# Поместить в корень проекта
cp ~/Downloads/your-project-xxxxx.json ./service-account-key.json
```

### 3. Дать права в Google Play Console
1. [Google Play Console](https://play.google.com/console/)
2. Users and permissions
3. Invite new users
4. Добавить email service account
5. Дать права "Release manager"

### 4. Использовать для публикации
```bash
eas submit --platform android --profile production
```

---

## ⚠️ Безопасность

### НИКОГДА не коммитьте:
```gitignore
*.keystore
*.jks
*.p12
*.pem
credentials.json
service-account-key.json
```

### Backup keystore (ОБЯЗАТЕЛЬНО!)
```bash
# Скачать из EAS
eas credentials -p android
# → Production → Keystore → Download

# Сохранить в безопасное место (не git!)
# Без keystore не сможете обновлять приложение!
```

---

## 🐛 Решение проблем

### "Keystore not found"
```bash
# Создать новый
eas credentials -p android
# → Production → Keystore → Generate

# Или загрузить существующий
eas credentials -p android
# → Production → Keystore → Upload
```

### "SHA mismatch" в Google Sign In
```bash
# 1. Получить SHA из EAS
eas credentials -p android

# 2. Обновить в Google Cloud Console
# 3. Пересобрать приложение
npm run build:android:production
```

### "Credentials expired"
```bash
# Обновить credentials
eas credentials -p android
# → Обновить нужный credential
```

---

## 📊 Сравнение методов подписи

| Метод | Команда | Когда использовать |
|-------|---------|-------------------|
| **Автоматический** | `eas build` | Новое приложение (рекомендуется) |
| **Локальный keystore** | `credentialsSource: "local"` | Есть существующий keystore |
| **Секреты EAS** | `eas secret:create` | CI/CD автоматизация |

---

## 🎯 Для вашего проекта BookDesk

### Текущая конфигурация (в eas.json)
```json
{
  "preview": {
    "android": {
      "buildType": "apk"  // ← Для тестирования
    }
  },
  "production": {
    "android": {
      "buildType": "app-bundle"  // ← Для Google Play
    }
  }
}
```

### Рекомендуемый workflow

1. **Разработка**: Expo Go (`npm start`)
2. **Тестирование**: Preview APK (`npm run build:android:preview`)
3. **Публикация**: Production AAB (`npm run build:android:production`)

---

## 📚 Полезные ссылки

- [ANDROID_SIGNING.md](./ANDROID_SIGNING.md) - подробная документация
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Android App Signing](https://docs.expo.dev/app-signing/android-credentials/)
- [Google Play Console](https://play.google.com/console/)

